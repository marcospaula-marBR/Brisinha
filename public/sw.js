// Service Worker mínimo para o Brisinha PWA
// Permite instalação na tela inicial e cache básico do shell

const CACHE_NAME = 'brisinha-v1';
const STATIC_ASSETS = ['/', '/BrisinhAI.jpeg', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Network-first para API calls, cache-first para assets estáticos
  if (event.request.url.includes('/api/')) {
    return; // deixa passar sem cache
  }
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
