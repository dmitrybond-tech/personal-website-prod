import type { APIRoute } from 'astro';
import { randomUUID as nodeRandomUUID } from 'node:crypto';

function makeState(): string {
  try { if (globalThis.crypto && 'randomUUID' in globalThis.crypto) return globalThis.crypto.randomUUID(); } catch {}
  try { return nodeRandomUUID(); } catch {}
  // last-resort
  return (Math.random().toString(36).slice(2) + Date.now().toString(36)).padEnd(32, 'x');
}

function getOrigin(req: Request) {
  const url = new URL(req.url);
  const proto = (req.headers.get('x-forwarded-proto') || url.protocol.replace(':','')).toLowerCase();
  const host  = req.headers.get('x-forwarded-host')  || url.host;
  return `${proto}://${host}`;
}

function corsHeaders(origin: string) {
  return {
    'access-control-allow-origin': origin,
    'access-control-allow-methods': 'GET, POST, OPTIONS',
    'access-control-allow-headers': 'Content-Type',
  };
}

export const OPTIONS: APIRoute = async ({ request }) =>
  new Response(null, { status: 204, headers: corsHeaders(getOrigin(request)) });

export const GET: APIRoute = async ({ request, cookies }) => {
  const origin = getOrigin(request);
  const headers = corsHeaders(origin);

  try {
    const url = new URL(request.url);
    const provider = (url.searchParams.get('provider') || 'github').toLowerCase();
    const scope = url.searchParams.get('scope') || 'repo';

    if (provider !== 'github') {
      return new Response(JSON.stringify({ error: 'Unsupported provider', provider }), {
        status: 400, headers: { ...headers, 'content-type': 'application/json' },
      });
    }

    const clientId =
      process.env.DECAP_GITHUB_CLIENT_ID || process.env.AUTHJS_GITHUB_CLIENT_ID;

    if (!clientId) {
      return new Response(JSON.stringify({
        error: 'Missing GitHub client ID',
        expected: ['DECAP_GITHUB_CLIENT_ID', 'AUTHJS_GITHUB_CLIENT_ID'],
      }), { status: 500, headers: { ...headers, 'content-type': 'application/json' } });
    }

    const state = makeState();
    // HttpOnly cookie so token exchange can verify state
    cookies.set('decap_oauth_state', state, {
      httpOnly: true, secure: true, sameSite: 'Lax', path: '/',
    });

    const redirectUri = `${origin}/api/decap/callback`;
    const authUrl = new URL('https://github.com/login/oauth/authorize');
    authUrl.searchParams.set('client_id', String(clientId));
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('scope', scope);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('response_type', 'code');

    return Response.redirect(authUrl.toString(), 302);
  } catch (e: any) {
    return new Response(JSON.stringify({
      error: 'entry_route_failed',
      details: String(e?.message || e),
    }), { status: 500, headers: { ...headers, 'content-type': 'application/json' } });
  }
};
