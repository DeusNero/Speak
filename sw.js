const CACHE_NAME = 'speak-v2'; // <--- BUMPED VERSION (Critical!)
const ASSETS = [
    './',                 // <--- CHANGED: Added dot
    './index.html',       // <--- CHANGED: Added dot
    './manifest.json',    // <--- CHANGED: Added dot
    // Add these if you have them locally:
    // './style.css', 
    // './script.js',
    // './icon-192.png',
    // './your-zen-background.jpg' 
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then(keys => 
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then(cached => cached || fetch(e.request))
    );
});
