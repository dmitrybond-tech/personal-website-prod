// node apps/website/scripts/decap-doctor.mjs
import fs from 'node:fs/promises';
import path from 'node:path';
import yaml from 'yaml';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const candidates = [
  'public/website-admin/config.generated.yml',
  'public/admin/config.generated.yml',
  'public/admin/config.yml',
];

function exists(p) { return fs.access(p).then(() => true).catch(() => false); }

const found = [];
for (const rel of candidates) {
  // eslint-disable-next-line no-await-in-loop
  if (await exists(path.join(ROOT, rel))) found.push(rel);
}
if (!found.length) {
  console.log('[doctor] no config files found in', candidates);
  process.exit(1);
}

console.log('[doctor] found configs:', found);
const content = await fs.readFile(path.join(ROOT, found[0]), 'utf8');
const cfg = yaml.parse(content);
console.log('[doctor] local_backend:', cfg.local_backend);
console.log('[doctor] collections:', (cfg.collections || []).map(c => c.name));
