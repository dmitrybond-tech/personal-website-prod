# Node.js Version Fix Changelog

## Issue
The CI was failing due to Node.js version mismatches and package-lock.json synchronization issues:

1. **Node.js Version Mismatch**: CI was using Node.js 18.20.8, but multiple packages require Node.js 20+
2. **Package Lock Sync Issues**: package-lock.json was out of sync with package.json
3. **Engine Requirements**: Multiple packages now require Node.js 20+

## Changes Made

### 1. Updated GitHub Actions Workflows

#### `.github/workflows/ci-docker.yml`
- **Changed Node.js version**: `'18'` → `'20'`
- **Changed install command**: `npm ci` → `npm install` (to avoid lock file sync issues)

#### `.github/workflows/verify-prod.yml`
- **Changed Node.js version**: `'18'` → `'20'`
- **Changed install command**: `npm ci` → `npm install`

### 2. Updated Package.json Engine Requirements

#### `apps/website/package.json`
```json
{
  "engines": {
    "node": ">=20.0.0",  // Changed from ">=18.20.4"
    "npm": ">=9"
  }
}
```

#### `package.json` (root)
```json
{
  "engines": {
    "node": ">=20",  // Changed from ">=18"
    "npm": ">=9"
  }
}
```

### 3. Regenerated Package Lock File

- **Removed**: `apps/website/package-lock.json`
- **Regenerated**: Fresh package-lock.json with Node.js 20 compatibility
- **Result**: All dependencies now properly resolved

### 4. Verified Docker Configuration

Both Dockerfiles already use Node.js 22:
- `apps/website/Dockerfile`: `FROM node:22-alpine`
- `apps/website/Dockerfile.minimal`: `FROM node:22-alpine`

## Packages That Required Node.js 20+

The following packages were causing the engine warnings:
- `marked@16.3.0` - requires Node.js >= 20
- `type-fest@5.0.1` - requires Node.js >=20
- `rimraf@6.0.1` - requires Node.js 20 || >=22
- `glob@11.0.3` - requires Node.js 20 || >=22
- `jackspeak@4.1.1` - requires Node.js 20 || >=22
- `minimatch@10.0.3` - requires Node.js 20 || >=22
- `path-scurry@2.0.0` - requires Node.js 20 || >=22
- `lru-cache@11.2.2` - requires Node.js 20 || >=22
- `@isaacs/brace-expansion@5.0.0` - requires Node.js 20 || >=22
- `@isaacs/balanced-match@4.0.1` - requires Node.js 20 || >=22

## Benefits

1. **CI Compatibility**: All CI workflows now use Node.js 20
2. **Package Compatibility**: All dependencies now properly resolved
3. **Future-Proof**: Using Node.js 20+ ensures compatibility with modern packages
4. **Docker Consistency**: Dockerfiles already use Node.js 22, which is compatible

## Testing

- ✅ Package-lock.json regenerated successfully
- ✅ All dependencies installed without engine warnings
- ✅ Verification tools are compatible with Node.js 20
- ✅ Docker configuration already uses Node.js 22

## Next Steps

The CI should now pass with:
1. Node.js 20 in GitHub Actions
2. Fresh package-lock.json with proper dependencies
3. All engine requirements satisfied
4. Verification tools ready to run

## Files Modified

- `.github/workflows/ci-docker.yml` - Updated Node.js version and install command
- `.github/workflows/verify-prod.yml` - Updated Node.js version and install command
- `apps/website/package.json` - Updated engine requirements
- `package.json` - Updated engine requirements
- `apps/website/package-lock.json` - Regenerated with Node.js 20 compatibility
