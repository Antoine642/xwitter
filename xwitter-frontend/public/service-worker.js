const STATIC_CACHE_NAME = 'xwitter-static';
const DYNAMIC_CACHE_NAME = 'xwitter-dynamic';

// Liste des fichiers de l'application shell
const APP_SHELL_FILES = [
    '/',
    '/service-worker.js',
    '/index.html',
    '/manifest.json',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css',
    '/favicon.ico',
    '/static/css/main.37c779ab.css',
    '/static/js/main.1eb774e9.js'
];

self.addEventListener('install', function (event) {
    console.log('Service Worker installing...');
    event.waitUntil(
        Promise.all([
            caches.open(STATIC_CACHE_NAME).then(function (cache) {
                return cache.addAll(APP_SHELL_FILES);
            }),
            caches.open(DYNAMIC_CACHE_NAME).then(function (cache) {
                return cache.add(new Request('http://localhost:5000/messages'));
            })
        ])
    );
});

self.addEventListener('activate', function (event) {
    console.log('Service Worker activating...');
    event.waitUntil(
        Promise.all([
            caches.keys().then(function (cacheNames) {
                return Promise.all(
                    cacheNames.filter(function (cacheName) {
                        return cacheName !== STATIC_CACHE_NAME &&
                            cacheName !== DYNAMIC_CACHE_NAME;
                    }).map(function (cacheName) {
                        return caches.delete(cacheName);
                    })
                );
            })
        ])
    );
});

self.addEventListener('fetch', function (event) {
    event.respondWith(
        caches.match(event.request).then(function (response) {
            if (response) {
                console.log('Cache hit for', event.request.url);
                return response;
            }

            console.log('Cache miss for', event.request.url);
            return fetch(event.request).then(function (networkResponse) {
                if (event.request.url.includes('http://localhost:5000/messages') && event.request.method === 'GET') {
                    return caches.open(DYNAMIC_CACHE_NAME).then(function (cache) {
                        cache.put(event.request, networkResponse.clone());
                        return networkResponse;
                    });
                } else {
                    return networkResponse;
                }
            }).catch(function (error) {
                console.error('Fetch failed:', error);
                return caches.match(event.request).then(function (cacheResponse) {
                    return cacheResponse || new Response('Offline', {
                        status: 503,
                        statusText: 'Service Unavailable'
                    });
                });
            });
        })
    );
});
