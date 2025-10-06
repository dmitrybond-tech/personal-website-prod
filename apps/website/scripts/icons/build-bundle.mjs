import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const usedFile = join(ROOT, 'scripts/icons/.icons-used.json');

if (!existsSync(usedFile)) {
  console.error('[icons:bundle] .icons-used.json not found. Run icons:collect first.');
  process.exit(1);
}

console.log('[icons:bundle] Loading icon packs...');

// Import JSON sets from @iconify-json packages
const packs = {};
try {
  packs.mdi = JSON.parse(readFileSync(join(process.cwd(), 'node_modules/@iconify-json/mdi/icons.json'), 'utf8'));
  packs['fa6-solid'] = JSON.parse(readFileSync(join(process.cwd(), 'node_modules/@iconify-json/fa6-solid/icons.json'), 'utf8'));
  packs['fa6-brands'] = JSON.parse(readFileSync(join(process.cwd(), 'node_modules/@iconify-json/fa6-brands/icons.json'), 'utf8'));
  packs['simple-icons'] = JSON.parse(readFileSync(join(process.cwd(), 'node_modules/@iconify-json/simple-icons/icons.json'), 'utf8'));
  packs.twemoji = JSON.parse(readFileSync(join(process.cwd(), 'node_modules/@iconify-json/twemoji/icons.json'), 'utf8'));
  
  // Try to load circle-flags if it exists
  try {
    packs['circle-flags'] = JSON.parse(readFileSync(join(process.cwd(), 'node_modules/@iconify-json/circle-flags/icons.json'), 'utf8'));
  } catch (e) {
    console.warn('[icons:bundle] circle-flags package not found, skipping');
  }
} catch (error) {
  console.error('[icons:bundle] Failed to load icon packs:', error.message);
  console.log('[icons:bundle] Make sure to run: npm install');
  process.exit(1);
}

const used = JSON.parse(readFileSync(usedFile, 'utf8'));
console.log('[icons:bundle] Building bundle for:', Object.fromEntries(Object.entries(used).map(([p, a]) => [p, a.length])));

const bundle = [];
let total = 0;
const warnings = [];

for (const [prefix, names] of Object.entries(used)) {
  const pack = packs[prefix];
  if (!pack) {
    console.warn(`[icons:bundle] Pack not found: ${prefix}`);
    continue;
  }
  
  const icons = {};
  const aliases = {};
  
  for (const name of names) {
    const data = pack.icons[name];
    if (data) { 
      icons[name] = data; 
      total++; 
    } else if (pack.aliases?.[name]) { 
      aliases[name] = pack.aliases[name]; 
      total++; 
    } else {
      warnings.push(`${prefix}:${name}`);
    }
  }
  
  if (Object.keys(icons).length || Object.keys(aliases).length) {
    bundle.push({ prefix, icons, aliases });
  }
}

if (warnings.length > 0) {
  console.warn('[icons:bundle] Missing icons:', warnings.slice(0, 10));
  if (warnings.length > 10) {
    console.warn(`[icons:bundle] ... and ${warnings.length - 10} more`);
  }
}

const meta = { 
  totalIcons: total, 
  prefixes: bundle.map(b => b.prefix), 
  generatedAt: new Date().toISOString() 
};

// Generate TypeScript module
const ts = [
  `/* AUTO-GENERATED: DO NOT EDIT BY HAND */`,
  `/* Run: npm run -w apps/website icons:rebuild */`,
  `export const __META__ = ${JSON.stringify(meta, null, 2)} as const;`,
  `export function registerIconifyCollections(){`,
  `  // @ts-ignore`,
  `  const I = (globalThis as any).Iconify;`,
  `  if(!I || typeof I.addCollection!=='function'){`,
  `    console.error('[Iconify] iconify-icon not registered before bundle');`,
  `    return;`,
  `  }`
].concat(bundle.map(b => `  I.addCollection(${JSON.stringify({ prefix: b.prefix, icons: b.icons, aliases: b.aliases || {} })});`))
 .concat([`}`]).join('\n');

// Ensure output directories exist
const sharedDir = join(ROOT, 'src/shared/iconify');
const publicDir = join(ROOT, 'public');

if (!existsSync(sharedDir)) {
  mkdirSync(sharedDir, { recursive: true });
}

// Write generated files
writeFileSync(join(sharedDir, 'bundle.generated.ts'), ts);
writeFileSync(join(publicDir, 'iconify-bundle.debug.json'), JSON.stringify({ meta, bundle }, null, 2));

console.log('[icons:bundle] done', meta);
console.log(`[icons:bundle] Generated: ${total} icons across ${bundle.length} collections`);
