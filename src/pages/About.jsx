import { useTranslation } from '../i18n/index.jsx';
import { Card, PageHead, SectionTitle } from '../components/ui.jsx';
import DeveloperProfile from '../components/DeveloperProfile.jsx';

export default function About() {
  const { t } = useTranslation();
  return (
    <>
      <PageHead title={t('about.title')} subtitle={t('about.subtitle')} />
      <DeveloperProfile />
      <SectionTitle id="measure-h">{t('about.measure.title')}</SectionTitle>
      <Card aria-labelledby="measure-h">
        <ul className="m-0 grid list-disc gap-2.5 ps-5 text-dim">
          {['wpm', 'raw', 'cpm', 'acc', 'cons', 'done', 'privacy'].map((k) => <li key={k}>{t('about.measure.' + k)}</li>)}
        </ul>
      </Card>
      <p className="mt-6 text-sm text-dim"><b>{t('about.tech')}:</b> {t('about.techList')}</p>
    </>
  );
}
