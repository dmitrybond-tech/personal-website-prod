/**
 * Override Decap CMS login to use new tab instead of popup
 * This script runs on the website-admin page to support both popup and new tab flows
 * with retry mechanism to guarantee token delivery
 */

(function() {
  'use strict';

  const KEY = 'decap_oauth_message';
  const MAX_RETRIES = 10;
  const RETRY_INTERVAL = 250;

  // Mask token in logs
  function maskToken(payload) {
    if (typeof payload !== 'string') return payload;
    return payload.replace(/(token['"]?\s*:\s*['"])[^'"]+(['"])/gi, '$1***$2');
  }

  // Check if CMS has accepted the token (login screen disappeared)
  function isCMSAuthenticated() {
    // Check if login button is gone
    const loginButton = document.querySelector('.LoginButton, .login-button');
    const loginText = document.body.textContent?.includes('Login with GitHub');
    
    // Check if collections panel appeared
    const collectionsPanel = document.querySelector('[data-testid="collection-group"]');
    
    return (!loginButton && !loginText) || !!collectionsPanel;
  }

  // Deliver via child-window bridge (makes event.source a child window)
  function deliverViaChildBridge(payload, origin) {
    try {
      const w = window.open('', 'decap-auth-bridge', 'width=1,height=1');
      if (!w) return false;
      w.document.write(
        '<!doctype html><meta charset="utf-8"/>' +
        '<script>' +
        'try { window.opener.postMessage(' + JSON.stringify(payload) + ', ' + JSON.stringify(origin) + '); }' +
        'finally { window.close(); }' +
        '<\/script>'
      );
      return true;
    } catch (e) {
      console.error('[override-login] bridge failed:', e);
      return false;
    }
  }

  // Deliver token to CMS with retry mechanism
  function deliverToCMS(payload) {
    console.log('[override-login] Delivering token to CMS...', maskToken(payload));
    
    let attempt = 0;
    
    function tryDeliver() {
      attempt++;
      
      try {
        window.postMessage(payload, window.location.origin);
        console.log('[override-login] postMessage attempt', attempt);
      } catch (e) {
        console.error('[override-login] postMessage failed:', e);
      }
      
      // Check if CMS acknowledged
      if (isCMSAuthenticated()) {
        console.log('[override-login] CMS acknowledged, login successful');
        return;
      }
      
      // Retry if not done yet
      if (attempt < MAX_RETRIES) {
        setTimeout(tryDeliver, RETRY_INTERVAL);
      } else {
        // Try child-window bridge as last resort
        console.log('[override-login] Max retries reached, trying child bridge');
        if (deliverViaChildBridge(payload, window.location.origin)) {
          console.log('[override-login] bridge used');
        }
      }
    }
    
    tryDeliver();
  }

  // Relay message from localStorage (for new tab flow)
  function relayFromStorage() {
    try {
      const payload = localStorage.getItem(KEY);
      if (payload && payload.startsWith('authorization:github:')) {
        console.log('[override-login] received token via storage');
        deliverToCMS(payload);
        localStorage.removeItem(KEY);
      }
    } catch (e) {
      console.error('[override-login] Error relaying from storage:', e);
    }
  }

  // Listen for storage events (new tab writes to localStorage)
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) {
      console.log('[override-login] received token via storage event');
      relayFromStorage();
    }
  });

  // Listen for BroadcastChannel (alternative delivery method)
  try {
    const channel = new BroadcastChannel('decap_oauth');
    channel.addEventListener('message', (e) => {
      const payload = e.data;
      if (typeof payload === 'string' && payload.startsWith('authorization:github:')) {
        console.log('[override-login] received token via broadcast');
        deliverToCMS(payload);
        localStorage.removeItem(KEY);
      }
    });
  } catch (e) {
    console.warn('[override-login] BroadcastChannel not supported:', e);
  }

  // Listen for postMessage (for diagnostics)
  window.addEventListener('message', (e) => {
    if (e.origin === window.location.origin && 
        typeof e.data === 'string' && 
        e.data.startsWith('authorization:github:')) {
      console.log('[override-login] received message:', maskToken(e.data).substring(0, 50) + '...');
    }
  });

  // Check on startup in case the tab returned before this script loaded
  console.log('[override-login] waiting for token...');
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', relayFromStorage);
  } else {
    relayFromStorage();
  }

  // Wait for native GitHub button with timeout
  function waitForNativeButton(timeout) {
    return new Promise((resolve) => {
      const selectors = [
        '[data-testid="oauth-login"] button',
        '.nc-githubAuthButton button',
        'button[aria-label*="GitHub"]',
        'button:has(svg[aria-label="GitHub"])'
      ];
      
      function findButton() {
        for (const selector of selectors) {
          try {
            const btn = document.querySelector(selector);
            if (btn) return btn;
          } catch (e) {
            // querySelector may fail on :has() in older browsers
          }
        }
        // Fallback: find by text
        const buttons = document.querySelectorAll('button');
        for (const btn of buttons) {
          if (btn.textContent?.includes('Login with GitHub')) {
            return btn;
          }
        }
        return null;
      }
      
      const btn = findButton();
      if (btn) {
        resolve(btn);
        return;
      }
      
      // Watch for button to appear
      const observer = new MutationObserver(() => {
        const btn = findButton();
        if (btn) {
          observer.disconnect();
          resolve(btn);
        }
      });
      
      observer.observe(document.body, { childList: true, subtree: true });
      
      setTimeout(() => {
        observer.disconnect();
        resolve(null);
      }, timeout);
    });
  }

  // Prime native OAuth listener then open new tab
  async function primeNativeAndOpenNewTab(authUrl) {
    console.log('[override-login] primed native auth');
    
    // 1) Capture & close native popup
    const origOpen = window.open;
    let nativeChild = null;
    window.open = function(url, name, specs) {
      nativeChild = origOpen.call(window, url, name || 'decap-native-popup', specs);
      return nativeChild;
    };

    // 2) Find and click native button to mount listener
    const btn = await waitForNativeButton(1000);
    if (btn) {
      try {
        btn.click();
      } catch (e) {
        console.warn('[override-login] native button click failed:', e);
      }
    }

    // 3) Close native popup if opened, restore window.open
    try {
      if (nativeChild && !nativeChild.closed) {
        nativeChild.close();
      }
    } catch (e) {
      // Ignore close errors
    }
    window.open = origOpen;

    // 4) Open our new-tab OAuth (keep opener available)
    window.open(authUrl, '_blank');
  }

  // Add custom login button
  function addButton() {
    const btn = document.createElement('button');
    btn.textContent = 'Sign in with GitHub (new tab)';
    btn.className = 'cms-login-button-new-tab';
    btn.style.cssText = `
      background: #24292e;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 6px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      margin: 20px;
      display: inline-block;
      transition: background-color 0.2s;
    `;

    btn.addEventListener('mouseenter', () => {
      btn.style.backgroundColor = '#1a1e22';
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.backgroundColor = '#24292e';
    });

    btn.onclick = () => {
      const url = `${location.origin}/api/decap/oauth/authorize?provider=github&site_id=${location.host}&scope=repo`;
      primeNativeAndOpenNewTab(url);
    };

    const container = document.querySelector('.cms-login, .login-form, .cms-login-form') || document.body;
    container.appendChild(btn);
    
    console.log('[override-login] Custom login button added');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addButton);
  } else {
    addButton();
  }
})();
