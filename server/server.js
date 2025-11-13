const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Import security middlewares
const {
  requestId,
  apiRateLimiter,
  sanitizeData,
  preventParameterPollution,
  xssProtection,
  securityHeaders,
  corsOptions,
  helmetConfig,
  trackIP,
  detectSuspiciousActivity
} = require('./middlewares/security');

// Import logger
const logger = require('./utils/logger');

// Import routes
const authRoutes = require('./routes/auth');
const shopRoutes = require('./routes/shop');
const productRoutes = require('./routes/product');
const userRoutes = require('./routes/user');
const reviewRoutes = require('./routes/review');
const referralRoutes = require('./routes/referral');
const orderRoutes = require('./routes/order');
const subscriptionRoutes = require('./routes/subscription');
const couponRoutes = require('./routes/coupon');
const adminRoutes = require('./routes/admin');
const settingsRoutes = require('./routes/settings');
const healthRoutes = require('./routes/health');

// Import cron jobs
const { startSubscriptionCron } = require('./utils/subscriptionCron');

const app = express();

// Trust proxy (important for Railway, Vercel, etc.)
app.set('trust proxy', 1);

// Security Middleware (order matters!)
app.use(helmet(helmetConfig)); // Security headers with CSP
app.use(requestId); // Request ID tracking
app.use(trackIP); // IP detection and tracking
app.use(cors(corsOptions)); // CORS with enhanced configuration
app.use(express.json({ limit: '10mb' })); // Body parser with size limit
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(sanitizeData()); // MongoDB injection protection
app.use(preventParameterPollution()); // HPP protection
app.use(xssProtection); // XSS protection
app.use(securityHeaders); // Additional security headers
app.use(detectSuspiciousActivity); // Detect malicious patterns

// Logging
if (process.env.NODE_ENV === 'production') {
  app.use(logger.requestLogger); // Winston logger
} else {
  app.use(morgan('dev')); // Development logging
}

// Rate limiting - apply to all API routes
app.use('/api/', apiRateLimiter);

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB Connected Successfully');
    logger.info('MongoDB connected successfully');

    // Start subscription cron job after DB connection
    startSubscriptionCron();
  })
  .catch((err) => {
    console.error('❌ MongoDB Connection Error:', err.message);
    logger.error('MongoDB connection failed', { error: err.message });
    process.exit(1);
  });

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/whatsapp', require('./routes/whatsapp'));

// Legacy health check (keep for backwards compatibility)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'WhatsApp Shop Builder API is running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  // Log error
  logger.logError(err, {
    requestId: req.id,
    method: req.method,
    url: req.originalUrl,
    ip: req.clientIP || req.ip,
    userId: req.user?.id
  });

  // Don't leak error details in production
  const errorResponse = {
    success: false,
    message: err.message || 'Internal Server Error',
    requestId: req.id
  };

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
  }

  res.status(err.status || 500).json(errorResponse);
});

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Server started on port ${PORT}`, {
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version
  });
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  logger.info(`${signal} received. Shutting down gracefully...`);

  server.close(() => {
    console.log('✅ HTTP server closed');
    logger.info('HTTP server closed');

    mongoose.connection.close(false, () => {
      console.log('✅ MongoDB connection closed');
      logger.info('MongoDB connection closed');
      process.exit(0);
    });
  });

  // Force close after 10 seconds
  setTimeout(() => {
    console.error('⚠️  Forced shutdown after timeout');
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 UNCAUGHT EXCEPTION! Shutting down...');
  logger.logError(error, { type: 'uncaughtException' });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 UNHANDLED REJECTION! Shutting down...');
  logger.logError(new Error(String(reason)), {
    type: 'unhandledRejection',
    promise: String(promise)
  });
  process.exit(1);
});

module.exports = app;
