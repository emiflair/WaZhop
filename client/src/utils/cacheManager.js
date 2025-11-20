/**
 * Advanced Cache Manager with localStorage persistence
 * Provides intelligent caching with TTL, size limits, and automatic cleanup
 */

const CACHE_VERSION = 'v1';
const CACHE_PREFIX = 'wazhop_cache_';
const MAX_CACHE_SIZE = 5 * 1024 * 1024; // 5MB max cache size
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes default TTL

class CacheManager {
  constructor() {
    this.memoryCache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      evictions: 0
    };
    
    // Initialize and cleanup old caches
    this.init();
  }

  init() {
    try {
      // Remove old cache versions
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(CACHE_PREFIX) && !key.includes(CACHE_VERSION)) {
          localStorage.removeItem(key);
        }
      });
      
      // Check cache size and cleanup if needed
      this.checkCacheSize();
    } catch (e) {
      console.warn('Cache initialization failed:', e);
    }
  }

  /**
   * Generate cache key
   */
  getCacheKey(key, namespace = 'default') {
    return `${CACHE_PREFIX}${CACHE_VERSION}_${namespace}_${key}`;
  }

  /**
   * Set cache with TTL
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in milliseconds
   * @param {string} namespace - Cache namespace
   */
  set(key, value, ttl = DEFAULT_TTL, namespace = 'default') {
    try {
      const cacheKey = this.getCacheKey(key, namespace);
      const cacheEntry = {
        value,
        timestamp: Date.now(),
        ttl,
        size: this.estimateSize(value)
      };

      // Store in memory cache
      this.memoryCache.set(cacheKey, cacheEntry);

      // Store in localStorage
      try {
        localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
        this.stats.sets++;
      } catch (storageError) {
        // If quota exceeded, cleanup old entries
        if (storageError.name === 'QuotaExceededError') {
          this.cleanup();
          // Try again after cleanup
          localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
        }
      }

      return true;
    } catch (e) {
      console.warn('Cache set failed:', e);
      return false;
    }
  }

  /**
   * Get cached value
   * @param {string} key - Cache key
   * @param {string} namespace - Cache namespace
   * @returns {any} Cached value or null
   */
  get(key, namespace = 'default') {
    try {
      const cacheKey = this.getCacheKey(key, namespace);

      // Check memory cache first
      if (this.memoryCache.has(cacheKey)) {
        const entry = this.memoryCache.get(cacheKey);
        if (this.isValid(entry)) {
          this.stats.hits++;
          return entry.value;
        } else {
          this.memoryCache.delete(cacheKey);
        }
      }

      // Check localStorage
      const stored = localStorage.getItem(cacheKey);
      if (stored) {
        const entry = JSON.parse(stored);
        if (this.isValid(entry)) {
          // Restore to memory cache
          this.memoryCache.set(cacheKey, entry);
          this.stats.hits++;
          return entry.value;
        } else {
          localStorage.removeItem(cacheKey);
        }
      }

      this.stats.misses++;
      return null;
    } catch (e) {
      console.warn('Cache get failed:', e);
      this.stats.misses++;
      return null;
    }
  }

  /**
   * Check if cache entry is still valid
   */
  isValid(entry) {
    if (!entry || !entry.timestamp) return false;
    const age = Date.now() - entry.timestamp;
    return age < entry.ttl;
  }

  /**
   * Remove cached item
   */
  remove(key, namespace = 'default') {
    try {
      const cacheKey = this.getCacheKey(key, namespace);
      this.memoryCache.delete(cacheKey);
      localStorage.removeItem(cacheKey);
      return true;
    } catch (e) {
      console.warn('Cache remove failed:', e);
      return false;
    }
  }

  /**
   * Clear all cache in a namespace
   */
  clearNamespace(namespace = 'default') {
    try {
      const prefix = `${CACHE_PREFIX}${CACHE_VERSION}_${namespace}_`;
      
      // Clear memory cache
      for (const key of this.memoryCache.keys()) {
        if (key.startsWith(prefix)) {
          this.memoryCache.delete(key);
        }
      }

      // Clear localStorage
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(prefix)) {
          localStorage.removeItem(key);
        }
      });

      return true;
    } catch (e) {
      console.warn('Cache clear failed:', e);
      return false;
    }
  }

  /**
   * Clear all caches
   */
  clearAll() {
    try {
      this.memoryCache.clear();
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(CACHE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
      this.stats = { hits: 0, misses: 0, sets: 0, evictions: 0 };
      return true;
    } catch (e) {
      console.warn('Clear all failed:', e);
      return false;
    }
  }

  /**
   * Cleanup expired entries
   */
  cleanup() {
    try {
      let removedCount = 0;

      // Cleanup memory cache
      for (const [key, entry] of this.memoryCache.entries()) {
        if (!this.isValid(entry)) {
          this.memoryCache.delete(key);
          removedCount++;
        }
      }

      // Cleanup localStorage
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(CACHE_PREFIX)) {
          try {
            const entry = JSON.parse(localStorage.getItem(key));
            if (!this.isValid(entry)) {
              localStorage.removeItem(key);
              removedCount++;
            }
          } catch (e) {
            // Invalid entry, remove it
            localStorage.removeItem(key);
            removedCount++;
          }
        }
      });

      this.stats.evictions += removedCount;
      return removedCount;
    } catch (e) {
      console.warn('Cache cleanup failed:', e);
      return 0;
    }
  }

  /**
   * Check cache size and cleanup if needed
   */
  checkCacheSize() {
    try {
      let totalSize = 0;
      const entries = [];

      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(CACHE_PREFIX)) {
          const value = localStorage.getItem(key);
          const size = new Blob([value]).size;
          totalSize += size;
          
          try {
            const entry = JSON.parse(value);
            entries.push({ key, size, timestamp: entry.timestamp });
          } catch (e) {
            // Invalid entry
            localStorage.removeItem(key);
          }
        }
      });

      // If over limit, remove oldest entries
      if (totalSize > MAX_CACHE_SIZE) {
        entries.sort((a, b) => a.timestamp - b.timestamp);
        
        let removedSize = 0;
        for (const entry of entries) {
          localStorage.removeItem(entry.key);
          removedSize += entry.size;
          this.stats.evictions++;
          
          if (totalSize - removedSize < MAX_CACHE_SIZE * 0.8) {
            break;
          }
        }
      }
    } catch (e) {
      console.warn('Cache size check failed:', e);
    }
  }

  /**
   * Estimate size of value
   */
  estimateSize(value) {
    try {
      return new Blob([JSON.stringify(value)]).size;
    } catch (e) {
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0
      ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2)
      : 0;

    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      memorySize: this.memoryCache.size,
      localStorageKeys: Object.keys(localStorage).filter(k => k.startsWith(CACHE_PREFIX)).length
    };
  }

  /**
   * Get or set cache value (convenience method)
   */
  async getOrSet(key, fetcher, ttl = DEFAULT_TTL, namespace = 'default') {
    const cached = this.get(key, namespace);
    if (cached !== null) {
      return cached;
    }

    const value = await fetcher();
    this.set(key, value, ttl, namespace);
    return value;
  }
}

// Create singleton instance
const cacheManager = new CacheManager();

// Auto cleanup every 2 minutes
setInterval(() => {
  cacheManager.cleanup();
}, 2 * 60 * 1000);

// Cleanup on page visibility change
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    cacheManager.cleanup();
  }
});

export default cacheManager;

// Namespaces for organized caching
export const CACHE_NAMESPACES = {
  PRODUCTS: 'products',
  USER: 'user',
  SHOP: 'shop',
  API: 'api',
  IMAGES: 'images',
  MARKETPLACE: 'marketplace'
};

// TTL presets
export const CACHE_TTL = {
  SHORT: 1 * 60 * 1000,      // 1 minute
  MEDIUM: 5 * 60 * 1000,     // 5 minutes
  LONG: 15 * 60 * 1000,      // 15 minutes
  VERY_LONG: 60 * 60 * 1000, // 1 hour
  DAY: 24 * 60 * 60 * 1000   // 24 hours
};
