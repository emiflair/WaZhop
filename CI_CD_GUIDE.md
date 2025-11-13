# CI/CD Pipeline Documentation

This document explains the Continuous Integration and Continuous Deployment (CI/CD) pipeline for WaZhop.

## Table of Contents
- [Overview](#overview)
- [Pipeline Workflow](#pipeline-workflow)
- [Branch Strategy](#branch-strategy)
- [GitHub Actions](#github-actions)
- [Pre-commit Hooks](#pre-commit-hooks)
- [Testing](#testing)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

---

## Overview

WaZhop uses GitHub Actions for automated CI/CD with the following goals:
- **Prevent broken code** from reaching production
- **Automated testing** on every push and pull request
- **Security scanning** for vulnerabilities and secrets
- **Automated deployment** to staging and production
- **Quality enforcement** through linting and pre-commit hooks

### Pipeline Stages

```
┌─────────────┐
│   Commit    │ ──> Pre-commit hooks (lint-staged + Husky)
└─────────────┘
       │
       ▼
┌─────────────┐
│     Push    │ ──> Triggers GitHub Actions
└─────────────┘
       │
       ▼
┌─────────────┐
│    Lint     │ ──> ESLint on client + server
└─────────────┘
       │
       ▼
┌─────────────┐
│  Security   │ ──> npm audit + TruffleHog
└─────────────┘
       │
       ▼
┌─────────────┐
│    Tests    │ ──> Jest tests with coverage
└─────────────┘
       │
       ▼
┌─────────────┐
│    Build    │ ──> Verify builds succeed
└─────────────┘
       │
       ▼
┌─────────────┐
│   Deploy    │ ──> Staging or Production
└─────────────┘
       │
       ▼
┌─────────────┐
│ Health Check│ ──> Smoke tests
└─────────────┘
```

---

## Pipeline Workflow

### 1. **Lint Stage**
Runs on every push and PR.

```yaml
- ESLint on server code (Airbnb style guide)
- ESLint on client code
- Fails if any linting errors found
- Warnings don't block pipeline
```

**Manual run:**
```bash
cd server && npm run lint
cd client && npm run lint
```

### 2. **Security Stage**
Checks for vulnerabilities and exposed secrets.

```yaml
- npm audit (checks for known CVEs)
- TruffleHog (scans for leaked secrets)
- Fails on high/critical vulnerabilities
- Warns on moderate vulnerabilities
```

**Manual run:**
```bash
cd server && npm run security:audit
```

### 3. **Backend Tests**
Runs Jest tests with MongoDB service.

```yaml
- MongoDB 6.0 container for testing
- Jest with coverage reporting
- Minimum 70% coverage required
- Tests: auth, security, validation
```

**Manual run:**
```bash
cd server && npm test
```

### 4. **Frontend Tests**
Runs client-side tests.

```yaml
- Jest + React Testing Library
- Component tests
- Integration tests
```

**Manual run:**
```bash
cd client && npm test
```

### 5. **Build Stage**
Verifies code compiles successfully.

**Backend:**
```yaml
- Installs dependencies
- Attempts to start server
- Verifies no startup errors
```

**Frontend:**
```yaml
- Vite build
- Uploads artifacts
- Checks bundle size
```

**Manual run:**
```bash
cd server && npm start
cd client && npm run build
```

### 6. **Deploy Stage**
Deploys to staging or production.

```yaml
Staging (develop branch):
  - Auto-deploys to Railway + Vercel
  - No approval required
  - Health check after deployment

Production (main branch):
  - Requires manual approval
  - Deploys to Railway + Vercel
  - Comprehensive smoke tests
  - Rollback on failure
```

---

## Branch Strategy

### Branch Naming

| Branch | Purpose | Deploy Target | Auto-Deploy |
|--------|---------|---------------|-------------|
| `main` | Production-ready code | Production | Yes (with approval) |
| `develop` | Integration branch | Staging | Yes |
| `staging` | Pre-production testing | Staging | Yes |
| `feature/*` | New features | None | No |
| `bugfix/*` | Bug fixes | None | No |
| `hotfix/*` | Urgent production fixes | Production | No |

### Workflow

```
feature/new-feature ──┐
                      ├─> develop ──> staging ──> main
bugfix/fix-issue ────┘
```

**Step-by-step:**

1. **Create feature branch:**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/add-payment-gateway
   ```

2. **Make changes and commit:**
   ```bash
   git add .
   git commit -m "feat: add Flutterwave payment gateway"
   # Pre-commit hooks run automatically
   ```

3. **Push and create PR:**
   ```bash
   git push origin feature/add-payment-gateway
   # Create PR on GitHub: feature/add-payment-gateway -> develop
   ```

4. **CI runs automatically:**
   - Lint, security, tests, build all run
   - PR can't be merged if checks fail

5. **Merge to develop:**
   ```bash
   # After PR approval
   git checkout develop
   git pull origin develop
   # Auto-deploys to staging
   ```

6. **Test on staging:**
   ```
   https://staging-api.wazhop.ng
   https://staging.wazhop.ng
   ```

7. **Promote to production:**
   ```bash
   git checkout main
   git merge develop
   git push origin main
   # Requires approval, then auto-deploys
   ```

---

## GitHub Actions

### Configuration File
`.github/workflows/ci-cd.yml`

### Triggers

```yaml
on:
  push:
    branches: [main, develop, staging]
  pull_request:
    branches: [main, develop]
```

### Jobs

#### 1. Lint Job
```yaml
runs-on: ubuntu-latest
- Checkout code
- Setup Node 18
- Install dependencies
- Run ESLint on server
- Run ESLint on client
```

#### 2. Security Job
```yaml
runs-on: ubuntu-latest
- Checkout code (full history for TruffleHog)
- npm audit on server
- npm audit on client
- TruffleHog secret scan
```

#### 3. Backend Tests Job
```yaml
runs-on: ubuntu-latest
services:
  mongodb: MongoDB 6.0 container
- Checkout code
- Setup Node 18
- Install dependencies
- Run Jest tests
- Upload coverage report
```

#### 4. Frontend Tests Job
```yaml
runs-on: ubuntu-latest
- Checkout code
- Setup Node 18
- Install dependencies
- Run client tests
```

#### 5. Build Backend Job
```yaml
runs-on: ubuntu-latest
needs: [lint, security, backend-tests]
- Checkout code
- Setup Node 18
- Install dependencies
- Start server
- Verify no errors
```

#### 6. Build Frontend Job
```yaml
runs-on: ubuntu-latest
needs: [lint, security, frontend-tests]
- Checkout code
- Setup Node 18
- Install dependencies
- Vite build
- Upload build artifacts
```

#### 7. Deploy Staging Job
```yaml
runs-on: ubuntu-latest
environment: staging
if: github.ref == 'refs/heads/develop'
needs: [build-backend, build-frontend]
- Deploy to Railway staging
- Deploy to Vercel staging
- Health check
- Notify on Slack/Discord
```

#### 8. Deploy Production Job
```yaml
runs-on: ubuntu-latest
environment: production
if: github.ref == 'refs/heads/main'
needs: [build-backend, build-frontend]
- Wait for manual approval
- Deploy to Railway production
- Deploy to Vercel production
- Comprehensive smoke tests
- Rollback on failure
- Notify on Slack/Discord
```

### Environment Secrets

Set these in GitHub: **Settings → Secrets and variables → Actions**

```
RAILWAY_TOKEN             # Railway API token
VERCEL_TOKEN              # Vercel token
VERCEL_ORG_ID             # Vercel organization ID
VERCEL_PROJECT_ID         # Vercel project ID
SLACK_WEBHOOK_URL         # (Optional) Slack notifications
DISCORD_WEBHOOK_URL       # (Optional) Discord notifications
```

### Manual Workflow Trigger

```bash
# Trigger workflow manually from GitHub UI
# Or via GitHub CLI:
gh workflow run ci-cd.yml --ref develop
```

---

## Pre-commit Hooks

### Husky Configuration
Pre-commit hooks run locally before each commit.

**Location:** `.husky/pre-commit`

**What it does:**
1. Runs lint-staged on changed files
2. Warns about console.log statements
3. Notes TODO/FIXME comments

### Lint-staged Configuration
**Location:** `package.json`

```json
{
  "lint-staged": {
    "server/**/*.js": [
      "eslint --fix",
      "npm --prefix server test --bail --findRelatedTests"
    ],
    "client/**/*.{js,jsx}": [
      "eslint --fix"
    ]
  }
}
```

**What it does:**
- Auto-fixes linting issues
- Runs tests for changed backend files
- Prevents committing broken code

### Bypass Pre-commit (Emergency Only)
```bash
# ⚠️ Only for emergencies!
git commit --no-verify -m "hotfix: critical production issue"
```

---

## Testing

### Backend Tests
**Location:** `server/tests/`

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm test -- --coverage

# Run specific test file
npm test -- auth.test.js

# Run specific test
npm test -- -t "should register a new user"
```

### Test Structure
```
server/tests/
├── setup.js           # Global test configuration
├── auth.test.js       # Authentication tests
├── security.test.js   # Security utility tests
├── shop.test.js       # Shop CRUD tests
├── product.test.js    # Product tests
├── order.test.js      # Order tests
└── integration/       # Full workflow tests
    └── checkout.test.js
```

### Writing Tests

**Example test:**
```javascript
describe('POST /api/auth/register', () => {
  it('should register a new user with valid data', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'StrongPass123!',
        phoneNumber: '08012345678'
      });
    
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.token).toBeDefined();
  });
});
```

### Coverage Requirements
```yaml
Minimum Coverage: 70%
Branches: 60%
Functions: 70%
Lines: 70%
Statements: 70%
```

---

## Deployment

### Railway (Backend)

**Manual deployment:**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link project
railway link

# Deploy
railway up
```

**Environment variables:**
Set in Railway dashboard or CLI:
```bash
railway variables set MONGODB_URI="mongodb+srv://..."
railway variables set JWT_SECRET="your-secret"
```

**View logs:**
```bash
railway logs
```

### Vercel (Frontend)

**Manual deployment:**
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

**Environment variables:**
Set in Vercel dashboard: **Settings → Environment Variables**

```
VITE_API_URL=https://api.wazhop.ng
```

### Deployment Checklist

Before deploying to production:

- [ ] All tests passing locally
- [ ] Linting passes
- [ ] Security audit clean
- [ ] Environment variables set in Railway/Vercel
- [ ] Database migrations run
- [ ] Staging tested thoroughly
- [ ] Rollback plan ready
- [ ] Team notified
- [ ] Monitoring alerts configured

### Rollback Procedure

**If deployment fails:**

1. **Automatic rollback** (if smoke tests fail)
2. **Manual rollback via Railway:**
   ```bash
   railway rollback
   ```
3. **Manual rollback via Vercel:**
   - Go to Vercel dashboard
   - Select previous deployment
   - Click "Promote to Production"

4. **Database rollback (if needed):**
   ```bash
   cd server
   node migrations/rollback.js
   ```

---

## Troubleshooting

### Pipeline Failing on Lint

**Problem:** ESLint errors blocking pipeline

**Solution:**
```bash
# Fix locally first
cd server && npm run lint:fix
cd client && npm run lint:fix

# Commit fixes
git add .
git commit -m "fix: resolve linting issues"
git push
```

### Tests Failing in CI but Pass Locally

**Problem:** Tests pass locally but fail in GitHub Actions

**Possible causes:**
1. Missing environment variables in CI
2. Database connection issues
3. Race conditions in tests
4. Different Node versions

**Solutions:**
```yaml
# 1. Add secrets to GitHub Actions
# Settings → Secrets → Add MONGODB_URI_TEST

# 2. Use MongoDB service in workflow
services:
  mongodb:
    image: mongo:6.0

# 3. Fix race conditions
test('async operation', async () => {
  await someAsyncFunction();
  expect(result).toBe(expected);
});

# 4. Lock Node version
node-version: '18.x'
```

### Security Audit Blocking Deployment

**Problem:** `npm audit` finds vulnerabilities

**Solutions:**
```bash
# Review vulnerabilities
npm audit

# Auto-fix if possible
npm audit fix

# Force update (careful!)
npm audit fix --force

# Update specific package
npm update package-name

# If no fix available, add exception
# (Only for non-critical issues in dev dependencies)
```

### Deployment to Railway Fails

**Problem:** Railway deployment error

**Solutions:**
1. Check Railway logs:
   ```bash
   railway logs
   ```

2. Verify environment variables:
   ```bash
   railway variables
   ```

3. Check build logs for errors

4. Verify `railway.json` configuration

### Deployment to Vercel Fails

**Problem:** Vercel build fails

**Solutions:**
1. Check build logs in Vercel dashboard

2. Verify environment variables:
   - `VITE_API_URL` is set
   - No missing dependencies

3. Test build locally:
   ```bash
   cd client
   npm run build
   ```

4. Check `vercel.json` configuration

### Health Check Failing

**Problem:** Post-deployment health check returns 503

**Solutions:**
1. Verify server started:
   ```bash
   railway logs
   ```

2. Check MongoDB connection:
   ```bash
   # Test connection string
   mongosh "mongodb+srv://..."
   ```

3. Test health endpoint manually:
   ```bash
   curl https://api.wazhop.ng/api/health/detailed
   ```

4. Check environment variables are set

---

## Monitoring and Alerts

### GitHub Actions Notifications

**Email notifications:**
- Enabled by default for failed builds
- Configure: GitHub Settings → Notifications → Actions

**Slack integration:**
Add to `.github/workflows/ci-cd.yml`:
```yaml
- name: Notify Slack
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### Health Check Monitoring

**Set up uptime monitoring:**
- [UptimeRobot](https://uptimerobot.com/)
- [Better Uptime](https://betteruptime.com/)
- [Pingdom](https://www.pingdom.com/)

**Monitor these endpoints:**
```
https://api.wazhop.ng/api/health
https://api.wazhop.ng/api/health/ready
https://wazhop.ng
```

---

## Best Practices

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
feat: add Flutterwave payment integration
fix: resolve 2FA QR code generation issue
docs: update deployment guide
refactor: simplify rate limiting logic
test: add order creation tests
chore: update dependencies
```

### Pull Request Guidelines

1. **Clear title and description**
2. **Link related issues:** "Fixes #123"
3. **Small, focused changes**
4. **All checks passing**
5. **At least one approval**
6. **Up-to-date with base branch**

### Code Review Checklist

- [ ] Code follows style guide
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No console.logs in production code
- [ ] Error handling proper
- [ ] Security considerations addressed
- [ ] Performance impact considered

---

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Railway Documentation](https://docs.railway.app/)
- [Vercel Documentation](https://vercel.com/docs)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [ESLint Rules](https://eslint.org/docs/rules/)
- [Husky Documentation](https://typicode.github.io/husky/)
