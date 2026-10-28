/* =============================================================================
 * progress.js - curriculum index, scoring, history and achievements
 * -----------------------------------------------------------------------------
 * Pure logic on top of the storage module. Every function that returns text
 * returns TRANSLATION KEYS plus variables (never English sentences) so the
 * interface can show them in English, Dari or Pashto - even if the language is
 * changed while a result is on screen.
 * ========================================================================== */
import { LEVELS } from '../../data/lessons.js';
import { HANDBOOK } from '../../data/handbook.js';
import * as core from '../../lib/core.js';
import { DIFFICULTY, HISTORY_MAX, MISTAKES_MAX } from '../../lib/storage.js';

export { LEVELS, HANDBOOK };

/* ---- curriculum index ------------------------------------------------------ */
export const FLAT = [];
LEVELS.forEach((level, li) => level.lessons.forEach((lesson, i) => FLAT.push({ level, lesson, li, i, index: FLAT.length })));
export const TOTAL = FLAT.length;
export const LEVEL_COUNT = LEVELS.length;
export const BOOK_PAGE_TOTAL = HANDBOOK.parts.reduce((n, p) => n + p.pages.length, 0);

/* ---- progress queries ------------------------------------------------------- */
/** Only lesson ids that exist in the current curriculum count, so stale ids
 *  from an older data file can never unlock the handbook early. */
export function lessonsDone(state) {
  let n = 0;
  for (let k = 0; k < FLAT.length; k++) if (state.progress.done[FLAT[k].lesson.id]) n++;
  return n;
}
export const bookUnlocked = (state) => TOTAL > 0 && lessonsDone(state) >= TOTAL;
export const partReadCount = (state, part) => part.pages.filter((p) => state.progress.bookRead[p.id]).length;
export const booksReadCount = (state) => Object.keys(state.progress.bookRead).length;
export const masteryAcc = (state) => DIFFICULTY[state.settings.difficulty] || 90;
export function firstUnfinishedLesson(state) {
  return FLAT.find((f) => !state.progress.done[f.lesson.id]) || FLAT[0];
}

/* ---- scoring ------------------------------------------------------------------ */
function bestLine(prev, wpm, set, keys) {
  if (!prev || wpm > prev.wpm) {
    set();
    return prev ? { key: keys.newBest, vars: { wpm, prev: prev.wpm } } : { key: keys.first, vars: { wpm } };
  }
  return { key: keys.stays, vars: { wpm: prev.wpm } };
}

/** Lesson typed all the way through: personal best, then completion. */
export function scoreLesson(S, lesson, wpm, acc) {
  const notes = [];
  let completed = false;
  S.update((d) => {
    const prev = d.progress.best[lesson.id];
    notes.push(bestLine(prev, wpm, () => { d.progress.best[lesson.id] = { wpm, acc, at: Date.now() }; },
      { first: 'notes.lesson.first', newBest: 'notes.lesson.newBest', stays: 'notes.lesson.stays' }));
    const need = DIFFICULTY[d.settings.difficulty] || 90;
    if (acc >= need && !d.progress.done[lesson.id]) {
      d.progress.done[lesson.id] = true;
      completed = true;
      notes.push({ key: 'notes.lesson.complete', vars: { acc } });
    } else if (acc < need) {
      notes.push({ key: 'notes.lesson.reach', vars: { acc: need } });
    }
    notes.push(wpm < 30 ? { key: 'notes.pace.low' } : wpm < 55 ? { key: 'notes.pace.mid', vars: { wpm: wpm + 8 } } : { key: 'notes.pace.high' });
  });
  return { notes, completed, tip: { type: 'lesson', lesson } };
}

/** Handbook page typed all the way through. */
export function scoreBookPage(S, part, page, wpm, acc) {
  const notes = [];
  S.update((d) => {
    const prev = d.progress.bookBest[page.id];
    notes.push(bestLine(prev, wpm, () => { d.progress.bookBest[page.id] = { wpm, acc, at: Date.now() }; },
      { first: 'notes.book.first', newBest: 'notes.book.newBest', stays: 'notes.book.stays' }));
    if (!d.progress.bookRead[page.id]) { d.progress.bookRead[page.id] = true; notes.push({ key: 'notes.book.marked' }); }
    const read = part.pages.filter((p) => d.progress.bookRead[p.id]).length;
    notes.push(read === part.pages.length
      ? { key: 'notes.book.partDone', vars: { total: part.pages.length }, part }
      : { key: 'notes.book.partProgress', vars: { read, total: part.pages.length } });
  });
  return { notes, tip: { type: 'page', part, page } };
}

/** Practice and game runs keep their own bests. */
export function scoreSession(S, session, wpm, acc, reason, typedLength) {
  const notes = [];
  if (typedLength < 5) return { notes: [{ key: 'notes.session.tooShort' }] };
  S.update((d) => {
    const prev = d.progress.best[session.id];
    notes.push(bestLine(prev, wpm, () => { d.progress.best[session.id] = { wpm, acc, at: Date.now() }; },
      { first: 'notes.session.first', newBest: 'notes.session.newBest', stays: 'notes.session.stays' }));
  });
  if (reason === 'limit') notes.push({ key: 'notes.session.limit' });
  if (reason === 'early') notes.push({ key: 'notes.session.early' });
  notes.push(acc < 90 ? { key: 'notes.session.slow' } : { key: 'notes.session.great' });
  return { notes };
}

