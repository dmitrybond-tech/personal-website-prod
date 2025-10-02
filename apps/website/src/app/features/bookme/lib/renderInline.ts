// apps/website/src/app/features/bookme/lib/renderInline.ts
// Local, idempotent Cal.com inline renderer for bookme pages only

/**
 * Ensures Cal.com bootstrap is loaded and ready for the given namespace
 */
export async function ensureCalLoaded(namespace: string): Promise<void> {
  return new Promise((resolve) => {
    // Check if Cal is already available for this namespace
    if (window.Cal && window.Cal.ns && window.Cal.ns[namespace]) {
      resolve();
      return;
    }

    // Wait for Cal to be available
    const checkCal = () => {
      if (window.Cal && window.Cal.ns && window.Cal.ns[namespace]) {
        resolve();
      } else {
        setTimeout(checkCal, 50);
      }
    };

    // Initialize Cal with namespace if not already done
    if (!window.Cal) {
      console.warn('[cal] Cal bootstrap not found, ensure it\'s loaded on the page');
      resolve(); // Continue anyway, Cal might load later
      return;
    }

    // Initialize namespace if needed
    if (!window.Cal.ns || !window.Cal.ns[namespace]) {
      window.Cal('init', namespace);
    }

    checkCal();
  });
}

/**
 * Replaces the container element with a fresh node to avoid iframe leftovers
 */
export function replaceWithFreshContainer(selector: string): HTMLElement {
  const container = document.querySelector(selector) as HTMLElement;
  if (!container) {
    throw new Error(`Container not found: ${selector}`);
  }

  // Create a fresh container with the same attributes
  const freshContainer = document.createElement('div');
  freshContainer.id = container.id;
  freshContainer.className = container.className;
  
  // Copy data attributes
  Array.from(container.attributes).forEach(attr => {
    if (attr.name.startsWith('data-')) {
      freshContainer.setAttribute(attr.name, attr.value);
    }
  });

  // Replace the old container
  container.parentNode?.replaceChild(freshContainer, container);
  
  return freshContainer;
}

/**
 * Renders Cal.com inline embed with idempotent behavior
 */
export async function renderInline(
  calLink: string,
  opts: {
    namespace: string;
    selector?: string;
    config?: Record<string, unknown>;
    ui?: Record<string, unknown>;
  }
): Promise<void> {
  const { namespace, selector = '#cal-inline', config = {}, ui = {} } = opts;

  try {
    // Ensure Cal is loaded for this namespace
    await ensureCalLoaded(namespace);

    // Replace container to avoid iframe leftovers
    const container = replaceWithFreshContainer(selector);

    // Apply UI configuration if provided
    if (Object.keys(ui).length > 0) {
      window.Cal('ui', { ...ui, namespace });
    }

    // Render the inline embed
    window.Cal('inline', {
      elementOrSelector: container,
      calLink,
      config,
      namespace
    });

    console.debug('[cal] Inline embed rendered:', { calLink, namespace });
  } catch (error) {
    console.error('[cal] Failed to render inline embed:', error);
  }
}

// Cal global declaration is handled in src/types/ambient.d.ts
