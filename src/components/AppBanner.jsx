/* AppBanner - one-time notices: data recovery, blocked storage, update ready, offline. */
import { useState } from 'react';
import { useTranslation } from '../i18n/index.jsx';
import { useStore } from '../context/StoreContext.jsx';
import { usePwa } from '../context/PwaContext.jsx';
import { Button } from './ui.jsx';

export default function AppBanner() {
  const { t } = useTranslation();
  const { notice, persistent } = useStore();
  const { updateReady, applyUpdate, online } = usePwa();
  const [dismissed, setDismissed] = useState({});
  const rows = [];
  if (notice && !dismissed.notice) rows.push({ id: 'notice', text: t('banner.' + notice), dismiss: true });
  if (!persistent) rows.push({ id: 'blocked', text: t('banner.blocked') });
  if (updateReady) rows.push({ id: 'update', text: t('banner.update'), action: <Button size="sm" variant="primary" onClick={applyUpdate}>{t('banner.updateNow')}</Button> });
  if (!online && !dismissed.offline) rows.push({ id: 'offline', text: t('banner.offline'), dismiss: true });
  if (!rows.length) return null;
  return (
    <div className="border-b border-line bg-surface2" role="status">
      {rows.map((r) => (
        <div key={r.id} className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-2 text-sm">
          <span className="flex-1">{r.text}</span>
          {r.action}
          {r.dismiss && <Button size="sm" onClick={() => setDismissed((d) => ({ ...d, [r.id === 'notice' ? 'notice' : 'offline']: true }))}>{t('common.dismiss')}</Button>}
        </div>
      ))}
    </div>
  );
}
