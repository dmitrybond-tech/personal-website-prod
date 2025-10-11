# Decap CMS Minimal OAuth Implementation - Complete

## Summary

Completed a minimal, production-safe Decap CMS setup with full GitHub OAuth flow. The implementation follows Decap's official postMessage bridge pattern with clear separation of concerns across three routes.

## Changes Made

### 1. Removed Conflicting Catch-All Route

**File**: `apps/website/src/pages/api/decap/[...params].ts` (DELETED)

**Reason**: This catch-all route was shadowing specific routes and had duplicate logic for both OAuth entry and token exchange. Astro prioritizes specific routes over catch-alls, but having both was confusing and could cause routing conflicts.

**Impact**: Clean routing with explicit handlers for each OAuth step.

---

### 2. Updated OAuth Entry Route

**File**: `apps/website/src/pages/api/decap/index.ts`

**Changes**:
- Added `origin` computation at the start of the handler for CORS headers
- Added CORS headers to all responses: `access-control-allow-origin: <origin>` and `vary: Origin`
- Maintained existing state cookie logic (HttpOnly, SameSite=Lax, secure in HTTPS)
- Kept environment variable fallback logic (DECAP_* preferred, AUTHJS_* fallback)

**Why**: Decap CMS makes cross-origin requests during OAuth flow. CORS headers ensure proper communication between admin UI and OAuth routes.

---

### 3. Created Token Exchange Route

**File**: `apps/website/src/pages/api/decap/token.ts` (NEW)

**Purpose**: Separate endpoint for exchanging GitHub authorization code for access token.

**Behavior**:
- Accepts POST with JSON body: `{code: string, state: string}`
- Verifies state against `decap_oauth_state` cookie (CSRF protection)
- Reads client credentials from environment (DECAP_* or AUTHJS_* fallback)
- Exchanges code for token via GitHub API
- Returns `{token: string, provider: 'github'}` on success
- Returns actionable JSON errors (400/500) with clear messages on failure
- Includes CORS headers on all responses

**Why**: Separating token exchange from callback allows the callback to be a pure postMessage bridge, following Decap's official pattern. This also keeps sensitive client secrets server-side only.

---

### 4. Replaced Callback with postMessage Bridge

**File**: `apps/website/src/pages/api/decap/callback.ts`

**Old Behavior**: Callback performed token exchange inline, then posted message to opener.

**New Behavior**: Implements official Decap postMessage bridge pattern:
1. Receives `code` and `state` from GitHub redirect
2. Renders HTML page with inline script
3. Script sends handshake message: `window.opener.postMessage('authorizing:github', '*')`
4. On receiving handshake response from Decap, calls `/api/decap/token` with POST
5. On success: posts `{type: 'authorization:github:success', token}` to opener
6. On error: posts `{type: 'authorization:github:error', error}` to opener
7. Closes popup window automatically

**Why**: This is the official Decap OAuth flow pattern. The handshake ensures Decap's popup listener is ready before exchanging the token, preventing race conditions.

**UI Improvements**:
- Shows status messages ("Exchanging code for token...", "Success! Closing window...")
- Displays errors clearly if handshake fails or token exchange fails
- Logs all steps to console for debugging

---

### 5. Updated Admin README

**File**: `apps/website/public/website-admin/README.md`

**Changes**: Complete rewrite with focus on:
- Clear overview of OAuth flow (4-step process)
- Required environment variables with fallback explanation
- Smoke tests (curl commands and browser tests)
- Troubleshooting guide for common issues

**Why**: Documentation helps operators verify the setup is working and debug issues quickly.

---

### 6. Verified Admin HTML

**File**: `apps/website/public/website-admin/index.html` (NO CHANGES)

**Verification**: Confirmed file is clean:
- ✅ Has `<link rel="cms-config-url" href="/website-admin/config.yml">`
- ✅ Loads pinned Decap script: `https://unpkg.com/decap-cms@3.9.0/dist/decap-cms.js`
- ✅ No manual initialization (`CMS.init()`)
- ✅ No `window.CMS_MANUAL_INIT` flag
- ✅ No config loaders or override scripts

**Why**: Decap auto-initializes when it finds the config link. Manual init can cause conflicts or blank pages.

---

## Technical Details

### OAuth Flow Sequence

```
1. User visits /website-admin/, clicks "Login with GitHub"
   └─> Decap opens popup to /api/decap?provider=github&scope=repo&site_id=<host>

2. GET /api/decap (index.ts)
   ├─> Generates random state, stores in cookie
   └─> 302 redirect to github.com/login/oauth/authorize

3. User authorizes on GitHub
   └─> GitHub redirects to /api/decap/callback?code=xxx&state=xxx

4. GET /api/decap/callback (callback.ts)
   ├─> Renders HTML bridge page with inline script
   ├─> Script sends handshake: postMessage('authorizing:github', '*')
   └─> Decap popup listener responds with same message

5. Bridge script receives handshake
   ├─> POST /api/decap/token with {code, state}
   └─> Token route verifies state, exchanges code for token

6. POST /api/decap/token (token.ts)
   ├─> Verifies state matches cookie
   ├─> Calls GitHub API with client_id, client_secret, code
   └─> Returns {token, provider: 'github'}

7. Bridge receives token
   ├─> Posts {type: 'authorization:github:success', token} to opener
   └─> Closes popup window

8. Decap receives token, stores in localStorage
   └─> CMS UI loads, shows Posts collection
```

