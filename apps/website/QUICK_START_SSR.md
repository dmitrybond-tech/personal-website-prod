# SSR Stabilization - Quick Start

## Immediate Actions Required

### 1. Make Health Script Executable

```bash
chmod +x apps/website/scripts/health.sh
```

### 2. Test Locally

```bash
# Build
cd apps/website
pnpm build

# Start server
node ./dist/server/entry.mjs &
SERVER_PID=$!

# Wait for server to start
sleep 3

# Run health check
bash scripts/health.sh localhost:3000

# Kill server
kill $SERVER_PID
```

### 3. Deploy to Production

```bash
# Commit changes
git add .
git commit -m "feat(ssr): stabilize static asset delivery and cache policy"
git push origin main

# Deploy (adjust to your process)
# ... trigger your CI/CD or manual deploy ...

# Wait for deploy to complete
sleep 30

# Verify production
bash scripts/health.sh dmitrybond.tech
```

---

## What Was Changed

### Core Changes

1. **`src/middleware.ts`** - Enhanced with:
   - Static asset fast-path (bypasses SSR/i18n)
   - Cache policy logic (immutable for assets, no-cache for HTML)
   - MIME type enforcement

2. **Layouts** - Added font preload:
   - `src/layouts/BaseLayout.astro`
   - `src/app/layouts/AppShell.astro`

### New Files

3. **`scripts/health.sh`** - Health check automation
4. **`SSR_CACHE_POLICY.md`** - Technical docs
5. **`SSR_STABILIZATION_COMMITS.md`** - Git templates
6. **`SSR_IMPLEMENTATION_SUMMARY.md`** - Full report
7. **`QUICK_START_SSR.md`** - This file

---

## Expected Results

### Health Check Output

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏥 SSR Health Check
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📄 [1/5] HTML Cache Policy
✅ PASS: HTML is not cached

🎨 [2/5] CSS Asset Delivery
✅ PASS: CSS delivered correctly

🔤 [3/5] Font Asset Delivery
✅ PASS: Font delivered with immutable cache

🔍 [4/5] Duplicate Headers Check
✅ PASS: Single Cache-Control header

📁 [5/5] Uploads Directory Cache
✅ PASS: Upload cached for 1 day

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ All critical tests passed!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Browser DevTools

Open `https://dmitrybond.tech/en/about` and check:

- **Console:** No "Refused to apply style" errors
- **Network → CSS:** 
  - Status: `200`
  - Type: `text/css`
  - Cache: `immutable`
- **Network → Fonts:**
  - Status: `200`
  - Type: `font/woff2`
  - Cache: `immutable`

---

## Troubleshooting

### Problem: Health check fails

**Solution:**
1. Check if server is running: `curl localhost:3000`
2. Verify build completed: `ls dist/client/_astro/`
3. Check logs: `tail -f <docker-container-logs>`

### Problem: CSS still loads as HTML

**Solution:**
1. Clear browser cache (hard refresh: Cmd+Shift+R / Ctrl+Shift+F5)
2. Verify middleware deployed: check file timestamp
3. Check Caddy isn't overriding headers

### Problem: Fonts not loading

**Solution:**
1. Verify `/fonts/inter-roman.var.woff2` exists in `dist/client/`
2. Check CORS: `crossorigin` attribute present in `<link rel="preload">`
3. Check Content-Type: should be `font/woff2`

---

## Rollback (If Needed)

```bash
# Option 1: Revert last commit
git revert HEAD
git push origin main

# Option 2: Revert to specific commit
git revert <commit-hash>
git push origin main

# Option 3: Emergency bypass (temporary)
# Comment out fast-path in src/middleware.ts:
# if (STATIC_ASSET_PREFIXES.test(pathname)) {
#   return next(); // bypass cache logic
# }
```

---

## Next Steps

After successful deployment:

1. **Monitor:**
   - Check error rates (should decrease)
   - Check cache hit ratio (should increase to >95%)
   - Check TTFB metrics (should decrease)

2. **Optimize Further:**
   - Consider CDN for `/_astro/` (see `SSR_CACHE_POLICY.md`)
   - Add more preload hints for critical CSS
   - Implement Brotli compression

3. **Document:**
   - Update team about new health check
   - Add health check to CI/CD pipeline
   - Share performance improvements

---

## Files to Review

Priority order:

1. **`SSR_IMPLEMENTATION_SUMMARY.md`** - Full overview
2. **`src/middleware.ts`** - Implementation details
3. **`SSR_CACHE_POLICY.md`** - Technical deep-dive
4. **`scripts/health.sh`** - Verification tool

---

## Questions?

- **How it works:** See `SSR_CACHE_POLICY.md` → "Implementation" section
- **Git commits:** See `SSR_STABILIZATION_COMMITS.md`
- **Troubleshooting:** See `SSR_CACHE_POLICY.md` → "Troubleshooting" section
- **Performance:** See `SSR_IMPLEMENTATION_SUMMARY.md` → "Performance Impact"

---

**Status:** ✅ Ready for deployment  
**Testing:** ✅ Linter passed, build verified  
**Docs:** ✅ Complete  
**Health Check:** ⏳ Pending (run after deploy)

