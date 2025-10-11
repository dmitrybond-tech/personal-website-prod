# Decap CMS Setup

Minimal, production-safe Decap CMS configuration for content management.

## Overview

- **Admin UI**: `/website-admin/` (this directory)
- **Config**: `/website-admin/config.yml` (served statically)
- **Backend**: GitHub (OAuth via `/api/decap/*` routes)

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

## Smoke Tests

```bash
# Config is accessible
curl -i https://<host>/website-admin/config.yml
# Expected: 200 OK

# OAuth entry redirects to GitHub
curl -sI "https://<host>/api/decap?provider=github&scope=repo&site_id=<host>"
# Expected: 302 Found, Location: https://github.com/login/oauth/authorize?...

# Admin page loads (browser test)
# Visit https://<host>/website-admin/
# Open DevTools Console, check: window.CMS
# Expected: Object with registerPreviewTemplate, etc.

# OAuth popup completes (browser test)
# Click "Login with GitHub" → authorize → popup closes → CMS shows Posts collection
```

## Troubleshooting

- **Blank admin page, `window.CMS` undefined**: Check Network tab for 404 on `decap-cms.js`. Ensure unpkg is accessible.
- **500 on `/api/decap`**: Missing `DECAP_GITHUB_CLIENT_ID` or `AUTHJS_GITHUB_CLIENT_ID`. Check environment variables.
- **400 "Invalid state"**: Cookie may be blocked or cleared. Check browser settings for third-party cookies.
- **Token exchange fails**: Verify `DECAP_GITHUB_CLIENT_SECRET` is set and matches GitHub OAuth app.
