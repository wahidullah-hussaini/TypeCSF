/* PwaContext - service worker registration, "update available" and the install prompt. */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from './StoreContext.jsx';

const PwaContext = createContext(null);

export function PwaProvider({ children }) {
  const { S } = useStore();
  const [swState, setSwState] = useState('checking'); // checking | ready | unsupported
  const [waiting, setWaiting] = useState(null);
  const [installEvent, setInstallEvent] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  const updateRequested = useRef(false);

  useEffect(() => {
    const on = () => setOnline(true), off = () => setOnline(false);
    window.addEventListener('online', on); window.addEventListener('offline', off);
    const before = (e) => { e.preventDefault(); setInstallEvent(e); };
    const after = () => { setInstallEvent(null); setInstalled(true); };
    window.addEventListener('beforeinstallprompt', before); window.addEventListener('appinstalled', after);
    return () => {
      window.removeEventListener('online', on); window.removeEventListener('offline', off);
      window.removeEventListener('beforeinstallprompt', before); window.removeEventListener('appinstalled', after);
    };
  }, []);

  useEffect(() => {
    if (!import.meta.env.PROD || !('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) { setSwState('unsupported'); return undefined; }
    let reloading = false;
    const onController = () => {
      /* The very first install also fires controllerchange; reload only for an update the learner asked for. */
      if (reloading || !updateRequested.current) return;
      reloading = true; S.flush(); location.reload();
    };
    navigator.serviceWorker.addEventListener('controllerchange', onController);
    navigator.serviceWorker.register('./sw.js').then((reg) => {
      setSwState('ready');
      if (reg.waiting && navigator.serviceWorker.controller) setWaiting(reg.waiting);
      reg.addEventListener('updatefound', () => {
        const w = reg.installing;
        if (!w) return;
        w.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) setWaiting(w); });
      });
    }).catch(() => setSwState('unsupported'));
    return () => navigator.serviceWorker.removeEventListener('controllerchange', onController);
  }, [S]);

  const applyUpdate = useCallback(() => {
    if (!waiting) return;
    updateRequested.current = true; S.flush(); waiting.postMessage({ type: 'SKIP_WAITING' });
  }, [waiting, S]);

  const install = useCallback(() => {
    if (!installEvent) return;
    installEvent.prompt();
    installEvent.userChoice.finally(() => setInstallEvent(null));
  }, [installEvent]);

  const standalone = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
  const value = useMemo(() => ({ swState, updateReady: !!waiting, applyUpdate, canInstall: !!installEvent, install, installed, standalone, online }),
    [swState, waiting, applyUpdate, installEvent, install, installed, standalone, online]);
  return <PwaContext.Provider value={value}>{children}</PwaContext.Provider>;
}

export function usePwa() {
  const ctx = useContext(PwaContext);
  if (!ctx) throw new Error('usePwa must be used inside <PwaProvider>');
  return ctx;
}
