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
