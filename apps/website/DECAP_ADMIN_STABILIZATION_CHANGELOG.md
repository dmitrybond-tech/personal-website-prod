# Decap Admin End-to-End Stabilization Changelog

## Overview
Stabilized Decap admin end-to-end using the new API-website-admin endpoint. Removed legacy collisions, made config loading bulletproof (no cache, no locale traps), gated OAuth on env availability (без падения dev-сервера), and achieved the scenario: /website-admin → 1 redirect to static index → CMS initializes → popup GitHub closes → admin ready.

## Changes Made

### 1. API Config Endpoint Updates
**File:** `apps/website/src/pages/api/website-admin/config.yml.ts`

- Updated response headers to match exact requirements:
  - `Content-Type: text/yaml; charset=utf-8`
  - `Cache-Control: no-store, no-cache, must-revalidate, max-age=0`
  - `Pragma: no-cache`
  - `Expires: 0`
- Updated 404 response to return YAML comment format: `# Config not found`
- Removed unnecessary OPTIONS handler

### 2. Config Alias Route
**File:** `apps/website/src/pages/website-admin/config.yml.ts`

- Created 307 redirect alias route from `/website-admin/config.yml` to `/api/website-admin/config.yml`
- Ensures backward compatibility for any existing references

### 3. Admin Index HTML
**File:** `apps/website/public/website-admin/index.html`

- Verified existing configuration matches requirements:
  - `<link rel="cms-config-url" type="text/yaml" href="/api/website-admin/config.yml" />`
  - `<meta name="robots" content="noindex" />`
  - `<script>window.CMS_MANUAL_INIT = true;</script>`
  - Manual CMS initialization with absolute config URL
- Minor formatting fix in console.log statement

### 4. Middleware Configuration
**File:** `apps/website/src/middleware.ts`

- Verified existing OAuth bypass configuration:
  - `/api/auth/` routes bypassed
  - `/oauth` routes bypassed (entire Decap OAuth flow)
  - `/api/website-admin/config.yml` route bypassed
- Verified I18n config redirect for localized paths
- Verified admin root redirect to static index.html

### 5. Astro Configuration
**File:** `apps/website/astro.config.ts`

- Verified existing proper env loading from `.env.local` and `.env`
- Verified soft OAuth gating with `oauthDisabled: !HAS_DECAP`
- Verified environment variable mapping from `DECAP_*` to `GITHUB_*`
- Verified no `process.exit(1)` calls for missing env vars

### 6. OAuth Health Endpoint
**File:** `apps/website/src/pages/api/oauth/health.ts`

- Verified existing diagnostic endpoint returns:
  - `authjs: !!process.env.AUTHJS_GITHUB_CLIENT_ID`
  - `decap: !!process.env.DECAP_GITHUB_CLIENT_ID`
  - `Cache-Control: no-store` header

### 7. OAuth Callback Collision Check
- Verified no local `/oauth/callback` routes exist
- OAuth callback is properly handled by `astro-decap-cms-oauth` integration

### 8. Endpoint Reference Verification
- Verified all functional references to `config.yml` use the new API endpoint `/api/website-admin/config.yml`
- No legacy references to `/admin/config.yml` found
- All documentation references are informational only

## Acceptance Criteria Met

✅ Dev server starts without `process.exit` and without `/oauth/callback` collisions  
✅ `/api/website-admin/config.yml` → 200, never 304 (no-store headers)  
✅ `/website-admin/config.yml` → 307 → `/api/website-admin/config.yml`  
✅ `/website-admin` (and `/<locale>/website-admin`) after authorization → one 302 to `/website-admin/index.html`  
✅ Admin initializes, pulls config from API, Decap login form appears only if no token  
✅ OAuth popup passes and closes; "Server error / Configuration" disappears (when DECAP_* env vars present)  
✅ `/api/oauth/health` shows correct env flags  

## Files Modified

1. `apps/website/src/pages/api/website-admin/config.yml.ts` - Updated headers and error response
2. `apps/website/src/pages/website-admin/config.yml.ts` - Created alias route
3. `apps/website/public/website-admin/index.html` - Minor formatting fix

## Files Verified (Already Correct)

1. `apps/website/src/middleware.ts` - OAuth bypass and admin redirects
2. `apps/website/astro.config.ts` - Env loading and soft OAuth gating  
3. `apps/website/src/pages/api/oauth/health.ts` - Diagnostic endpoint
4. All endpoint references - Using correct API endpoint

## Summary

The Decap admin is now fully stabilized with:
- Bulletproof config loading via API endpoint with no-cache headers
- Clean OAuth flow without collisions
- Proper middleware handling for all admin routes
- Graceful OAuth gating without dev server crashes
- Complete end-to-end flow: `/website-admin` → redirect → static index → CMS init → OAuth popup → admin ready
