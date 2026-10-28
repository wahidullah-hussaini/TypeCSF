import { Link } from '../router.jsx';
import { useTranslation } from '../i18n/index.jsx';
import { DEVELOPER, whatsappLink } from '../config.js';
import { MailIcon, WhatsAppIcon } from './icons.jsx';

export default function Footer() {
  const { t } = useTranslation();
  const links = [['/learn', 'nav.learn'], ['/practice', 'nav.practice'], ['/games', 'nav.games'], ['/quiz', 'nav.quiz'], ['/dashboard', 'nav.dashboard']];
  return (
    <footer className="border-t border-line bg-bg2 pb-24 pt-10 text-sm">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="mb-2 text-lg font-extrabold" dir="ltr">Type<b className="text-accent">CSF</b></p>
          <p className="max-w-sm text-dim">{t('app.tagline')}</p>
          <p className="mt-3 text-xs text-faint">{t('footer.privacy')}</p>
        </div>
        <nav aria-label={t('footer.quick')}>
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-faint">{t('footer.quick')}</h2>
          <ul className="m-0 grid list-none gap-1.5 p-0">
            {links.map(([to, key]) => <li key={to}><Link to={to} className="text-dim no-underline hover:text-fg">{t(key)}</Link></li>)}
            <li><Link to="/about" className="text-dim no-underline hover:text-fg">{t('footer.about')}</Link></li>
            <li><Link to="/contact" className="text-dim no-underline hover:text-fg">{t('footer.contact')}</Link></li>
          </ul>
        </nav>
        <div>
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-faint">{t('footer.reach')}</h2>
          <ul className="m-0 grid list-none gap-2 p-0">
            <li><a href={'mailto:' + DEVELOPER.email} className="inline-flex items-center gap-2 text-dim no-underline hover:text-fg"><MailIcon className="size-4" /><bdi dir="ltr">{DEVELOPER.email}</bdi></a></li>
            <li><a href={whatsappLink(t('wa.message'))} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-dim no-underline hover:text-fg"><WhatsAppIcon className="size-4 text-wa" /><bdi dir="ltr">{DEVELOPER.whatsappDisplay}</bdi></a></li>
          </ul>
        </div>
      </div>
      <p className="mx-auto mt-8 max-w-6xl border-t border-line px-4 pt-4 text-xs text-faint sm:px-6"><span>{t('footer.credit')}</span> <span aria-hidden="true">|</span> <span>{t('footer.rights')}</span></p>
    </footer>
  );
}
