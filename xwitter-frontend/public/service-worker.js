const CACHE_NAME = 'xwitter-cache';
const STATIC_CACHE_NAME = 'xwitter-static';
const DYNAMIC_CACHE_NAME = 'xwitter-dynamic';

// Liste des fichiers de l'application shell
const APP_SHELL_FILES = [
    '/',
    '/index.html',
    '/manifest.json',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css',
    '/favicon.ico',
    '/static/css/main.37c779ab.css',
    '/static/css/main.37c779ab.css.map',
    '/static/js/592.f8361079.chunk',
    '/static/js/592.f8361079.chunk.map',
    '/static/js/main.1eb774e9.js',
    '/static/js/main.1eb774e9.js.map',
    '/static/js/main.1eb774e9.js.LICENSE.txt',
    '/asset-manifest.json',
];

self.addEventListener('install', function (event) {
    console.log('Service Worker installing...');
    event.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            // Pré-cache des fichiers de l'application shell
            return cache.addAll(APP_SHELL_FILES);
        })
    );
});

self.addEventListener('activate', function (event) {
    console.log('Service Worker activating...');
    event.waitUntil(
        Promise.all([
            // Nettoie les anciens caches non utilisés
            caches.keys().then(function (cacheNames) {
                return Promise.all(
                    cacheNames.filter(function (cacheName) {
                        return cacheName !== CACHE_NAME &&
                            cacheName !== STATIC_CACHE_NAME &&
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
            return fetch(event.request).catch(function (error) {
                console.error('Fetch failed:', error);
                // Si la récupération depuis le réseau échoue, renvoyer une réponse de secours
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

self.addEventListener('message', function (event) {
    if (event.data && event.data.action === 'cacheMessage') {
        const { name, message } = event.data;
        const newMessage = { name, message };

        // Mettre en cache le nouveau message avec une clé unique
        const messageKey = 'message-' + Date.now();
        caches.open(DYNAMIC_CACHE_NAME).then(function (cache) {
            cache.put(messageKey, new Response(JSON.stringify(newMessage)));
        });
    }
});

self.addEventListener('online', function (event) {
    // Lorsque la connexion réseau est rétablie, envoyer les messages en attente au serveur
    while (messageQueue.length > 0) {
        const newMessage = messageQueue.shift(); // Prendre le prochain message de la file d'attente

        fetch('http://localhost:5000/messages', {
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
