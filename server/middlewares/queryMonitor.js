const logger = require('../utils/logger');

/**
 * Query Performance Monitor
 * Logs slow queries in development/staging for optimization
 */

const SLOW_QUERY_THRESHOLD_MS = 1000; // 1 second

/**
 * Enable mongoose query logging in development
 */
const enableQueryLogging = (mongoose) => {
  if (process.env.NODE_ENV === 'development') {
    // Log all queries with execution time
    mongoose.set('debug', (collectionName, method, query, doc, options) => {
      const timestamp = new Date().toISOString();
      logger.info('MongoDB Query', {
        timestamp,
        collection: collectionName,
        method,
        query: JSON.stringify(query),
        options: JSON.stringify(options)
      });
    });
  }
};

/**
 * Mongoose middleware to track query execution time
 * Logs queries that exceed the slow query threshold
 */
const queryPerformancePlugin = (schema) => {
  // Pre-hook: Start timer
  schema.pre(/^find/, function (next) {
    this.queryStartTime = Date.now();
    next();
  });

  schema.pre(/^aggregate/, function (next) {
    this.queryStartTime = Date.now();
    next();
  });

  // Post-hook: Calculate execution time
  schema.post(/^find/, function () {
    if (this.queryStartTime) {
      const executionTime = Date.now() - this.queryStartTime;

      if (executionTime > SLOW_QUERY_THRESHOLD_MS) {
        logger.warn('Slow Query Detected', {
          collection: this.mongooseCollection.name,
          operation: this.op || 'find',
          executionTime: `${executionTime}ms`,
          query: JSON.stringify(this.getQuery()),
          options: JSON.stringify(this.getOptions())
        });
      }
    }
  });

  schema.post(/^aggregate/, function (result) {
    if (this.queryStartTime) {
      const executionTime = Date.now() - this.queryStartTime;

      if (executionTime > SLOW_QUERY_THRESHOLD_MS) {
        logger.warn('Slow Aggregation Detected', {
          collection: this.model.collection.name,
          operation: 'aggregate',
          executionTime: `${executionTime}ms`,
          pipeline: JSON.stringify(this.pipeline())
        });
      }
    }
  });
};

/**
 * Express middleware to add maxTimeMS to prevent runaway queries
 * This prevents queries from running indefinitely and blocking connections
 */
const preventRunawayQueries = (maxTimeMS = 10000) => (req, res, next) => {
  // Store original mongoose Query.prototype.exec
  const originalExec = req.app.locals.mongoose?.Query?.prototype?.exec;

  if (originalExec && req.app.locals.mongoose) {
    req.app.locals.mongoose.Query.prototype.exec = function (callback) {
      // Add maxTimeMS if not already set
      if (!this.options.maxTimeMS) {
        this.maxTimeMS(maxTimeMS);
      }
      return originalExec.call(this, callback);
    };
  }

  next();
};

/**
 * Helper function to explain a query (for debugging)
 * Usage: await explainQuery(Model.find({ ... }))
 */
const explainQuery = async (query) => {
  try {
    const explanation = await query.explain('executionStats');

    logger.info('Query Execution Plan', {
      queryPlanner: explanation.queryPlanner,
      executionStats: {
        executionTimeMillis: explanation.executionStats.executionTimeMillis,
        totalDocsExamined: explanation.executionStats.totalDocsExamined,
        totalKeysExamined: explanation.executionStats.totalKeysExamined,
        nReturned: explanation.executionStats.nReturned,
        indexUsed: explanation.executionStats.executionStages?.indexName || 'No index'
      }
    });

    return explanation;
  } catch (error) {
    logger.error('Query explain failed', { error: error.message });
    throw error;
  }
};

module.exports = {
  enableQueryLogging,
  queryPerformancePlugin,
  preventRunawayQueries,
  explainQuery,
  SLOW_QUERY_THRESHOLD_MS
};
