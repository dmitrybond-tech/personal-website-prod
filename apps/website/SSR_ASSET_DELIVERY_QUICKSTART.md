# SSR Asset Delivery Fix - Quick Start

## Problem

CSS and static assets not loading in browser despite 200 responses from server.

## Root Cause

The existing middleware was already correct! The issue is likely one of:

1. **Caddy configuration** - Trying to serve static files directly instead of proxying
2. **Build output** - CSS files not generated or in wrong location
3. **Working directory** - Server starting from wrong directory
4. **Browser cache** - Old responses cached with incorrect headers

## Quick Fix Verification

### Step 1: Check Caddy Configuration

Your `Caddyfile.app` should look like this:

```caddy
https://dmitrybond.tech {
    reverse_proxy 127.0.0.1:3000
}
```

**Do NOT** try to serve static files with `file_server` or `root` directives. The SSR server handles everything.

### Step 2: Verify Build Output

```bash
cd apps/website
npm run build

# Check that CSS files exist
ls -la dist/client/_astro/*.css

# Check that fonts exist
ls -la dist/client/fonts/
```

Expected output:
- Several `.css` files with hashes in `dist/client/_astro/`
- Font files in `dist/client/fonts/`

### Step 3: Test Locally

```bash
# Start the server
npm run start

# In another terminal, run smoke test
npm run test:smoke
```

Expected: All tests should pass ✓

### Step 4: Test Production

```bash
npm run test:smoke:prod
```

Expected: All tests should pass ✓

If tests fail, continue to troubleshooting below.

## What Was Changed

### New Files Created

1. **`src/server/static-headers.ts`** - Centralized cache header configuration
2. **`scripts/smoke-test.sh`** - Automated curl-based verification (Linux/Mac)
3. **`scripts/smoke-test.ps1`** - Automated verification (Windows)
4. **`tests/e2e/styles.spec.ts`** - Playwright browser tests
5. **`playwright.config.ts`** - E2E test configuration
6. **`docs/REVERSE_PROXY_SETUP.md`** - Production deployment guide

### Modified Files

1. **`src/middleware.ts`** - Added documentation comments (no logic changes)
2. **`package.json`** - Added test scripts and Playwright dependency
3. **`README.md`** - Added reverse proxy section

### Important Note

**The middleware was already correct!** The changes add:
- Better documentation
- Verification tools
- E2E tests

If your site still doesn't load CSS, the issue is likely:
- Caddy configuration
- Build/deployment process
- Browser caching

## Troubleshooting Guide

### Issue: Styles Not Loading

**Step 1**: Clear browser cache (Ctrl+Shift+Delete or Cmd+Shift+Delete)

**Step 2**: Check HTML source

```bash
curl -sS https://dmitrybond.tech/en/about | grep "stylesheet"
```

Expected: Should see `<link rel="stylesheet" href="/_astro/...css">`

**Step 3**: Check CSS file directly

```bash
CSS_PATH=$(curl -sS https://dmitrybond.tech/en/about | grep -oP '/_astro/[^"]+\.css' | head -n1)
curl -I "https://dmitrybond.tech$CSS_PATH"
```

Expected:
```
HTTP/2 200
cache-control: public, max-age=31536000, immutable
content-type: text/css
```

**Step 4**: Check for duplicate headers

```bash
curl -sI "https://dmitrybond.tech$CSS_PATH" | grep -i "cache-control"
```

Expected: Should see only **ONE** `Cache-Control` header

If you see multiple headers, check for:
- Middleware conflicts
- Caddy header manipulation
- CDN adding headers

### Issue: CSS Returns 404

**Check 1**: Build output exists

```bash
ls -la apps/website/dist/client/_astro/
```

**Check 2**: Server working directory

When running `node ./dist/server/entry.mjs`, make sure you're in `apps/website/` directory:

```bash
cd apps/website
node ./dist/server/entry.mjs
```

**Check 3**: Container paths

If running in Docker, verify:
- `dist/` directory is copied to container
- Server starts from correct working directory
- No volume mounts overwriting `dist/`

### Issue: CSS Has Wrong Headers

**Symptom**: CSS has `no-store` instead of `immutable`

**Check**: Middleware is not being overridden

```bash
# Check middleware.ts
grep -A 5 "/_astro/" apps/website/src/middleware.ts
```

