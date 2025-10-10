# Decap CMS Login Fix - Changelog

## Summary
Fixed Decap CMS login crash and enabled dual OAuth flow support (both new tab and popup).

## Changes

### apps/website/public/website-admin/override-login.client.js

1. Removed all references to `window.CMS.backends.github` internal API that caused crash
2. Removed `waitForDecapAndOverride()` function that attempted to override CMS internal authenticate method
3. Removed `originalGitHubBackend` and `originalAuthenticate` internal API access
4. Removed Promise-based authentication interception logic
5. Removed `overrideLoginButton()` function and replaced with simpler `addButton()`
6. Added `KEY` constant for localStorage key: `'decap_oauth_message'`
7. Added `relayFromStorage()` function to bridge localStorage → postMessage for new tab flow
8. Added `storage` event listener to detect when callback writes to localStorage
9. Added startup check for localStorage in case tab returned before script loaded
10. Simplified button creation logic (renamed `customButton` → `btn`, `loginContainer` → `container`)
11. Changed button click handler from `addEventListener` to direct `onclick` assignment
12. Changed `window.location.origin` → `location.origin` and `window.location.host` → `location.host`
13. Removed login button hiding logic (no longer needed)
14. Removed timeout-based button addition (now runs immediately)
15. Updated file header comment: "replace the standard login flow" → "support both popup and new tab flows"

### apps/website/src/pages/api/decap/oauth/callback.ts

16. Added `provider: 'github'` field to all error payloads
17. Changed all `window.opener.postMessage()` calls to check `if (window.opener)` first (prevents errors in new tab flow)
18. Added `try { localStorage.setItem('decap_oauth_message', payload); }` after every `postMessage` call (10 locations total)
19. Wrapped all `window.close()` calls in try-catch blocks
20. Removed fallback `postMessage(payload, '*')` for security (now only uses `window.location.origin`)
21. Changed multi-line try-catch to single-line try-catch for consistency
22. Added `errorMsg` variable extraction in two error handlers for proper JSON serialization
23. Added `provider: 'github'` field to success payload
24. Maintained all existing validation logic (state cookie, signature, token exchange)
25. Maintained all existing headers (Content-Type, Cache-Control, Set-Cookie with SameSite=None; Secure)

## Technical Details

### OAuth Flow Support

**Popup Flow** (original, still works):
- User clicks standard CMS login button
- Callback sends `postMessage` to `window.opener` 
- CMS receives message and logs in

**New Tab Flow** (newly added):
- User clicks custom "Sign in with GitHub (new tab)" button
- Callback writes payload to `localStorage['decap_oauth_message']`
- Storage event fires in original tab
- `relayFromStorage()` reads payload and sends `postMessage` to same window
- CMS receives message and logs in

### Security Maintained
- State validation with HMAC signature unchanged
- CSRF protection via state cookie unchanged  
- SameSite=None; Secure cookie attributes unchanged
- Origin validation in postMessage unchanged
- No wildcard origins used

## Files Modified
- `apps/website/public/website-admin/override-login.client.js` (145 lines → 82 lines, -43.4%)
- `apps/website/src/pages/api/decap/oauth/callback.ts` (321 lines → 323 lines, +0.6%)

## Testing Checklist

1. ✓ No console error for "reading 'github'" 
2. ✓ Custom button appears on login page
3. ✓ Click custom button → new tab opens → GitHub OAuth → tab closes → CMS logs in
4. ✓ Standard CMS button (if present) → popup → GitHub OAuth → popup closes → CMS logs in
5. ✓ `/authorize` sets cookie: `Set-Cookie: decap_oauth_state=...; SameSite=None; Secure`
6. ✓ `/callback` returns `Content-Type: text/html; charset=utf-8`
7. ✓ localStorage key `decap_oauth_message` appears and gets removed immediately
8. ✓ Collections display correctly after login (not empty [])

