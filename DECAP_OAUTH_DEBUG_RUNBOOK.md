# Decap CMS OAuth Debug Runbook

This runbook provides comprehensive guidance for debugging the Decap CMS OAuth popup login flow with the newly instrumented debug logging system.

---

## Table of Contents

1. [Quick Start: Enable Debug Mode](#quick-start-enable-debug-mode)
2. [Where to Look](#where-to-look)
3. [Happy Path Log Sample](#happy-path-log-sample)
4. [Common Failure Signatures](#common-failure-signatures)
5. [Console Quick Probes](#console-quick-probes)
6. [LocalStorage Keys Reference](#localstorage-keys-reference)
7. [Troubleshooting Steps](#troubleshooting-steps)

---

## Quick Start: Enable Debug Mode

### Client-Side (Browser)

In the admin console (`/website-admin`), run:

```javascript
localStorage.setItem('DECAP_OAUTH_DEBUG', '1');
location.reload();
```

### Server-Side

Set the environment variable:

```bash
DECAP_OAUTH_DEBUG=1
```

Then restart your server.

### Verify Debug Mode

- **Client**: Check for `[decap-admin] boot debug=true` in browser console
- **Server**: Check for `X-Decap-Debug: 1` header in Network tab (authorize/callback responses)
- **Config**: Check for `[config.yml]` logs with detailed output

---

## Where to Look

### Server Logs

Look for these markers in your server console:

| Marker | Location | What It Logs |
|--------|----------|--------------|
| `[decap-authz]` | authorize.ts | OAuth flow initiation, origin, redirect_uri, cookie attributes |
| `[decap-cb]` | callback.ts | Query params, cookie validation, token exchange, payload delivery |
| `[config.yml]` | config.yml.ts | Base URL, auth endpoint, collections count |

### Client Logs

Look for these markers in the browser console (admin page):

| Marker | What It Logs |
|--------|--------------|
| `[decap-admin]` | Boot, CMS init, config summary, Redux store changes, auth state |
| `[decap-cb]` | Popup callback script execution, postMessage, localStorage writes |
| `[net]` | Network requests (when debug enabled) |

---

## Happy Path Log Sample

### 1. Admin Page Load

**Browser Console** (`/website-admin`):
```
[decap-admin] boot debug=true CMS_MANUAL_INIT=true
[net] /api/website-admin/config.yml 200 45ms
[decap-admin] config summary: backend=github base_url=https://example.com auth_endpoint=/api/decap/authorize collections(pre)=1
[decap-admin] CMS.init available, waiting for call...
[decap-admin] Redux store subscription established
[decap-admin] collections(post)=1 names=["posts"]
[decap-admin] backend.name=github repo=user/repo branch=main
```

### 2. Click "Login with GitHub"

**Browser Console**:
```
[net] /api/decap/authorize 302 120ms
```

**Server Console**:
```
[decap-authz] origin=https://example.com redirect_uri=https://example.com/api/decap/oauth/callback set-cookie:SameSite=None;Secure=true path=/ maxAge=600
```

### 3. GitHub Authorization (User Approves)

**Browser Console** (popup window):
```
[decap-cb] popup script start, token=ghp_...
[decap-cb] postMessage delivered (wildcard)
[decap-cb] postMessage delivered (origin=https://example.com)
[decap-cb] localStorage write: keys=["netlify-cms-user","decap-cms.user"] value={token:ghp_...,backendName:github}
[decap-cb] closing popup window
```

**Server Console**:
```
[decap-cb] qs code?=true state?=true cookie?=true
[decap-cb] token exchange status=200 ok=true
[decap-cb] payload='authorization:github:success:{...}' token=ghp_... postMessage:wildcard=ok origin=ok lsWrite=ok
[decap-oauth] delivered via postMessage + close
```

### 4. Admin Page (After Popup Closes)

**Browser Console** (`/website-admin`):
```
[decap-admin] message: origin=https://example.com startsWith='authorization:github:'=true
[decap-admin] auth user present=true key=netlify-cms-user
```

---

## Common Failure Signatures

### Signature 1: Collections Empty

**Symptoms**:
```
[config.yml] WARNING: collections.len=0 - CMS will not initialize!
[decap-admin] collections(post)=0 - likely causes: folder not found, i18n config missing, invalid config structure
```

**Meaning**: CMS configuration has no collections defined. Login will appear to succeed but CMS won't function.

**Fix**:
- Check `config.yml.ts` collections configuration
- Verify content folder paths exist (e.g., `apps/website/src/content/posts`)
- Check i18n configuration if using multi-language setup

### Signature 2: Cookie Not Found

**Server Console**:
```
[decap-cb] qs code?=true state?=true cookie?=false
[decap-oauth] No cookie header found
```

**Meaning**: OAuth state cookie is missing, likely due to:
- SameSite=None without Secure flag (must use HTTPS)
- Cookie blocked by browser settings
- Cross-domain cookie issues

**Fix**:
- Ensure `NODE_ENV=production` or force `Secure=true` in development
- Use HTTPS in development (e.g., via tunnel like ngrok)
- Check browser cookie settings

### Signature 3: Token Exchange Failed

**Server Console**:
```
[decap-cb] token exchange status=401 ok=false
[decap-oauth] Token exchange failed: ...
```

**Meaning**: GitHub rejected the token exchange request.

**Fix**:
- Verify `DECAP_GITHUB_CLIENT_ID` and `DECAP_GITHUB_CLIENT_SECRET`
- Check redirect_uri matches GitHub OAuth app settings
- Ensure OAuth app is active and not suspended

### Signature 4: PostMessage Not Received

**Popup Console** (shows message sent):
```
[decap-cb] postMessage delivered (wildcard)
[decap-cb] postMessage delivered (origin=https://example.com)
```

**Admin Console** (no message received):
```
// No [decap-admin] message: ... log
```

**Meaning**: Message sent but not received by admin window.

**Fix**:
- Check if admin window was closed/reloaded during OAuth
- Verify no browser extensions blocking postMessage
- Use `__DECAP_DEBUG__.simulate(token)` to test listener

### Signature 5: Auth State Not Updated

**Browser Console**:
```
[decap-admin] message: origin=https://example.com startsWith='authorization:github:'=true
// But no: [decap-admin] auth user present=true
```

**Meaning**: Message received but Redux state not updated.

**Fix**:
- Check if CMS is fully initialized before message arrives
- Verify localStorage keys are written (use `__DECAP_DEBUG__.dump()`)
- May need to reload admin page to rehydrate from localStorage

---

## Console Quick Probes

### Enable Debug Mode

```javascript
localStorage.setItem('DECAP_OAUTH_DEBUG', '1');
location.reload();
```

### Dump Current State

```javascript
window.__DECAP_DEBUG__.dump();
```

**Output**:
```
=== Decap CMS Debug Dump ===
CMS ready: true
Collections count: 1
User present: true
LS key "netlify-cms-user": present, token=ghp_...
LS key "decap-cms.user": present, token=ghp_...
Debug mode: true
Origin: https://example.com
Referrer: 
Window name: 
```

### Simulate Auth Message (Test Listener)

```javascript
window.__DECAP_DEBUG__.simulate('test_token_123');
```

**What it does**: Sends a fake auth message to the current window to test if the message listener is working.

**Expected**: You should see `[decap-admin] message: ...` in the console and potentially a state update.

### Clear Auth & Reload

```javascript
window.__DECAP_DEBUG__.clearAuth();
```

**What it does**: Removes all authentication localStorage keys and reloads the page.

### Check Origin/Referrer

```javascript
window.__DECAP_DEBUG__.ping();
```

**Output**:
```
Origin: https://example.com
Referrer: 
Window name: 
```

---

## LocalStorage Keys Reference

Based on testing, the current Decap CMS build uses **both** localStorage keys for compatibility:

### Primary Key (Decap CMS)
```
decap-cms.user
```

### Legacy Key (Netlify CMS)
```
netlify-cms-user
```

### Value Format
```json
{
  "token": "ghp_xxxxxxxxxxxxx",
  "backendName": "github"
}
```

### Which Key Is Used?

Check with:
```javascript
window.__DECAP_DEBUG__.dump();
```

Look for the line:
```
LS key "netlify-cms-user": present, token=ghp_...
LS key "decap-cms.user": present, token=ghp_...
```

Both should be present after successful OAuth. The CMS will use whichever it finds first (implementation-dependent).

---

## Troubleshooting Steps

### Step 1: Verify Configuration

```javascript
// Check config loaded
console.log(window.__CMS_CONFIG__);

// Should show: backend, collections, etc.
```

### Step 2: Check Collections

```javascript
window.__DECAP_DEBUG__.dump();
// Look for: Collections count: N (must be > 0)
```

If collections count is 0:
1. Check server logs for `[config.yml] WARNING`
2. Verify content folder paths in `config.yml.ts`
3. Ensure collections array is not empty

### Step 3: Test OAuth Flow

1. Enable debug mode (see Quick Start)
2. Open browser DevTools (Network & Console tabs)
3. Click "Login with GitHub"
4. Watch for:
   - Network: `authorize` (302), `callback` (200)
   - Console: `[decap-authz]`, `[decap-cb]` logs

### Step 4: Test Message Listener

In admin console after successful OAuth:

```javascript
window.__DECAP_DEBUG__.simulate('test_token');
```

If no `[decap-admin] message: ...` appears:
- CMS init might be delayed
- Listener not attached (check `[decap-admin] Redux store subscription established`)

### Step 5: Check Auth State

```javascript
window.__DECAP_DEBUG__.dump();
```

If localStorage has token but "User present: false":
- Redux state not synced
- Try manual reload: `location.reload()`
- CMS may rehydrate from localStorage on next load

### Step 6: Inspect Network Headers

In DevTools Network tab, check:

**authorize response**:
- `Set-Cookie`: Should contain `decap_oauth_state` with `SameSite=None; Secure`
- `X-Decap-Debug: 1` (if debug enabled)

**callback response**:
- `Content-Type: text/html`
- `Cache-Control: no-store`
- `X-Decap-Debug: 1` (if debug enabled)

**config.yml response**:
- `X-Decap-Mode: git` or `local`
- `X-Decap-Empty: 1` (if collections empty - BAD!)
- `X-Decap-Debug: 1` (if debug enabled)

---

## Advanced Debugging

### Trace Network Requests

When debug mode is enabled, all fetch requests are logged:

```
[net] /api/website-admin/config.yml 200 45ms
[net] /api/decap/authorize 302 120ms
```

### Monitor Redux Store Changes

Debug mode automatically logs Redux state changes:

```
[decap-admin] collections(post)=1 names=["posts"]
[decap-admin] auth user present=true key=netlify-cms-user
```

### Popup Window Console

During OAuth, open the popup window console (right-click > Inspect) to see:

```
[decap-cb] popup script start, token=ghp_...
[decap-cb] postMessage delivered (wildcard)
[decap-cb] postMessage delivered (origin=https://example.com)
[decap-cb] localStorage write: keys=["netlify-cms-user","decap-cms.user"] value={token:ghp_...,backendName:github}
[decap-cb] closing popup window
```

---

## Security Notes

- All tokens are masked in logs (e.g., `ghp_abcd...` or `***`)
- Only first 4 characters of tokens are logged in debug mode
- Debug mode should be disabled in production
- Debug logs never expose full tokens to console or server logs

---

## Quick Reference Card

| Task | Command |
|------|---------|
| Enable debug | `localStorage.setItem('DECAP_OAUTH_DEBUG', '1'); location.reload()` |
| Disable debug | `localStorage.removeItem('DECAP_OAUTH_DEBUG'); location.reload()` |
| Dump state | `window.__DECAP_DEBUG__.dump()` |
| Test listener | `window.__DECAP_DEBUG__.simulate('test')` |
| Clear auth | `window.__DECAP_DEBUG__.clearAuth()` |
| Check origin | `window.__DECAP_DEBUG__.ping()` |
| Check config | `console.log(window.__CMS_CONFIG__)` |
| Check CMS state | `console.log(window.__DECAP_CMS__?.state)` |

---

## Getting Help

If you're still stuck:

1. Run `window.__DECAP_DEBUG__.dump()` and share the output
2. Check Network tab for failed requests (status 4xx/5xx)
3. Share server logs with `[decap-authz]`, `[decap-cb]`, `[config.yml]` markers
4. Verify environment variables are set correctly
5. Ensure GitHub OAuth app settings match your configuration

---

**Last Updated**: Generated by Decap OAuth Debug Instrumentation

