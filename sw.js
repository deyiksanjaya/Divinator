const CACHE_NAME = 'divinator-v1.5';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install event: Simpan aset utama ke cache
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
  self.skipWaiting(); // Langsung aktifin SW baru tanpa nunggu
});

// Activate event: Bersihin cache versi lama kalau ada update
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event: Atur strategi Cache-First vs Network-Only
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Bypass cache mutlak untuk request ke API (Gemini, Wikipedia, atau API custom lu)
  if (
    url.hostname.includes('googleapis.com') || 
    url.hostname.includes('wikipedia.org') ||
    url.pathname.includes('api') ||
    url.search.includes('api')
  ) {
    return; // Balik ke default network request
  }

  // Cache-First untuk file statis (HTML, manifest, dll)
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Balikin dari cache kalau ada, kalau ngga ya fetch dari internet
        return response || fetch(event.request).catch(() => {
          // Opsional: Kasih fallback kalau bener-bener offline dan file gak ada di cache
          console.log('App offline dan resource nggak ada di cache.');
        });
      })
  );
});
