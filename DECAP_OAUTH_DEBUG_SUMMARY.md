# Decap CMS OAuth Deep Debug Instrumentation — Summary

## Overview

This implementation adds comprehensive debug instrumentation to the Decap CMS OAuth popup flow without changing any behavior. All debug logging is guarded behind the `DECAP_OAUTH_DEBUG='1'` environment variable and localStorage flag.

---

## What Was Changed

### 🔧 Modified Files

1. **`apps/website/src/pages/api/decap/oauth/authorize.ts`** (Server)
   - Added DEBUG flag from `process.env.DECAP_OAUTH_DEBUG`
   - Logs origin, redirect_uri, cookie attributes before redirect
   - Logs missing environment variables when error occurs
   - Adds `X-Decap-Debug: 1` header when debug enabled

2. **`apps/website/src/pages/api/decap/oauth/callback.ts`** (Server)
   - Added DEBUG flag from `process.env.DECAP_OAUTH_DEBUG`
   - Logs query parameters (code, state) and cookie presence
   - Logs token exchange HTTP status
   - Logs payload delivery with masked token
   - Enhanced popup HTML script with debug logging for:
     - postMessage delivery (wildcard and origin-specific)
     - localStorage writes (both keys: `netlify-cms-user`, `decap-cms.user`)
     - Window close attempt
   - All tokens masked (first 4 chars + `...`)
   - Adds `X-Decap-Debug: 1` header when debug enabled

3. **`apps/website/src/pages/api/website-admin/config.yml.ts`** (Server)
   - Added DEBUG flag from `process.env.DECAP_OAUTH_DEBUG`
   - Logs base_url, auth_endpoint, collections count
   - Warns when collections count is 0 (critical issue)
   - Adds `X-Decap-Debug: 1` header when debug enabled
   - Adds `X-Decap-Empty: 1` header when collections count is 0

4. **`apps/website/public/website-admin/override-login.client.js`** (Client)
   - Complete rewrite with deep debug instrumentation
   - Initializes `window.__DECAP_OAUTH_DEBUG__` from localStorage
   - Logs bootstrap and CMS init status
   - Network fetch interceptor (logs URL, status, duration)
   - Passive message listener (logs origin and message type)
   - Config summary logging (backend, auth_endpoint, collections)
   - Redux store subscription:
     - Tracks collections count changes
     - Tracks auth user presence
     - Identifies which localStorage key is used
   - Logs config validation outcome after CMS init
   - Warns when collections count is 0

### 📚 New Files Created

1. **`DECAP_OAUTH_DEBUG_RUNBOOK.md`**
   - Comprehensive debugging guide
   - Quick start instructions
   - Server and client log markers reference
   - Happy path log samples
   - Common failure signatures with fixes
   - Console quick probes
   - LocalStorage keys reference
   - Troubleshooting steps

2. **`DECAP_OAUTH_DEBUG.diff`**
   - Unified diff of all changes
   - Ready to apply with `git apply` or review

3. **`DECAP_OAUTH_DEBUG_SUMMARY.md`** (this file)
   - High-level overview of changes

---

## Debug Toolbox (`window.__DECAP_DEBUG__`)

The client-side toolbox provides four methods:

### `__DECAP_DEBUG__.dump()`
Prints comprehensive state snapshot:
- CMS readiness
- Collections count
- User authentication status
- localStorage keys (with masked tokens)
- Debug mode status
- Window origin, referrer, name

### `__DECAP_DEBUG__.simulate(token)`
Sends a fake OAuth message to test the message listener (debug mode only).

### `__DECAP_DEBUG__.clearAuth()`
Removes all auth localStorage keys and reloads the page.

### `__DECAP_DEBUG__.ping()`
Prints window origin, referrer, and name.

---

## How to Enable Debug Mode

### Client (Browser)
```javascript
localStorage.setItem('DECAP_OAUTH_DEBUG', '1');
location.reload();
```

### Server
Set environment variable:
```bash
DECAP_OAUTH_DEBUG=1
```

Then restart the server.

---

## Log Markers Reference

### Server Logs
| Marker | File | Purpose |
|--------|------|---------|
| `[decap-authz]` | authorize.ts | OAuth initiation, origin, redirect_uri, cookies |
| `[decap-cb]` | callback.ts | Query params, token exchange, payload delivery |
| `[config.yml]` | config.yml.ts | Base URL, auth endpoint, collections |

