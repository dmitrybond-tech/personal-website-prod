# Caddy Static Asset Offload Implementation Changelog

## Summary

Implemented Caddy static asset offloading to serve hashed assets directly from the filesystem while keeping dynamic content served by the SSR container. This improves performance by eliminating reverse proxy overhead for static assets and enables immutable caching.

## Changes Made

### 1. Created Asset Export Script
**File**: `scripts/export-assets.sh`
- **Purpose**: Export static assets from running container to host filesystem
- **Features**:
  - Auto-discovery of client assets path in container
  - Atomic update using rsync
  - Idempotent and safe to re-run
  - Proper error handling and verification
  - Permission setting for web server access

### 2. Updated Production Deploy Script
**File**: `production-deploy-update.sh`
- **Changes**:
  - Added asset export step after container health check
  - Integrated `scripts/export-assets.sh` execution
  - Added fallback to legacy extraction method
  - Maintained existing deployment flow

### 3. Updated Compose Configuration
**File**: `infra/compose/website.compose.yml`
- **Changes**:
  - Removed static volume mount (no longer needed)
  - Kept uploads and socket volumes
  - Maintained container configuration for SSR

### 4. Created Caddy Configuration Documentation
**File**: `CADDY_STATIC_ASSET_OFFLOAD_SNIPPET.md`
- **Content**:
  - Complete Caddyfile snippet for static asset serving
  - Static path matching for `/_astro/*`, `/assets/*`, and file extensions
  - Immutable caching configuration (`Cache-Control: public, max-age=31536000, immutable`)
  - Verification header (`X-Served-By: caddy-static`)
  - Fallback to SSR for non-static content

### 5. Created Production Setup Documentation
**File**: `PRODUCTION_STATIC_OFFLOAD_README.md`
- **Content**:
  - Complete setup instructions
  - Architecture overview
  - Verification commands
  - Troubleshooting guide
  - Performance monitoring
  - Maintenance procedures

## Technical Details

### Asset Path Detection
The export script automatically detects the correct path for client assets by checking:
1. Standard paths: `/app/dist/client`, `/app/client`, `/app/apps/website/dist/client`
2. Auto-discovery: Searches for `_astro` directory in common locations
3. Verification: Ensures `_astro` directory exists before proceeding

### Caddy Configuration
- **Static Paths**: `/_astro/*`, `/assets/*`, and common file extensions
- **Caching**: 1-year immutable cache for hashed assets
- **Headers**: Security headers maintained, verification header added
- **Fallback**: All non-static requests proxied to SSR container

### Directory Structure
```
/srv/www/dmitrybond.tech/dist/
├── _astro/           # Hashed assets (CSS, JS)
├── assets/           # Other static assets
└── uploads/          # User-uploaded media
```

## Benefits Achieved

1. **Performance**: Static assets served directly by Caddy (no reverse proxy overhead)
2. **Caching**: Immutable caching for hashed assets (1 year cache)
3. **Scalability**: Reduced load on SSR container
4. **Reliability**: Static assets remain available even if SSR container restarts
5. **Cost**: Reduced server resource usage for static content

## Verification Commands

```bash
# Check static asset serving
curl -sI --resolve dmitrybond.tech:443:127.0.0.1 https://dmitrybond.tech/_astro/any.css | grep -E '^(HTTP/|Cache-Control|X-Served-By)'

# Expected: HTTP/2 200, Cache-Control: public, max-age=31536000, immutable, X-Served-By: caddy-static

# Check TTFB improvement
curl -w '%{time_connect} %{time_starttransfer} %{time_total}\n' -s -o /dev/null https://dmitrybond.tech/_astro/any.css
```

## Files Modified

1. `scripts/export-assets.sh` (new)
2. `production-deploy-update.sh` (updated)
3. `infra/compose/website.compose.yml` (updated)
4. `CADDY_STATIC_ASSET_OFFLOAD_SNIPPET.md` (new)
5. `PRODUCTION_STATIC_OFFLOAD_README.md` (new)
6. `CADDY_STATIC_OFFLOAD_CHANGELOG.md` (new)

## Deployment Process

1. Build and start SSR container
2. Run `scripts/export-assets.sh` to copy assets to `/srv/www/dmitrybond.tech/dist`
3. Apply Caddyfile configuration from documentation
4. Reload Caddy: `systemctl reload caddy`
5. Verify with provided commands

## No Breaking Changes

- Domain paths remain unchanged (`/_astro/*` preserved)
- SSR container continues serving on port 3000
- No changes to build process or file structure
- Backward compatible with existing setup
