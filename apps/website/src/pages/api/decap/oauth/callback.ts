import type { APIRoute } from 'astro';
import { parse, serialize } from 'cookie';
import { createHmac, timingSafeEqual } from 'node:crypto';

export const prerender = false;

// Helper function to redirect back to admin with error
function redirectWithError(error: string, siteUrl: string) {
  const adminUrl = new URL('/website-admin/', siteUrl);
  adminUrl.searchParams.set('auth_error', error);
  adminUrl.hash = '/';
  
  const headers = new Headers();
  headers.append('Location', adminUrl.toString());
  headers.append('Set-Cookie', 'decap_oauth_state=; Max-Age=0; Path=/; SameSite=Lax');
  headers.append('Cache-Control', 'no-store');
  
  return new Response(null, {
    status: 302,
    headers: headers
  });
}

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
      return redirectWithError('oauth_config_missing', siteUrl);
    }

    // Parse URL parameters
    const urlParams = new URLSearchParams(url.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error');

    // Handle OAuth error - redirect back to admin with error message
    if (error) {
      console.error('[decap-oauth] GitHub returned error:', error);
      return redirectWithError(error, siteUrl);
    }

    // Validate required parameters
    if (!code || !state) {
      console.error('[decap-oauth] Missing code or state parameter');
      return redirectWithError('missing_code_or_state', siteUrl);
    }

    // Validate state from cookie
    const cookieHeader = request.headers.get('cookie');
    if (!cookieHeader) {
      console.error('[decap-oauth] No cookie header found');
      return redirectWithError('missing_state_cookie', siteUrl);
    }

    const parsedCookies = parse(cookieHeader);
    const storedState = parsedCookies.decap_oauth_state;
    
    if (!storedState) {
      console.error('[decap-oauth] State cookie not found');
      return redirectWithError('state_cookie_not_found', siteUrl);
    }

    // Verify state signature
    const [storedStateValue, storedSignature] = storedState.split('.');
    if (!storedStateValue || !storedSignature) {
      console.error('[decap-oauth] Invalid state format');
      return redirectWithError('invalid_state_format', siteUrl);
    }

    const expectedSignature = createHmac('sha256', stateSecret)
      .update(storedStateValue)
      .digest('hex');

    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    const receivedBuffer = Buffer.from(storedSignature, 'hex');

    if (expectedBuffer.length !== receivedBuffer.length || 
        !timingSafeEqual(expectedBuffer, receivedBuffer)) {
      console.error('[decap-oauth] State signature mismatch');
      return redirectWithError('state_signature_mismatch', siteUrl);
    }

    // Verify state matches
    if (state !== storedStateValue) {
      console.error('[decap-oauth] State parameter mismatch');
      return redirectWithError('state_mismatch', siteUrl);
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
      return redirectWithError('token_exchange_failed', siteUrl);
    }

    const tokenData = await tokenResponse.json();
    
    if (tokenData.error) {
      console.error('[decap-oauth] Token error:', tokenData);
      return redirectWithError(tokenData.error, siteUrl);
    }

    const accessToken = tokenData.access_token;
    
    if (!accessToken) {
      console.error('[decap-oauth] No access token in response');
      return redirectWithError('no_access_token', siteUrl);
    }

    // Redirect-based OAuth flow (no popups)
    // Store token in cookie and redirect back to admin page
    const adminUrl = new URL('/website-admin/', siteUrl);
    adminUrl.searchParams.set('auth_success', '1');
    adminUrl.hash = '/'; // Decap uses hash routing

    // Store token in cookie (non-httpOnly so client JS can read it, short-lived)
    const tokenCookie = serialize('decap_auth_token', accessToken, {
      httpOnly: false, // Must be false for client-side access
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // Lax for redirect flow
      maxAge: 900, // 15 minutes (900 seconds)
      path: '/'
    });

    console.log('[decap-oauth] Token obtained, redirecting to admin with cookie');

    // Use Headers object to properly set multiple Set-Cookie headers
    const headers = new Headers();
    headers.append('Location', adminUrl.toString());
    headers.append('Set-Cookie', 'decap_oauth_state=; Max-Age=0; Path=/; SameSite=Lax');
    headers.append('Set-Cookie', tokenCookie);
    headers.append('Cache-Control', 'no-store'); // Prevent caching of token

    return new Response(null, {
      status: 302,
      headers: headers
    });

  } catch (error) {
    console.error('[decap-oauth] callback error:', error);
    const siteUrl = process.env.PUBLIC_SITE_URL || 'http://localhost:4321';
    return redirectWithError('unexpected_error', siteUrl);
  }
};
