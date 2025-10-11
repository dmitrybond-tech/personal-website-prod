import type { APIRoute } from 'astro';
import { randomUUID as nodeRandomUUID } from 'node:crypto';
import { computeOrigin, cors } from '@/utils/decapOrigin';

export const prerender = false;

function makeState(): string {
  try { if (globalThis.crypto && 'randomUUID' in globalThis.crypto) return globalThis.crypto.randomUUID(); } catch {}
  try { return nodeRandomUUID(); } catch {}
  // last-resort
  return (Math.random().toString(36).slice(2) + Date.now().toString(36)).padEnd(32, 'x');
}

export const OPTIONS: APIRoute = async ({ request }) =>
  new Response(null, { status: 204, headers: cors(computeOrigin(request)) });

export const GET: APIRoute = async ({ request, cookies }) => {
  const origin = computeOrigin(request);
  const base = cors(origin);

  try {
    const url = new URL(request.url);
    const provider = (url.searchParams.get('provider') || 'github').toLowerCase();
    const scope = url.searchParams.get('scope') || 'repo';
    const dry = url.searchParams.get('dry') === '1'; // ← diagnostic mode without redirect

    if (provider !== 'github') {
      return new Response(JSON.stringify({ error: 'Unsupported provider', provider }), {
        status: 400, headers: { ...base, 'content-type': 'application/json' }
      });
    }

    const clientId = process.env.DECAP_GITHUB_CLIENT_ID || process.env.AUTHJS_GITHUB_CLIENT_ID;
    if (!clientId) {
      // Log warning if using fallback
      if (process.env.AUTHJS_GITHUB_CLIENT_ID && !process.env.DECAP_GITHUB_CLIENT_ID) {
        console.warn('[DECAP] Using AUTHJS_GITHUB_CLIENT_ID as fallback. Consider setting DECAP_GITHUB_CLIENT_ID.');
      }
      return new Response(JSON.stringify({
        error: 'Missing GitHub client ID',
        expected: ['DECAP_GITHUB_CLIENT_ID', 'AUTHJS_GITHUB_CLIENT_ID']
      }), { status: 500, headers: { ...base, 'content-type': 'application/json' } });
    }

    const state = makeState();
    // ⚠️ If cookie is not visible on /token — problem is in proxy, not code
    cookies.set('decap_oauth_state', state, { httpOnly: true, secure: true, sameSite: 'lax', path: '/' });

    const redirectUri = `${origin}/api/decap/callback`;
    const authUrl = new URL('https://github.com/login/oauth/authorize');
    authUrl.searchParams.set('client_id', String(clientId));
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('scope', scope);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('response_type', 'code');

    if (dry) {
      // Don't redirect — just show what would happen
      const echo = {
        ok: true,
        dryRun: true,
        origin,
        provider,
        scope,
        wouldRedirectTo: authUrl.toString().slice(0, 200) + '...',
        cookieSet: true,
        headers: {
          hasXfp: Boolean(request.headers.get('x-forwarded-proto')),
          hasXfh: Boolean(request.headers.get('x-forwarded-host')),
        }
      };
      return new Response(JSON.stringify(echo), { status: 200, headers: { ...base, 'content-type': 'application/json' } });
    }

    return Response.redirect(authUrl.toString(), 302);
  } catch (e: any) {
    return new Response(JSON.stringify({
      error: 'entry_route_failed',
      details: String(e?.message || e),
      stack: (e?.stack ? String(e.stack).split('\n').slice(0, 4) : null)
    }), { status: 500, headers: { ...base, 'content-type': 'application/json' } });
  }
};
