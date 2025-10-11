# Decap CMS Minimal OAuth - Change Log

## Change 1: Removed Conflicting Catch-All Route

**File**: `apps/website/src/pages/api/decap/[...params].ts` (DELETED)

**Why**: The catch-all `[...params].ts` route was shadowing specific routes and contained duplicate OAuth logic. It handled both GET (OAuth entry) and POST (token exchange), creating confusion and potential routing conflicts. Removing it allows clean separation with explicit routes for each OAuth step.

---

## Change 2: Added CORS Headers to OAuth Entry Route

**File**: `apps/website/src/pages/api/decap/index.ts`

**Lines Changed**: 17-18, 28-33, 48-52

**What Changed**:
- Moved `origin` computation to start of handler (line 18)
- Added `access-control-allow-origin` and `vary: Origin` headers to error responses (400 and 500)

**Why**: Decap CMS makes cross-origin requests during OAuth initialization. Without CORS headers, browsers block the requests, preventing OAuth from starting. The `vary: Origin` header ensures proper caching behavior with different origins.

---

## Change 3: Created Token Exchange Route

**File**: `apps/website/src/pages/api/decap/token.ts` (NEW, 117 lines)

**What It Does**:
1. Accepts POST with JSON body: `{code: string, state: string}`
2. Validates state against `decap_oauth_state` cookie (CSRF protection)
3. Reads `DECAP_GITHUB_CLIENT_ID/SECRET` (falls back to `AUTHJS_*`)
4. Exchanges code for token via `POST https://github.com/login/oauth/access_token`
5. Returns `{token, provider}` on success
6. Returns clear JSON errors (400/500) with actionable messages on failure

**Why**: Separating token exchange from the callback allows the callback to be a pure postMessage bridge, following Decap's official pattern. This keeps sensitive client secrets server-side and never exposes them to the browser.

**Key Security Features**:
- State verification prevents CSRF attacks
- HttpOnly cookies prevent JS access to state
- Client secret never sent to browser
- CORS headers restrict which origins can call the endpoint

---

## Change 4: Replaced Callback with postMessage Bridge

**File**: `apps/website/src/pages/api/decap/callback.ts`

**Lines Changed**: Entire file rewritten (210 lines → 155 lines)

**Old Behavior**: 
- Callback performed token exchange inline
- Posted message directly with token
- Limited error handling

**New Behavior**:
- Renders HTML bridge page with inline JavaScript
- Implements official Decap postMessage handshake pattern:
  1. Bridge sends: `postMessage('authorizing:github', '*')`
  2. Decap responds with same message (handshake)
  3. Bridge calls `/api/decap/token` to exchange code
  4. Bridge posts result: `{type: 'authorization:github:success', token}`
  5. Popup closes automatically

**Why**: The handshake ensures Decap's popup listener is ready before exchanging the token, preventing race conditions where the message arrives before the listener is registered. This is the official Decap OAuth flow pattern.

**User Experience Improvements**:
- Shows status messages ("Exchanging code for token...", "Success!")
- Clear error messages if handshake fails
- Comprehensive console logging for debugging
- Graceful fallback if no opener window

---

## Change 5: Updated Admin README

**File**: `apps/website/public/website-admin/README.md`

**Lines Changed**: Complete rewrite (37 lines → 67 lines)

**What Changed**:
- Added detailed OAuth flow explanation (4 steps)
- Expanded environment variables section with fallback explanation
- Added comprehensive smoke tests (curl and browser)
- Added troubleshooting section for common issues

**Why**: Clear documentation helps operators understand the OAuth flow, verify setup is correct, and debug issues quickly. The smoke tests provide a checklist for deployment verification.

---

## Change 6: Created Diff File

**File**: `DECAP_MINIMAL_OAUTH.diff` (NEW)

**What**: Unified diff of all changes for review and version control.

**Why**: Provides a single file for code review and can be applied to other branches/environments if needed.

---

## Change 7: Created Changelog

**File**: `DECAP_MINIMAL_OAUTH_CHANGELOG.md` (this file)

**What**: Numbered explanation of each change and why it was made.

**Why**: Documents the reasoning behind changes for future maintainers and provides context for code reviews.

---

## Change 8: Created Complete Documentation

**File**: `DECAP_MINIMAL_OAUTH_COMPLETE.md` (NEW)

**What**: Comprehensive guide covering:
- Summary of implementation
- Technical flow diagram
- Security details (state cookie, CSRF protection)
- Error handling examples
- Smoke tests
- Deployment checklist
- Acceptance criteria

**Why**: Serves as the single source of truth for the Decap OAuth implementation. Can be referenced during deployment, debugging, or onboarding new team members.

---

## Summary of Files Changed

| File | Status | Lines | Purpose |
|------|--------|-------|---------|
| `apps/website/src/pages/api/decap/[...params].ts` | ❌ DELETED | -173 | Removed conflicting catch-all |
| `apps/website/src/pages/api/decap/index.ts` | ✏️ MODIFIED | +8 | Added CORS headers |
| `apps/website/src/pages/api/decap/callback.ts` | ✏️ MODIFIED | -55 | postMessage bridge pattern |
| `apps/website/src/pages/api/decap/token.ts` | ➕ CREATED | +117 | Token exchange endpoint |
| `apps/website/public/website-admin/README.md` | ✏️ MODIFIED | +30 | Enhanced documentation |
| `DECAP_MINIMAL_OAUTH.diff` | ➕ CREATED | - | Unified diff |
| `DECAP_MINIMAL_OAUTH_CHANGELOG.md` | ➕ CREATED | - | This changelog |
| `DECAP_MINIMAL_OAUTH_COMPLETE.md` | ➕ CREATED | - | Complete documentation |

**Net Change**: -73 lines (simplified and cleaned up)

---

## Zero Linter Errors

All TypeScript files pass linter checks with no errors or warnings.

---

**Change Date**: 2025-10-11  
**Status**: ✅ Complete

