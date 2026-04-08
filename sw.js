/* Minimal offline-friendly caching for static Hive assets */
const CACHE = 'hive-static-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      cache.addAll(['./index.html', './style.css', './utils.js', './favicon.svg', './manifest.webmanifest']).catch(() => {})
    )
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  const path = url.pathname.replace(/^\//, '');
  const isStatic =
    path === '' ||
    path === 'index.html' ||
    /\.(css|js|html|svg|webmanifest|ico|png|jpg|jpeg|gif|woff2?)$/i.test(path);
  if (!isStatic) return;

  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const copy = res.clone();
        if (res.ok) {
          caches.open(CACHE).then((c) => c.put(event.request, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
