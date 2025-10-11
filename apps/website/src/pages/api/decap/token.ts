import type { APIRoute } from 'astro';
import { computeOrigin, cors } from '../../../utils/decapOrigin.js';

export const prerender = false;

function parseCookieHeader(raw: string | null) {
  if (!raw) return {};
  return raw.split(';').reduce<Record<string,string>>((acc, part) => {
    const [k, ...rest] = part.trim().split('=');
    if (!k) return acc;
    acc[k] = decodeURIComponent(rest.join('=') || '');
    return acc;
  }, {});
}

export const OPTIONS: APIRoute = async ({ request }) =>
  new Response(null, { status: 204, headers: cors(computeOrigin(request)) });

export const POST: APIRoute = async ({ request, cookies }) => {
  const origin = computeOrigin(request);
  const baseHeaders = { ...cors(origin), 'content-type': 'application/json' };

  try {
    const ct = request.headers.get('content-type') || '';

    // body: accept JSON or x-www-form-urlencoded
    let code = '';
    let bodyState = '';
    if (ct.includes('application/json')) {
      const data = await request.json().catch(() => ({} as any));
      code = (data?.code ?? '').toString();
      bodyState = (data?.state ?? '').toString();
    } else if (ct.includes('application/x-www-form-urlencoded')) {
      const txt = await request.text();
      const sp = new URLSearchParams(txt);
      code = sp.get('code') || '';
      bodyState = sp.get('state') || '';
    } else {
      // try as JSON but don't fail
      try {
        const data = await request.json();
        code = (data?.code ?? '').toString();
        bodyState = (data?.state ?? '').toString();
      } catch {/* noop */}
    }

    // cookie state (Astro API + manual fallback)
    const cookieStateA = cookies.get('decap_oauth_state')?.value || '';
    const cookieMap = parseCookieHeader(request.headers.get('cookie'));
    const cookieStateB = cookieMap['decap_oauth_state'] || '';
    const cookieState = cookieStateA || cookieStateB;

    const hasCookieState = Boolean(cookieState);
    const hasBodyState = Boolean(bodyState);

    if (!code || !hasBodyState || !hasCookieState || bodyState !== cookieState) {
      return new Response(JSON.stringify({
        error: 'Invalid or missing state/code',
        details: 'State verification failed or missing parameters',
        diag: {
          hasCookieState, hasBodyState,
          origin,
          referer: request.headers.get('referer'),
          contentType: ct,
          cookiePrefix: cookieState ? cookieState.slice(0, 8) : null,
          bodyPrefix: bodyState ? bodyState.slice(0, 8) : null,
        }
      }), { status: 400, headers: baseHeaders });
    }

    // === Exchange code for token ===
    const client_id = process.env.DECAP_GITHUB_CLIENT_ID || process.env.AUTHJS_GITHUB_CLIENT_ID;
    const client_secret = process.env.DECAP_GITHUB_CLIENT_SECRET || process.env.AUTHJS_GITHUB_CLIENT_SECRET;
    
    if (!client_id || !client_secret) {
      // Log warning if using fallback
      if (process.env.AUTHJS_GITHUB_CLIENT_ID && !process.env.DECAP_GITHUB_CLIENT_ID) {
        console.warn('[DECAP] Using AUTHJS credentials as fallback. Consider setting DECAP_GITHUB_CLIENT_ID and DECAP_GITHUB_CLIENT_SECRET.');
      }
      return new Response(JSON.stringify({
        error: 'Missing client credentials',
        expected: ['DECAP_GITHUB_CLIENT_ID/SECRET', 'AUTHJS_GITHUB_CLIENT_ID/SECRET']
      }), { status: 500, headers: baseHeaders });
    }

    const redirect_uri = `${origin}/api/decap/callback`;
    const res = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { accept: 'application/json', 'content-type': 'application/json' },
      body: JSON.stringify({ client_id, client_secret, code, redirect_uri })
    });

    const data = await res.json().catch(() => ({} as any));
    if (!res.ok || !data?.access_token) {
      // Return specific GitHub error (e.g., bad_verification_code)
      return new Response(JSON.stringify({
        error: data?.error || 'token_exchange_failed',
        details: data?.error_description || 'GitHub token exchange failed',
        github_response: data
      }), { status: 400, headers: baseHeaders });
    }

    return new Response(JSON.stringify({ token: data.access_token, provider: 'github' }), {
      status: 200, headers: baseHeaders
    });

  } catch (e: any) {
    return new Response(JSON.stringify({
      error: 'token_route_failed',
      details: String(e?.message || e),
      stack: (e?.stack ? String(e.stack).split('\n').slice(0, 4) : null)
    }), { status: 500, headers: baseHeaders });
  }
};
