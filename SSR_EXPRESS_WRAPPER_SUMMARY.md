# SSR Express Wrapper - Implementation Summary

## Problem Statement
Static assets (`/_astro/*.css`, `/_astro/*.js`, `/fonts/*`, `/uploads/*`) were returning 404 errors because Astro's Node adapter alone doesn't automatically serve the `dist/client/` directory contents in production.

## Solution
Implemented an Express wrapper (`src/server.ts`) that sits in front of Astro's SSR handler to serve static assets from within the Node container with correct MIME types and long-term caching headers.

## Architecture

```
Request Flow:
─────────────
Caddy (reverse proxy :443 → :3000)
  ↓
Express Server (:3000)
  ├─ /_astro/*   → express.static(dist/client/_astro)   [1y cache, immutable]
  ├─ /fonts/*    → express.static(dist/client/fonts)    [1y cache, immutable]
  ├─ /uploads/*  → express.static(dist/client/uploads)  [1y cache]
  ├─ /_healthz   → 200 text/plain "ok"
  └─ /* (all else) → Astro SSR handler (entry.mjs)     [no-cache for HTML]
```

## Key Features

### ✅ Static Asset Serving
- **`/_astro/*`**: Hashed CSS/JS files with immutable 1-year cache
- **`/fonts/*`**: Web fonts with immutable 1-year cache
- **`/uploads/*`**: User-uploaded content with 1-year cache (mutable)

### ✅ Performance Optimizations
- Gzip/deflate compression via `compression` middleware
- Long-term browser caching for immutable assets (reduces bandwidth)
- No-cache headers for HTML (prevents stale content)

### ✅ Production-Ready
- Health check endpoint (`/_healthz`) for Docker HEALTHCHECK and monitoring
- Removes `X-Powered-By` header for security
- ESM-based, targets Node 20+
- Bundled with esbuild for single-file deployment

### ✅ Zero Routing Changes
- No changes to Astro's `base`, `assets`, or `assetPrefix` config
- No CDN rewrites or path transformations
- Caddy remains a pure reverse proxy (no static serving moved to Caddy)

## Files Modified

| File | Change Type | Description |
|------|-------------|-------------|
| `apps/website/src/server.ts` | **NEW** | Express wrapper with static middleware |
| `apps/website/package.json` | Modified | Added runtime deps (express, compression), esbuild devDep, postbuild script |
| `apps/website/Dockerfile` | Modified | Install runtime deps, update CMD/HEALTHCHECK |

## Build Pipeline

```
1. npm run build
   ├─ prebuild: assert-decap-asset, build-iconify-bundle
   ├─ astro build → dist/server/entry.mjs, dist/client/*
   └─ postbuild: esbuild src/server.ts → dist/server/server.mjs (bundled)

2. Docker Build
   ├─ Builder stage: npm ci, npm run build (triggers postbuild)
   └─ Runtime stage: npm ci --omit=dev (installs express, compression)

3. Container Start
   └─ CMD ["node", "./dist/server/server.mjs"]
```

## Dependencies Added

### Runtime (production)
- `express@4.19.2` - Web framework for static serving + SSR delegation
- `compression@1.7.4` - Gzip/deflate middleware

### Build (devDependencies)
- `@types/express@4.17.21` - TypeScript type definitions for Express
- `@types/compression@1.7.5` - TypeScript type definitions for compression
- `esbuild@0.23.0` - Bundles src/server.ts into single ESM file

## Testing Checklist

### Local Development
```bash
npm run build && npm run start
curl -sI http://127.0.0.1:3000/_healthz  # → 200 OK
curl -sI http://127.0.0.1:3000/_astro/about.CYKiepS_.css  # → 200, immutable cache
curl -sI http://127.0.0.1:3000/en/about  # → 200, no-cache
```

### Docker/Production
```bash
docker compose --env-file .env.prod -f compose.prod.yml build website-prod
docker compose --env-file .env.prod -f compose.prod.yml up -d --force-recreate website-prod

# Smoke tests
curl -sI https://dmitrybond.tech/_healthz
curl -sI https://dmitrybond.tech/_astro/about.CYKiepS_.css
curl -sI https://dmitrybond.tech/fonts/inter-roman.var.woff2
curl -sI https://dmitrybond.tech/uploads/photo-linkedin-cropped.png
```

### Browser DevTools
- Load `https://dmitrybond.tech/en/about`
- Check Network tab: no 404s on `/_astro/*`
- Verify CSS/JS files load with correct Content-Type
- Check Cache-Control headers match expectations

## Cache Headers Reference

| Path Pattern | Cache-Control | Content-Type | Immutable |
|--------------|---------------|--------------|-----------|
| `/_astro/*.css` | `public, max-age=31536000, immutable` | `text/css` | ✅ |
| `/_astro/*.js` | `public, max-age=31536000, immutable` | `application/javascript` | ✅ |
| `/fonts/*.woff2` | `public, max-age=31536000, immutable` | `font/woff2` | ✅ |
| `/uploads/*.png` | `public, max-age=31536000` | `image/png` | ❌ |
| `/en/about` | `no-store, max-age=0, must-revalidate` | `text/html` | ❌ |

## Constraints Satisfied

✅ **Runtime deps pinned**: express@4.19.2, compression@1.7.4  
✅ **Target Node 20+**: esbuild --target=node20  
✅ **No base/assets changes**: Zero Astro config modifications  
✅ **No CDN/rewrites**: All serving done in-container  
✅ **CSP from app**: Caddy not modified (no CSP conflicts)  
✅ **Windows-friendly**: PowerShell commands in runbook  
✅ **Minimal changes**: 1 new file, 2 modified files  

## Deliverables

1. ✅ **Unified diff**: `SSR_EXPRESS_WRAPPER_IMPLEMENTATION.diff`
2. ✅ **Numbered changelog**: `SSR_EXPRESS_WRAPPER_CHANGELOG.md`
3. ✅ **Deployment runbook**: `SSR_EXPRESS_WRAPPER_RUNBOOK.md`
4. ✅ **Summary**: This document

## Next Steps

1. **Install dependencies**:
   ```bash
   npm install  # from monorepo root
   ```

2. **Test locally**:
   ```bash
   cd apps/website
   npm run build
   npm run start
   # Verify http://127.0.0.1:3000/_healthz
   ```

3. **Build Docker image**:
   ```bash
   docker compose --env-file .env.prod -f compose.prod.yml build website-prod
   ```

4. **Deploy**:
   ```bash
   docker compose --env-file .env.prod -f compose.prod.yml up -d --force-recreate website-prod
   ```

5. **Smoke test production**:
   ```bash
   curl -sI https://dmitrybond.tech/_healthz
   curl -sI https://dmitrybond.tech/_astro/about.CYKiepS_.css
   ```

## Support

- **Logs**: `docker compose -f compose.prod.yml logs -f website-prod`
- **Healthcheck**: `docker exec website-prod wget --spider http://127.0.0.1:3000/_healthz`
- **File structure**: `docker exec website-prod ls -la /app/dist/client/`

---

**Status**: ✅ Implementation Complete  
**Files Changed**: 3 (1 new, 2 modified)  
**Dependencies Added**: 2 runtime, 1 build  
**Breaking Changes**: None (transparent upgrade)

