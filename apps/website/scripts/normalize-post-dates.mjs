import { promises as fs } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const dir = join(root, 'src/content/posts');

const G = /^(date\s*:\s*)(.+)$/mi;

const files = [];
async function walk(p) {
  const entries = await fs.readdir(p, { withFileTypes: true });
  for (const e of entries) {
    const fp = join(p, e.name);
    if (e.isDirectory()) await walk(fp);
    else if (/\.(md|mdx)$/i.test(e.name)) files.push(fp);
  }
}

function toISO(s) {
  if (!s) return null;
  s = s.trim().replace(/\u2012|\u2013|\u2014|\u2212/g, '-');
  if (/^\d{4}-\d{2}-\d{2}(T.*)?$/.test(s)) return s.slice(0,10);
  const m = s.match(/^(\d{2})[./-](\d{2})[./-](\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return null;
}

(async () => {
  await walk(dir);
  let changed = 0;
  for (const fp of files) {
    let txt = await fs.readFile(fp, 'utf-8');
    const m = txt.match(G);
    if (!m) continue;
    const raw = m[2];
    const iso = toISO(raw);
    const val = iso ?? new Date().toISOString().slice(0,10);
    if (!iso) console.warn('[normalize-dates] fallback date in', fp, '=>', val);
    const next = txt.replace(G, `$1${val}`);
    if (next !== txt) {
      await fs.writeFile(fp, next, 'utf-8');
      changed++;
    }
  }
  console.log(`[normalize-dates] updated files: ${changed}`);
})();
