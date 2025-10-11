import type { APIRoute } from 'astro';

export const prerender = false;

/**
 * Defensive redirect: /website-admin/api/decap/token → /api/decap/token
 * Preserves query string and HTTP method (important for POST)
 * Uses 307 to preserve request body for POST requests
 */
function buildRedirect(request: Request, targetPath: string): Response {
  const sourceUrl = new URL(request.url);
  const targetUrl = new URL(targetPath, sourceUrl.origin);
  
  // Preserve all query parameters
  sourceUrl.searchParams.forEach((value, key) => {
    targetUrl.searchParams.set(key, value);
  });
  
  return Response.redirect(targetUrl.toString(), 307);
}

export const OPTIONS: APIRoute = ({ request }) => {
  return new Response(null, { 
    status: 204,
    headers: {
      'access-control-allow-origin': new URL(request.url).origin,
      'access-control-allow-methods': 'GET, POST, OPTIONS',
      'access-control-allow-headers': 'Content-Type',
    }
  });
};

export const GET: APIRoute = ({ request }) => {
  return buildRedirect(request, '/api/decap/token');
};

export const POST: APIRoute = ({ request }) => {
  return buildRedirect(request, '/api/decap/token');
};
