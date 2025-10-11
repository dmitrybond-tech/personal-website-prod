import type { APIRoute } from 'astro';

/**
 * OAuth callback handler for Decap CMS
 * GitHub redirects here after user authorizes
 * GET /api/decap/callback?code=<auth_code>&state=<state>
 */
export const GET: APIRoute = async ({ url }) => {
  // Handle OAuth callback redirect from GitHub
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');
  
  if (error) {
    console.error(`[OAuth] GitHub error: ${error}`);
    return new Response(
      `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>OAuth Error</title>
</head>
<body>
  <h1>Authentication Error</h1>
  <p>GitHub returned an error: ${error}</p>
  <p><a href="/website-admin/">Return to CMS</a></p>
</body>
</html>`,
      { 
        status: 400,
        headers: { 'Content-Type': 'text/html' }
      }
    );
  }
  
  if (!code) {
    return new Response(
      `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>OAuth Error</title>
</head>
<body>
  <h1>Authentication Error</h1>
  <p>Missing authorization code from GitHub</p>
  <p><a href="/website-admin/">Return to CMS</a></p>
</body>
</html>`,
      { 
        status: 400,
        headers: { 'Content-Type': 'text/html' }
      }
    );
  }
  
  console.log(`[OAuth] Processing callback with code: ${code.substring(0, 10)}...`);
  
  try {
    // Read GitHub OAuth credentials
    const clientId = process.env.DECAP_GITHUB_CLIENT_ID || process.env.AUTHJS_GITHUB_CLIENT_ID;
    const clientSecret = process.env.DECAP_GITHUB_CLIENT_SECRET || process.env.AUTHJS_GITHUB_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      console.error('[OAuth] GitHub OAuth credentials not configured');
      return new Response(
        `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Configuration Error</title>
</head>
<body>
  <h1>Configuration Error</h1>
  <p>GitHub OAuth is not properly configured on the server.</p>
  <p>Please set DECAP_GITHUB_CLIENT_ID and DECAP_GITHUB_CLIENT_SECRET environment variables.</p>
</body>
</html>`,
        { 
          status: 500,
          headers: { 'Content-Type': 'text/html' }
        }
      );
    }
    
    // Log fallback warning if using AUTHJS credentials
    if (!process.env.DECAP_GITHUB_CLIENT_ID && process.env.AUTHJS_GITHUB_CLIENT_ID) {
      console.warn('[OAuth] Using AUTHJS_GITHUB credentials as fallback. Consider setting DECAP_GITHUB_CLIENT_ID and DECAP_GITHUB_CLIENT_SECRET.');
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
      console.error(`[OAuth] GitHub token error: ${tokenData.error_description || tokenData.error}`);
      return new Response(
        `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>OAuth Error</title>
</head>
<body>
  <h1>Authentication Error</h1>
  <p>GitHub token exchange failed: ${tokenData.error_description || tokenData.error}</p>
  <p><a href="/website-admin/">Return to CMS</a></p>
</body>
</html>`,
        { 
          status: 400,
          headers: { 'Content-Type': 'text/html' }
        }
      );
    }
    
    console.log(`[OAuth] Token exchange successful`);
    
    // Create a simple HTML page that posts the token back to Decap CMS
    const adminUrl = new URL('/website-admin/', url.origin);
    
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>OAuth Complete</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; padding: 2rem; text-align: center; }
    .success { color: #059669; }
  </style>
</head>
<body>
  <h1 class="success">✓ Authentication Successful</h1>
  <p>Completing login...</p>
  <script>
    (function() {
      console.log('[OAuth] Callback page loaded, posting token to parent window');
      
      // Post token back to parent window (Decap CMS)
      if (window.opener) {
        window.opener.postMessage({
          message: 'authorization:github:success',
          token: '${tokenData.access_token}',
          provider: 'github',
          site_id: '${state || url.origin}'
        }, '${url.origin}');
        
        console.log('[OAuth] Token posted to parent window');
        
        // Close popup after a short delay
        setTimeout(function() {
          console.log('[OAuth] Closing popup window');
          window.close();
        }, 1000);
      } else {
        console.warn('[OAuth] No window.opener found, redirecting to admin');
        // Fallback: redirect to admin
        window.location.href = '${adminUrl.toString()}';
      }
    })();
  </script>
  <noscript>
    <p>JavaScript is required to complete authentication.</p>
    <p><a href="${adminUrl.toString()}">Return to CMS</a></p>
  </noscript>
</body>
</html>`;
    
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
    
  } catch (error) {
    console.error('[OAuth] Callback processing error:', error);
    return new Response(
      `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Server Error</title>
</head>
<body>
  <h1>Server Error</h1>
  <p>An error occurred during OAuth callback: ${error instanceof Error ? error.message : 'Unknown error'}</p>
  <p><a href="/website-admin/">Return to CMS</a></p>
</body>
</html>`,
      { 
        status: 500,
        headers: { 'Content-Type': 'text/html' }
      }
    );
  }
};
