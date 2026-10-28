import { useTranslation } from '../i18n/index.jsx';
import { Link } from '../router.jsx';
import { useStore } from '../context/StoreContext.jsx';
import { TOTAL, BOOK_PAGE_TOTAL, lessonsDone } from '../features/progress/progress.js';
import { Card, btnClass } from '../components/ui.jsx';
import DeveloperProfile from '../components/DeveloperProfile.jsx';
import { whatsappLink } from '../config.js';
import {
  ArrowRightIcon, BookIcon, ChartIcon, CheckIcon, GameIcon, KeyboardIcon, KeysIcon, SparkIcon, WhatsAppIcon, SendIcon,
} from '../components/icons.jsx';

const FEATURES = [['lessons', KeysIcon], ['handbook', BookIcon], ['keyboard', KeyboardIcon], ['practice', SparkIcon], ['games', GameIcon], ['progress', ChartIcon]];

export default function Home() {
  const { t, n } = useTranslation();
  const { state } = useStore();
  const done = lessonsDone(state);
  const started = done > 0 || state.totals.sessions > 0;
  const Arrow = ArrowRightIcon;
  const stats = [[n(TOTAL), t('home.stats.lessons')], [n(BOOK_PAGE_TOTAL), t('home.stats.pages')], [n(3), t('home.stats.languages')], [t('home.stats.yes'), t('home.stats.offline')]];

  return (
    <div className="flex flex-col gap-16">
      {/* hero */}
      <section aria-labelledby="hero-title" className="relative overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-surface via-surface to-primary-soft px-5 py-10 sm:px-10 sm:py-14">
        <div aria-hidden="true" className="pointer-events-none absolute -end-24 -top-24 size-72 rounded-full bg-accent-soft blur-3xl" />
        <div className="relative grid items-center gap-10 lg:grid-cols-[1.15fr_1fr]">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-accent-soft px-3 py-1 text-xs font-bold text-accent"><SparkIcon className="size-3.5" />{t('home.hero.eyebrow')}</p>
            <h1 id="hero-title" className="text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">{t('home.hero.title')}</h1>
            <p className="mt-4 max-w-xl text-lg text-dim">{t('home.hero.subtitle')}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/learn" className={btnClass('primary', 'lg', 'no-underline')} data-testid="cta-start">
                {started ? t('home.hero.continue') : t('home.hero.start')}<Arrow className="size-5 rtl:-scale-x-100" />
              </Link>
              <Link to="/about" className={btnClass('default', 'lg', 'no-underline')}>{t('home.hero.about')}</Link>
            </div>
          </div>
          <div aria-hidden="true" className="select-none rounded-2xl border border-line bg-bg2 p-5 shadow-card motion-safe:animate-float" dir="ltr">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-faint" dir="auto">{t('home.hero.previewTitle')}</p>
            <p className="font-mono text-lg leading-8 sm:text-xl">
              <span className="text-correct">A computer follows </span>
              <span className="rounded bg-primary-soft text-fg underline decoration-accent decoration-2 underline-offset-4">in</span>
              <span className="text-pending">structions to process data.</span>
            </p>
            <div className="mt-4 flex gap-2 text-xs"><span className="rounded-lg bg-surface2 px-2 py-1">52 WPM</span><span className="rounded-lg bg-surface2 px-2 py-1">98%</span></div>
          </div>
        </div>
        <dl className="relative mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map(([v, l]) => (
            <div key={l} className="rounded-2xl border border-line bg-bg/60 px-4 py-3 text-center"><dt className="sr-only">{l}</dt><dd className="m-0"><b className="block text-2xl tabular-nums text-primary-text">{v}</b><span className="text-xs text-dim">{l}</span></dd></div>
          ))}
        </dl>
      </section>

      {/* features */}
      <section aria-labelledby="features-title">
        <h2 id="features-title" className="text-2xl font-extrabold">{t('home.features.title')}</h2>
        <p className="mb-6 mt-1 max-w-2xl text-dim">{t('home.features.subtitle')}</p>
        <ul className="m-0 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(([k, Icon]) => (
            <li key={k}><Card as="div" className="h-full transition-all hover:-translate-y-0.5 hover:border-primary-text motion-reduce:transform-none">
              <span className="mb-3 grid size-10 place-items-center rounded-xl bg-primary-soft text-primary-text"><Icon className="size-5" /></span>
              <h3 className="mb-1 font-bold">{t('home.features.' + k + '.title')}</h3>
              <p className="text-sm text-dim">{t('home.features.' + k + '.text')}</p>
            </Card></li>
          ))}
        </ul>
      </section>

      {/* how it works */}
      <section aria-labelledby="how-title">
        <h2 id="how-title" className="mb-6 text-2xl font-extrabold">{t('home.how.title')}</h2>
        <ol className="m-0 grid list-none gap-4 p-0 md:grid-cols-3">
          {['s1', 's2', 's3'].map((s, i) => (
            <li key={s} className="flex gap-4 rounded-2xl border border-line bg-surface p-5">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary font-extrabold text-primary-ink" aria-hidden="true">{n(i + 1)}</span>
              <div><h3 className="font-bold">{t('home.how.' + s + '.title')}</h3><p className="mt-1 text-sm text-dim">{t('home.how.' + s + '.text')}</p></div>
            </li>
          ))}
        </ol>
      </section>

      {/* progress + CS */}
      <section className="grid gap-5 lg:grid-cols-2" aria-label={t('home.progress.title')}>
        <Card className="h-full">
          <h2 className="mb-2 text-xl font-extrabold">{t('home.progress.title')}</h2>
          <p className="mb-4 text-dim">{t('home.progress.text')}</p>
          <ul className="m-0 grid list-none gap-2 p-0 text-sm">
            {['b1', 'b2', 'b3', 'b4'].map((b) => <li key={b} className="flex gap-2"><CheckIcon className="mt-0.5 size-4 shrink-0 text-ok" />{t('home.progress.' + b)}</li>)}
          </ul>
          <Link to="/dashboard" className={btnClass('default', 'md', 'mt-5 no-underline')}>{t('nav.dashboard')}</Link>
        </Card>
        <Card className="h-full">
          <h2 className="mb-2 text-xl font-extrabold">{t('home.cs.title')}</h2>
          <p className="mb-4 text-dim">{t('home.cs.text')}</p>
          <p className="rounded-xl bg-surface2 p-3 text-sm text-dim">{t('home.cs.topics')}</p>
          <div className="mt-5 border-t border-line pt-4">
            <h3 className="font-bold">{t('home.install.title')}</h3>
            <p className="mb-3 text-sm text-dim">{t('home.install.text')}</p>
            <Link to="/settings" className={btnClass('ghost', 'sm', 'no-underline')}>{t('home.install.cta')}</Link>
          </div>
        </Card>
      </section>

      {/* developer */}
      <section aria-labelledby="dev-title">
        <h2 id="dev-title" className="text-2xl font-extrabold">{t('home.dev.title')}</h2>
        <p className="mb-5 mt-1 text-dim">{t('home.dev.text')}</p>
        <DeveloperProfile compact />
        <Link to="/about" className={btnClass('default', 'md', 'mt-4 no-underline')}>{t('home.dev.cta')}</Link>
      </section>

      {/* contact */}
      <section aria-labelledby="contact-title" className="rounded-3xl border border-line bg-gradient-to-br from-primary-soft to-surface p-6 text-center sm:p-10">
        <h2 id="contact-title" className="text-2xl font-extrabold">{t('home.contact.title')}</h2>
        <p className="mx-auto mb-6 mt-2 max-w-xl text-dim">{t('home.contact.text')}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/contact" className={btnClass('primary', 'lg', 'no-underline')}><SendIcon className="size-5" />{t('home.contact.form')}</Link>
          <a href={whatsappLink(t('wa.message'))} target="_blank" rel="noopener noreferrer" className={btnClass('default', 'lg', 'no-underline')}><WhatsAppIcon className="size-5 text-wa" />{t('home.contact.wa')}</a>
        </div>
      </section>
    </div>
  );
}
