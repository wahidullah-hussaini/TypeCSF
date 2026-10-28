/* Learn - the typing workspace: lessons, handbook, practice runs and games all use it.
   It stays mounted (hidden) while other pages are open, so a run, a lesson or the
   typed text is never lost by changing page or language. */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { formatTime } from '../lib/core.js';
import { sound } from '../lib/sound.js';
import { charInfo } from '../lib/keyboardLayout.js';
import { useCurriculum, useTranslation } from '../i18n/index.jsx';
import { useStore } from '../context/StoreContext.jsx';
import { useActivity } from '../context/ActivityContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Button, Card } from '../components/ui.jsx';
import { CheckIcon, ChevronLeftIcon, ChevronRightIcon, CloseIcon, LockIcon, MenuIcon } from '../components/icons.jsx';
import LessonSidebar from '../features/typing/LessonSidebar.jsx';
import ReferenceCard from '../features/typing/ReferenceCard.jsx';
import ResultsCard from '../features/typing/ResultsCard.jsx';
import TypingArea from '../features/typing/TypingArea.jsx';
import TypingKeyboard, { useKeyboardState } from '../features/typing/TypingKeyboard.jsx';
import { durationOf, useTypingEngine } from '../features/typing/useTypingEngine.js';
import { processFinish } from '../features/typing/finishRun.js';
import { FLAT, HANDBOOK, LEVELS, LEVEL_COUNT, TOTAL, firstUnfinishedLesson, lessonsDone } from '../features/progress/progress.js';

const BLOCKED_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown']);
const MODES = [['lesson', 'learn.toolbar.lesson'], ['30', 'learn.toolbar.s30'], ['60', 'learn.toolbar.s60'], ['endurance', 'learn.toolbar.endurance']];
const DIFF_KEY = { Easy: 'easy', Medium: 'medium', Hard: 'hard' };
const DIFF_COLOR = { easy: 'text-ok', medium: 'text-warn', hard: 'text-wrong' };

