/* Unit tests - run with:  npm test   (node --test, no extra packages needed) */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as core from '../src/lib/core.js';
import { createStore, defaults, sanitize, migrateV1 } from '../src/lib/storage.js';
import { QUIZ, buildPractice, dailyChallenge, quizSet } from '../src/lib/content.js';
import { LEVELS } from '../src/data/lessons.js';
import { HANDBOOK } from '../src/data/handbook.js';
import { FLAT, TOTAL, BOOK_PAGE_TOTAL } from '../src/features/progress/progress.js';
import { validateSuggestion, buildParams, sendSuggestion, SendError, LIMITS } from '../src/services/emailService.js';
import { whatsappLink, DEVELOPER } from '../src/config.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const readJson = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const LANGS = ['en', 'fa', 'ps'];

/* ---------------------------------------------------------------- metrics */
test('Net WPM = (correct/5)/minutes', () => {
  assert.equal(core.wpm(250, 60), 50);
  assert.equal(core.wpm(0, 60), 0);
  assert.equal(core.cpm(300, 60), 300);
});
test('accuracy counts every keystroke, corrected mistakes included', () => {
  assert.equal(core.accuracy(100, 0), 100);
  assert.equal(core.accuracy(100, 10), 90);
  assert.equal(core.accuracy(0, 0), 100);
  assert.equal(core.accuracy(10, 50), 0);
});
test('computeStats combines typed text, time and keystrokes', () => {
  const s = core.computeStats({ typed: 'hello wxrld', target: 'hello world', seconds: 12, keystrokes: 12, wrongKeystrokes: 2 });
  assert.equal(s.correct, 10); assert.equal(s.incorrect, 1);
  assert.equal(Math.round(s.wpm), 10); assert.ok(Math.abs(s.acc - 83.33) < 0.1);
});
test('sanitizeTypingText makes text typeable on a US keyboard', () => {
  const r = core.sanitizeTypingText('It’s “fine”\n\nok مرحبا', 1200);
  assert.equal(r.text, 'It\'s "fine" ok');
  assert.ok(r.removed > 0);
  assert.equal(core.sanitizeTypingText('a'.repeat(2000), 100).text.length, 100);
});
test('daily challenge is deterministic per day', () => {
  const d = new Date(2026, 5, 1);
  assert.equal(dailyChallenge(d).text, dailyChallenge(d).text);
  assert.notEqual(dailyChallenge(d).text, dailyChallenge(new Date(2026, 5, 2)).text);
});

/* ---------------------------------------------------------------- content */
test('curriculum has 30 lessons and a 24-page handbook', () => {
  assert.equal(TOTAL, 30); assert.equal(LEVELS.length, 5);
  assert.equal(BOOK_PAGE_TOTAL, 24); assert.equal(HANDBOOK.parts.length, 8);
  assert.equal(new Set(FLAT.map((f) => f.lesson.id)).size, 30, 'lesson ids are unique');
});
test('every lesson drill and handbook page is typeable English', () => {
  const ok = (s) => /^[\x20-\x7E]+$/.test(s);
  FLAT.forEach((f) => assert.ok(ok(f.lesson.drill), f.lesson.id));
  HANDBOOK.parts.forEach((p) => p.pages.forEach((pg) => assert.ok(ok(pg.text), pg.id)));
});
test('all practice modes build typeable text', () => {
  ['homerow', 'letters', 'words', 'sentences', 'punctuation', 'symbols', 'vocab', 'code', 'timed'].forEach((m) => {
    const t = buildPractice(m, { book: HANDBOOK }).text;
    assert.ok(t.length > 10 && /^[\x20-\x7E]+$/.test(t), m);
  });
});
test('quiz: 30 questions, one valid answer each, shuffles keep the right answer', () => {
  assert.equal(QUIZ.length, 30);
  QUIZ.forEach((q, i) => { assert.equal(q.id, i); assert.ok(q.answer >= 0 && q.answer < q.options.length); });
  for (let k = 0; k < 20; k++) quizSet('mixed', 5).forEach((s) => { assert.equal(s.order[s.answer], QUIZ[s.id].answer); });
});

