import type { APIRoute } from 'astro';

/**
 * OAuth entry point for Decap CMS GitHub authentication
 * GET /api/decap?provider=github&scope=repo&site_id=<host>
 */
export const GET: APIRoute = async ({ params, request, url }) => {
  try {
    // Handle OAuth login flow
    const provider = url.searchParams.get('provider');
    const siteId = url.searchParams.get('site_id');
    const scope = url.searchParams.get('scope') || 'repo';
    
    console.log(`[OAuth] GET request: provider=${provider}, siteId=${siteId}, scope=${scope}`);
  
    if (provider === 'github') {
      // Read GitHub OAuth credentials from environment
      const clientId = process.env.DECAP_GITHUB_CLIENT_ID || process.env.AUTHJS_GITHUB_CLIENT_ID;
      const redirectUri = `${url.origin}/api/decap/callback`;
      
      if (!clientId) {
        console.error('[OAuth] GitHub OAuth client ID not configured. Set DECAP_GITHUB_CLIENT_ID or AUTHJS_GITHUB_CLIENT_ID');
        return new Response(
          JSON.stringify({ 
            error: 'GitHub OAuth client ID not configured',
            details: 'Set DECAP_GITHUB_CLIENT_ID environment variable'
          }),
          { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
      
      // Log fallback warning if using AUTHJS credentials
      if (!process.env.DECAP_GITHUB_CLIENT_ID && process.env.AUTHJS_GITHUB_CLIENT_ID) {
        console.warn('[OAuth] Using AUTHJS_GITHUB_CLIENT_ID as fallback. Consider setting DECAP_GITHUB_CLIENT_ID for clarity.');
      }
      
      console.log(`[OAuth] Starting OAuth flow with client ID: ${clientId.substring(0, 8)}...`);
      
      const githubAuthUrl = new URL('https://github.com/login/oauth/authorize');
      githubAuthUrl.searchParams.set('client_id', clientId);
      githubAuthUrl.searchParams.set('redirect_uri', redirectUri);
      githubAuthUrl.searchParams.set('scope', scope);
      githubAuthUrl.searchParams.set('state', siteId || url.origin);
      githubAuthUrl.searchParams.set('response_type', 'code');
      
      console.log(`[OAuth] Redirecting to GitHub: ${githubAuthUrl.toString()}`);
      
      return Response.redirect(githubAuthUrl.toString(), 302);
    }
  
    return new Response(
      JSON.stringify({ error: `Provider '${provider}' not supported` }),
      { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('[OAuth] GET error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

/**
 * OAuth token exchange endpoint (for POST-based flow)
 * POST /api/decap with form data: code, state
 */
export const POST: APIRoute = async ({ request, url }) => {
  // Handle OAuth callback from GitHub
  try {
    const formData = await request.formData();
    const code = formData.get('code') as string;
    const state = formData.get('state') as string;
    
    if (!code) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization code' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    console.log(`[OAuth] POST received callback with code: ${code.substring(0, 10)}...`);
    
    // Read GitHub OAuth credentials
    const clientId = process.env.DECAP_GITHUB_CLIENT_ID || process.env.AUTHJS_GITHUB_CLIENT_ID;
    const clientSecret = process.env.DECAP_GITHUB_CLIENT_SECRET || process.env.AUTHJS_GITHUB_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      console.error('[OAuth] GitHub OAuth credentials not configured');
      return new Response(
        JSON.stringify({ 
          error: 'GitHub OAuth credentials not configured',
          details: 'Set DECAP_GITHUB_CLIENT_ID and DECAP_GITHUB_CLIENT_SECRET'
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'DecapCMS-OAuth/1.0',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
      }),
    });
    
    const tokenData = await tokenResponse.json();
    
    if (tokenData.error) {
      console.error(`[OAuth] GitHub error: ${tokenData.error_description || tokenData.error}`);
      return new Response(
        JSON.stringify({ 
          error: tokenData.error_description || tokenData.error 
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
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
        'Access-Control-Allow-Origin': url.origin,
        'Access-Control-Allow-Credentials': 'true',
      },
    });
    
  } catch (error) {
    console.error('[OAuth] Callback error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error during OAuth callback',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
