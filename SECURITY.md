# 🔐 WaZhop Security Documentation

## Overview

This document outlines the security measures implemented in the WaZhop platform to protect user data, prevent attacks, and ensure secure operations.

---

## 🛡️ Security Features Implemented

### 1. **Input Validation & Sanitization**

#### Express Validator
- Comprehensive validation for all user inputs
- Located in: `server/middlewares/validation.js`

**Validations Available:**
- ✅ Registration: Name, email, password, WhatsApp
- ✅ Login: Email, password
- ✅ Shop Creation: Shop name, description, category
- ✅ Product Creation: Name, price, stock, SKU
- ✅ Orders: Customer details, shipping address
- ✅ Reviews: Rating, comment
- ✅ Coupons: Code, discount type, value
- ✅ Password Reset: New password strength
- ✅ Pagination: Page and limit validation
- ✅ Search: Query length validation
- ✅ Domain/Subdomain: Format validation

#### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- Maximum 128 characters

**Usage Example:**
```javascript
const { validateRegister } = require('./middlewares/validation');

router.post('/register', validateRegister, register);
```

---

### 2. **Rate Limiting**

Multiple rate limiters to prevent abuse:

| Type | Limit | Window | Use Case |
|------|-------|--------|----------|
| **API General** | 100 requests | 15 min | All API endpoints |
| **Auth** | 10 requests | 15 min | Login, register, password reset |
| **Strict** | 5 requests | 15 min | Sensitive operations |
| **Upload** | 20 uploads | 1 hour | Image uploads |

**Per-User Rate Limiting:**
- Tracks authenticated users by user ID
- Falls back to IP for anonymous users
- Returns 429 status with retry-after header

**Location:** `server/middlewares/security.js`

**Usage Example:**
```javascript
const { authRateLimiter, strictRateLimiter } = require('./middlewares/security');

router.post('/login', authRateLimiter, login);
router.post('/forgot-password', strictRateLimiter, forgotPassword);
```

---

### 3. **SQL & NoSQL Injection Protection**

#### MongoDB Sanitization
- Using `express-mongo-sanitize`
- Automatically removes `$` and `.` from user input
- Prevents query operator injection

**Example Attack Prevented:**
```javascript
// Malicious input:
{ "email": { "$gt": "" }, "password": "anything" }

// After sanitization:
{ "email": "{ _gt: '' }", "password": "anything" }
```

---

### 4. **XSS (Cross-Site Scripting) Protection**

#### Multiple Layers:
1. **Custom XSS middleware** - Strips dangerous patterns
2. **Input sanitization** - Removes script tags, event handlers
3. **Output encoding** - HTML entities encoded

**Patterns Detected:**
- `<script>` tags
- `javascript:` protocol
- Event handlers (`onclick`, `onerror`, etc.)
- Iframe, embed, object tags

**Location:** `server/middlewares/security.js`

---

### 5. **HTTP Parameter Pollution (HPP) Protection**

Using `hpp` middleware to prevent duplicate parameters from causing unexpected behavior.

**Whitelisted Parameters:**
- category
- price
- rating
- sort
- tags

---

### 6. **Security Headers**

#### Helmet Configuration
Comprehensive security headers configured in `server/middlewares/security.js`:

```javascript
Content-Security-Policy: Restricts resource loading
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: Restricts browser features
HSTS: Force HTTPS (production)
```

---

### 7. **CORS (Cross-Origin Resource Sharing)**

**Allowed Origins:**
- `http://localhost:3000` (development)
- `http://localhost:5173` (development)
- `process.env.APP_BASE_URL` (production)
- Private network IPs (development only)

**Configuration:**
```javascript
credentials: true
methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
allowedHeaders: Content-Type, Authorization, X-Requested-With
```

---

### 8. **Two-Factor Authentication (2FA)**

#### Features:
- ✅ TOTP (Time-based One-Time Password)
- ✅ QR code generation for authenticator apps
- ✅ Backup codes (10 codes)
- ✅ **Required for all admin accounts**
- ✅ Optional for regular users

#### Endpoints:
```
POST /api/auth/2fa/setup      - Generate 2FA secret & QR code
POST /api/auth/2fa/verify     - Enable 2FA with verification
POST /api/auth/2fa/disable    - Disable 2FA (requires password + token)
GET  /api/auth/2fa/status     - Check if 2FA is enabled
```

