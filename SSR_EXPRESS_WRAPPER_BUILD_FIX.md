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

