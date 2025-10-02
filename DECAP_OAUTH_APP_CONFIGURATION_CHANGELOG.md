# Decap CMS OAuth App Configuration - Change Log

## Overview
Configured Decap CMS to use only OAuth App for publishing, ensuring proper scopes (repo, user:email), and preventing Auth.js interference in admin flow.

## Changes Made

### 1. astro.config.ts - Force OAuth App Usage
- **File**: `apps/website/astro.config.ts`
- **Change**: Updated OAuth App client ID mapping to be more explicit
- **Details**: 
  - Changed conditional mapping to always force `DECAP_GITHUB_CLIENT_ID` → `GITHUB_CLIENT_ID`
  - Added diagnostic logging to show effective OAuth App client_id on startup
  - Log format: `[DECAP EFFECTIVE OAuthApp client_id] ABCD1234…`

### 2. Custom OAuth Route with Proper Scopes
- **File**: `apps/website/src/pages/oauth/index.ts` (new)
- **Change**: Created custom OAuth route to override astro-decap-cms-oauth default scopes
- **Details**:
  - Replaces default OAuth route with proper scopes: `repo,user:email`
  - Implements CSRF protection with state parameter
  - Stores state in secure HTTP-only cookie
  - Uses `GITHUB_CLIENT_ID` from environment

### 3. Middleware Auth.js Blocking
- **File**: `apps/website/src/middleware.ts`
- **Change**: Added protection against Auth.js interference in admin flow
- **Details**:
  - Blocks `/api/auth/*` requests when referer contains `/website-admin` or `/oauth`
  - Returns 409 status with clear error message
  - Preserves normal Auth.js functionality for site users

### 4. Decap Config Cleanup
- **File**: `apps/website/public/website-admin/config.yml`
- **Change**: Removed unnecessary `site_domain` parameter
- **Details**:
  - Kept correct repository: `dmitrybond-tech/personal-website-dev`
  - Maintained proper paths for posts and media
  - Ensured `auth_endpoint: "oauth"` points to custom route

### 5. Diagnostic Endpoint
- **File**: `apps/website/src/pages/api/oauth/whoami.ts` (new)
- **Change**: Added diagnostic endpoint to verify OAuth token type and scopes
- **Details**:
  - Checks if OAuth token is available in cookies
  - Verifies token type (OAuth App vs GitHub App)
  - Tests `user:email` scope by calling GitHub API
  - Returns diagnostic information for troubleshooting

## Expected Behavior

### Startup Logs
```
[DECAP EFFECTIVE OAuthApp client_id] ABCD1234…
```

### Publishing Flow
1. User accesses `/website-admin`
2. Clicks "Login with GitHub" → redirects to custom `/oauth` route
3. GitHub OAuth with scopes: `repo,user:email`
4. Callback processes token and stores in cookies
5. Decap CMS can now publish to `dmitrybond-tech/personal-website-dev`
6. Posts saved to: `apps/website/src/content/posts/{en|ru}/{slug}.md`
7. Media uploaded to: `apps/website/public/uploads`

### Error Prevention
- No more "Resource not accessible by integration" errors
- Auth.js cannot interfere with admin authentication
- Proper scopes ensure full repository access

## Verification
- Start dev server and check for OAuth App client_id log
- Access `/website-admin` and verify GitHub login works
- Create test post and verify it commits to correct repository
- Check `/api/oauth/whoami` for token diagnostic information

## Files Modified
- `apps/website/astro.config.ts`
- `apps/website/src/middleware.ts`
- `apps/website/public/website-admin/config.yml`

## Files Created
- `apps/website/src/pages/oauth/index.ts`
- `apps/website/src/pages/api/oauth/whoami.ts`
