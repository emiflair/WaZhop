# Testing Guide

Run tests before committing to ensure everything works:

## Backend Tests

```bash
cd server
npm test
```

## Test Coverage

```bash
npm test -- --coverage
```

## Run Specific Tests

```bash
# Auth tests only
npm test -- auth.test.js

# Security tests only
npm test -- security.test.js
```

## Watch Mode (Development)

```bash
npm run test:watch
```

## Pre-deployment Checklist

1. ✅ All tests passing
2. ✅ Linting clean: `npm run lint`
3. ✅ Security audit clean: `npm run security:audit`
4. ✅ Server starts without errors: `npm start`
5. ✅ Environment variables configured
6. ✅ Health check responds: `curl http://localhost:5000/api/health`

## Quick Test Command

Test everything at once:

```bash
cd server && npm run lint && npm run security:audit && npm test
```

If all pass, you're ready to push! 🚀
