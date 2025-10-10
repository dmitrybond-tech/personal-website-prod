/**
 * Minimal Decap CMS OAuth monitoring
 * Ensures popup auth completes and CMS loads properly
 */

(function() {
  'use strict';

  console.log('[decap-oauth] minimal monitor loaded');

  // Listen for OAuth completion message from popup
  window.addEventListener('message', function(e) {
    if (typeof e.data === 'string' && e.data.startsWith('authorization:github:')) {
      console.log('[decap-oauth] auth message received');
      
      // Wait a bit for token to be stored, then check if we need to reload
      setTimeout(function() {
        // Check if we have token in localStorage
        const hasToken = localStorage.getItem('netlify-cms-user') || 
                        localStorage.getItem('decap-cms.user');
        
        // Check if CMS store exists
        const hasStore = window.CMS && window.CMS.store;
        
        if (hasToken && !hasStore) {
          // We have token but no store - reload once
          if (!sessionStorage.getItem('decap_oauth_reloaded')) {
            sessionStorage.setItem('decap_oauth_reloaded', '1');
            console.log('[decap-oauth] reloading to complete auth...');
            setTimeout(function() {
              location.reload();
            }, 100);
          }
        } else if (hasStore) {
          console.log('[decap-oauth] CMS store ready');
        }
      }, 500);
    }
  });

})();
