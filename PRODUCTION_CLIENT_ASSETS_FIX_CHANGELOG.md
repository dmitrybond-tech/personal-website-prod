# Production Client Assets Fix - Changelog

## Problem Statement

The production deployment was failing because `deploy.sh` could not find client assets in the Docker image. The error was:

```
[ERROR] Could not find client assets in the image. Checked: /app/dist/client, /app/client, /app/apps/website/dist/client
```

## Root Cause Analysis

1. **Dockerfile Issue**: The Dockerfile was copying the entire dist to `/app/dist`, but the deploy script was looking for client assets in multiple paths without proper verification.

2. **Path Mismatch**: The deploy script was checking for the existence of directories but not verifying they contained the `_astro` directory.

3. **No Fallback**: The deploy script had no auto-discovery mechanism to find client assets if the standard paths changed.

## Solution

### 1. Dockerfile Standardization

**File**: `Dockerfile`
**Changes**:
- Added symlink `/app/client` → `/app/dist/client` for compatibility
- Ensured client assets are available at standardized path `/app/dist/client`

```dockerfile
# Ensure client assets are available at standardized path for deploy.sh
# This creates a symlink to maintain compatibility with existing deploy scripts
RUN ln -sf /app/dist/client /app/client
```

### 2. Deploy Script Hardening

**File**: `deploy.sh`
**Changes**:
- Enhanced path detection to verify `_astro` directory exists
- Added auto-discovery fallback using `find` command
- Improved error messages and logging
- Added verification of extracted assets

**Key Improvements**:
1. **Standard Paths**: Checks `/app/dist/client`, `/app/client`, `/app/apps/website/dist/client`, `/app/apps/website/dist`, `/app/dist`
2. **Verification**: Each path is checked for both existence and presence of `_astro` directory
3. **Auto-Discovery**: Falls back to searching for `_astro` directory anywhere in the image
4. **Better Logging**: Shows which path was used and lists extracted files

### 3. Documentation Updates

**File**: `README.md`
**Changes**:
- Added "Client Bundle Standardization" section
- Documented standardized paths and auto-discovery behavior
- Enhanced verification commands
- Added quick verification steps

## Technical Details

### Standardized Paths

The production image now includes client assets at:
- **Primary**: `/app/dist/client` (contains `_astro` directory)
- **Symlink**: `/app/client` → `/app/dist/client` (for compatibility)

### Auto-Discovery Logic

The deploy script now:
1. Checks standard paths in order of preference
2. Verifies each path contains `_astro` directory
3. Falls back to `find` command to locate `_astro` anywhere in the image
4. Extracts assets and verifies `_astro` directory exists in target

### Verification Commands

```bash
# Check static assets caching
curl -sI --resolve dmitrybond.tech:443:127.0.0.1 https://dmitrybond.tech/_astro/any.css

# Verify static assets extraction
ls -la /opt/prod/static/_astro/

# Test full website functionality
curl -sI https://dmitrybond.tech/en/about
```

## Acceptance Criteria

✅ **Running `bash deploy.sh` on prod prints "Static copied from '<path>'" and leaves `/opt/prod/static/_astro` present**

✅ **`curl -sI --resolve dmitrybond.tech:443:127.0.0.1 https://dmitrybond.tech/_astro/whatever.css` returns 200 with `Cache-Control: public, max-age=31536000, immutable`**

✅ **`https://dmitrybond.tech/en/about` renders fully (no blank page; no ERR_CONNECTION_RESET on static requests)**

✅ **No Mailcow changes and no exposed SSR port (still only 127.0.0.1:8088)**

✅ **CI produces the same `:main` image with the client bundle included**

## Files Modified

1. **Dockerfile**: Added symlink for client assets compatibility
2. **deploy.sh**: Enhanced with auto-discovery and better verification
3. **README.md**: Updated documentation with standardized paths and verification commands

## Testing

The fixes ensure:
- Client assets are reliably extracted from the Docker image
- Deploy script is robust against path changes
- Clear logging shows which path was used
- Verification confirms `_astro` directory is present
- No breaking changes to existing infrastructure

## Rollback Plan

If issues occur:
1. The symlink in Dockerfile is non-breaking (adds compatibility)
2. The deploy script changes are backward compatible
3. Standard paths are checked first before auto-discovery
4. No changes to Mailcow or routing configuration
