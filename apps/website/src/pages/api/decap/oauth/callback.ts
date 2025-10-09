import type { APIRoute } from 'astro';
import { parse } from 'cookie';
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
      return new Response(JSON.stringify({ 
        error: 'OAuth configuration missing',
        message: 'DECAP_GITHUB_CLIENT_ID and DECAP_GITHUB_CLIENT_SECRET must be set'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse URL parameters
    const urlParams = new URLSearchParams(url.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error');

    // Handle OAuth error
    if (error) {
      return new Response(`
        <script>
          window.opener.postMessage(
            'authorization:github:error:' + JSON.stringify({error: '${error}'}),
            window.location.origin
          );
          window.close();
        </script>
      `, {
        status: 200,
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // Validate required parameters
    if (!code || !state) {
      return new Response(`
        <script>
          window.opener.postMessage(
            'authorization:github:error:' + JSON.stringify({error: 'missing_code_or_state'}),
            window.location.origin
          );
          window.close();
        </script>
      `, {
        status: 400,
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // Validate state from cookie
    const cookieHeader = request.headers.get('cookie');
    if (!cookieHeader) {
      return new Response(`
        <script>
          window.opener.postMessage(
            'authorization:github:error:' + JSON.stringify({error: 'missing_state_cookie'}),
            window.location.origin
          );
          window.close();
        </script>
      `, {
        status: 400,
        headers: { 'Content-Type': 'text/html' }
      });
    }

    const parsedCookies = parse(cookieHeader);
    const storedState = parsedCookies.decap_oauth_state;
    
    if (!storedState) {
      return new Response(`
        <script>
          window.opener.postMessage(
            'authorization:github:error:' + JSON.stringify({error: 'state_cookie_not_found'}),
            window.location.origin
          );
          window.close();
        </script>
      `, {
        status: 400,
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // Verify state signature
    const [storedStateValue, storedSignature] = storedState.split('.');
    if (!storedStateValue || !storedSignature) {
      return new Response(`
        <script>
          window.opener.postMessage(
            'authorization:github:error:' + JSON.stringify({error: 'invalid_state_format'}),
            window.location.origin
          );
          window.close();
        </script>
      `, {
        status: 400,
        headers: { 'Content-Type': 'text/html' }
      });
    }

    const expectedSignature = createHmac('sha256', stateSecret)
      .update(storedStateValue)
      .digest('hex');

    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    const receivedBuffer = Buffer.from(storedSignature, 'hex');

    if (expectedBuffer.length !== receivedBuffer.length || 
        !timingSafeEqual(expectedBuffer, receivedBuffer)) {
      return new Response(`
        <script>
          window.opener.postMessage(
            'authorization:github:error:' + JSON.stringify({error: 'state_signature_mismatch'}),
            window.location.origin
          );
          window.close();
        </script>
      `, {
        status: 400,
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // Verify state matches
    if (state !== storedStateValue) {
      return new Response(`
        <script>
          window.opener.postMessage(
            'authorization:github:error:' + JSON.stringify({error: 'state_mismatch'}),
            window.location.origin
          );
          window.close();
        </script>
      `, {
        status: 400,
        headers: { 'Content-Type': 'text/html' }
      });
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
      console.error('[decap-oauth] token exchange failed:', errorText);
      return new Response(`
        <script>
          window.opener.postMessage(
            'authorization:github:error:' + JSON.stringify({error: 'token_exchange_failed'}),
            window.location.origin
          );
          window.close();
        </script>
      `, {
        status: 500,
        headers: { 'Content-Type': 'text/html' }
      });
    }

    const tokenData = await tokenResponse.json();
    
    if (tokenData.error) {
      console.error('[decap-oauth] token error:', tokenData);
      return new Response(`
        <script>
          window.opener.postMessage(
            'authorization:github:error:' + JSON.stringify({error: tokenData.error_description || tokenData.error}),
            window.location.origin
          );
          window.close();
        </script>
      `, {
        status: 400,
        headers: { 'Content-Type': 'text/html' }
      });
    }

    const accessToken = tokenData.access_token;
    
    if (!accessToken) {
      return new Response(`
        <script>
          window.opener.postMessage(
            'authorization:github:error:' + JSON.stringify({error: 'no_access_token'}),
            window.location.origin
          );
          window.close();
        </script>
      `, {
        status: 500,
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // Return success response with token
    return new Response(`
      <script>
        (function() {
          // Send token & provider to window.opener for Decap
          window.opener.postMessage(
            'authorization:github:success:' + JSON.stringify({token: '${accessToken}'}),
            window.location.origin
          );
          window.close();
        })();
      </script>
    `, {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });

  } catch (error) {
    console.error('[decap-oauth] callback error:', error);
    return new Response(`
      <script>
        window.opener.postMessage(
          'authorization:github:error:' + JSON.stringify({error: '${error instanceof Error ? error.message : 'Unknown error'}'}),
          window.location.origin
        );
        window.close();
      </script>
    `, {
      status: 500,
      headers: { 'Content-Type': 'text/html' }
    });
  }
};
