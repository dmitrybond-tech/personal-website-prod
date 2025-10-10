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
          (function () {
            var payload = 'authorization:github:error:' + JSON.stringify({ message: '${error}' });
            try { window.opener.postMessage(payload, window.location.origin); }
            catch(e) { window.opener.postMessage(payload, '*'); }
            window.close();
          })();
        </script>
      `, {
        status: 200,
        headers: { 
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store',
          'Set-Cookie': 'decap_oauth_state=; Max-Age=0; Path=/; SameSite=None; Secure'
        }
      });
    }

    // Validate required parameters
    if (!code || !state) {
      return new Response(`
        <script>
          (function () {
            var payload = 'authorization:github:error:' + JSON.stringify({ message: 'missing_code_or_state' });
            try { window.opener.postMessage(payload, window.location.origin); }
            catch(e) { window.opener.postMessage(payload, '*'); }
            window.close();
          })();
        </script>
      `, {
        status: 400,
        headers: { 
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store',
          'Set-Cookie': 'decap_oauth_state=; Max-Age=0; Path=/; SameSite=None; Secure'
        }
      });
    }

    // Validate state from cookie
    const cookieHeader = request.headers.get('cookie');
    if (!cookieHeader) {
      return new Response(`
        <script>
          (function () {
            var payload = 'authorization:github:error:' + JSON.stringify({ message: 'missing_state_cookie' });
            try { window.opener.postMessage(payload, window.location.origin); }
            catch(e) { window.opener.postMessage(payload, '*'); }
            window.close();
          })();
        </script>
      `, {
        status: 400,
        headers: { 
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store',
          'Set-Cookie': 'decap_oauth_state=; Max-Age=0; Path=/; SameSite=None; Secure'
        }
      });
    }

    const parsedCookies = parse(cookieHeader);
    const storedState = parsedCookies.decap_oauth_state;
    
    if (!storedState) {
      return new Response(`
        <script>
          (function () {
            var payload = 'authorization:github:error:' + JSON.stringify({ message: 'state_cookie_not_found' });
            try { window.opener.postMessage(payload, window.location.origin); }
            catch(e) { window.opener.postMessage(payload, '*'); }
            window.close();
          })();
        </script>
      `, {
        status: 400,
        headers: { 
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store',
          'Set-Cookie': 'decap_oauth_state=; Max-Age=0; Path=/; SameSite=None; Secure'
        }
      });
    }

    // Verify state signature
    const [storedStateValue, storedSignature] = storedState.split('.');
    if (!storedStateValue || !storedSignature) {
      return new Response(`
        <script>
          (function () {
            var payload = 'authorization:github:error:' + JSON.stringify({ message: 'invalid_state_format' });
            try { window.opener.postMessage(payload, window.location.origin); }
            catch(e) { window.opener.postMessage(payload, '*'); }
            window.close();
          })();
        </script>
      `, {
        status: 400,
        headers: { 
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store',
          'Set-Cookie': 'decap_oauth_state=; Max-Age=0; Path=/; SameSite=None; Secure'
        }
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
          (function () {
            var payload = 'authorization:github:error:' + JSON.stringify({ message: 'state_signature_mismatch' });
            try { window.opener.postMessage(payload, window.location.origin); }
            catch(e) { window.opener.postMessage(payload, '*'); }
            window.close();
          })();
        </script>
      `, {
        status: 400,
        headers: { 
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store',
          'Set-Cookie': 'decap_oauth_state=; Max-Age=0; Path=/; SameSite=None; Secure'
        }
      });
    }

    // Verify state matches
    if (state !== storedStateValue) {
      return new Response(`
        <script>
          (function () {
            var payload = 'authorization:github:error:' + JSON.stringify({ message: 'state_mismatch' });
            try { window.opener.postMessage(payload, window.location.origin); }
            catch(e) { window.opener.postMessage(payload, '*'); }
            window.close();
          })();
        </script>
      `, {
        status: 400,
        headers: { 
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store',
          'Set-Cookie': 'decap_oauth_state=; Max-Age=0; Path=/; SameSite=None; Secure'
        }
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
          (function () {
            var payload = 'authorization:github:error:' + JSON.stringify({ message: 'token_exchange_failed' });
            try { window.opener.postMessage(payload, window.location.origin); }
            catch(e) { window.opener.postMessage(payload, '*'); }
            window.close();
          })();
        </script>
      `, {
        status: 500,
        headers: { 
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store',
          'Set-Cookie': 'decap_oauth_state=; Max-Age=0; Path=/; SameSite=None; Secure'
        }
      });
    }

    const tokenData = await tokenResponse.json();
    
    if (tokenData.error) {
      console.error('[decap-oauth] token error:', tokenData);
      return new Response(`
        <script>
          (function () {
            var payload = 'authorization:github:error:' + JSON.stringify({ message: tokenData.error_description || tokenData.error });
            try { window.opener.postMessage(payload, window.location.origin); }
            catch(e) { window.opener.postMessage(payload, '*'); }
            window.close();
          })();
        </script>
      `, {
        status: 400,
        headers: { 
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store',
          'Set-Cookie': 'decap_oauth_state=; Max-Age=0; Path=/; SameSite=None; Secure'
        }
      });
    }

    const accessToken = tokenData.access_token;
    
    if (!accessToken) {
      return new Response(`
        <script>
          (function () {
            var payload = 'authorization:github:error:' + JSON.stringify({ message: 'no_access_token' });
            try { window.opener.postMessage(payload, window.location.origin); }
            catch(e) { window.opener.postMessage(payload, '*'); }
            window.close();
          })();
        </script>
      `, {
        status: 500,
        headers: { 
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store',
          'Set-Cookie': 'decap_oauth_state=; Max-Age=0; Path=/; SameSite=None; Secure'
        }
      });
    }

    // Return success response with token
    return new Response(`
      <script>
        (function () {
          var payload = 'authorization:github:success:' + JSON.stringify({ token: '${accessToken}' });
          try { window.opener.postMessage(payload, window.location.origin); }
          catch(e) { window.opener.postMessage(payload, '*'); }
          window.close();
        })();
      </script>
    `, {
      status: 200,
      headers: { 
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
        'Set-Cookie': 'decap_oauth_state=; Max-Age=0; Path=/; SameSite=None; Secure'
      }
    });

  } catch (error) {
    console.error('[decap-oauth] callback error:', error);
    return new Response(`
      <script>
        (function () {
          var payload = 'authorization:github:error:' + JSON.stringify({ message: '${error instanceof Error ? error.message : 'Unknown error'}' });
          try { window.opener.postMessage(payload, window.location.origin); }
          catch(e) { window.opener.postMessage(payload, '*'); }
          window.close();
        })();
      </script>
    `, {
      status: 500,
      headers: { 
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
        'Set-Cookie': 'decap_oauth_state=; Max-Age=0; Path=/; SameSite=None; Secure'
      }
    });
  }
};
