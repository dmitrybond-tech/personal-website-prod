import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ params, request, url }) => {
  // Handle OAuth login flow
  const provider = url.searchParams.get('provider');
  const siteId = url.searchParams.get('site_id');
  const scope = url.searchParams.get('scope') || 'repo';
  
  if (provider === 'github') {
    // Build GitHub OAuth URL
    const clientId = process.env.DECAP_GITHUB_CLIENT_ID;
    const redirectUri = `${url.origin}/api/decap/callback`;
    
    if (!clientId) {
      return new Response('GitHub OAuth client ID not configured', { status: 500 });
    }
    
    const githubAuthUrl = new URL('https://github.com/login/oauth/authorize');
    githubAuthUrl.searchParams.set('client_id', clientId);
    githubAuthUrl.searchParams.set('redirect_uri', redirectUri);
    githubAuthUrl.searchParams.set('scope', scope);
    githubAuthUrl.searchParams.set('state', siteId || url.origin);
    githubAuthUrl.searchParams.set('response_type', 'code');
    
    console.log(`[OAuth] Redirecting to GitHub: ${githubAuthUrl.toString()}`);
    
    return Response.redirect(githubAuthUrl.toString(), 302);
  }
  
  return new Response(`Provider '${provider}' not supported`, { status: 400 });
};

export const POST: APIRoute = async ({ request, url }) => {
  // Handle OAuth callback from GitHub
  try {
    const formData = await request.formData();
    const code = formData.get('code') as string;
    const state = formData.get('state') as string;
    
    if (!code) {
      return new Response('Missing authorization code', { status: 400 });
    }
    
    console.log(`[OAuth] Received callback with code: ${code.substring(0, 10)}...`);
    
    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'DecapCMS-OAuth/1.0',
      },
      body: JSON.stringify({
        client_id: process.env.DECAP_GITHUB_CLIENT_ID,
        client_secret: process.env.DECAP_GITHUB_CLIENT_SECRET,
        code: code,
      }),
    });
    
    const tokenData = await tokenResponse.json();
    
    if (tokenData.error) {
      console.error(`[OAuth] GitHub error: ${tokenData.error_description || tokenData.error}`);
      return new Response(`OAuth error: ${tokenData.error_description || tokenData.error}`, { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log(`[OAuth] Successfully obtained token for user`);
    
    // Return token to Decap CMS
    return new Response(JSON.stringify({
      token: tokenData.access_token,
      provider: 'github',
      site_id: state || url.origin,
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
    
  } catch (error) {
    console.error('[OAuth] Callback error:', error);
    return new Response('Internal server error during OAuth callback', { status: 500 });
  }
};
