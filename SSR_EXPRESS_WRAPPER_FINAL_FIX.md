# Express Wrapper - Final Fix Summary

## Issue: EADDRINUSE and Handler Import Errors

### Problem 1: Port Conflict (EADDRINUSE)
**Root cause:** Astro config had `adapter: node({ mode: 'standalone' })`
- In `standalone` mode, Astro generates an entry.mjs that starts its own server
- When imported, it immediately tried to listen on port 3000
- Express also tried to listen on port 3000 → conflict

### Problem 2: Handler Not Found
**Root cause:** With `standalone` mode, the export structure was different
- Tried to import `{ app }` which didn't exist
- `astroApp` was undefined → `Cannot read properties of undefined (reading 'handler')`

## Solution

### 1. Changed Astro Adapter Mode
**File:** `apps/website/astro.config.ts`

```diff
- adapter: node({ mode: 'standalone' }),
+ adapter: node({ mode: 'middleware' }),
```

**Impact:**
- ✅ `entry.mjs` now only exports a `handler` function (no server startup)
- ✅ Express wrapper has full control of server lifecycle
- ✅ No port conflicts
- ✅ Consistent export structure

### 2. Simplified Handler Import
**File:** `apps/website/src/server.ts`

```typescript
// Import Astro's handler (in middleware mode, it exports a handler function)
// @ts-ignore - entry.mjs is generated at build time
const { handler: astroHandler } = await import("./entry.mjs");
app.use(astroHandler);
```

**Why this works:**
- In `middleware` mode, Astro always exports `{ handler }`
- No server startup code in entry.mjs
- Clean, simple destructuring

## Files Modified
1. ✅ `apps/website/astro.config.ts` - Changed adapter mode to `middleware`
2. ✅ `apps/website/src/server.ts` - Simplified handler import
3. ✅ `apps/website/package.json` - Dependencies and postbuild script
4. ✅ `apps/website/Dockerfile` - Runtime stage with node_modules

## Expected Behavior After Deploy

### Container Logs
```
SSR listening on :3000
```
- ✅ No EADDRINUSE errors
- ✅ No "Cannot read properties of undefined" errors
- ✅ Single clean startup message

### Health Check
```bash
curl -I https://dmitrybond.tech/_healthz
# HTTP/1.1 200 OK
# Content-Type: text/plain; charset=utf-8
```

### Static Assets
```bash
curl -I https://dmitrybond.tech/_astro/[hash].css
# HTTP/1.1 200 OK
# Content-Type: text/css; charset=UTF-8
# Cache-Control: public, max-age=31536000, immutable
```

### HTML Pages
```bash
curl -I https://dmitrybond.tech/en/about
# HTTP/1.1 200 OK
# Content-Type: text/html; charset=utf-8
# Cache-Control: no-store, max-age=0, must-revalidate
```

## Deployment

```bash
# Commit all changes
git add apps/website/
git commit -m "feat: Express wrapper with middleware mode - production ready"
git push

# CI/CD will rebuild and deploy automatically
```

## Summary of All Issues Fixed

1. ✅ **Build failure** - esbuild couldn't resolve entry.mjs
   - Fixed with `--external:./entry.mjs`

2. ✅ **Module not found** - express/compression not available at runtime
   - Fixed by copying node_modules from builder

3. ✅ **EADDRINUSE** - Port conflict between Express and Astro
   - Fixed by changing adapter to `middleware` mode

4. ✅ **Handler undefined** - Wrong export structure
   - Fixed by using `middleware` mode which exports `{ handler }`

## Architecture

```
Request → Caddy (reverse proxy)
          ↓
          Express Server (:3000)
          ├─ /_astro/* → static files (immutable cache)
          ├─ /fonts/* → static files (immutable cache)
          ├─ /uploads/* → static files (cache)
          ├─ /_healthz → health check
          └─ /* → Astro SSR handler (middleware)
```

**Status:** ✅ Ready for production deployment

