/* =============================================================================
 * core.js - pure helpers shared by the app and the unit tests
 * -----------------------------------------------------------------------------
 * Nothing in this file touches the DOM or localStorage, so it can run in the
 * browser (exposed as TypeCSF.core) and in Node (module.exports) for tests.
 *
 * FORMULAS (documented here, repeated in README.md):
 *
 *   Net WPM  = (correct characters / 5) / elapsed minutes
 *              "correct characters" = characters currently in the text that
 *              match the target. One "word" is 5 characters (standard).
 *   Raw WPM  = (all typed characters / 5) / elapsed minutes
 *   CPM      = correct characters / elapsed minutes
 *   Accuracy = (keystrokes - wrong keystrokes) / keystrokes * 100
 *              Every character that is inserted counts as one keystroke.
 *              A wrong keystroke stays counted even if you correct it with
 *              Backspace afterwards, so accuracy honestly reflects the first
 *              attempt. Fixing a mistake still helps your Net WPM and your
 *              finished text. Accuracy is always between 0 and 100.
 *   Consistency = 100 * (1 - standard deviation / mean) of the per-second raw
 *              WPM samples, limited to 0..100.
 * ========================================================================== */

/** Ignore the first fraction of a second so one character cannot read as
 *  thousands of words per minute. */
var MIN_SECONDS = 0.25;

function clamp(n, lo, hi) {
  return Math.min(hi, Math.max(lo, n));
}

function isNum(n) {
  return typeof n === 'number' && isFinite(n);
}

/* \u2500\u2500 Formatting \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */

/** 83.9 -> "1:23" (rounds down; used for elapsed time). */
function formatTime(seconds) {
  var s = Math.max(0, Math.floor(isNum(seconds) ? seconds : 0));
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}

/** 83.1 -> "1:24" (rounds up; used for countdowns). */
function formatClock(seconds) {
  var s = Math.max(0, Math.ceil(isNum(seconds) ? seconds : 0));
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}

/** 4500 -> "1 h 15 min"; 50 -> "50 sec"; 0 -> "0 min". */
function formatDuration(seconds) {
  var s = Math.max(0, Math.round(isNum(seconds) ? seconds : 0));
  if (s < 60) return s + ' sec';
  var h = Math.floor(s / 3600);
  var m = Math.floor((s % 3600) / 60);
  return h ? h + ' h ' + m + ' min' : m + ' min';
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

/* \u2500\u2500 Typing statistics \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */

function wpm(correctChars, seconds) {
  if (!isNum(seconds) || seconds <= MIN_SECONDS || !isNum(correctChars) || correctChars <= 0) return 0;
  return correctChars / 5 / (seconds / 60);
}

function cpm(correctChars, seconds) {
  if (!isNum(seconds) || seconds <= MIN_SECONDS || !isNum(correctChars) || correctChars <= 0) return 0;
  return correctChars / (seconds / 60);
}

function accuracy(keystrokes, wrongKeystrokes) {
  if (!isNum(keystrokes) || keystrokes <= 0) return 100;
  var wrong = clamp(isNum(wrongKeystrokes) ? wrongKeystrokes : 0, 0, keystrokes);
  return clamp(((keystrokes - wrong) / keystrokes) * 100, 0, 100);
}

function countCorrect(typed, target) {
  var n = Math.min(typed.length, target.length);
  var correct = 0;
  for (var i = 0; i < n; i++) if (typed[i] === target[i]) correct++;
  return correct;
}

/**
 * Full statistics snapshot.
 * @param {object} s {typed, target, seconds, keystrokes, wrongKeystrokes}
 */
function computeStats(s) {
  var typedLen = s.typed.length;
  var correct = countCorrect(s.typed, s.target);
  return {
    typed: typedLen,
    correct: correct,
    incorrect: typedLen - correct,
    raw: wpm(typedLen, s.seconds),
    wpm: wpm(correct, s.seconds),
    cpm: cpm(correct, s.seconds),
    acc: accuracy(s.keystrokes, s.wrongKeystrokes),
    seconds: Math.max(0, s.seconds || 0),
  };
}

function consistency(rawSamples) {
  var values = rawSamples.filter(function (v) { return isNum(v) && v > 0; });
  if (values.length < 2) return 100;
  var mean = values.reduce(function (a, b) { return a + b; }, 0) / values.length;
  if (!mean) return 100;
  var variance = values.reduce(function (a, b) { return a + (b - mean) * (b - mean); }, 0) / values.length;
  return clamp(Math.round((1 - Math.sqrt(variance) / mean) * 100), 0, 100);
}

/* \u2500\u2500 Text safety \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */

var REPLACEMENTS = [
  [/[\u2018\u2019\u201a\u201b\u2032]/g, "'"],
  [/[\u201c\u201d\u201e\u201f\u2033]/g, '"'],
  [/[\u2010-\u2015\u2212]/g, '-'],
  [/\u2026/g, '...'],
  [/[\u00a0\u2000-\u200a\u202f]/g, ' '],
];

/**
 * Make arbitrary text typeable on a standard US keyboard: smart punctuation
 * becomes plain ASCII, line breaks and tabs become spaces, anything else that
 * cannot be typed is dropped, and runs of spaces collapse.
 * @returns {{text:string, removed:number, truncated:boolean}}
 */
function sanitizeTypingText(input, maxLength) {
  var max = isNum(maxLength) ? maxLength : 1200;
  var text = String(input == null ? '' : input);
  REPLACEMENTS.forEach(function (r) { text = text.replace(r[0], r[1]); });
  text = text.replace(/[\r\n\t]+/g, ' ');
  var before = text.length;
  text = text.replace(/[^\x20-\x7E]/g, '');
  var removed = before - text.length;
  text = text.replace(/ {2,}/g, ' ').trim();
  var truncated = false;
  if (text.length > max) {
    text = text.slice(0, max).trim();
    truncated = true;
  }
  return { text: text, removed: removed, truncated: truncated };
}

/* \u2500\u2500 Deterministic randomness (daily challenge, tests) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */

function hashString(str) {
  var h = 2166136261;
  for (var i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  var a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    var t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(list, rng) {
  var random = rng || Math.random;
  var copy = list.slice();
  for (var i = copy.length - 1; i > 0; i--) {
    var j = Math.floor(random() * (i + 1));
    var tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  return copy;
}

function pick(list, count, rng) {
  return shuffle(list, rng).slice(0, Math.max(0, count));
}

/** Local calendar day as "YYYY-MM-DD". */
function dateKey(date) {
  var d = date || new Date();
  var m = String(d.getMonth() + 1).padStart(2, '0');
  var day = String(d.getDate()).padStart(2, '0');
  return d.getFullYear() + '-' + m + '-' + day;
}

export { MIN_SECONDS, clamp, isNum, formatTime, formatClock, formatDuration, escapeHtml, wpm, cpm, accuracy, countCorrect, computeStats, consistency, sanitizeTypingText, hashString, mulberry32, shuffle, pick, dateKey };

/** "1 h 15 min" style text with translated units. `u` = {sec, min, h}. */
export function formatDurationWith(seconds, u) {
  var s = Math.max(0, Math.round(isNum(seconds) ? seconds : 0));
  if (s < 60) return s + ' ' + u.sec;
  var h = Math.floor(s / 3600);
  var m = Math.floor((s % 3600) / 60);
  return h ? h + ' ' + u.h + ' ' + m + ' ' + u.min : m + ' ' + u.min;
}
