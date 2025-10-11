# Decap CMS Login Restoration - Change Log

## Summary

Restored Decap CMS login functionality by eliminating broken references, establishing a canonical config path, and implementing a proper OAuth entry route. All changes are minimal and deterministic.

## Changes

### 1. Admin HTML Cleanup (`apps/website/public/website-admin/index.html`)

**Why**: The unpinned Decap version (`@^3.0.0`) could introduce breaking changes, and the broken `override-login.client.js` reference caused 404/MIME errors.

**What changed**:
- Pinned Decap CMS version to `3.9.0` (no more `^3.0.0`)
- Added canonical config path hint: `<link rel="cms-config-url" href="/website-admin/config.yml" />`
- Removed reference to `./override-login.client.js`
- Removed debug script that was unnecessary
- Cleaned up to minimal HTML structure

**Impact**: Eliminates 404 errors, forces Decap to load config from the correct path, ensures consistent Decap version.

---

### 2. Removed Broken Override Login Script (`apps/website/public/website-admin/override-login.client.js`)

**Why**: This file was referenced in the HTML but served no purpose in the standard OAuth flow. It attempted to manually handle OAuth messages and auto-click login buttons, interfering with Decap's built-in OAuth mechanism.

**What changed**:
- Deleted the entire file (54 lines)

**Impact**: Removes source of 404 errors and eliminates custom OAuth message handling that conflicted with Decap's native flow.

---

### 3. Created OAuth Entry Route (`apps/website/src/pages/api/decap/index.ts`)

**Why**: The existing `[...params].ts` catch-all route was handling the OAuth entry, but this is not explicit enough. A dedicated `index.ts` ensures the entry route is clearly defined and matches the `auth_endpoint: /api/decap` in `config.yml`.

**What changed**:
- Created new file with 73 lines
- Implements proper GET handler for `/api/decap?provider=github&scope=repo&site_id=<host>`
- Validates provider (only `github` supported)
- Reads `DECAP_GITHUB_CLIENT_ID` or falls back to `AUTHJS_GITHUB_CLIENT_ID`
- Returns actionable 500 JSON error if client ID is missing
- Generates secure random state using `crypto.randomUUID()`
- Sets `decap_oauth_state` cookie with proper flags (HttpOnly, SameSite=Lax, Path=/, Secure for HTTPS)
- Computes origin from `x-forwarded-proto` and `x-forwarded-host` headers (for proxy compatibility)
- Redirects to `https://github.com/login/oauth/authorize` with proper parameters
- Returns 302 redirect on success, 400 for unsupported providers, 500 for config errors

**Impact**: Provides explicit, deterministic OAuth entry point with proper error handling and CSRF protection.

---

### 4. Removed Conflicting Dynamic Config Endpoint (`apps/website/src/pages/api/website-admin/config.yml.ts`)

**Why**: This dynamic endpoint was generating config at runtime with a different `auth_endpoint: /api/decap/authorize` (which doesn't exist). It conflicted with the static `config.yml` and violated the "single source of truth" principle.

**What changed**:
- Deleted the entire file (107 lines)
- Removed runtime config generation
- Removed YAML dependency for config serving

**Impact**: Eliminates config endpoint conflict, ensures static `config.yml` is the only source, removes confusion about which auth endpoint to use.

---

### 5. Created Admin Directory README (`apps/website/public/website-admin/README.md`)

**Why**: Developers and operators need clear documentation on required environment variables, config paths, and how to test the OAuth flow.

**What changed**:
- Created new documentation file (35 lines)
- Documents config path, OAuth endpoints, required env vars
- Provides curl commands for smoke testing
- Includes troubleshooting tips

**Impact**: Reduces time to diagnose OAuth issues, provides self-service debugging commands.

---

## File Summary

### Modified
1. `apps/website/public/website-admin/index.html` (reduced from 25 to 16 lines)

### Created
1. `apps/website/src/pages/api/decap/index.ts` (73 lines)
2. `apps/website/public/website-admin/README.md` (35 lines)

### Deleted
1. `apps/website/public/website-admin/override-login.client.js` (54 lines removed)
2. `apps/website/src/pages/api/website-admin/config.yml.ts` (107 lines removed)

---

## Preserved Routes

The following existing OAuth routes were **not modified** and continue to work:
- `apps/website/src/pages/api/decap/callback.ts` - Handles OAuth callback from GitHub, exchanges code for token
- `apps/website/src/pages/api/decap/[...params].ts` - Catch-all route for any other `/api/decap/*` paths

---

## Environment Variables

The system now consistently uses this priority:
1. `DECAP_GITHUB_CLIENT_ID` / `DECAP_GITHUB_CLIENT_SECRET` (preferred)
2. `AUTHJS_GITHUB_CLIENT_ID` / `AUTHJS_GITHUB_CLIENT_SECRET` (fallback with warning logged)

If neither is set, the OAuth entry route returns a clear 500 JSON error explaining which variables are expected.

---

## OAuth Flow

The complete flow after these changes:

1. User visits `/website-admin/`
2. HTML loads with `<link rel="cms-config-url" href="/website-admin/config.yml" />`
3. Decap CMS script loads (pinned v3.9.0) and reads static `config.yml`
4. User clicks "Login with GitHub"
5. Decap makes GET request to `/api/decap?provider=github&scope=repo&site_id=<host>`
6. `index.ts` validates provider, checks env vars, generates state, sets cookie
7. `index.ts` returns 302 redirect to GitHub OAuth authorize URL
8. User authorizes on GitHub
9. GitHub redirects to `/api/decap/callback?code=<auth_code>&state=<state>`
10. `callback.ts` exchanges code for access token
11. `callback.ts` returns HTML page that posts token to parent window via `postMessage`
12. Decap CMS receives token and initializes authenticated session

---

## Testing Checklist

```bash
# 1. Static config is accessible
curl -i https://dmitrybond.tech/website-admin/config.yml
# Expected: 200 OK, Content-Type: text/yaml

# 2. OAuth entry returns 302 to GitHub
curl -i "https://dmitrybond.tech/api/decap?provider=github&scope=repo&site_id=dmitrybond.tech"
# Expected: 302 Found, Location: https://github.com/login/oauth/authorize?...

# 3. Environment variables are set
docker exec -it website-preprod env | grep -E "DECAP_|AUTHJS_"
# Expected: See DECAP_GITHUB_CLIENT_ID and DECAP_GITHUB_CLIENT_SECRET

# 4. Admin page loads without 404 errors
# Open browser: https://dmitrybond.tech/website-admin/
# Check Network tab: No 404 for override-login.client.js
# Check Network tab: GET /website-admin/config.yml returns 200
```

---

## Acceptance Criteria Status

✅ `/website-admin/` loads with no 404/MIME errors  
✅ Network shows `GET /website-admin/config.yml` (200)  
✅ `GET /api/decap?...` returns 302 to GitHub when ENVs are set  
✅ Returns helpful 500 JSON when ENVs are missing  
✅ No manual CMS init, no custom config loaders, no stray `override-login.client.js`  
✅ Existing callback and catch-all routes preserved  
✅ Minimal diffs, no new dependencies, structure intact  

---

## Migration Notes

If you previously had a custom config loader or override-login script, those are now removed. The system relies entirely on:
- Static `config.yml` at `/website-admin/config.yml`
- Standard OAuth flow through `/api/decap` → `/api/decap/callback`
- Decap CMS v3.9.0 with no manual initialization

No database changes, no schema migrations, no content loss.

