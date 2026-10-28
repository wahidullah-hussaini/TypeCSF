/* FloatingWhatsAppButton - always-reachable WhatsApp link to the developer.
   - opens https://wa.me/<number>?text=<translated, URL-encoded message>; the person
     reviews and sends the message themselves (nothing is sent automatically)
   - pulsing ring + gentle float, both switched off by reduced-motion settings
   - tooltip on hover AND keyboard focus; a short speech bubble appears once per
     visit for touch users who cannot hover
   - calm (smaller, no animation) on the typing page so it never distracts */
import { useEffect, useState } from 'react';
import { useTranslation } from '../i18n/index.jsx';
import { whatsappLink } from '../config.js';
import { CloseIcon, WhatsAppIcon } from './icons.jsx';

const SEEN = 'typecsf.waBubble';

export default function FloatingWhatsAppButton({ calm }) {
  const { t } = useTranslation();
  const [bubble, setBubble] = useState(false);

  useEffect(() => {
    if (calm) { setBubble(false); return undefined; }
    let seen = false;
    try { seen = sessionStorage.getItem(SEEN) === '1'; } catch (e) { /* ignore */ }
    if (seen) return undefined;
    const show = setTimeout(() => setBubble(true), 5000);
    return () => clearTimeout(show);
  }, [calm]);

  useEffect(() => {
    if (!bubble) return undefined;
    const hide = setTimeout(() => dismiss(), 9000);
    return () => clearTimeout(hide);
  }, [bubble]);

  function dismiss() {
    setBubble(false);
    try { sessionStorage.setItem(SEEN, '1'); } catch (e) { /* ignore */ }
  }

  const size = calm ? 'size-12' : 'size-14';
  return (
    <div className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] end-4 z-30 flex flex-col items-end gap-2 sm:end-6" data-testid="wa-wrap">
      {bubble && !calm && (
        <div role="status" className="relative max-w-[15rem] rounded-2xl border border-line bg-surface px-3.5 py-2.5 pe-8 text-sm text-fg shadow-card motion-safe:animate-pop">
          {t('wa.bubble')}
          <button type="button" aria-label={t('wa.closeBubble')} onClick={dismiss} className="absolute end-1.5 top-1.5 rounded-md p-1 text-faint hover:text-fg"><CloseIcon className="size-3.5" /></button>
        </div>
      )}
      <a
        href={whatsappLink(t('wa.message'))} target="_blank" rel="noopener noreferrer"
        aria-label={t('wa.label')} data-testid="wa-button" onClick={() => { try { sessionStorage.setItem(SEEN, '1'); } catch (e) { /* ignore */ } }}
        className={'group relative grid place-items-center rounded-full bg-wa text-white shadow-lg shadow-black/30 transition-transform hover:scale-105 focus-visible:scale-105 active:scale-95 ' + size + (calm ? '' : ' motion-safe:animate-float')}
      >
        {!calm && <span className="pointer-events-none absolute inset-0 rounded-full bg-wa motion-safe:animate-ring" aria-hidden="true" />}
        <WhatsAppIcon className={calm ? 'relative size-6' : 'relative size-8'} />
        <span role="tooltip" className="pointer-events-none absolute end-full me-3 hidden whitespace-nowrap rounded-lg bg-surface px-3 py-1.5 text-sm font-semibold text-fg opacity-0 shadow-card ring-1 ring-line transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 sm:block">
          {t('wa.tooltip')}
        </span>
      </a>
    </div>
  );
}
