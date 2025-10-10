/**
 * Override Decap CMS login to use new tab instead of popup
 * This script runs on the website-admin page to replace the standard login flow
 */

(function() {
  'use strict';

  function waitForDecapAndOverride() {
    // Wait for Decap CMS to load
    if (typeof window.CMS === 'undefined') {
      setTimeout(waitForDecapAndOverride, 100);
      return;
    }

    console.log('[override-login] Decap CMS loaded, setting up new tab login');

    // Override the default OAuth flow
    if (window.CMS.registerBackend) {
      // Store original GitHub backend
      const originalGitHubBackend = window.CMS.backends.github;
      
      if (originalGitHubBackend) {
        // Override the authenticate method
        const originalAuthenticate = originalGitHubBackend.authenticate;
        
        originalGitHubBackend.authenticate = function(options) {
          console.log('[override-login] Intercepting GitHub authentication');
          
          // Build the OAuth URL
          const url = `${window.location.origin}/api/decap/oauth/authorize?provider=github&site_id=${window.location.host}&scope=repo`;
          
          // Open in new tab instead of popup
          const authWindow = window.open(url, '_blank');
          
          if (!authWindow) {
            console.error('[override-login] Failed to open auth window - popup blocked?');
            return Promise.reject(new Error('Failed to open authentication window'));
          }

          // Listen for postMessage from the auth window
          return new Promise((resolve, reject) => {
            const messageHandler = (event) => {
              // Verify origin
              if (event.origin !== window.location.origin) {
                return;
              }

              if (typeof event.data === 'string' && event.data.startsWith('authorization:github:')) {
                window.removeEventListener('message', messageHandler);
                
                if (event.data.startsWith('authorization:github:success:')) {
                  const payload = event.data.replace('authorization:github:success:', '');
                  try {
                    const data = JSON.parse(payload);
                    console.log('[override-login] Authentication successful');
                    resolve(data.token);
                  } catch (e) {
                    reject(new Error('Invalid token response'));
                  }
                } else if (event.data.startsWith('authorization:github:error:')) {
                  const payload = event.data.replace('authorization:github:error:', '');
                  try {
                    const error = JSON.parse(payload);
                    console.error('[override-login] Authentication failed:', error);
                    reject(new Error(error.message || 'Authentication failed'));
                  } catch (e) {
                    reject(new Error('Authentication failed'));
                  }
                }
              }
            };

            window.addEventListener('message', messageHandler);

            // Timeout after 5 minutes
            setTimeout(() => {
              window.removeEventListener('message', messageHandler);
              reject(new Error('Authentication timeout'));
            }, 5 * 60 * 1000);
          });
        };
      }
    }

    // Also override the UI login button if it exists
    setTimeout(() => {
      overrideLoginButton();
    }, 1000);
  }

  function overrideLoginButton() {
    // Find and hide the standard login button
    const loginButton = document.querySelector('.cms-login-button, [data-testid="login-button"], .login-button');
    if (loginButton) {
      console.log('[override-login] Hiding standard login button');
      loginButton.style.display = 'none';
    }

    // Create our custom login button
    const customButton = document.createElement('button');
    customButton.textContent = 'Sign in with GitHub (new tab)';
    customButton.className = 'cms-login-button-new-tab';
    customButton.style.cssText = `
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

    customButton.addEventListener('mouseenter', () => {
      customButton.style.backgroundColor = '#1a1e22';
    });

    customButton.addEventListener('mouseleave', () => {
      customButton.style.backgroundColor = '#24292e';
    });

    customButton.addEventListener('click', () => {
      const url = `${window.location.origin}/api/decap/oauth/authorize?provider=github&site_id=${window.location.host}&scope=repo`;
      window.open(url, '_blank');
    });

    // Insert the button near where the login form would be
    const loginContainer = document.querySelector('.cms-login, .login-form, .cms-login-form') || document.body;
    loginContainer.appendChild(customButton);
    
    console.log('[override-login] Custom login button added');
  }

  // Start the override process
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForDecapAndOverride);
  } else {
    waitForDecapAndOverride();
  }
})();
