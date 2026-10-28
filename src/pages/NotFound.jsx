import { useTranslation } from '../i18n/index.jsx';
import { Link } from '../router.jsx';
import { btnClass } from '../components/ui.jsx';

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <p className="text-6xl font-black text-accent" aria-hidden="true" dir="ltr">404</p>
      <h1 className="mt-3 text-2xl font-extrabold">{t('notFound.title')}</h1>
      <p className="mt-2 text-dim">{t('notFound.text')}</p>
      <Link to="/" className={btnClass('primary', 'lg', 'mt-6 no-underline')}>{t('notFound.cta')}</Link>
    </div>
  );
}
