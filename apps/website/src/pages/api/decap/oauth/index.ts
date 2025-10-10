import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  // 302 Redirect to ./authorize with preserved query string
  const redirectUrl = new URL('./authorize', url);
  
  return new Response(null, {
    status: 302,
    headers: {
      'Location': redirectUrl.toString(),
      'Cache-Control': 'no-store'
    }
  });
};
