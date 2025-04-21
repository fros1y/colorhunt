const CACHE_NAME = 'color-ar-cache-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './styles.css',
  './js/camera.js',
  './js/main.js',
  './js/presets.js',
  './js/ui.js',
  './js/webgl.js',
  './icons/color-hunt-180.png',
  './icons/color-hunt-192.png',
  './icons/color-hunt-512.png',
  './icons/favicon-32.png',
  './icons/favicon-48.png',
  'https://cdn.jsdelivr.net/npm/nouislider@15.7.0/dist/nouislider.min.css',
  'https://cdn.jsdelivr.net/npm/nouislider@15.7.0/dist/nouislider.min.js'
];

// Install event - cache assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching assets');
        return cache.addAll(ASSETS);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    })
  );
});

// Fetch event - serve from cache if available
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached response if found
        if (response) {
          return response;
        }

        // Clone the request
        const fetchRequest = event.request.clone();

        // Make network request and cache the response
        return fetch(fetchRequest).then(response => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          // Open cache and store response
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
      .catch(() => {
        // Fallback for image requests
        if (event.request.url.match(/\.(jpe?g|png|gif|svg|webp)$/)) {
          return caches.match('./icons/icon-192.png');
        }
      })
  );
});