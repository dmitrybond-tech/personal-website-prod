export const prerender = false;
export async function GET({ url }) {
  console.log('[API config alias] 307 → /api/website-admin/config.yml');
  return Response.redirect(new URL('/api/website-admin/config.yml', url).toString(), 307);
}