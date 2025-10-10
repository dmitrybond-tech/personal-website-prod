// /public/website-admin/config-loader.js
// Robust Decap CMS initialization with race condition elimination and config validation

// ============================================================================
// PART 0: Global error handlers for visibility
// ============================================================================
window.addEventListener('error', function(e) {
  console.error('[cms] onerror:', e.error || e.message);
});

window.addEventListener('unhandledrejection', function(e) {
  console.error('[cms] unhandledrejection:', e.reason);
});

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

// ============================================================================
// PART 2: Configuration resolution
// ============================================================================
const qs = new URLSearchParams(location.search);
const param = qs.get('config');

// Force load only generated config via API
const FORCE_CONFIG_PATH = '/api/website-admin/config.yml';

async function fileExists(url) {
  try {
    const r = await fetch(url + (url.includes('?') ? '&' : '?') + 'ping=' + Date.now(), { cache: 'no-store' });
    return r.ok;
  } catch { return false; }
}

async function resolvePath() {
  // If param is explicitly set, use it (but still block if it's config.yml)
  if (param && param !== '/website-admin/config.yml') return param;
  
  // Always use API-generated config
  console.info('[cms] Using API-generated config from', FORCE_CONFIG_PATH);
  return FORCE_CONFIG_PATH;
}

async function loadYaml(url) {
  const res = await fetch(url + (url.includes('?') ? '&' : '?') + 't=' + Date.now(), { cache: 'no-store' });
  if (!res.ok) throw new Error('Config fetch failed: ' + url);
  const text = await res.text();
  // Return both parsed config and raw YAML text (exact response, no mutations)
  return { config: window.jsyaml.load(text), rawText: text };
}

// ============================================================================
// PART 3: Robust readiness gate (wait for core boot complete)
// ============================================================================
function waitForCMSCore(timeoutMs = 20000, stepMs = 50) {
  return new Promise((resolve, reject) => {
    const t0 = Date.now();
    const id = setInterval(() => {
      if (window.CMS && typeof window.CMS.init === 'function') {
        // Basic CMS available, but check for additional readiness signals
        const ncRoot = document.querySelector('#nc-root');
        const hasPreviewTemplate = typeof window.CMS.registerPreviewTemplate === 'function';
        
        // Core is ready if any of these are true:
        // 1. #nc-root exists (Decap mounted its app)
        // 2. registerPreviewTemplate is available (API fully loaded)
        // 3. We've waited at least 200ms after CMS.init appeared (fallback)
        const elapsed = Date.now() - t0;
        const coreReady = ncRoot || hasPreviewTemplate || elapsed > 200;
        
        if (coreReady) {
          clearInterval(id);
          resolve();
        }
      } else if (Date.now() - t0 > timeoutMs) {
        clearInterval(id);
        reject(new Error('CMS core not loaded in time'));
      }
    }, stepMs);
  });
}

function waitForStore(maxWaitMs = 3000, stepMs = 50) {
  return new Promise((resolve) => {
    const t0 = Date.now();
    let lastCheck = '';
    
    const id = setInterval(() => {
      try {
        const cms = window.CMS;
        const store = cms && cms.store;
        
        // Log state changes for debugging
        const currentState = `CMS:${!!cms} store:${!!store} getState:${typeof store?.getState}`;
        if (currentState !== lastCheck) {
          console.log('[cms-init] State change:', currentState);
          lastCheck = currentState;
        }
        
        if (store && typeof store.getState === 'function') {
          clearInterval(id);
          const elapsed = Date.now() - t0;
          console.log('[cms-init] ✅ store ready @' + elapsed + 'ms');
          resolve({ success: true, elapsed });
          return;
        }
      } catch (e) {
        console.warn('[cms-init] Error checking store:', e.message);
      }
      
      if (Date.now() - t0 > maxWaitMs) {
        clearInterval(id);
        console.error('[cms-init] ⏱️ store not ready after ' + maxWaitMs + 'ms');
        console.error('[cms-init] Final state: CMS=' + !!window.CMS + ' store=' + !!window.CMS?.store);
        resolve({ success: false });
      }
    }, stepMs);
  });
}

