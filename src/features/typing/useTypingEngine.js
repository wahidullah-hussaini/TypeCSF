/* =============================================================================
 * useTypingEngine - the typing engine as a React hook
 * -----------------------------------------------------------------------------
 * All fast-changing numbers live in ONE mutable record (a ref) and the component
 * re-renders after each change. That keeps typing smooth (no state churn) and
 * the maths identical to the original TypeCSF engine:
 *
 *   - the clock starts on the first character actually inserted
 *   - pause time never counts
 *   - accuracy counts every inserted keystroke; a corrected mistake stays wrong
 *   - net WPM = correct characters / 5 / minutes, raw WPM = typed / 5 / minutes
 *   - timed runs extend the text so it never runs out
 *
 * The hook owns no DOM. The hidden <textarea> in TypingArea calls input().
 * ========================================================================== */
import { useCallback, useEffect, useReducer, useRef } from 'react';
import * as core from '../../lib/core.js';

export function durationOf(mode) {
  const n = parseInt(mode, 10);
  return Number.isFinite(n) && n > 0 ? n : Infinity;
}

function blankRun(text, mode, base, maxMistakes) {
  return {
    target: text, base: base || text, mode: mode || 'lesson', maxMistakes: typeof maxMistakes === 'number' ? maxMistakes : null,
    typed: '', started: false, finished: false, paused: false, focused: false, idle: true,
    pausedTotal: 0, startTime: 0, endTime: 0, pauseStart: 0,
    inserted: 0, wrongInserted: 0, samples: [], lastSampleSecond: -1, lastErrCount: 0, mistakeCounts: {},
    result: null, shake: 0, breakAcc: 0,
  };
}

