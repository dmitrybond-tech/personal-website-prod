import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const prerender = false;

export async function GET() {
  try {
    const yml = await readFile(join(process.cwd(),'public','website-admin','config.yml'), 'utf-8');
    return new Response(JSON.stringify({ ok: true, bytes: yml.length }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
    });
  } catch (e:any) {
    return new Response(JSON.stringify({ ok:false, error: e?.message || String(e) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
    });
  }
}
