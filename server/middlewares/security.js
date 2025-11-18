const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');

// Request ID tracking for debugging
exports.requestId = (req, res, next) => {
  req.id = crypto.randomUUID();
  res.setHeader('X-Request-ID', req.id);
  next();
};

// Enhanced rate limiting by user
exports.createRateLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // 100 requests per windowMs
    message = 'Too many requests, please try again later.',
    skipSuccessfulRequests = false,
    skipFailedRequests = false
  } = options;

  return rateLimit({
    windowMs,
    max,
    message: { success: false, message },
    skipSuccessfulRequests,
    skipFailedRequests,
    // Key generator - use user ID if authenticated, otherwise IP
    keyGenerator: (req) => req.user?.id || req.ip,
    // Custom handler
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        message,
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
  });
};

// Strict rate limiter for sensitive endpoints
exports.strictRateLimiter = exports.createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests
  message: 'Too many attempts, please try again in 15 minutes.'
});

// Auth rate limiter (login, register, password reset)
exports.authRateLimiter = exports.createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true // Only count failed attempts
});

// API general rate limiter
exports.apiRateLimiter = exports.createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests
  message: 'Too many API requests, please slow down.'
});

// Upload rate limiter
exports.uploadRateLimiter = exports.createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 uploads per hour
  message: 'Too many uploads, please try again later.'
});

// MongoDB injection protection
exports.sanitizeData = () => mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`⚠️  Sanitized potentially malicious input in ${key}`);
  }
});

// HTTP Parameter Pollution protection
exports.preventParameterPollution = () => hpp({
  whitelist: ['category', 'price', 'rating', 'sort', 'tags'] // Allow these params to appear multiple times
});

// XSS protection (basic since xss-clean is deprecated)
exports.xssProtection = (req, res, next) => {
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  };

  const sanitizeObject = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;

    Object.keys(obj).forEach((key) => {
      if (typeof obj[key] === 'string') {
        obj[key] = sanitizeString(obj[key]);
      } else if (typeof obj[key] === 'object') {
        sanitizeObject(obj[key]);
      }
    });

    return obj;
  };

  if (req.body) req.body = sanitizeObject(req.body);
  if (req.query) req.query = sanitizeObject(req.query);
  if (req.params) req.params = sanitizeObject(req.params);

  next();
};

// Secure headers configuration
exports.securityHeaders = (req, res, next) => {
  // Remove powered-by header
  res.removeHeader('X-Powered-By');

  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  next();
};

// CORS configuration helper
const buildAllowedOrigins = () => {
  const envList = [
    process.env.APP_BASE_URL,
    process.env.CLIENT_URL,
    process.env.FRONTEND_URL,
    process.env.WEB_APP_URL,
    process.env.NEXT_PUBLIC_SITE_URL
  ].filter(Boolean);

  // Vercel provides VERCEL_URL without protocol (e.g. myapp.vercel.app)
  if (process.env.VERCEL_URL) {
    envList.push(`https://${process.env.VERCEL_URL}`);
  }

  // Allow comma-separated list in CORS_ALLOWED_ORIGINS
  if (process.env.CORS_ALLOWED_ORIGINS) {
    envList.push(
      ...process.env.CORS_ALLOWED_ORIGINS
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    );
  }

  // Always include common local dev ports
  const localList = ['http://localhost:3000', 'http://localhost:5173'];

  // De-duplicate
  return Array.from(new Set([...localList, ...envList]));
};

exports.corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = buildAllowedOrigins();

    // Allow requests with no origin (mobile apps, Postman, server-to-server)
    if (!origin) return callback(null, true);

    // Exact match against configured origins
    if (allowedOrigins.includes(origin)) return callback(null, true);

    // Allow localhost and private IPs in development
    const localhostPattern = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
    const privateIPPattern = /^https?:\/\/(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3})(:\d+)?$/;
    if (process.env.NODE_ENV !== 'production' && (localhostPattern.test(origin) || privateIPPattern.test(origin))) {
      return callback(null, true);
    }

    // Optionally allow Vercel preview URLs in non-production
    const vercelPreviewPattern = /^https?:\/\/.*\.vercel\.app$/;
    if (process.env.NODE_ENV !== 'production' && vercelPreviewPattern.test(origin)) {
      return callback(null, true);
    }

    // Block unknown origins
    const msg = 'CORS policy does not allow access from this origin.';
    return callback(new Error(msg), false);
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-ID', 'Cache-Control', 'Pragma', 'Expires']
};

