import type { MiddlewareHandler } from 'astro';

export const onRequest: MiddlewareHandler = (context, next) => {
  return next().then(response => {
    const { url } = context;
    
    // Add security headers for admin pages
    if (url.pathname.startsWith('/website-admin/')) {
      response.headers.set('X-Frame-Options', 'DENY');
      response.headers.set('X-Content-Type-Options', 'nosniff');
      response.headers.set('X-XSS-Protection', '1; mode=block');
      response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    }
    
    // Add CORS headers for OAuth endpoints
    if (url.pathname.startsWith('/api/decap')) {
      response.headers.set('Access-Control-Allow-Origin', url.origin);
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    }
    
    return response;
  });
};