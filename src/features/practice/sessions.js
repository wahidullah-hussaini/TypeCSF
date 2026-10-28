/* Builders for practice and game sessions. A session is plain data: ids and
   translation keys (labelT/descT) so it can be shown in any language, and an
   English `text` because the typed text is never translated. */
import * as core from '../../lib/core.js';
import { CS_WORDS, SENTENCES, CODE, SYMBOLS, buildPractice, dailyChallenge } from '../../lib/content.js';
import { HANDBOOK } from '../progress/progress.js';

export const TIMED_LENGTHS = [30, 60, 120];
export const LETTERS = 'abcdefghijklmnopqrstuvwxyz'.split('');

const textOf = (mode, o) => buildPractice(mode, { book: HANDBOOK, ...o }).text;

export function practiceSession(mode, o = {}) {
  const letter = o.letter && /^[a-z]$/.test(o.letter) ? o.letter : 'e';
  const seconds = TIMED_LENGTHS.includes(o.seconds) ? o.seconds : 60;
  const make = () => textOf(mode, { letter, custom: o.custom });
  const base = { kind: 'practice', badge: 'practice', make, text: make(), mode: 'lesson' };
  if (mode === 'letters') return { ...base, id: 'practice-letters-' + letter, label: 'Letter drill: ' + letter, labelT: { key: 'practice.letterDrill', vars: { l: letter } }, descT: { key: 'practice.modes.letters.desc' } };
  if (mode === 'timed') return { ...base, id: 'practice-timed-' + seconds, label: 'Timed test (' + seconds + ' s)', labelT: { key: 'practice.timedLabel', vars: { n: seconds } }, descT: { key: 'practice.modes.timed.desc' }, mode: String(seconds), badge: 'practice' };
  if (mode === 'custom') return { ...base, id: 'practice-custom', label: 'Custom text', labelT: { key: 'practice.modes.custom.name' }, descT: { key: 'practice.customRun' }, make: undefined };
  return { ...base, id: 'practice-' + mode, label: mode, labelT: { key: 'practice.modes.' + mode + '.name' }, descT: { key: 'practice.modes.' + mode + '.desc' } };
}

/** Words that contain the keys the learner missed most often. Returns null if nothing is recorded. */
export function weakKeyKeys(mistakes, max = 5) {
  return Object.keys(mistakes || {})
    .filter((c) => c.length === 1 && c.trim())
    .sort((a, b) => mistakes[b] - mistakes[a]).slice(0, max);
}

export function weakSession(mistakes) {
  const keys = weakKeyKeys(mistakes);
  if (!keys.length) return null;
  const has = (s) => keys.some((k) => s.toLowerCase().includes(k.toLowerCase()));
  const pool = CS_WORDS.filter(has).concat(CODE.filter(has), SYMBOLS.filter(has), SENTENCES.filter(has));
  if (!pool.length) return null;
  const make = () => {
    const picked = core.shuffle(pool).slice(0, 28).join(' ');
    return core.sanitizeTypingText(picked, 600).text;
  };
  return {
    kind: 'practice', badge: 'practice', id: 'practice-weak', label: 'Tricky keys', labelT: { key: 'practice.weak' },
    descT: { key: 'practice.weakText', vars: { keys: keys.join(' ') } }, make, text: make(), mode: 'lesson', keys,
  };
}

export function gameSession(gameId) {
  const base = { kind: 'game', gameId, id: 'game-' + gameId, labelT: { key: 'games.' + gameId + '.name' }, descT: { key: 'games.' + gameId + '.run' } };
  if (gameId === 'sprint') { const make = () => textOf('timed'); return { ...base, label: 'Typing Sprint', make, text: make(), mode: '60', badge: 'sprint' }; }
  if (gameId === 'accuracy') { const make = () => core.sanitizeTypingText(core.pick(SENTENCES, 1).join(' '), 400).text; return { ...base, label: 'Accuracy Challenge', make, text: make(), mode: 'lesson', maxMistakes: 3, badge: 'precision' }; }
  if (gameId === 'code') { const make = () => textOf('code'); return { ...base, label: 'Code Typing Challenge', make, text: make(), mode: 'lesson', badge: 'code' }; }
  const day = dailyChallenge();
  return { ...base, id: 'game-daily', label: 'Daily Practice Challenge', labelT: { key: 'games.daily.name' }, descT: { key: 'games.daily.run', vars: { day: day.key } }, text: day.text, dayKey: day.key, mode: 'lesson', badge: 'daily' };
}
