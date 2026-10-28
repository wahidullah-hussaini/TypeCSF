/* =============================================================================
 * storage.js - versioned, validated localStorage wrapper
 * -----------------------------------------------------------------------------
 * - Everything stays on the device. Nothing is ever sent anywhere.
 * - Data lives under one key (typecsf.v2) with a schema number inside.
 * - Old data (typecs.v1) is migrated once; the old key is left untouched until
 *   the user resets progress.
 * - Corrupt JSON is copied to a backup key before being replaced by defaults.
 * - If localStorage is blocked (private mode, disabled), an in-memory fallback
 *   keeps the app working for the session and `store.persistent` is false.
 * ========================================================================== */

var KEY = 'typecsf.v2';
var OLD_KEY = 'typecs.v1';
var BACKUP_KEY = 'typecsf.corrupt-backup';
var SCHEMA = 2;
var HISTORY_MAX = 200;
var MISTAKES_MAX = 60;

var DIFFICULTY = { relaxed: 85, standard: 90, strict: 95 };

function isNum(n) { return typeof n === 'number' && isFinite(n); }
function isObj(o) { return o !== null && typeof o === 'object' && !Array.isArray(o); }
function clamp(n, lo, hi) { return Math.min(hi, Math.max(lo, n)); }
function str(v, max) { return typeof v === 'string' ? v.slice(0, max || 200) : ''; }
function bool(v, d) { return typeof v === 'boolean' ? v : d; }
function oneOf(v, list, d) { return list.indexOf(v) !== -1 ? v : d; }
function num(v, lo, hi, d) { return isNum(v) ? clamp(v, lo, hi) : d; }

function defaults() {
  return {
    schema: SCHEMA,
    settings: {
      theme: 'system',        // system | dark | light
      sound: false,
      keyboard: true,
      fingers: true,          // finger colour guidance
      reducedMotion: 'system', // system | on | off
      difficulty: 'standard', // relaxed | standard | strict
      breakReminder: 0,       // minutes; 0 = off
      refOpen: true,
    },
    progress: { best: {}, done: {}, bookBest: {}, bookRead: {}, last: null },
    history: [],
    mistakes: {},
    achievements: {},
    games: {},
    quizzes: { answered: 0, correct: 0, best: {}, history: [] },
    daily: {},
    days: {},
    totals: { seconds: 0, chars: 0, sessions: 0 },
  };
}

function cleanBest(raw) {
  var out = {};
  if (!isObj(raw)) return out;
  Object.keys(raw).slice(0, 500).forEach(function (id) {
    var b = raw[id];
    if (!isObj(b)) return;
    if (!isNum(b.wpm) || !isNum(b.acc)) return;
    out[str(id, 60)] = {
      wpm: clamp(b.wpm, 0, 400),
      acc: clamp(b.acc, 0, 100),
      at: isNum(b.at) ? b.at : 0,
    };
  });
  return out;
}

function cleanFlags(raw) {
  var out = {};
  if (!isObj(raw)) return out;
  Object.keys(raw).slice(0, 500).forEach(function (id) {
    if (raw[id]) out[str(id, 60)] = true;
  });
  return out;
}

function cleanLast(v) {
  if (!isObj(v)) return null;
  var idx = function (n) { return isNum(n) ? Math.round(clamp(n, 0, 60)) : 0; };
  return {
    section: v.section === 'book' ? 'book' : 'lesson',
    li: idx(v.li), i: idx(v.i), ci: idx(v.ci), pi: idx(v.pi),
  };
}

function cleanCounterMap(raw, limit) {
  var out = {};
  if (!isObj(raw)) return out;
  Object.keys(raw).slice(0, limit).forEach(function (k) {
    if (isNum(raw[k]) && raw[k] >= 0) out[str(k, 20)] = Math.round(raw[k]);
  });
  return out;
}

function cleanHistory(raw) {
  if (!Array.isArray(raw)) return [];
  var out = [];
  raw.forEach(function (r) {
    if (!isObj(r) || !isNum(r.wpm) || !isNum(r.acc) || !isNum(r.at)) return;
    out.push({
      at: r.at,
      kind: oneOf(r.kind, ['lesson', 'book', 'practice', 'game'], 'practice'),
      id: str(r.id, 60),
      label: str(r.label, 80),
      wpm: clamp(r.wpm, 0, 400),
      raw: isNum(r.raw) ? clamp(r.raw, 0, 400) : clamp(r.wpm, 0, 400),
      acc: clamp(r.acc, 0, 100),
      seconds: num(r.seconds, 0, 86400, 0),
      chars: num(r.chars, 0, 100000, 0),
    });
  });
  return out.slice(-HISTORY_MAX);
}

