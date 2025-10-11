# Decap CMS Asset - Quick Reference

## Current Setup (2025-10-11)

**Version**: Decap CMS v3.8.4 (latest stable on npm)  
**Location**: `/website-admin/decap-cms-3.8.4.min.js`  
**Size**: ~5.2MB  
**Status**: ✅ Committed to repository

## Build Guard

**Script**: `scripts/assert-decap-asset.mjs`  
**Runs**: Automatically during `npm run prebuild`  
**Validates**:
- File exists
- Size > 300KB
- Contains Decap/Netlify banner

**Failure**: Build exits with code 1 (fails CI)

## Verification

### Local
```bash
npm run prebuild
# Expected: [assert-decap] OK: ...decap-cms-3.8.4.min.js (5204917 bytes)
```

### Production
```bash
curl -sI https://dmitrybond.tech/website-admin/decap-cms-3.8.4.min.js
# Expected: HTTP/2 200, content-type: application/javascript
```

### Browser
```javascript
// Visit: https://dmitrybond.tech/website-admin/
// Console:
window.CMS
// Expected: Object { ... } (not undefined)
```

## Upgrading Decap CMS (Future)

1. Download new version:
   ```bash
   curl -Lo apps/website/public/website-admin/decap-cms-X.Y.Z.min.js \
     https://unpkg.com/decap-cms@X.Y.Z/dist/decap-cms.js
   ```

2. Update files:
   - `index.html` - Update script src
   - `assert-decap-asset.mjs` - Update path
   - `README.md` - Update version references

3. Test build:
   ```bash
   npm run prebuild
   ```

4. Delete old version:
   ```bash
   rm apps/website/public/website-admin/decap-cms-3.8.4.min.js
   ```

## Notes

- ✅ No CDN dependency
- ✅ No runtime downloads
- ✅ Deterministic builds
- ✅ OAuth routes unchanged (`/api/decap/*`)
- ✅ Fail-fast on missing asset

