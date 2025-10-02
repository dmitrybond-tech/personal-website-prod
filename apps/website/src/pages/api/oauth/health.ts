export const prerender = false;
export async function GET() {
  const body = {
    ok: true,
    authjs: !!process.env.AUTHJS_GITHUB_CLIENT_ID,
    decap:  !!process.env.DECAP_GITHUB_CLIENT_ID,
    // без секретов!
  };
  console.log('[HEALTH] /api/oauth/health', body);
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type':'application/json', 'Cache-Control':'no-store' }
  });
}