/**
 * Decap CMS OAuth redirect handler
 * Handles redirect-based OAuth flow (no popups)
 * Waits for Decap to be ready, then injects auth token
 */

(function() {
  'use strict';

  // Helper to get cookie value
  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  }

  // Helper to delete cookie
  function deleteCookie(name) {
    document.cookie = `${name}=; Max-Age=0; Path=/`;
  }

  // Mask token in logs to prevent leakage
  function maskToken(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/(gho_)[a-zA-Z0-9]{36}/g, '$1***');
  }

  // Wait for Decap CMS to be ready (collections loaded)
  function waitForDecapReady(timeoutMs = 10000) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      function check() {
        // Check if Decap is initialized with collections loaded
        const store = window.__DECAP_CMS__ && window.__DECAP_CMS__.store;
        const state = store && store.getState && store.getState();
        const config = state && state.config;
        const collections = config && (config.collections || (config.get && config.get('collections')));
        const hasCollections = collections && (
          Array.isArray(collections) ? collections.length > 0 : 
          collections.size ? collections.size > 0 : false
        );
        
        if (window.DecapCms && store && hasCollections) {
          console.log('[decap-oauth] Decap CMS is ready with', 
            Array.isArray(collections) ? collections.length : collections.size, 'collections');
          resolve(true);
          return;
        }
        
        if (Date.now() - startTime > timeoutMs) {
          console.warn('[decap-oauth] Timeout waiting for Decap CMS');
          resolve(false);
          return;
        }
        
        setTimeout(check, 100);
      }
      
      check();
    });
  }

  // Handle OAuth redirect completion
  async function handleOAuthRedirect() {
    const urlParams = new URLSearchParams(window.location.search);
    const authSuccess = urlParams.get('auth_success');
    const authError = urlParams.get('auth_error');

    // Handle error case
    if (authError) {
      console.error('[decap-oauth] Authentication error:', authError);
      alert(`GitHub authentication failed: ${authError}`);
      // Clean up URL
      window.history.replaceState({}, '', '/website-admin');
      return;
    }

    // Handle success case
    if (authSuccess === 'true') {
      console.log('[decap-oauth] OAuth redirect completed, processing token...');
      
      // Get token from cookie
      const token = getCookie('decap_auth_token');
      
      if (!token) {
        console.error('[decap-oauth] No auth token found in cookie');
        alert('Authentication failed: No token received');
        window.history.replaceState({}, '', '/website-admin');
        return;
      }

      console.log('[decap-oauth] Token received:', maskToken(token));
      
      // Wait for Decap to be ready
      console.log('[decap-oauth] Waiting for Decap CMS to initialize...');
      const isReady = await waitForDecapReady();
      
      if (!isReady) {
        console.error('[decap-oauth] Decap CMS failed to initialize');
        alert('CMS failed to initialize. Please refresh the page.');
        return;
      }

      // Build auth payload in Decap's expected format
      const payload = `authorization:github:success:${JSON.stringify({ 
        token: token, 
        provider: 'github' 
      })}`;

      // Send auth message to Decap
      console.log('[decap-oauth] Sending auth to Decap CMS');
      window.postMessage(payload, window.location.origin);

      // Also try BroadcastChannel for redundancy
      try {
        new BroadcastChannel('decap_oauth').postMessage(payload);
      } catch(e) {
        // BroadcastChannel not supported, that's okay
      }

      // Clean up: remove cookie and URL parameter
      deleteCookie('decap_auth_token');
      window.history.replaceState({}, '', '/website-admin');
      
      console.log('[decap-oauth] Authentication complete');
    }
  }

  // Diagnostic listener for postMessage (logs auth messages)
  window.addEventListener('message', (e) => {
    if (typeof e.data === 'string' && e.data.startsWith('authorization:github:')) {
      console.log('[decap-oauth] Auth message posted:', maskToken(e.data).substring(0, 80) + '...');
    }
  });

  // Start OAuth handling on page load
  console.log('[decap-oauth] Redirect-based OAuth flow active');
  
  // Wait a bit for DOM and initial scripts to load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(handleOAuthRedirect, 500);
    });
  } else {
    setTimeout(handleOAuthRedirect, 500);
  }
})();