function cleanAchievements(raw) {
  var out = {};
  if (!isObj(raw)) return out;
  Object.keys(raw).slice(0, 100).forEach(function (id) {
    if (isNum(raw[id])) out[str(id, 40)] = raw[id];
  });
  return out;
}

function cleanGames(raw) {
  var out = {};
  if (!isObj(raw)) return out;
  Object.keys(raw).slice(0, 20).forEach(function (id) {
    var g = raw[id];
    if (!isObj(g)) return;
    out[str(id, 30)] = {
      plays: Math.round(num(g.plays, 0, 1e6, 0)),
      bestScore: num(g.bestScore, 0, 1e7, 0),
      bestWpm: num(g.bestWpm, 0, 400, 0),
      bestAcc: num(g.bestAcc, 0, 100, 0),
    };
  });
  return out;
}

function cleanQuizzes(raw) {
  var out = { answered: 0, correct: 0, best: {}, history: [] };
  if (!isObj(raw)) return out;
  out.answered = Math.round(num(raw.answered, 0, 1e6, 0));
  out.correct = Math.min(out.answered, Math.round(num(raw.correct, 0, 1e6, 0)));
  if (isObj(raw.best)) {
    Object.keys(raw.best).slice(0, 20).forEach(function (k) {
      if (isNum(raw.best[k])) out.best[str(k, 30)] = clamp(raw.best[k], 0, 100);
    });
  }
  if (Array.isArray(raw.history)) {
    raw.history.slice(-50).forEach(function (h) {
      if (isObj(h) && isNum(h.at) && isNum(h.score)) {
        out.history.push({ at: h.at, topic: str(h.topic, 30), score: clamp(h.score, 0, 100) });
      }
    });
  }
  return out;
}

function cleanDaily(raw) {
  var out = {};
  if (!isObj(raw)) return out;
  Object.keys(raw).slice(-60).forEach(function (day) {
    var d = raw[day];
    if (/^\d{4}-\d{2}-\d{2}$/.test(day) && isObj(d)) {
      out[day] = { wpm: num(d.wpm, 0, 400, 0), acc: num(d.acc, 0, 100, 0) };
    }
  });
  return out;
}

function cleanDays(raw) {
  var out = {};
  if (!isObj(raw)) return out;
  Object.keys(raw).slice(-120).forEach(function (day) {
    var d = raw[day];
    if (/^\d{4}-\d{2}-\d{2}$/.test(day) && isObj(d)) {
      out[day] = { seconds: num(d.seconds, 0, 86400, 0), sessions: Math.round(num(d.sessions, 0, 10000, 0)) };
    }
  });
  return out;
}

/** Turn ANY value into a valid, current-schema state object. */
function sanitize(raw) {
  var d = defaults();
  if (!isObj(raw)) return d;
  var s = isObj(raw.settings) ? raw.settings : {};
  d.settings = {
    theme: oneOf(s.theme, ['system', 'dark', 'light'], 'system'),
    sound: bool(s.sound, false),
    keyboard: bool(s.keyboard, true),
    fingers: bool(s.fingers, true),
    reducedMotion: oneOf(s.reducedMotion, ['system', 'on', 'off'], 'system'),
    difficulty: oneOf(s.difficulty, ['relaxed', 'standard', 'strict'], 'standard'),
    breakReminder: oneOf(s.breakReminder, [0, 15, 20, 30], 0),
    refOpen: bool(s.refOpen, true),
  };
  var p = isObj(raw.progress) ? raw.progress : {};
  d.progress = {
    best: cleanBest(p.best),
    done: cleanFlags(p.done),
    bookBest: cleanBest(p.bookBest),
    bookRead: cleanFlags(p.bookRead),
    last: cleanLast(p.last),
  };
  d.history = cleanHistory(raw.history);
  d.mistakes = cleanCounterMap(raw.mistakes, MISTAKES_MAX * 2);
  d.achievements = cleanAchievements(raw.achievements);
  d.games = cleanGames(raw.games);
  d.quizzes = cleanQuizzes(raw.quizzes);
  d.daily = cleanDaily(raw.daily);
  d.days = cleanDays(raw.days);
  var t = isObj(raw.totals) ? raw.totals : {};
  d.totals = {
    seconds: num(t.seconds, 0, 1e9, 0),
    chars: num(t.chars, 0, 1e9, 0),
    sessions: Math.round(num(t.sessions, 0, 1e7, 0)),
  };
  return d;
}

