/* App - providers, page shell and routes.
   The Learn page stays mounted (just hidden) while other pages are shown, so a lesson,
   a half-typed run and the results card all survive navigation and language changes. */
import { Suspense, lazy, useEffect, useRef } from 'react';
import { I18nProvider, useTranslation } from './i18n/index.jsx';
import { StoreProvider } from './context/StoreContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { PwaProvider } from './context/PwaContext.jsx';
import { ActivityProvider } from './context/ActivityContext.jsx';
import { useLocation } from './router.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import AppBanner from './components/AppBanner.jsx';
import FloatingWhatsAppButton from './components/FloatingWhatsAppButton.jsx';
import Learn from './pages/Learn.jsx';
import Home from './pages/Home.jsx';
import NotFound from './pages/NotFound.jsx';

const Practice = lazy(() => import('./pages/Practice.jsx'));
const Games = lazy(() => import('./pages/Games.jsx'));
const Quiz = lazy(() => import('./pages/Quiz.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const Settings = lazy(() => import('./pages/Settings.jsx'));
const About = lazy(() => import('./pages/About.jsx'));
const Contact = lazy(() => import('./pages/Contact.jsx'));

const PAGES = { '/': Home, '/practice': Practice, '/games': Games, '/quiz': Quiz, '/dashboard': Dashboard, '/settings': Settings, '/about': About, '/contact': Contact };
const TITLE_KEY = { '/': null, '/practice': 'nav.practice', '/games': 'nav.games', '/quiz': 'nav.quiz', '/dashboard': 'nav.dashboard', '/settings': 'nav.settings', '/about': 'nav.about', '/contact': 'nav.contact' };

function Shell() {
  const { t, lang } = useTranslation();
  const { pathname, known } = useLocation();
  const mainRef = useRef(null);
  const first = useRef(true);
  const onLearn = pathname === '/learn';
  const Page = PAGES[pathname];

  /* Document title and description follow the language and the page. */
  useEffect(() => {
    if (onLearn) return; // the Learn page sets its own title
    const key = TITLE_KEY[pathname];
    document.title = key ? t(key) + ' — TypeCSF' : known ? t('app.docTitle') : t('notFound.title') + ' — TypeCSF';
  }, [pathname, lang, onLearn, known, t]);
  useEffect(() => {
    const m = document.querySelector('meta[name="description"]');
    if (m) m.setAttribute('content', t('app.docDescription'));
  }, [lang, t]);

  /* New page: scroll up and move focus to it (not on first load). */
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    window.scrollTo(0, 0);
    const el = document.getElementById(onLearn ? 'main-learn' : 'main-page');
    if (el) el.focus({ preventScroll: true });
  }, [pathname, onLearn]);

  const skip = (e) => {
    e.preventDefault();
    const el = document.getElementById(onLearn ? 'main-learn' : 'main-page');
    if (el) { el.focus(); el.scrollIntoView(); }
  };

  return (
    <>
      <a href="#main-page" onClick={skip} className="fixed start-3 top-2 z-[100] -translate-y-20 rounded-xl bg-primary px-4 py-2 font-bold text-primary-ink focus:translate-y-0">{t('nav.skip')}</a>
      <Navbar />
      <AppBanner />
      <Learn active={onLearn} />
      {!onLearn && (
        <>
          <main id="main-page" tabIndex={-1} className="mx-auto min-h-[60vh] w-full max-w-6xl px-4 py-8 outline-none sm:px-6 sm:py-10">
            <Suspense fallback={<p className="py-20 text-center text-dim" role="status">{t('app.loading')}</p>}>
              {known && Page ? <Page /> : <NotFound />}
            </Suspense>
          </main>
          <Footer />
        </>
      )}
      <FloatingWhatsAppButton calm={onLearn} />
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <I18nProvider>
        <StoreProvider>
          <ToastProvider>
            <PwaProvider>
              <ActivityProvider>
                <Shell />
              </ActivityProvider>
            </PwaProvider>
          </ToastProvider>
        </StoreProvider>
      </I18nProvider>
    </ErrorBoundary>
  );
}