### Client Logs
| Marker | Purpose |
|--------|---------|
| `[decap-admin]` | Bootstrap, init, config, Redux store, auth |
| `[decap-cb]` | Popup callback script execution |
| `[net]` | Network requests (fetch interceptor) |

---

## Security Features

✅ **All tokens are masked in logs**
- Server: `ghp_abcd...` (first 4 chars + ellipsis)
- Client: `ghp_abcd...` (first 4 chars + ellipsis)
- Never logs full tokens to console or server

✅ **Debug mode must be explicitly enabled**
- Server: `DECAP_OAUTH_DEBUG='1'`
- Client: `localStorage.setItem('DECAP_OAUTH_DEBUG', '1')`

✅ **No behavior changes**
- All logging is passive
- OAuth flow unchanged
- No new dependencies
- No route changes

✅ **Production-safe**
- Debug logs only appear when flag is enabled
- Headers only added when flag is enabled
- No performance impact when disabled

---

## Testing Quick Start

### 1. Enable Debug Mode
```javascript
// In browser console at /website-admin
localStorage.setItem('DECAP_OAUTH_DEBUG', '1');
location.reload();
```

### 2. Check Initial State
```javascript
window.__DECAP_DEBUG__.dump();
```

### 3. Attempt Login
Click "Login with GitHub" and watch:
- **Browser Console**: `[decap-admin]`, `[decap-cb]`, `[net]` logs
- **Server Console**: `[decap-authz]`, `[decap-cb]`, `[config.yml]` logs
- **Network Tab**: Check for `X-Decap-Debug: 1` headers

### 4. Test Message Listener
```javascript
window.__DECAP_DEBUG__.simulate('test_token_123');
```

Should see: `[decap-admin] message: origin=... startsWith='authorization:github:'=true`

---

## Common Issues Detected by Debug Logs

### ❌ Collections Empty
```
[config.yml] WARNING: collections.len=0
[decap-admin] collections(post)=0 - likely causes: folder not found, i18n config missing
```
**Fix**: Check content folder paths in `config.yml.ts`

### ❌ Cookie Not Set
```
[decap-cb] qs code?=true state?=true cookie?=false
```
**Fix**: Enable HTTPS or adjust SameSite/Secure settings

### ❌ Token Exchange Failed
```
[decap-cb] token exchange status=401 ok=false
```
**Fix**: Verify `DECAP_GITHUB_CLIENT_ID` and `DECAP_GITHUB_CLIENT_SECRET`

### ❌ Message Not Received
Popup logs show message sent, but admin console doesn't log receipt.
**Fix**: Check if admin window was closed/reloaded during OAuth

---

## Files Structure

```
c:\PersonalProjects\website-v3\website\
├── DECAP_OAUTH_DEBUG.diff              # Unified diff
├── DECAP_OAUTH_DEBUG_RUNBOOK.md        # Debugging guide
├── DECAP_OAUTH_DEBUG_SUMMARY.md        # This file
└── apps\website\
    ├── public\website-admin\
    │   └── override-login.client.js     # 🔧 Modified (client debug)
    └── src\pages\api\
        ├── decap\oauth\
        │   ├── authorize.ts              # 🔧 Modified (server debug)
        │   └── callback.ts               # 🔧 Modified (server debug)
        └── website-admin\
            └── config.yml.ts             # 🔧 Modified (server debug)
```

---

## Next Steps

1. **Review the changes**: Check `DECAP_OAUTH_DEBUG.diff`
2. **Read the runbook**: See `DECAP_OAUTH_DEBUG_RUNBOOK.md`
3. **Test locally**:
   - Enable debug mode
   - Attempt OAuth login
   - Check logs in browser & server console
4. **Use the toolbox**: Try `window.__DECAP_DEBUG__.dump()` in browser
5. **Commit changes**: All files are ready to commit

---

## Verification Checklist

- ✅ No linter errors in modified files
- ✅ All tokens masked in logs (never log full tokens)
- ✅ Debug flag guarded (all logs behind `DECAP_OAUTH_DEBUG === '1'`)
- ✅ No behavior changes (OAuth flow unchanged)
- ✅ No new dependencies
- ✅ No route changes
- ✅ Headers added when debug enabled (`X-Decap-Debug: 1`)
- ✅ Client toolbox available (`window.__DECAP_DEBUG__`)
- ✅ Runbook created with troubleshooting guide
- ✅ Unified diff generated

---

**Implementation completed successfully! 🎉**

All instrumentation is in place, ready to debug the Decap CMS OAuth popup flow.

