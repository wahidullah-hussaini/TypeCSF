/* StoreContext - connects the validated localStorage store (lib/storage.js) to React,
   applies the saved settings (theme, motion, sound) and flushes data when the page hides. */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { createStore } from '../lib/storage.js';
import { sound } from '../lib/sound.js';

const S = createStore();
const StoreContext = createContext(null);

function resolveTheme(theme) {
  if (theme === 'light' || theme === 'dark') return theme;
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export function StoreProvider({ children }) {
  const [version, setVersion] = useState(0);
  const [notice] = useState(() => S.takeNotice());

  useEffect(() => S.onChange(() => setVersion((v) => v + 1)), []);

  /* Never lose a score that the save debounce had not reached yet. */
  useEffect(() => {
    const flush = () => S.flush();
    const onVis = () => { if (document.hidden) S.flush(); };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onVis);
    return () => { window.removeEventListener('pagehide', flush); document.removeEventListener('visibilitychange', onVis); };
  }, []);

  const settings = S.state.settings;

  useEffect(() => {
    const apply = () => {
      const theme = resolveTheme(settings.theme);
      const root = document.documentElement;
      root.setAttribute('data-theme', theme);
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', theme === 'light' ? '#f7f4ee' : '#0f1b3d');
      const system = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      root.setAttribute('data-motion', settings.reducedMotion === 'on' || (settings.reducedMotion === 'system' && system) ? 'reduce' : 'full');
    };
    apply();
    const mqs = ['(prefers-color-scheme: light)', '(prefers-reduced-motion: reduce)'].map((q) => window.matchMedia && window.matchMedia(q)).filter(Boolean);
    mqs.forEach((m) => m.addEventListener && m.addEventListener('change', apply));
    return () => mqs.forEach((m) => m.removeEventListener && m.removeEventListener('change', apply));
  }, [settings.theme, settings.reducedMotion]);

  useEffect(() => { sound.setEnabled(settings.sound); }, [settings.sound]);

  const value = useMemo(() => ({
    S,
    state: S.state,
    settings: S.state.settings,
    version,
    notice,
    persistent: S.persistent,
    setSetting: (key, v) => S.update((d) => { d.settings[key] = v; }),
    resolvedTheme: resolveTheme(S.state.settings.theme),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [version, notice]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>');
  return ctx;
}