### State Cookie Security

- **Purpose**: CSRF protection - prevents malicious sites from completing OAuth with stolen codes
- **Cookie name**: `decap_oauth_state`
- **Attributes**: HttpOnly (no JS access), SameSite=Lax (sent on top-level navigation), Secure (HTTPS only)
- **Verification**: Token route compares received state with cookie value

### Environment Variables

**Preferred** (clear separation of concerns):
- `DECAP_GITHUB_CLIENT_ID`
- `DECAP_GITHUB_CLIENT_SECRET`

**Fallback** (reuses Auth.js credentials):
- `AUTHJS_GITHUB_CLIENT_ID`
- `AUTHJS_GITHUB_CLIENT_SECRET`

**Warning**: If using fallback, a warning is logged: "Using AUTHJS_GITHUB_CLIENT_ID as fallback. Consider setting DECAP_GITHUB_CLIENT_ID for clarity."

---

## Smoke Tests

### 1. Config is Accessible
```bash
curl -i https://dmitrybond.tech/website-admin/config.yml
# Expected: 200 OK, YAML content
```

### 2. OAuth Entry Redirects
```bash
curl -sI "https://dmitrybond.tech/api/decap?provider=github&scope=repo&site_id=dmitrybond.tech"
# Expected: 302 Found
# Location: https://github.com/login/oauth/authorize?client_id=...
```

### 3. Admin Page Loads (Browser)
1. Visit `https://dmitrybond.tech/website-admin/`
2. Open DevTools Console
3. Type: `window.CMS`
4. Expected: Object with methods (registerPreviewTemplate, etc.)

### 4. OAuth Popup Completes (Browser)
1. Visit `https://dmitrybond.tech/website-admin/`
2. Click "Login with GitHub"
3. Popup opens → GitHub authorization page
4. Click "Authorize"
5. Popup shows "Completing authentication..." → "Success! Closing window..."
6. Popup closes automatically
7. CMS UI shows "Posts" collection with blog entries

---

## Error Handling

### Missing Environment Variables
**Request**: `GET /api/decap`  
**Response**: 500 JSON
```json
{
  "error": "Missing GitHub client ID",
  "expected": ["DECAP_GITHUB_CLIENT_ID", "AUTHJS_GITHUB_CLIENT_ID"],
  "message": "Server configuration error: GitHub OAuth client ID not set"
}
```

### State Verification Failed
**Request**: `POST /api/decap/token`  
**Response**: 400 JSON
```json
{
  "error": "Invalid or missing state/code",
  "details": "State verification failed or missing parameters"
}
```

### GitHub Token Exchange Failed
**Request**: `POST /api/decap/token`  
**Response**: 400 JSON
```json
{
  "error": "bad_verification_code",
  "details": "The code passed is incorrect or expired."
}
```

---

## Files Changed

1. ❌ **DELETED**: `apps/website/src/pages/api/decap/[...params].ts`
2. ✏️ **MODIFIED**: `apps/website/src/pages/api/decap/index.ts` (added CORS headers)
3. ✏️ **MODIFIED**: `apps/website/src/pages/api/decap/callback.ts` (postMessage bridge)
4. ➕ **CREATED**: `apps/website/src/pages/api/decap/token.ts` (token exchange)
5. ✏️ **MODIFIED**: `apps/website/public/website-admin/README.md` (documentation)

---

## Deployment Checklist

- [x] Set environment variables (DECAP_GITHUB_CLIENT_ID/SECRET or AUTHJS_*)
- [x] Verify GitHub OAuth app callback URL: `https://dmitrybond.tech/api/decap/callback`
- [x] Test config.yml is accessible (200 OK)
- [x] Test OAuth entry redirects (302 to GitHub)
- [x] Test full OAuth flow (popup completes, CMS loads)
- [x] Verify no TypeScript or linter errors
- [x] Document changes (this file)

---

## Next Steps (Optional Enhancements)

1. **Rate Limiting**: Add rate limiting to token exchange endpoint
2. **Logging**: Structured logging with request IDs for debugging
3. **Metrics**: Track OAuth success/failure rates
4. **Tests**: Unit tests for token exchange logic
5. **Docs**: Add setup guide to main project README

---

## Acceptance Criteria

✅ On `/website-admin/`, Network shows `decap-cms.js` loaded (200 OK)  
✅ GET `/website-admin/config.yml` returns 200 with YAML  
✅ `window.CMS` is defined (object with Decap methods)  
✅ OAuth popup completes: entry → GitHub → callback → token exchange → postMessage → close  
✅ CMS UI loads and lists Posts collection  
✅ Clear JSON errors for all failure cases (missing ENVs, bad state, token exchange)  

---

**Implementation Date**: 2025-10-11  
**Status**: ✅ Complete

