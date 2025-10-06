// ESM script: scan MD frontmatter, map skill names to Iconify stock icons.
// Priority: logos -> simple-icons -> devicon -> skill-icons -> generic (mdi)
// Language flags are not processed here (handled elsewhere).

import { readFileSync, writeFileSync } from 'node:fs';
import { readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');                 // apps/website
const CONTENT = join(ROOT, 'src', 'content', 'aboutPage');

const NORM = (s) => String(s||'').toLowerCase()
  .replace(/[\s_+.-]/g, '')
  .replace(/[^a-z0-9]/g, '');

// Curated dictionary (expand as needed). Prefer colorful `logos:*`.
const MAP = {
  // Clouds
  aws:'logos:aws', amazonwebservices:'logos:aws',
  azure:'logos:microsoft-azure', gcp:'logos:google-cloud', googlecloud:'logos:google-cloud',
  // Languages & runtimes
  javascript:'logos:javascript', js:'logos:javascript',
  typescript:'logos:typescript-icon', ts:'logos:typescript-icon',
  python:'logos:python', go:'logos:go', golang:'logos:go',
  java:'logos:java', php:'logos:php', ruby:'logos:ruby',
  node:'logos:nodejs-icon', nodejs:'logos:nodejs-icon', bun:'logos:bun',
  // Web & frameworks
  react:'logos:react', next:'logos:nextjs-icon', nextjs:'logos:nextjs-icon',
  vue:'logos:vue', nuxt:'logos:nuxt-icon', nuxtjs:'logos:nuxt-icon',
  angular:'logos:angular-icon', svelte:'logos:svelte-icon',
  astro:'logos:astro-icon', vite:'logos:vite',
  // Styles & UI
  tailwind:'logos:tailwindcss-icon', sass:'logos:sass', less:'logos:less',
  // Backends & APIs
  fastapi:'simple-icons:fastapi', django:'simple-icons:django', flask:'simple-icons:flask',
  spring:'logos:spring-icon', express:'simple-icons:express', graphql:'logos:graphql',
  // Tooling & test
  webpack:'logos:webpack', eslint:'logos:eslint', prettier:'logos:prettier',
  jest:'logos:jest', vitest:'simple-icons:vitest',
  cypress:'logos:cypress', playwright:'simple-icons:playwright',
  storybook:'logos:storybook',
  // Databases / queues
  postgres:'logos:postgresql', postgresql:'logos:postgresql',
  mysql:'logos:mysql', mariadb:'logos:mariadb',
  sqlite:'logos:sqlite', mongodb:'logos:mongodb-icon',
  redis:'logos:redis', rabbitmq:'logos:rabbitmq-icon',
  clickhouse:'simple-icons:clickhouse', kafka:'logos:apache-kafka',
  // Observability
  prometheus:'logos:prometheus', grafana:'logos:grafana', opentelemetry:'simple-icons:opentelemetry',
  // DevOps & infra
  docker:'logos:docker-icon', kubernetes:'logos:kubernetes',
  helm:'logos:helm', nginx:'logos:nginx', caddy:'simple-icons:caddy',
  terraform:'logos:terraform-icon', ansible:'logos:ansible',
  // CI/CD & hosting
  githubactions:'logos:github-actions', gitlab:'logos:gitlab',
  vercel:'logos:vercel-icon', netlify:'logos:netlify',
  // BaaS
  firebase:'logos:firebase', supabase:'logos:supabase-icon',
  // Security / VPN (common in this repo)
  wireguard:'simple-icons:wireguard', openvpn:'logos:openvpn',
  // Generic PM/Delivery/Analytics (fallback to mdi:*)
  discovery:'mdi:magnify', delivery:'mdi:truck-delivery-outline', analytics:'mdi:chart-line',
  // Additional mappings for skills found in the content
  itil:'simple-icons:itil', pmbok:'simple-icons:projectmanagementinstitute',
  agile:'simple-icons:agile', devops:'simple-icons:googlecloud',
  togaf:'simple-icons:iso', iso27001:'simple-icons:eslint',
  cloud:'simple-icons:amazonaws', linux:'simple-icons:linux',
  webdev:'simple-icons:webcomponents', sql:'simple-icons:postgresql',
  mlai:'simple-icons:tensorflow', tensorflow:'simple-icons:tensorflow',
  // Language flags (keep as-is, but include for completeness)
  english:'twemoji:flag-united-kingdom', russian:'twemoji:flag-russia', dutch:'twemoji:flag-netherlands',
};

const GENERIC_FALLBACK = 'mdi:help-circle';

// Heuristic resolver: prefer logos, then simple-icons, then devicon/skill-icons, else mdi fallback
function resolveIconName(label, explicit) {
  if (explicit && typeof explicit === 'string') return explicit; // respect explicit overrides
  const k = NORM(label);
  if (!k) return GENERIC_FALLBACK;

  if (MAP[k]) return MAP[k];

  // lightweight heuristics
  const candidates = [
    `logos:${k}`,
    `logos:${k}icon`,
    `simple-icons:${k}`,
    `simple-icons:${k}js`,
    `devicon:${k}`,
    `devicon:${k}-plain`,
    `skill-icons:${k}`,
  ];

  // Do not validate against local packs: CDN will serve what's valid;
  // we keep heuristic order and let missing ones fall back to mdi.
  // Keep the FIRST candidate; UI can still draw even if a few miss.
  return candidates[0] || GENERIC_FALLBACK;
}

function parseFrontmatter(md) {
  const m = md.match(/^---\s*([\s\S]*?)\s*---/);
  if (!m) return {};
  return YAML.parse(m[1] || '{}') || {};
}

function extractSkillsItems(fm) {
  const sections = Array.isArray(fm.sections) ? fm.sections : [];
  const skillSec = sections.find(s => (s?.type || '').toLowerCase() === 'skills');
  const groups = skillSec?.data?.groups || [];
  const items = [];
  for (const g of groups) for (const it of (g.items || [])) items.push(it);
  return items;
}

function resolveSkills() {
  const langs = readdirSync(CONTENT, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);
  const mapping = {};
  const seen = new Set();

  for (const lang of langs) {
    const mdPath = join(CONTENT, lang, 'about-expanded.md');
    const raw = readFileSync(mdPath, 'utf8');
    const fm = parseFrontmatter(raw);
    const items = extractSkillsItems(fm);

    for (const it of items) {
      const name = it?.name || '';
      const explicit = it?.icon || '';
      const key = NORM(name);
      if (!key || seen.has(key)) continue;

      // skip language flags explicitly if they are labeled as flags or contain language levels
      const looksLikeFlag = /flag|language|locale|ru|en|de|native|c1|a1|b1|b2/i.test(name);
      if (looksLikeFlag) continue;

      mapping[key] = resolveIconName(name, explicit);
      seen.add(key);
    }
  }
  return mapping;
}

const out = resolveSkills();
const OUT_DIR = join(ROOT, 'src', 'shared', 'iconify');
const OUT_MAP = join(OUT_DIR, 'skill-icons.resolved.json');

// Ensure directory exists
import { mkdirSync } from 'node:fs';
try {
  mkdirSync(OUT_DIR, { recursive: true });
} catch (e) {
  // Directory might already exist
}

writeFileSync(OUT_MAP, JSON.stringify(out, null, 2));
console.log('[stock-icons] mapping written:', OUT_MAP, 'count=', Object.keys(out).length);
