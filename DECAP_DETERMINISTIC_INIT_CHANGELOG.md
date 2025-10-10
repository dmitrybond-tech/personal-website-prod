# Decap CMS Deterministic Initialization - Changelog

## Summary

Fixed Decap CMS initialization and OAuth popup flow to ensure deterministic `CMS.init()` behavior, non-empty collections validation, and reliable popup-based login completion.

---

## Changes by File

### 1. `apps/website/public/website-admin/config-loader.js`

**Purpose**: Ensure deterministic CMS initialization with comprehensive logging

#### Changes:
1. ✅ Added pre-validation logging before `CMS.init()` call
   - Logs collections count before initialization: `[decap-admin] CMS.init called (collections pre-validate: N)`
   
2. ✅ Replaced single post-init check with multi-interval probes (0ms, 250ms, 500ms)
   - Each probe logs: `[decap-admin] collections(post-validate)=N @Xms`
   - Allows tracking of when Redux/CMS actually validates and loads collections
   - Uses proper store access: `window.CMS.store.getState().config.get('collections')`

**Why**: Provides visibility into CMS initialization timing and collection validation process. The multi-interval approach captures collections count at different stages, helping diagnose late-loading issues.

---

### 2. `apps/website/src/pages/api/website-admin/config.yml.ts`

**Purpose**: Ensure YAML config is valid, complete, and properly logged

#### Changes:
1. ✅ Standardized logging format to match requirement spec
   - Changed from template literal to concatenated format
   - Always logs: `[config.yml] base_url=X auth_endpoint=Y collections.len=N`
   
2. ✅ Enhanced DEBUG mode to log each collection's folder path
   - Iterates through collections and logs: `[config.yml] collection[N]: name=X folder=Y`
   - Helps verify that folder paths are correct and accessible

3. ✅ Simplified empty collections warning
   - Removed specific folder path from warning message
   - Warning is now: `[config.yml] WARNING: collections.len=0 - CMS will not initialize!`

**Why**: The backend block was already complete (GitHub, repo, branch, base_url, auth_endpoint). The minimal collection was already present (posts collection with basic fields). These changes improve logging consistency and debugging capability.

---

### 3. `apps/website/src/pages/api/decap/oauth/callback.ts`

**Purpose**: Streamline OAuth callback to canonical popup delivery pattern

