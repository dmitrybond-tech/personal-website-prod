// apps/website/src/app/features/bookme/lib/themeSync.ts
// Theme synchronization utility for Cal.com inline embed (bookme-only scope)

/**
 * Detects the current site theme from the document element
 * @returns "dark" if dark theme is active, "light" otherwise
 */
export function getSiteTheme(): "dark" | "light" {
  const html = document.documentElement;
  
  // Check for dark class or data-theme attribute
  if (html.classList.contains("dark") || html.dataset.theme === "dark") {
    return "dark";
  }
  
  return "light";
}

/**
 * Subscribes to site theme changes via MutationObserver
 * @param callback Function to call when theme changes
 * @returns Unsubscribe function to stop observing
 */
export function onSiteThemeChange(callback: (mode: "dark" | "light") => void): () => void {
  let lastTheme = getSiteTheme();
  
  const observer = new MutationObserver((mutations) => {
    let themeChanged = false;
    
    for (const mutation of mutations) {
      if (mutation.type === "attributes") {
        const target = mutation.target as HTMLElement;
        if (target === document.documentElement) {
          const attributeName = mutation.attributeName;
          if (attributeName === "class" || attributeName === "data-theme") {
            themeChanged = true;
            break;
          }
        }
      }
    }
    
    if (themeChanged) {
      const currentTheme = getSiteTheme();
      if (currentTheme !== lastTheme) {
        lastTheme = currentTheme;
        callback(currentTheme);
      }
    }
  });
  
  // Start observing the document element for class and data-theme changes
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class", "data-theme"]
  });
  
  // Return unsubscribe function
  return () => {
    observer.disconnect();
  };
}

/**
 * Applies theme to Cal.com inline embed
 * @param mode Theme mode to apply
 * @param namespace Cal.com namespace (defaults to "columnbed")
 */
export function applyCalTheme(mode: "dark" | "light", namespace = "columnbed"): void {
  if (typeof window !== "undefined" && window.Cal) {
    try {
      window.Cal("ui", { theme: mode, namespace });
      console.debug('[cal] Theme applied:', { mode, namespace });
    } catch (error) {
      console.warn('[cal] Failed to apply theme:', error);
    }
  }
}

// Theme Bridge singleton state
interface ThemeBridge {
  dispose: () => void;
}

// Window-level symbol for singleton guard
const THEME_BRIDGE_SYMBOL = Symbol('__bookmeThemeBridge');

// Cal global declaration is handled in src/types/ambient.d.ts
declare global {
  interface Window {
    [THEME_BRIDGE_SYMBOL]?: ThemeBridge;
  }
}

/**
 * Sends UI theme update to Cal.com
 * @param mode Theme mode to apply
 * @param namespace Cal.com namespace
 */
function sendUiTheme(mode: "dark" | "light", namespace: string): void {
  if (typeof window !== "undefined" && window.Cal) {
    try {
      window.Cal("ui", { theme: mode, namespace });
      console.debug('[cal] UI theme sent:', { mode, namespace });
    } catch (error) {
      console.warn('[cal] Failed to send UI theme:', error);
    }
  }
}

/**
 * Schedules bounded retry sequence for UI theme updates
 * @param mode Theme mode to apply
 * @param namespace Cal.com namespace
 * @param retryDelaysMs Array of retry delays in milliseconds
 * @returns Function to cancel the retry sequence
 */
function scheduleUiThemeRetries(
  mode: "dark" | "light", 
  namespace: string, 
  retryDelaysMs: number[]
): () => void {
  let currentMode = mode;
  let timeoutIds: number[] = [];
  let cancelled = false;

  const executeRetry = (delay: number, index: number) => {
    if (cancelled) return;
    
    const timeoutId = window.setTimeout(() => {
      if (cancelled) return;
      
      // Check if mode has changed (avoid stale updates)
      const latestMode = getSiteTheme();
      if (latestMode !== currentMode) {
        currentMode = latestMode;
        // Continue with new mode
        sendUiTheme(currentMode, namespace);
      } else {
        sendUiTheme(mode, namespace);
      }
    }, delay);
    
    timeoutIds.push(timeoutId);
  };

  // Execute retries with specified delays
  retryDelaysMs.forEach((delay, index) => {
    executeRetry(delay, index);
  });

  // Return cancel function
  return () => {
    cancelled = true;
    timeoutIds.forEach(id => clearTimeout(id));
    timeoutIds = [];
  };
}

