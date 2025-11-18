/**
 * Smart prefetching utility for marketplace products
 * Preloads products and their images before user navigates to them
 */

const cache = new Map();
const pendingRequests = new Map();
const lastRequestTime = new Map();
const MIN_REQUEST_INTERVAL = 3000; // Minimum 3 seconds between same requests
const requestQueue = [];
let isProcessingQueue = false;
const MAX_CONCURRENT_REQUESTS = 2; // Only 2 concurrent prefetch requests

/**
 * Prefetch products from API and cache them
 * @param {Object} params - API query parameters
 * @returns {Promise<Array>} - Cached products
 */
export async function prefetchProducts(params) {
  const cacheKey = JSON.stringify(params);
  
  // Return cached data if available and fresh (< 2 minutes old)
  if (cache.has(cacheKey)) {
    const { data, timestamp } = cache.get(cacheKey);
    if (Date.now() - timestamp < 120000) {
      return data;
    }
  }

  // Rate limiting: Don't make same request within MIN_REQUEST_INTERVAL
  if (lastRequestTime.has(cacheKey)) {
    const timeSinceLastRequest = Date.now() - lastRequestTime.get(cacheKey);
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      // Return cached data even if slightly stale, or reject
      if (cache.has(cacheKey)) {
        return cache.get(cacheKey).data;
      }
      return Promise.reject(new Error('Rate limited'));
    }
  }

  // If already fetching, return that promise
  if (pendingRequests.has(cacheKey)) {
    return pendingRequests.get(cacheKey);
  }

  lastRequestTime.set(cacheKey, Date.now());

  // Fetch and cache
  const promise = fetch(`${import.meta.env.VITE_API_URL || '/api'}/products/marketplace?${new URLSearchParams(params)}`)
    .then(res => res.json())
    .then(json => {
      const data = Array.isArray(json) ? json : json.data || [];
      cache.set(cacheKey, { data, timestamp: Date.now() });
      pendingRequests.delete(cacheKey);
      return data;
    })
    .catch(err => {
      pendingRequests.delete(cacheKey);
      throw err;
    });

  pendingRequests.set(cacheKey, promise);
  return promise;
}

/**
 * Prefetch product details and cache them
 * @param {string} productId - Product ID
 * @returns {Promise<Object>} - Cached product
 */
export async function prefetchProductDetail(productId) {
  const cacheKey = `product_${productId}`;
  
  if (cache.has(cacheKey)) {
    const { data, timestamp } = cache.get(cacheKey);
    if (Date.now() - timestamp < 120000) {
      return data;
    }
  }

  // Rate limiting for product details too
  if (lastRequestTime.has(cacheKey)) {
    const timeSinceLastRequest = Date.now() - lastRequestTime.get(cacheKey);
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      if (cache.has(cacheKey)) {
        return cache.get(cacheKey).data;
      }
      return Promise.reject(new Error('Rate limited'));
    }
  }

  if (pendingRequests.has(cacheKey)) {
    return pendingRequests.get(cacheKey);
  }

  lastRequestTime.set(cacheKey, Date.now());

  const promise = fetch(`${import.meta.env.VITE_API_URL || '/api'}/products/${productId}`)
    .then(res => res.json())
    .then(json => {
      const data = json.data || json;
      cache.set(cacheKey, { data, timestamp: Date.now() });
      pendingRequests.delete(cacheKey);
      
      // Prefetch first image
      if (data.images?.[0]?.url) {
        preloadImage(data.images[0].url);
      }
      
      return data;
    })
    .catch(err => {
      pendingRequests.delete(cacheKey);
      throw err;
    });

  pendingRequests.set(cacheKey, promise);
  return promise;
}

/**
 * Process queued requests with concurrency control
 */
async function processRequestQueue() {
  if (isProcessingQueue || requestQueue.length === 0) return;
  
  isProcessingQueue = true;
  const activeBatch = [];
  
  while (requestQueue.length > 0 && activeBatch.length < MAX_CONCURRENT_REQUESTS) {
    const request = requestQueue.shift();
    activeBatch.push(request());
  }
  
  await Promise.allSettled(activeBatch);
  isProcessingQueue = false;
  
  // Process next batch if queue has items
  if (requestQueue.length > 0) {
    setTimeout(processRequestQueue, 500);
  }
}

/**
 * Add request to queue for controlled execution
 * @param {Function} requestFn - Function that returns a promise
 */
function queueRequest(requestFn) {
  requestQueue.push(requestFn);
  processRequestQueue();
}

/**
 * Preload image into browser cache
 * @param {string} url - Image URL
 */
export function preloadImage(url) {
  if (!url) return;
  
  // Simple image preload without DOM manipulation (lighter)
  const img = new Image();
  img.src = url;
}

/**
 * Get cached product data
 * @param {string} key - Cache key
 * @returns {any} - Cached data or null
 */
export function getCachedData(key) {
  if (cache.has(key)) {
    const { data, timestamp } = cache.get(key);
    if (Date.now() - timestamp < 120000) {
      return data;
    }
  }
  return null;
}

/**
 * Clear old cache entries
 */
export function clearOldCache() {
  const now = Date.now();
  for (const [key, { timestamp }] of cache.entries()) {
    if (now - timestamp > 300000) { // 5 minutes
      cache.delete(key);
    }
  }
}

// Auto-clear old cache every 2 minutes
setInterval(clearOldCache, 120000);
