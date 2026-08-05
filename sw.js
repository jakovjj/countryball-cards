// Service Worker for Countryball Cards
const CACHE_NAME = 'countryball-cards-v2026080510'; // Update this version when you make changes
const urlsToCache = [
  '/',
  '/index.html',
  '/forum.html',
  '/styles.css',
  '/styles.css?v=2026080301',
  '/main.js',
  '/main.js?v=2026072801',
  '/analytics.js',
  '/analytics.js?v=2026080510',
  '/store.js?v=2026080510',
  '/community.css?v=2026080304',
  '/forum-redesign.css?v=2026080304',
  '/js/site-header.js?v=2026072905',
  '/js/community-login.js?v=2026072921',
  '/js/community.js?v=2026080304',
  '/js/community-reviews.js?v=2026080304',
  '/js/gallery-cards.js?v=2026080304',
  '/extended_badge.webp',
  '/founders_badge.webp',
  '/admin_badge.webp?v=2026080401',
  '/assets/title-240.webp',
  '/assets/title-360.webp',
  '/assets/fonts/bangers-latin.woff2?v=2026072831',
  '/assets/top_homepage-640.webp?v=2026073102',
  '/assets/top_homepage-960.webp?v=2026073102',
  '/assets/top_homepage-1440.webp?v=2026073102',
  '/assets/top_homepage.webp?v=2026073102',
  '/assets/site-icon-80.webp',
  '/assets/glare-56.webp',
  '/assets/council.webp?v=2026072834',
  '/assets/bg.webp',
  '/components/showcase/closed_box.webp',
  '/components/showcase/box_open.webp',
  '/components/showcase/cards_main.webp',
  '/components/showcase/project_cards.webp',
  '/components/showcase/extended_opp.webp',
  '/components/showcase/coins.webp',
  '/components/showcase/resource_dice.webp',
  '/components/showcase/combat_die.webp',
  '/serp.ico',
  '/favicon.ico',
  '/favicon-32x32.png',
  '/favicon-16x16.png',
  '/site.webmanifest',
  '/browserconfig.xml'
];

function shouldCacheResponse(response) {
  return response && response.status === 200 && response.type === 'basic';
}

function fetchAndCache(request) {
  return fetch(request).then(function(response) {
    if (shouldCacheResponse(response)) {
      const responseToCache = response.clone();
      caches.open(CACHE_NAME).then(function(cache) {
        cache.put(request, responseToCache);
      });
    }
    return response;
  });
}

function staleWhileRevalidate(request) {
  return caches.match(request).then(function(cachedResponse) {
    const networkFetch = fetchAndCache(request).catch(function() {
      return cachedResponse;
    });
    return cachedResponse || networkFetch;
  });
}

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
  if (event.request.method !== 'GET') {
    return;
  }

  // Icons/manifests should update quickly; avoid getting stuck in cache
  const url = new URL(event.request.url);
  const isSameOrigin = url.origin === self.location.origin;
  if (!isSameOrigin) {
    return;
  }
  // Authenticated community responses must never enter the offline cache.
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // The Council landing is changing frequently. Always fetch its page and
  // presentation assets fresh before falling back to the offline cache.
  if (
    url.pathname === '/forum.html' ||
    url.pathname === '/community.css' ||
    url.pathname === '/forum-redesign.css' ||
    url.pathname === '/assets/council.webp'
  ) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then(function(response) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(function() {
          return caches.match(event.request);
        })
    );
    return;
  }

  const isStaticAsset = (
    ['style', 'script', 'image', 'font'].includes(event.request.destination) ||
    /\.(css|js|mjs|png|jpe?g|gif|webp|avif|svg|ico|woff2?|ttf|otf)$/i.test(url.pathname)
  );
  const isIconOrManifest = isSameOrigin && (
    url.pathname.startsWith('/icons/') ||
    url.pathname === '/serp.ico' ||
    url.pathname === '/serp.png' ||
    url.pathname === '/favicon.ico' ||
    url.pathname.startsWith('/favicon-') ||
    url.pathname === '/apple-touch-icon.png' ||
    url.pathname.startsWith('/android-chrome-') ||
    url.pathname === '/site.webmanifest' ||
    url.pathname === '/browserconfig.xml' ||
    url.pathname === '/safari-pinned-tab.svg'
  );

  if (isIconOrManifest) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then(function(response) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(function() {
          return caches.match(event.request);
        })
    );
    return;
  }

  // Tier assignments change independently of the gallery UI, so always check
  // the network before falling back to the last known card data.
  if (url.pathname === '/js/gallery-cards.js') {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then(function(response) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(function() {
          return caches.match(event.request);
        })
    );
    return;
  }

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
  } else if (isStaticAsset) {
    event.respondWith(staleWhileRevalidate(event.request));
  } else {
    event.respondWith(fetchAndCache(event.request).catch(function() {
      return caches.match(event.request);
    }));
  }
});

self.addEventListener('message', function(event) {
  if (!event.data || event.data.type !== 'warm_cache' || !Array.isArray(event.data.urls)) {
    return;
  }

  const urls = event.data.urls
    .map(function(rawUrl) {
      try {
        return new URL(rawUrl, self.location.origin);
      } catch (_) {
        return null;
      }
    })
    .filter(function(url) {
      return url && url.origin === self.location.origin;
    })
    .slice(0, 24);

  if (!urls.length) {
    return;
  }

  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return Promise.all(urls.map(function(url) {
        const request = new Request(url.href, {
          method: 'GET',
          credentials: 'same-origin',
          cache: 'force-cache'
        });

        return cache.match(request).then(function(match) {
          if (match) {
            return match;
          }

          return fetch(request).then(function(response) {
            if (response && response.status === 200 && response.type === 'basic') {
              return cache.put(request, response.clone()).then(function() {
                return response;
              });
            }
            return response;
          }).catch(function() {
            return undefined;
          });
        });
      }));
    })
  );
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
