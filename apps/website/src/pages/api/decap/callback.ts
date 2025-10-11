import type { APIRoute } from 'astro';

/**
 * OAuth callback bridge for Decap CMS
 * GitHub redirects here after user authorizes
 * GET /api/decap/callback?code=<auth_code>&state=<state>
 * 
 * This page implements the postMessage bridge pattern:
 * 1. Receives code & state from GitHub redirect
 * 2. Sends handshake message to opener (Decap popup listener)
 * 3. On handshake response, calls /api/decap/token to exchange code for token
 * 4. Posts result back to opener via postMessage
 * 5. Closes popup window
 */
export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get('code') || '';
  const state = url.searchParams.get('state') || '';
  const error = url.searchParams.get('error');

  if (error) {
    console.error(`[OAuth Callback] GitHub error: ${error}`);
  }

  console.log(`[OAuth Callback] Rendering bridge page (code: ${code ? code.substring(0, 10) + '...' : 'missing'})`);

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Completing OAuth…</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 2rem; text-align: center; color: #333; }
    .status { margin: 2rem 0; }
    .error { color: #dc2626; }
  </style>
</head>
<body>
  <h1>Completing authentication...</h1>
  <div class="status" id="status">Please wait...</div>
  <script>
(function(){
  const statusEl = document.getElementById('status');
  
  function setStatus(msg, isError) {
    statusEl.textContent = msg;
    if (isError) statusEl.className = 'status error';
  }

  // Check for GitHub OAuth error
  const error = ${JSON.stringify(error)};
  if (error) {
    console.error('[OAuth Bridge] GitHub returned error:', error);
    setStatus('GitHub authorization error: ' + error, true);
    if (window.opener) {
      window.opener.postMessage({ 
        type: 'authorization:github:error', 
        error: error 
      }, '*');
      setTimeout(() => window.close(), 2000);
    }
    return;
  }

  const code = ${JSON.stringify(code)};
  const state = ${JSON.stringify(state)};

  if (!code) {
    console.error('[OAuth Bridge] Missing authorization code');
    setStatus('Missing authorization code from GitHub', true);
    if (window.opener) {
      window.opener.postMessage({ 
        type: 'authorization:github:error', 
        error: 'missing_code' 
      }, '*');
      setTimeout(() => window.close(), 2000);
    }
    return;
  }

  console.log('[OAuth Bridge] Bridge page loaded, initiating handshake');

  function onMsg(ev){
    if (!ev || !ev.data) return;
    
    // Listen for Decap's handshake message
    if (ev.data === 'authorizing:github' || ev.data.type === 'authorizing:github') {
      console.log('[OAuth Bridge] Handshake received, exchanging code for token');
      setStatus('Exchanging code for token...');
      
      fetch('/api/decap/token', {
        method: 'POST',
        headers: {'content-type': 'application/json'},
        body: JSON.stringify({ code: code, state: state })
      })
      .then(r => r.json())
      .then(data => {
        if (data && data.token) {
          console.log('[OAuth Bridge] Token received, posting success to opener');
          setStatus('Success! Closing window...');
          if (window.opener) {
            window.opener.postMessage({ 
              type: 'authorization:github:success', 
              token: data.token 
            }, '*');
          }
        } else {
          console.error('[OAuth Bridge] Token exchange failed:', data);
          setStatus('Token exchange failed: ' + (data && data.error || 'token_missing'), true);
          if (window.opener) {
            window.opener.postMessage({ 
              type: 'authorization:github:error', 
              error: data && (data.error || 'token_missing') 
            }, '*');
          }
        }
        setTimeout(() => window.close(), 1000);
      })
      .catch(err => {
        console.error('[OAuth Bridge] Fetch error:', err);
        setStatus('Network error: ' + String(err), true);
        if (window.opener) {
          window.opener.postMessage({ 
            type: 'authorization:github:error', 
            error: String(err) 
          }, '*');
        }
        setTimeout(() => window.close(), 2000);
      });
    }
  }

  window.addEventListener('message', onMsg, false);
  
  // Kick off the handshake for Decap popup listener
  if (window.opener) {
    console.log('[OAuth Bridge] Sending handshake to opener');
    window.opener.postMessage('authorizing:github', '*');
  } else {
    console.warn('[OAuth Bridge] No window.opener found');
    setStatus('No parent window found', true);
  }
})();
  </script>
</body>
</html>`;

  return new Response(html, { 
    status: 200, 
    headers: { 
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store, no-cache, must-revalidate'
    } 
  });
};
