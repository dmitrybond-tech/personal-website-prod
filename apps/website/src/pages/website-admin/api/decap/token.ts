import type { APIRoute } from 'astro';

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

export const ALL: APIRoute = ({ request }) => {
  return buildRedirect(request, '/api/decap/token');
};

