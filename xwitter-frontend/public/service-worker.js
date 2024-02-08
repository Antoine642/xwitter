const STATIC_CACHE = 'xwitter-static';
const DYNAMIC_CACHE = 'xwitter-dynamic';

const BACKEND_URL = 'http://localhost:5000/messages';

// Liste des fichiers de l'application shell
const APP_SHELL_FILES = [
    '/',
    '/service-worker.js',
    '/index.html',
    '/manifest.json',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css',
    '/favicon.ico',
    '/static/css/main.37c779ab.css',
    '/static/css/main.37c779ab.css.map',
    '/static/js/main.1eb774e9.js.map',
    '/static/js/main.1eb774e9.js',
    '/static/js/592.f8361079.chunk.js',
    '/static/js/592.f8361079.chunk.js.map'
];

self.addEventListener('install', function (event) {
    console.log('Service Worker installing...');
    event.waitUntil(
        Promise.all([
            caches.open(STATIC_CACHE).then(function (cache) {
                return cache.addAll(APP_SHELL_FILES);
            }),
            caches.open(DYNAMIC_CACHE).then(function (cache) {
                return cache.add(new Request(BACKEND_URL));
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
                        return cacheName !== STATIC_CACHE &&
                            cacheName !== DYNAMIC_CACHE;
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
                if (event.request.url.includes(BACKEND_URL) && event.request.method === 'GET') {
                    return caches.open(DYNAMIC_CACHE).then(function (cache) {
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

self.addEventListener('online', function (event) {
    console.log('Connection restored, processing pending messages...');
    while (messageQueue.length > 0) {
        const newMessage = messageQueue.shift();
        fetch(BACKEND_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newMessage)
        }).then(function (response) {
            console.log('Message sent successfully:', newMessage);
        }).catch(function (error) {
            console.error('Failed to send message:', error);
        });
    }
});
