import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ url }) => {
  // Handle OAuth callback redirect from GitHub
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');
  
  if (error) {
    console.error(`[OAuth] GitHub error: ${error}`);
    return new Response(`OAuth error: ${error}`, { status: 400 });
  }
  
  if (!code) {
    return new Response('Missing authorization code', { status: 400 });
  }
  
  console.log(`[OAuth] Processing callback with code: ${code.substring(0, 10)}...`);
  
  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'DecapCMS-OAuth/1.0',
      },
      body: JSON.stringify({
        client_id: import.meta.env.DECAP_GITHUB_CLIENT_ID,
        client_secret: import.meta.env.DECAP_GITHUB_CLIENT_SECRET,
        code: code,
      }),
    });
    
    const tokenData = await tokenResponse.json();
    
    if (tokenData.error) {
      console.error(`[OAuth] GitHub token error: ${tokenData.error_description || tokenData.error}`);
      return new Response(`OAuth error: ${tokenData.error_description || tokenData.error}`, { status: 400 });
    }
    
    console.log(`[OAuth] Token exchange successful`);
    
    // Create a simple HTML page that posts the token back to Decap CMS
    const adminUrl = new URL('/website-admin/', url.origin);
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>OAuth Complete</title>
</head>
<body>
  <script>
    // Post token back to parent window (Decap CMS)
    if (window.opener) {
      window.opener.postMessage({
        message: 'authorization:github:success',
        token: '${tokenData.access_token}',
        provider: 'github',
        site_id: '${state || url.origin}'
      }, '*');
      window.close();
    } else {
      // Fallback: redirect to admin
      window.location.href = '${adminUrl.toString()}';
    }
  </script>
  <p>Authentication successful. You can close this window.</p>
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
    return new Response('Internal server error during OAuth callback', { status: 500 });
  }
};