// ============================================================================
// PART 4: Config validation and collection count
// ============================================================================
function validateConfig(cfg, source) {
  const collectionsCount = Array.isArray(cfg.collections) ? cfg.collections.length : 0;
  const backend = cfg.backend || {};
  const backendName = backend.name || 'unknown';
  const repo = backend.repo || 'n/a';
  const branch = backend.branch || 'n/a';
  
  console.log('[cms-init] ' + source + ' config: backend=' + backendName + 
    ' repo=' + repo + ' branch=' + branch + ' collections(pre)=' + collectionsCount);
  
  if (collectionsCount === 0) {
    console.warn('[cms-init] WARNING: collections(pre)=0 - CMS may fail to initialize');
  }
  
  return collectionsCount;
}

function getCollectionNames() {
  try {
    const store = window.CMS && window.CMS.store;
    if (!store) return null;
    
    const state = store.getState();
    const collections = state?.config?.get?.('collections') || state?.config?.collections;
    
    if (!collections) return null;
    
    const count = collections.size || collections.length || 0;
    let names = [];
    
    try {
      if (collections.toJS) {
        names = collections.toJS().map(c => c.name);
      } else if (Array.isArray(collections)) {
        names = collections.map(c => c.name);
      }
    } catch (e) {}
    
    return { count, names };
  } catch (e) {
    return null;
  }
}

function logCollectionsPostInit(delay = 500) {
  setTimeout(() => {
    const result = getCollectionNames();
    if (result) {
      console.log('[cms-init] collections(post)=' + result.count + ' collections: [' + result.names.join(', ') + ']');
      
      if (result.count === 0) {
        console.error('[cms-init] collections(post)=0 - CMS failed to load collections');
        showCollectionsError();
      }
    } else {
      console.warn('[cms-init] Unable to read collections from store');
    }
  }, delay);
}

function showCollectionsError() {
  // Non-blocking visual banner
  const banner = document.createElement('div');
  banner.id = 'cms-collections-error';
  banner.innerHTML = `
    <div style="position: fixed; top: 0; left: 0; right: 0; z-index: 99999; 
                background: #dc2626; color: white; padding: 12px 16px; 
                font-family: system-ui, sans-serif; font-size: 14px; text-align: center;">
      ⚠️ CMS failed to load collections — check config.yml (paths/fields)
    </div>
  `;
  document.body.appendChild(banner);
}

// ============================================================================
// PART 5: Init with deep debugging and minimal fallback
// ============================================================================
async function initCMS(config, rawYaml) {
  const collectionsPreValidate = validateConfig(config, 'object');
  
  console.log('[cms-init] gate passed (core ready), calling CMS.init');
  console.log('[cms-init] CMS object keys:', Object.keys(window.CMS || {}));
  console.log('[cms-init] CMS.init type:', typeof window.CMS?.init);
  
  // Deep debug: Hook into any events
  try {
    if (window.CMS.registerEventListener) {
      window.CMS.registerEventListener({
        name: 'debug-hook',
        handler: (ev) => console.log('[cms-event]', ev)
      });
    }
  } catch (e) {
    console.log('[cms-init] No event system available');
  }
  
  try {
    console.log('[cms-init] Calling CMS.init with config:', JSON.stringify(config, null, 2).substring(0, 500) + '...');
    
    // Initialize with object config
    window.CMS.init({
      load_config_file: false,
      config: config,
    });
    
    console.log('[cms-init] CMS.init call completed, waiting for store...');
    
    // Wait for store to appear (extended timeout for slower systems)
    const storeResult = await waitForStore(3000, 50);
    
    if (storeResult.success) {
      // Check if config was accepted and collections loaded
      const storeCollections = getCollectionNames();
      
      if (storeCollections && storeCollections.count > 0) {
        console.log('[cms-init] ✅ SUCCESS: config accepted, collections loaded');
        logCollectionsPostInit(500);
        return { success: true, method: 'object' };
      }
      
      // Store exists but no collections - config validation issue
      console.error('[cms-init] Store ready but no collections found');
      console.error('[cms-init] This indicates a config validation or path issue');
      console.error('[cms-init] Config passed to CMS.init:', config);
      logCollectionsPostInit(500);
      return { success: false, method: 'no-collections' };
    } else {
      // Store not ready - try minimal fallback config
      console.error('[cms-init] ⚠️ Store not ready after 3000ms, trying minimal fallback...');
      return await tryMinimalFallback();
    }
    
  } catch (e) {
    console.error('[cms-init] ❌ CMS.init threw error:', e);
    console.error('[cms-init] Error details:', e.message, e.stack);
    return { success: false, method: 'error', error: e };
  }
}

