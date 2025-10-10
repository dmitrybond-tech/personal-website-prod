# Decap CMS — Surgical Fix for Config Initialization

**Date**: October 10, 2025  
**Issue**: YAML fallback causing schema errors, store timeout too short  
**Root Cause**: String config treated as file path by Decap, not YAML content

---

## Problem Analysis

From your console output, the issue was clear:

```
[cms-init] store not ready after 500ms
[cms-init] store not ready after object config, trying YAML fallback
[cms-init] retrying with YAML string config
[cms] Blocked fetch to static config.yml: config.yml  ← PROBLEM
Config Errors (5) [{…}, {…}, {…}, {…}, {…}]
Error: config must have required property 'media_folder'
config must have required property 'media_library'
config must have required property 'backend'
config must have required property 'collections'
```

### Root Cause

When calling `CMS.init({ config: rawYamlString })`, Decap interprets the string as a **file path**, not YAML content. This causes:

1. Decap tries to fetch `"config.yml"` (the string value)
2. Our fetch blocker intercepts it
3. Decap receives empty response
4. Schema validation fails (no fields present)

### Why Object Config Wasn't Working

The object config was fine (`collections(pre)=1`), but the store timeout was too short (500ms). On some systems/browsers, Decap needs more time to initialize its Redux store.

---

## Surgical Fixes Applied

### File: `apps/website/public/website-admin/config-loader.js`

### Change 1: Removed YAML Fallback (Lines ~198-245)

**Before**: Two-phase init (object → YAML string fallback)  
**After**: Single-phase init with extended timeout

**Reason**: YAML fallback fundamentally can't work - strings are interpreted as URLs

```javascript
// REMOVED: Phase B YAML fallback
// This was causing the "fetch config.yml" error

// KEPT: Single object config init with better timeout
```

### Change 2: Increased Store Timeout (Line 97, 214)

**Before**: `waitForStore(500, 50)` - 500ms timeout  
**After**: `waitForStore(2000, 50)` - 2000ms timeout

**Reason**: Decap's Redux store can take 500-1500ms to initialize on some systems

```javascript
// Default changed from 3000ms to 2000ms (reasonable middle ground)
function waitForStore(maxWaitMs = 2000, stepMs = 50) {
  // ... polls for store.getState() every 50ms up to 2000ms
}
```

### Change 3: Enhanced Error Logging (Lines 201-244)

Added detailed error messages for debugging:

```javascript
if (storeResult.success) {
  if (storeCollections && storeCollections.count > 0) {
    // SUCCESS path
  } else {
    // New: Log config object when no collections found
    console.error('[cms-init] Config passed to CMS.init:', config);
  }
} else {
  // New: Better timeout error with config dump
  console.error('[cms-init] Store not ready after 2000ms');
  console.error('[cms-init] Config object:', config);
}
```

### Change 4: Main Flow Error Context (Lines 276-281)

Added post-init error summary:

```javascript
if (!result.success) {
  console.error('[cms-init] Config object structure:', Object.keys(cfg));
  console.error('[cms-init] Backend:', cfg.backend);
  console.error('[cms-init] Collections:', cfg.collections?.length || 0);
}
```

---

## What Changed (Summary)

| Component | Before | After |
|-----------|--------|-------|
| **Init strategy** | Two-phase (object + YAML) | Single-phase (object only) |
| **Store timeout** | 500ms | 2000ms |
| **YAML fallback** | Attempted | Removed (doesn't work) |
| **Error logging** | Basic | Detailed with config dump |
| **Failure reasons** | Generic "failed" | Specific: no-collections, store-timeout, error |

---

## Expected Console Output

### Success Case (Now Expected)

```
[cms] Loaded config from /api/website-admin/config.yml
[cms-init] object config: backend=github repo=dmitrybond-tech/personal-website-pre-prod branch=main collections(pre)=1
[cms-init] gate passed (core ready), calling CMS.init
[cms-init] store ready @847ms  ← Takes longer than 500ms
[cms-init] config accepted, collections loaded successfully
[cms-init] collections(post)=1 collections: [posts]
[cms-init] initialization complete: method=object success=true
```

### Failure Case (With Details)

If it still fails, you'll see:

```
[cms-init] store not ready after 2000ms
[cms-init] Check console above for CMS initialization errors
[cms-init] Config object: {backend: {...}, media_folder: "...", ...}
[cms-init] initialization complete: method=store-timeout success=false
[cms-init] Initialization failed. Check errors above.
[cms-init] Config object structure: ["backend", "publish_mode", "media_folder", ...]
[cms-init] Backend: {name: "github", repo: "...", ...}
[cms-init] Collections: 1
```

This will show us **exactly** what config Decap received and why it failed.

---

## Why This Should Work

1. **Object config is valid** - You saw `collections(pre)=1` in logs
2. **Extended timeout** - 2000ms gives Decap enough time on slow systems
3. **No YAML fallback** - Removed the source of schema errors
4. **Better diagnostics** - Will show exactly what failed if it doesn't work

---

## Next Steps

### 1. Test the Fix

Reload `/website-admin/#/` with hard refresh (Ctrl+Shift+R)

**Expected**:
- Store appears within 2000ms
- Collections(post)=1
- CMS UI loads

### 2. If Still Failing

Check the detailed error logs:
- Is the store appearing? (look for "store ready @Xms")
- What does the config object look like? (check error dump)
- Are there CMS errors above the init logs?

### 3. Debug Commands

Run in browser console:

```javascript
// Check current config
console.log(window.__CMS_CONFIG__);

// Check if store exists
console.log(window.CMS.store);

// Check store state
if (window.CMS.store) {
  console.log(window.CMS.store.getState().toJS());
}
```

---

## Files Modified

- ✅ `apps/website/public/website-admin/config-loader.js`
  - Removed YAML fallback (lines ~230-250)
  - Increased store timeout to 2000ms
  - Enhanced error logging throughout
  - Added failure diagnostics

**Lines changed**: ~50 lines (mostly in `initCMS` function)  
**Breaking changes**: None  
**Linter errors**: None

---

## Rollback Plan

If this doesn't work, we can:

1. Increase timeout further (to 5000ms)
2. Add more detailed CMS internal state logging
3. Try a different init approach (defer, requestIdleCallback)
4. Check if there's a Decap version issue

---

## Summary

**Problem**: YAML fallback treated string as file path → fetch error → schema validation failure  
**Root Cause**: Decap interprets string configs as URLs, not YAML content  
**Solution**: Remove YAML fallback, increase store timeout, enhance error logging  
**Expected Outcome**: Object config succeeds within 2000ms with clear error messages if it fails

**Status**: ✅ Fixes applied, ready for testing

---

**Author**: AI Assistant  
**Date**: October 10, 2025  
**Type**: Surgical fix (minimal, targeted changes)

