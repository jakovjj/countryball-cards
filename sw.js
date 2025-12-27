// Service Worker for Countryball Cards
const CACHE_NAME = 'countryball-cards-v2025122701'; // Update this version when you make changes
const urlsToCache = [
  '/',
  '/index.html',
  '/success.html',
  '/styles.css',
  '/styles.css?v=2025090701',
  '/main.js',
  '/analytics.js',
  '/store.js',
  '/performance.js',
  '/performance-optimized.js',
  '/logo.webp',
  '/logo-160.webp',
  '/logo-240.webp',
  '/logo-320.webp',
  '/logo-480.webp',
  '/logo-640.webp',
  '/extended.png',
  '/us.webp',
  '/favicon-32x32.png',
  '/favicon-16x16.png'
];

// Install event - cache assets
self.addEventListener('install', function(event) {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - serve from cache when possible with network-first strategy for HTML
self.addEventListener('fetch', function(event) {
  // For HTML requests, try network first to get fresh content
  if (event.request.destination === 'document' || 
      event.request.url.includes('.html') ||
      event.request.url.endsWith('/')) {
    event.respondWith(
      fetch(event.request)
        .then(function(response) {
          // Clone and cache the fresh response
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(function(cache) {
              cache.put(event.request, responseToCache);
            });
          return response;
        })
        .catch(function() {
          // If network fails, try cache
          return caches.match(event.request);
        })
    );
  } else {
    // For other assets, use cache-first strategy
    event.respondWith(
      caches.match(event.request)
        .then(function(response) {
          // Return cached version or fetch from network
          if (response) {
            return response;
          }
          
          // Clone the request because it's a stream
          const fetchRequest = event.request.clone();
          
          return fetch(fetchRequest).then(function(response) {
            // Check if valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone the response because it's a stream
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          });
        })
    );
  }
});

// Activate event - clean up old caches
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});
