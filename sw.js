// ── Cereal Drop Service Worker ──────────────────────────
// Caches all game files so the game works offline.

const CACHE_NAME = 'cereal-drop-v1';

// All the files we want to cache for offline play
const FILES_TO_CACHE = [
  './index.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;600;700&display=swap',
];

// ── Install ──────────────────────────────────────────────
// Fires once when the service worker is first installed.
// We open the cache and save all our files into it.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Cereal Drop: caching files for offline use');
      // addAll fetches and caches each file
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  // Activate immediately without waiting for old tabs to close
  self.skipWaiting();
});

// ── Activate ─────────────────────────────────────────────
// Fires after install. We use this to clean up any OLD
// caches from previous versions of the app.
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME) // find old caches
          .map(name => {
            console.log('Cereal Drop: deleting old cache', name);
            return caches.delete(name);         // delete them
          })
      );
    })
  );
  // Take control of all open tabs immediately
  self.clients.claim();
});

// ── Fetch ─────────────────────────────────────────────────
// Fires every time the page requests a file (HTML, fonts, etc).
// We use a "cache first" strategy:
//   1. Check if we have it cached → serve it instantly (works offline!)
//   2. If not cached → fetch from network, then save a copy for next time
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse; // serve from cache
      }
      // Not in cache — fetch from network and cache it
      return fetch(event.request).then(networkResponse => {
        // Only cache valid responses
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      }).catch(() => {
        // Network failed and not in cache — nothing we can do
        console.warn('Cereal Drop: fetch failed for', event.request.url);
      });
    })
  );
});
