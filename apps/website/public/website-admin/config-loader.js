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
// PART 1.5: Fetch guard - serve API config for any config.yml request
// ============================================================================
(function installFetchGuard() {
  const originalFetch = window.fetch;
  const configYmlPattern = /(^|\/)([a-z]{2}\/)?config\.yml(\?.*)?$/i;
  const allowedConfigUrl = '/api/website-admin/config.yml';
  
  // Cache the config response to serve to internal Decap fetches
  let cachedConfigResponse = null;
  
  window.fetch = function(input, init) {
    const url = typeof input === 'string' ? input : input.url;
    
    // If Decap tries to fetch config.yml (NOT our API), serve cached config
    if (configYmlPattern.test(url) && !url.includes(allowedConfigUrl)) {
      console.log('[cms] fetch guard intercepted:', url, '→ serving API config');
      
      // If we have cached config, return it
      if (cachedConfigResponse) {
        return Promise.resolve(new Response(cachedConfigResponse, {
          status: 200,
          headers: { 'Content-Type': 'text/yaml; charset=utf-8' }
        }));
      }
      
      // Otherwise, proxy to our API endpoint
      console.log('[cms] fetch guard: no cache, proxying to API');
      return originalFetch(allowedConfigUrl + '?t=' + Date.now(), { cache: 'no-store' })
        .then(function(response) {
          return response.text();
        })
        .then(function(yaml) {
          cachedConfigResponse = yaml;
          return new Response(yaml, {
            status: 200,
            headers: { 'Content-Type': 'text/yaml; charset=utf-8' }
          });
        });
    }
    
    // For our API endpoint, cache the response
    if (url.includes(allowedConfigUrl)) {
      return originalFetch.apply(this, arguments).then(function(response) {
        return response.clone().text().then(function(yaml) {
          cachedConfigResponse = yaml;
          return response;
        });
      });
    }
    
    return originalFetch.apply(this, arguments);
  };
  
  // Expose cache setter for manual config loading
  window.__setCachedConfig = function(yamlText) {
    cachedConfigResponse = yamlText;
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
// PART 4: Load config from API
// ============================================================================
async function loadConfig() {
  const configUrl = '/api/website-admin/config.yml';
  
  try {
    const response = await fetch(configUrl + '?t=' + Date.now(), { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Config fetch failed: ${response.status}`);
    }
    
    const yamlText = await response.text();
    
    // Cache for fetch guard (so internal Decap fetches get the same config)
    if (window.__setCachedConfig) {
      window.__setCachedConfig(yamlText);
    }
    
    if (!window.jsyaml) {
      throw new Error('js-yaml not available');
    }
    
    const config = window.jsyaml.load(yamlText);
    
    if (!config) {
      throw new Error('Config is empty');
    }
    
    // Validate required fields
    const required = ['backend', 'media_folder', 'collections'];
    for (const field of required) {
      if (!config[field]) {
        throw new Error(`Config missing required field: ${field}`);
      }
    }
    
    const collections = config.collections?.length || 0;
    console.log('[cms] Loaded config from /api/website-admin/config.yml');
    console.log('[cms] Config: backend=' + config.backend?.name + ' collections=' + collections);
    
    if (collections === 0) {
      console.warn('[cms] WARNING: No collections in config');
    }
    
    return config;
  } catch (error) {
    console.error('[cms] Failed to load config:', error);
    throw error;
  }
}

// ============================================================================
// PART 5: Initialize CMS (let Decap fetch from our guard)
// ============================================================================
async function initCMS(config) {
  console.log('[cms-init] Calling CMS.init with load_config_file=true...');
  
  try {
    // Explicitly tell Decap to load config file - our guard will serve it
    // This prevents duplicate collections error (only one source of config)
    window.CMS.init({
      load_config_file: true
    });
    
    console.log('[cms-init] CMS.init called, Decap will fetch config via guard...');
    
    // Wait for store to be created
    const storeReady = await waitForStore(5000);
    
    if (storeReady) {
      console.log('[cms-init] ✅ Store ready');
      
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
      console.error('[cms] ❌ Store initialization failed');
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
    
    // Step 2: Load config from API
    const config = await loadConfig();
    
    // Step 3: Initialize CMS with config object
    const success = await initCMS(config);
    
    if (!success) {
      console.error('[cms] Initialization failed - check errors above');
    }
    
  } catch (error) {
    console.error('[cms] Fatal error:', error);
    alert('CMS failed to initialize. Check console for details.');
  }
})();
