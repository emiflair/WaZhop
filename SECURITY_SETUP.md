# 🔐 Security Implementation - Quick Start Guide

## ✅ What's Been Implemented

Your WaZhop application now has enterprise-grade security features:

### 1. **Input Validation** ✅
- All user inputs validated with express-validator
- Located in: `server/middlewares/validation.js`
- Prevents invalid data from reaching your database

### 2. **Rate Limiting** ✅
- Per-user and per-IP rate limiting
- Different limits for different endpoints
- Prevents brute force and DDoS attacks

### 3. **Attack Prevention** ✅
- SQL/NoSQL injection protection
- XSS (Cross-Site Scripting) protection
- HTTP Parameter Pollution protection
- Path traversal detection
- Suspicious activity blocking

### 4. **Security Headers** ✅
- Content Security Policy (CSP)
- XSS Protection headers
- Frame options (clickjacking prevention)
- HSTS (Force HTTPS)

### 5. **Two-Factor Authentication (2FA)** ✅
- TOTP-based (works with Google Authenticator, Authy, etc.)
- **Required for all admin accounts**
- Backup codes for recovery
- QR code generation

### 6. **Logging & Monitoring** ✅
- Winston logger with structured logging
- Request ID tracking for debugging
- Security event logging
- Separate log files for errors, exceptions, rejections

### 7. **Encryption & Hashing** ✅
- bcrypt for password hashing
- AES-256-CBC for sensitive data encryption
- Secure token generation utilities
- Timing-safe comparisons

---

## 🚀 Getting Started

### Step 1: Install Dependencies

```bash
cd server
npm install
```

**New packages installed:**
- `express-mongo-sanitize` - NoSQL injection protection
- `hpp` - HTTP Parameter Pollution protection
- `uuid` - Request ID generation
- `speakeasy` - 2FA TOTP generation
- `qrcode` - QR code generation for 2FA
- `winston` - Advanced logging

### Step 2: Update Environment Variables

Add these to your `server/.env` file:

```bash
# Security
JWT_SECRET=your-super-secret-jwt-key-min-64-characters-recommended
ENCRYPTION_KEY=your-encryption-key-min-32-characters
NODE_ENV=development

# Frontend URL (for CORS)
APP_BASE_URL=http://localhost:5173

# Logging
LOG_LEVEL=info
```

**Generate secure secrets:**
```bash
# Generate JWT_SECRET (64 bytes)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate ENCRYPTION_KEY (32 bytes)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 3: Start the Server

```bash
npm run dev
```

---

## 🧪 Testing Security Features

### 1. Test Rate Limiting

Try making multiple requests quickly:
```bash
# This should succeed
curl http://localhost:5000/api/health

# Make 15 rapid requests - should get rate limited
for i in {1..15}; do
  curl http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
  echo ""
done
```

Expected: After 10 attempts, you'll get `429 Too Many Requests`

### 2. Test Input Validation

Try registering with invalid data:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "A",
    "email": "not-an-email",
    "password": "weak"
  }'
```

Expected: Validation errors returned

### 3. Test XSS Protection

Try creating a product with malicious content:
```bash
curl -X POST http://localhost:5000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "<script>alert(\"XSS\")</script>",
    "price": 100
  }'
```

Expected: Script tags removed or blocked

### 4. Test Request ID Tracking

Make any request and check the response headers:
```bash
curl -I http://localhost:5000/api/health
```

Expected: Header `X-Request-ID: <uuid>` present

---

## 🔐 Setting Up 2FA for Admin Users

### For Admin Users (Required):

1. **Setup 2FA:**
   ```bash
   POST /api/auth/2fa/setup
   Authorization: Bearer YOUR_ADMIN_TOKEN
   ```

   Response includes:
   - QR code (base64 image)
   - Secret key (for manual entry)

2. **Scan QR Code:**
   - Use Google Authenticator, Authy, or similar app
   - Scan the QR code

3. **Verify and Enable:**
   ```bash
   POST /api/auth/2fa/verify
   Authorization: Bearer YOUR_ADMIN_TOKEN
   Content-Type: application/json
   
   {
     "token": "123456"
   }
   ```

   Response includes 10 backup codes - **SAVE THESE!**

4. **Using 2FA:**
   For protected admin operations, include the 2FA token:
   ```bash
   POST /api/admin/sensitive-operation
   Authorization: Bearer YOUR_ADMIN_TOKEN
   X-2FA-Token: 123456
   ```

---

## 📊 Monitoring & Logs

### Log Files Location:

```
server/logs/
├── combined.log      - All logs
├── error.log         - Errors only
├── exceptions.log    - Uncaught exceptions
└── rejections.log    - Unhandled promises
```

### Viewing Logs:

```bash
# View all logs
tail -f server/logs/combined.log

# View errors only
tail -f server/logs/error.log

# Search for security events
grep "Security event" server/logs/combined.log
```

### Log Format:

