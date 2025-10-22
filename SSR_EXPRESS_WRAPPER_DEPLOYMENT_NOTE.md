# Express Wrapper Deployment - Final Notes

## Status: ✅ READY TO DEPLOY

All issues have been resolved:
1. ✅ esbuild resolution fixed (--external:./entry.mjs)
2. ✅ Runtime dependencies available (copy node_modules from builder)
3. ✅ Port conflict resolved (use app.handler instead of handler)

## Final Changes

### File: `apps/website/src/server.ts`
- Imports `{ app: astroApp }` from entry.mjs
- Uses `astroApp.handler` as Express middleware
- Only Express server calls `listen()` - no port conflicts

### File: `apps/website/package.json`
- Added runtime deps: express@4.19.2, compression@1.7.4
- Added dev deps: @types/express@4.17.21, @types/compression@1.7.5, esbuild@0.23.0
- Added postbuild script with proper external flags

### File: `apps/website/Dockerfile`
- Runtime stage copies node_modules from builder
- Updated CMD to use server.mjs
- Updated HEALTHCHECK to use /_healthz endpoint

## Deployment Commands

```bash
# Commit changes
git add apps/website/
git commit -m "feat: Express wrapper for static assets - production ready"
git push

# The CI/CD will automatically rebuild and deploy
```

## Expected Behavior After Deployment

### Container Logs
```
SSR listening on :3000
```
No EADDRINUSE errors should appear.

### Health Check
```bash
curl -I https://dmitrybond.tech/_healthz
# HTTP/1.1 200 OK
# Content-Type: text/plain
```

### Static Assets
```bash
curl -I https://dmitrybond.tech/_astro/[hash].css
# HTTP/1.1 200 OK
# Content-Type: text/css
# Cache-Control: public, max-age=31536000, immutable
```

### Fonts
```bash
curl -I https://dmitrybond.tech/fonts/inter-roman.var.woff2
# HTTP/1.1 200 OK
# Content-Type: font/woff2
# Cache-Control: public, max-age=31536000, immutable
```

### HTML Pages
```bash
curl -I https://dmitrybond.tech/en/about
# HTTP/1.1 200 OK
# Content-Type: text/html
# Cache-Control: no-store, max-age=0, must-revalidate
```

### Browser DevTools
- Open https://dmitrybond.tech/en/about
- Check Network tab
- All `/_astro/*.css` and `/_astro/*.js` should return 200
- Styles should load correctly
- React islands should hydrate

## Monitoring

```bash
# Watch logs
docker logs website-prod -f

# Check container health
docker ps --filter name=website-prod

# Test endpoints
curl -I https://dmitrybond.tech/_healthz
curl -I https://dmitrybond.tech/en/about
```

## Rollback (if needed)

```bash
# SSH to VPS
ssh your-vps

# Rollback to previous commit
cd /opt/prod
git log --oneline -n 5  # Find previous commit
git checkout <previous-commit-hash>
docker compose -f compose.prod.yml up -d --build --force-recreate website-prod
```

---

**Ready to commit and push!** 🚀

