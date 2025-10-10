// /public/website-admin/config-loader.js
// Hardened Decap CMS initialization with YAML-first path and fetch guards

// ============================================================================
// PART 1: Global error handlers
// ============================================================================
window.addEventListener('error', (e) => {
  console.error('[cms] onerror:', e.error || e.message);
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('[cms] unhandledrejection:', e.reason);
});

// ============================================================================
// PART 1.5: Fetch guard to prevent static config.yml fetches
// ============================================================================
(function installFetchGuard() {
  const originalFetch = window.fetch;
  const configYmlPattern = /(^|\/)([a-z]{2}\/)?config\.yml(\?.*)?$/i;
  const allowedConfigUrl = '/api/website-admin/config.yml';
  
  window.fetch = function(input, init) {
    const url = typeof input === 'string' ? input : input.url;
    
    // Block any config.yml requests EXCEPT our API endpoint
    if (configYmlPattern.test(url) && !url.includes(allowedConfigUrl)) {
      console.warn('[cms] fetch guard blocked:', url);
      // Return a 404 response immediately
      return Promise.resolve(new Response('', { 
        status: 404, 
        statusText: 'Blocked by fetch guard' 
      }));
    }
    
    return originalFetch.apply(this, arguments);
  };
})();

// ============================================================================
// PART 2: Wait for CMS core to load
// ============================================================================
function waitForCMSCore(timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const checkCMS = setInterval(() => {
      if (window.CMS && typeof window.CMS.init === 'function') {
        clearInterval(checkCMS);
        console.log('[cms] Core loaded in', Date.now() - startTime, 'ms');
        resolve();
      } else if (Date.now() - startTime > timeoutMs) {
        clearInterval(checkCMS);
        reject(new Error('CMS core not loaded in time'));
      }
    }, 50);
  });
}

// ============================================================================
// PART 3: Wait for Redux store to initialize
// ============================================================================
function waitForStore(timeoutMs = 5000) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const checkStore = setInterval(() => {
      const store = window.CMS?.store;
      
      if (store && typeof store.getState === 'function') {
        clearInterval(checkStore);
        const elapsed = Date.now() - startTime;
        console.log('[cms] Store ready in', elapsed, 'ms');
        resolve(true);
      } else if (Date.now() - startTime > timeoutMs) {
        clearInterval(checkStore);
        console.error('[cms] Store not ready after', timeoutMs, 'ms');
        resolve(false);
      }
    }, 50);
  });
}

// ============================================================================
// PART 4: Load config from API (YAML string + parsed for logging)
// ============================================================================
async function loadConfig() {
  const configUrl = '/api/website-admin/config.yml';
  
  try {
    const response = await fetch(configUrl + '?t=' + Date.now(), { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Config fetch failed: ${response.status}`);
    }
    
    // Keep exact YAML text for init (no trimming, no modification)
    const rawYaml = await response.text();
    
    // Parse YAML to object for validation and logging only
    const cfg = window.jsyaml ? window.jsyaml.load(rawYaml) : null;
    
    if (!cfg) {
      throw new Error('js-yaml not available or config is empty');
    }
    
    const collections = cfg.collections?.length || 0;
    console.log('[cms] Loaded config from /api/website-admin/config.yml');
    console.log('[cms] Config: backend=' + cfg.backend?.name + ' collections=' + collections);
    
    if (collections === 0) {
      console.warn('[cms] WARNING: No collections in config');
    }
    
    return { rawYaml, cfg };
  } catch (error) {
    console.error('[cms] Failed to load config:', error);
    throw error;
  }
}

// ============================================================================
// PART 5: Initialize CMS (YAML string primary, object fallback)
// ============================================================================
async function initCMS(rawYaml, cfg) {
  console.log('[cms-init] calling CMS.init (yaml)');
  
  try {
    // PRIMARY PATH: Initialize with YAML string
    window.CMS.init({ config: rawYaml });
    
    // Wait for store to be created
    const storeReady = await waitForStore(3000);
    
    if (storeReady) {
      console.log('[cms-init] YAML config accepted');
      
      // Log collections from store
      setTimeout(() => {
        try {
          const state = window.CMS.store?.getState?.();
          const collections = state?.config?.get?.('collections');
          
          if (collections) {
            const count = collections.size || collections.length || 0;
            const names = collections.toJS ? collections.toJS().map(c => c.name) : [];
            console.log('[cms-init] collections(post)=' + count + ' collections: [' + names.join(', ') + ']');
          }
        } catch (e) {
          console.warn('[cms] Could not read collections from store:', e.message);
        }
      }, 500);
      
      return true;
    } else {
      // FALLBACK PATH: Try object config if YAML didn't work
      console.warn('[cms-init] YAML path failed, trying object config (fallback)');
      
      window.CMS.init({
        load_config_file: false,
        config: cfg
      });
      
      const storeReadyFallback = await waitForStore(3000);
      
      if (storeReadyFallback) {
        console.log('[cms-init] object config accepted (fallback)');
        
        // Log collections from store
        setTimeout(() => {
          try {
            const state = window.CMS.store?.getState?.();
            const collections = state?.config?.get?.('collections');
            
            if (collections) {
              const count = collections.size || collections.length || 0;
              const names = collections.toJS ? collections.toJS().map(c => c.name) : [];
              console.log('[cms-init] collections(post)=' + count + ' collections: [' + names.join(', ') + ']');
            }
          } catch (e) {
            console.warn('[cms] Could not read collections from store:', e.message);
          }
        }, 500);
        
        return true;
      }
      
      console.error('[cms] ❌ Both YAML and object init failed');
      return false;
    }
    
  } catch (error) {
    console.error('[cms] ❌ Initialization error:', error);
    return false;
  }
}

// ============================================================================
// PART 6: Main flow
// ============================================================================
(async () => {
  try {
    console.log('[cms] Starting initialization...');
    
    // Step 1: Wait for CMS core to load
    await waitForCMSCore();
    
    // Step 2: Load config from API (YAML + parsed)
    const { rawYaml, cfg } = await loadConfig();
    
    // Step 3: Initialize CMS (YAML primary, object fallback)
    const success = await initCMS(rawYaml, cfg);
    
    if (!success) {
      console.error('[cms] Initialization failed - check errors above');
    }
    
  } catch (error) {
    console.error('[cms] Fatal error:', error);
    alert('CMS failed to initialize. Check console for details.');
  }
})();
