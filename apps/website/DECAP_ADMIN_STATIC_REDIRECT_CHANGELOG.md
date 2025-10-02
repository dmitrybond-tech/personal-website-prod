# Decap Admin Static Redirect Implementation - Change Log

## Overview
Ensured Decap admin always uses the static `public/website-admin/index.html` (manual init with absolute config) instead of the integration's SSR admin route, and guaranteed the config is fetched from `/website-admin/config.yml` even under i18n prefixes and hash redirects.

## Changes Made

### 1. Middleware Admin Root Redirect Logic
**File:** `apps/website/src/middleware.ts`

**Change:** Added redirect logic after successful authentication to force admin root URLs to use the static index.html file.

**Details:**
- Added path parsing logic to detect admin root URLs (`/website-admin` or `/<locale>/website-admin`)
- Implemented 302 redirect to `/website-admin/index.html` after successful auth
- Preserved query string parameters during redirect
- Maintained existing early returns for `/api/auth/*` and `/oauth*` routes
- Kept existing config.yml redirect logic intact

**Code Added:**
```typescript
// After successful auth, redirect admin root URLs to static index.html
const segs = path.split('/').filter(Boolean);
const isAdminRoot =
  (segs.length === 1 && segs[0] === 'website-admin') ||
  (segs.length === 2 && segs[1] === 'website-admin');

if (isAdminRoot) {
  const to = new URL('/website-admin/index.html', url.origin);
  // keep query string if any
  for (const [k, v] of url.searchParams) to.searchParams.set(k, v);
  return Response.redirect(to.toString(), 302);
}
```

### 2. Admin Index Console Logging
**File:** `apps/website/public/website-admin/index.html`

**Change:** Added optional console log to verify the config path is correctly set during initialization.

**Details:**
- Added `console.log('[Decap admin] init with', window.CMS_CONFIG_PATH);` before CMS initialization
- This ensures the absolute config path `/website-admin/config.yml` is logged on page load
- Helps with debugging and verification that manual init is working correctly

**Code Added:**
```javascript
console.log('[Decap admin] init with', window.CMS_CONFIG_PATH);
```

### 3. README Documentation Update
**File:** `apps/website/README.md`

**Change:** Updated the i18n Admin Configuration section to document the new admin root redirect behavior.

**Details:**
- Added "Admin Root Redirect" section explaining the new behavior
- Clarified that redirects only apply to authenticated users
- Maintained documentation about existing config.yml redirect logic
- Updated requirements to include admin root redirect information

**Content Added:**
```markdown
**Admin Root Redirect:** After authentication, admin root requests (`/website-admin` or `/<locale>/website-admin`) are redirected to the static `/website-admin/index.html` file to ensure Decap always uses the manual-init configuration instead of the integration's SSR admin route.
```

## Behavior Changes

### Before
- Admin root URLs (`/website-admin`, `/<locale>/website-admin`) were served by the integration's SSR admin route
- Decap would try to load relative `config.yml` and fail under i18n prefixes
- Mixed behavior between static and SSR admin routes

### After
- All admin root URLs redirect to static `/website-admin/index.html` after authentication
- Decap always uses manual init with absolute config path `/website-admin/config.yml`
- Consistent behavior regardless of i18n prefixes or hash redirects
- Unauthenticated users still get redirected to `/api/auth/signin` (no change)

## Acceptance Criteria Met

✅ `GET /website-admin/index.html` serves the static manual-init page  
✅ Hitting `/website-admin` or `/<locale>/website-admin` (when authorized) 302-redirects to `/website-admin/index.html`  
✅ Admin UI loads and fetches `/website-admin/config.yml` (Network shows 200 or 302→200)  
✅ No 404 "Failed to load config.yml"  
✅ Unauthenticated users hitting `/website-admin` still get redirected to `/api/auth/signin` (no change)  
✅ OAuth flow unchanged; `/oauth` routes untouched  

## Files Modified

1. `apps/website/src/middleware.ts` - Added admin root redirect logic
2. `apps/website/public/website-admin/index.html` - Added console logging
3. `apps/website/README.md` - Updated documentation
4. `apps/website/DECAP_ADMIN_STATIC_REDIRECT_CHANGELOG.md` - This change log

## Constraints Respected

- ✅ No modifications to `.env.local` or secrets
- ✅ OAuth endpoints (`/oauth`, `/oauth/callback`) and middleware exclusions for `/api/auth/*` and `/oauth*` preserved
- ✅ i18n config and folder structure unchanged
- ✅ No unified diff provided (numbered change log only as requested)