/** History, totals, mistakes. Tiny runs are not saved (except game plays). */
export function recordRun(S, d) {
  const trivial = d.chars < 5 || d.seconds < 2;
  if (trivial) return false;
  S.update((st) => {
    st.history.push({ at: Date.now(), kind: d.kind, id: String(d.id).slice(0, 60), label: String(d.label).slice(0, 80), wpm: d.wpm, raw: d.raw, acc: d.acc, seconds: d.seconds, chars: d.chars });
    if (st.history.length > HISTORY_MAX) st.history.splice(0, st.history.length - HISTORY_MAX);
    st.totals.seconds += d.seconds; st.totals.chars += d.chars; st.totals.sessions += 1;
    const day = core.dateKey();
    const rec = st.days[day] || { seconds: 0, sessions: 0 };
    rec.seconds += d.seconds; rec.sessions += 1;
    st.days[day] = rec;
    Object.keys(d.mistakeCounts).forEach((c) => { st.mistakes[c] = (st.mistakes[c] || 0) + d.mistakeCounts[c]; });
    const keys = Object.keys(st.mistakes);
    if (keys.length > MISTAKES_MAX) keys.sort((a, b) => st.mistakes[a] - st.mistakes[b]).slice(0, keys.length - MISTAKES_MAX).forEach((k) => { delete st.mistakes[k]; });
  });
  return true;
}

/* ---- games -------------------------------------------------------------------- */
export function gameScore(gameId, d) {
  const completed = d.reason === 'complete';
  if (gameId === 'sprint') return Math.round(d.wpm * d.acc / 10);
  if (gameId === 'accuracy') return completed && d.mistakes <= 3 ? Math.round(d.acc * 10 + d.wpm) : 0;
  if (gameId === 'code' || gameId === 'daily') return completed ? Math.round(d.wpm * d.acc / 10) : 0;
  return 0;
}

export function recordGame(S, session, d) {
  const score = gameScore(session.gameId, d);
  let isBest = false;
  S.update((st) => {
    const g = st.games[session.gameId] || { plays: 0, bestScore: 0, bestWpm: 0, bestAcc: 0 };
    g.plays += 1;
    if (score > g.bestScore) { g.bestScore = score; isBest = score > 0; }
    if (d.wpm > g.bestWpm) g.bestWpm = d.wpm;
    if (d.acc > g.bestAcc) g.bestAcc = d.acc;
    st.games[session.gameId] = g;
    if (session.gameId === 'daily' && d.reason === 'complete') {
      const prev = st.daily[session.dayKey];
      if (!prev || d.wpm > prev.wpm) st.daily[session.dayKey] = { wpm: d.wpm, acc: d.acc };
    }
  });
  return { score, isBest };
}

/* ---- achievements ------------------------------------------------------------- */
const bestCleanWpm = (st) => st.history.reduce((m, h) => (h.acc >= 90 && h.wpm > m ? h.wpm : m), 0);
export const ACHIEVEMENTS = [
  { id: 'first-lesson', icon: '1', test: (st) => lessonsDone(st) >= 1 },
  { id: 'five-lessons', icon: '5', test: (st) => lessonsDone(st) >= 5 },
  { id: 'all-lessons', icon: '30', test: (st) => lessonsDone(st) >= TOTAL },
  { id: 'handbook', icon: 'H', test: (st) => booksReadCount(st) >= 1 },
  { id: 'wpm-30', icon: '30', test: (st) => bestCleanWpm(st) >= 30 },
  { id: 'wpm-50', icon: '50', test: (st) => bestCleanWpm(st) >= 50 },
  { id: 'clean-run', icon: '%', test: (st) => st.history.some((h) => h.acc >= 100 && h.chars >= 50) },
  { id: 'ten-sessions', icon: '10', test: (st) => st.totals.sessions >= 10 },
  { id: 'hour', icon: 'h', test: (st) => st.totals.seconds >= 3600 },
  { id: 'first-game', icon: 'G', test: (st) => Object.keys(st.games).length >= 1 },
  { id: 'daily', icon: 'D', test: (st) => Object.keys(st.daily).length >= 1 },
  { id: 'first-quiz', icon: 'Q', test: (st) => st.quizzes.history.length >= 1 },
  { id: 'perfect-quiz', icon: 'Q+', test: (st) => st.quizzes.history.some((h) => h.score === 100) },
];

/** Unlock anything newly earned. Returns the list of newly unlocked ids. */
export function evaluateAchievements(S) {
  const fresh = [];
  const st = S.state;
  const pending = ACHIEVEMENTS.filter((a) => !st.achievements[a.id] && a.test(st));
  if (!pending.length) return fresh;
  S.update((d) => { pending.forEach((a) => { d.achievements[a.id] = Date.now(); fresh.push(a.id); }); });
  return fresh;
}
