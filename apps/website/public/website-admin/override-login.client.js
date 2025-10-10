/**
 * Decap CMS OAuth popup flow - passive diagnostics
 * Does NOT intercept native popup behavior
 * Only logs auth messages for debugging
 */

(function() {
  'use strict';

  console.log('[decap-oauth] admin booted; CMS_MANUAL_INIT=', !!window.CMS_MANUAL_INIT);

  // Passive message listener (diagnostic only)
  // Decap's own handler will consume the message; we just log it
  window.addEventListener('message', function(e) {
    if (typeof e.data === 'string' && e.data.startsWith('authorization:github:')) {
      console.log('[decap-oauth] received auth message');
      // Do not re-emit or transform; let Decap's handler process it
    }
  }, { once: false });

})();