export default function Learn({ active }) {
  const { t, tt, n, formatDuration } = useTranslation();
  const cur = useCurriculum();
  const { S, state, settings } = useStore();
  const toast = useToast();
  const { activity, example, rev, selectLesson, selectBookPage, startSession, loadExample, restart, consumeFocus } = useActivity();
  const [modeSel, setModeSel] = useState('lesson');
  const [info, setInfo] = useState(null);
  const [drawer, setDrawer] = useState(false);
  const kb = useKeyboardState();
  const area = useRef(null);
  const resultsRef = useRef(null);
  const pauseIntent = useRef('');
  const focusAfterReset = useRef(false);
  const latest = useRef({});
  latest.current = { activity, example };

  const locked = activity.kind === 'locked';
  const session = activity.session || null;
  const lesson = activity.kind === 'lesson' ? LEVELS[activity.li].lessons[activity.i] : null;
  const part = activity.kind === 'book' || locked ? HANDBOOK.parts[activity.ci] : null;
  const page = activity.kind === 'book' ? part.pages[activity.pi] : null;
  const effMode = session ? (session.mode || 'lesson') : modeSel;

  const baseText = example != null ? example : session ? session.text : page ? page.text : lesson ? lesson.drill : '';
  const target = effMode === 'endurance' ? baseText + ' ' + baseText + ' ' + baseText : baseText;

  const engine = useTypingEngine({
    breakMinutes: settings.breakReminder,
    onBreak: (mins) => toast(t('results.breakReminder', { n: mins }), 'warn'),
    onInsert: (wrong) => sound.play(wrong ? 'error' : 'key'),
    onFinish: (res) => {
      const { activity: a, example: ex } = latest.current;
      const out = processFinish(S, a, ex != null, res);
      setInfo(out.info);
      sound.play('done');
      out.toasts.forEach((x) => {
        if (x.key === 'results.lessonToast') toast(t(x.key, { title: cur.lesson(LEVELS[a.li].lessons[a.i]).title }), 'ok');
        else toast(t(x.key, x.vars), x.kind);
      });
      out.achievements.forEach((id, i) => setTimeout(() => toast(t('results.achievement', { name: t('achievements.' + id + '.name') }), 'ok'), i * 400));
      if (out.achievements.length) setTimeout(() => sound.play('achievement'), 200);
    },
  });
  const run = engine.run;

  /* New passage: whenever the activity, example, restart counter or mode changes. */
  useEffect(() => {
    if (locked) return;
    engine.reset(target, effMode, { base: baseText, maxMistakes: session && typeof session.maxMistakes === 'number' ? session.maxMistakes : null });
    setInfo(null);
    if (area.current) area.current.clear();
    const wantFocus = consumeFocus() || focusAfterReset.current;
    focusAfterReset.current = false;
    if (wantFocus) setTimeout(() => area.current && area.current.focus(), 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activity, example, rev, effMode, locked]);

  /* Leaving the page pauses a running run. */
  useEffect(() => { if (!active) engine.pause(); }, [active, engine]);

  /* Results card into view. */
  useEffect(() => {
    if (info && resultsRef.current && resultsRef.current.scrollIntoView) resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [info]);

  /* Pause when the browser tab is hidden; resume when it returns with focus. */
  useEffect(() => {
    const onVis = () => {
      if (document.hidden) engine.pause();
      else if (area.current && area.current.isFocused()) engine.resume();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [engine]);

  /* Tab anywhere (outside controls) restarts the run, like inside the typing area. */
  useEffect(() => {
    if (!active) return undefined;
    const onKey = (e) => {
      if (e.key !== 'Tab' || locked) return;
      const el = document.activeElement;
      if (el && el.id === 'typingInput') return;
      const target2 = e.target;
      if (target2 && target2.closest && target2.closest('input, textarea, button, a, select, summary, [contenteditable]')) return;
      e.preventDefault();
      focusAfterReset.current = true;
      restart();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [active, locked, restart]);

  /* Document title follows what is on screen. */
  const titleText = useMemo(() => {
    if (session) return tt(session.labelT);
    if (page) return cur.part(part).title + ' — ' + cur.handbook().name;
    if (locked) return cur.part(part).title + ' — ' + cur.handbook().name;
    return lesson ? cur.lesson(lesson).title : '';
  }, [session, page, part, lesson, locked, cur, tt]);
  useEffect(() => { if (active) document.title = titleText + ' — TypeCSF'; }, [active, titleText]);

  const focusArea = useCallback(() => area.current && area.current.focus(), []);

  const onKeyDown = (e) => {
    kb.keyDown(e);
    if (e.key === 'Tab') { e.preventDefault(); focusAfterReset.current = true; restart(); return; }
    if (e.key === 'Escape') { e.preventDefault(); area.current.blur(); return; }
    if (e.key === 'Enter') { e.preventDefault(); return; }
    const ctrl = e.ctrlKey || e.metaKey;
    if (BLOCKED_KEYS.has(e.key) || (ctrl && /^[azyxv]$/i.test(e.key))) e.preventDefault();
  };

  const nextAction = () => {
    focusAfterReset.current = true;
    if (session) { startSession({ ...session, text: session.make ? session.make() : session.text }); return; }
    if (activity.kind === 'book') {
      const p = HANDBOOK.parts[activity.ci];
      if (activity.pi + 1 < p.pages.length) selectBookPage(activity.ci, activity.pi + 1);
      else if (activity.ci + 1 < HANDBOOK.parts.length) selectBookPage(activity.ci + 1, 0);
      else toast(t('results.lastPageToast'), 'ok');
      return;
    }
    const pos = FLAT.findIndex((f) => f.li === activity.li && f.i === activity.i);
    if (pos !== -1 && pos + 1 < FLAT.length) selectLesson(FLAT[pos + 1].li, FLAT[pos + 1].i);
  };

  const s = engine.stats();
  const timed = Number.isFinite(durationOf(run.mode));
  const secondsLeft = Math.max(0, durationOf(run.mode) - s.seconds);
  const clock = (sec) => formatTime(sec);
  const timeText = timed ? n(Math.ceil(secondsLeft) >= 0 ? formatTime(Math.ceil(secondsLeft)) : '0:00') : n(clock(s.seconds));
  const progressPct = timed ? (s.seconds / durationOf(run.mode)) * 100 : (run.target.length ? (run.typed.length / run.target.length) * 100 : 0);
  const best = session ? state.progress.best[session.id] : page ? state.progress.bookBest[page.id] : lesson ? state.progress.best[lesson.id] : null;

  /* Finger and next-key guidance */
  const nextChar = run.finished ? undefined : run.target[run.typed.length];
  const ci = nextChar == null ? null : charInfo(nextChar);
  const nextCodes = ci ? [ci.code, ci.shiftCode].filter(Boolean) : [];
  let hint = '';
  if (ci && settings.fingers) {
    if (ci.space) hint = t('learn.hint.space');
    else {
      hint = t('learn.hint.finger', { finger: t('fingers.' + ci.finger) });
      if (ci.shift) hint += ' ' + t('learn.hint.shift', { side: t(ci.shiftCode === 'ShiftRight' ? 'hand.right' : 'hand.left') });
    }
  }

  /* Header content */
  let pill, badge = null, badgeColor = 'text-dim', title, tagline, doneFlag = null;
  if (session) {
    pill = t(session.kind === 'game' ? 'difficulty.game' : 'difficulty.practice');
    badge = t('difficulty.' + (session.badge || (session.kind === 'game' ? 'challenge' : 'practice'))); badgeColor = 'text-warn';
    title = tt(session.labelT); tagline = session.descT ? tt(session.descT) : '';
  } else if (page) {
    const hb = cur.handbook(); const pt = cur.part(part);
    pill = t('learn.levelPill', { n: LEVEL_COUNT + 1, name: hb.name }); badge = t('difficulty.book'); badgeColor = 'text-wrong';
    title = pt.title; tagline = t('learn.partTagline', { n: activity.pi + 1, total: part.pages.length, subtitle: pt.subtitle });
    if (state.progress.bookRead[page.id]) doneFlag = t('learn.pageRead');
  } else if (locked) {
    const hb = cur.handbook(); const pt = cur.part(part);
    pill = t('learn.levelPill', { n: LEVEL_COUNT + 1, name: hb.name }); badge = t('difficulty.book'); badgeColor = 'text-wrong';
    title = pt.title; tagline = t('learn.lockedTagline', { n: activity.ci + 1, total: HANDBOOK.parts.length, subtitle: pt.subtitle });
  } else {
    const level = LEVELS[activity.li]; const lv = cur.level(level); const l = cur.lesson(lesson);
    const dk = DIFF_KEY[level.difficulty] || 'easy';
    pill = t('learn.levelPill', { n: activity.li + 1, name: lv.name }); badge = t('difficulty.' + dk); badgeColor = DIFF_COLOR[dk];
    title = l.title; tagline = l.tagline;
    if (state.progress.done[lesson.id]) doneFlag = t('learn.completed');
  }

  const overlay = example != null ? ['learn.overlay.exampleStart', 'learn.overlay.exampleHint'] : page ? ['learn.overlay.bookStart', 'learn.overlay.bookHint'] : ['learn.overlay.start', 'learn.overlay.hint'];
  const done = lessonsDone(state);
  const modeIsTimed = (m) => Number.isFinite(durationOf(m));
  const canPause = run.started && !run.finished;

  return (
    <div hidden={!active} className="lg:grid lg:grid-cols-[19rem_minmax(0,1fr)]" data-view="learn">
      {drawer && <div className="fixed inset-0 z-40 bg-black/55 lg:hidden" onClick={() => setDrawer(false)} aria-hidden="true" />}
      <aside
        id="sidebar" aria-label={t('learn.lessonsLabel')}
        className={'z-50 border-line bg-bg2 transition-transform max-lg:fixed max-lg:inset-y-0 max-lg:start-0 max-lg:w-[88vw] max-lg:max-w-sm max-lg:border-e lg:sticky lg:top-[var(--topbar-h)] lg:h-[calc(100vh-var(--topbar-h))] lg:border-e ' +
          (drawer ? '' : 'max-lg:invisible ltr:max-lg:-translate-x-full rtl:max-lg:translate-x-full')}
      >
        <div className="flex items-center justify-between border-b border-line px-3 py-2 lg:hidden">
          <b>{t('learn.lessonsLabel')}</b>
          <button type="button" aria-label={t('nav.closeLessons')} onClick={() => setDrawer(false)} className="rounded-lg p-1.5 hover:bg-surface2"><CloseIcon /></button>
        </div>
        <div className="h-[calc(100%-3rem)] lg:h-full"><LessonSidebar onPick={() => setDrawer(false)} /></div>
      </aside>

      <main id="main-learn" tabIndex={-1} className="flex min-w-0 flex-col gap-4 px-3 pb-24 pt-5 outline-none sm:px-6 lg:px-8">
        <header>
          <button type="button" aria-expanded={drawer} aria-controls="sidebar" onClick={() => setDrawer(true)} className="mb-3 inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-sm font-semibold lg:hidden">
            <MenuIcon className="size-4" /> {t('nav.openLessons')}
          </button>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-primary-soft px-3 py-0.5 text-xs font-bold text-primary-text">{pill}</span>
            {badge && <span className={'rounded-full border border-line bg-surface2 px-3 py-0.5 text-xs font-bold ' + badgeColor}>{badge}</span>}
            {doneFlag && <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-3 py-0.5 text-xs font-bold text-accent"><CheckIcon className="size-3.5" />{doneFlag}</span>}
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl" id="lessonTitle">{title}</h1>
          <p className="mt-1 text-dim" id="lessonTagline">{tagline}</p>
        </header>

        {locked && (
          <Card className="text-center" data-testid="locked-card">
            <div className="mx-auto mb-3 grid size-14 place-items-center rounded-2xl bg-primary-soft text-primary-text"><LockIcon className="size-7" /></div>
            <p className="mb-1 text-xs font-bold uppercase tracking-wider text-accent">{t('learn.locked.eyebrow', { n: LEVEL_COUNT + 1, name: cur.handbook().name })}</p>
            <h2 className="mb-2 text-xl font-bold">{t('learn.locked.title')}</h2>
            <p className="mx-auto max-w-xl text-dim">{t('learn.locked.text', { total: TOTAL, done, left: Math.max(0, TOTAL - done) })}</p>
            <div className="mx-auto my-4 h-2 max-w-md overflow-hidden rounded-full bg-surface2"><span className="block h-full rounded-full bg-gradient-to-r from-primary-text to-accent" style={{ width: Math.round((done / TOTAL) * 100) + '%' }} /></div>
            <Button variant="primary" id="lockedCta" onClick={() => {
              const f = firstUnfinishedLesson(state);
              focusAfterReset.current = true;
              selectLesson(f.li, f.i);
              toast(t('learn.locked.continueToast', { done, total: TOTAL }), 'warn');
            }}>{t('learn.locked.cta')}</Button>
          </Card>
        )}

        {!locked && (
          <Card id="typingCard" className="relative">
            {page && (
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-dashed border-line pb-3">
                <span className="text-sm font-bold">{t('learn.partOf', { n: activity.ci + 1, total: HANDBOOK.parts.length })} – {cur.part(part).title}</span>
                <span className="flex items-center gap-1.5">
                  <button type="button" id="prevPage" disabled={activity.pi === 0} aria-label={t('learn.prevPage')} onClick={() => { focusAfterReset.current = true; selectBookPage(activity.ci, activity.pi - 1); }} className="rounded-lg border border-line bg-surface2 p-1.5 disabled:opacity-40"><ChevronLeftIcon className="size-4 rtl:-scale-x-100" /></button>
                  <span className="flex gap-1.5" role="group" aria-label={t('learn.pagesOfPart')}>
                    {part.pages.map((p, idx) => (
                      <button key={p.id} type="button" aria-label={t('learn.goPage', { n: idx + 1 })} aria-current={idx === activity.pi ? 'true' : undefined} title={t('learn.goPage', { n: idx + 1 })}
                        onClick={() => selectBookPage(activity.ci, idx)}
                        className={'size-3 rounded-full border-2 ' + (state.progress.bookRead[p.id] ? 'border-ok bg-ok ' : 'border-line ') + (idx === activity.pi ? 'ring-4 ring-primary-soft border-primary-text' : '')} />
                    ))}
                  </span>
                  <button type="button" id="nextPage" disabled={activity.pi === part.pages.length - 1} aria-label={t('learn.nextPage')} onClick={() => { focusAfterReset.current = true; selectBookPage(activity.ci, activity.pi + 1); }} className="rounded-lg border border-line bg-surface2 p-1.5 disabled:opacity-40"><ChevronRightIcon className="size-4 rtl:-scale-x-100" /></button>
                  <span className="text-xs text-dim">{t('learn.pageOf', { n: activity.pi + 1, total: part.pages.length })}</span>
                </span>
              </div>
            )}

            <div className="mb-3 flex flex-wrap items-center justify-between gap-2.5">
              {!session ? (
                <div className="inline-flex rounded-xl border border-line bg-surface2 p-[3px]" role="group" aria-label={t('learn.toolbar.mode')} id="modeGroup">
                  {MODES.map(([m, key]) => (
                    <button key={m} type="button" data-mode={m} aria-pressed={modeSel === m}
                      onClick={() => { focusAfterReset.current = true; setModeSel(m); }}
                      className={'rounded-[9px] px-3.5 py-1.5 text-sm font-semibold ' + (modeSel === m ? 'bg-primary text-primary-ink' : 'text-dim hover:text-fg')}>{t(key)}</button>
                  ))}
                </div>
              ) : <span />}
              <div className="flex flex-wrap gap-1.5">
                <button type="button" id="pauseBtn" disabled={!canPause}
                  onPointerDown={() => { pauseIntent.current = run.paused ? 'resume' : 'pause'; }}
                  onKeyDown={() => { pauseIntent.current = run.paused ? 'resume' : 'pause'; }}
                  onClick={() => {
                    const intent = pauseIntent.current || (run.paused ? 'resume' : 'pause');
                    pauseIntent.current = '';
                    if (intent === 'resume') focusArea(); else engine.pause();
                  }}
                  className="rounded-xl border border-line bg-surface2 px-3 py-1.5 text-sm font-semibold disabled:opacity-50">{run.paused ? t('learn.toolbar.resume') : t('learn.toolbar.pause')}</button>
                <button type="button" id="finishBtn" disabled={!canPause} title={t('learn.toolbar.finishTitle')} onClick={() => engine.finishNow()} className="rounded-xl border border-line bg-surface2 px-3 py-1.5 text-sm font-semibold disabled:opacity-50">{t('learn.toolbar.finish')}</button>
                <button type="button" id="restartBtn" title={t('learn.toolbar.restartTitle')} onClick={() => { focusAfterReset.current = true; restart(); }} className="rounded-xl border border-line bg-surface2 px-3 py-1.5 text-sm font-semibold">{t('learn.toolbar.restart')}</button>
              </div>
            </div>

            <div className="mb-2.5 grid grid-cols-2 gap-2 sm:grid-cols-5" role="group" aria-label={t('learn.stat.label')}>
              {[
                ['statWpm', t('learn.stat.wpm'), n(Math.round(s.wpm)), ''],
                ['statAcc', t('learn.stat.accuracy'), n(Math.round(s.acc)) + '%', s.acc < 95 && run.typed.length ? 'text-warn' : ''],
                ['statTime', timed ? t('learn.stat.left') : t('learn.stat.time'), run.started || !timed ? timeText : n(formatTime(durationOf(run.mode))), ''],
                ['statErrors', t('learn.stat.mistakes'), n(run.wrongInserted), ''],
                ['statBest', t('learn.stat.best'), best ? n(best.wpm) + ' ' + t('units.wpm') : '—', ''],
              ].map(([id, label, value, extra]) => (
                <div key={id} className="flex flex-col rounded-xl bg-surface2 px-3 py-2">
                  <span className="text-[0.7rem] font-bold uppercase tracking-wider text-faint">{label}</span>
                  <span id={id} className={'text-xl font-bold tabular-nums ' + extra}><bdi dir="ltr">{value}</bdi></span>
                </div>
              ))}
            </div>
            <div className="mb-3.5 h-[5px] overflow-hidden rounded-full bg-surface2" role="presentation"><span className="block h-full bg-gradient-to-r from-primary-text to-accent transition-[width] duration-150" style={{ width: Math.min(100, Math.max(0, progressPct)) + '%' }} /></div>

            <TypingArea
              run={run} handleRef={area} overlayTitle={t(overlay[0])} overlayHint={t(overlay[1])}
              onInput={(v) => engine.input(v)} onKeyDown={onKeyDown} onKeyUp={kb.keyUp}
              onFocus={() => engine.setFocused(true)} onBlur={() => engine.setFocused(false)}
              onPasteBlocked={() => toast(t('learn.pasteBlocked'), 'warn')} onWindowBlur={kb.releaseAll}
            />
            {kb.state.caps && <div className="mt-2 rounded-lg bg-wrong-bg px-3 py-1.5 text-sm font-semibold text-wrong" role="status" id="capsWarning">{t('learn.caps')}</div>}
            <p className="mt-2 text-xs text-faint">{t('learn.englishNote')}</p>

            {settings.keyboard && (
              <>
                <div className="my-2.5 min-h-[1.6em] text-center text-sm text-dim" id="fingerHint" dir="auto">{hint}</div>
                <TypingKeyboard nextCodes={nextCodes} fingers={settings.fingers} kbState={kb.state} />
                <p className="mt-2.5 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-dim">
                  <span><i className="me-1.5 inline-block size-2.5 rounded-[3px] bg-accent align-middle" />{t('learn.legend.next')}</span>
                  <span><i className="me-1.5 inline-block size-2.5 rounded-[3px] border-2 border-faint align-middle" />{t('learn.legend.home')}</span>
                  <span>{t('learn.legend.press', { tab: 'Tab', esc: 'Esc' })}</span>
                  <span className="basis-full text-center text-faint">{t('learn.legend.note')}</span>
                </p>
              </>
            )}
          </Card>
        )}

        <ReferenceCard activity={activity} locked={locked} tt={tt} onExample={(text) => { focusAfterReset.current = true; loadExample(text); toast(t('learn.reference.exampleLoaded'), 'ok'); }} />

        {info && !locked && <ResultsCard ref={resultsRef} info={info} onRetry={() => { setInfo(null); focusAfterReset.current = true; restart(); }} onNext={nextAction} />}
        {info && <p className="sr-only" role="status">{t('results.live', { title: t(info.title), wpm: info.wpm, acc: info.acc })}</p>}
      </main>
    </div>
  );
}
