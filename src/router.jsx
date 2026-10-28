/* =============================================================================
 * Tiny hash router: "#/learn", "#/about" ... No server configuration is needed
 * (works from any folder, from GitHub Pages and offline). The API deliberately
 * mirrors react-router (Link, useNavigate, useLocation) so it can be swapped.
 * ========================================================================== */
import { useSyncExternalStore } from 'react';

export const ROUTES = ['/', '/learn', '/practice', '/games', '/quiz', '/dashboard', '/settings', '/about', '/contact'];

function subscribe(cb) {
  window.addEventListener('hashchange', cb);
  window.addEventListener('popstate', cb);
  return () => { window.removeEventListener('hashchange', cb); window.removeEventListener('popstate', cb); };
}

export function currentPath() {
  const m = /^#(\/[a-z]*)/.exec(window.location.hash || '');
  return m ? m[1] : '/';
}

export function useLocation() {
  const pathname = useSyncExternalStore(subscribe, currentPath, () => '/');
  return { pathname, known: ROUTES.includes(pathname) };
}

export function navigate(to) {
  if (currentPath() === to) return;
  try { window.history.pushState(null, '', '#' + to); } catch (e) { window.location.hash = '#' + to; }
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

export function useNavigate() { return navigate; }

export function Link({ to, children, onClick, ...rest }) {
  return (
    <a
      href={'#' + to}
      onClick={(e) => {
        if (onClick) onClick(e);
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        navigate(to);
      }}
      {...rest}
    >
      {children}
    </a>
  );
}
