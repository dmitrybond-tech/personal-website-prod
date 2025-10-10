/**
 * Cal.com inline embed utility functions
 */

/**
 * Creates a proper Cal.com inline embed URL
 * @param username - Cal.com username from PUBLIC_CAL_USERNAME
 * @param eventSlug - Event slug (e.g., "intro-30m")
 * @param options - Additional URL parameters
 * @returns Complete Cal.com URL for inline embed
 */
export function makeCalInlineUrl(
  username: string, 
  eventSlug: string, 
  options: {
    embedType?: 'inline' | 'overlay';
    layout?: 'month_view' | 'week_view' | 'list_view';
    hideEventTypeDetails?: boolean;
    hideTimeZone?: boolean;
  } = {}
): string {
  if (!username || !eventSlug) {
    return '';
  }

  const {
    embedType = 'inline',
    layout = 'month_view',
    hideEventTypeDetails = false,
    hideTimeZone = false
  } = options;

  const params = new URLSearchParams({
    embedType,
    layout,
    hideEventTypeDetails: hideEventTypeDetails.toString(),
    hideTimeZone: hideTimeZone.toString()
  });

  return `https://cal.com/${username}/${eventSlug}?${params.toString()}`;
}

/**
 * Creates a data-cal-link format for Cal.com embed
 * @param username - Cal.com username
 * @param eventSlug - Event slug
 * @returns data-cal-link format string
 */
export function makeCalDataLink(username: string, eventSlug: string): string {
  if (!username || !eventSlug) {
    return '';
  }
  return `${username}/${eventSlug}`;
}

/**
 * Gets Cal.com configuration from environment
 * @returns Cal.com configuration object
 */
export function getCalConfig() {
  // For Astro/Vite, use import.meta.env for public env vars
  const env = typeof import !== 'undefined' && import.meta?.env ? import.meta.env : {};
  
  // Fallback to process.env for SSR (build-time)
  const processEnv = typeof process !== 'undefined' ? process.env : {};
  
  const username = env.PUBLIC_CAL_USERNAME || processEnv.PUBLIC_CAL_USERNAME || '';
  const embedLink = env.PUBLIC_CAL_EMBED_LINK || processEnv.PUBLIC_CAL_EMBED_LINK || '';
  const events = env.PUBLIC_CAL_EVENTS || processEnv.PUBLIC_CAL_EVENTS || '';

  // Debug logging to help troubleshoot environment variables
  if (typeof window !== 'undefined') {
    console.log('[cal-config] Environment variables debug:', {
      hasImportMeta: !!import.meta?.env,
      hasProcessEnv: typeof process !== 'undefined',
      username: username,
      embedLink: embedLink,
      events: events,
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

  const config = {
    username,
    embedLink,
    events,
    hasUsername: !!username,
    hasEmbedLink: !!embedLink,
    hasEvents: !!events
  };

  console.log('[cal-config] Final configuration:', config);
  return config;
}
