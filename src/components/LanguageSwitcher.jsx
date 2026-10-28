/* LanguageSwitcher - English / دری / پښتو. Always visible in the header. */
import { useTranslation } from '../i18n/index.jsx';

export default function LanguageSwitcher({ className = '' }) {
  const { lang, setLang, languages, t } = useTranslation();
  return (
    <div role="group" aria-label={t('lang.label')} className={'inline-flex rounded-xl border border-line bg-surface2 p-[3px] ' + className} data-testid="language-switcher">
      {languages.map((l) => (
        <button
          key={l.code} type="button" lang={l.code} dir={l.dir} data-lang={l.code}
          aria-pressed={lang === l.code} aria-label={t('lang.' + l.code)} title={t('lang.' + l.code)}
          onClick={() => setLang(l.code)}
          className={'rounded-[9px] px-2 py-1 sm:px-2.5 text-sm font-bold leading-6 transition-colors ' + (lang === l.code ? 'bg-primary text-primary-ink' : 'text-dim hover:text-fg')}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