export function useTypingEngine({ onFinish, onInsert, onBreak, breakMinutes }) {
  const run = useRef(blankRun('', 'lesson'));
  const [, force] = useReducer((n) => n + 1, 0);
  const timer = useRef(0);
  const idleTimer = useRef(0);
  const cb = useRef({});
  cb.current = { onFinish, onInsert, onBreak, breakMinutes };

  const timed = () => Number.isFinite(durationOf(run.current.mode));

  const elapsed = useCallback(() => {
    const r = run.current;
    if (!r.started) return 0;
    const end = r.finished ? r.endTime : (r.paused ? r.pauseStart : performance.now());
    return Math.max(0, (end - r.startTime - r.pausedTotal) / 1000);
  }, []);

  const stats = useCallback(() => {
    const r = run.current;
    const n = r.typed.length;
    let correct = 0;
    for (let i = 0; i < n; i++) if (r.typed[i] === r.target[i]) correct++;
    const seconds = elapsed();
    const usable = seconds > core.MIN_SECONDS;
    const minutes = seconds / 60;
    const raw = usable ? n / 5 / minutes : 0;
    const wpm = usable ? correct / 5 / minutes : 0;
    const acc = r.inserted ? ((r.inserted - r.wrongInserted) / r.inserted) * 100 : 100;
    return { typed: n, correct, raw, wpm, acc: core.clamp(acc, 0, 100), seconds };
  }, [elapsed]);

  const consistency = () => {
    const values = run.current.samples.map((s) => s.raw).filter((v) => v > 0);
    return core.consistency(values);
  };

  const stopTicker = useCallback(() => {
    if (timer.current) { window.clearInterval(timer.current); timer.current = 0; }
  }, []);

  const finish = useCallback((reason) => {
    const r = run.current;
    if (r.finished) return;
    r.finished = true;
    if (r.paused) { r.endTime = r.pauseStart; r.paused = false; } else r.endTime = performance.now();
    stopTicker();
    window.clearTimeout(idleTimer.current);
    const s = stats();
    r.result = {
      reason, stats: s, wpm: Math.round(s.wpm), acc: Math.round(s.acc), raw: Math.round(s.raw),
      consistency: consistency(), errors: r.wrongInserted, seconds: s.seconds, typed: s.typed,
      samples: r.samples.slice(), mistakeCounts: { ...r.mistakeCounts },
    };
    force();
    if (cb.current.onFinish) cb.current.onFinish(r.result);
  }, [stats, stopTicker]);

  const tick = useCallback(() => {
    const r = run.current;
    if (!r.started || r.finished || r.paused) return;
    const seconds = elapsed();
    const mins = cb.current.breakMinutes;
    if (mins) {
      r.breakAcc += 0.1;
      if (r.breakAcc >= mins * 60) { r.breakAcc = 0; if (cb.current.onBreak) cb.current.onBreak(mins); }
    }
    const limit = durationOf(r.mode);
    if (Number.isFinite(limit) && seconds >= limit) { finish('time'); return; }
    const whole = Math.floor(seconds);
    if (whole > r.lastSampleSecond && whole > 0) {
      const s = stats();
      const errDelta = r.wrongInserted - r.lastErrCount;
      r.lastErrCount = r.wrongInserted;
      r.samples.push({ t: whole, raw: s.raw, wpm: s.wpm, err: errDelta });
      r.lastSampleSecond = whole;
    }
    force();
  }, [elapsed, finish, stats]);

  const startTicker = useCallback(() => {
    if (!timer.current) timer.current = window.setInterval(tick, 100);
  }, [tick]);

  /** Load a new passage and forget the previous run. */
  const reset = useCallback((text, mode, opts) => {
    stopTicker();
    window.clearTimeout(idleTimer.current);
    const prev = run.current;
    run.current = blankRun(text, mode, (opts && opts.base) || text, opts && opts.maxMistakes);
    run.current.focused = prev.focused; // a focused textarea stays focused after a restart
    force();
  }, [stopTicker]);

  const pause = useCallback(() => {
    const r = run.current;
    if (!r.started || r.finished || r.paused) return;
    r.paused = true;
    r.pauseStart = performance.now();
    stopTicker();
    force();
  }, [stopTicker]);

  const resume = useCallback(() => {
    const r = run.current;
    if (!r.paused) return;
    r.pausedTotal += performance.now() - r.pauseStart;
    r.paused = false;
    startTicker();
    force();
  }, [startTicker]);

  /** Focus changes: losing focus pauses a running run; regaining it resumes. */
  const setFocused = useCallback((focused) => {
    const r = run.current;
    const was = r.focused;
    r.focused = focused;
    if (!focused) pause(); else resume(); // both are no-ops when not applicable
    if (was !== focused) force();
  }, [pause, resume]);

  /**
   * Handle the textarea content. Returns the (possibly corrected) text the
   * textarea must show. The text is append-only from the learner's side.
   */
  const input = useCallback((raw) => {
    const r = run.current;
    if (r.finished) return r.typed;
    let value = String(raw).replace(/[\r\n\t]/g, '');
    if (value.length > r.target.length) value = value.slice(0, r.target.length);
    const before = r.typed.length;
    const after = value.length;

    let anyWrong = false;
    if (after > before) {
      for (let i = before; i < after; i++) {
        r.inserted++;
        const wrong = value[i] !== r.target[i];
        if (wrong) {
          r.wrongInserted++;
          anyWrong = true;
          const missed = r.target[i];
          if (missed) r.mistakeCounts[missed] = (r.mistakeCounts[missed] || 0) + 1;
        }
        if (cb.current.onInsert) cb.current.onInsert(wrong);
      }
    }
    r.typed = value;
    if (anyWrong) r.shake++;

    r.idle = false;
    window.clearTimeout(idleTimer.current);
    idleTimer.current = window.setTimeout(() => { run.current.idle = true; force(); }, 2500);

    if (!r.started && after > before) {
      r.started = true;
      r.startTime = performance.now();
      r.pausedTotal = 0;
      startTicker();
    }
    /* Timed runs: keep the text longer than the learner can type. */
    if (Number.isFinite(durationOf(r.mode)) && r.typed.length >= r.target.length && r.target.length <= 6000) {
      r.target += ' ' + r.base;
    }
    force();
    if (typeof r.maxMistakes === 'number' && r.wrongInserted > r.maxMistakes) { finish('limit'); return r.typed; }
    if (!Number.isFinite(durationOf(r.mode)) && r.typed.length >= r.target.length) finish('complete');
    return r.typed;
  }, [finish, startTicker]);

  const finishNow = useCallback(() => {
    const r = run.current;
    if (r.started && !r.finished) finish('early');
  }, [finish]);

  useEffect(() => () => { stopTicker(); window.clearTimeout(idleTimer.current); }, [stopTicker]);

  return { run: run.current, reset, input, pause, resume, setFocused, finishNow, stats, elapsed, timed };
}
