import type { APIRoute } from 'astro';

/**
 * Health check endpoint for Decap OAuth backend
 * GET /api/decap/health
 * Returns 200 OK with timestamp
 */

export const GET: APIRoute = () => {
  return new Response(
    JSON.stringify({ 
      ok: true, 
      ts: Date.now(),
      service: 'decap-oauth'
    }), 
    { 
      status: 200,
      headers: { 
        'content-type': 'application/json',
        'cache-control': 'no-cache'
      }
    }
  );
};

