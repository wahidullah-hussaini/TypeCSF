/* ConfirmDialog - accessible modal built on the native <dialog> element. */
import { useEffect, useRef } from 'react';
import { useTranslation } from '../i18n/index.jsx';
import { Button } from './ui.jsx';

export default function ConfirmDialog({ open, title, children, actions, onClose }) {
  const { t } = useTranslation();
  const ref = useRef(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) { if (d.showModal) d.showModal(); else d.setAttribute('open', ''); }
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} aria-labelledby="dlg-title" onCancel={(e) => { e.preventDefault(); onClose(null); }} onClick={(e) => { if (e.target === ref.current) onClose(null); }}
      className="m-auto w-[min(92vw,30rem)] rounded-2xl border border-line bg-surface p-5 text-fg shadow-card backdrop:bg-black/60">
      <h2 id="dlg-title" className="mb-2 text-lg font-bold">{title}</h2>
      <div className="text-sm text-dim">{children}</div>
      <div className="mt-5 flex flex-wrap justify-end gap-2">
        <Button onClick={() => onClose(null)}>{t('common.cancel')}</Button>
        {actions.map((a) => <Button key={a.value} variant={a.danger ? 'danger' : 'primary'} onClick={() => onClose(a.value)}>{a.label}</Button>)}
      </div>
    </dialog>
  );
}
