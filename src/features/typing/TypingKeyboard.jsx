/* TypingKeyboard - the realistic on-screen US QWERTY keyboard (React version).
   It never takes input itself: the typing area reports real key presses. */
import { memo, useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { HOME_CODES, FINGER_OF, KEYS, MODIFIERS } from '../../lib/keyboardLayout.js';

const Key = memo(function Key({ k, isNext, isDown, isPressed, capsOn }) {
  const f = FINGER_OF[k.code];
  const cls = [
    'key', 'key--' + k.group, MODIFIERS[k.code] ? 'key--mod' : '',
    HOME_CODES.includes(k.code) ? 'is-home' : '', k.label.length > 1 ? 'key--long' : '',
    k.shift && !/^Key/.test(k.code) ? 'has-shift' : '', k.code === 'KeyF' || k.code === 'KeyJ' ? 'has-bump' : '',
    isNext ? 'is-next' : '', isDown ? 'is-down' : '', isPressed ? 'is-pressed' : '', capsOn ? 'is-lock-on' : '',
  ].filter(Boolean).join(' ');
  return (
    <div
      className={cls}
      data-code={k.code}
      data-group={k.group}
      data-finger={f || undefined}
      style={{ gridRow: k.row + (k.rspan > 1 ? ' / span ' + k.rspan : ''), gridColumn: k.col + ' / span ' + k.span }}
    >
      <span className="cap">
        {k.shift ? <span className="k-shift">{k.shift}</span> : null}
        <span className="k-main">{/^Key[A-Z]$/.test(k.code) ? k.label.toUpperCase() : k.label}</span>
      </span>
    </div>
  );
});

/** Tracks which physical keys are down / flashing, and whether Caps Lock is on. */
export function useKeyboardState() {
  const [, force] = useReducer((n) => n + 1, 0);
  const st = useRef({ down: new Set(), pressed: new Set(), caps: false });
  const timers = useRef({});

  useEffect(() => () => Object.values(timers.current).forEach(clearTimeout), []);

  const setCaps = (e) => {
    if (e.getModifierState) { try { st.current.caps = e.getModifierState('CapsLock'); } catch (err) { /* ignore */ } }
  };

  const keyDown = useCallback((e) => {
    const s = st.current;
    s.down.add(e.code);
    s.pressed.add(e.code);
    clearTimeout(timers.current[e.code]);
    timers.current[e.code] = setTimeout(() => { s.pressed.delete(e.code); force(); }, 120);
    setCaps(e);
    force();
  }, []);

  const keyUp = useCallback((e) => {
    st.current.down.delete(e.code);
    setCaps(e);
    force();
  }, []);

  const releaseAll = useCallback(() => {
    st.current.down.clear();
    st.current.pressed.clear();
    force();
  }, []);

  return { state: st.current, keyDown, keyUp, releaseAll };
}

function useCompact() {
  const [compact, setCompact] = useState(() => window.matchMedia ? window.matchMedia('(max-width: 760px)').matches : false);
  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const q = window.matchMedia('(max-width: 760px)');
    const on = () => setCompact(q.matches);
    q.addEventListener('change', on);
    return () => q.removeEventListener('change', on);
  }, []);
  return compact;
}

export default function TypingKeyboard({ nextCodes, fingers, kbState }) {
  const compact = useCompact();
  const { down, pressed, caps } = kbState;
  const shift = down.has('ShiftLeft') || down.has('ShiftRight');
  const cls = 'kb' + (fingers ? ' kb--fingers' : '') + (compact ? ' kb--compact' : '') + (shift ? ' kb--shift' : '');
  return (
    <div className="keyboard" id="keyboard">
      <div className={cls} aria-hidden="true">
        {KEYS.map((k) => (
          <Key key={k.code} k={k} isNext={nextCodes.includes(k.code)} isDown={down.has(k.code)} isPressed={pressed.has(k.code)} capsOn={k.code === 'CapsLock' && caps} />
        ))}
      </div>
    </div>
  );
}
