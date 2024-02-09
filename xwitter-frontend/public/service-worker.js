const STATIC_CACHE = 'xwitter-static';
const DYNAMIC_CACHE = 'xwitter-dynamic';
importScripts('/idb.js');

const BACKEND_URL = 'http://localhost:5000/messages';

const APP_SHELL_FILES = [
    '/',
    '/service-worker.js',
    '/index.html',
    '/manifest.json',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css',
    '/favicon.ico',
    '/static/css/main.b7d45cd7.css',
    '/static/css/main.b7d45cd7.css.map',
    '/static/js/main.2e3f3a10.js.map',
    '/static/js/main.2e3f3a10.js',
    '/static/js/592.f8361079.chunk.js',
    '/static/js/592.f8361079.chunk.js.map',
    '/idb.js'
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
        fetch(event.request).then(function (networkResponse) {
            console.log('Network response for', event.request.url);
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
                if (cacheResponse) {
                    console.log('Cache hit for', event.request.url);
                    return cacheResponse;
                } else {
                    console.log('Cache miss for', event.request.url);
                    return new Response('Offline', {
                        status: 503,
                        statusText: 'Service Unavailable'
                    });
                }
            });
        })
    );
});

self.addEventListener('sync', function (event) {
    if (event.tag === 'sync-new-messages') {
        idb.openDB('xwitter-messages', 1).then(function (database) {
            database.getAll('messages').then(function (messages) {
                for (const message of messages) {
                    fetch(BACKEND_URL, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(message)
                    }).then(function (response) {
                        if (response.ok) {
                            database.delete('messages', message.id);
                            console.log('Message sent:', message);
                        } else {
                            console.error('Failed to send message:', message);
                        }
                    });
                }
            });
        });
    }
});

self.addEventListener('push', function (event) {
    // console.log('Push received:', event);

    const notificationData = event.data.json();
    self.registration.showNotification(
        notificationData.title,
        {
            body: notificationData.body,
            icon: '/favicon.ico',
            actions: [
                {'title': 'Consulter', 'action': 'open'},
                {'title': 'Ignorer', 'action': 'close'}
            ]
        });
});
self.addEventListener('notificationclick', function (event) {
    console.log('Notification click received:', event);
    switch(event.action){
        case 'close':
            break;
        case 'open':
        default:
            //si onglet ouvert, on le focus sinon on ouvre un nouvel onglet
            event.waitUntil(clients.matchAll({type: 'window'}).then(function(clients){
                if(clients.length){
                    clients[0].focus();
                }else{
                    clients.openWindow('localhost:3000');
                }
            }));
            break;
    }
});