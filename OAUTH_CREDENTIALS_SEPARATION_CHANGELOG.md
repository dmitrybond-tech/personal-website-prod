# OAuth Credentials Separation - Change Log

## Summary
Separated GitHub OAuth credentials for Auth.js and Decap CMS flows to eliminate "redirect_uri is not associated with this application" errors by using distinct environment variables for each OAuth backend.

## Changes

### 1. Updated Auth.js Configuration (`apps/website/auth.config.ts`)
- **Changed**: GitHub provider now uses `AUTHJS_GITHUB_CLIENT_ID` and `AUTHJS_GITHUB_CLIENT_SECRET`
- **Removed**: References to `OAUTH_GITHUB_CLIENT_ID` and `OAUTH_GITHUB_CLIENT_SECRET`
- **Added**: Explicit authorization scope configuration (`read:user user:email read:org`)
- **Result**: Auth.js OAuth flow now uses dedicated credentials for `/api/auth/callback/github`

### 2. Added Decap Environment Shim (`apps/website/astro.config.ts`)
- **Added**: Environment variable mapping to map `DECAP_*` variables to `GITHUB_*` variables expected by Decap OAuth backend
- **Added**: Developer sanity logs (non-production only) to verify which client IDs are configured
- **Result**: Decap CMS OAuth flow now uses dedicated credentials for `/oauth/callback`

### 3. Updated Environment Template (`apps/website/env.example`)
- **Replaced**: Generic `OAUTH_GITHUB_*` variables with specific `AUTHJS_GITHUB_*` and `DECAP_GITHUB_*` variables
- **Added**: Clear documentation indicating which variables are for which OAuth flow
- **Maintained**: All existing configuration variables (AUTH_URL, AUTH_TRUST_HOST, AUTH_REDIRECT_URI, AUTH_SECRET)

### 4. Enhanced Documentation (`apps/website/README.md`)
- **Updated**: GitHub OAuth App Callbacks section to clarify requirement for two distinct OAuth Apps
- **Added**: Instructions for populating separate credential sets
- **Added**: Verification steps for ensuring correct client_id usage in DevTools

## Environment Variables Required

### For Auth.js (Site Login)
```
AUTHJS_GITHUB_CLIENT_ID=<github-oauth-app-client-id>
AUTHJS_GITHUB_CLIENT_SECRET=<github-oauth-app-client-secret>
```

### For Decap CMS (Content Management)
```
DECAP_GITHUB_CLIENT_ID=<github-oauth-app-client-id>
DECAP_GITHUB_CLIENT_SECRET=<github-oauth-app-client-secret>
```

## GitHub OAuth App Configuration

### Auth.js OAuth App
- **Callback URL**: `http://localhost:4321/api/auth/callback/github`
- **Scopes**: `read:user`, `user:email`, `read:org`

### Decap CMS OAuth App
- **Callback URL**: `http://localhost:4321/oauth/callback`
- **Scopes**: Repository access for content management

## Verification Steps

1. **Clear browser cookies** for `http://localhost:4321`
2. **Check dev logs** on startup to verify both client IDs are detected
3. **Test Auth.js flow**: Visit `/api/auth/signin` and verify GitHub OAuth uses correct client_id
4. **Test Decap flow**: Visit `/website-admin` and verify GitHub OAuth uses correct client_id
5. **Verify in DevTools**: Check Network tab to confirm each flow uses its respective client_id and redirect_uri

## Impact

- **Eliminates**: "redirect_uri is not associated with this application" errors
- **Enables**: Independent OAuth App configurations for different use cases
- **Maintains**: All existing functionality and middleware behavior
- **Preserves**: No changes to routing, i18n, or UI components
