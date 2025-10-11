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

function cors(origin: string) {
  return {
    'access-control-allow-origin': origin,
    'access-control-allow-methods': 'GET, POST, OPTIONS',
    'access-control-allow-headers': 'Content-Type',
    'access-control-allow-credentials': 'true',
    'vary': 'Origin',
  };
}

export const OPTIONS: APIRoute = async ({ request }) =>
  new Response(null, { status: 204, headers: cors(getOrigin(request)) });

export const GET: APIRoute = async ({ request, cookies }) => {
  const origin = getOrigin(request);
  const base = cors(origin);

  try {
    const url = new URL(request.url);
    const provider = (url.searchParams.get('provider') || 'github').toLowerCase();
    const scope = url.searchParams.get('scope') || 'repo';
    const dry = url.searchParams.get('dry') === '1'; // ← режим диагностики без редиректа

    if (provider !== 'github') {
      return new Response(JSON.stringify({ error: 'Unsupported provider', provider }), {
        status: 400, headers: { ...base, 'content-type': 'application/json' }
      });
    }

    const clientId = process.env.DECAP_GITHUB_CLIENT_ID || process.env.AUTHJS_GITHUB_CLIENT_ID;
    if (!clientId) {
      return new Response(JSON.stringify({
        error: 'Missing GitHub client ID',
        expected: ['DECAP_GITHUB_CLIENT_ID', 'AUTHJS_GITHUB_CLIENT_ID']
      }), { status: 500, headers: { ...base, 'content-type': 'application/json' } });
    }

    const state = makeState();
    // ⚠️ Если куку не видно на /token — проблема не в коде, а в прокси
    cookies.set('decap_oauth_state', state, { httpOnly: true, secure: true, sameSite: 'Lax', path: '/' });

    const redirectUri = `${origin}/api/decap/callback`;
    const authUrl = new URL('https://github.com/login/oauth/authorize');
    authUrl.searchParams.set('client_id', String(clientId));
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('scope', scope);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('response_type', 'code');

    if (dry) {
      // Ничего не редиректим — только показываем, что бы случилось
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
      stack: (e?.stack ? String(e.stack).split('\n').slice(0,4) : null)
    }), { status: 500, headers: { ...base, 'content-type': 'application/json' } });
  }
};
