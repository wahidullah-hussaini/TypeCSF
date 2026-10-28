/* =============================================================================
 * i18n - a small translation layer with the same JSON shape and {{variable}}
 * placeholders as i18next, so it can be replaced by react-i18next later:
 *
 *    const { t } = useTranslation();   // identical call shape: t("home.hero.title")
 *
 * Languages (this is a deliberate project decision, documented here):
 *    en  English  - left-to-right
 *    fa  Dari     - right-to-left. "fa" is the standard code for the Persian
 *                   language family; the interface is labelled "Dari" and the
 *                   wording is the Afghan (Dari) variety.
 *    ps  Pashto   - right-to-left
 *
 * What it does:
 *   - keeps the chosen language in localStorage ("typecsf.lang") and restores it
 *   - sets <html lang> and <html dir> so the WHOLE layout mirrors correctly
 *   - falls back to English for a missing key (and the key itself as last resort)
 *   - shows digits in the local style (۰۱۲۳) for Dari and Pashto
 *   - changing language never touches progress or a running typing session,
 *     because nothing but text depends on it
 * ========================================================================== */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import en from '../locales/en/translation.json';
import fa from '../locales/fa/translation.json';
import ps from '../locales/ps/translation.json';
import faCurriculum from '../locales/fa/curriculum.json';
import psCurriculum from '../locales/ps/curriculum.json';
import faQuiz from '../locales/fa/quiz.json';
import psQuiz from '../locales/ps/quiz.json';
import { LEVELS } from '../data/lessons.js';
import { HANDBOOK } from '../data/handbook.js';
import { QUIZ } from '../lib/content.js';

export const LANGUAGES = [
  { code: 'en', label: 'English', dir: 'ltr', locale: 'en' },
  { code: 'fa', label: 'دری', dir: 'rtl', locale: 'fa-AF' },
  { code: 'ps', label: 'پښتو', dir: 'rtl', locale: 'ps-AF' },
];
export const LANG_KEY = 'typecsf.lang';

const DICTS = { en, fa, ps };
const CURRICULUM = { fa: faCurriculum, ps: psCurriculum };
const QUIZ_TEXT = { fa: faQuiz, ps: psQuiz };
const DIGITS = '۰۱۲۳۴۵۶۷۸۹';

export function localizeDigits(value, lang) {
  const s = String(value);
  if (lang !== 'fa' && lang !== 'ps') return s;
  return s.replace(/\d/g, (d) => DIGITS[Number(d)]);
}

function lookup(dict, key) {
  let node = dict;
  const parts = key.split('.');
  for (let i = 0; i < parts.length; i++) {
    if (node == null || typeof node !== 'object') return undefined;
    node = node[parts[i]];
  }
  return node;
}

export function translate(lang, key, vars) {
  let text = lookup(DICTS[lang], key);
  if (typeof text !== 'string') text = lookup(en, key);
  if (typeof text !== 'string') return key;
  if (!vars) return text;
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (m, name) => {
    if (!(name in vars)) return m;
    const v = vars[name];
    return typeof v === 'number' ? localizeDigits(v, lang) : String(v);
  });
}

/** Like translate() but returns React-friendly parts: variables listed in `bold`
 *  are wrapped by the caller-supplied `wrap` function. */
