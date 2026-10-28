import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { CheckIcon, AlertIcon } from '../components/icons.jsx';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const nextId = useRef(1);

  const toast = useCallback((message, kind = 'ok') => {
    const id = nextId.current++;
    setItems((list) => [...list.slice(-3), { id, message, kind }]);
    window.setTimeout(() => setItems((list) => list.filter((x) => x.id !== id)), 3600);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-[calc(var(--topbar-h)+0.5rem)] z-[70] flex flex-col items-center gap-2 px-3" aria-live="polite" role="status">
        {items.map((it) => (
          <div key={it.id} className="pointer-events-auto flex w-full max-w-md items-start gap-2 rounded-xl border border-line bg-surface2 px-3 py-2.5 text-sm text-fg shadow-card motion-safe:animate-pop">
            <span className={it.kind === 'warn' ? 'mt-0.5 text-warn' : 'mt-0.5 text-ok'}>
              {it.kind === 'warn' ? <AlertIcon className="size-4" /> : <CheckIcon className="size-4" />}
            </span>
            <span>{it.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx.toast;
}
