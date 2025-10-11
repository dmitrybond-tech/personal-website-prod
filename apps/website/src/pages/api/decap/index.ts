import type { APIRoute } from 'astro';

/**
 * OAuth entry point for Decap CMS
 * GET /api/decap?provider=github&scope=repo&site_id=<host>
 * Redirects to GitHub OAuth authorize endpoint with state cookie for CSRF protection
 */

function getOrigin(req: Request): string {
  const url = new URL(req.url);
  const proto = req.headers.get('x-forwarded-proto') || url.protocol.replace(':', '');
  const host = req.headers.get('x-forwarded-host') || url.host;
  return `${proto}://${host}`;
}

export const GET: APIRoute = async ({ request, cookies }) => {
  const url = new URL(request.url);
  const origin = getOrigin(request);
  const provider = url.searchParams.get('provider') || 'github';
  
  // Only support GitHub provider
  if (provider !== 'github') {
    return new Response(JSON.stringify({ 
      error: 'Unsupported provider', 
      provider,
      supported: ['github']
    }), {
      status: 400, 
      headers: { 
        'content-type': 'application/json',
        'access-control-allow-origin': origin,
        'vary': 'Origin'
      }
    });
  }

  // Read GitHub OAuth client ID from environment
  const clientId = process.env.DECAP_GITHUB_CLIENT_ID || process.env.AUTHJS_GITHUB_CLIENT_ID;
  
  if (!clientId) {
    console.error('[OAuth] Missing GitHub client ID. Set DECAP_GITHUB_CLIENT_ID or AUTHJS_GITHUB_CLIENT_ID');
    return new Response(JSON.stringify({
      error: 'Missing GitHub client ID',
      expected: ['DECAP_GITHUB_CLIENT_ID', 'AUTHJS_GITHUB_CLIENT_ID'],
      message: 'Server configuration error: GitHub OAuth client ID not set'
    }), { 
      status: 500, 
      headers: { 
        'content-type': 'application/json',
        'access-control-allow-origin': origin,
        'vary': 'Origin'
      } 
    });
  }

  // Log fallback warning if using AUTHJS credentials
  if (!process.env.DECAP_GITHUB_CLIENT_ID && process.env.AUTHJS_GITHUB_CLIENT_ID) {
    console.warn('[OAuth] Using AUTHJS_GITHUB_CLIENT_ID as fallback. Consider setting DECAP_GITHUB_CLIENT_ID for clarity.');
  }

  // Build OAuth parameters
  const redirectUri = `${origin}/api/decap/callback`;
  const scope = url.searchParams.get('scope') || 'repo';
  const state = crypto.randomUUID();

  // Set state cookie for CSRF protection
  cookies.set('decap_oauth_state', state, { 
    httpOnly: true, 
    sameSite: 'lax', 
    path: '/',
    secure: origin.startsWith('https')
  });

  // Build GitHub OAuth authorization URL
  const authUrl = new URL('https://github.com/login/oauth/authorize');
  authUrl.searchParams.set('client_id', String(clientId));
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', scope);
  authUrl.searchParams.set('state', state);

  console.log(`[OAuth] Redirecting to GitHub OAuth (client_id: ${String(clientId).substring(0, 8)}..., redirect_uri: ${redirectUri})`);

  return Response.redirect(authUrl.toString(), 302);
};

