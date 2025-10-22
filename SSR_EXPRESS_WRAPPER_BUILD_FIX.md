# Build Fix: esbuild External Dependencies

## Issue
The initial implementation failed during Docker build with:
```
exit code: 1 during npm run build (postbuild step)
```

## Root Cause
The `postbuild` script uses esbuild to bundle `src/server.ts`, which contains:
```typescript
const { handler: astroHandler } = await import("./entry.mjs");
```

Even though this is a dynamic import, esbuild still tries to resolve `./entry.mjs` at bundle time. However, this file doesn't exist until **after** Astro build completes. This caused esbuild to fail.

## Solution
Updated the postbuild esbuild command to explicitly externalize:
1. All node_modules packages via `--packages=external`
2. The Astro-generated entry point via `--external:./entry.mjs`

### Updated postbuild Script
```json
"postbuild": "esbuild src/server.ts --outfile=dist/server/server.mjs --bundle --platform=node --format=esm --target=node20 --packages=external --external:./entry.mjs --log-level=info"
```

### What This Does
- `--packages=external`: Doesn't bundle any node_modules (express, compression stay as runtime deps)
- `--external:./entry.mjs`: Tells esbuild to leave the `./entry.mjs` import as-is (don't resolve or bundle it)

This way:
1. Astro build runs → generates `dist/server/entry.mjs`
2. esbuild postbuild runs → bundles server.ts but leaves `./entry.mjs` as external
3. At runtime → Node resolves `./entry.mjs` from the same directory

## Files Updated
- `apps/website/package.json` - Updated postbuild script

## Status
✅ Fixed - Ready for Docker build

---

## Issue 2: Runtime Dependency Not Found

### Error
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'express' imported from /app/dist/server/server.mjs
```

### Root Cause
The runtime stage was trying to install production dependencies with `npm ci --workspace`, but the workspace structure wasn't set up correctly in the runtime image, causing `express` and `compression` to not be found.

### Solution
Reverted to copying `node_modules` from the builder stage (where all dependencies are already installed correctly):

```dockerfile
# Copy node_modules from builder (includes express, compression as runtime deps)
COPY --from=builder /app/node_modules ./node_modules
```

This is simpler and more reliable than trying to reinstall dependencies in the runtime stage.

### Files Updated
- `apps/website/Dockerfile` - Simplified runtime stage to copy node_modules from builder

## Final Status
✅ Both issues fixed - Ready for deployment

---

## Issue 3: EADDRINUSE - Port Already in Use

### Error
```
Error: listen EADDRINUSE: address already in use 0.0.0.0:3000
```

### Root Cause
The initial implementation imported `{ handler }` from `./entry.mjs`, but Astro's entry point also includes server startup code. This caused both Express and Astro to try to listen on port 3000.

### Solution
Changed the import to get just the `app` object, then use its `handler` property:

**Before:**
```typescript
const { handler: astroHandler } = await import("./entry.mjs");
app.use(astroHandler);
```

**After:**
```typescript
const { app: astroApp } = await import("./entry.mjs");
app.use(astroApp.handler);
```

This way:
- Only Express calls `app.listen()` (single server)
- Astro's app object is used purely as middleware
- No port conflict

### Files Updated
- `apps/website/src/server.ts` - Updated import to use app.handler

## Final Status
✅ All three issues fixed - Ready for deployment