/* ---------------------------------------------------------------- storage */
function memoryBacking() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { m.set(k, String(v)); }, removeItem: (k) => { m.delete(k); } };
}
test('storage: defaults, update, export/import round trip, reset', () => {
  const S = createStore({ storage: memoryBacking() });
  assert.equal(S.state.totals.sessions, 0);
  S.update((d) => { d.totals.sessions = 4; d.progress.done['what-is-computer-science'] = true; });
  const exported = S.exportJson();
  S.resetAll();
  assert.equal(S.state.totals.sessions, 0);
  assert.deepEqual(S.importJson(exported), { ok: true, code: 'imported' });
  assert.equal(S.state.totals.sessions, 4);
  assert.equal(S.importJson('not json').code, 'badJson');
  assert.equal(S.importJson('{"hello":1}').code, 'notTypecsf');
});
test('storage: corrupt data is backed up and replaced by defaults', () => {
  const b = memoryBacking(); b.setItem('typecsf.v2', '{broken');
  const S = createStore({ storage: b });
  assert.equal(S.takeNotice(), 'corrupt');
  assert.equal(b.getItem('typecsf.corrupt-backup'), '{broken');
});
test('storage: sanitize rejects hostile values', () => {
  const d = sanitize({ settings: { theme: 'neon', difficulty: 'x', breakReminder: 9999 }, history: [{ at: 1, wpm: 9e9, acc: -5, kind: 'evil' }], progress: { best: { a: { wpm: 'NaN', acc: 1 } } } });
  assert.equal(d.settings.theme, defaults().settings.theme);
  assert.ok(d.history[0].wpm <= 400 && d.history[0].acc >= 0);
  assert.deepEqual(d.progress.best, {});
});
test('storage: v1 data migrates', () => {
  assert.ok(migrateV1({ done: { 'what-is-computer-science': true } }));
});

/* ---------------------------------------------------------------- i18n */
const flat = (o, p = '') => Object.entries(o).flatMap(([k, v]) => (v && typeof v === 'object' ? flat(v, p + k + '.') : [[p + k, v]]));
const placeholders = (s) => (String(s).match(/\{\{\s*\w+\s*\}\}/g) || []).map((x) => x.replace(/\s/g, '')).sort().join();

test('i18n: fa and ps have exactly the same keys as en, with the same placeholders', () => {
  const en = Object.fromEntries(flat(readJson('src/locales/en/translation.json')));
  assert.ok(Object.keys(en).length > 500);
  for (const lang of ['fa', 'ps']) {
    const tr = Object.fromEntries(flat(readJson(`src/locales/${lang}/translation.json`)));
    assert.deepEqual(Object.keys(tr).sort(), Object.keys(en).sort(), lang + ' key parity');
    for (const k of Object.keys(en)) {
      assert.ok(typeof tr[k] === 'string' && tr[k].trim(), `${lang}:${k} empty`);
      assert.equal(placeholders(tr[k]), placeholders(en[k]), `${lang}:${k} placeholders`);
    }
  }
});
test('i18n: Dari and Pashto text is actually translated (Arabic script) for the user interface', () => {
  const en = Object.fromEntries(flat(readJson('src/locales/en/translation.json')));
  for (const lang of ['fa', 'ps']) {
    const tr = Object.fromEntries(flat(readJson(`src/locales/${lang}/translation.json`)));
    const untranslated = Object.keys(en).filter((k) => tr[k] === en[k] && /[A-Za-z]{4,}/.test(en[k]));
    // brand names, e-mail placeholder and the like are the only allowed identical strings
    assert.ok(untranslated.length <= 6, lang + ' untranslated: ' + untranslated.join(', '));
  }
});
test('i18n: every literal t("...") key used in the source exists in all three languages', () => {
  const dicts = Object.fromEntries(LANGS.map((l) => [l, Object.fromEntries(flat(readJson(`src/locales/${l}/translation.json`)))]));
  const files = [];
  (function walk(d) { fs.readdirSync(d, { withFileTypes: true }).forEach((e) => { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (/\.(jsx?|mjs)$/.test(e.name)) files.push(p); }); })(path.join(root, 'src'));
  const missing = [];
  const re = /\bt\(\s*'([a-zA-Z0-9_.-]+)'\s*[,)]/g;
  files.forEach((f) => { const s = fs.readFileSync(f, 'utf8'); let m; while ((m = re.exec(s))) { LANGS.forEach((l) => { if (!(m[1] in dicts[l])) missing.push(`${l}:${m[1]} (${path.basename(f)})`); }); } });
  assert.deepEqual(missing, []);
});
test('i18n: curriculum and quiz overlays cover every lesson, page and question', () => {
  for (const lang of ['fa', 'ps']) {
    const c = readJson(`src/locales/${lang}/curriculum.json`);
    FLAT.forEach((f) => {
      const l = c.lessons[f.lesson.id];
      assert.ok(l && l.title && l.definition, `${lang} lesson ${f.lesson.id}`);
      assert.equal(l.rules.length, f.lesson.rules.length, `${lang} rules ${f.lesson.id}`);
      assert.equal(l.examples.length, f.lesson.examples.length, `${lang} examples ${f.lesson.id}`);
    });
    LEVELS.forEach((lv) => assert.ok(c.levels[lv.id].name, `${lang} level ${lv.id}`));
    HANDBOOK.parts.forEach((p) => {
      assert.ok(c.handbook.parts[p.id].title, `${lang} ${p.id}`);
      p.pages.forEach((pg) => { assert.equal(c.handbook.pages[pg.id].notes.length, pg.notes.length, `${lang} ${pg.id}`); });
    });
    const q = readJson(`src/locales/${lang}/quiz.json`);
    assert.equal(q.length, QUIZ.length);
    q.forEach((x, i) => assert.equal(x.options.length, QUIZ[i].options.length, `${lang} quiz ${i}`));
  }
});