```json
{
  "timestamp": "2025-11-13 10:30:45",
  "level": "info",
  "message": "Request completed",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "method": "POST",
  "url": "/api/auth/login",
  "statusCode": 200,
  "duration": "45ms",
  "userId": "user123"
}
```

---

## 🛠️ Using Security Utilities

### Password Strength Checker:

```javascript
const { checkPasswordStrength } = require('./utils/security');

const result = checkPasswordStrength('MyPassword123!');
console.log(result);
// {
//   score: 6,
//   feedback: [],
//   isStrong: true,
//   strength: 'strong'
// }
```

### Encrypt Sensitive Data:

```javascript
const { encrypt, decrypt } = require('./utils/security');

// Encrypt
const encrypted = encrypt('sensitive data');
// Returns: "iv:encrypted_data"

// Decrypt
const decrypted = decrypt(encrypted);
// Returns: "sensitive data"
```

### Generate Secure Tokens:

```javascript
const { generateSecureToken, generateOTP } = require('./utils/security');

const token = generateSecureToken(32);  // 64 char hex string
const otp = generateOTP(6);            // 6 digit code
```

### Mask Sensitive Data for Logging:

```javascript
const { maskSensitiveData } = require('./utils/security');

const userData = {
  email: 'user@example.com',
  password: 'secret123',
  token: 'abc123xyz789'
};

console.log(maskSensitiveData(userData));
// { email: 'us****@example.com', password: '****', token: 'ab****89' }
```

---

## 🔒 Applying Security to Routes

### Example: Protected Route with Validation

```javascript
const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('./middlewares/auth');
const { validateProduct } = require('./middlewares/validation');
const { uploadRateLimiter } = require('./middlewares/security');
const { requireAdmin2FA } = require('./middlewares/twoFactor');

// Public route with validation
router.post('/products', 
  validateProduct,  // Validate input
  createProduct
);

// Protected route
router.put('/products/:id',
  protect,          // Require authentication
  validateProduct,  // Validate input
  updateProduct
);

// Admin route with 2FA
router.delete('/users/:id',
  protect,          // Require authentication
  isAdmin,          // Require admin role
  requireAdmin2FA,  // Require 2FA for admins
  deleteUser
);

// Upload route with rate limiting
router.post('/upload',
  protect,
  uploadRateLimiter,  // Limit uploads
  upload
);
```

---

## 🚨 Common Issues & Solutions

### Issue: Rate Limit Too Strict

**Solution:** Adjust limits in `server/middlewares/security.js`:
```javascript
exports.apiRateLimiter = exports.createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 200,  // Increase from 100 to 200
  message: 'Too many API requests'
});
```

### Issue: CORS Errors

**Solution:** Make sure `APP_BASE_URL` in `.env` matches your frontend URL:
```bash
APP_BASE_URL=http://localhost:5173
```

### Issue: 2FA Not Working

**Solutions:**
1. Check time sync on server (TOTP depends on accurate time)
2. Use larger time window in `twoFactor.js`:
   ```javascript
   window: 2  // Try increasing to 3 or 4
   ```

### Issue: Logs Not Being Created

**Solution:** Ensure logs directory exists:
```bash
mkdir -p server/logs
chmod 755 server/logs
```

---

## 📝 Next Steps

### Recommended Immediate Actions:

1. ✅ **Generate strong secrets** for JWT_SECRET and ENCRYPTION_KEY
2. ✅ **Enable 2FA** for all admin accounts
3. ✅ **Test rate limiting** with your expected traffic
4. ✅ **Review logs** to ensure everything is working
5. ✅ **Add validation** to any routes missing it

### Before Production:

1. [ ] Set `NODE_ENV=production`
2. [ ] Use strong, unique secrets (not examples)
3. [ ] Configure MongoDB Atlas IP whitelist
4. [ ] Set up monitoring (Sentry, Datadog, etc.)
5. [ ] Test all security features
6. [ ] Review SECURITY.md checklist
7. [ ] Set up automated backups
8. [ ] Configure SSL/HTTPS
9. [ ] Review and adjust rate limits for production traffic
10. [ ] Document incident response procedures

---

## 📚 Documentation

- **Full Security Guide:** `SECURITY.md`
- **API Documentation:** (Create later with Swagger)
- **Deployment Guide:** `DEPLOYMENT_GUIDE.md`

---

## 🆘 Getting Help

**Security Questions:**
- Review `SECURITY.md`
- Check logs in `server/logs/`
- Test with curl examples above

**Report Security Issues:**
- Email: security@wazhop.com
- Do NOT open public GitHub issues

---

## 🎉 You're All Set!

Your WaZhop application now has:
- ✅ Enterprise-grade security
- ✅ Comprehensive input validation
- ✅ Multi-layer attack prevention
- ✅ Advanced logging and monitoring
- ✅ Two-factor authentication
- ✅ Rate limiting and DDoS protection

**Start the server and test it out:**
```bash
cd server
npm run dev
```

Check the logs to see security in action:
```bash
tail -f server/logs/combined.log
```

---

**Happy Secure Coding! 🔐**
