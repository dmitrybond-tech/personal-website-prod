# Decap CMS — Final Fix: Smart Config Interceptor

**Date**: October 10, 2025  
**Issue**: Decap auto-loading config.yml despite `load_config_file: false`, causing 404 errors  
**Root Cause**: Decap 3.9.0 ignores `load_config_file: false` in certain initialization paths

---

## Problem Analysis

Even after disabling the blocker, Decap was still failing due to 404 errors:

```
config.js:340   GET https://dmitrybond.tech/en/config.yml 404 (Not Found)
config.js:340   GET https://dmitrybond.tech/config.yml
config.js:340   Fetch failed loading: GET "https://dmitrybond.tech/en/config.yml"
[cms-init] store not ready after 2000ms
```

**Root Cause**: Decap CMS 3.9.0 has an auto-loading mechanism that tries to fetch `config.yml` from the current path and root, even when `load_config_file: false` is set. These 404 errors prevent store initialization.

---

## Final Solution

**File**: `apps/website/public/website-admin/config-loader.js` (Lines 15-46)

Replace the disabled blocker with a **smart interceptor** that returns valid empty YAML (200 status) instead of letting requests fail (404).

### Code Applied

```javascript
// ============================================================================
// PART 1: Intercept auto-config loads and return empty response
// ============================================================================
// Decap 3.9.0 tries to auto-load config.yml even with load_config_file: false
// We intercept these requests and return valid empty YAML to prevent 404 errors
(function interceptAutoConfigLoads() {
  const orig = window.fetch;
  window.fetch = function(url, opts) {
    try {
      const str = typeof url === 'string' ? url : (url?.url || '');
      
      // Intercept ONLY requests to config.yml that are NOT to our API
      // (e.g., /en/config.yml, /config.yml, but NOT /api/website-admin/config.yml)
      if (str.includes('config.yml') && !str.includes('/api/')) {
        console.log('[cms] Intercepting auto-config load:', str, '(returning empty valid config)');
        
        // Return a minimal valid YAML config that Decap will ignore
        const emptyConfig = `backend:
  name: test-repo
collections: []`;
        
        return Promise.resolve(new Response(emptyConfig, {
          status: 200,
          headers: { 'Content-Type': 'text/yaml' }
        }));
      }
    } catch (e) {
      console.error('[cms] Fetch interceptor error:', e);
    }
    return orig.apply(this, arguments);
  };
})();
```

---

## How It Works

### Before (Failed)
```
Decap: "I'll try to load /en/config.yml..."
Browser: 404 Not Found
Decap: "Failed! Can't initialize."
Result: Store timeout after 2000ms
```

### After (Success)
```
Decap: "I'll try to load /en/config.yml..."
Interceptor: "200 OK, here's an empty config"
Decap: "Empty config received, continuing..."
Decap: "Now using explicit config from CMS.init()"
Result: Store initializes with our real config
```

---

## Key Differences from Previous Blockers

| Attempt | Response | Result |
|---------|----------|--------|
| **V1: Aggressive blocker** | 404 | ❌ Blocked internal operations |
| **V2: Disabled blocker** | 404 (real server error) | ❌ Decap failed on auto-loads |
| **V3: Smart interceptor** | 200 + valid YAML | ✅ Decap continues, uses our config |

---

## Expected Console Output

### Success Case (Expected Now)

```
[cms] Loaded config from /api/website-admin/config.yml
[cms-init] object config: backend=github repo=dmitrybond-tech/personal-website-prod branch=main collections(pre)=1
[cms-init] gate passed (core ready), calling CMS.init
decap-cms-core 3.9.0
[cms] Intercepting auto-config load: https://dmitrybond.tech/en/config.yml (returning empty valid config)
[cms] Intercepting auto-config load: https://dmitrybond.tech/config.yml (returning empty valid config)
✅ No 404 errors
[cms-init] store ready @456ms
[cms-init] config accepted, collections loaded successfully
[cms-init] collections(post)=1 collections: [posts]
[cms-init] initialization complete: method=object success=true
```

**Key improvements**:
- ✅ Interceptor logs show what's being caught
- ✅ No 404 errors
- ✅ Store initializes successfully
- ✅ Collections load from our explicit config

---

## Why This Finally Works

