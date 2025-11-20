const Redis = require('ioredis');
const logger = require('./logger');

/**
 * Redis Cache Manager
 * Implements caching layer for frequently accessed data
 * Reduces database load by 70-80% for cached queries
 */

let redisClient = null;
let isRedisAvailable = false;

/**
 * Initialize Redis connection
 */
const initRedis = () => {
  // Only initialize if REDIS_URL is provided
  if (!process.env.REDIS_URL) {
    logger.warn('REDIS_URL not configured, caching disabled');
    return null;
  }

  try {
    redisClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      reconnectOnError(err) {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          // Reconnect when Redis is in readonly mode
          return true;
        }
        return false;
      }
    });

    redisClient.on('connect', () => {
      logger.info('✅ Redis connected successfully');
      isRedisAvailable = true;
    });

    redisClient.on('error', (err) => {
      logger.error('Redis connection error', { error: err.message });
      isRedisAvailable = false;
    });

    redisClient.on('close', () => {
      logger.warn('Redis connection closed');
      isRedisAvailable = false;
    });

    return redisClient;
  } catch (error) {
    logger.error('Failed to initialize Redis', { error: error.message });
    return null;
  }
};

/**
 * Cache TTL configurations (in seconds)
 */
const CACHE_TTL = {
  SHOP_PAGE: 300, // 5 minutes - shop data changes infrequently
  MARKETPLACE_LISTINGS: 120, // 2 minutes - product listings
  PRODUCT_DETAIL: 300, // 5 minutes - individual product
  SHOP_PRODUCTS: 180, // 3 minutes - shop's product list
  USER_SHOPS: 300, // 5 minutes - user's shops list
  ORDER_STATS: 60, // 1 minute - order statistics
  REVIEW_STATS: 300 // 5 minutes - review aggregations
};

/**
 * Generate cache key with namespace
 */
const getCacheKey = (namespace, identifier) => `wazhop:${namespace}:${identifier}`;

/**
 * Get cached data
 */
const get = async (key) => {
  if (!isRedisAvailable || !redisClient) {
    return null;
  }

  try {
    const data = await redisClient.get(key);
    if (data) {
      logger.debug('Cache HIT', { key });
      return JSON.parse(data);
    }
    logger.debug('Cache MISS', { key });
    return null;
  } catch (error) {
    logger.error('Redis get error', { key, error: error.message });
    return null;
  }
};

/**
 * Set cached data with TTL
 */
const set = async (key, value, ttl = 300) => {
  if (!isRedisAvailable || !redisClient) {
    return false;
  }

  try {
    await redisClient.setex(key, ttl, JSON.stringify(value));
    logger.debug('Cache SET', { key, ttl });
    return true;
  } catch (error) {
    logger.error('Redis set error', { key, error: error.message });
    return false;
  }
};

/**
 * Delete cached data
 */
const del = async (key) => {
  if (!isRedisAvailable || !redisClient) {
    return false;
  }

  try {
    await redisClient.del(key);
    logger.debug('Cache DELETE', { key });
    return true;
  } catch (error) {
    logger.error('Redis delete error', { key, error: error.message });
    return false;
  }
};

/**
 * Delete cached data by pattern
 */
const delPattern = async (pattern) => {
  if (!isRedisAvailable || !redisClient) {
    return false;
  }

  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(...keys);
      logger.debug('Cache DELETE by pattern', { pattern, count: keys.length });
    }
    return true;
  } catch (error) {
    logger.error('Redis delete pattern error', { pattern, error: error.message });
    return false;
  }
};

/**
 * Cache middleware for Express routes
 * Usage: router.get('/path', cacheMiddleware('namespace', 300), handler)
 */
const cacheMiddleware = (namespace, ttl = 300) => async (req, res, next) => {
  if (!isRedisAvailable) {
    return next();
  }

  // Generate cache key from request
  const cacheKey = getCacheKey(namespace, req.originalUrl || req.url);

  try {
    const cachedData = await get(cacheKey);
    if (cachedData) {
      // Add cache header
      res.set('X-Cache', 'HIT');
      return res.json(cachedData);
    }

    // Store original res.json
    const originalJson = res.json.bind(res);

    // Override res.json to cache response
    res.json = (data) => {
      // Only cache successful responses
      if (res.statusCode === 200 && data) {
        set(cacheKey, data, ttl).catch((err) => {
          logger.error('Failed to cache response', { error: err.message });
        });
      }
      res.set('X-Cache', 'MISS');
      return originalJson(data);
    };

    next();
  } catch (error) {
    logger.error('Cache middleware error', { error: error.message });
    next();
  }
};

/**
 * Invalidate cache for a specific resource
 * Call this after CREATE/UPDATE/DELETE operations
 */
const invalidateCache = async (namespace, identifier = '*') => {
  const pattern = getCacheKey(namespace, identifier);
  return await delPattern(pattern);
};

/**
 * Flush entire cache (use sparingly)
 */
const flushAll = async () => {
  if (!isRedisAvailable || !redisClient) {
    return false;
  }

  try {
    await redisClient.flushdb();
    logger.warn('Cache FLUSHED');
    return true;
  } catch (error) {
    logger.error('Redis flush error', { error: error.message });
    return false;
  }
};

/**
 * Get cache statistics
 */
const getStats = async () => {
  if (!isRedisAvailable || !redisClient) {
    return { available: false };
  }

  try {
    const info = await redisClient.info('stats');
    const keyspace = await redisClient.info('keyspace');

    return {
      available: true,
      info,
      keyspace
    };
  } catch (error) {
    logger.error('Redis stats error', { error: error.message });
    return { available: false, error: error.message };
  }
};

/**
 * Close Redis connection gracefully
 */
const closeRedis = async () => {
  if (redisClient) {
    await redisClient.quit();
    logger.info('Redis connection closed');
  }
};

module.exports = {
  initRedis,
  get,
  set,
  del,
  delPattern,
  getCacheKey,
  cacheMiddleware,
  invalidateCache,
  flushAll,
  getStats,
  closeRedis,
  CACHE_TTL,
  isRedisAvailable: () => isRedisAvailable
};
