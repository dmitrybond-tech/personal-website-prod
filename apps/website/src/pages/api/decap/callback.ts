import type { APIRoute } from 'astro';

export const prerender = false;

/**
 * Compatibility endpoint for /api/decap/callback
 * Redirects to the canonical OAuth callback handler at /api/decap/oauth/callback
 * preserving all query parameters (code, state, error, etc.).
 */
export const GET: APIRoute = async ({ url }) => {
  // Build redirect URL to canonical OAuth callback handler
  const redirectUrl = new URL('./oauth/callback', url);
  
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

