import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get('code') || '';
  const state = url.searchParams.get('state') || '';

  const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>Completing OAuth…</title></head>
<body><script>
(function(){
  function done(msg){ try { window.opener && window.opener.postMessage(msg, '*'); } finally { window.close(); } }
  function onMsg(ev){
    if (!ev || !ev.data || (ev.data !== 'authorizing:github' && ev.data.type !== 'authorizing:github')) return;
    fetch('/api/decap/token', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'include', // <- carry HttpOnly cookie
      body: JSON.stringify({ code: ${JSON.stringify(code)}, state: ${JSON.stringify(state)} })
    }).then(r => r.json()).then(data => {
      if (data && data.token) done({ type: 'authorization:github:success', token: data.token });
      else done({ type: 'authorization:github:error', error: (data && (data.error || 'token_missing')) || 'unknown' });
    }).catch(err => done({ type: 'authorization:github:error', error: String(err) }));
  }
  window.addEventListener('message', onMsg, false);
  window.opener && window.opener.postMessage('authorizing:github', '*');
})();
</script></body></html>`;

  return new Response(html, { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' } });
};
