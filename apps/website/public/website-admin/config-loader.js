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
// PART 1: Block static config.yml files (prevent duplicates)
// ============================================================================
// NOTE: Blocker disabled - was too aggressive and blocked internal Decap operations
// We rely on load_config_file: false to prevent auto-loading
// (function hardBlockDefaultConfig() {
//   const orig = window.fetch;
//   window.fetch = function(url, opts) {
//     try {
//       const str = typeof url === 'string' ? url : (url?.url || '');
//       // Block all static config.yml files, but allow API endpoint
//       if (str.includes('config.yml') && !str.includes('/api/')) {
//         console.warn('[cms] Blocked fetch to static config.yml:', str);
//         return Promise.resolve(new Response('', { status: 404 }));
//       }
//     } catch {}
//     return orig.apply(this, arguments);
//   };
// })();

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
function waitForCMSCore(timeoutMs = 10000, stepMs = 50) {
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

function waitForStore(maxWaitMs = 2000, stepMs = 50) {
  return new Promise((resolve) => {
    const t0 = Date.now();
    const id = setInterval(() => {
      try {
        const store = window.CMS && window.CMS.store;
        if (store && typeof store.getState === 'function') {
          clearInterval(id);
          const elapsed = Date.now() - t0;
          console.log('[cms-init] store ready @' + elapsed + 'ms');
          resolve({ success: true, elapsed });
          return;
        }
      } catch (e) {}
      
      if (Date.now() - t0 > maxWaitMs) {
        clearInterval(id);
        console.error('[cms-init] store not ready after ' + maxWaitMs + 'ms');
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
// PART 5: Single-phase init with extended store timeout
// ============================================================================
async function initCMS(config, rawYaml) {
  const collectionsPreValidate = validateConfig(config, 'object');
  
  console.log('[cms-init] gate passed (core ready), calling CMS.init');
  
  try {
    // Initialize with object config
    window.CMS.init({
      load_config_file: false,
      config: config,
    });
    
    // Wait for store to appear (extended timeout for slower systems)
    const storeResult = await waitForStore(2000, 50);
    
    if (storeResult.success) {
      // Check if config was accepted and collections loaded
      const storeCollections = getCollectionNames();
      
      if (storeCollections && storeCollections.count > 0) {
        console.log('[cms-init] config accepted, collections loaded successfully');
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
      // Store not ready after 2s - initialization failed
      console.error('[cms-init] Store not ready after 2000ms');
      console.error('[cms-init] Check console above for CMS initialization errors');
      console.error('[cms-init] Config object:', config);
      return { success: false, method: 'store-timeout' };
    }
    
  } catch (e) {
    console.error('[cms-init] CMS.init threw error:', e);
    console.error('[cms-init] Error details:', e.message, e.stack);
    return { success: false, method: 'error', error: e };
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
      console.error('[cms-init] Initialization failed. Check errors above.');
      console.error('[cms-init] Config object structure:', Object.keys(cfg));
      console.error('[cms-init] Backend:', cfg.backend);
      console.error('[cms-init] Collections:', cfg.collections?.length || 0);
    }
    
  } catch (e) {
    console.error('[cms] init failed:', e);
    console.error('[cms] Error stack:', e.stack);
  }
})();
