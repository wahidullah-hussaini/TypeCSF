import { useEffect, useState } from 'react';
import { Link, useLocation } from '../router.jsx';
import { useTranslation } from '../i18n/index.jsx';
import { useStore } from '../context/StoreContext.jsx';
import { TOTAL, lessonsDone } from '../features/progress/progress.js';
import LanguageSwitcher from './LanguageSwitcher.jsx';
import { CheckIcon, CloseIcon, GearIcon, KeyboardIcon, MenuIcon, MoonIcon, SunIcon, VolumeIcon, VolumeOffIcon } from './icons.jsx';

const LINKS = [['/', 'nav.home'], ['/learn', 'nav.learn'], ['/practice', 'nav.practice'], ['/games', 'nav.games'], ['/quiz', 'nav.quiz'], ['/dashboard', 'nav.dashboard'], ['/about', 'nav.about'], ['/contact', 'nav.contact']];

function ToolButton({ label, pressed, onClick, children, testid }) {
  return (
    <button type="button" aria-label={label} title={label} aria-pressed={pressed} onClick={onClick} data-testid={testid}
      className="grid size-9 place-items-center rounded-xl text-dim transition-colors hover:bg-surface2 hover:text-fg aria-pressed:text-accent">
      {children}
    </button>
  );
}

export default function Navbar() {
  const { t, n } = useTranslation();
  const { state, settings, setSetting, resolvedTheme } = useStore();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  useEffect(() => { setOpen(false); }, [pathname]);
  const done = lessonsDone(state);

  const tools = (
    <>
      <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-bold text-accent" title={t('nav.lessonsDone')} aria-label={t('nav.lessonsDone') + ': ' + done + ' / ' + TOTAL} id="progressChip">
        <CheckIcon className="size-3.5" /><span dir="ltr">{n(done)} / {n(TOTAL)}</span>
      </span>
      <ToolButton label={t('tools.keyboard')} pressed={settings.keyboard} onClick={() => setSetting('keyboard', !settings.keyboard)} testid="kb-toggle"><KeyboardIcon /></ToolButton>
      <ToolButton label={t('tools.sound')} pressed={settings.sound} onClick={() => setSetting('sound', !settings.sound)} testid="sound-toggle">{settings.sound ? <VolumeIcon /> : <VolumeOffIcon />}</ToolButton>
      <ToolButton label={t('tools.theme')} onClick={() => setSetting('theme', resolvedTheme === 'dark' ? 'light' : 'dark')} testid="theme-toggle">{resolvedTheme === 'dark' ? <SunIcon /> : <MoonIcon />}</ToolButton>
      <Link to="/settings" aria-label={t('nav.settings')} title={t('nav.settings')} aria-current={pathname === '/settings' ? 'page' : undefined} className="grid size-9 place-items-center rounded-xl text-dim hover:bg-surface2 hover:text-fg aria-[current=page]:text-accent"><GearIcon /></Link>
    </>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur" style={{ height: 'var(--topbar-h)' }}>
      <div className="mx-auto flex h-full max-w-[1600px] items-center gap-1 px-2.5 sm:gap-2 sm:px-5">
        <Link to="/" aria-label={t('nav.brand')} className="me-1 flex items-center gap-2 font-extrabold tracking-tight text-fg no-underline" dir="ltr">
          <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-primary to-accent text-base text-white" aria-hidden="true">T</span>
          <span className="text-lg">Type<b className="text-accent">CSF</b></span>
        </Link>
        <nav aria-label={t('nav.main')} className="hidden items-center gap-0.5 xl:flex">
          {LINKS.map(([to, key]) => (
            <Link key={to} to={to} aria-current={pathname === to ? 'page' : undefined}
              className="rounded-xl px-2.5 py-1.5 text-sm font-semibold text-dim no-underline transition-colors hover:bg-surface2 hover:text-fg aria-[current=page]:bg-primary-soft aria-[current=page]:text-primary-text">{t(key)}</Link>
          ))}
        </nav>
        <div className="ms-auto flex items-center gap-1 sm:gap-1.5">
          <div className="hidden items-center gap-1 sm:flex">{tools}</div>
          <LanguageSwitcher />
          <button type="button" aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? t('nav.closeMenu') : t('nav.openMenu')} onClick={() => setOpen((v) => !v)}
            className="grid size-9 place-items-center rounded-xl text-fg hover:bg-surface2 xl:hidden">
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>
      {open && (
        <div id="mobile-menu" className="absolute inset-x-0 top-full border-b border-line bg-bg shadow-card xl:hidden motion-safe:animate-pop">
          <nav aria-label={t('nav.main')} className="mx-auto grid max-w-3xl gap-1 p-3 sm:grid-cols-2">
            {LINKS.concat([['/settings', 'nav.settings']]).map(([to, key]) => (
              <Link key={to} to={to} aria-current={pathname === to ? 'page' : undefined}
                className="rounded-xl px-3 py-2.5 font-semibold text-dim no-underline hover:bg-surface2 hover:text-fg aria-[current=page]:bg-primary-soft aria-[current=page]:text-primary-text">{t(key)}</Link>
            ))}
          </nav>
          <div className="flex items-center gap-1 border-t border-line p-3 sm:hidden">{tools}</div>
        </div>
      )}
    </header>
  );
}
