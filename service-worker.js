const CACHE_NAME = 'near-buy-v1';
const urlsToCache = [
  '/',
  '/index.html',
  // In a real build process, you'd cache the specific JS/CSS bundles.
  // For this environment, we'll cache the main entry points.
];

// Install the service worker and cache the app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        // We are intentionally not caching external resources like tailwind
        // to keep the service worker simple for this demonstration.
        // A production PWA would have a more robust caching strategy.
        return cache.addAll(urlsToCache);
      })
  );
});

// Intercept fetch requests and serve from cache if available
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        // Not in cache - fetch from network
        return fetch(event.request);
      }
    )
  );
});

// Clean up old caches on activation
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});