Should contain:
```typescript
if (pathname.startsWith('/_astro/') || pathname.startsWith('/fonts/')) {
  return 'public, max-age=31536000, immutable';
}
```

**Fix**: Rebuild and restart

```bash
npm run build
npm run start
```

### Issue: Fonts Return 404

**Check**: Font files exist in build

```bash
ls -la apps/website/dist/client/fonts/
```

If empty, check:
- Source fonts in `public/fonts/`
- Build process copies public assets

**Fix**: Ensure `public/fonts/` contains fonts before build

```bash
ls -la apps/website/public/fonts/
npm run build
```

## Installation Steps

### 1. Install Playwright

```bash
cd apps/website
npm install
npm run test:e2e:install
```

### 2. Run Tests Locally

```bash
# Build the app
npm run build

# Start server in one terminal
npm run start

# Run tests in another terminal
npm run test:smoke
npm run test:e2e
```

### 3. Deploy to Production

```bash
# Build
npm run build

# Deploy dist/ to server (via your CI/CD)

# After deployment, test
npm run test:smoke:prod
```

## E2E Testing

### Run Tests

```bash
# Headless mode
npm run test:e2e

# Interactive mode
npm run test:e2e:ui

# Specific test
npx playwright test tests/e2e/styles.spec.ts
```

### Debug Failed Tests

```bash
npx playwright test --debug
```

### View Test Report

```bash
npx playwright show-report
```

## Smoke Testing

### Local Server

```bash
npm run test:smoke
```

### Production Server

```bash
npm run test:smoke:prod
```

### Custom URL

```bash
# Linux/Mac
bash scripts/smoke-test.sh http://localhost:3000

# Windows
pwsh -File scripts/smoke-test.ps1 http://localhost:3000
```

## Manual Verification Checklist

Use browser DevTools:

1. **Network Tab**:
   - ✓ All CSS files load with 200 status
   - ✓ All font files load with 200 status
   - ✓ CSS has `Cache-Control: public, max-age=31536000, immutable`
   - ✓ Fonts have `Cache-Control: public, max-age=31536000, immutable`
   - ✓ HTML has `Cache-Control: no-store`

2. **Console Tab**:
   - ✓ No errors
   - ✓ No warnings about missing stylesheets

3. **Elements Tab**:
   - ✓ Styles applied to body (check Computed styles)
   - ✓ Font-family is not Times New Roman or serif

4. **Performance Tab**:
   - ✓ CSS and fonts loaded from cache on subsequent visits

## Success Criteria

All of these should be true:

- [ ] `npm run build` completes without errors
- [ ] `npm run start` starts server successfully
- [ ] `npm run test:smoke` passes all tests
- [ ] `npm run test:e2e` passes all tests
- [ ] Browser shows styled page (no Times New Roman)
- [ ] Browser DevTools shows 200 for all CSS/font requests
- [ ] CSS has immutable cache headers
- [ ] HTML has no-store cache headers
- [ ] Only ONE Cache-Control header per response
- [ ] No console errors

## Next Steps

1. **If all tests pass locally** → Deploy to production
2. **If tests fail locally** → Check build output and middleware
3. **If tests pass locally but fail in production** → Check Caddy config
4. **If styles still don't load** → Check browser cache and network tab

## Key Files Reference

- **Cache logic**: `src/middleware.ts` (lines 12-39)
- **Caddy config**: `Caddyfile.app`
- **SSR entry**: `dist/server/entry.mjs` (generated)
- **Static assets**: `dist/client/_astro/`, `dist/client/fonts/`
- **Test scripts**: `scripts/smoke-test.sh`, `scripts/smoke-test.ps1`
- **E2E tests**: `tests/e2e/styles.spec.ts`

## Getting Help

If issues persist:

1. Run diagnostics:
   ```bash
   npm run test:smoke -- http://localhost:3000 > diagnostics.txt 2>&1
   ```

2. Check logs:
   ```bash
   # Server logs
   npm run start 2>&1 | tee server.log
   
   # Caddy logs
   journalctl -u caddy -n 100
   ```

3. Capture network trace:
   - Open DevTools → Network tab
   - Refresh page
   - Right-click → Save all as HAR
   - Share the HAR file

---

**TL;DR**: 
1. Check Caddy config (should be simple reverse proxy)
2. Run `npm run test:smoke`
3. If it passes, deploy and run `npm run test:smoke:prod`
4. Clear browser cache if needed

