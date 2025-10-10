import type { APIRoute } from 'astro';
import { parse, serialize } from 'cookie';
import { createHmac, timingSafeEqual } from 'node:crypto';

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
      console.error('[decap-oauth] OAuth configuration missing');
      return new Response('OAuth configuration missing', { status: 500 });
    }

    // Parse URL parameters
    const urlParams = new URLSearchParams(url.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error');

    // Handle OAuth error
    if (error) {
      console.error('[decap-oauth] GitHub returned error:', error);
      return new Response(`OAuth error: ${error}`, { status: 400 });
    }

    // Validate required parameters
    if (!code || !state) {
      console.error('[decap-oauth] Missing code or state parameter');
      return new Response('Missing code or state parameter', { status: 400 });
    }

    // Validate state from cookie
    const cookieHeader = request.headers.get('cookie');
    if (!cookieHeader) {
      console.error('[decap-oauth] No cookie header found');
      return new Response('No state cookie found', { status: 400 });
    }

    const parsedCookies = parse(cookieHeader);
    const storedState = parsedCookies.decap_oauth_state;
    
    if (!storedState) {
      console.error('[decap-oauth] State cookie not found');
      return new Response('State cookie not found', { status: 400 });
    }

    // Verify state signature
    const [storedStateValue, storedSignature] = storedState.split('.');
    if (!storedStateValue || !storedSignature) {
      console.error('[decap-oauth] Invalid state format');
      return new Response('Invalid state format', { status: 400 });
    }

    const expectedSignature = createHmac('sha256', stateSecret)
      .update(storedStateValue)
      .digest('hex');

    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    const receivedBuffer = Buffer.from(storedSignature, 'hex');

    if (expectedBuffer.length !== receivedBuffer.length || 
        !timingSafeEqual(expectedBuffer, receivedBuffer)) {
      console.error('[decap-oauth] State signature mismatch');
      return new Response('State signature mismatch', { status: 400 });
    }

    // Verify state matches
    if (state !== storedStateValue) {
      console.error('[decap-oauth] State parameter mismatch');
      return new Response('State parameter mismatch', { status: 400 });
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'Decap-CMS-OAuth'
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: code
      })
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('[decap-oauth] Token exchange failed:', errorText);
      return new Response('Token exchange failed', { status: 502 });
    }

    const tokenData = await tokenResponse.json();
    
    if (tokenData.error) {
      console.error('[decap-oauth] Token error:', tokenData.error);
      return new Response(`Token error: ${tokenData.error}`, { status: 400 });
    }

    const accessToken = tokenData.access_token;
    
    if (!accessToken) {
      console.error('[decap-oauth] No access token in response');
      return new Response('No access token received', { status: 502 });
    }

    // Log success (diagnostic)
    console.log('[decap-oauth] delivered via postMessage + close');

    // Build Decap-formatted payload (canonical format: exact match for bundled handler)
    const payload = {
      token: accessToken,
      provider: 'github'
    };

    // Mask token in logs (security: never log raw tokens)
    console.log('[decap-oauth] token exchange successful, token: ***');

    // Return HTML with postMessage script (popup flow)
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Authenticating...</title>
</head>
<body>
  <script>
    (function() {
      // Decap expects exact format: 'authorization:github:success:' + JSON.stringify({ token, provider })
      var payload = 'authorization:github:success:' + JSON.stringify(${JSON.stringify(payload)});
      
      // 1. Send postMessage to opener (primary delivery method)
      try {
        if (window.opener && !window.opener.closed) {
          window.opener.postMessage(payload, '*');
          console.log('[decap-oauth] postMessage delivered (wildcard)');
          
          // Send again with explicit origin as backup
          try {
            window.opener.postMessage(payload, window.location.origin);
            console.log('[decap-oauth] postMessage delivered (origin)');
          } catch(e) {
            console.warn('[decap-oauth] origin-specific postMessage failed:', e);
          }
        }
      } catch(e) {
        console.error('[decap-oauth] postMessage failed:', e);
      }
      
      // 2. Rehydrate opener's localStorage (fallback for next render tick)
      // This ensures login works even if postMessage is missed
      try {
        if (window.opener && !window.opener.closed) {
          // Standard Decap CMS localStorage keys (try both for compatibility)
          window.opener.localStorage.setItem('netlify-cms-user', JSON.stringify({
            token: ${JSON.stringify(accessToken)},
            backendName: 'github'
          }));
          // Also try newer Decap naming convention
          window.opener.localStorage.setItem('decap-cms.user', JSON.stringify({
            token: ${JSON.stringify(accessToken)},
            backendName: 'github'
          }));
          console.log('[decap-oauth] localStorage rehydrated in opener');
        }
      } catch(e) {
        console.warn('[decap-oauth] localStorage rehydration failed:', e);
      }
      
      // 3. Mirror to popup's own localStorage (harmless diagnostic backup)
      try {
        localStorage.setItem('decap_oauth_message', payload);
      } catch(e) {}
      
      // 4. Close popup after brief delay
      setTimeout(function() {
        try {
          window.close();
        } catch(e) {
          document.body.innerHTML = '<p>Authentication complete. You may close this window.</p>';
        }
      }, 150);
    })();
  </script>
</body>
</html>`;

    // Clear state cookie in response
    const clearStateCookie = serialize('decap_oauth_state', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: 0,
      path: '/'
    });

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
        'Set-Cookie': clearStateCookie
      }
    });

  } catch (error) {
    console.error('[decap-oauth] callback error:', error);
    return new Response('Unexpected error', { status: 500 });
  }
};
