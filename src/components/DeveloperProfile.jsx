/* DeveloperProfile - the "About the developer" card.
   Facts shown: name, role, university, project, e-mail and WhatsApp only. Nothing else is claimed. */
import { useState } from 'react';
import { useTranslation } from '../i18n/index.jsx';
import { DEVELOPER, whatsappLink } from '../config.js';
import { Link } from '../router.jsx';
import { btnClass } from './ui.jsx';
import { MailIcon, SendIcon, WhatsAppIcon } from './icons.jsx';

export default function DeveloperProfile({ compact = false }) {
  const { t } = useTranslation();
  const [noPhoto, setNoPhoto] = useState(false);
  return (
    <article
      aria-label={t('dev.cardLabel')} data-testid="developer-card"
      className="group relative overflow-hidden rounded-3xl border border-line bg-surface shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/20 focus-within:-translate-y-1 focus-within:shadow-2xl active:-translate-y-0.5 motion-reduce:transition-none"
    >
      <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-accent to-primary opacity-70 transition-opacity group-hover:opacity-100" />
      <div className={'grid gap-0 ' + (compact ? 'sm:grid-cols-[11rem_1fr]' : 'md:grid-cols-[17rem_1fr]')}>
        <div className="relative overflow-hidden bg-gradient-to-br from-primary-soft to-accent-soft">
          {noPhoto ? (
            <div role="img" aria-label={t('dev.photoAlt')} className="grid aspect-[3/4] place-items-center text-6xl font-black text-primary-text">W</div>
          ) : (
            <img
              src={DEVELOPER.photo} alt={t('dev.photoAlt')} width="640" height="800" loading="lazy" onError={() => setNoPhoto(true)}
              className="aspect-[3/4] size-full object-cover transition-transform duration-500 group-hover:scale-105 group-focus-within:scale-105 motion-reduce:transition-none"
            />
          )}
        </div>
        <div className="flex flex-col gap-3 p-5 sm:p-7">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight">{t('dev.name')}</h2>
            <p className="font-semibold text-accent">{t('dev.role')}</p>
            <p className="text-sm text-dim">{t('dev.education')}</p>
          </div>
          <p className="text-dim">{t('dev.bio')}</p>
          <p className="text-sm"><b>{t('dev.project')}:</b> <span className="text-dim">{t('dev.projectText')}</span></p>
          <ul className="m-0 grid list-none gap-2 p-0 text-sm sm:grid-cols-2">
            <li>
              <a href={'mailto:' + DEVELOPER.email} className="flex items-center gap-2.5 rounded-xl border border-line bg-surface2 px-3 py-2.5 text-fg no-underline transition-colors hover:border-primary-text">
                <MailIcon className="size-5 text-primary-text transition-transform group-hover:-translate-y-0.5" />
                <span className="min-w-0"><span className="block text-xs text-faint">{t('dev.email')}</span><bdi dir="ltr" className="block truncate">{DEVELOPER.email}</bdi></span>
              </a>
            </li>
            <li>
              <a href={whatsappLink(t('wa.message'))} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 rounded-xl border border-line bg-surface2 px-3 py-2.5 text-fg no-underline transition-colors hover:border-primary-text">
                <WhatsAppIcon className="size-5 text-wa" />
                <span className="min-w-0"><span className="block text-xs text-faint">{t('dev.whatsapp')}</span><bdi dir="ltr" className="block">{DEVELOPER.whatsappDisplay}</bdi></span>
              </a>
            </li>
          </ul>
          <div className="mt-1 flex flex-wrap gap-2.5">
            <a
              href={whatsappLink(t('wa.message'))} target="_blank" rel="noopener noreferrer" data-testid="dev-wa-button"
              className={btnClass('default', 'md', 'relative border-0 bg-wa !text-wa-ink hover:brightness-110 motion-safe:group-hover:animate-pulse') }
            >
              <WhatsAppIcon className="size-5" />{t('dev.chat')}
            </a>
            <Link to="/contact" className={btnClass('primary', 'md', 'no-underline')}><SendIcon className="size-4 rtl:-scale-x-100" />{t('dev.sendSuggestion')}</Link>
          </div>
        </div>
      </div>
    </article>
  );
}