// Helmet CSP configuration
exports.helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://trusted-cdn.com'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:', 'blob:', 'https://res.cloudinary.com'],
      // Allow API subdomain and wildcard shop subdomains in addition to configured origins
      connectSrc: [
        "'self'",
        'https://api.wazhop.ng',
        'https://wazhop.ng',
        'https://www.wazhop.ng',
        'https://*.wazhop.ng',
        ...buildAllowedOrigins()
      ].filter(Boolean),
      frameSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    },
  },
  crossOriginEmbedderPolicy: false, // Allow embedding from Cloudinary
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  }
};

// IP detection and logging
exports.trackIP = (req, res, next) => {
  // Get real IP behind proxies
  const ip = req.headers['x-forwarded-for']?.split(',')[0].trim()
              || req.headers['x-real-ip']
              || req.connection.remoteAddress
              || req.socket.remoteAddress
              || req.ip;

  req.clientIP = ip;
  next();
};

// Suspicious activity detection (refined to reduce false positives)
exports.detectSuspiciousActivity = (req, res, next) => {
  // Skip detection for simple health checks
  if (req.path.startsWith('/api/health')) return next();

  const suspiciousPatterns = [
    // Path traversal and sensitive paths
    /(\.\.|\/etc\/|\/bin\/|\/usr\/)/i,
    // SQLi-style payloads (require realistic combinations to avoid false positives)
    /\bunion\s+select\b/i,
    /\bselect\s+.+\s+from\b/i,
    /\binsert\s+into\b/i,
    /\bupdate\s+\w+\s+set\b/i,
    /\bdelete\s+from\b/i,
    /\bdrop\s+(table|database)\b/i,
    /\bcreate\s+(table|database)\b/i,
    /\balter\s+table\b/i,
    /\bexec(\s|\()\b/i,
    /(--|;--)\s*$/i,
    // XSS attempts
    /<script\b/i,
    /javascript:/i,
    /on(error|load)\s*=/i,
  ];

  const checkString = (str) => {
    if (typeof str !== 'string') return false;
    return suspiciousPatterns.some((pattern) => pattern.test(str));
  };

  const checkObject = (obj) => {
    if (!obj || typeof obj !== 'object') return false;
    for (const key in obj) {
      const val = obj[key];
      if (typeof val === 'string' && checkString(val)) return true;
      if (val && typeof val === 'object' && checkObject(val)) return true;
    }
    return false;
  };

  let suspicious = false;

  // Only check body for write methods; check query/params always
  const method = req.method.toUpperCase();
  if (['POST', 'PUT', 'PATCH'].includes(method) && req.body && checkObject(req.body)) suspicious = true;
  if (req.query && checkObject(req.query)) suspicious = true;
  if (req.params && checkObject(req.params)) suspicious = true;

  if (suspicious) {
    console.error(`🚨 Suspicious activity detected from ${req.clientIP} - Request ID: ${req.id} - Path: ${req.path}`);
    return res.status(403).json({
      success: false,
      message: 'Suspicious activity detected. Request blocked.',
      requestId: req.id
    });
  }

  next();
};

// Content-Type validation
exports.validateContentType = (allowedTypes = ['application/json']) => (req, res, next) => {
  // Skip for GET requests
  if (req.method === 'GET' || req.method === 'DELETE') {
    return next();
  }

  const contentType = req.headers['content-type'];

  if (!contentType) {
    return res.status(400).json({
      success: false,
      message: 'Content-Type header is required'
    });
  }

  const isAllowed = allowedTypes.some((type) => contentType.includes(type));

  if (!isAllowed) {
    return res.status(415).json({
      success: false,
      message: `Unsupported Content-Type. Allowed types: ${allowedTypes.join(', ')}`
    });
  }

  next();
};
