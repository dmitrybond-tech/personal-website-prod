/**
 * Decap CMS OAuth helpers
 * Provides diagnostic logging and fallback auth state restoration
 * The native Decap popup flow is used - no custom buttons or bridges
 */

(function() {
  'use strict';

  const FALLBACK_KEY = 'decap_oauth_fallback';

  // Mask token in logs to prevent leakage
  function maskToken(payload) {
    if (typeof payload !== 'string') return payload;
    return payload.replace(/(token['"]?\s*:\s*['"])[^'"]+(['"])/gi, '$1***$2');
  }

  // Wait for Decap CMS to be ready (backend initialized)
  function waitForDecapReady(timeoutMs = 5000) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      function check() {
        // Check if Decap is initialized and has a backend
        if (window.DecapCms && 
            window.__DECAP_CMS__ && 
            window.__DECAP_CMS__.store) {
          console.log('[decap-oauth] Decap CMS is ready');
          resolve();
          return;
        }
        
        if (Date.now() - startTime > timeoutMs) {
          console.warn('[decap-oauth] Timeout waiting for Decap CMS');
          resolve(); // Don't reject, just proceed
          return;
        }
        
        setTimeout(check, 100);
      }
      
      check();
    });
  }

  // Check for fallback auth state (from popup reload scenario)
  async function checkFallbackAuth() {
    try {
      const payload = localStorage.getItem(FALLBACK_KEY);
      if (payload && payload.startsWith('authorization:github:success:')) {
        console.log('[decap-oauth] Found fallback auth state, waiting for Decap...');
        
        // CRITICAL: Wait for Decap to be ready before sending message
        await waitForDecapReady();
        
        console.log('[decap-oauth] Restoring fallback auth state');
        localStorage.removeItem(FALLBACK_KEY);
        
        // Re-broadcast to CMS (now that it's ready)
        window.postMessage(payload, window.location.origin);
        
        try {
          new BroadcastChannel('decap_oauth').postMessage(payload);
        } catch(e) {}
      }
    } catch (e) {
      console.error('[decap-oauth] fallback check failed:', e);
    }
  }

  // Diagnostic listener for postMessage (logs only, does not interfere)
  window.addEventListener('message', (e) => {
    if (typeof e.data === 'string' && e.data.startsWith('authorization:github:')) {
      console.log('[decap-oauth] received message:', maskToken(e.data).substring(0, 60) + '...');
    }
  });

  // Check for fallback auth on page load
  // Use setTimeout to ensure we check AFTER config-loader initializes Decap
  setTimeout(() => {
    checkFallbackAuth();
  }, 1000);

  console.log('[decap-oauth] Native OAuth flow active. Use the "Login with GitHub" button.');
})();
