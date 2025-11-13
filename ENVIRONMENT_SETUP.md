# Environment Configuration Guide

This guide explains how to set up environment variables for different deployment environments.

## Table of Contents
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Environment-Specific Setup](#environment-specific-setup)
- [Security Best Practices](#security-best-practices)
- [Troubleshooting](#troubleshooting)

---

## Quick Start

### 1. Copy the Example File
```bash
cp .env.example .env
```

### 2. Generate Secure Keys
```bash
# JWT Secret (64 bytes)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Encryption Key (32 bytes)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Session Secret (32 bytes)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# CSRF Secret (32 bytes)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Fill in Your Values
Edit `.env` and replace all placeholder values with your actual credentials.

### 4. Verify Configuration
```bash
cd server
npm run dev
```

---

## Environment Variables

### Required Variables

| Variable | Description | Example | How to Get |
|----------|-------------|---------|------------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/wazhop` | [MongoDB Atlas](https://cloud.mongodb.com) |
| `JWT_SECRET` | Secret for JWT tokens | Generated 64-byte hex | Generate with crypto |
| `ENCRYPTION_KEY` | Key for encrypting sensitive data | Generated 32-byte hex | Generate with crypto |
| `APP_BASE_URL` | Frontend URL for CORS | `http://localhost:5173` | Your frontend URL |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | `your-cloud-name` | [Cloudinary Dashboard](https://cloudinary.com/console) |
| `CLOUDINARY_API_KEY` | Cloudinary API key | `123456789012345` | [Cloudinary Dashboard](https://cloudinary.com/console) |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | `abcdefghijklmnopqrst` | [Cloudinary Dashboard](https://cloudinary.com/console) |

### Email Configuration (Brevo)

| Variable | Description | How to Get |
|----------|-------------|------------|
| `EMAIL_PROVIDER` | Email service provider | Set to `brevo` |
| `BREVO_API_KEY` | Brevo API key | [Brevo Dashboard](https://app.brevo.com) → API Keys |
| `BREVO_SENDER_EMAIL` | Verified sender email | Add in Brevo → Senders |
| `BREVO_SENDER_NAME` | Sender name | Your app name |

### SMS Configuration (Optional)

#### Option 1: Brevo SMS
```env
SMS_PROVIDER=brevo
BREVO_SMS_SENDER=WaZhop
```

#### Option 2: AfricasTalking
```env
SMS_PROVIDER=africastalking
AFRICASTALKING_USERNAME=your-username
AFRICASTALKING_API_KEY=your-api-key
AFRICASTALKING_SENDER_ID=WaZhop
```

Get credentials from [AfricasTalking Dashboard](https://account.africastalking.com)

### Payment Gateways (Optional)

#### Flutterwave
```env
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK-xxxxx
FLUTTERWAVE_SECRET_KEY=FLWSECK-xxxxx
```
Get from [Flutterwave Dashboard](https://dashboard.flutterwave.com) → Settings → API

#### Paystack
```env
PAYSTACK_PUBLIC_KEY=pk_test_xxxxx
PAYSTACK_SECRET_KEY=sk_test_xxxxx
```
Get from [Paystack Dashboard](https://dashboard.paystack.com) → Settings → API Keys & Webhooks

### Admin Credentials

```env
ADMIN_EMAIL=admin@wazhop.com
ADMIN_PASSWORD=ChangeThisStrongPassword123!
```

**Important:** Change the default admin password immediately after first login!

---

## Environment-Specific Setup

### Development Environment

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/wazhop-dev
APP_BASE_URL=http://localhost:5173
DEBUG=true
LOG_LEVEL=debug

# Optional: Disable notifications in development
DISABLE_EMAILS=true
DISABLE_SMS=true
```

**Run with:**
```bash
cd server
npm run dev
```

### Staging Environment

```env
NODE_ENV=staging
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/wazhop-staging
APP_BASE_URL=https://staging.wazhop.com
DEBUG=false
LOG_LEVEL=info
RATE_LIMIT_MAX=200
```

**Deploy to Staging:**
```bash
git push origin develop
# GitHub Actions will automatically deploy to staging
```

### Production Environment

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/wazhop
APP_BASE_URL=https://wazhop.com
DEBUG=false
LOG_LEVEL=warn
RATE_LIMIT_MAX=100

# Enable all notifications
DISABLE_EMAILS=false
DISABLE_SMS=false

# Optional: Redis for rate limiting
REDIS_URL=redis://redis.railway.internal:6379

# Optional: Error tracking
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

**Deploy to Production:**
```bash
git push origin main
# GitHub Actions will run tests, then deploy to production
```

---

## Security Best Practices

### 1. Never Commit Secrets
- Add `.env` to `.gitignore` (already done)
- Never commit `.env` files to version control
- Use `.env.example` as a template only

### 2. Use Strong Secrets
```bash
# Generate cryptographically secure random strings
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Rotate Secrets Regularly
- JWT secrets: Every 90 days
- API keys: When compromised or annually
- Admin passwords: Every 90 days

### 4. Use Environment-Specific Secrets
- Different secrets for development, staging, production
- Never use production credentials in development

### 5. Principle of Least Privilege
- Only give API keys necessary permissions
- Use test/sandbox keys in development
- Restrict API key access by IP when possible

### 6. Secure Storage

#### Railway (Backend)
```bash
# Set environment variables in Railway dashboard
railway variables set JWT_SECRET="your-secret-here"
```

#### Vercel (Frontend)
```bash
# Set in Vercel dashboard: Settings → Environment Variables
# Or via CLI:
vercel env add VITE_API_URL production
```

#### Local Development
```bash
# Use direnv for automatic environment loading
echo "dotenv" > .envrc
direnv allow
```

---

## Troubleshooting

### Database Connection Issues

**Problem:** `MongoServerError: Authentication failed`

**Solution:**
1. Check username/password in `MONGODB_URI`
2. Ensure IP address is whitelisted in MongoDB Atlas
3. Verify database user has correct permissions

```env
# Correct format
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# Common mistakes
# ❌ Missing protocol: username:password@cluster.mongodb.net/database
# ❌ Wrong password encoding: Special characters not URL-encoded
# ❌ Missing database name: mongodb+srv://user:pass@cluster.mongodb.net/
```

### JWT Issues

**Problem:** `JsonWebTokenError: invalid token`

**Solution:**
1. Ensure `JWT_SECRET` is set and matches across deployments
2. Check token hasn't expired (`JWT_EXPIRE` setting)
3. Verify no extra spaces in JWT_SECRET

```bash
# Test JWT generation
node -e "const jwt=require('jsonwebtoken'); console.log(jwt.sign({test:1}, process.env.JWT_SECRET))"
```

### CORS Issues

**Problem:** `Access-Control-Allow-Origin error`

**Solution:**
1. Set correct `APP_BASE_URL` to match your frontend URL
2. Ensure no trailing slash in URL
3. Check Railway/Vercel deployment URLs match

```env
# Development
APP_BASE_URL=http://localhost:5173

# Production
APP_BASE_URL=https://wazhop.com

# ❌ Wrong: https://wazhop.com/
```

### Cloudinary Upload Fails

**Problem:** `Invalid API key`

**Solution:**
1. Verify all three Cloudinary variables are set:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
2. Check for typos or extra spaces
3. Ensure API key is active in Cloudinary dashboard

```bash
# Test Cloudinary connection
node -e "const cloudinary=require('cloudinary').v2; cloudinary.config({cloud_name:process.env.CLOUDINARY_CLOUD_NAME,api_key:process.env.CLOUDINARY_API_KEY,api_secret:process.env.CLOUDINARY_API_SECRET}); cloudinary.api.ping().then(console.log)"
```

### Email Not Sending

**Problem:** Emails not arriving

**Solution:**
1. Verify Brevo API key is active
2. Check sender email is verified in Brevo
3. Look for errors in server logs: `npm run logs:errors`
4. Check spam folder

```bash
# Test email configuration
cd server/scripts
node test-email.js
```

### Rate Limiting Too Strict

**Problem:** Getting 429 errors during testing

**Solution:**
1. Increase `RATE_LIMIT_MAX` in development
2. Use different IPs/users for testing
3. Clear rate limit cache (if using Redis)

```env
# Development: More relaxed
RATE_LIMIT_MAX=1000

# Production: Stricter
RATE_LIMIT_MAX=100
```

### 2FA Issues

**Problem:** 2FA QR code not working

**Solution:**
1. Ensure `ENCRYPTION_KEY` is set (required for storing 2FA secrets)
2. Check device time is synchronized
3. Try backup codes if available
4. Contact admin to disable 2FA if locked out

---

## Verification Checklist

Before deploying to production, verify:

- [ ] All required environment variables are set
- [ ] JWT_SECRET is cryptographically secure (64+ bytes)
- [ ] ENCRYPTION_KEY is set (32+ bytes)
- [ ] MongoDB connection works
- [ ] Cloudinary uploads work
- [ ] Email sending works
- [ ] SMS sending works (if configured)
- [ ] CORS allows your frontend domain
- [ ] Admin password is changed from default
- [ ] Debug mode is disabled (`DEBUG=false`)
- [ ] Rate limits are appropriate for production
- [ ] All secrets are different from staging/development
- [ ] Error tracking is configured (Sentry)
- [ ] Logs are being written properly

---

## Getting Help

If you're still having issues:

1. Check server logs:
   ```bash
   cd server
   npm run logs:view
   npm run logs:errors
   ```

2. Run security audit:
   ```bash
   npm run security:audit
   ```

3. Test individual components:
   ```bash
   cd server/scripts
   node test-email.js
   node test-sms.js
   ```

4. Enable debug logging:
   ```env
   DEBUG=true
   LOG_LEVEL=debug
   ```

---

## Additional Resources

- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Railway Documentation](https://docs.railway.app/)
- [Vercel Documentation](https://vercel.com/docs)
- [Brevo API Documentation](https://developers.brevo.com/)
- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [WaZhop Security Guide](./SECURITY.md)
- [WaZhop Deployment Guide](./DEPLOYMENT_GUIDE.md)