/**
 * Initializes the Theme Bridge singleton for robust theme synchronization
 * @param options Configuration options
 * @returns Theme Bridge instance with dispose method
 */
export function initThemeBridge(options?: {
  namespace?: string;
  containerSelector?: string;
  retryDelaysMs?: number[];
}): { dispose: () => void } {
  const {
    namespace = "columnbed",
    containerSelector = "#cal-inline",
    retryDelaysMs = [0, 16, 50, 100, 200]
  } = options || {};

  // Dispose any existing bridge instance
  if (window[THEME_BRIDGE_SYMBOL]) {
    window[THEME_BRIDGE_SYMBOL]!.dispose();
  }

  let currentMode = getSiteTheme();
  let cancelRetries: (() => void) | null = null;
  let rootObserver: MutationObserver | null = null;
  let containerObserver: MutationObserver | null = null;

  // Send initial theme
  sendUiTheme(currentMode, namespace);

  // Create root observer for theme changes
  rootObserver = new MutationObserver((mutations) => {
    let themeChanged = false;
    
    for (const mutation of mutations) {
      if (mutation.type === "attributes") {
        const target = mutation.target as HTMLElement;
        if (target === document.documentElement) {
          const attributeName = mutation.attributeName;
          if (attributeName === "class" || attributeName === "data-theme") {
            themeChanged = true;
            break;
          }
        }
      }
    }
    
    if (themeChanged) {
      const newMode = getSiteTheme();
      if (newMode !== currentMode) {
        currentMode = newMode;
        
        // Cancel any in-flight retries
        if (cancelRetries) {
          cancelRetries();
        }
        
        // Schedule new retry sequence
        cancelRetries = scheduleUiThemeRetries(currentMode, namespace, retryDelaysMs);
      }
    }
  });

  // Create container observer for iframe (re)mount detection
  containerObserver = new MutationObserver((mutations) => {
    let iframeChanged = false;
    
    for (const mutation of mutations) {
      if (mutation.type === "childList") {
        // Check if any added/removed nodes are iframes
        const addedIframes = Array.from(mutation.addedNodes).some(node => 
          node.nodeType === Node.ELEMENT_NODE && 
          (node as Element).tagName === 'IFRAME'
        );
        const removedIframes = Array.from(mutation.removedNodes).some(node => 
          node.nodeType === Node.ELEMENT_NODE && 
          (node as Element).tagName === 'IFRAME'
        );
        
        if (addedIframes || removedIframes) {
          iframeChanged = true;
          break;
        }
      }
    }
    
    if (iframeChanged) {
      // Cancel any in-flight retries
      if (cancelRetries) {
        cancelRetries();
      }
      
      // Schedule new retry sequence with current theme
      cancelRetries = scheduleUiThemeRetries(currentMode, namespace, retryDelaysMs);
    }
  });

  // Start observing
  rootObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class", "data-theme"]
  });

  const container = document.querySelector(containerSelector);
  if (container) {
    containerObserver.observe(container, {
      childList: true
    });
  }

  // Create bridge instance
  const bridge: ThemeBridge = {
    dispose: () => {
      // Cancel any pending retries
      if (cancelRetries) {
        cancelRetries();
        cancelRetries = null;
      }
      
      // Disconnect observers
      if (rootObserver) {
        rootObserver.disconnect();
        rootObserver = null;
      }
      
      if (containerObserver) {
        containerObserver.disconnect();
        containerObserver = null;
      }
      
      // Clear window reference
      delete window[THEME_BRIDGE_SYMBOL];
    }
  };

  // Store as singleton
  window[THEME_BRIDGE_SYMBOL] = bridge;

  return bridge;
}
