# Decap Login Fix: Eliminate 500 Errors & Config Fetch Issues

## Summary

Surgical fixes to eliminate 500 errors during Decap CMS login and prevent incorrect config fetches. Adds dual config path hints for robust 3.8.x/3.9.x compatibility, hardens `/api/decap` entry point with proper error handling, CORS support, and safer origin detection.

## Changes

### 1. Admin HTML: Dual Config Path Hints (3.8.x/3.9.x compatibility)
**File**: `apps/website/public/website-admin/index.html`

- Added `window.CMS_CONFIG_PATH = '/website-admin/config.yml'` script before Decap load (extra guard for older loaders and brittle environments)
- Kept existing `<link rel="cms-config-url" href="/website-admin/config.yml" />` (standard Decap 3.8.x+ mechanism)
- Updated vendored script reference from `decap-cms-3.8.4.min.js` to `decap-cms-3.9.0.min.js`

**Why**: Forces Decap to always fetch `/website-admin/config.yml` instead of attempting root-level `/config.yml` (which would 404). Dual hints ensure compatibility across Decap versions.

### 2. OAuth Entry: CORS Preflight Handler
**File**: `apps/website/src/pages/api/decap/index.ts`

- Added `export const OPTIONS: APIRoute` handler for CORS preflight requests
- Returns 204 No Content with proper CORS headers (`access-control-allow-origin`, `access-control-allow-methods`, `access-control-allow-headers`)

**Why**: Enables proper CORS support for cross-origin requests from Decap admin interface.

### 3. OAuth Entry: Extract CORS Headers Helper
**File**: `apps/website/src/pages/api/decap/index.ts`

- Created `corsHeaders(origin: string)` helper function returning consistent CORS headers object
- Returns: `access-control-allow-origin`, `access-control-allow-methods: 'GET, POST, OPTIONS'`, `access-control-allow-headers: 'Content-Type'`, `vary: 'Origin'`
- Applied via spread operator `...corsHeaders(origin)` in all responses

**Why**: DRY principle - eliminates duplicate CORS header definitions across error and success paths.

### 4. OAuth Entry: Safer Origin Detection
**File**: `apps/website/src/pages/api/decap/index.ts`

- Updated `getOrigin()` function to normalize protocol: `(req.headers.get('x-forwarded-proto') || url.protocol.replace(':', '')).toLowerCase()`
- Ensures protocol is lowercase and colon is removed consistently

**Why**: Prevents edge cases where protocol might be uppercase or include colons, ensuring consistent `https://` or `http://` prefix in redirect URIs.

### 5. OAuth Entry: Try/Catch Wrapper with Structured Errors
**File**: `apps/website/src/pages/api/decap/index.ts`

- Wrapped entire `GET` handler body in `try/catch` block
- Catch returns 500 JSON response with structured error: `{error: 'Internal server error', details: error.message, message: '...'}`
- Includes proper CORS headers even in error path
- Logs error to console with `[OAuth]` prefix

**Why**: Prevents "bare" 500 HTML errors. All errors now return machine-readable JSON with details, enabling better debugging and preventing opaque failures.

### 6. OAuth Entry: Consistent CORS in Error Paths
**File**: `apps/website/src/pages/api/decap/index.ts`

- Changed CORS header application from manual object literals to `...corsHeaders(origin)` spread
- Applied to: 400 (unsupported provider), 500 (missing client ID), 500 (unexpected error)

**Why**: Ensures all error responses include proper CORS headers, preventing CORS-related failures in error scenarios.

### 7. Documentation: Config Path Hardening Section
**File**: `apps/website/public/website-admin/README.md`

- Added "Config Path Hardening" section explaining dual config hints
- Documents OPTIONS handler, try/catch wrapper, safer origin detection
- Includes curl test examples for OPTIONS, error cases, and success cases

**Why**: Provides clear documentation of implementation details and testing procedures for future maintainers.

### 8. Documentation: Updated Troubleshooting Section
**File**: `apps/website/public/website-admin/README.md`

- Updated script reference from `decap-cms-3.8.4.min.js` to `decap-cms-3.9.0.min.js`
- Enhanced 500 error troubleshooting note: "The error will now return JSON with details instead of HTML"
- Added troubleshooting entry for wrong config fetch with `window.CMS_CONFIG_PATH` verification steps

**Why**: Keeps documentation current with implementation changes and provides better diagnostic guidance.

## Testing

### CORS Preflight
```bash
curl -i -X OPTIONS https://<host>/api/decap
# Expected: 204 No Content, access-control-allow-methods: GET, POST, OPTIONS
```

### OAuth Entry with Error
```bash
curl -i "https://<host>/api/decap?provider=unsupported"
# Expected: 400 JSON with {"error":"Unsupported provider",...}
```

### OAuth Entry Success
```bash
curl -i "https://<host>/api/decap?provider=github&scope=repo"
# Expected: 302 Found, Location: https://github.com/login/oauth/authorize?...
```

### Config Path Verification (Browser)
```javascript
// Open https://<host>/website-admin/ in browser DevTools Console
console.log(window.CMS_CONFIG_PATH);
// Expected: "/website-admin/config.yml"
```

### Network Tab Verification (Browser)
- Visit `https://<host>/website-admin/`
- Check Network tab for:
  - `GET /website-admin/decap-cms-3.9.0.min.js` → 200 OK
  - `GET /website-admin/config.yml` → 200 OK
  - No requests to `https://<host>/config.yml` (wrong path)

## Files Modified

1. `apps/website/public/website-admin/index.html` (8 lines changed: +4, -0, ~4)
2. `apps/website/src/pages/api/decap/index.ts` (32 lines changed: +32, -0, ~50)
3. `apps/website/public/website-admin/README.md` (34 lines changed: +34, -0, ~4)

**Total**: 3 files, 74 lines changed

## Acceptance Criteria Met

✅ **Admin HTML**: `window.CMS_CONFIG_PATH` set before Decap script load  
✅ **Admin HTML**: Both `<link rel="cms-config-url">` and `window.CMS_CONFIG_PATH` present  
✅ **Admin HTML**: References `decap-cms-3.9.0.min.js` (updated from 3.8.4)  
✅ **OAuth Entry**: OPTIONS handler returns 204 with CORS headers  
✅ **OAuth Entry**: GET wrapped in try/catch, errors return JSON with `{error, details, message}`  
✅ **OAuth Entry**: Origin detection normalized (lowercase protocol)  
✅ **OAuth Entry**: CORS headers consistent across all response paths  
✅ **OAuth Entry**: 500 errors include structured JSON, not HTML  
✅ **Documentation**: README includes config path hardening notes with curl tests  
✅ **No new packages**: Only code changes, no dependencies added  
✅ **No callback/token changes**: `/api/decap/callback` and `/api/decap/token` untouched  
✅ **No manual init**: No `CMS.init()` or `window.CMS_MANUAL_INIT` added  

## Deployment Notes

- **Prebuild required**: Run `npm run prebuild` before deployment to fetch `decap-cms-3.9.0.min.js` if not already present
- **Environment variables unchanged**: Still requires `DECAP_GITHUB_CLIENT_ID` and `DECAP_GITHUB_CLIENT_SECRET` (or `AUTHJS_*` fallbacks)
- **No breaking changes**: Backward compatible with existing OAuth flow and callback/token endpoints
- **Cache invalidation**: Browser cache for `/website-admin/` may need clearing due to script URL change (3.8.4 → 3.9.0)

