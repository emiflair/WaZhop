const crypto = require('crypto');

/**
 * Password strength checker
 * Returns { score, feedback, isStrong }
 */
exports.checkPasswordStrength = (password) => {
  let score = 0;
  const feedback = [];

  // Length check
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  else if (password.length < 8) {
    feedback.push('Password should be at least 8 characters long');
  }

  // Character variety checks
  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('Add lowercase letters');

  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('Add uppercase letters');

  if (/\d/.test(password)) score += 1;
  else feedback.push('Add numbers');

  if (/[^a-zA-Z0-9]/.test(password)) score += 1;
  else feedback.push('Add special characters (!@#$%^&*)');

  // Common patterns (weak)
  const commonPatterns = [
    /^123456/,
    /^password/i,
    /^qwerty/i,
    /^abc123/i,
    /^admin/i,
    /^letmein/i,
    /^welcome/i,
    /(.)\1{2,}/, // Repeated characters
  ];

  if (commonPatterns.some((pattern) => pattern.test(password))) {
    score -= 2;
    feedback.push('Avoid common patterns');
  }

  const isStrong = score >= 5;

  return {
    score: Math.max(0, Math.min(score, 7)), // 0-7
    feedback,
    isStrong,
    strength: score < 3 ? 'weak' : score < 5 ? 'medium' : 'strong'
  };
};

/**
 * Generate secure random token
 */
exports.generateSecureToken = (length = 32) => crypto.randomBytes(length).toString('hex');

/**
 * Generate numeric OTP
 */
exports.generateOTP = (length = 6) => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
};

/**
 * Hash sensitive data
 */
exports.hashData = (data) => crypto.createHash('sha256').update(data).digest('hex');

/**
 * Encrypt data (AES-256-CBC)
 */
exports.encrypt = (text) => {
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key', 'salt', 32);
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return `${iv.toString('hex')}:${encrypted}`;
};

/**
 * Decrypt data (AES-256-CBC)
 */
exports.decrypt = (encryptedData) => {
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key', 'salt', 32);

  const [ivHex, encrypted] = encryptedData.split(':');
  const iv = Buffer.from(ivHex, 'hex');

  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
};

/**
 * Sanitize HTML to prevent XSS
 */
exports.sanitizeHTML = (dirty) => {
  if (typeof dirty !== 'string') return dirty;

  return dirty
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Remove potentially dangerous characters
 */
exports.sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;

  // Remove control characters
  return input.replace(/[\x00-\x1F\x7F]/g, '');
};

/**
 * Validate and sanitize URL
 */
exports.sanitizeURL = (url) => {
  if (!url) return null;

  try {
    const parsed = new URL(url);

    // Only allow http and https
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }

    return parsed.toString();
  } catch (error) {
    return null;
  }
};

/**
 * Generate CSRF token
 */
exports.generateCSRFToken = () => crypto.randomBytes(32).toString('base64');

/**
 * Verify CSRF token
 */
exports.verifyCSRFToken = (token, storedToken) => {
  if (!token || !storedToken) return false;
  return crypto.timingSafeEqual(
    Buffer.from(token),
    Buffer.from(storedToken)
  );
};

/**
 * Rate limit key generator
 */
exports.getRateLimitKey = (req, identifier = 'global') => {
  const ip = req.clientIP || req.ip;
  const userId = req.user?.id || 'anonymous';
  return `ratelimit:${identifier}:${userId}:${ip}`;
};

/**
 * Check if email is disposable
 */
exports.isDisposableEmail = (email) => {
  const disposableDomains = [
    'tempmail.com',
    '10minutemail.com',
    'guerrillamail.com',
    'mailinator.com',
    'throwaway.email',
    'getnada.com',
    'temp-mail.org',
    'maildrop.cc'
  ];

  const domain = email.split('@')[1]?.toLowerCase();
  return disposableDomains.includes(domain);
};

/**
 * Detect SQL injection attempts
 */
exports.detectSQLInjection = (input) => {
  if (typeof input !== 'string') return false;

  const sqlPatterns = [
    /(\bUNION\b|\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b|\bCREATE\b|\bALTER\b|\bEXEC\b)/i,
    /(--|;|\/\*|\*\/|'|"|`)/,
    /(\bOR\b|\bAND\b)\s+\d+\s*=\s*\d+/i
  ];

  return sqlPatterns.some((pattern) => pattern.test(input));
};

/**
 * Detect XSS attempts
 */
exports.detectXSS = (input) => {
  if (typeof input !== 'string') return false;

  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe/gi,
    /<embed/gi,
    /<object/gi
  ];

  return xssPatterns.some((pattern) => pattern.test(input));
};

/**
 * Secure comparison to prevent timing attacks
 */
exports.secureCompare = (a, b) => {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }

  if (a.length !== b.length) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
};

/**
 * Generate API key
 */
exports.generateAPIKey = () => {
  const prefix = 'wz'; // WaZhop prefix
  const key = crypto.randomBytes(24).toString('base64url');
  return `${prefix}_${key}`;
};

/**
 * Mask sensitive data for logging
 */
exports.maskSensitiveData = (data) => {
  if (!data) return data;

  const mask = (str) => {
    if (!str || str.length < 4) return '****';
    return `${str.slice(0, 2)}****${str.slice(-2)}`;
  };

  if (typeof data === 'string') {
    return mask(data);
  }

  if (typeof data === 'object') {
    const masked = {};
    for (const [key, value] of Object.entries(data)) {
      if (['password', 'token', 'secret', 'apiKey', 'ssn', 'cardNumber'].includes(key)) {
        masked[key] = mask(String(value));
      } else if (key === 'email') {
        const [local, domain] = String(value).split('@');
        masked[key] = `${mask(local)}@${domain}`;
      } else {
        masked[key] = value;
      }
    }
    return masked;
  }

  return data;
};

/**
 * IP whitelist checker
 */
exports.isIPWhitelisted = (ip, whitelist = []) => whitelist.includes(ip);

/**
 * Generate fingerprint from request
 */
exports.generateRequestFingerprint = (req) => {
  const components = [
    req.headers['user-agent'],
    req.headers['accept-language'],
    req.headers['accept-encoding'],
    req.clientIP || req.ip
  ].join('|');

  return crypto.createHash('sha256').update(components).digest('hex');
};
