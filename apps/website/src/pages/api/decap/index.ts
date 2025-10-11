import type { APIRoute } from 'astro';
import { randomUUID as nodeRandomUUID } from 'node:crypto';
import { computeOrigin, cors } from '../../../utils/decapOrigin.js';

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
    
    const redirectUri = `${origin}/api/decap/callback`;
    const authUrl = new URL('https://github.com/login/oauth/authorize');
    authUrl.searchParams.set('client_id', String(clientId));
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('scope', scope);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('response_type', 'code');

    // Defensive logging
    const forcedOrigin = process.env.DECAP_ORIGIN;
    console.info('[DECAP] OAuth entry:', {
      forcedOrigin: forcedOrigin || '(none)',
      finalOrigin: origin,
      locationLength: authUrl.toString().length,
      statePrefix: state.slice(0, 8),
      dry: url.searchParams.get('dry') === '1'
    });

    if (dry) {
      // Dry-run mode: use cookies.set for diagnostic purposes
      // ⚠️ The 302 branch uses manual Set-Cookie by design because some proxies/runtime
      // combinations drop cookies on Response.redirect
      cookies.set('decap_oauth_state', state, { httpOnly: true, secure: true, sameSite: 'lax', path: '/' });
      
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

    // Normal path: manual 302 redirect with explicit Set-Cookie header
    // ⚠️ Do NOT use Response.redirect or cookies.set here — some proxies drop cookies on redirects
    const setCookie = `decap_oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax`;
    return new Response(null, {
      status: 302,
      headers: {
        'Location': authUrl.toString(),
        ...base,
        'Set-Cookie': setCookie,
        'Content-Type': 'text/plain; charset=utf-8',
      }
    });
  } catch (e: any) {
    return new Response(JSON.stringify({
      error: 'entry_route_failed',
      details: String(e?.message || e),
      stack: (e?.stack ? String(e.stack).split('\n').slice(0, 4) : null)
    }), { status: 500, headers: { ...base, 'content-type': 'application/json' } });
  }
};