/** v1 ("typecs.v1") -> v2. Only the fields that existed in v1. */
function migrateV1(old) {
  if (!isObj(old)) return defaults();
  return sanitize({
    settings: {
      theme: old.theme === 'light' || old.theme === 'dark' ? old.theme : 'system',
      sound: old.sound,
      keyboard: old.keyboard,
      refOpen: old.refOpen,
    },
    progress: {
      best: old.best,
      done: old.done,
      bookBest: old.bookBest,
      bookRead: old.bookRead,
      last: old.last,
    },
  });
}

function memoryStorage() {
  var data = {};
  return {
    getItem: function (k) { return Object.prototype.hasOwnProperty.call(data, k) ? data[k] : null; },
    setItem: function (k, v) { data[k] = String(v); },
    removeItem: function (k) { delete data[k]; },
  };
}

function probe(storage) {
  try {
    var k = '__typecsf_probe__';
    storage.setItem(k, '1');
    storage.removeItem(k);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * @param {{storage?:Storage}} [opts]
 */
function createStore(opts) {
  var backing = null;
  try { backing = (opts && opts.storage) || (typeof localStorage !== 'undefined' ? localStorage : null); } catch (e) { backing = null; }
  var persistent = !!backing && probe(backing);
  if (!persistent) backing = memoryStorage();

  var state = null;
  var listeners = [];
  var notice = '';       // load message code: '' | 'corrupt' | 'migrated' (shown once)
  var timer = 0;

  function load() {
    var text = null;
    try { text = backing.getItem(KEY); } catch (e) { text = null; }
    if (text) {
      try {
        var parsed = JSON.parse(text);
        if (!isObj(parsed)) throw new Error('not an object');
        return sanitize(parsed);
      } catch (e) {
        try { backing.setItem(BACKUP_KEY, text); } catch (e2) { /* ignore */ }
        notice = 'corrupt'; // translated by the interface
        return defaults();
      }
    }
    var old = null;
    try { old = backing.getItem(OLD_KEY); } catch (e) { old = null; }
    if (old) {
      try {
        var migrated = migrateV1(JSON.parse(old));
        notice = 'migrated'; // translated by the interface
        return migrated;
      } catch (e) { /* fall through */ }
    }
    return defaults();
  }

  function write() {
    try {
      backing.setItem(KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      return false;
    }
  }

  state = load();
  if (persistent) write();

  function emit() {
    listeners.slice().forEach(function (fn) { try { fn(state); } catch (e) { /* listener errors never break saving */ } });
  }

  var api = {
    persistent: persistent,
    get state() { return state; },
    takeNotice: function () { var n = notice; notice = ''; return n; },
    /** Subscribe to changes. Returns a function that unsubscribes. */
    onChange: function (fn) {
      listeners.push(fn);
      return function () { listeners = listeners.filter(function (f) { return f !== fn; }); };
    },
    /** Mutate state inside fn, then save (debounced) and notify. */
    update: function (fn) {
      fn(state);
      api.save();
      emit();
    },
    save: function () {
      if (typeof clearTimeout === 'function') clearTimeout(timer);
      if (typeof setTimeout === 'function') timer = setTimeout(write, 300);
      else write();
    },
    flush: function () {
      if (typeof clearTimeout === 'function') clearTimeout(timer);
      return write();
    },
    exportJson: function () {
      return JSON.stringify({ app: 'TypeCSF', exportedAt: new Date().toISOString(), data: state }, null, 2);
    },
    /** Returns {ok, message}. Replaces all progress with the validated import. */
    importJson: function (text) {
      try {
        var parsed = JSON.parse(text);
        var data = isObj(parsed) && isObj(parsed.data) ? parsed.data : parsed;
        if (!isObj(data) || !isObj(data.progress) && !isObj(data.settings)) {
          return { ok: false, code: 'notTypecsf' };
        }
        state = sanitize(data);
        write();
        emit();
        return { ok: true, code: 'imported' };
      } catch (e) {
        return { ok: false, code: 'badJson' };
      }
    },
    /** Delete progress. Keeps nothing but defaults; removes the old v1 key too. */
    resetAll: function () {
      state = defaults();
      try { backing.removeItem(OLD_KEY); } catch (e) { /* ignore */ }
      try { backing.removeItem(BACKUP_KEY); } catch (e) { /* ignore */ }
      write();
      emit();
    },
    /** Delete progress but keep settings. */
    resetProgressOnly: function () {
      var keep = state.settings;
      state = defaults();
      state.settings = keep;
      try { backing.removeItem(OLD_KEY); } catch (e) { /* ignore */ }
      write();
      emit();
    },
  };
  return api;
}

export { KEY, OLD_KEY, BACKUP_KEY, SCHEMA, HISTORY_MAX, MISTAKES_MAX, DIFFICULTY, defaults, sanitize, migrateV1, createStore };
