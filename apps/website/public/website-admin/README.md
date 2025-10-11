# Decap CMS Setup

Minimal, production-safe Decap CMS configuration for content management.

## Overview

- **Admin UI**: `/website-admin/` (this directory)
- **Config**: `/website-admin/config.yml` (served statically)
- **Backend**: GitHub (OAuth via `/api/decap/*` routes)
- **Script**: Decap CMS v3.8.4 vendored locally (no CDN dependency)

## Local Vendored Asset

Decap CMS is served from `/website-admin/decap-cms-3.8.4.min.js` (vendored locally) instead of unpkg CDN.

**Why**: Avoids issues with strict CSP policies, browser extensions, or CDN availability.

**Build Guard**: The `prebuild` script runs `scripts/assert-decap-asset.mjs` before each build to verify the asset exists and is valid (>300KB, contains Decap/Netlify banner). The build will fail if the asset is missing or corrupted, ensuring deterministic, reproducible builds without CDN dependency at runtime.

**Version**: Decap CMS v3.8.4 (latest stable as of pinning). The file is committed directly to the repository for maximum reliability.

## Required Environment Variables

```bash
# GitHub OAuth credentials (preferred)
DECAP_GITHUB_CLIENT_ID=your_github_oauth_client_id
DECAP_GITHUB_CLIENT_SECRET=your_github_oauth_client_secret

# Fallback (if DECAP_* not set, uses Auth.js credentials)
AUTHJS_GITHUB_CLIENT_ID=your_github_oauth_client_id
AUTHJS_GITHUB_CLIENT_SECRET=your_github_oauth_client_secret
```

## OAuth Flow

1. **Entry** (`GET /api/decap?provider=github&scope=repo&site_id=<host>`)
   - Generates random state, sets `decap_oauth_state` cookie
   - Redirects to GitHub OAuth authorize page

2. **Callback** (`GET /api/decap/callback?code=...&state=...`)
   - Bridge page that initiates postMessage handshake with Decap popup
   - On handshake, calls token endpoint to exchange code

3. **Token Exchange** (`POST /api/decap/token` with `{code, state}`)
   - Verifies state against cookie
   - Exchanges code for GitHub access token
   - Returns `{token, provider}` to callback bridge

4. **Bridge → Decap**
   - Callback posts `{type: 'authorization:github:success', token}` to opener
   - Popup closes automatically

## Defensive Redirects

For robustness, `/website-admin/api/decap/*` endpoints (if ever called) 307-redirect to `/api/decap/*` with query strings and HTTP methods preserved. This prevents 404 errors if Decap or future integrations misroute requests.

- `/website-admin/api/decap` → `/api/decap`
- `/website-admin/api/decap/callback` → `/api/decap/callback`
- `/website-admin/api/decap/token` → `/api/decap/token` (preserves POST body)

## Smoke Tests

```bash
# Config is accessible
curl -i https://<host>/website-admin/config.yml
# Expected: 200 OK

# Vendored Decap script loads
curl -sI https://<host>/website-admin/decap-cms-3.8.4.min.js
# Expected: 200 OK, Content-Length > 300KB

# OAuth entry redirects to GitHub
curl -sI "https://<host>/api/decap?provider=github&scope=repo&site_id=<host>"
# Expected: 302 Found, Location: https://github.com/login/oauth/authorize?...

# Defensive redirect works
curl -sI "https://<host>/website-admin/api/decap?provider=github&scope=repo"
# Expected: 307 Temporary Redirect, Location: https://<host>/api/decap?provider=github&scope=repo

# Health endpoint responds
curl https://<host>/api/decap/health
# Expected: {"ok":true,"ts":1234567890,"service":"decap-oauth"}

# Admin page loads (browser test)
# Visit https://<host>/website-admin/
# Open DevTools Console, check: window.CMS
# Expected: Object with registerPreviewTemplate, etc. (not undefined)

# OAuth popup completes (browser test)
# Click "Login with GitHub" → authorize → popup closes → CMS shows Posts collection
```

## Config Path Hardening

To eliminate 500 errors during login and prevent wrong config fetches, the admin HTML now uses **dual config hints**:

1. `<link rel="cms-config-url" href="/website-admin/config.yml" />` (standard Decap 3.8.x+ mechanism)
2. `window.CMS_CONFIG_PATH = '/website-admin/config.yml'` (fallback for older loaders and brittle environments)

This ensures Decap always fetches `/website-admin/config.yml` instead of attempting root-level `/config.yml` (which would 404).

**CORS & Error Handling**: The `/api/decap` entry route now includes:
- **OPTIONS handler** for CORS preflight (204 response)
- **Try/catch** wrapper: all errors return structured JSON (`{error, details, message}`) with proper CORS headers instead of bare 500 HTML
- **Safer origin detection**: `x-forwarded-proto` and `x-forwarded-host` are normalized (lowercase, no colons)

**Testing**:
```bash
# CORS preflight
curl -i -X OPTIONS https://<host>/api/decap
# Expected: 204 No Content, access-control-allow-methods: GET, POST, OPTIONS

# OAuth entry with error
curl -i "https://<host>/api/decap?provider=unsupported"
# Expected: 400 JSON with {"error":"Unsupported provider",...}

# OAuth entry success
curl -i "https://<host>/api/decap?provider=github&scope=repo"
# Expected: 302 Found, Location: https://github.com/login/oauth/authorize?...
```

## Troubleshooting

- **Blank admin page, `window.CMS` undefined**: Check Network tab for `/website-admin/decap-cms-3.8.4.min.js` (should be 200 OK, ~5.2MB). If missing or returning 404, verify the file exists in `public/website-admin/` directory.
- **500 on `/api/decap`**: Missing `DECAP_GITHUB_CLIENT_ID` or `AUTHJS_GITHUB_CLIENT_ID`. Check environment variables. The error will now return JSON with details instead of HTML.
- **400 "Invalid state"**: Cookie may be blocked or cleared. Check browser settings for third-party cookies.
- **Token exchange fails**: Verify `DECAP_GITHUB_CLIENT_SECRET` is set and matches GitHub OAuth app.
- **Defensive redirect loop**: Should not occur; redirects are one-way from `/website-admin/api/decap/*` → `/api/decap/*`.
- **Wrong config fetch (e.g. `/config.yml` instead of `/website-admin/config.yml`)**: Should not occur with dual hints. Check browser console for `window.CMS_CONFIG_PATH` (should be defined before Decap script loads).
