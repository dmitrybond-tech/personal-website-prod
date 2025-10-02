import type { MiddlewareHandler } from 'astro';

const DEV = process.env.NODE_ENV !== 'production';

export const onRequest: MiddlewareHandler = (context, next) => {
  const { url, request } = context;
  const path = url.pathname;

  if (DEV) console.log(`[MW] ${request.method} ${path}`);

  // Log admin asset requests for debugging
  if (DEV && path === '/website-admin/vendor/decap-cms.js') {
    console.log('[MW] GET /website-admin/vendor/decap-cms.js');
  }

  // Block Auth.js interference in admin flow
  if (path.startsWith('/api/auth/')) {
    const ref = request.headers.get('referer') || '';
    if (ref.includes('/website-admin') || ref.includes('/oauth')) {
      console.warn('[MW][BLOCK] /api/auth/* called from admin flow');
      return new Response('Decap uses OAuth App; /api/auth/* disabled for admin.', { status: 409 });
    }
    if (DEV) console.log('[MW] bypass /api/auth'); 
    return next(); 
  }
  if (path.startsWith('/oauth'))     { if (DEV) console.log('[MW] bypass /oauth'); return next(); }
  if (path === '/api/website-admin/config.yml') { if (DEV) console.log('[MW] bypass admin config API'); return next(); }

  // i18n-safe redirect config.yml
  if (/^\/[A-Za-z0-9_-]+\/website-admin\/config\.yml$/.test(path)) {
    if (DEV) console.log('[MW] redirect localized config.yml → /api/website-admin/config.yml');
    return Response.redirect(new URL('/api/website-admin/config.yml', url).toString(), 302);
  }

  // после твоего auth-гейта (если он есть) — принудительно статический index.html
  const segs = path.split('/').filter(Boolean);
  const isAdminRoot =
    (segs.length === 1 && segs[0] === 'website-admin') ||
    (segs.length === 2 && segs[1] === 'website-admin');

  if (isAdminRoot) {
    const to = new URL('/website-admin/index.html', url);
    for (const [k, v] of url.searchParams) to.searchParams.set(k, v);
    if (DEV) console.log('[MW] redirect admin root → /website-admin/index.html');
    return Response.redirect(to.toString(), 302);
  }

  return next();
};