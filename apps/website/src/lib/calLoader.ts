// apps/website/src/lib/calLoader.ts
// Unified Cal.com embed loader utility

declare global {
  interface Window {
    Cal?: any;
  }
}

let _p: Promise<void> | null = null;

/**
 * Loads Cal.com embed script idempotently
 * Returns a promise that resolves when Cal is available
 */
export function loadCalEmbed(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.Cal) return Promise.resolve();
  if (_p) return _p;
  
  _p = new Promise<void>((resolve, reject) => {
    const id = 'cal-embed-js';
    const existing = document.getElementById(id) as HTMLScriptElement | null;
    
    const onReady = () => {
      const check = () => {
        if (window.Cal) {
          resolve();
        } else {
          setTimeout(check, 25);
        }
      };
      check();
    };
    
    if (existing) {
      onReady();
      return;
    }
    
    const s = document.createElement('script');
    s.id = id;
    s.src = 'https://cal.com/embed.js';
    s.async = true;
    s.onload = onReady;
    s.onerror = () => reject(new Error('Failed to load Cal.com embed script'));
    document.head.appendChild(s);
  });
  
  return _p;
}

/**
 * Safely destroys Cal.com inline embed
 */
export function destroyCalInlineSafe() {
  try {
    if (window.Cal && typeof window.Cal === 'function') {
      window.Cal('destroy');
    }
  } catch (error) {
    console.warn('[cal] Error destroying inline embed:', error);
  }
}

/**
 * Initializes Cal.com with proper configuration
 */
export async function initCal(): Promise<void> {
  await loadCalEmbed();
  
  if (window.Cal && typeof window.Cal === 'function') {
    try {
      window.Cal('init', { origin: 'https://cal.com' });
    } catch (error) {
      console.warn('[cal] Error initializing Cal:', error);
    }
  }
}

/**
 * Updates Cal.com UI theme
 */
export function updateCalTheme(theme: 'light' | 'dark' | 'auto' = 'auto') {
  if (window.Cal && typeof window.Cal === 'function') {
    try {
      window.Cal('ui', { theme });
    } catch (error) {
      console.warn('[cal] Error updating theme:', error);
    }
  }
}
