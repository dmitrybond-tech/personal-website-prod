# Setup Instructions - SSR Asset Delivery Testing

## Quick Start

### 1. Install Dependencies

```bash
cd apps/website
npm install
```

This will install Playwright (`@playwright/test`) added to `package.json`.

### 2. Install Playwright Browsers

```bash
npm run test:e2e:install
```

This downloads the Chromium browser for E2E testing (only needed once, ~100MB).

### 3. Build the Application

```bash
npm run build
```

Verify build output:
```bash
# Check that CSS files exist
ls -la dist/client/_astro/*.css

# Check that fonts exist
ls -la dist/client/fonts/
```

### 4. Start the Server

```bash
npm run start
```

The server should start on port 4321 (default) or `$PORT` if set.

### 5. Run Tests (in another terminal)

#### Smoke Tests (Fast)

```bash
npm run test:smoke
```

Expected output:
```
🧪 Smoke testing: http://localhost:4321

Test 1: HTML page cache headers
✓ HTML has no-store: Cache-Control: no-store, max-age=0, must-revalidate

Test 2: CSS asset discovery
✓ Found CSS: /_astro/about.abc123.css

Test 3: CSS asset headers
✓ CSS returns 200
✓ CSS has immutable cache: Cache-Control: public, max-age=31536000, immutable
✓ CSS has correct content-type: Content-Type: text/css; charset=utf-8
✓ CSS has single Cache-Control header

Test 4: Font asset headers
✓ Font returns 200
✓ Font has immutable cache: Cache-Control: public, max-age=31536000, immutable

Test 5: Server mode verification
✓ Server returns Date header (SSR confirmed)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ All tests passed!
```

#### E2E Tests (Browser-based)

```bash
npm run test:e2e
```

Expected output:
```
Running 5 tests using 1 worker

  ✓  [chromium] › styles.spec.ts:13:3 › should load and apply CSS styles (1.2s)
  ✓  [chromium] › styles.spec.ts:32:3 › should serve CSS with immutable cache (0.8s)
  ✓  [chromium] › styles.spec.ts:61:3 › should serve fonts with immutable cache (0.5s)
  ✓  [chromium] › styles.spec.ts:84:3 › should serve HTML with no-store cache (0.4s)
  ✓  [chromium] › styles.spec.ts:99:3 › should load page with applied Tailwind (1.1s)

  5 passed (4.0s)
```

## Platform-Specific Notes

### Windows

Smoke tests automatically use PowerShell:
```powershell
npm run test:smoke
```

Or run directly:
```powershell
pwsh -File scripts/smoke-test.ps1
```

### Linux/Mac

Smoke tests automatically use Bash:
```bash
npm run test:smoke
```

Or run directly:
```bash
bash scripts/smoke-test.sh
```

## Production Testing

After deploying to production, test the live site:

```bash
npm run test:smoke:prod
```

This runs smoke tests against `https://dmitrybond.tech`.

## Troubleshooting

### Smoke Tests Fail

**Check 1**: Server is running
```bash
curl -I http://localhost:4321/en/about
```

**Check 2**: Build output exists
```bash
ls -la dist/client/_astro/
```

**Check 3**: CSS files in HTML
```bash
curl -sS http://localhost:4321/en/about | grep "stylesheet"
```

### E2E Tests Fail

**Check 1**: Playwright browsers installed
```bash
npm run test:e2e:install
```

**Check 2**: Server is running
```bash
curl -I http://localhost:4321/
```

**Check 3**: Port is not blocked
```bash
# Windows
netstat -ano | findstr :4321

# Linux/Mac
lsof -i :4321
```

**Debug**: Run with UI
```bash
npm run test:e2e:ui
```

### Tests Pass Locally but Fail in Production

**Check 1**: Caddy configuration

Your `Caddyfile.app` should be:
```caddy
https://dmitrybond.tech {
    reverse_proxy 127.0.0.1:3000
}
```

**Check 2**: Server is actually running
```bash
ssh your-server 'systemctl status your-app.service'
```

**Check 3**: Server listening on correct port
```bash
ssh your-server 'netstat -tulpn | grep 3000'
```

**Check 4**: Firewall allows connections
```bash
ssh your-server 'ufw status | grep 3000'
```

## Next Steps

1. **If all tests pass** → Deploy to production
2. **If tests fail** → See troubleshooting above
3. **After deployment** → Run `npm run test:smoke:prod`

## Documentation

- **Quick Start**: [`SSR_ASSET_DELIVERY_QUICKSTART.md`](./SSR_ASSET_DELIVERY_QUICKSTART.md)
- **Production Guide**: [`docs/REVERSE_PROXY_SETUP.md`](./docs/REVERSE_PROXY_SETUP.md)
- **Technical Details**: [`SSR_ASSET_DELIVERY_FIX.md`](./SSR_ASSET_DELIVERY_FIX.md)

## Support

For issues:
1. Check browser DevTools Network tab
2. Check server logs
3. Check Caddy logs
4. Review documentation above

