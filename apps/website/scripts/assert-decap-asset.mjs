import { statSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const p = resolve(process.cwd(), 'public/website-admin/decap-cms-3.8.4.min.js');
try {
  const st = statSync(p);
  if (!st.isFile() || st.size < 300_000) {
    console.error(`[assert-decap] Asset too small or not a file: ${p}, size=${st.size}`);
    process.exit(1);
  }
  // quick sanity: must contain "Netlify" or "Decap" banner
  const head = readFileSync(p, 'utf8').slice(0, 2000);
  if (!/Decap|Netlify/i.test(head)) {
    console.error('[assert-decap] Unexpected file contents, not a Decap bundle.');
    process.exit(1);
  }
  console.log('[assert-decap] OK:', p, `(${st.size} bytes)`);
} catch (e) {
  console.error('[assert-decap] Missing asset:', p, e?.message || e);
  process.exit(1);
}

