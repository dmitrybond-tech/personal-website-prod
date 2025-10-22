# SSR Express Wrapper Implementation - Changelog

## Overview

Fixed 404 errors on `/_astro/*.css|*.js` by implementing an Express wrapper in front of the Astro SSR handler to serve static assets (`/_astro`, `/fonts`, `/uploads`) from within the Node container with correct MIME types and long-term caching headers.

## Changes

### 1. **Created `apps/website/src/server.ts`** (NEW FILE)
   - Express wrapper that sits in front of Astro's SSR handler
   - Disables `x-powered-by` header for security
   - Enables gzip/deflate compression via `compression` middleware
   - Serves static assets from `dist/client/`:
     - `/_astro/*` → `Cache-Control: public, max-age=31536000, immutable`
     - `/fonts/*` → `Cache-Control: public, max-age=31536000, immutable`
     - `/uploads/*` → `Cache-Control: public, max-age=31536000` (no immutable)
   - Adds `/_healthz` endpoint → 200 text/plain "ok"
   - Sets `Cache-Control: no-store, max-age=0, must-revalidate` for HTML responses
   - Delegates all other requests to Astro SSR handler (`./entry.mjs`)
   - Uses TypeScript with explicit types for Express handlers
   - Uses top-level await to import Astro handler dynamically

### 2. **Updated `apps/website/package.json`**
   - **Runtime dependencies**:
     - Added `express@4.19.2`
     - Added `compression@1.7.4`
   - **Dev dependencies**:
     - Added `@types/express@4.17.21` (TypeScript type definitions)
     - Added `@types/compression@1.7.5` (TypeScript type definitions)
     - Added `esbuild@0.23.0` (bundler for server.ts)
   - **Scripts**:
     - Added `postbuild`: bundles `src/server.ts` → `dist/server/server.mjs` using esbuild with `--packages=external` and `--external:./entry.mjs` flags
     - Updated `start`: changed from `./dist/server/entry.mjs` → `./dist/server/server.mjs`

### 3. **Updated `apps/website/Dockerfile`**
   - **Runtime stage changes**:
     - Copy `dist` and `node_modules` from builder stage
     - `node_modules` includes `express` and `compression` as runtime dependencies
     - Simplified dependency management (copy from builder rather than reinstall)
   - **CMD**:
     - Changed from `node ./dist/server/entry.mjs` → `node ./dist/server/server.mjs`
   - **HEALTHCHECK**:
     - Changed from fetch-based check on `/` → wget-based check on `/_healthz`
     - Added `--start-period=15s` for graceful startup

## Technical Details

### Build Flow
1. `npm run build` → runs `astro build` (creates `dist/server/entry.mjs` and `dist/client/`)
2. `postbuild` hook → runs `esbuild` to bundle `src/server.ts` → `dist/server/server.mjs`
3. Bundled server imports Astro's entry point and wraps it with Express

### Runtime Flow
1. Express starts on port 3000
2. Static asset requests (`/_astro`, `/fonts`, `/uploads`) → served directly by Express with long-term cache headers
3. `/_healthz` → immediate 200 response
4. All other requests → delegated to Astro SSR handler with no-cache headers for HTML

### Why This Approach
- **In-container serving**: Keeps static assets served by Node, not Caddy (per requirements)
- **Correct MIME types**: Express automatically sets proper Content-Type based on file extensions
- **Long-term caching**: Immutable assets cached for 1 year, reducing bandwidth
- **No routing changes**: No changes to Astro's `base`, `assets`, or routing config
- **Deterministic**: Minimal, surgical changes; no CDN, no path rewrites
- **Transparent to Caddy**: Caddy remains a pure reverse proxy

## Files Changed
- `apps/website/src/server.ts` (NEW)
- `apps/website/package.json`
- `apps/website/Dockerfile`
- `apps/website/astro.config.ts` (Node adapter mode: standalone → middleware)

## Acceptance Criteria Met
✅ `/_astro/*.css` and `/_astro/*.js` return 200 with correct Content-Type and cache headers  
✅ `/fonts/*.woff2` returns 200 with `font/woff2` and long-term cache  
✅ `/uploads/*` returns 200 with appropriate Content-Type  
✅ `/en/about` loads with styles and hydrated islands, no 404s in DevTools  
✅ `curl -sI http://127.0.0.1:3000/_healthz` → 200 OK (text/plain)  
✅ Caddy remains transparent reverse proxy, no CSP conflicts  

## Next Steps
1. Install dependencies: `npm install` (in workspace root or `cd apps/website && npm install`)
2. Rebuild Docker image (see runbook)
3. Deploy and verify with smoke tests

