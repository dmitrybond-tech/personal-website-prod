import type { APIRoute } from 'astro';
import { nanoid } from 'nanoid';
import { serialize } from 'cookie';
import { createHmac } from 'node:crypto';

export const prerender = false;

export const GET: APIRoute = async ({ request, cookies, url }) => {
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

    // Store signed state in httpOnly cookie (10 minutes expiry, redirect flow)
    const stateCookie = serialize('decap_oauth_state', signedState, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // Lax for redirect flow (not cross-origin)
      maxAge: 10 * 60, // 10 minutes
      path: '/'
    });

    // Build GitHub OAuth URL
    const githubAuthUrl = new URL('https://github.com/login/oauth/authorize');
    githubAuthUrl.searchParams.set('client_id', clientId);
    githubAuthUrl.searchParams.set('redirect_uri', `${siteUrl}/api/decap/oauth/callback`);
    githubAuthUrl.searchParams.set('state', state);
    githubAuthUrl.searchParams.set('scope', 'repo');

    // Set cookie and redirect to GitHub
    return new Response(null, {
      status: 302,
      headers: {
        'Location': githubAuthUrl.toString(),
        'Set-Cookie': stateCookie
      }
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
