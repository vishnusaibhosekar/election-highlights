// Service Worker for PWA offline support
const CACHE_NAME = 'election-highlights-v1';
const OFFLINE_URL = '/offline';

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll([
                '/',
                '/feed',
                OFFLINE_URL,
            ]);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((cacheName) => cacheName !== CACHE_NAME)
                    .map((cacheName) => caches.delete(cacheName))
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    // Network-first strategy for API calls
    if (event.request.url.includes('/api/')) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                    return response;
                })
                .catch(() => {
                    return caches.match(event.request);
                })
        );
        return;
    }

    // Cache-first strategy for static assets
    event.respondWith(
        caches.match(event.request).then((response) => {
            if (response) return response;

            return fetch(event.request).then((response) => {
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }

                const responseClone = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseClone);
                });

                return response;
            });
        }).catch(() => {
            // Return offline page if network fails
            return caches.match(OFFLINE_URL);
        })
    );
});

self.addEventListener('message', (event) => {
    if (event.data === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
