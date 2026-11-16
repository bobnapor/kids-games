// Offline support for Rainbow Doodle and Trace Champ.
// Everything is served from the cache first so the games open instantly with no internet,
// and refreshed in the background so updates arrive on the next launch.
const VERSION = 'kids-games-v1';
const FONTS = 'kids-games-fonts';
const CORE = [
  './',
  './index.html',
  './rainbow-doodle/',
  './rainbow-doodle/manifest.webmanifest',
  './rainbow-doodle/icon-192.png',
  './rainbow-doodle/icon-512.png',
  './rainbow-doodle/icon-maskable-512.png',
  './rainbow-doodle/apple-touch-icon.png',
  './trace-champ/',
  './trace-champ/manifest.webmanifest',
  './trace-champ/icon-192.png',
  './trace-champ/icon-512.png',
  './trace-champ/icon-maskable-512.png',
  './trace-champ/apple-touch-icon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION && k !== FONTS).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function staleWhileRevalidate(request, cacheName, matchOpts) {
  return caches.open(cacheName).then(cache =>
    cache.match(request, matchOpts).then(cached => {
      const fresh = fetch(request)
        .then(res => { if (res && (res.ok || res.type === 'opaque')) cache.put(request, res.clone()); return res; })
        .catch(() => cached);
      return cached || fresh;
    })
  );
}

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(staleWhileRevalidate(req, FONTS));
    return;
  }
  if (url.origin !== self.location.origin) return;
  event.respondWith(staleWhileRevalidate(req, VERSION, { ignoreSearch: true }));
});
