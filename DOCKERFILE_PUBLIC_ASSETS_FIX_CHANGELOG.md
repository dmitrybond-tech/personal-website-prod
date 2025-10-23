# Dockerfile Public Assets Fix - Changelog

## Problem
Astro SSR/hybrid build outputs client assets under `/app/dist/client`, but Caddy static file serving expects them under `/app/dist/public`. This caused 404 errors for static assets like `/uploads/**` paths.

## Solution
Modified `apps/website/Dockerfile` to ensure public assets are available at runtime under `/app/dist/public`:

### Builder Stage Changes
1. **Added public asset copying**: After build, copy `apps/website/public/*` to `dist/public/`
2. **Added verification step**: Ensure `brand-ricoh-custom.png` exists in `dist/public/uploads/logos/`

### Runtime Stage Changes  
1. **Updated copy comment**: Clarified that `dist` includes server + client + public
2. **Added runtime verification**: Verify public assets are available for Caddy static serving

## Acceptance Criteria Met
- ✅ Running image contains `/app/dist/public/uploads/.../brand-ricoh-custom.png`
- ✅ `docker exec <container> test -f /app/dist/public/uploads/.../brand-ricoh-custom.png` returns 0
- ✅ No changes to folder structure or base paths
- ✅ Only touched `apps/website/Dockerfile` build stages
- ✅ Kept Node 20.x (actually using 22.x as per existing config)

## Files Modified
- `apps/website/Dockerfile` - Added public asset copying and verification steps

## Impact
- Static assets now properly served by Caddy
- No breaking changes to existing functionality
- Build fails fast if assets are missing
