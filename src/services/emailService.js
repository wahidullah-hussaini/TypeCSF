/* =============================================================================
 * emailService - sends the suggestion form to the developer through EmailJS.
 * -----------------------------------------------------------------------------
 * It calls the EmailJS REST endpoint (the same one the EmailJS SDK uses), so no
 * extra package is needed. Only PUBLIC values are used here: service id, template
 * id and the public key. The recipient address is fixed inside the EmailJS
 * template, never sent from the browser.
 *
 * What it guarantees:
 *   - success is reported ONLY when EmailJS answers 200 OK
 *   - if the keys are not configured, it says so and sends nothing
 *   - CR/LF are stripped from every one-line field (no header injection)
 *   - a hidden honeypot field, a 60 second client-side limit and length limits
 *     make casual abuse harder. These are NOT complete spam protection: the
 *     browser can always be bypassed. For stronger protection use EmailJS
 *     domain restrictions / reCAPTCHA or a small server (see README).
 * ========================================================================== */
import { EMAILJS } from '../config.js';

export const LIMITS = { name: 80, subject: 120, message: 2000, minMessage: 10, email: 120 };
export const CATEGORIES = ['feature', 'bug', 'design', 'content', 'translation', 'other'];
const CATEGORY_EN = {
  feature: 'Feature request', bug: 'Bug report', design: 'Design or usability feedback',
  content: 'Educational content', translation: 'Translation correction', other: 'Other',
};
const LANG_EN = { en: 'English', fa: 'Dari', ps: 'Pashto' };
export const RATE_KEY = 'typecsf.lastSuggestion';
export const RATE_SECONDS = 60;

const oneLine = (s) => String(s == null ? '' : s).replace(/[\r\n\u2028\u2029]+/g, ' ').replace(/[\u0000-\u001f\u007f]/g, '').trim();
const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/;

export function emailConfigured() {
  return !!(EMAILJS.serviceId && EMAILJS.templateId && EMAILJS.publicKey);
}

/** Returns an object of error codes keyed by field (empty object = valid). */
export function validateSuggestion(v) {
  const errors = {};
  const message = String(v.message || '').trim();
  if (!message) errors.message = 'messageRequired';
  else if (message.length < LIMITS.minMessage) errors.message = 'messageShort';
  else if (message.length > LIMITS.message) errors.message = 'messageLong';
  const email = oneLine(v.email);
  if (email && (email.length > LIMITS.email || !EMAIL_RE.test(email))) errors.email = 'emailInvalid';
  if (oneLine(v.name).length > LIMITS.name) errors.name = 'nameLong';
  if (oneLine(v.subject).length > LIMITS.subject) errors.subject = 'subjectLong';
  if (!CATEGORIES.includes(v.category)) errors.category = 'categoryInvalid';
  if (!v.consent) errors.consent = 'consentRequired';
  return errors;
}

export function secondsUntilAllowed(now = Date.now()) {
  try {
    const last = Number(localStorage.getItem(RATE_KEY) || 0);
    const left = Math.ceil((last + RATE_SECONDS * 1000 - now) / 1000);
    return left > 0 ? left : 0;
  } catch (e) { return 0; }
}

export class SendError extends Error {
  constructor(code) { super(code); this.code = code; }
}

export function buildParams(v, lang, now = new Date()) {
  const email = oneLine(v.email);
  return {
    app: 'TypeCSF',
    from_name: oneLine(v.name) || 'Anonymous',
    reply_to: email && EMAIL_RE.test(email) ? email : '',
    sender_email: email || 'not provided',
    category: CATEGORY_EN[v.category] || 'Other',
    subject: oneLine(v.subject) || '(no subject) ' + (CATEGORY_EN[v.category] || ''),
    message: String(v.message || '').replace(/\u0000/g, '').trim().slice(0, LIMITS.message),
    submitted_at: now.toISOString() + ' (UTC)',
    language: LANG_EN[lang] || lang,
  };
}

/**
 * @returns {Promise<{ok:true}>} resolves only after EmailJS confirmed delivery to its queue.
 * @throws {SendError} with code: notConfigured | wait | offline | tooMany | failed
 */
export async function sendSuggestion(values, lang, opts = {}) {
  const doFetch = opts.fetch || (typeof fetch === 'function' ? fetch : null);
  if (values.website) return { ok: true, dropped: true }; // honeypot: a bot filled the hidden field
  if (!emailConfigured()) throw new SendError('notConfigured');
  if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new SendError('offline');
  if (secondsUntilAllowed() > 0) throw new SendError('wait');
  if (!doFetch) throw new SendError('failed');

  const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
  const timer = ctrl ? setTimeout(() => ctrl.abort(), 15000) : 0;
  let res;
  try {
    res = await doFetch(EMAILJS.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: EMAILJS.serviceId,
        template_id: EMAILJS.templateId,
        user_id: EMAILJS.publicKey,
        template_params: buildParams(values, lang),
      }),
      signal: ctrl ? ctrl.signal : undefined,
    });
  } catch (e) {
    throw new SendError(typeof navigator !== 'undefined' && navigator.onLine === false ? 'offline' : 'failed');
  } finally {
    if (timer) clearTimeout(timer);
  }
  if (res.status === 429) throw new SendError('tooMany');
  if (!res.ok) throw new SendError('failed');
  try { localStorage.setItem(RATE_KEY, String(Date.now())); } catch (e) { /* ignore */ }
  return { ok: true };
}
