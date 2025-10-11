import type { APIRoute } from 'astro';

/**
 * Defensive redirect: /website-admin/api/decap/callback → /api/decap/callback
 * Preserves query string (code, state, etc.)
 * Uses 307 to preserve HTTP method
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

export const GET: APIRoute = ({ request }) => {
  return buildRedirect(request, '/api/decap/callback');
};

