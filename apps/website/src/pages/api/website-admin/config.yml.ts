import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const prerender = false;

export async function GET() {
  const DEV = process.env.NODE_ENV !== 'production';
  const p = join(process.cwd(), 'public', 'website-admin', 'config.yml');
  try {
    const yml = await readFile(p, 'utf-8');
    if (DEV) console.log('[API config] 200 OK from', p, '| bytes =', yml.length);
    return new Response(yml, {
      status: 200,
      headers: {
        'Content-Type': 'text/yaml; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (e) {
    console.error('[API config] 404', p, e);
    return new Response('# config.yml not found\n', {
      status: 404,
      headers: { 'Content-Type': 'text/yaml; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  }
}

