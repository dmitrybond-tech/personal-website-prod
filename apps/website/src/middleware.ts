import type { MiddlewareHandler } from 'astro';

const DEV = process.env.NODE_ENV !== 'production';

// i18n configuration
const SUPPORTED_LOCALES = ['en', 'ru'] as const;
const DEFAULT_LOCALE = 'en';

// GitHub repository configuration for dev asset fallback
const GITHUB_OWNER = 'dmitrybond-tech';
const GITHUB_REPO = 'personal-website-dev';
const GITHUB_BRANCH = 'main';

// MIME type mapping for common image formats
const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function getMimeType(path: string): string {
  const ext = path.toLowerCase().substring(path.lastIndexOf('.'));
  return MIME_TYPES[ext] || 'application/octet-stream';
}

export const onRequest: MiddlewareHandler = async (context, next) => {
  const { url, request } = context;
  const path = url.pathname;

  if (DEV) console.log(`[MW] ${request.method} ${path}`);

  // System paths that should bypass i18n redirects
  const SYSTEM_PATHS = [
    '/website-admin',
    '/admin',
    '/api',
    '/oauth',
    '/auth',
    '/favicon',
    '/robots.txt',
    '/sitemap',
    '/assets',
    '/fonts',
    '/images',
    '/public',
    '/uploads',
    '/logos',
    '/devscard'
  ];

  // Check if path should bypass i18n redirect
  const shouldBypassI18n = SYSTEM_PATHS.some(systemPath => path.startsWith(systemPath));

  // i18n routing: redirect bare paths and non-localized paths to default locale
  if (!shouldBypassI18n && (path === '/' || (!SUPPORTED_LOCALES.includes(path.split('/')[1] as any)))) {
    const redirectPath = path === '/' ? `/${DEFAULT_LOCALE}/` : `/${DEFAULT_LOCALE}${path}`;
    const redirectUrl = new URL(redirectPath, url);
    
    // Preserve query parameters
    for (const [key, value] of url.searchParams) {
      redirectUrl.searchParams.set(key, value);
    }
    
    if (DEV) console.log(`[MW] i18n redirect: ${path} → ${redirectUrl.pathname}`);
    return Response.redirect(redirectUrl.toString(), 302);
  }

  // Dev uploads proxy: if static file returns 404, proxy to GitHub
  if (DEV && path.startsWith('/uploads/')) {
    try {
      // First, try to serve the static file
      const response = await next();
      
      // If static file exists (status 200), return it
      if (response.status === 200) {
        if (DEV) console.log(`[MW] Static file found: ${path}`);
        return response;
      }
      
      // If static file not found (404), proxy to GitHub
      if (response.status === 404) {
        const githubUrl = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/apps/website/public${path}`;
        
        if (DEV) console.log(`[MW] Proxying to GitHub: ${githubUrl}`);
        
        try {
          const githubResponse = await fetch(githubUrl);
          
          if (githubResponse.ok) {
            const contentType = getMimeType(path);
            const buffer = await githubResponse.arrayBuffer();
            
            return new Response(buffer, {
              status: 200,
              headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
              },
            });
          } else {
            if (DEV) console.log(`[MW] GitHub proxy failed: ${githubResponse.status}`);
            return new Response('File not found', { status: 404 });
          }
        } catch (error) {
          if (DEV) console.error(`[MW] GitHub proxy error:`, error);
          return new Response('Proxy error', { status: 500 });
        }
      }
      
      return response;
    } catch (error) {
      if (DEV) console.error(`[MW] Uploads proxy error:`, error);
      return new Response('Internal error', { status: 500 });
    }
  }

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

  // Canonical admin redirect (single hop)
  if (path === '/website-admin' || path === '/website-admin/') {
    const to = new URL('/website-admin/index.html', url);
    for (const [k, v] of url.searchParams) to.searchParams.set(k, v);
    if (DEV) console.log('[MW] redirect admin root → /website-admin/index.html');
    return new Response(null, {
      status: 302,
      headers: {
        'Location': to.toString(),
        'Cache-Control': 'no-store'
      }
    });
  }

  return next();
};