import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get('code') || '';
  const state = url.searchParams.get('state') || '';

  // Enhanced bridge HTML with better error display
  const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>Completing OAuth…</title>
<style>
body { font-family: system-ui, sans-serif; padding: 2em; max-width: 600px; margin: 0 auto; }
pre { background: #f5f5f5; padding: 1em; border-radius: 4px; overflow: auto; }
.error { color: #d32f2f; }
</style>
</head>
<body><div id="status">Completing authentication…</div><script>
(function(){
  const statusEl = document.getElementById('status');
  function showError(data) {
    statusEl.innerHTML = '<h2 class="error">Authentication Failed</h2><pre>' + 
      JSON.stringify(data, null, 2) + '</pre>';
  }
  function done(msg) {
    try { 
      window.opener && window.opener.postMessage(msg, '*'); 
    } finally { 
      setTimeout(() => window.close(), 100);
    }
  }
  function onMsg(ev){
    if (!ev || !ev.data || (ev.data !== 'authorizing:github' && ev.data.type !== 'authorizing:github')) return;
    
    fetch('/api/decap/token', {
      method: 'POST',
      headers: { 
        'content-type': 'application/json',
        'x-requested-with': 'XMLHttpRequest'
      },
      credentials: 'include', // <- carry HttpOnly cookie
      mode: 'same-origin',
      body: JSON.stringify({ code: ${JSON.stringify(code)}, state: ${JSON.stringify(state)} })
    }).then(r => {
      if (!r.ok) {
        return r.json().then(data => {
          showError(data);
          done({ type: 'authorization:github:error', error: data.error || 'token_exchange_failed', details: data });
        });
      }
      return r.json();
    }).then(data => {
      if (data && data.token) {
        done({ type: 'authorization:github:success', token: data.token });
      } else if (data && data.error) {
        showError(data);
        done({ type: 'authorization:github:error', error: data.error, details: data });
      }
    }).catch(err => {
      const errData = { error: 'network_error', message: String(err) };
      showError(errData);
      done({ type: 'authorization:github:error', error: String(err) });
    });
  }
  window.addEventListener('message', onMsg, false);
  window.opener && window.opener.postMessage('authorizing:github', '*');
})();
</script></body></html>`;

  return new Response(html, { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' } });
};
