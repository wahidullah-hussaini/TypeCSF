import { useTranslation } from '../i18n/index.jsx';
import { PageHead } from '../components/ui.jsx';
import SuggestionForm from '../components/SuggestionForm.jsx';

export default function Contact() {
  const { t } = useTranslation();
  return (
    <>
      <PageHead title={t('contact.title')} subtitle={t('contact.subtitle')} />
      <div className="mx-auto max-w-2xl"><SuggestionForm /></div>
    </>
  );
}
