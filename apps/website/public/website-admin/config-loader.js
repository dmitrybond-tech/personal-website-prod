// /public/website-admin/config-loader.js
// Simple Decap CMS initialization for blog-only setup

// ============================================================================
// PART 1: Global error handlers
// ============================================================================
window.addEventListener('error', (e) => {
  console.error('[cms] error:', e.error || e.message);
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('[cms] unhandledrejection:', e.reason);
});

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
  console.log('[cms] Loading config from', configUrl);
  
  try {
    const response = await fetch(configUrl + '?t=' + Date.now(), { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Config fetch failed: ${response.status}`);
    }
    
    const yamlText = await response.text();
    
    // Parse YAML to object for validation
    const config = window.jsyaml ? window.jsyaml.load(yamlText) : null;
    
    if (!config) {
      throw new Error('js-yaml not available or config is empty');
    }
    
    const collections = config.collections?.length || 0;
    console.log('[cms] Config loaded: backend=' + config.backend?.name + 
                ' collections=' + collections);
    
    if (collections === 0) {
      console.warn('[cms] WARNING: No collections in config');
    }
    
    return { config, yamlText };
  } catch (error) {
    console.error('[cms] Failed to load config:', error);
    throw error;
  }
}

// ============================================================================
// PART 5: Initialize CMS
// ============================================================================
async function initCMS(config) {
  console.log('[cms] Calling CMS.init...');
  
  try {
    // Initialize with config object (simpler and more reliable than YAML string)
    window.CMS.init({
      load_config_file: false,
      config: config
    });
    
    console.log('[cms] CMS.init called, waiting for store...');
    
    // Wait for store to be created
    const storeReady = await waitForStore();
    
    if (storeReady) {
      console.log('[cms] ✅ Initialization successful');
      
      // Log collections from store
      setTimeout(() => {
        try {
          const state = window.CMS.store?.getState?.();
          const collections = state?.config?.get?.('collections');
          
          if (collections) {
            const count = collections.size || collections.length || 0;
            console.log('[cms] Collections in store:', count);
            
            if (collections.toJS) {
              const names = collections.toJS().map(c => c.name);
              console.log('[cms] Collection names:', names.join(', '));
            }
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
    const { config } = await loadConfig();
    
    // Step 3: Initialize CMS
    const success = await initCMS(config);
    
    if (!success) {
      console.error('[cms] Initialization failed - check errors above');
    }
    
  } catch (error) {
    console.error('[cms] Fatal error:', error);
    alert('CMS failed to initialize. Check console for details.');
  }
})();
