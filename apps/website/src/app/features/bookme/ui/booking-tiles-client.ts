// apps/website/src/app/features/bookme/ui/booking-tiles-client.ts
// Client controller for tile-driven Cal.com inline re-rendering (bookme-only scope)

import { renderInline } from '../lib/renderInline';
import { getSiteTheme, initThemeBridge } from '../lib/themeSync';

function qs<T extends Element = Element>(sel: string, root: Document | Element = document): T | null {
  return root.querySelector(sel) as T | null;
}
function qsa<T extends Element = Element>(sel: string, root: Document | Element = document): T[] {
  return Array.from(root.querySelectorAll(sel)) as T[];
}

function getCurrentType(): string | null {
  const u = new URL(location.href);
  return u.searchParams.get('type');
}

function setCurrentType(type: string, replace = false) {
  const u = new URL(location.href);
  u.searchParams.set('type', type);
  (replace ? history.replaceState : history.pushState).call(history, null, '', u.toString());
}

function setActiveTile(activeTile: HTMLElement | null) {
  const tiles = qsa<HTMLElement>('.booking-tile');
  tiles.forEach(tile => {
    const isActive = tile === activeTile;
    tile.classList.toggle('active', isActive);
    tile.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });
}

function getEventTypeSlug(calLink: string): string {
  // Extract event type slug from calLink (e.g., "dmitrybond/intro-30m" -> "intro-30m")
  return calLink.split('/').pop() || '';
}

function findTileBySlug(slug: string): HTMLElement | null {
  const tiles = qsa<HTMLElement>('.booking-tile');
  return tiles.find(tile => {
    const calLink = tile.dataset.inlineLink || tile.dataset.calLink || '';
    return getEventTypeSlug(calLink) === slug;
  }) || null;
}

async function applySelection(calLink: string, config?: Record<string, unknown>) {
  const tiles = qsa<HTMLElement>('.booking-tile');
  const targetTile = tiles.find(tile => (tile.dataset.inlineLink || tile.dataset.calLink) === calLink);
  
  if (!targetTile) {
    console.warn('[cal] No tile found for calLink:', calLink);
    return;
  }

  // Update active state
  setActiveTile(targetTile);

  // Update URL with event type slug
  const slug = getEventTypeSlug(calLink);
  setCurrentType(slug);

  // Visual loading hint
  const container = qs<HTMLElement>('#cal-inline');
  container?.classList.add('is-loading');

  try {
    // Render inline embed with fresh container and current theme
    await renderInline(calLink, {
      namespace: 'columnbed',
      selector: '#cal-inline',
      config: config || { hideEventTypeDetails: true },
      ui: { theme: getSiteTheme() }
    });
  } catch (error) {
    console.error('[cal] Failed to render inline embed:', error);
  } finally {
    // Remove loading state
    setTimeout(() => container?.classList.remove('is-loading'), 300);
  }
}

function handleTileClick(tile: HTMLElement) {
  const calLink = tile.dataset.inlineLink || tile.dataset.calLink;
  if (!calLink) {
    console.warn('[cal] No calLink found on tile');
    return;
  }

  // Parse optional config
  let config: Record<string, unknown> = {};
  try {
    const configStr = tile.dataset.inlineConfig || tile.dataset.calConfig;
    if (configStr) {
      config = JSON.parse(configStr);
    }
  } catch (error) {
    console.warn('[cal] Invalid config JSON:', error);
  }

  applySelection(calLink, config);

  // Smooth scroll to embed
  qs('#cal-inline')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function initializeFromUrl() {
  const type = getCurrentType();
  if (type) {
    // Find tile by slug and apply selection
    const tile = findTileBySlug(type);
    if (tile) {
      handleTileClick(tile);
      return;
    }
  }

  // Default to first tile if no type in URL or tile not found
  const firstTile = qs<HTMLElement>('.booking-tile');
  if (firstTile) {
    handleTileClick(firstTile);
  }
}

function sanitizeModalAttributes() {
  // Defensive: neutralize any leftover modal hooks from previous code or HMR
  const bookmeRoot = qs('#cal-section')?.parentElement || document.body;
  const elementsWithCalLink = qsa('[data-cal-link]', bookmeRoot);
  
  elementsWithCalLink.forEach(element => {
    const calLink = element.getAttribute('data-cal-link');
    if (calLink) {
      // Rename to disabled and copy to inline-link
      element.setAttribute('data-cal-link-disabled', calLink);
      element.removeAttribute('data-cal-link');
      
      if (!element.hasAttribute('data-inline-link')) {
        element.setAttribute('data-inline-link', calLink);
      }
    }
  });
}

// Theme Bridge state management
let themeBridge: { dispose: () => void } | null = null;

/**
 * Initializes theme synchronization using Theme Bridge
 */
function initializeThemeSync() {
  // Clean up any existing bridge
  if (themeBridge) {
    themeBridge.dispose();
    themeBridge = null;
  }
  
  // Initialize Theme Bridge
  themeBridge = initThemeBridge({ namespace: "columnbed" });
}

function bind() {
  // Sanitize any leftover modal attributes
  sanitizeModalAttributes();

  // Initialize theme sync (will wait for Cal bootstrap if needed)
  initializeThemeSync();

  // Initial state from URL or default
  initializeFromUrl();

  // Click handlers with capture phase to preempt third-party handlers
  document.addEventListener('click', (e) => {
    const tile = (e.target as Element)?.closest?.('.booking-tile') as HTMLElement | null;
    if (!tile) return;
    
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    handleTileClick(tile);
  }, true); // Use capture phase

  // Keyboard handlers
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    
    const tile = (e.target as Element)?.closest?.('.booking-tile') as HTMLElement | null;
    if (!tile) return;
    
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    handleTileClick(tile);
  }, true); // Use capture phase

  // Back/forward navigation
  window.addEventListener('popstate', () => {
    initializeFromUrl();
  });
}

// Initialize on page load and HMR with Cal bootstrap readiness
document.addEventListener('astro:page-load', async () => {
  // Wait for Cal bootstrap to be ready before initializing theme sync
  if (typeof window !== 'undefined' && window.Cal && typeof window.Cal === 'function') {
    // Small delay to ensure Cal is fully initialized
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  bind();
}, { once: true });

// Fallback for direct script execution
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', async () => {
    // Wait for Cal bootstrap to be ready before initializing theme sync
    if (typeof window !== 'undefined' && window.Cal && typeof window.Cal === 'function') {
      // Small delay to ensure Cal is fully initialized
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    bind();
  }, { once: true });
} else {
  // For immediate execution, still wait a bit for Cal
  setTimeout(bind, 100);
}