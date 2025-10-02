// Cal.com configuration
export const CAL_CONFIG = {
  username: import.meta.env.PUBLIC_CAL_USERNAME || 'dmitrybond',
  baseUrl: import.meta.env.PUBLIC_CAL_EMBED_LINK || 'https://cal.com/dmitrybond',
  events: import.meta.env.PUBLIC_CAL_EVENTS || 'tech-90m|Tech 90m,intro-30m|Intro 30m,quick-15m|Quick 15m'
};

export const CAL_EVENT_TYPES = CAL_CONFIG.events
  .split(',')
  .map((event: string) => {
    const [slug, label] = event.trim().split('|');
    return { slug: slug?.trim(), label: label?.trim() };
  })
  .filter((event: { slug?: string; label?: string }) => event.slug && event.label);