#### Changes:
1. ✅ Simplified popup script to essential operations only
   - Removed duplicate postMessage calls (was sending with both '*' and explicit origin)
   - Removed popup-local localStorage mirror (was writing to popup's own storage)
   - Reduced close timeout from 150ms to 0ms for immediate closure
   
2. ✅ Cleaned up logging
   - Unified log format: `[decap-cb] token=XXX... delivering via postMessage(*) + LS seed + close`
   - Removed redundant "delivered via postMessage + close" log
   - Simplified popup script logging
   
3. ✅ Preserved canonical delivery mechanism
   - postMessage with wildcard origin ('*')
   - Seeds both localStorage keys: `netlify-cms-user` and `decap-cms.user`
   - Injects real token value (masked in logs only)
   - Always clears state cookie (already present, unchanged)

**Why**: The previous implementation was correct but overly verbose. These changes reduce complexity while maintaining the exact delivery mechanism required by Decap CMS.

---

### 4. `apps/website/public/website-admin/override-login.client.js`

**Purpose**: Add fallback reload if Redux auth state is delayed

#### Changes:
1. ✅ Trigger post-auth polling when auth message received
   - Message listener now calls `scheduleAuthPoll()` when it detects auth message
   
2. ✅ Implemented `scheduleAuthPoll()` function
   - Polls `CMS.store.getState().auth.user` every 100ms for up to 1.2s (12 attempts)
   - Checks if localStorage has token (`netlify-cms-user` or `decap-cms.user`)
   - If Redux user is present, stops polling (success case)
   - If polling times out AND localStorage has token BUT Redux doesn't → reload once
   - Uses sessionStorage flag `decap_oauth_reloaded` to prevent infinite reload loop
   - Logs: `[decap-admin] auth.user detected in Redux @Xms` (success)
   - Logs: `[decap-admin] Redux auth delayed, reloading once...` (fallback)

**Why**: In some cases, Decap CMS's Redux store may not immediately pick up the auth from localStorage after postMessage delivery. This fallback ensures the user can still enter the CMS by reloading the page once, which re-initializes the auth state from localStorage.

---

## Verification Checklist

After applying these changes, you should observe:

### Console Output

#### During CMS Load:
```
[config.yml] base_url=https://dmitrybond.tech auth_endpoint=/api/decap/authorize collections.len=1
[cms] Loaded config from /api/website-admin/config.yml {...}
[decap-admin] CMS.init called (collections pre-validate: 1)
[decap-admin] collections(post-validate)=1 @0ms
[decap-admin] collections(post-validate)=1 @250ms
[decap-admin] collections(post-validate)=1 @500ms
```

#### After GitHub Login Popup Closes:
```
[decap-oauth] received auth message
[decap-admin] auth.user detected in Redux @200ms
```

OR (if Redux is late):
```
[decap-oauth] received auth message
[decap-oauth] Reloading to complete authentication...
```

### User Experience:
1. ✅ Collections visible in CMS admin (sidebar shows "Blog posts")
2. ✅ After GitHub OAuth popup closes, admin page either:
   - Enters CMS immediately (Redux picked up auth)
   - Reloads once and then enters CMS (fallback triggered)
3. ✅ No extra tabs/windows opened
4. ✅ No token values in browser console
5. ✅ No infinite reload loops

---

## Configuration Summary

### Backend Block (config.yml.ts)
```yaml
backend:
  name: github
  repo: dmitrybond-tech/personal-website-pre-prod
  branch: main
  base_url: https://dmitrybond.tech
  auth_endpoint: /api/decap/authorize
```

### Collections Count
- **Minimum Required**: 1
- **Current**: 1 (posts collection)
- **Folder**: `apps/website/src/content/posts` (or `src/content/posts` in local mode)

### OAuth Flow
1. Admin clicks "Login with GitHub"
2. Redirects to `/api/decap/oauth/authorize`
3. Redirects to GitHub OAuth
4. GitHub redirects to `/api/decap/oauth/callback`
5. Callback returns HTML that:
   - Sends postMessage to opener window
   - Seeds localStorage in opener
   - Closes popup immediately
6. Opener receives message and:
   - Decap's internal handler processes auth
   - If Redux accepts auth → CMS enters
   - If Redux is slow → fallback polls for 1.2s → reloads once

---

## Security Notes

1. ✅ Tokens never logged to console (always masked)
2. ✅ State cookie cleared after OAuth callback
3. ✅ Production cookies use `Secure` flag (already present in authorize.ts)
4. ✅ State cookie signed with HMAC (already present)
5. ✅ No token stored in non-httpOnly cookies

---

## Breaking Changes

**None**. All changes are backwards-compatible refinements.

---

## Testing Recommendations

### Local Testing:
1. Set `DECAP_OAUTH_DEBUG=1` in localStorage
2. Clear localStorage (`netlify-cms-user` and `decap-cms.user`)
3. Navigate to `/website-admin/`
4. Click "Login with GitHub"
5. Observe console logs during OAuth flow
6. Verify CMS enters after popup closes

### Production Testing:
1. Clear localStorage
2. Login via GitHub
3. Verify CMS enters without debug logs
4. Check that no tokens appear in console
5. Verify reload happens at most once

---

## Known Limitations

1. **Reload Fallback**: If Redux is consistently slow, users will see one reload. This is intentional and better than failing to enter the CMS.

2. **Collections Validation**: Collections are validated by Decap internally. If folder paths don't exist in the repo, collections may still be 0 after init. The improved logging will make this visible.

3. **localStorage Access**: If opener window blocks localStorage access (e.g., strict privacy mode), fallback reload won't work and user may need to manually reload.

---

## Future Improvements (Optional)

1. Pre-validate folder paths exist in repo before generating config
2. Add retry mechanism for GitHub token exchange
3. Support Decap's newer auth message format if they change it
4. Add telemetry to track how often fallback reload is triggered

---

## Files Modified

1. `apps/website/public/website-admin/config-loader.js` (20 lines changed)
2. `apps/website/public/website-admin/override-login.client.js` (64 lines added)
3. `apps/website/src/pages/api/website-admin/config.yml.ts` (12 lines changed)
4. `apps/website/src/pages/api/decap/oauth/callback.ts` (66 lines removed, 33 lines added)

**Total**: 4 files, ~195 lines changed

---

## Rollback Plan

To rollback these changes:
```bash
git checkout HEAD -- apps/website/public/website-admin/config-loader.js
git checkout HEAD -- apps/website/public/website-admin/override-login.client.js
git checkout HEAD -- apps/website/src/pages/api/website-admin/config.yml.ts
git checkout HEAD -- apps/website/src/pages/api/decap/oauth/callback.ts
```

---

**End of Changelog**

