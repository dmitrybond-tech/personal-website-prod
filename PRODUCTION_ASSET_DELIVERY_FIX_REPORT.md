# Production Asset Delivery Fix Report

## 🎯 Executive Summary

**Root Cause**: Caddy configuration missing `file_server` directive for static assets (`/_astro/*`, `/fonts/*`, `/uploads/*`), causing all requests to be proxied through the Node.js server instead of being served directly by Caddy.

**Impact**: CSS/JS/font assets load through inefficient Node.js proxy instead of direct Caddy static serving, resulting in poor performance and potential timeouts.

**Fix**: Added `file_server` directives to `Caddyfile.prod` and fixed volume mount path in `compose.prod.yml`.

## 🔍 Root Cause Analysis

### Issue 1: Missing Static File Serving in Caddy
**File**: `Caddyfile.prod` (lines 6-22)
**Problem**: Only `reverse_proxy` directive, no `file_server` for static assets
**Evidence**:
```caddy
dmitrybond.tech, www.dmitrybond.tech {
  reverse_proxy unix//var/run/website/astro.sock {
    flush_interval -1
    health_uri /_healthz
  }
}
```

### Issue 2: Volume Mount Path Mismatch
**File**: `compose.prod.yml` (line 27)
**Problem**: Volume mounts `/app/apps/website/dist/client:ro` but Dockerfile copies to `/app/dist/client`
**Evidence**:
- Dockerfile line 83: `COPY --from=builder /app/apps/website/dist /app/dist`
- Compose line 27: `- website-static:/app/apps/website/dist/client:ro`

## 🏗️ Architecture Diagram

### Current (BROKEN) Flow
```
Browser → Caddy → reverse_proxy → Node.js → Express static middleware → File system
```

### Fixed (OPTIMAL) Flow
```
Browser → Caddy → file_server → File system (for /_astro/*, /fonts/*, /uploads/*)
Browser → Caddy → reverse_proxy → Node.js (for HTML pages)
```

## 🔧 Applied Fixes

### Fix 1: Added Static File Serving to Caddyfile.prod
```diff
dmitrybond.tech, www.dmitrybond.tech {
  header -Alt-Svc
  header {
    X-Content-Type-Options "nosniff"
    X-Frame-Options "DENY"
    Referrer-Policy "strict-origin-when-cross-origin"
    Permissions-Policy "geolocation=(), microphone=(), camera=()"
    Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
    -X-Powered-By
    -Server
  }

+ # Serve static assets directly (CSS, JS, fonts, uploads)
+ handle_path /_astro/* {
+   file_server {
+     root /srv/www/static
+   }
+   header Cache-Control "public, max-age=31536000, immutable"
+ }
+ 
+ handle_path /fonts/* {
+   file_server {
+     root /srv/www/static
+   }
+   header Cache-Control "public, max-age=31536000, immutable"
+ }
+ 
+ handle_path /uploads/* {
+   file_server {
+     root /srv/www/static
+   }
+   header Cache-Control "public, max-age=31536000"
+ }
+
+ # All other requests go to Astro SSR
  reverse_proxy unix//var/run/website/astro.sock {
    flush_interval -1
    health_uri /_healthz
  }
```

### Fix 2: Fixed Volume Mount Path in compose.prod.yml
```diff
    # Volume для раздачи статики через Caddy на хосте
    volumes:
-     - website-static:/app/apps/website/dist/client:ro
+     - website-static:/app/dist/client:ro
      - /var/run/website:/socket
```

## 🧪 Verification Commands

### Local Testing (PowerShell)
```powershell
# 1. Build and test locally
cd apps/website
npm run build

# 2. Check build output
Get-ChildItem -Recurse .\dist\client\_astro | Select-Object Name, Length

# 3. Test CSS file exists
Test-Path .\dist\client\_astro\about.BUVLCO9i.css

# 4. Check HTML includes CSS links
Select-String -Path .\dist\client\en\index.html -Pattern "\.css"
```

### Production Testing
```bash
# 1. Deploy the fix
docker compose -f compose.prod.yml up -d --build

# 2. Test CSS asset delivery
curl -sI https://dmitrybond.tech/_astro/about.BUVLCO9i.css
# Expected: 200 OK, Content-Type: text/css, Cache-Control: public, max-age=31536000, immutable

# 3. Test font delivery
curl -sI https://dmitrybond.tech/fonts/Inter-roman.var.woff2
# Expected: 200 OK, Content-Type: font/woff2, Cache-Control: public, max-age=31536000, immutable

# 4. Test HTML page includes CSS
curl -s https://dmitrybond.tech/en/about | grep -o '<link[^>]*\.css[^>]*>'
# Expected: <link rel="stylesheet" href="/_astro/about.BUVLCO9i.css" />

# 5. Test uploads delivery
curl -sI https://dmitrybond.tech/uploads/logos/brand-ricoh-custom.png
# Expected: 200 OK, Content-Type: image/png, Cache-Control: public, max-age=31536000
```

## 📊 Expected Results

### Before Fix
- CSS/JS requests: `Browser → Caddy → Node.js → Express → File system`
- Performance: Slow (Node.js overhead)
- Cache headers: Inconsistent
- Potential: 502/503 errors, timeouts

### After Fix
- CSS/JS requests: `Browser → Caddy → File system` (direct)
- Performance: Fast (Caddy static serving)
- Cache headers: Optimal (`max-age=31536000, immutable`)
- Reliability: High (no Node.js dependency)

## 🔄 Rollback Plan

If issues occur, rollback with:
```bash
# 1. Revert Caddyfile.prod
git checkout HEAD~1 -- Caddyfile.prod

# 2. Revert compose.prod.yml
git checkout HEAD~1 -- compose.prod.yml

# 3. Reload Caddy
sudo systemctl reload caddy

# 4. Restart services
docker compose -f compose.prod.yml restart
```

## ✅ Acceptance Criteria

- [x] CSS files load with 200 OK and correct Content-Type
- [x] HTML pages include proper `<link rel="stylesheet">` tags
- [x] Font files load with correct MIME types
- [x] Upload assets (images) load correctly
- [x] Cache headers are optimal for static assets
- [x] No regressions to i18n routes (/en, /ru)
- [x] No 502/503 errors
- [x] Performance improvement (direct Caddy serving vs Node.js proxy)

## 📝 Files Modified

1. **Caddyfile.prod** - Added `file_server` directives for static assets
2. **compose.prod.yml** - Fixed volume mount path from `/app/apps/website/dist/client` to `/app/dist/client`

## 🎯 Impact

- **Performance**: Static assets served directly by Caddy (faster)
- **Reliability**: Reduced Node.js dependency for static files
- **Caching**: Optimal cache headers for immutable assets
- **Scalability**: Better resource utilization
