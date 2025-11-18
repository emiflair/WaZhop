/**
 * Smart prefetching utility for marketplace products
 * Preloads products and their images before user navigates to them
 */

const cache = new Map();
const pendingRequests = new Map();

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

  // If already fetching, return that promise
  if (pendingRequests.has(cacheKey)) {
    return pendingRequests.get(cacheKey);
  }

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

  if (pendingRequests.has(cacheKey)) {
    return pendingRequests.get(cacheKey);
  }

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
 * Preload image into browser cache
 * @param {string} url - Image URL
 */
export function preloadImage(url) {
  if (!url) return;
  
  const img = new Image();
  img.src = url;
  
  // Add to document head for even faster loading
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = url;
  link.as = 'image';
  document.head.appendChild(link);
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