/* ---------------------------------------------------------------- suggestion form + email */
const valid = { name: 'Ali', email: 'ali@example.com', category: 'feature', subject: 'Hi', message: 'Please add a dark theme.', consent: true };
test('form validation: required message, email format, category, consent, limits', () => {
  assert.deepEqual(validateSuggestion(valid), {});
  assert.equal(validateSuggestion({ ...valid, message: '' }).message, 'messageRequired');
  assert.equal(validateSuggestion({ ...valid, message: 'short' }).message, 'messageShort');
  assert.equal(validateSuggestion({ ...valid, message: 'x'.repeat(LIMITS.message + 1) }).message, 'messageLong');
  assert.equal(validateSuggestion({ ...valid, email: 'nope' }).email, 'emailInvalid');
  assert.equal(validateSuggestion({ ...valid, email: '' }).email, undefined, 'email is optional');
  assert.equal(validateSuggestion({ ...valid, name: '' }).name, undefined, 'name is optional');
  assert.equal(validateSuggestion({ ...valid, category: 'x' }).category, 'categoryInvalid');
  assert.equal(validateSuggestion({ ...valid, consent: false }).consent, 'consentRequired');
});
test('email params: no header injection, English category, language name, timestamp', () => {
  const p = buildParams({ ...valid, name: 'Ali\r\nBcc: evil@x.com', subject: 'a\nb', email: 'a@b.co' }, 'fa', new Date('2026-01-02T03:04:05Z'));
  assert.ok(!/[\r\n]/.test(p.from_name) && !/[\r\n]/.test(p.subject));
  assert.equal(p.language, 'Dari'); assert.equal(buildParams(valid, 'ps').language, 'Pashto');
  assert.equal(p.category, 'Feature request');
  assert.match(p.submitted_at, /2026-01-02T03:04:05/);
  assert.equal(buildParams({ ...valid, email: 'bad\r\nBcc: x' }, 'en').reply_to, '', 'a bad address never becomes reply_to');
  assert.ok(!('to_email' in p) && !('to' in p), 'the recipient is never sent from the browser');
});
test('email send: without configuration nothing is sent and the error is honest', async () => {
  let calls = 0;
  await assert.rejects(() => sendSuggestion(valid, 'en', { fetch: async () => { calls++; return { ok: true, status: 200 }; } }), (e) => e instanceof SendError && e.code === 'notConfigured');
  assert.equal(calls, 0);
});
test('email send: a honeypot hit is dropped silently', async () => {
  let calls = 0;
  const r = await sendSuggestion({ ...valid, website: 'http://spam' }, 'en', { fetch: async () => { calls++; } });
  assert.equal(calls, 0); assert.equal(r.dropped, true);
});

/* ---------------------------------------------------------------- WhatsApp */
test('WhatsApp link: number and URL-encoded message', () => {
  assert.equal(DEVELOPER.whatsapp, '93796883671');
  const link = whatsappLink('Hello, I have a suggestion about the TypeCSF web application.');
  assert.ok(link.startsWith('https://wa.me/93796883671?text='));
  assert.equal(decodeURIComponent(link.split('?text=')[1]), 'Hello, I have a suggestion about the TypeCSF web application.');
  assert.ok(!link.includes(' '));
  for (const l of LANGS) { const msg = readJson(`src/locales/${l}/translation.json`).wa.message; assert.equal(decodeURIComponent(whatsappLink(msg).split('?text=')[1]), msg); }
});

/* ---------------------------------------------------------------- security hygiene */
test('no private keys or secrets are committed in source or config files', () => {
  const bad = /(sk_live|private[_-]?key|BEGIN [A-Z ]*PRIVATE|api[_-]?secret|password\s*[:=]\s*['"][^'"]+)/i;
  const files = [];
  (function walk(d) { fs.readdirSync(d, { withFileTypes: true }).forEach((e) => { if (['node_modules', 'dist', 'dist-test', '.git'].includes(e.name)) return; const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (/\.(jsx?|mjs|json|md|html|example|js)$/.test(e.name) || e.name === '.env.example') files.push(p); }); })(root);
  files.forEach((f) => { const s = fs.readFileSync(f, 'utf8'); if (path.basename(f) === 'unit.test.js') return; assert.ok(!bad.test(s) || /README/.test(f), 'possible secret in ' + f); });
  assert.ok(!fs.existsSync(path.join(root, '.env')), 'a real .env must not be shipped');
});
