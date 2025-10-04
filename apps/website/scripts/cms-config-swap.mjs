import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const adminDir = path.resolve(__dirname, '../public/website-admin');

const mode = process.argv[2] || 'dev'; // 'dev' | 'prod'
const src = path.join(adminDir, mode === 'prod' ? 'config.prod.yml' : 'config.dev.yml');
const dst = path.join(adminDir, 'config.generated.yml');

const yml = await fs.readFile(src, 'utf8');
await fs.writeFile(dst, yml, 'utf8');
console.log(`[cms-config-swap] wrote ${path.relative(process.cwd(), dst)} from ${path.basename(src)}`);
