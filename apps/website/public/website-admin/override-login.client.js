/**
 * Minimal Decap CMS OAuth monitoring
 * Auto-clicks login if token exists
 */

(function() {
  'use strict';

  console.log('[decap-oauth] monitor loaded');

  // Listen for OAuth completion message from popup
  window.addEventListener('message', function(e) {
    if (typeof e.data === 'string' && e.data.startsWith('authorization:github:')) {
      console.log('[decap-oauth] auth message received, reloading...');
      setTimeout(function() {
        location.reload();
      }, 500);
    }
  });

  // Auto-login if token exists
  setTimeout(function() {
    const hasToken = localStorage.getItem('netlify-cms-user') || 
                    localStorage.getItem('decap-cms.user');
    
    if (hasToken) {
      console.log('[decap-oauth] token found, clicking login button...');
      
      // Find and click login button
      const loginButton = document.querySelector('button');
      if (loginButton && loginButton.textContent.includes('Login')) {
        console.log('[decap-oauth] auto-clicking login button');
        loginButton.click();
      }
    } else {
      console.log('[decap-oauth] no token found, manual login required');
    }
  }, 1500);

})();
