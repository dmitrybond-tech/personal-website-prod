import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get('code') || '';
  const state = url.searchParams.get('state') || '';

  // Enhanced bridge HTML with STRING-ONLY postMessage for Decap CMS
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
  const params = new URLSearchParams(location.search);
  const code = params.get('code');
  const state = params.get('state');
  
  function send(kind, obj) {
    const payload = JSON.stringify(obj || {});
    window.opener && window.opener.postMessage(\`authorization:github:\${kind}:\${payload}\`, "*");
  }
  
  function showError(data) {
    document.body.innerHTML = '<h2 class="error">OAuth error</h2><pre style="font:12px/1.4 monospace;white-space:pre-wrap;">' + 
      JSON.stringify(data, null, 2) + '</pre>';
  }
  
  // Рукопожатие
  try { 
    window.opener && window.opener.postMessage("authorizing:github", "*"); 
  } catch(e) {}
  
  fetch("/api/decap/token", {
    method: "POST",
    credentials: "include",
    mode: "same-origin",
    headers: { 
      "content-type": "application/json", 
      "x-requested-with": "XMLHttpRequest" 
    },
    body: JSON.stringify({ code: code, state: state })
  })
  .then(r => r.json())
  .then(data => {
    if (data && data.token) {
      send("success", { token: data.token });
      window.close();
    } else {
      const errorData = { 
        error: data?.error || "token_missing", 
        details: data?.details || null 
      };
      send("error", errorData);
      showError(errorData);
    }
  })
  .catch(err => {
    const errorData = { 
      error: "bridge_exception", 
      details: String(err) 
    };
    send("error", errorData);
    showError(errorData);
  });
})();
</script></body></html>`;

  return new Response(html, { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' } });
};
