/**
 * Decap CMS OAuth popup flow - deep debug instrumentation
 * Does NOT intercept native popup behavior
 * Logs auth messages, config, Redux store, and provides debug toolbox
 */

(function() {
  'use strict';

  // Initialize debug flag from localStorage or server flag
  window.__DECAP_OAUTH_DEBUG__ = (localStorage.getItem('DECAP_OAUTH_DEBUG') === '1');
  
  var DEBUG = window.__DECAP_OAUTH_DEBUG__;
  
  // Bootstrap & CMS init logging
  if (DEBUG) {
    console.log('[decap-admin] boot debug=' + DEBUG + ' CMS_MANUAL_INIT=' + !!window.CMS_MANUAL_INIT);
  } else {
    console.log('[decap-oauth] admin booted; CMS_MANUAL_INIT=', !!window.CMS_MANUAL_INIT);
  }

  // Network taps (debug only)
  if (DEBUG) {
    (function() {
      var _fetch = window.fetch;
      window.fetch = async function() {
        var args = arguments;
        var url = typeof args[0] === 'string' ? args[0] : (args[0]?.url || '');
        var t0 = performance.now();
        var res = await _fetch.apply(this, args);
        var duration = (performance.now() - t0).toFixed(0);
        console.log('[net] ' + url + ' ' + res.status + ' ' + duration + 'ms');
        return res;
      };
    })();
  }

  // Passive message listener (diagnostic + Redux awareness)
  // Decap's own handler will consume the message; we just log it
  window.addEventListener('message', function(e) {
    if (typeof e.data === 'string') {
      var isAuthMsg = e.data.startsWith('authorization:github:');
      if (DEBUG) {
        console.log('[decap-admin] message: origin=' + e.origin + ' startsWith=\'authorization:github:\'=' + isAuthMsg);
      } else if (isAuthMsg) {
        console.log('[decap-oauth] received auth message');
      }
    }
  }, { once: false });

  // Hook into config parsing (from config-loader.js)
  // We'll check window.__CMS_CONFIG__ after it's loaded
  function logConfigSummary() {
    try {
      var cfg = window.__CMS_CONFIG__;
      if (!cfg) return;
      
      var backend = cfg.backend || {};
      var collections = cfg.collections || [];
      
      if (DEBUG) {
        console.log('[decap-admin] config summary: backend=' + backend.name + 
          ' base_url=' + backend.base_url + 
          ' auth_endpoint=' + backend.auth_endpoint + 
          ' collections(pre)=' + collections.length);
      }
    } catch (e) {
      console.warn('[decap-admin] unable to read config summary:', e);
    }
  }

  // Redux store tracing (safe)
  function setupStoreSubscription() {
    try {
      var store = window.CMS && window.CMS.store;
      if (!store || !store.subscribe) return;
      
      var prevCollectionsCount = 0;
      var prevAuthUser = null;
      
      store.subscribe(function() {
        try {
          var state = store.getState();
          
          // Track collections
          var collections = state.config?.get?.('collections') || state.config?.collections || [];
          var collectionsCount = collections.length || collections.size || 0;
          
          if (collectionsCount !== prevCollectionsCount) {
            prevCollectionsCount = collectionsCount;
            if (DEBUG) {
              var names = [];
              try {
                if (collections.toJS) {
                  names = collections.toJS().map(function(c) { return c.name; });
                } else if (Array.isArray(collections)) {
                  names = collections.map(function(c) { return c.name; });
                }
              } catch (e) {}
              
              console.log('[decap-admin] collections(post)=' + collectionsCount + ' names=' + JSON.stringify(names));
              
              if (collectionsCount === 0) {
                console.warn('[decap-admin] collections(post)=0 - likely causes: folder not found, i18n config missing, invalid config structure');
              }
            }
          }
          
          // Track auth user
          var authUser = state.auth?.get?.('user') || state.auth?.user;
          var hasUser = !!authUser;
          
          if (hasUser !== prevAuthUser) {
            prevAuthUser = hasUser;
            if (DEBUG) {
              var lsKey = 'unknown';
              try {
                if (localStorage.getItem('netlify-cms-user')) lsKey = 'netlify-cms-user';
                else if (localStorage.getItem('decap-cms.user')) lsKey = 'decap-cms.user';
              } catch (e) {}
              
              console.log('[decap-admin] auth user present=' + hasUser + ' key=' + lsKey);
            }
          }
        } catch (e) {
          // Silent failure for store access issues
        }
      });
      
      if (DEBUG) {
        console.log('[decap-admin] Redux store subscription established');
      }
    } catch (e) {
      console.warn('[decap-admin] unable to subscribe to store:', e);
    }
  }

  // CMS init hook
  function hookCMSInit() {
    // Wait for CMS to be available
    var checkInterval = setInterval(function() {
      if (window.CMS && typeof window.CMS.init === 'function') {
        clearInterval(checkInterval);
        
        if (DEBUG) {
          console.log('[decap-admin] CMS.init available, waiting for call...');
        }
        
        // Config should already be loaded by config-loader.js
        logConfigSummary();
        
        // Setup store subscription after CMS init (config-loader.js already calls CMS.init)
        setTimeout(function() {
          setupStoreSubscription();
          
          // Log config validation outcome
          setTimeout(function() {
            try {
              var storeCfg = window.__DECAP_CMS__?.state?.config?.toJS?.() || 
                            window.__DECAP_CMS__?.state?.config;
              if (storeCfg && DEBUG) {
                var backend = storeCfg.backend || {};
                console.log('[decap-admin] backend.name=' + backend.name + 
                  ' repo=' + backend.repo + 
                  ' branch=' + backend.branch);
              }
            } catch (e) {}
          }, 500);
        }, 250);
      }
    }, 50);
    
    // Timeout after 10 seconds
    setTimeout(function() {
      clearInterval(checkInterval);
    }, 10000);
  }

  // Debug toolbox
  window.__DECAP_DEBUG__ = {
    dump: function() {
      console.group('=== Decap CMS Debug Dump ===');
      
      try {
        // CMS readiness
        var cmsReady = !!(window.CMS && window.CMS.init);
        console.log('CMS ready:', cmsReady);
        
        // Collections
        var store = window.CMS?.store;
        if (store) {
          var state = store.getState();
          var collections = state.config?.get?.('collections') || state.config?.collections || [];
          var count = collections.length || collections.size || 0;
          console.log('Collections count:', count);
          
          // Current user
          var authUser = state.auth?.get?.('user') || state.auth?.user;
          console.log('User present:', !!authUser);
        }
        
        // localStorage keys
        var lsKeys = ['netlify-cms-user', 'decap-cms.user'];
        lsKeys.forEach(function(key) {
          try {
            var val = localStorage.getItem(key);
            if (val) {
              var parsed = JSON.parse(val);
              var maskedToken = parsed.token ? (parsed.token.substring(0, 4) + '...') : 'none';
              console.log('LS key "' + key + '":', 'present, token=' + maskedToken);
            } else {
              console.log('LS key "' + key + '":', 'absent');
            }
          } catch (e) {
            console.log('LS key "' + key + '":', 'error reading');
          }
        });
        
        // Debug flag
        console.log('Debug mode:', DEBUG);
        console.log('Origin:', window.location.origin);
        console.log('Referrer:', document.referrer);
        console.log('Window name:', window.name);
        
      } catch (e) {
        console.error('Dump error:', e);
      }
      
      console.groupEnd();
    },
    
    simulate: function(token) {
      if (!DEBUG) {
        console.warn('[__DECAP_DEBUG__.simulate] Only available in debug mode. Set localStorage.setItem("DECAP_OAUTH_DEBUG", "1") and reload.');
        return;
      }
      
      var payload = 'authorization:github:success:' + JSON.stringify({
        token: token || 'test_token_' + Date.now(),
        provider: 'github'
      });
      
      console.log('[__DECAP_DEBUG__.simulate] Sending message to window:', payload.substring(0, 50) + '...');
      window.postMessage(payload, '*');
    },
    
    clearAuth: function() {
      try {
        localStorage.removeItem('netlify-cms-user');
        localStorage.removeItem('decap-cms.user');
        console.log('[__DECAP_DEBUG__.clearAuth] Cleared auth keys, reloading...');
        setTimeout(function() {
          location.reload();
        }, 100);
      } catch (e) {
        console.error('[__DECAP_DEBUG__.clearAuth] Error:', e);
      }
    },
    
    ping: function() {
      console.log('Origin:', window.location.origin);
      console.log('Referrer:', document.referrer);
      console.log('Window name:', window.name);
    }
  };

  // Initialize hooks
  hookCMSInit();
  
  if (DEBUG) {
    console.log('[decap-admin] Debug toolbox available: window.__DECAP_DEBUG__');
    console.log('[decap-admin] Try: __DECAP_DEBUG__.dump(), .simulate(token), .clearAuth(), .ping()');
  }

})();
