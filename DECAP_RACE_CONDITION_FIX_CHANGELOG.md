# Decap CMS Race Condition Fix — Changelog

**Date**: 2025-10-10  
**Issue**: CMS init race, collections=0, login stuck after popup  
**Solution**: Deterministic init, YAML fallback, robust auth detection

---

## Changes Summary

### 1. **Robust Readiness Gate** (`config-loader.js`)

**Problem**: CMS.init was called before Decap core fully booted its Redux store.

**Solution**:
- Added `waitForCMSCore()` that checks for:
  - `window.CMS.init` existence
  - `#nc-root` DOM element (Decap app mount point)
  - `CMS.registerPreviewTemplate` API availability
  - Minimum 200ms grace period after CMS appears
- Added `waitForStore()` that polls for `CMS.store.getState()` up to 3s
- Two-phase init pattern with retry capability

**Logging**:
```
[cms-init] gate passed (core ready), calling CMS.init
[cms-init] store ready @<ms>
```

### 2. **Global Error Handlers** (`config-loader.js`)

**Problem**: Swallowed exceptions from CMS.init were invisible.

**Solution**:
- Added `window.addEventListener('error')` handler
- Added `window.addEventListener('unhandledrejection')` handler
- Wrapped CMS.init in try/catch block

**Logging**:
```
[cms] onerror: <error>
[cms] unhandledrejection: <reason>
[cms-init] CMS.init threw error: <error>
```

### 3. **Dual-Path Config Feed** (`config-loader.js`)

**Problem**: Object config sometimes failed Immutable validation silently.

**Solution**:
- Phase A: Try `CMS.init({ load_config_file: false, config: <object> })`
- Wait 500ms for store + check collections count
- Phase B: If failed, retry with `CMS.init({ config: <yamlString> })`
- Store raw YAML text in `window.__CMS_CONFIG_RAW_YAML__`

**Logging**:
```
[cms-init] object config accepted
// OR
[cms-init] object config failed validation, trying YAML fallback
[cms-init] YAML config accepted (fallback)
```

### 4. **Collection Validation** (`config-loader.js`, `config.yml.ts`)

**Server-side** (`config.yml.ts`):
```typescript
// Always log collection details
console.log(`[config.yml] base_url=${baseUrl} auth_endpoint=${endpoint} collections.len=${count}`);
console.log(`[config.yml] backend=${backendName} repo=${repoInfo}`);
config.collections.forEach((col, idx) => {
  console.log(`[config.yml] collection[${idx}]: name=${col.name} folder=${col.folder}`);
});

if (collectionsCount === 0) {
  console.warn('[config.yml] WARNING: collections.len=0 - CMS will not initialize!');
}
```

**Client-side** (`config-loader.js`):
```javascript
function validateConfig(cfg, source) {
  console.log('[cms-init] ' + source + ' config: backend=' + backendName + 
    ' repo=' + repo + ' branch=' + branch + ' collections(pre)=' + count);
}

function logCollectionsPostInit() {
  const result = getCollectionNames(); // from Redux store
  console.log('[cms-init] collections(post)=' + result.count + 
    ' collections: [' + result.names.join(', ') + ']');
  
  if (result.count === 0) {
    showCollectionsError(); // Visual banner
  }
}
```

### 5. **Enhanced Auth Detection** (`override-login.client.js`)

**Problem**: postMessage arrived before Redux store existed, or Redux auth state updated late.

**Solution**:
- Keep existing `scheduleAuthPoll()` (12 × 100ms = 1.2s)
- Check `state.auth.user` in Redux
- Check LS keys (`netlify-cms-user`, `decap-cms.user`)
- If no user after 1.2s but LS has token → one-time reload
- Added `subscribeToAuthOnce()` to log auth state when user appears

**Logging**:
```
[decap-oauth] received auth message
[auth] user present=true via <lsKey>
// OR (fallback)
[decap-oauth] Reloading to complete authentication...
```

### 6. **Script Load Order** (`index.html`)

**Verified**:
1. `window.CMS_MANUAL_INIT = true` (inline)
2. `decap-cms.js` (core bundle)
3. `js-yaml.min.js` (parser)
4. `config-loader.js` (module, init logic)
5. `override-login.client.js` (auth monitoring)

**Updated comment**: Line 21 changed from "new tab authentication" to "auth state monitoring and debug tools"

---

## File Changes

### Modified Files

1. **`apps/website/public/website-admin/config-loader.js`**  
   - Complete rewrite with 6 major sections
   - Added global error handlers
   - Robust readiness gate (`waitForCMSCore`, `waitForStore`)
   - Two-phase init with object → YAML fallback
   - Collection validation and visual error banner
   - ~230 lines (was ~115)

2. **`apps/website/public/website-admin/override-login.client.js`**  
   - Enhanced auth state detection
   - Added `subscribeToAuthOnce()` for single-use auth logging
   - Improved poll logging with LS key names
   - Better integration with config-loader
   - ~360 lines (was ~340)

