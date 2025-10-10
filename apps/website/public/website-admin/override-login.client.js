/**
 * Decap CMS OAuth redirect handler
 * Handles redirect-based OAuth flow (no popups)
 * Waits for Decap to be ready, then injects auth token
 */

(function() {
  'use strict';

  // Helper to read cookie value
  function readCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  }

  // Helper to write/delete cookie
  function writeCookie(name, value, maxAgeSeconds) {
    const parts = [`${name}=${value}`, 'Path=/'];
    if (maxAgeSeconds !== undefined) {
      parts.push(`Max-Age=${maxAgeSeconds}`);
    }
    document.cookie = parts.join('; ');
  }

  // Mask token in logs to prevent leakage
  function maskToken(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/(token["\s:]*)[^",}\s]+/gi, '$1***');
  }

  // Check if Decap CMS is ready (collections loaded)
  function decapReady() {
    const store = window.__DECAP_CMS__ && window.__DECAP_CMS__.store;
    const cfg = store && store.getState && store.getState().config;
    const col = cfg && (cfg.collections || (cfg.get && cfg.get('collections')));
    const hasCollections = col && (Array.isArray(col) ? col.length > 0 : col.size > 0);
    return !!(window.DecapCms && store && hasCollections);
  }

  // Wait for Decap CMS to be ready
  async function waitForDecap(ms = 8000) {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) {
      if (decapReady()) return true;
      await new Promise(r => setTimeout(r, 120));
    }
    return false;
  }

  // Intercept login button and navigate in same tab
  function interceptLoginButton() {
    // Wait for DOM to be ready
    const observer = new MutationObserver(() => {
      const loginButton = document.querySelector('button[type="button"]');
      if (loginButton && loginButton.textContent.includes('Login')) {
        loginButton.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const url = `${location.origin}/api/decap/oauth/authorize?provider=github&site_id=${location.host}&scope=repo`;
          window.location.assign(url);
        }, { capture: true });
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // Handle OAuth redirect completion
  async function handleOAuthRedirect() {
    const urlParams = new URLSearchParams(window.location.search);
    const authSuccess = urlParams.get('auth_success');
    const authError = urlParams.get('auth_error');

    // Handle error case
    if (authError) {
      console.error('[decap-oauth] Authentication error:', authError);
      const message = document.createElement('div');
      message.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#f44336;color:white;padding:12px 24px;border-radius:4px;z-index:9999;';
      message.textContent = `GitHub authentication failed: ${authError}`;
      document.body.appendChild(message);
      setTimeout(() => message.remove(), 5000);
      // Clean up URL
      window.history.replaceState({}, '', '/website-admin/#/');
      return;
    }

    // Handle success case
    if (authSuccess === '1') {
      console.log('[decap-oauth] OAuth redirect completed, processing token...');
      
      // Get token from cookie
      const token = readCookie('decap_auth_token');
      
      if (!token) {
        console.error('[decap-oauth] No auth token found in cookie');
        const message = document.createElement('div');
        message.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#f44336;color:white;padding:12px 24px;border-radius:4px;z-index:9999;';
        message.textContent = 'Authentication failed: No token received';
        document.body.appendChild(message);
        setTimeout(() => message.remove(), 5000);
        window.history.replaceState({}, '', '/website-admin/#/');
        return;
      }

      console.log('[decap-oauth] Token received (masked)');
      
      // Wait for Decap to be ready
      console.log('[decap-oauth] Waiting for Decap CMS to initialize...');
      const isReady = await waitForDecap();
      
      if (!isReady) {
        console.error('[decap-oauth] Decap CMS failed to initialize');
        const message = document.createElement('div');
        message.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#f44336;color:white;padding:12px 24px;border-radius:4px;z-index:9999;';
        message.textContent = 'CMS failed to initialize, refresh to continue';
        document.body.appendChild(message);
        // Keep cookie for one reload
        return;
      }

      // Build auth payload in Decap's expected format
      const payload = 'authorization:github:success:' + JSON.stringify({ 
        token: token, 
        provider: 'github' 
      });

      // Send auth message to Decap
      console.log('[decap-oauth] Delivering auth to Decap CMS');
      window.postMessage(payload, window.location.origin);

      // Clean up: remove cookie and URL parameter
      writeCookie('decap_auth_token', '', -1);
      window.history.replaceState({}, '', '/website-admin/#/');
      
      console.log('[decap-oauth] Authentication complete');
    }
  }

  // Initialize on page load
  console.log('[decap-oauth] Redirect OAuth flow active');
  
  // Handle OAuth redirect completion
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        handleOAuthRedirect();
        interceptLoginButton();
      }, 300);
    });
  } else {
    setTimeout(() => {
      handleOAuthRedirect();
      interceptLoginButton();
    }, 300);
  }
})();
