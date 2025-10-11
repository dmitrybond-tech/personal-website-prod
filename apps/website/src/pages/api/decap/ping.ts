// apps/website/src/pages/api/decap/ping.ts
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ cookies }) => {
  cookies.set('decap_test_cookie', 'ok', { httpOnly: true, secure: true, sameSite: 'Lax', path: '/' });
  return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } });
};

