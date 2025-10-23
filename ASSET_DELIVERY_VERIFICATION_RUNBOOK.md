# Asset Delivery Verification Runbook

## 🎯 Purpose
Verify that the production asset delivery fix is working correctly and CSS/JS/fonts are served directly by Caddy.

## 📋 Pre-Verification Checklist

- [ ] Fix has been deployed to production
- [ ] Caddy configuration reloaded
- [ ] Docker containers restarted
- [ ] No active maintenance mode

## 🧪 Verification Steps

### Step 1: Test CSS Asset Delivery
```bash
# Test CSS file exists and loads correctly
curl -sI https://dmitrybond.tech/_astro/about.BUVLCO9i.css

# Expected Results:
# HTTP/2 200
# Content-Type: text/css; charset=utf-8
# Cache-Control: public, max-age=31536000, immutable
# Content-Length: [positive number]
```

### Step 2: Test Font Asset Delivery
```bash
# Test font file loads correctly
curl -sI https://dmitrybond.tech/fonts/Inter-roman.var.woff2

# Expected Results:
# HTTP/2 200
# Content-Type: font/woff2
# Cache-Control: public, max-age=31536000, immutable
```

### Step 3: Test Upload Asset Delivery
```bash
# Test uploaded image loads correctly
curl -sI https://dmitrybond.tech/uploads/logos/brand-ricoh-custom.png

# Expected Results:
# HTTP/2 200
# Content-Type: image/png
# Cache-Control: public, max-age=31536000
```

### Step 4: Test HTML Page Includes CSS
```bash
# Check that HTML includes proper CSS links
curl -s https://dmitrybond.tech/en/about | grep -o '<link[^>]*\.css[^>]*>'

# Expected Results:
# <link rel="stylesheet" href="/_astro/about.BUVLCO9i.css" />
# <link rel="stylesheet" href="/_astro/client.B_PwMJWB.js" />
```

### Step 5: Test Page Rendering
```bash
# Test that the page loads with styles
curl -s https://dmitrybond.tech/en/about | grep -A5 -B5 "stylesheet"

# Expected Results:
# Should show <link rel="stylesheet"> tags in the HTML
```

### Step 6: Test Performance (Optional)
```bash
# Test response time for CSS (should be fast with direct Caddy serving)
time curl -s -o /dev/null https://dmitrybond.tech/_astro/about.BUVLCO9i.css

# Expected Results:
# real    0m0.0XXs (should be very fast, < 100ms)
```

## 🔍 Troubleshooting

### Issue: CSS returns 404
**Cause**: Volume mount path mismatch
**Solution**: 
```bash
# Check if volume is mounted correctly
docker exec website_website_1 ls -la /app/dist/client/_astro/

# If empty, restart with correct volume mount
docker compose -f compose.prod.yml down
docker compose -f compose.prod.yml up -d --build
```

### Issue: CSS returns 502/503
**Cause**: Caddy configuration not reloaded
**Solution**:
```bash
# Reload Caddy configuration
sudo systemctl reload caddy

# Check Caddy logs
sudo journalctl -u caddy -f
```

### Issue: HTML doesn't include CSS links
**Cause**: Astro build issue or server-side rendering problem
**Solution**:
```bash
# Check if CSS files exist in build output
docker exec website_website_1 ls -la /app/dist/client/_astro/

# Rebuild if necessary
docker compose -f compose.prod.yml build --no-cache
docker compose -f compose.prod.yml up -d
```

## 📊 Success Criteria

- [ ] All CSS files return 200 OK with correct Content-Type
- [ ] All font files return 200 OK with correct Content-Type  
- [ ] All upload assets return 200 OK with correct Content-Type
- [ ] HTML pages include proper `<link rel="stylesheet">` tags
- [ ] Cache headers are optimal (`max-age=31536000, immutable` for assets)
- [ ] No 502/503 errors
- [ ] Page renders with styles in browser
- [ ] Performance is improved (faster asset loading)

## 🚨 Rollback Commands

If verification fails:
```bash
# 1. Revert Caddyfile.prod
git checkout HEAD~1 -- Caddyfile.prod

# 2. Revert compose.prod.yml  
git checkout HEAD~1 -- compose.prod.yml

# 3. Reload Caddy
sudo systemctl reload caddy

# 4. Restart services
docker compose -f compose.prod.yml restart

# 5. Verify rollback
curl -sI https://dmitrybond.tech/_astro/about.BUVLCO9i.css
```

## 📝 Verification Log Template

```
Date: [DATE]
Tester: [NAME]
Environment: Production

CSS Asset Test:
- URL: https://dmitrybond.tech/_astro/about.BUVLCO9i.css
- Status: [200/404/502/503]
- Content-Type: [text/css/other]
- Cache-Control: [correct/incorrect]

Font Asset Test:
- URL: https://dmitrybond.tech/fonts/Inter-roman.var.woff2
- Status: [200/404/502/503]
- Content-Type: [font/woff2/other]

HTML Page Test:
- URL: https://dmitrybond.tech/en/about
- CSS Links Present: [Yes/No]
- Page Renders with Styles: [Yes/No]

Overall Result: [PASS/FAIL]
Notes: [Any issues or observations]
```