export function translateParts(lang, key, vars, wrap) {
  const text = translate(lang, key, null);
  const out = [];
  let last = 0;
  const re = /\{\{\s*(\w+)\s*\}\}/g;
  let m;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const v = vars && m[1] in vars ? vars[m[1]] : m[0];
    const shown = typeof v === 'number' ? localizeDigits(v, lang) : String(v);
    out.push(wrap ? wrap(shown, m[1], i++) : shown);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function detectLanguage() {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved && DICTS[saved]) return saved;
  } catch (e) { /* storage blocked */ }
  const prefs = (typeof navigator !== 'undefined' && (navigator.languages || [navigator.language])) || [];
  for (const p of prefs) {
    const base = String(p || '').toLowerCase().split('-')[0];
    if (base === 'fa' || base === 'prs') return 'fa';
    if (base === 'ps') return 'ps';
    if (base === 'en') return 'en';
  }
  return 'en';
}

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(detectLanguage);
  const meta = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  useEffect(() => {
    const root = document.documentElement;
    root.lang = lang;
    root.dir = meta.dir;
  }, [lang, meta.dir]);

  const setLang = useCallback((code) => {
    if (!DICTS[code]) return;
    setLangState(code);
    try { localStorage.setItem(LANG_KEY, code); } catch (e) { /* ignore */ }
  }, []);

  const value = useMemo(() => {
    const t = (key, vars) => translate(lang, key, vars);
    const rich = (key, vars, wrap) => translateParts(lang, key, vars, wrap);
    const n = (x) => localizeDigits(x, lang);
    /** Translate a {key, vars} spec (or pass a plain string through). */
    const tt = (spec) => (spec && typeof spec === 'object' ? translate(lang, spec.key, spec.vars) : spec);
    const exists = (key) => typeof lookup(DICTS[lang], key) === 'string';
    const dateFmt = (() => {
      try { return new Intl.DateTimeFormat(meta.locale, { dateStyle: 'medium' }); } catch (e) { return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }); }
    })();
    const formatDate = (ts) => dateFmt.format(new Date(ts));
    const formatDuration = (seconds) => {
      const s = Math.max(0, Math.round(Number.isFinite(seconds) ? seconds : 0));
      if (s < 60) return n(s) + ' ' + t('units.sec');
      const h = Math.floor(s / 3600);
      const m = Math.floor((s % 3600) / 60);
      return h ? n(h) + ' ' + t('units.h') + ' ' + n(m) + ' ' + t('units.min') : n(m) + ' ' + t('units.min');
    };
    return {
      t, tt, rich, n, exists, lang, dir: meta.dir, setLang, languages: LANGUAGES, formatDate, formatDuration,
      i18n: { language: lang, changeLanguage: setLang, dir: () => meta.dir },
    };
  }, [lang, meta.dir, meta.locale, setLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useTranslation must be used inside <I18nProvider>');
  return ctx;
}

/* ---------------------------------------------------------------------------
 * Curriculum text: lessons, levels and the handbook keep their English source
 * (src/data) because the TYPED text must stay English. Everything the learner
 * only READS (titles, definitions, key concepts, notes) is overlaid from
 * src/locales/<lang>/curriculum.json when that language is active.
 * ------------------------------------------------------------------------- */
export function useCurriculum() {
  const { lang } = useTranslation();
  return useMemo(() => {
    const ov = CURRICULUM[lang] || null;
    const level = (lv) => {
      const o = ov && ov.levels && ov.levels[lv.id];
      return { name: (o && o.name) || lv.name, subtitle: (o && o.subtitle) || lv.subtitle };
    };
    const lesson = (ls) => {
      const o = ov && ov.lessons && ov.lessons[ls.id];
      return {
        title: (o && o.title) || ls.title,
        tagline: (o && o.tagline) || ls.tagline,
        definition: (o && o.definition) || ls.definition,
        rules: o && Array.isArray(o.rules) && o.rules.length === ls.rules.length ? o.rules : ls.rules,
        notes: ls.examples.map((ex, i) => (o && o.examples && o.examples[i]) || ex.note),
      };
    };
    const handbook = () => {
      const o = ov && ov.handbook;
      return {
        name: (o && o.name) || HANDBOOK.name,
        title: (o && o.title) || HANDBOOK.title,
        blurb: (o && o.blurb) || HANDBOOK.blurb,
        author: (o && o.author) || HANDBOOK.author,
        source: (o && o.source) || HANDBOOK.source,
      };
    };
    const part = (p) => {
      const o = ov && ov.handbook && ov.handbook.parts && ov.handbook.parts[p.id];
      return {
        title: (o && o.title) || p.title,
        subtitle: (o && o.subtitle) || p.subtitle,
        summary: (o && o.summary) || p.summary,
      };
    };
    const page = (pg) => {
      const o = ov && ov.handbook && ov.handbook.pages && ov.handbook.pages[pg.id];
      return {
        focus: (o && o.focus) || pg.focus,
        notes: pg.notes.map((n, i) => {
          const on = o && o.notes && o.notes[i];
          return {
            term: n.term,
            termLocal: (on && on.term) || n.term,
            definition: (on && on.definition) || n.definition,
            example: (on && on.example) || n.example,
          };
        }),
      };
    };
    const quiz = (id) => {
      const base = QUIZ[id];
      const o = QUIZ_TEXT[lang] && QUIZ_TEXT[lang][id];
      return {
        q: (o && o.q) || base.q,
        options: o && Array.isArray(o.options) && o.options.length === base.options.length ? o.options : base.options,
        why: (o && o.why) || base.why,
      };
    };
    return { level, lesson, handbook, part, page, quiz };
  }, [lang]);
}
