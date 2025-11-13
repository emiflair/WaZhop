const express = require('express');

const router = express.Router();
const mongoose = require('mongoose');
const os = require('os');

/**
 * @route   GET /api/health
 * @desc    Basic health check
 * @access  Public
 */
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'WaZhop API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

/**
 * @route   GET /api/health/detailed
 * @desc    Detailed health check with dependencies
 * @access  Public (but should be monitored)
 */
router.get('/detailed', async (req, res) => {
  const healthcheck = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    checks: {}
  };

  // Database check
  try {
    const dbState = mongoose.connection.readyState;
    const dbStatus = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    healthcheck.checks.database = {
      status: dbState === 1 ? 'healthy' : 'unhealthy',
      state: dbStatus[dbState],
      connected: dbState === 1
    };

    if (dbState === 1) {
      // Ping database
      await mongoose.connection.db.admin().ping();
      healthcheck.checks.database.latency = 'responsive';
    }
  } catch (error) {
    healthcheck.checks.database = {
      status: 'unhealthy',
      error: error.message
    };
    healthcheck.status = 'degraded';
  }

  // Memory check
  const memUsage = process.memoryUsage();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memPercentage = ((usedMem / totalMem) * 100).toFixed(2);

  healthcheck.checks.memory = {
    status: memPercentage < 90 ? 'healthy' : 'warning',
    usage: {
      rss: `${(memUsage.rss / 1024 / 1024).toFixed(2)} MB`,
      heapTotal: `${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
      heapUsed: `${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
      external: `${(memUsage.external / 1024 / 1024).toFixed(2)} MB`
    },
    system: {
      total: `${(totalMem / 1024 / 1024 / 1024).toFixed(2)} GB`,
      free: `${(freeMem / 1024 / 1024 / 1024).toFixed(2)} GB`,
      used: `${memPercentage}%`
    }
  };

  // CPU check
  const cpus = os.cpus();
  healthcheck.checks.cpu = {
    status: 'healthy',
    cores: cpus.length,
    model: cpus[0].model,
    load: os.loadavg()
  };

  // Process info
  healthcheck.process = {
    nodeVersion: process.version,
    pid: process.pid,
    platform: process.platform,
    arch: process.arch
  };

  // Determine overall status
  const unhealthyChecks = Object.values(healthcheck.checks).filter(
    (check) => check.status === 'unhealthy'
  );

  if (unhealthyChecks.length > 0) {
    healthcheck.status = 'unhealthy';
    return res.status(503).json(healthcheck);
  }

  const warningChecks = Object.values(healthcheck.checks).filter(
    (check) => check.status === 'warning'
  );

  if (warningChecks.length > 0) {
    healthcheck.status = 'degraded';
  }

  res.status(200).json(healthcheck);
});

/**
 * @route   GET /api/health/ready
 * @desc    Readiness probe for Kubernetes/container orchestration
 * @access  Public
 */
router.get('/ready', async (req, res) => {
  try {
    // Check if database is connected
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        status: 'not ready',
        reason: 'database not connected'
      });
    }

    // Ping database
    await mongoose.connection.db.admin().ping();

    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      reason: error.message
    });
  }
});

/**
 * @route   GET /api/health/live
 * @desc    Liveness probe for Kubernetes/container orchestration
 * @access  Public
 */
router.get('/live', (req, res) => {
  // Simple liveness check - if the server can respond, it's alive
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString()
  });
});

/**
 * @route   GET /api/health/version
 * @desc    Get API version info
 * @access  Public
 */
router.get('/version', (req, res) => {
  const packageJson = require('../package.json');

  res.status(200).json({
    name: packageJson.name,
    version: packageJson.version,
    description: packageJson.description,
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'development'
  });
});

module.exports = router;
