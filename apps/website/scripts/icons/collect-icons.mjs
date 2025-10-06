import { readFileSync, readdirSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, extname } from 'node:path';

const ROOT = process.cwd();
const SRC = join(ROOT, 'src');
const CONTENT = join(ROOT, 'src', 'content');

const brandByDomain = {
  'github.com': 'simple-icons:github',
  'linkedin.com': 'simple-icons:linkedin',
  'x.com': 'simple-icons:x',
  'twitter.com': 'simple-icons:x',
  'youtube.com': 'simple-icons:youtube',
  'medium.com': 'simple-icons:medium',
  'notion.so': 'simple-icons:notion',
  'figma.com': 'simple-icons:figma',
  'vercel.com': 'simple-icons:vercel',
  'cal.com': 'simple-icons:calcom',
  'aws.amazon.com': 'simple-icons:amazonaws',
  'azure.microsoft.com': 'simple-icons:microsoftazure',
  'cloud.google.com': 'simple-icons:googlecloud',
  'docker.com': 'simple-icons:docker',
  'kubernetes.io': 'simple-icons:kubernetes',
  't.me': 'simple-icons:telegram'
};

const fallbacks = [
  // tuples: [includePattern, iconId]
  [/skills.*discovery/i, 'mdi:compass'],
  [/skills.*delivery/i, 'mdi:truck-fast'],
  [/skills.*analytics/i, 'mdi:chart-line'],
  [/education/i, 'mdi:school'],
  [/experience/i, 'mdi:briefcase'],
  [/favorites.*books/i, 'mdi:book-open-variant'],
  [/favorites.*movies/i, 'mdi:movie-open'],
  [/favorites.*medias/i, 'mdi:newspaper-variant'],
  [/favorites.*hobbies/i, 'mdi:heart-pulse']
];

function walk(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  
  for (const f of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, f.name);
    if (f.isDirectory()) {
      walk(p, acc);
    } else if (/\.(md|astro|tsx?|jsx?)$/.test(f.name)) {
      acc.push(p);
    }
  }
  return acc;
}

function extractIconsAndLinks(file, relPath) {
  const text = readFileSync(file, 'utf8');
  
  // Extract icon: values via regex (both quoted and unquoted)
  const icons = [
    ...text.matchAll(/icon:\s*['"]([a-z0-9-]+:[a-z0-9-]+)['"]/gi),
    ...text.matchAll(/icon:\s*([a-z0-9-]+:[a-z0-9-]+)(?:\s|$)/gi)
  ].map(m => m[1]);
  
  // Extract link: values
  const links = [...text.matchAll(/link:\s*['"]([^'"]+)['"]/gi)].map(m => m[1]);
  
  // Map links to brand icons
  const brands = links.map(u => {
    try {
      const url = new URL(u);
      const domain = url.hostname.replace(/^www\./, '');
      return brandByDomain[domain];
    } catch { 
      return null; 
    }
  }).filter(Boolean);

  // Contextual path fallback
  const fb = fallbacks.find(([rx]) => rx.test(relPath));
  const fallbackIcon = fb ? fb[1] : null;

  return { icons, brands, fallbackIcon };
}

console.log('[icons:collect] Scanning for icons...');

const files = walk(SRC).concat(walk(CONTENT));
console.log(`[icons:collect] Found ${files.length} files to scan`);

const ids = new Set();
for (const abs of files) {
  const rel = abs.replace(ROOT + '\\', '').replace(ROOT + '/', '');
  const { icons, brands, fallbackIcon } = extractIconsAndLinks(abs, rel);
  
  icons.concat(brands).forEach(id => ids.add(id));
  if (fallbackIcon) ids.add(fallbackIcon);
}

console.log(`[icons:collect] Found ${ids.size} unique icon references`);

// Sanitize and bucket by prefix
const buckets = {};
for (const full of ids) {
  if (!/^[a-z0-9-]+:[a-z0-9-]+$/.test(full)) {
    console.warn(`[icons:collect] Invalid icon ID format: ${full}`);
    continue;
  }
  const [prefix, name] = full.split(':');
  (buckets[prefix] ||= new Set()).add(name);
}

const out = {};
for (const [prefix, set] of Object.entries(buckets)) {
  out[prefix] = [...set].sort();
}

// Ensure output directory exists
const outputDir = join(ROOT, 'scripts/icons');
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

writeFileSync(join(outputDir, '.icons-used.json'), JSON.stringify(out, null, 2));

const stats = Object.fromEntries(Object.entries(out).map(([p, a]) => [p, a.length]));
console.log('[icons:collect] wrote .icons-used.json', stats);
