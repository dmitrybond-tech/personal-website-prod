import type { APIRoute } from 'astro';
import { nanoid } from 'nanoid';
import { serialize } from 'cookie';
import { createHmac } from 'node:crypto';

export const prerender = false;

export const GET: APIRoute = async ({ request, cookies, url }) => {
  const DEBUG = process.env.DECAP_OAUTH_DEBUG === '1';
  
  try {
    // Get OAuth configuration from environment
    const clientId = process.env.DECAP_GITHUB_CLIENT_ID;
    const clientSecret = process.env.DECAP_GITHUB_CLIENT_SECRET;
    
    // Get origin from request headers (proxy-aware)
    const getRequestOrigin = (req: Request) => {
      const url = new URL(req.url);
      const xfProto = req.headers.get('x-forwarded-proto');
      const xfHost = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
      const proto = (xfProto ?? url.protocol.replace(':', '')) || 'https';
      const host = xfHost ?? url.host;
      return `${proto}://${host}`;
    };
    
    const siteUrl = getRequestOrigin(request) || process.env.PUBLIC_SITE_URL || 'http://localhost:4321';
    const stateSecret = process.env.DECAP_OAUTH_STATE_SECRET || 'change_me_long_random';

    if (!clientId || !clientSecret) {
      if (DEBUG) {
        console.log('[decap-authz] error: missing env vars clientId=' + !!clientId + ' clientSecret=' + !!clientSecret);
      }
      return new Response(JSON.stringify({ 
        error: 'OAuth configuration missing',
        message: 'DECAP_GITHUB_CLIENT_ID and DECAP_GITHUB_CLIENT_SECRET must be set'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generate random state and sign it
    const state = nanoid(32);
    const stateSignature = createHmac('sha256', stateSecret)
      .update(state)
      .digest('hex');
    
    const signedState = `${state}.${stateSignature}`;

    // Store signed state in httpOnly cookie (10 minutes expiry, popup flow)
    const isProd = process.env.NODE_ENV === 'production';
    const stateCookie = serialize('decap_oauth_state', signedState, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'none', // None for popup cross-site flow
      maxAge: 10 * 60, // 10 minutes (600 seconds)
      path: '/'
    });

    // Build GitHub OAuth URL
    const githubAuthUrl = new URL('https://github.com/login/oauth/authorize');
    githubAuthUrl.searchParams.set('client_id', clientId);
    const redirectUri = `${siteUrl}/api/decap/oauth/callback`;
    githubAuthUrl.searchParams.set('redirect_uri', redirectUri);
    githubAuthUrl.searchParams.set('state', state);
    githubAuthUrl.searchParams.set('scope', 'repo');

    if (DEBUG) {
      console.log('[decap-authz] origin=' + siteUrl + ' redirect_uri=' + redirectUri + ' set-cookie:SameSite=None;Secure=' + isProd + ' path=/ maxAge=600');
    }

    // Set cookie and redirect to GitHub
    const headers: Record<string, string> = {
      'Location': githubAuthUrl.toString(),
      'Set-Cookie': stateCookie
    };
    
    if (DEBUG) {
      headers['X-Decap-Debug'] = '1';
    }

    return new Response(null, {
      status: 302,
      headers
    });

  } catch (error) {
    console.error('[decap-oauth] authorize error:', error);
    return new Response(JSON.stringify({ 
      error: 'Authorization failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
