/**
 * Override Decap CMS login to use new tab instead of popup
 * This script runs on the website-admin page to support both popup and new tab flows
 */

(function() {
  'use strict';

  const KEY = 'decap_oauth_message';

  // Relay message from localStorage to postMessage (for new tab flow)
  function relayFromStorage() {
    try {
      const payload = localStorage.getItem(KEY);
      if (payload && payload.startsWith('authorization:github:')) {
        console.log('[override-login] Relaying OAuth message from localStorage');
        window.postMessage(payload, window.location.origin);
        localStorage.removeItem(KEY);
      }
    } catch (e) {
      console.error('[override-login] Error relaying from storage:', e);
    }
  }

  // Listen for storage events (new tab writes to localStorage)
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) {
      relayFromStorage();
    }
  });

  // Check on startup in case the tab returned before this script loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', relayFromStorage);
  } else {
    relayFromStorage();
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
      window.open(url, '_blank');
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