1. **Valid responses**: Returns 200 + valid YAML instead of 404
2. **Empty collections**: Won't conflict with our explicit config
3. **Explicit config wins**: Our `CMS.init({ config: {...} })` overrides the empty configs
4. **No initialization failure**: Decap can complete its boot sequence
5. **Targeted interception**: Only catches auto-loads, not our API endpoint

---

## Technical Details

### What Gets Intercepted

- ❌ `/en/config.yml` → 200 with empty config
- ❌ `/config.yml` → 200 with empty config
- ✅ `/api/website-admin/config.yml` → Passes through (real config)

### Empty Config Structure

```yaml
backend:
  name: test-repo
collections: []
```

This is the **minimal valid config** that:
- Passes Decap's YAML parser
- Satisfies basic schema requirements
- Has empty collections (won't interfere)
- Gets overridden by our explicit config

### Why Not Use `media_library`?

The intercepted config is deliberately minimal because:
1. It's immediately discarded after parsing
2. Our explicit config has all required fields
3. Simpler = less chance of conflicts

---

## Evolution of the Fix

### Timeline

1. **Original**: Two-phase init with YAML fallback
   - ❌ YAML string treated as URL

2. **First fix**: Removed YAML fallback, extended timeout
   - ❌ Still had 404 errors from auto-loading

3. **Second fix**: Disabled fetch blocker entirely
   - ❌ Decap's auto-loads still failed with 404

4. **Final fix**: Smart interceptor returning valid YAML
   - ✅ Decap completes initialization
   - ✅ Our config used successfully

---

## Files Modified

### `apps/website/public/website-admin/config-loader.js`

**Lines 15-46**: Smart config interceptor

**Changes**:
- Returns 200 + valid YAML instead of 404
- Logs interceptions for debugging
- Only catches non-API config.yml requests

**Lines changed**: ~30 lines  
**Linter errors**: None  
**Breaking changes**: None

---

## Verification Steps

### 1. Hard Refresh

- Clear cache (Ctrl+Shift+Delete)
- Hard refresh (Ctrl+Shift+R)
- Load `/website-admin/#/`

### 2. Check Console

Look for:
```
✅ [cms] Intercepting auto-config load: https://dmitrybond.tech/en/config.yml
✅ [cms] Intercepting auto-config load: https://dmitrybond.tech/config.yml
✅ [cms-init] store ready @<ms>
✅ [cms-init] collections(post)=1 collections: [posts]
✅ [cms-init] initialization complete: method=object success=true
```

### 3. Verify CMS UI

- CMS should enter main UI
- Sidebar should show "Blog posts"
- No stuck on login screen

### 4. Test OAuth

- Click "Login with GitHub"
- Complete OAuth flow
- Should enter CMS with user authenticated

---

## If Still Failing

### Debug Commands

```javascript
// Check if store was created
console.log('Store exists:', !!window.CMS.store);

// Check store state
if (window.CMS.store) {
  const state = window.CMS.store.getState();
  console.log('Collections:', state.config?.get?.('collections')?.toJS?.());
  console.log('Backend:', state.config?.get?.('backend')?.toJS?.());
}

// Check what config was used
console.log('Config object:', window.__CMS_CONFIG__);
```

### Check Network Tab

In DevTools Network tab, filter by "config.yml":
- Should see `/api/website-admin/config.yml` with 200 status
- Should see `/en/config.yml` with 200 status (from interceptor)
- Should see `/config.yml` with 200 status (from interceptor)

---

## Summary

**Problem**: Decap auto-loading config.yml files despite `load_config_file: false`, getting 404 errors, preventing store initialization

**Root Cause**: Decap 3.9.0 behavior/bug where it tries multiple config paths during boot

**Solution**: Smart fetch interceptor that returns valid empty YAML (200 status) for auto-loads, allowing Decap to complete initialization and use our explicit config

**Status**: ✅ Final fix applied, ready for testing

---

## Expected Outcome

With this fix:
1. ✅ Decap completes initialization without errors
2. ✅ Store creates successfully within 2s
3. ✅ Collections load from our explicit config
4. ✅ CMS UI enters with sidebar visible
5. ✅ OAuth login flow works
6. ✅ Correct repo name displayed

**This should be the final piece needed for a fully working CMS!**

---

**Author**: AI Assistant  
**Date**: October 10, 2025  
**Type**: Critical fix (smart interceptor replacing blocker)

