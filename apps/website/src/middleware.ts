import type { MiddlewareHandler } from 'astro';

/**
 * Static asset prefixes that should bypass SSR and i18n logic.
 * These paths are served directly by the Node adapter with optimized cache headers.
 * 
 * @see src/server/static-headers.ts for Node adapter cache configuration
 * @see SSR_CACHE_POLICY.md for caching strategy documentation
 */
const STATIC_ASSET_PREFIXES = /^\/(?:_astro|assets|fonts|uploads|favicon\.ico|robots\.txt|sitemap\.xml|manifest\.webmanifest)\b/;

/**
 * Determines cache policy based on request path and response type.
 */
function getCacheControl(pathname: string, contentType: string): string | null {
  // Immutable hashed assets (_astro, fonts)
  if (pathname.startsWith('/_astro/') || pathname.startsWith('/fonts/')) {
    return 'public, max-age=31536000, immutable';
  }
  
  // User-uploaded content (uploads) - shorter cache
  if (pathname.startsWith('/uploads/')) {
    return 'public, max-age=86400'; // 1 day, adjustable
  }
  
  // Static assets (favicons, manifests, etc.)
  if (STATIC_ASSET_PREFIXES.test(pathname)) {
    return 'public, max-age=86400';
  }
  
  // HTML responses - never cache
  if (contentType.includes('text/html')) {
    return 'no-store, max-age=0, must-revalidate';
  }
  
  // API endpoints - never cache
  if (pathname.startsWith('/api/')) {
    return 'no-store, max-age=0, must-revalidate';
  }
  
  return null; // Let Astro handle other cases
}

export const onRequest: MiddlewareHandler = (context, next) => {
  const { url } = context;
  const { pathname } = url;
  
  // Fast-path: Static assets bypass all middleware logic
  // Let Astro's Node adapter serve them directly with proper MIME types
  if (STATIC_ASSET_PREFIXES.test(pathname)) {
    return next().then(response => {
      const contentType = response.headers.get('content-type') || '';
      const cache = getCacheControl(pathname, contentType);
      
      if (cache) {
        // Ensure single Cache-Control header (replace if exists)
        response.headers.set('Cache-Control', cache);
      }
      
      // Ensure correct MIME types for critical assets
      if (pathname.endsWith('.css') && !contentType.includes('text/css')) {
        response.headers.set('Content-Type', 'text/css; charset=utf-8');
      } else if (pathname.endsWith('.woff2') && !contentType.includes('font')) {
        response.headers.set('Content-Type', 'font/woff2');
      } else if (pathname.endsWith('.js') && !contentType.includes('javascript')) {
        response.headers.set('Content-Type', 'application/javascript; charset=utf-8');
      }
      
      return response;
    });
  }
  
  // Process all other requests (HTML, API, etc.)
  return next().then(response => {
    const contentType = response.headers.get('content-type') || '';
    
    // Content Security Policy for HTML
    if (contentType.includes('text/html')) {
      response.headers.set('Content-Security-Policy', [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://api.iconify.design",
        "style-src 'self' 'unsafe-inline'",
        "font-src 'self' data:",
        "img-src 'self' data: https:",
        "connect-src 'self' https://api.iconify.design",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'"
      ].join('; '));
    }
    
    // Admin pages: strict security + no-cache
    if (pathname.startsWith('/website-admin/')) {
      response.headers.set('X-Frame-Options', 'DENY');
      response.headers.set('X-Content-Type-Options', 'nosniff');
      response.headers.set('X-XSS-Protection', '1; mode=block');
      response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    }
    
    // OAuth endpoints: CORS + no-cache
    else if (pathname.startsWith('/api/decap')) {
      response.headers.set('Access-Control-Allow-Origin', url.origin);
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
      response.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
    }
    
    // General cache policy for HTML and API
    else {
      const cache = getCacheControl(pathname, contentType);
      if (cache) {
        response.headers.set('Cache-Control', cache);
      }
    }
    
    return response;
  });
};