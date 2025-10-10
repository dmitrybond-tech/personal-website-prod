/**
 * Cal.com utility functions for parsing events and building proper embed links
 */

export interface CalEvent {
  slug: string;
  label: string;
}

/**
 * Parses Cal.com events string format: 'slug|Title,slug2|Title2'
 * @param env - Environment string from PUBLIC_CAL_EVENTS
 * @returns Array of parsed events
 */
export function parseCalEvents(env: string): CalEvent[] {
  if (!env) return [];
  
  return env.split(',').map(event => {
    const [slug, label] = event.trim().split('|');
    return { 
      slug: slug?.trim() || '', 
      label: label?.trim() || '' 
    };
  }).filter(event => event.slug && event.label);
}

/**
 * Builds proper Cal.com data-cal-link format: 'username/slug'
 * @param base - Base URL like 'https://cal.com/username'
 * @param slug - Event slug
 * @returns Formatted cal link
 */
export function makeCalDataLink(base: string, slug: string): string {
  const username = extractUsernameFromBase(base);
  return `${username}/${slug}`;
}

/**
 * Extracts username from Cal.com base URL
 * @param base - Base URL like 'https://cal.com/username'
 * @returns Username part
 */
export function extractUsernameFromBase(base: string): string {
  if (!base) return '';
  
  // Handle both https://cal.com/username and just username formats
  const match = base.match(/(?:https?:\/\/)?(?:cal\.com\/)?([^\/\?]+)/);
  return match ? match[1] : '';
}

/**
 * Builds full Cal.com URL for overlay calendar
 * @param base - Base URL like 'https://cal.com/username'
 * @param slug - Event slug
 * @returns Full Cal.com URL
 */
export function buildCalOverlayUrl(base: string, slug: string): string {
  const username = extractUsernameFromBase(base);
  return `https://cal.com/${username}/${slug}?overlayCalendar=true&layout=month_view`;
}

/**
 * Creates a proper Cal.com inline embed URL with build-time environment variables
 * @param eventSlug - Event slug (e.g., "intro-30m")
 * @returns Complete Cal.com URL for inline embed
 */
export function calInlineHref(eventSlug: string): string {
  // For Astro/Vite: use import.meta.env for public env vars (build-time)
  const env = typeof import !== 'undefined' && import.meta?.env ? import.meta.env : {};
  
  // Fallback to process.env for SSR (build-time)
  const processEnv = typeof process !== 'undefined' ? process.env : {};
  
  const username = 
    (env?.PUBLIC_CAL_USERNAME as string | undefined) ||
    (processEnv?.PUBLIC_CAL_USERNAME as string | undefined) ||
    '';

  // Debug logging to help troubleshoot environment variables
  if (typeof window !== 'undefined') {
    console.log('[cal] Environment variables debug:', {
      hasImportMeta: !!import.meta?.env,
      hasProcessEnv: typeof process !== 'undefined',
      username: username,
      eventSlug: eventSlug,
      importMetaEnv: import.meta?.env ? {
        PUBLIC_CAL_USERNAME: import.meta.env.PUBLIC_CAL_USERNAME,
        PUBLIC_CAL_EMBED_LINK: import.meta.env.PUBLIC_CAL_EMBED_LINK,
        PUBLIC_CAL_EVENTS: import.meta.env.PUBLIC_CAL_EVENTS,
      } : 'not available',
      processEnv: typeof process !== 'undefined' ? {
        PUBLIC_CAL_USERNAME: process.env.PUBLIC_CAL_USERNAME,
        PUBLIC_CAL_EMBED_LINK: process.env.PUBLIC_CAL_EMBED_LINK,
        PUBLIC_CAL_EVENTS: process.env.PUBLIC_CAL_EVENTS,
      } : 'not available'
    });
  }

  // If username is empty, return empty string (component will decide whether to show anything)
  if (!username) {
    console.warn('[cal] PUBLIC_CAL_USERNAME is not set, cannot generate Cal.com inline URL');
    console.warn('[cal] Available env vars:', { env, processEnv });
    return '';
  }

  // Base URL for Cal inline embeds is cal.com, not app.cal.com
  // Must include /{username}/{event}
  const base = 'https://cal.com';
  const url = `${base}/${username}/${eventSlug}?embedType=inline&layout=month_view&hideEventTypeDetails=false`;
  
  console.log('[cal] Generated Cal.com URL:', url);
  return url;
}
