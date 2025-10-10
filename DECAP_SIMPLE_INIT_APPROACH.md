# Decap CMS — Simplified Init Approach

## Why the Change?

Initial implementation attempted to use YAML string as primary init path:
```javascript
CMS.init({ config: rawYamlString });
```

However, testing revealed that Decap CMS 3.8.4/3.9.0 doesn't reliably handle YAML string config:
- Still attempts to fetch `config.yml` even with `CMS_MANUAL_INIT = true`
- Config validation errors: `config must have required property 'media_folder'`
- Store initialization failures

## Simplified Approach

**Single, reliable path: Object config with explicit `load_config_file: false`**

```javascript
// 1. Fetch YAML from API
const response = await fetch('/api/website-admin/config.yml?t=' + Date.now());
const yamlText = await response.text();

// 2. Parse to JavaScript object
const config = window.jsyaml.load(yamlText);

// 3. Validate required fields
const required = ['backend', 'media_folder', 'collections'];
for (const field of required) {
  if (!config[field]) {
    throw new Error(`Config missing required field: ${field}`);
  }
}

// 4. Initialize with object config (ONLY path)
window.CMS.init({
  load_config_file: false,  // Critical: explicitly disable file loading
  config: config             // Pass parsed object
});
```

## What Makes This Work

### 1. Fetch Guard (Defense in Depth)
```javascript
const originalFetch = window.fetch;
window.fetch = function(input, init) {
  const url = typeof input === 'string' ? input : input.url;
  const configYmlPattern = /(^|\/)([a-z]{2}\/)?config\.yml(\?.*)?$/i;
  
  if (configYmlPattern.test(url) && !url.includes('/api/website-admin/config.yml')) {
    console.warn('[cms] fetch guard blocked:', url);
    return Promise.resolve(new Response('', { status: 404 }));
  }
  
  return originalFetch.apply(this, arguments);
};
```

**Blocks:**
- `/config.yml`
- `/en/config.yml`
- `/ru/config.yml`
- Any locale-prefixed variant

**Allows:**
- `/api/website-admin/config.yml` only

### 2. No Static Files
Deleted `apps/website/public/website-admin/config.yml` to eliminate any ambiguity.

### 3. Client-Side Validation
Validate required fields before passing to `CMS.init()` to catch config issues early:
```javascript
const required = ['backend', 'media_folder', 'collections'];
for (const field of required) {
  if (!config[field]) {
    throw new Error(`Config missing required field: ${field}`);
  }
}
```

### 4. Explicit `load_config_file: false`
This is **critical** — tells Decap to skip internal config fetch logic entirely.

## Benefits of Simpler Approach

✅ **Single code path** — no fallback complexity, easier to debug  
✅ **Predictable behavior** — same init logic every time  
✅ **Better error messages** — client-side validation catches issues immediately  
✅ **More compatible** — object config works reliably across Decap versions  
✅ **Easier to maintain** — fewer moving parts, clearer intent

## Expected Console Output

```
[cms] Starting initialization...
[cms] Core loaded in 51 ms
[cms] Loaded config from /api/website-admin/config.yml
[cms] Config: backend=github collections=1
[cms-init] Calling CMS.init...
[cms-init] CMS.init called, waiting for store...
[cms] Store ready in 156 ms
[cms-init] ✅ Store ready
[cms-init] collections(post)=1 collections: [posts]
```

## If Fetch Guard Triggers

```
[cms] fetch guard blocked: config.yml
```

This means Decap tried to fetch a static config file. The guard blocks it and returns 404, preventing the request. This is expected when Decap's internal logic attempts a default fetch — our guard stops it safely.

## Key Differences from YAML String Approach

| Aspect | YAML String | Object Config |
|--------|-------------|---------------|
| Init call | `CMS.init({ config: yamlString })` | `CMS.init({ load_config_file: false, config: obj })` |
| Parsing | Decap parses internally | We parse with js-yaml |
| Validation | Internal, opaque errors | Client-side, clear errors |
| Compatibility | Inconsistent across versions | Reliable |
| Complexity | Required fallback logic | Single path |
| Debugging | Harder (internal errors) | Easier (explicit flow) |

## Why YAML String Failed

When passing a YAML string to `CMS.init({ config: yamlString })`, Decap CMS:
1. Attempts to parse the string internally
2. May still trigger default config fetch logic as a side effect
3. Doesn't properly set `load_config_file: false` internally
4. Results in validation errors and store init failures

The object config approach with **explicit** `load_config_file: false` bypasses these internal code paths entirely.

## Recommendation

✅ **Use this simple object config approach** for all Decap CMS 3.x deployments  
✅ **Keep fetch guard** as defense-in-depth protection  
✅ **No static config files** in public directories  
✅ **Client-side validation** before passing to CMS.init

This combination provides the most reliable, maintainable init flow.

---

**Date:** October 10, 2025  
**Status:** ✅ Production-Ready  
**Tested with:** Decap CMS 3.8.4, 3.9.0

