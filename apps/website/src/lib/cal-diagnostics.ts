/**
 * Cal.com diagnostics utility for DEBUG_CAL mode
 */

export function injectCalDiagnostics() {
  if (import.meta.env.DEBUG_CAL !== '1') {
    return;
  }

  // Inject diagnostic script
  const script = document.createElement('script');
  script.textContent = `
    window.__APP_PUBLIC = {
      CAL_USERNAME: '${import.meta.env.PUBLIC_CAL_USERNAME || ''}',
      CAL_EMBED_LINK: '${import.meta.env.PUBLIC_CAL_EMBED_LINK || ''}',
      CAL_EVENTS: '${import.meta.env.PUBLIC_CAL_EVENTS || ''}',
      SITE_URL: '${import.meta.env.PUBLIC_SITE_URL || ''}',
      ENV: '${import.meta.env.PUBLIC_ENV || ''}'
    };
    console.log('🔍 Cal.com Debug Info:', window.__APP_PUBLIC);
  `;
  document.head.appendChild(script);
}

export function createCalDiagnosticPage() {
  if (import.meta.env.DEBUG_CAL !== '1') {
    return null;
  }

  const events = import.meta.env.PUBLIC_CAL_EVENTS 
    ? import.meta.env.PUBLIC_CAL_EVENTS.split(',').map((event: string) => {
        const [slug, label] = event.trim().split('|');
        return { slug: slug?.trim(), label: label?.trim() };
      }).filter((event: any) => event.slug && event.label)
    : [];

  const username = import.meta.env.PUBLIC_CAL_USERNAME || '';
  const baseLink = import.meta.env.PUBLIC_CAL_EMBED_LINK || '';

  return {
    username,
    baseLink,
    events,
    examples: events.map((event: any) => ({
      slug: event.slug,
      label: event.label,
      dataCalLink: `${username}/${event.slug}`,
      overlayUrl: `https://cal.com/${username}/${event.slug}?overlayCalendar=true&layout=month_view`
    }))
  };
}

export function createPublicUrlsDiagnosticPage() {
  if (import.meta.env.DEBUG_CAL !== '1') {
    return null;
  }

  return {
    testUrls: [
      '/my-image.jpeg',
      '/devscard/my-image.jpeg',
      '/uploads/logos/datacom-group-ltd-logo.png',
      '/uploads/placeholders/avatar.svg',
      '/favorites/books/book-1.jpeg',
      '/logos/amazon-web-services-logo.svg.png'
    ]
  };
}
