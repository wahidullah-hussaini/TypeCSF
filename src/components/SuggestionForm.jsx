/* SuggestionForm - sends a suggestion to the developer by e-mail (EmailJS).
   Success is shown only after the service confirms delivery. On any error the
   text stays in the form so nothing is lost. */
import { useRef, useState } from 'react';
import { useTranslation } from '../i18n/index.jsx';
import { CATEGORIES, LIMITS, SendError, emailConfigured, secondsUntilAllowed, sendSuggestion, validateSuggestion } from '../services/emailService.js';
import { DEVELOPER, whatsappLink } from '../config.js';
import { Button } from './ui.jsx';
import { AlertIcon, CheckIcon, MailIcon, SendIcon, WhatsAppIcon } from './icons.jsx';

const EMPTY = { name: '', email: '', category: 'feature', subject: '', message: '', consent: false, website: '' };
const field = 'w-full rounded-xl border bg-bg2 px-3.5 py-2.5 text-fg placeholder:text-faint';

export default function SuggestionForm() {
  const { t, n, lang } = useTranslation();
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | sending | success | error
  const [errorCode, setErrorCode] = useState('');
  const [waitSec, setWaitSec] = useState(0);
  const sending = useRef(false);
  const summary = useRef(null);

  const set = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setValues((s) => ({ ...s, [k]: v }));
    if (errors[k]) setErrors((s) => { const c = { ...s }; delete c[k]; return c; });
    if (status === 'success') setStatus('idle');
  };

  const errText = (k) => {
    const code = errors[k];
    if (!code) return '';
    const vars = { n: code === 'messageShort' ? LIMITS.minMessage : code === 'messageLong' ? LIMITS.message : code === 'nameLong' ? LIMITS.name : LIMITS.subject };
    return t('contact.errors.' + code, vars);
  };

  async function submit(e) {
    e.preventDefault();
    if (sending.current) return; // never send twice
    const errs = validateSuggestion(values);
    setErrors(errs);
    setErrorCode('');
    if (Object.keys(errs).length) {
      setStatus('error');
      setTimeout(() => summary.current && summary.current.focus(), 0);
      const first = ['message', 'email', 'name', 'subject', 'category', 'consent'].find((k) => errs[k]);
      const el = first && document.getElementById('sf-' + first);
      if (el) setTimeout(() => el.focus(), 30);
      return;
    }
    sending.current = true;
    setStatus('sending');
    try {
      await sendSuggestion(values, lang);
      setValues(EMPTY); // cleared only after confirmed success
      setStatus('success');
    } catch (err) {
      const code = err instanceof SendError ? err.code : 'failed';
      if (code === 'wait') setWaitSec(secondsUntilAllowed());
      setErrorCode(code);
      setStatus('error');
      setTimeout(() => summary.current && summary.current.focus(), 0);
    } finally {
      sending.current = false;
    }
  }

  const hasFieldErrors = Object.keys(errors).length > 0;
  const configured = emailConfigured();

  return (
    <form onSubmit={submit} noValidate aria-describedby="sf-privacy" className="grid gap-4" data-testid="suggestion-form">
      {status === 'success' && (
        <div role="status" tabIndex={-1} ref={summary} className="flex items-start gap-2.5 rounded-xl border border-ok/40 bg-ok/10 p-3.5 text-ok" data-testid="form-success">
          <CheckIcon className="mt-0.5 size-5 shrink-0" /><span className="font-semibold">{t('contact.success')}</span>
        </div>
      )}
      {status === 'error' && (hasFieldErrors || errorCode) && (
        <div role="alert" tabIndex={-1} ref={summary} className="flex items-start gap-2.5 rounded-xl border border-wrong/40 bg-wrong-bg p-3.5 text-wrong outline-none" data-testid="form-error">
          <AlertIcon className="mt-0.5 size-5 shrink-0" />
          <div>
            <p className="m-0 font-semibold">{hasFieldErrors ? t('contact.errors.summary') : t('contact.errors.' + errorCode, { n: waitSec })}</p>
            {hasFieldErrors && <ul className="m-0 mt-1 list-disc ps-5 text-sm">{Object.keys(errors).map((k) => <li key={k}>{errText(k)}</li>)}</ul>}
          </div>
        </div>
      )}
      {!configured && (
        <p className="m-0 rounded-xl border border-warn/40 bg-warn/10 p-3 text-sm text-warn" data-testid="not-configured">{t('contact.errors.notConfigured')}</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="sf-name" className="mb-1 block text-sm font-semibold">{t('contact.form.name')} <span className="font-normal text-faint">{t('contact.form.optional')}</span></label>
          <input id="sf-name" name="name" value={values.name} onChange={set('name')} autoComplete="name" maxLength={LIMITS.name + 20} placeholder={t('contact.form.namePlaceholder')}
            aria-invalid={!!errors.name} aria-describedby={errors.name ? 'sf-name-err' : undefined} className={field + (errors.name ? ' border-wrong' : ' border-line')} />
          {errors.name && <p id="sf-name-err" className="mt-1 text-sm text-wrong">{errText('name')}</p>}
        </div>
        <div>
          <label htmlFor="sf-email" className="mb-1 block text-sm font-semibold">{t('contact.form.email')} <span className="font-normal text-faint">{t('contact.form.optional')}</span></label>
          <input id="sf-email" name="email" type="email" dir="ltr" value={values.email} onChange={set('email')} autoComplete="email" inputMode="email" placeholder={t('contact.form.emailPlaceholder')}
            aria-invalid={!!errors.email} aria-describedby={'sf-email-help' + (errors.email ? ' sf-email-err' : '')} className={field + ' text-start' + (errors.email ? ' border-wrong' : ' border-line')} />
          <p id="sf-email-help" className="mt-1 text-xs text-faint">{t('contact.form.emailHelp')}</p>
          {errors.email && <p id="sf-email-err" className="text-sm text-wrong">{errText('email')}</p>}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="sf-category" className="mb-1 block text-sm font-semibold">{t('contact.form.category')}</label>
          <select id="sf-category" name="category" value={values.category} onChange={set('category')} aria-invalid={!!errors.category} className={field + ' border-line'}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{t('contact.categories.' + c)}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="sf-subject" className="mb-1 block text-sm font-semibold">{t('contact.form.subject')} <span className="font-normal text-faint">{t('contact.form.optional')}</span></label>
          <input id="sf-subject" name="subject" value={values.subject} onChange={set('subject')} maxLength={LIMITS.subject + 30} placeholder={t('contact.form.subjectPlaceholder')}
            aria-invalid={!!errors.subject} aria-describedby={errors.subject ? 'sf-subject-err' : undefined} className={field + (errors.subject ? ' border-wrong' : ' border-line')} />
          {errors.subject && <p id="sf-subject-err" className="mt-1 text-sm text-wrong">{errText('subject')}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="sf-message" className="mb-1 block text-sm font-semibold">{t('contact.form.message')} <span className="font-normal text-wrong">{t('contact.form.required')}</span></label>
        <textarea id="sf-message" name="message" rows={6} value={values.message} onChange={set('message')} required aria-required="true" placeholder={t('contact.form.messagePlaceholder')}
          aria-invalid={!!errors.message} aria-describedby={'sf-count' + (errors.message ? ' sf-message-err' : '')} className={field + ' resize-y' + (errors.message ? ' border-wrong' : ' border-line')} />
        <div className="mt-1 flex justify-between gap-3 text-xs">
          <span id="sf-message-err" className="text-sm text-wrong">{errors.message ? errText('message') : ''}</span>
          <span id="sf-count" className={values.message.length > LIMITS.message ? 'text-wrong' : 'text-faint'} dir="auto">{t('contact.form.count', { n: values.message.length, max: LIMITS.message })}</span>
        </div>
      </div>

      {/* Honeypot: invisible to people, tempting to bots. */}
      <div aria-hidden="true" className="absolute -start-[9999px] h-0 w-0 overflow-hidden">
        <label>Website<input tabIndex={-1} autoComplete="off" name="website" value={values.website} onChange={set('website')} /></label>
      </div>

      <div>
        <label htmlFor="sf-consent" className="flex cursor-pointer items-start gap-3 text-sm">
          <input id="sf-consent" type="checkbox" checked={values.consent} onChange={set('consent')} aria-invalid={!!errors.consent} aria-describedby={errors.consent ? 'sf-consent-err' : undefined} className="mt-1 size-5 shrink-0 accent-[var(--primary)]" />
          <span>{t('contact.form.consent')}</span>
        </label>
        {errors.consent && <p id="sf-consent-err" className="mt-1 text-sm text-wrong">{errText('consent')}</p>}
      </div>
      <p id="sf-privacy" className="m-0 text-xs text-faint">{t('contact.form.privacy')}</p>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="primary" size="lg" disabled={status === 'sending'} aria-busy={status === 'sending'} data-testid="send-button">
          {status === 'sending' ? <><span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />{t('contact.form.sending')}</> : <><SendIcon className="size-5 rtl:-scale-x-100" />{t('contact.form.send')}</>}
        </Button>
      </div>

      <div className="rounded-xl bg-surface2 p-3.5 text-sm">
        <b>{t('contact.alt')}</b>
        <div className="mt-2 flex flex-wrap gap-2">
          <a href={whatsappLink(t('wa.message'))} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-1.5 text-fg no-underline hover:border-primary-text"><WhatsAppIcon className="size-4 text-wa" />WhatsApp</a>
          <a href={'mailto:' + DEVELOPER.email} className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-1.5 text-fg no-underline hover:border-primary-text"><MailIcon className="size-4" /><bdi dir="ltr">{DEVELOPER.email}</bdi></a>
        </div>
      </div>
    </form>
  );
}
