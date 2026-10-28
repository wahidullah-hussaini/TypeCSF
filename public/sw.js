/* =============================================================================
 * sw.js - offline support for TypeCSF (hand-written, no plugin needed)
 * -----------------------------------------------------------------------------
 * scripts/postbuild.mjs replaces the two placeholders below with the real list
 * of built files and a version derived from their content, so every new build
 * gets a new cache automatically.
 *
 * - All built files are precached on install (works offline after first visit).
 * - Same-origin GET requests: cache first, refreshed quietly in the background.
 * - Page navigations fall back to the cached index.html when offline.
 * - A new version waits until the student presses "Update now" (SKIP_WAITING),
 *   so a typing run is never interrupted.
 * - Student progress lives in localStorage, which a service worker never
 *   touches, so updating never deletes progress.
 * - Requests to other origins (for example the e-mail service) are never
 *   intercepted or cached.
 * ========================================================================== */
const CACHE_VERSION = '__CACHE_VERSION__';
const PRECACHE = '__PRECACHE_LIST__';

self.addEventListener('install', (event) => {
  const list = Array.isArray(PRECACHE) ? PRECACHE : [];
  event.waitUntil(caches.open(CACHE_VERSION).then((cache) => cache.addAll(list)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('typecsf-') && k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(
    caches.open(CACHE_VERSION).then((cache) =>
      cache.match(req, { ignoreSearch: true }).then((cached) => {
        const network = fetch(req)
          .then((res) => {
            if (res && res.ok) cache.put(req, res.clone());
            return res;
          })
          .catch(() => cached || (req.mode === 'navigate' ? cache.match('index.html') : Response.error()));
        return cached || network;
      })
    )
  );
});
