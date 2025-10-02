import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const prerender = false;

export async function GET() {
  const DEV = process.env.NODE_ENV !== 'production';
  const p = join(process.cwd(), 'public', 'website-admin', 'config.yml');

  try {
    let yml = await readFile(p, 'utf-8');

    // ЖЁСТКО: local_backend включаем только если явно DECAP_LOCAL_BACKEND=TRUE (в любом регистре)
    const USE_LOCAL = DEV && /^true$/i.test(process.env.DECAP_LOCAL_BACKEND ?? '');
    if (USE_LOCAL) {
      yml = 'local_backend: true\n' + yml;
    }

    if (DEV) {
      console.log(`[API config] local_backend: ${USE_LOCAL ? 'ENABLED' : 'DISABLED'} (env: ${process.env.DECAP_LOCAL_BACKEND ?? 'unset'})`);
      console.log('[API config] 200 OK from', p, '| bytes =', yml.length);
    }

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

