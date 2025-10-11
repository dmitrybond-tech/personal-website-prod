import type { APIRoute } from 'astro';

export const prerender = false;

/**
 * Simple ping endpoint to test cookie setting
 * GET /api/decap/ping
 */
export const GET: APIRoute = async ({ cookies }) => {
  cookies.set('decap_test_cookie', 'ok', { httpOnly: true, secure: true, sameSite: 'lax', path: '/' });
  return new Response(JSON.stringify({ ok: true }), { 
    headers: { 
      'content-type': 'application/json',
      'cache-control': 'no-cache'
    } 
  });
};
