import bundleData from '../../public/iconify-bundle.json';

/**
 * Loads the Iconify bundle at build time for immediate icon rendering
 * This eliminates the async loading delay that causes missing icons
 */
export function loadIconifyBundle(): void {
  if (typeof window !== 'undefined' && window.Iconify && window.Iconify.addCollection) {
    try {
      Object.values(bundleData).forEach((collection: any) => {
        window.Iconify.addCollection(collection);
      });
      console.debug('[Iconify] Bundle loaded successfully with', Object.keys(bundleData).length, 'collections');
    } catch (error) {
      console.warn('[Iconify] Failed to load bundle:', error);
    }
  }
}

/**
 * Inline function for use in Astro script tags
 * This version can be stringified and executed in the browser
 */
export const loadIconifyBundleInline = `
(function() {
  'use strict';
  
  const bundleData = ${JSON.stringify(bundleData)};
  
  function loadBundle() {
    if (window.Iconify && window.Iconify.addCollection) {
      try {
        Object.values(bundleData).forEach(function(collection) {
          window.Iconify.addCollection(collection);
        });
        console.debug('[Iconify] Bundle loaded successfully with', Object.keys(bundleData).length, 'collections');
        return true;
      } catch (error) {
        console.warn('[Iconify] Failed to load bundle:', error);
        return false;
      }
    }
    return false;
  }
  
  // Try to load immediately
  if (!loadBundle()) {
    // If Iconify isn't ready, wait for it (max 100ms)
    let attempts = 0;
    const maxAttempts = 10;
    
    function retry() {
      if (loadBundle() || attempts >= maxAttempts) {
        return;
      }
      attempts++;
      setTimeout(retry, 10);
    }
    
    retry();
  }
})();
`;
