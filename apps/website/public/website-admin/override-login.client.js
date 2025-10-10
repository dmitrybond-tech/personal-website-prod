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

  // Check for fallback auth state (from popup reload scenario)
  function checkFallbackAuth() {
    try {
      const payload = localStorage.getItem(FALLBACK_KEY);
      if (payload && payload.startsWith('authorization:github:success:')) {
        console.log('[decap-oauth] restoring fallback auth state');
        localStorage.removeItem(FALLBACK_KEY);
        // Re-broadcast to CMS
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
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkFallbackAuth);
  } else {
    checkFallbackAuth();
  }

  console.log('[decap-oauth] Native OAuth flow active. Use the "Login with GitHub" button.');
})();
