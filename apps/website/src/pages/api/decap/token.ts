import type { APIRoute } from 'astro';

/**
 * Token exchange endpoint for Decap CMS OAuth flow
 * POST /api/decap/token
 * Body: { code: string, state: string }
 * Verifies state cookie, exchanges code for GitHub token
 */

function getOrigin(req: Request): string {
  const url = new URL(req.url);
  const proto = req.headers.get('x-forwarded-proto') || url.protocol.replace(':', '');
  const host = req.headers.get('x-forwarded-host') || url.host;
  return `${proto}://${host}`;
}

export const POST: APIRoute = async ({ request, cookies }) => {
  const origin = getOrigin(request);
  const allowOrigin = origin;

  try {
    const { code, state } = await request.json();
    const stored = cookies.get('decap_oauth_state')?.value;
    
    if (!code || !state || !stored || state !== stored) {
      return new Response(JSON.stringify({ 
        error: 'Invalid or missing state/code',
        details: 'State verification failed or missing parameters'
      }), {
        status: 400, 
        headers: { 
          'content-type': 'application/json', 
          'access-control-allow-origin': allowOrigin, 
          'vary': 'Origin' 
        }
      });
    }

    const client_id = process.env.DECAP_GITHUB_CLIENT_ID || process.env.AUTHJS_GITHUB_CLIENT_ID;
    const client_secret = process.env.DECAP_GITHUB_CLIENT_SECRET || process.env.AUTHJS_GITHUB_CLIENT_SECRET;
    
    if (!client_id || !client_secret) {
      console.error('[OAuth Token] Missing GitHub OAuth credentials');
      return new Response(JSON.stringify({ 
        error: 'Missing client credentials', 
        expected: ['DECAP_GITHUB_CLIENT_ID/SECRET', 'AUTHJS_GITHUB_CLIENT_ID/SECRET'] 
      }), {
        status: 500, 
        headers: { 
          'content-type': 'application/json', 
          'access-control-allow-origin': allowOrigin, 
          'vary': 'Origin' 
        }
      });
    }

    const redirect_uri = `${origin}/api/decap/callback`;

    console.log(`[OAuth Token] Exchanging code for token (client_id: ${client_id.substring(0, 8)}...)`);

    const res = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 
        'accept': 'application/json', 
        'content-type': 'application/json' 
      },
      body: JSON.stringify({ client_id, client_secret, code, redirect_uri })
    });

    const data = await res.json() as { access_token?: string; error?: string; error_description?: string; };
    
    if (!res.ok || !data.access_token) {
      console.error(`[OAuth Token] GitHub error: ${data.error || 'token_exchange_failed'}`);
      return new Response(JSON.stringify({ 
        error: data.error || 'token_exchange_failed', 
        details: data.error_description 
      }), {
        status: 400, 
        headers: { 
          'content-type': 'application/json', 
          'access-control-allow-origin': allowOrigin, 
          'vary': 'Origin' 
        }
      });
    }

    console.log('[OAuth Token] Token exchange successful');

    // Success - return token to Decap CMS
    return new Response(JSON.stringify({ 
      token: data.access_token, 
      provider: 'github' 
    }), {
      status: 200, 
      headers: { 
        'content-type': 'application/json', 
        'access-control-allow-origin': allowOrigin, 
        'vary': 'Origin' 
      }
    });
  } catch (e: any) {
    console.error('[OAuth Token] Unexpected error:', e);
    return new Response(JSON.stringify({ 
      error: 'unexpected', 
      details: String(e?.message || e) 
    }), {
      status: 500, 
      headers: { 
        'content-type': 'application/json', 
        'access-control-allow-origin': allowOrigin, 
        'vary': 'Origin' 
      }
    });
  }
};

