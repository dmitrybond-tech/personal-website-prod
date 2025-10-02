# Admin Debug Cleanup - Numbered Change Log

## Summary
Fixed blank admin screen and Vite "outside allow list" errors by purging absolute FS URLs, hardening asset URLs, and disabling the dev toolbar.

## Changes Made

### 1. Disabled Dev Toolbar
**File:** `apps/website/astro.config.ts`
- Added `devToolbar: { enabled: false }` to the `defineConfig` export
- This prevents the dev toolbar from attempting to load `node_modules/astro/.../dev-toolbar/entrypoint.js` which was causing Windows absolute paths (C:\...) to appear in HTML

### 2. Fixed CSS Import Path in Footer Component
**File:** `apps/website/src/app/widgets/footer/ui/Footer.astro`
- Changed `@import "../../../../styles/tokens-fallback.css";` to `@import "/src/styles/tokens-fallback.css";`
- Replaced relative path traversal with absolute path from src root to prevent potential absolute FS path issues

### 3. Updated Admin Index HTML
**File:** `apps/website/public/website-admin/index.html`
- Added `defer` attribute to the decap-cms.js script tag for proper loading order
- Updated the initialization function name from `start` to `boot` for consistency
- Added `<noscript>` fallback message for better accessibility
- Ensured minimal manual-init approach with local decap-cms.js bundle

### 4. Added Admin Asset Request Logging
**File:** `apps/website/src/middleware.ts`
- Added specific logging for `/website-admin/vendor/decap-cms.js` requests in development mode
- This helps debug admin asset loading and verify the script is being requested correctly

## Verification Steps

### Expected Behavior After Changes:
1. **No Vite "outside allow list" errors** when starting the development server
2. **Admin page loads correctly** at `/website-admin` showing Decap CMS login/collections interface
3. **Server logs show**:
   - `[MW] GET /website-admin → 302 на index.html`
   - `[MW] GET /website-admin/vendor/decap-cms.js` (200)
   - `[MW] bypass admin config API` for `/api/website-admin/config.yml` (200)
4. **Blog and other pages** no longer attempt to load `C:\...\src\styles\main.css` - styles are properly imported via Astro/Vite mechanisms

### Files Verified:
- ✅ `apps/website/astro.config.ts` - Dev toolbar disabled
- ✅ `apps/website/public/website-admin/index.html` - Minimal manual-init setup
- ✅ `apps/website/public/website-admin/vendor/decap-cms.js` - Bundle exists
- ✅ `apps/website/src/app/widgets/footer/ui/Footer.astro` - CSS import fixed
- ✅ `apps/website/src/middleware.ts` - Admin asset logging added

## Technical Notes

### Asset Loading Strategy:
- **CSS imports**: Use absolute paths from src root (`/src/styles/...`) or import statements in script sections
- **Public assets**: Use public URLs (`/website-admin/vendor/...`)
- **Never use**: Windows absolute paths (`C:\...`), `file://` URLs, or `new URL(...).pathname` in HTML

### Admin Initialization:
- Uses manual initialization with `window.CMS_MANUAL_INIT = true`
- Local bundle at `/website-admin/vendor/decap-cms.js` with `defer` attribute
- Bootstrap function waits for CMS to be available before calling `CMS.init()`

## Impact
- Eliminates Vite "outside allow list" errors
- Ensures admin interface loads properly without blank screen
- Improves asset loading reliability across the application
- Maintains compatibility with existing OAuth and middleware functionality