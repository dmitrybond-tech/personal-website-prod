import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request, cookies }) => {
  const state = cookies.get('decap_oauth_state')?.value || null;
  const ok = {
    ok: true,
    env: {
      has_client_id: Boolean(process.env.DECAP_GITHUB_CLIENT_ID || process.env.AUTHJS_GITHUB_CLIENT_ID),
      has_client_secret: Boolean(process.env.DECAP_GITHUB_CLIENT_SECRET || process.env.AUTHJS_GITHUB_CLIENT_SECRET),
    },
    cookie_state_present: Boolean(state),
  };
  return new Response(JSON.stringify(ok), { headers: { 'content-type': 'application/json' } });
};
