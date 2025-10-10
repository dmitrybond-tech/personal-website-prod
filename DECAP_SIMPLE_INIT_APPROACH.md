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

### 1. Fetch Guard (Intercept & Serve)
```javascript
const originalFetch = window.fetch;
let cachedConfigResponse = null;

window.fetch = function(input, init) {
  const url = typeof input === 'string' ? input : input.url;
  const configYmlPattern = /(^|\/)([a-z]{2}\/)?config\.yml(\?.*)?$/i;
  
  // If Decap tries to fetch config.yml (NOT our API), serve cached config
  if (configYmlPattern.test(url) && !url.includes('/api/website-admin/config.yml')) {
    console.log('[cms] fetch guard intercepted:', url, '→ serving API config');
    
    if (cachedConfigResponse) {
      return Promise.resolve(new Response(cachedConfigResponse, {
        status: 200,
        headers: { 'Content-Type': 'text/yaml; charset=utf-8' }
      }));
    }
    
    // Proxy to API if no cache
    return originalFetch('/api/website-admin/config.yml?t=' + Date.now())
      .then(response => response.text())
      .then(yaml => {
        cachedConfigResponse = yaml;
        return new Response(yaml, { status: 200, headers: { 'Content-Type': 'text/yaml' } });
      });
  }
  
  return originalFetch.apply(this, arguments);
};
```

**Intercepts:**
- `/config.yml`
- `/en/config.yml`
- `/ru/config.yml`
- Any locale-prefixed variant

**Serves:**
- The same config from `/api/website-admin/config.yml` (cached)
- **Key:** Returns 200 with config content, not 404 block

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
[cms] fetch guard intercepted: config.yml → serving API config
```

This means Decap tried to fetch a static config file. The guard intercepts it and serves the same config from our API (cached). This is expected when Decap's internal logic attempts a default fetch — our guard serves the correct config seamlessly.

## Key Differences from YAML String Approach

| Aspect | YAML String | Object Config |
|--------|-------------|---------------|
| Init call | `CMS.init({ config: yamlString })` | `CMS.init({ load_config_file: false, config: obj })` |
| Parsing | Decap parses internally | We parse with js-yaml |
| Validation | Internal, opaque errors | Client-side, clear errors |
| Compatibility | Inconsistent across versions | Reliable |
| Complexity | Required fallback logic | Single path |
| Debugging | Harder (internal errors) | Easier (explicit flow) |

## Why YAML String Failed & Why Blocking with 404 Failed

**YAML String Approach:**
When passing a YAML string to `CMS.init({ config: yamlString })`, Decap CMS:
1. Attempts to parse the string internally
2. May still trigger default config fetch logic as a side effect
3. Doesn't properly set `load_config_file: false` internally
4. Results in validation errors and store init failures

**Blocking with 404 Approach:**
Even with `load_config_file: false` and object config, Decap CMS 3.9.0:
1. Still has internal code that fetches `config.yml` (from `config.js:340`)
2. When fetch guard returns 404, initialization fails
3. Store never gets created → "Store not ready after 5000ms"

**Working Solution:**
Object config with **fetch guard that serves** (not blocks):
1. We pass config object to `CMS.init({ load_config_file: false, config })`
2. Decap's internal code still tries to fetch `config.yml` (bug in 3.9.0)
3. Fetch guard intercepts and **serves the same config** (200 response)
4. Internal fetch succeeds → store initializes ✅

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

