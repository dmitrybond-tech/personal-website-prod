import type { APIRoute } from 'astro';

export const prerender = false;

/**
 * Compatibility endpoint for /api/decap/authorize
 * Redirects to the canonical OAuth handler at /api/decap/oauth/authorize
 * preserving all query parameters.
 */
export const GET: APIRoute = async ({ url }) => {
  // Build redirect URL to canonical OAuth handler
  const redirectUrl = new URL('./oauth/authorize', url);
  
  // Preserve all query parameters from original request
  url.searchParams.forEach((value, key) => {
    redirectUrl.searchParams.set(key, value);
  });

  return new Response(null, {
    status: 302,
    headers: {
      'Location': redirectUrl.toString(),
      'Cache-Control': 'no-store'
    }
  });
};