#### Middleware:
```javascript
const { requireAdmin2FA } = require('./middlewares/twoFactor');

// Require 2FA for sensitive admin operations
router.delete('/admin/users/:id', protect, isAdmin, requireAdmin2FA, deleteUser);
```

**Location:** `server/middlewares/twoFactor.js`

---

### 9. **Request Tracking & Logging**

#### Winston Logger
- Logs all requests with request ID
- Separate files for errors, combined logs, exceptions
- Structured JSON logging in production
- Colorized console logging in development

**Log Files:**
```
server/logs/
├── combined.log      - All logs
├── error.log         - Errors only
├── exceptions.log    - Uncaught exceptions
└── rejections.log    - Unhandled promises
```

#### Request ID
- Every request gets a unique UUID
- Included in response headers: `X-Request-ID`
- Used for tracing and debugging

---

### 10. **Suspicious Activity Detection**

Automatically detects and blocks:
- Path traversal attempts (`../`, `/etc/`, `/bin/`)
- SQL injection patterns (`UNION`, `SELECT`, etc.)
- XSS attempts (`<script>`, `javascript:`, etc.)

Returns **403 Forbidden** with logged security event.

---

### 11. **Password Security**

#### Hashing
- Using `bcryptjs` with salt rounds = 10
- Passwords never stored in plain text
- Password field excluded by default in queries

#### Password Strength Checker
```javascript
const { checkPasswordStrength } = require('./utils/security');

const result = checkPasswordStrength('MyPass123!');
// Returns: { score, feedback, isStrong, strength }
```

**Strength Levels:**
- Weak (score < 3)
- Medium (score 3-4)
- Strong (score >= 5)

---

### 12. **Encryption Utilities**

#### Available Functions:
```javascript
const security = require('./utils/security');

// Generate secure tokens
const token = security.generateSecureToken(32);

// Generate OTP
const otp = security.generateOTP(6);

// Encrypt/Decrypt sensitive data
const encrypted = security.encrypt('sensitive data');
const decrypted = security.decrypt(encrypted);

// Hash data (one-way)
const hash = security.hashData('data to hash');
```

**Location:** `server/utils/security.js`

---

### 13. **Account Protection**

#### User Model Security Fields:
```javascript
{
  loginAttempts: Number,      // Track failed logins
  lockUntil: Date,            // Account lockout timestamp
  lastLoginAt: Date,          // Last successful login
  lastLoginIP: String,        // Last login IP address
  twoFactorEnabled: Boolean,  // 2FA status
  twoFactorSecret: String,    // 2FA secret (encrypted)
}
```

#### Account Lockout (To Implement)
- Lock account after 5 failed login attempts
- 30-minute lockout period
- Email notification on lockout

---

### 14. **Email Security**

#### Disposable Email Detection
```javascript
const { isDisposableEmail } = require('./utils/security');

if (isDisposableEmail('test@tempmail.com')) {
  // Reject registration
}
```

**Blocked Domains:**
- tempmail.com
- 10minutemail.com
- guerrillamail.com
- mailinator.com
- And more...

---

### 15. **Sensitive Data Masking**

For logs and error reporting:
```javascript
const { maskSensitiveData } = require('./utils/security');

const data = {
  email: 'user@example.com',
  password: 'secret123',
  token: 'abc123xyz789'
};

console.log(maskSensitiveData(data));
// { email: 'us****@example.com', password: '****', token: 'ab****89' }
```

---

## 🚨 Security Best Practices

### For Developers:

1. **Never commit secrets**
   - Use `.env` file (already in `.gitignore`)
   - Use environment variables in production

2. **Always validate user input**
   - Use validation middleware on all routes
   - Sanitize before database operations

3. **Use parameterized queries**
   - Mongoose automatically handles this
   - Never concatenate user input into queries

4. **Keep dependencies updated**
   ```bash
   npm audit
   npm audit fix
   ```

5. **Use HTTPS in production**
   - Enabled by default on Railway/Vercel
   - Set `NODE_ENV=production`

6. **Implement least privilege**
   - Users only access their own data
   - Admin checks on sensitive operations

7. **Log security events**
   ```javascript
   logger.logSecurityEvent('suspicious_activity', {
     ip: req.clientIP,
     pattern: 'sql_injection',
     requestId: req.id
   });
   ```

---

## 🔧 Environment Variables

### Required Security Variables:

```bash
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
JWT_EXPIRE=30d

# Encryption Key (for sensitive data)
ENCRYPTION_KEY=your-encryption-key-min-32-characters

# Environment
NODE_ENV=production

# Frontend URL (for CORS)
APP_BASE_URL=https://your-frontend.vercel.app

# Admin Credentials
ADMIN_EMAIL=admin@wazhop.ng
ADMIN_PASSWORD=StrongAdminPassword123!
```

### Generating Secure Secrets:

```bash
# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate ENCRYPTION_KEY
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🧪 Testing Security

### Manual Security Tests:

1. **SQL Injection Test**
   ```bash
   curl -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@test.com OR 1=1--","password":"any"}'
   ```
   **Expected:** Request blocked or sanitized

2. **XSS Test**
   ```bash
   curl -X POST http://localhost:5000/api/products \
     -H "Content-Type: application/json" \
     -d '{"name":"<script>alert(1)</script>","price":100}'
   ```
   **Expected:** Script tags removed

3. **Rate Limit Test**
   ```bash
   for i in {1..15}; do
     curl http://localhost:5000/api/auth/login \
       -d '{"email":"test@test.com","password":"wrong"}'
   done
   ```
   **Expected:** 429 Too Many Requests after threshold

4. **CORS Test**
   ```bash
   curl -H "Origin: http://malicious-site.com" \
        http://localhost:5000/api/health
   ```
   **Expected:** CORS error

---

## 🔍 Security Monitoring

### What to Monitor:

1. **Failed Login Attempts**
   - Track in `server/logs/combined.log`
   - Look for patterns (same IP, same user)

2. **Rate Limit Hits**
   - 429 responses in logs
   - Potential DDoS or abuse

3. **Suspicious Activity Blocks**
   - 403 responses with "suspicious activity"
   - Review patterns in logs

4. **Error Spikes**
   - Check `server/logs/error.log`
   - May indicate attacks or bugs

5. **Database Connection Issues**
   - Could be resource exhaustion attack

### Recommended Tools:

- **Sentry** - Error tracking (implement later)
- **Datadog** - APM and monitoring
- **LogRocket** - Session replay
- **UptimeRobot** - Uptime monitoring

---

## 📋 Security Checklist

Before going to production:

- [ ] All environment variables set
- [ ] JWT_SECRET is strong (64+ characters)
- [ ] HTTPS enabled (automatic on Vercel/Railway)
- [ ] Rate limiting configured appropriately
- [ ] MongoDB Atlas IP whitelist configured
- [ ] Admin accounts have 2FA enabled
- [ ] Error messages don't leak sensitive info
- [ ] Logging configured and tested
- [ ] Backup strategy in place
- [ ] Security headers verified (securityheaders.com)
- [ ] CORS configured for production domain only
- [ ] Dependencies audited (`npm audit`)
- [ ] Cloudinary credentials secured
- [ ] Email service credentials secured
- [ ] Test data removed
- [ ] Debug mode disabled (`NODE_ENV=production`)

---

## 🚑 Incident Response

### If a security incident occurs:

1. **Immediate Actions:**
   - Identify affected systems
   - Isolate compromised accounts
   - Change all credentials
   - Review logs for extent of breach

2. **Investigation:**
   - Check `server/logs/` for patterns
   - Review database for unauthorized changes
   - Identify attack vector

3. **Remediation:**
   - Patch vulnerability
   - Deploy fix
   - Reset affected user passwords
   - Notify affected users

4. **Post-Incident:**
   - Document incident
   - Update security measures
   - Conduct security review

---

## 📞 Security Contacts

**Report Security Issues:**
- Email: security@wazhop.ng
- Do NOT open public GitHub issues for security bugs

**Bug Bounty:**
- Coming soon...

---

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Node.js Security Checklist](https://github.com/goldbergyoni/nodebestpractices#6-security-best-practices)
- [MongoDB Security Checklist](https://docs.mongodb.com/manual/administration/security-checklist/)

---

## 🔄 Regular Maintenance

### Weekly:
- [ ] Review security logs
- [ ] Check for suspicious activity
- [ ] Monitor rate limit hits

### Monthly:
- [ ] Run `npm audit` and update dependencies
- [ ] Review and rotate API keys
- [ ] Test backup restoration
- [ ] Review user access levels

### Quarterly:
- [ ] Full security audit
- [ ] Penetration testing
- [ ] Update security documentation
- [ ] Train team on new threats

---

**Last Updated:** November 13, 2025
**Version:** 1.0.0
**Maintained by:** WaZhop Security Team
