/* TypingArea - the text the learner types, the focus / paused overlays and the
   hidden <textarea> that receives the keystrokes. The text is ALWAYS English and
   left-to-right, even when the interface is Dari or Pashto. */
import { memo, useEffect, useImperativeHandle, useRef } from 'react';
import { useTranslation } from '../../i18n/index.jsx';

const Ch = memo(function Ch({ ch, status, active }) {
  const shown = status === 'wrong-space' ? '_' : ch;
  const cls = 'c ' + (status === 'correct' ? 'c-correct' : status === 'pending' ? 'c-pending' : 'c-wrong') + (active ? ' c-active' : '');
  return <span className={cls}>{shown}</span>;
});

const TypingArea = function TypingArea({ run, overlayTitle, overlayHint, onInput, onKeyDown, onKeyUp, onFocus, onBlur, onPasteBlocked, onWindowBlur, handleRef }) {
  const { t } = useTranslation();
  const input = useRef(null);
  const box = useRef(null);
  const wrap = useRef(null);

  useImperativeHandle(handleRef, () => ({
    focus() { try { input.current.focus({ preventScroll: true }); } catch (e) { input.current && input.current.focus(); } },
    blur() { input.current && input.current.blur(); },
    isFocused: () => document.activeElement === input.current,
    clear() { if (input.current) input.current.value = ''; },
  }));

  /* After a restart the textarea must be empty again. */
  useEffect(() => { if (input.current && run.typed === '' && input.current.value !== '') input.current.value = ''; }, [run.typed]);

  /* Keep the caret line visible inside the 3-line window (never scroll the page). */
  useEffect(() => {
    const el = box.current;
    if (!el || el.scrollHeight <= el.clientHeight + 1) return;
    const active = el.querySelector('.c-active');
    if (!active) return;
    const b = el.getBoundingClientRect();
    const c = active.getBoundingClientRect();
    if (c.bottom > b.bottom - 4) el.scrollTop += c.bottom - (b.bottom - 4);
    else if (c.top < b.top + 4) el.scrollTop -= b.top + 4 - c.top;
  }, [run.typed, run.target]);

  useEffect(() => {
    if (!onWindowBlur) return undefined;
    window.addEventListener('blur', onWindowBlur);
    return () => window.removeEventListener('blur', onWindowBlur);
  }, [onWindowBlur]);

  /* Shake the box on a wrong key (restarts the animation each time). */
  useEffect(() => {
    if (!run.shake || !wrap.current) return undefined;
    const el = wrap.current;
    el.classList.remove('is-shaking');
    void el.offsetWidth;
    el.classList.add('is-shaking');
    const id = setTimeout(() => el.classList.remove('is-shaking'), 280);
    return () => clearTimeout(id);
  }, [run.shake]);

  const text = run.target;
  const typed = run.typed;
  const cells = [];
  for (let i = 0; i < text.length; i++) {
    let status = 'pending';
    if (i < typed.length) status = typed[i] === text[i] ? 'correct' : (typed[i] === ' ' ? 'wrong-space' : 'wrong');
    const wrongChar = i < typed.length && typed[i] !== text[i] && typed[i] !== ' ' ? typed[i] : text[i];
    cells.push(<Ch key={i} ch={status === 'wrong' ? wrongChar : text[i]} status={status} active={i === typed.length && !run.finished} />);
  }
  const caretActive = typed.length >= text.length && !run.finished;

  const showFocus = !run.focused && !run.started && !run.finished;
  const showPaused = run.paused;

  return (
    <div
      ref={wrap}
      dir="ltr"
      className={'relative cursor-text rounded-xl border-2 bg-bg2 px-[18px] py-4 transition-[border-color,box-shadow] ' +
        (run.focused ? 'border-primary-text shadow-[0_0_0_4px_var(--primary-soft)] ' : 'border-line ') + (run.idle ? 'is-idle' : '')}
      onMouseDown={(e) => { e.preventDefault(); handleRef.current.focus(); }}
      onTouchStart={() => handleRef.current.focus()}
      data-testid="typing-wrap"
    >
      <div ref={box} className="typing-text" aria-hidden="true" id="typingText">
        {cells}
        <span className={'c' + (caretActive ? ' c-active' : '')} />
      </div>
      {showFocus && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center rounded-[inherit] bg-bg2/80 text-center backdrop-blur-[2px]" dir="auto">
          <p className="m-0 text-base font-bold">{overlayTitle}</p>
          <small className="text-dim">{overlayHint}</small>
        </div>
      )}
      {showPaused && (
        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-[inherit] bg-bg2/90 text-center backdrop-blur-[2px]" dir="auto" data-testid="paused-overlay">
          <p className="m-0 text-base font-bold">{t('learn.overlay.paused')}</p>
          <small className="text-dim">{t('learn.overlay.pausedHint')}</small>
        </div>
      )}
      <textarea
        ref={input}
        id="typingInput"
        className="absolute inset-0 size-full resize-none border-0 p-0 opacity-0"
        aria-label={t('learn.typingArea')}
        autoComplete="off" autoCapitalize="off" autoCorrect="off" spellCheck={false} rows={1} dir="ltr"
        onInput={(e) => {
          const v = onInput(e.currentTarget.value);
          if (typeof v === 'string' && e.currentTarget.value !== v) e.currentTarget.value = v;
          const n = e.currentTarget.value.length;
          try { e.currentTarget.setSelectionRange(n, n); } catch (err) { /* not supported */ }
        }}
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
        onFocus={onFocus}
        onBlur={onBlur}
        onSelect={(e) => { const n = e.currentTarget.value.length; try { e.currentTarget.setSelectionRange(n, n); } catch (err) { /* ignore */ } }}
        onClick={(e) => { const n = e.currentTarget.value.length; try { e.currentTarget.setSelectionRange(n, n); } catch (err) { /* ignore */ } }}
        onPaste={(e) => { e.preventDefault(); if (onPasteBlocked) onPasteBlocked(); }}
        onDrop={(e) => e.preventDefault()}
      />
    </div>
  );
};

export default TypingArea;