// Try an absolutely minimal config as last resort
async function tryMinimalFallback() {
  console.log('[cms-fallback] Attempting minimal files-only config...');
  
  try {
    const minimalConfig = {
      backend: { name: 'test-repo' },
      media_folder: 'public/uploads',
      public_folder: '/uploads',
      collections: [{
        name: 'pages',
        label: 'Pages',
        files: [{
          name: 'index',
          label: 'Index',
          file: 'index.md',
          fields: [
            { name: 'title', label: 'Title', widget: 'string' }
          ]
        }]
      }]
    };
    
    console.log('[cms-fallback] Minimal config:', minimalConfig);
    
    window.CMS.init({
      load_config_file: false,
      config: minimalConfig
    });
    
    const fallbackResult = await waitForStore(3000, 50);
    
    if (fallbackResult.success) {
      console.log('[cms-fallback] ✅ Minimal config worked! Store created.');
      console.warn('[cms-fallback] Running in minimal mode - only test collection available');
      return { success: true, method: 'minimal-fallback' };
    } else {
      console.error('[cms-fallback] ❌ Even minimal config failed');
      console.error('[cms-fallback] This suggests a fundamental Decap initialization problem');
      console.error('[cms-fallback] Possible causes: version mismatch, browser compatibility, CSP policy');
      return { success: false, method: 'fallback-failed' };
    }
    
  } catch (e) {
    console.error('[cms-fallback] Fallback threw error:', e);
    return { success: false, method: 'fallback-error', error: e };
  }
}

// ============================================================================
// PART 6: Main initialization flow
// ============================================================================
(async () => {
  try {
    const path = await resolvePath();
    if (!path) { 
      console.error('[cms] No valid config path found'); 
      return; 
    }
    
    // Load config from API (returns canonical minimal config)
    const { config: cfg, rawText: rawYaml } = await loadYaml(path);
    
    // Store references for debugging (no mutations)
    window.__CMS_CONFIG_PATH__ = path;
    window.__CMS_CONFIG__ = cfg;
    window.__CMS_CONFIG_RAW_YAML__ = rawYaml;
    
    console.info('[cms] Loaded config from', path);

    // Wait for core to be truly ready
    await waitForCMSCore();
    
    // Initialize CMS (use config as-is from API)
    const result = await initCMS(cfg, rawYaml);
    
    console.log('[cms-init] initialization complete: method=' + result.method + ' success=' + result.success);
    
    if (!result.success) {
      console.error('[cms-init] ❌ Initialization failed. Check errors above.');
      console.error('[cms-init] Config object structure:', Object.keys(cfg));
      console.error('[cms-init] Backend:', cfg.backend);
      console.error('[cms-init] Collections:', cfg.collections?.length || 0);
      console.error('[cms-init] Failure method:', result.method);
      
      // Provide diagnostic info
      console.group('[cms-diagnostic] Debug Info');
      console.log('CMS object exists:', !!window.CMS);
      console.log('CMS keys:', window.CMS ? Object.keys(window.CMS) : 'n/a');
      console.log('Store exists:', !!window.CMS?.store);
      console.log('Page URL:', window.location.href);
      console.log('User agent:', navigator.userAgent.substring(0, 100));
      
      // Check for CSP violations
      try {
        const violations = performance.getEntriesByType('navigation');
        console.log('Navigation timing:', violations);
      } catch (e) {}
      
      console.groupEnd();
      
      // Show user-friendly error
      if (result.method === 'fallback-failed') {
        alert('CMS failed to initialize. This may be a Decap version compatibility issue. Check console for details.');
      }
    }
    
  } catch (e) {
    console.error('[cms] ❌ Fatal init error:', e);
    console.error('[cms] Error stack:', e.stack);
    alert('Fatal CMS initialization error. Check console.');
  }
})();