3. **`apps/website/public/website-admin/index.html`**  
   - Updated comment on line 21 (cosmetic)
   - No structural changes (script order already correct)

4. **`apps/website/src/pages/api/website-admin/config.yml.ts`**  
   - Enhanced logging: always log collection names/folders
   - Added backend and repo summary line
   - Better structured console output
   - ~97 lines (was ~97, internal changes)

---

## Expected Console Output

### Successful Init Flow (Object Config Path)

```
[config.yml] base_url=https://example.com auth_endpoint=/api/decap/authorize collections.len=1
[config.yml] backend=github repo=owner/repo@main
[config.yml] collection[0]: name=posts folder=apps/website/src/content/posts
[cms] Using API-generated config from /api/website-admin/config.yml
[cms] Loaded config from /api/website-admin/config.yml
[cms-init] object config: backend=github repo=owner/repo branch=main collections(pre)=1
[cms-init] gate passed (core ready), calling CMS.init
[cms-init] store ready @127ms
[cms-init] object config accepted
[cms-init] collections(post)=1 collections: [posts]
[cms-init] initialization complete: method=object success=true
[decap-oauth] admin booted; CMS_MANUAL_INIT= true
```

### Fallback Flow (YAML Path)

```
[cms-init] object config: backend=github repo=owner/repo branch=main collections(pre)=1
[cms-init] gate passed (core ready), calling CMS.init
[cms-init] store ready @94ms
[cms-init] object config failed validation, trying YAML fallback
[cms-init] retrying with YAML string config
[cms-init] store ready @186ms
[cms-init] YAML config accepted (fallback)
[cms-init] collections(post)=1 collections: [posts]
[cms-init] initialization complete: method=yaml success=true
```

### OAuth Login Flow

```
[decap-oauth] received auth message
[auth] user present=true via netlify-cms-user
```

OR (with reload fallback):

```
[decap-oauth] received auth message
[decap-oauth] Reloading to complete authentication...
```

### Collection Error (Zero Collections)

```
[config.yml] WARNING: collections.len=0 - CMS will not initialize!
[cms-init] WARNING: collections(pre)=0 - CMS may fail to initialize
[cms-init] collections(post)=0 - CMS failed to load collections
```

Plus visual banner:
```
⚠️ CMS failed to load collections — check config.yml (paths/fields)
```

---

## Debug Mode

Enable with:
```javascript
localStorage.setItem('DECAP_OAUTH_DEBUG', '1');
location.reload();
```

Additional logs:
- Network taps (fetch timing)
- Redux store subscription details
- Config summary before init
- Detailed auth state transitions

Debug toolbox:
```javascript
__DECAP_DEBUG__.dump();      // Full state dump
__DECAP_DEBUG__.simulate();  // Fake auth message
__DECAP_DEBUG__.clearAuth(); // Clear tokens + reload
```

---

## Breaking Changes

**None**. All changes are additive or internal refactors.

---

## Migration Guide

**No action required**. Changes are backwards-compatible.

If you had custom config-loader or override-login scripts, merge the following:
1. Global error handlers (top of config-loader)
2. `waitForCMSCore()` + `waitForStore()` logic
3. Two-phase init pattern in `initCMS()`
4. Collection validation helpers

---

## Testing Checklist

✅ **Load /website-admin/#/ with clean cache**  
   Expect: `[cms-init] gate passed ... object config accepted ... collections(post)=N>0`

✅ **Click "Login with GitHub", complete OAuth**  
   Expect: `[auth] user present=true via <lsKey>` OR one-time reload

✅ **No extra tabs/windows opened**  
   Popup flow only

✅ **No raw tokens in console**  
   Only masked tokens (`gho_****...`)

✅ **If collections=0 (simulated)**  
   Expect: WARNING logs + visual banner

✅ **Debug mode enabled**  
   Expect: detailed logging, network taps, `__DECAP_DEBUG__` toolbox

---

## Known Limitations

1. **YAML fallback adds ~100-200ms latency** if object config fails (acceptable tradeoff)
2. **One-time reload** may trigger in rare edge cases (browser tab suspension during OAuth)
3. **Visual error banner** is non-blocking but persistent (requires manual refresh to clear)

---

## Future Enhancements

- [ ] Add retry logic for config fetch failures (network errors)
- [ ] Store init method in LS to track success rate
- [ ] Add Sentry/logging integration for production error tracking
- [ ] Make reload timeout configurable via URL param

---

## Authors

- Implementation: AI Assistant
- Review: User
- Date: 2025-10-10

---

## Related Issues

- Decap CMS Core: https://github.com/decaporg/decap-cms/issues
- Related: Race condition between manual init and core boot
- Related: Immutable config validation pickiness
- Related: postMessage timing vs Redux store hydration

