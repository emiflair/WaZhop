/**
 * Service Worker for WaZhop
 * Provides offline caching, faster load times, and background sync
 */

const CACHE_VERSION = 'wazhop-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;
const API_CACHE = `${CACHE_VERSION}-api`;

const CACHE_DURATION = {
  STATIC: 30 * 24 * 60 * 60 * 1000,  // 30 days
  DYNAMIC: 7 * 24 * 60 * 60 * 1000,  // 7 days
  API: 5 * 60 * 1000,                 // 5 minutes
  IMAGE: 30 * 24 * 60 * 60 * 1000    // 30 days
};

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/wazhop-icon.svg',
  '/apple-touch-icon.png',
  '/icon-192.png',
  '/icon-512.png'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.error('[SW] Failed to cache static assets:', err);
      });
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName.startsWith('wazhop-') && 
              cacheName !== STATIC_CACHE && 
              cacheName !== DYNAMIC_CACHE && 
              cacheName !== IMAGE_CACHE &&
              cacheName !== API_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome extension requests
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // Handle different types of requests
  if (url.pathname.startsWith('/api/')) {
    // API requests - network first, fallback to cache
    event.respondWith(handleApiRequest(request));
  } else if (isImageRequest(request)) {
    // Image requests - cache first, fallback to network
    event.respondWith(handleImageRequest(request));
  } else if (isStaticAsset(request)) {
    // Static assets - cache first
    event.respondWith(handleStaticRequest(request));
  } else {
    // Dynamic content - network first with cache fallback
    event.respondWith(handleDynamicRequest(request));
  }
});

/**
 * Handle API requests - Network first, cache fallback
 */
async function handleApiRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Only cache successful GET responses
    if (networkResponse.ok) {
      const cache = await caches.open(API_CACHE);
      // Clone response before caching
      cache.put(request, networkResponse.clone());
      
      // Add timestamp header for cache validation
      const headers = new Headers(networkResponse.headers);
      headers.set('sw-cached-at', Date.now().toString());
      
      return new Response(networkResponse.body, {
        status: networkResponse.status,
        statusText: networkResponse.statusText,
        headers
      });
    }
    
    return networkResponse;
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      console.log('[SW] Serving API from cache:', request.url);
      return cachedResponse;
    }
    
    // Return offline response
    return new Response(
      JSON.stringify({ 
        error: 'Offline', 
        message: 'You are currently offline. Please check your connection.' 
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * Handle image requests - Cache first
 */
async function handleImageRequest(request) {
  const cache = await caches.open(IMAGE_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    console.log('[SW] Serving image from cache:', request.url);
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Return placeholder or offline image
    console.log('[SW] Image fetch failed:', request.url);
    return new Response('', { status: 404 });
  }
}

/**
 * Handle static asset requests - Cache first
 */
async function handleStaticRequest(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Static asset fetch failed:', request.url);
    return new Response('', { status: 404 });
  }
}

/**
 * Handle dynamic content - Network first with cache fallback
 */
async function handleDynamicRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      console.log('[SW] Serving from cache:', request.url);
      return cachedResponse;
    }
    
    // For navigation requests, return cached index.html
    if (request.mode === 'navigate') {
      const indexCache = await caches.match('/index.html');
      if (indexCache) {
        return indexCache;
      }
    }
    
    return new Response('Offline', { status: 503 });
  }
}

/**
 * Check if request is for an image
 */
function isImageRequest(request) {
  const url = new URL(request.url);
  return /\.(jpg|jpeg|png|gif|webp|svg|avif|ico)$/i.test(url.pathname) ||
         url.hostname === 'res.cloudinary.com';
}

/**
 * Check if request is for a static asset
 */
function isStaticAsset(request) {
  const url = new URL(request.url);
  return /\.(js|css|woff|woff2|ttf|eot)$/i.test(url.pathname) ||
         url.pathname.startsWith('/assets/');
}

/**
 * Cleanup old cache entries
 */
async function cleanupOldCaches() {
  const caches = [
    { name: API_CACHE, maxAge: CACHE_DURATION.API },
    { name: DYNAMIC_CACHE, maxAge: CACHE_DURATION.DYNAMIC },
    { name: IMAGE_CACHE, maxAge: CACHE_DURATION.IMAGE }
  ];

  for (const { name, maxAge } of caches) {
    try {
      const cache = await caches.open(name);
      const requests = await cache.keys();
      const now = Date.now();

      for (const request of requests) {
        const response = await cache.match(request);
        const cachedAt = response?.headers.get('sw-cached-at');
        
        if (cachedAt && now - parseInt(cachedAt) > maxAge) {
          await cache.delete(request);
        }
      }
    } catch (error) {
      console.error('[SW] Cleanup failed for cache:', name, error);
    }
  }
}

// Periodic cleanup (every 6 hours)
setInterval(() => {
  cleanupOldCaches();
}, 6 * 60 * 60 * 1000);

// Message handler
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
  
  if (event.data === 'clearCache') {
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName.startsWith('wazhop-')) {
            return caches.delete(cacheName);
          }
        })
      );
    });
  }
});

console.log('[SW] Service worker loaded');
