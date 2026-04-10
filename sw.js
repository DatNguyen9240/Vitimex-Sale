/**
 * Service Worker — Vitimex POS
 * Cache-first cho static assets, network-first cho API.
 * Tăng CACHE_VERSION khi deploy phiên bản mới.
 */
const CACHE_VERSION = 'vitimex-pos-v2';

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/offline.html',
  '/src/css/design-tokens.css',
  '/src/css/global.css',
  '/src/css/components/topbar.css',
  '/src/css/components/tabs.css',
  '/src/css/components/order-table.css',
  '/src/css/components/quick-grid.css',
  '/src/css/components/payment-sidebar.css',
  '/src/css/responsive.css',
  '/src/pwa/manifest.json',
  '/src/js/utils/format.js',
  '/src/js/services/mock-data.js',
  '/src/js/services/order-manager.js',
  '/src/js/app.js',
];

// ── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      console.log('[SW] Pre-caching app shell');
      return Promise.allSettled(
        PRECACHE_URLS.map((url) =>
          cache.add(url).catch((err) => {
            console.warn('[SW] Skip:', url, err.message);
          })
        )
      );
    })
  );
  self.skipWaiting();
});

// ── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.filter(n => n !== CACHE_VERSION).map(n => {
          console.log('[SW] Deleting old cache:', n);
          return caches.delete(n);
        })
      )
    )
  );
  self.clients.claim();
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  // Network-first cho navigation
  if (request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res && res.status === 200 && res.type === 'basic') {
            const clone = res.clone();
            caches.open(CACHE_VERSION).then(c => c.put(request, clone));
          }
          return res;
        })
        .catch(() => caches.match(request).then(r => r || caches.match('/offline.html')))
    );
    return;
  }

  // Cache-first cho static assets
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((res) => {
        if (res && res.status === 200 && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE_VERSION).then(c => c.put(request, clone));
        }
        return res;
      }).catch(() => {
        if (request.mode === 'navigate') return caches.match('/offline.html');
      });
    })
  );
});
