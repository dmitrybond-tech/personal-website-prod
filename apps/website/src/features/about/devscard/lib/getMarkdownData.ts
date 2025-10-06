import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import YAML from 'yaml';

const CONTENT_ROOT = join(process.cwd(), 'src', 'content', 'aboutPage');

function parseFrontmatter(md: string) {
  const m = md.match(/^---\s*([\s\S]*?)\s*---/);
  if (!m) return {};
  return YAML.parse(m[1] || '{}') || {};
}

function extractSkillsFromMarkdown(fm: any) {
  const sections = Array.isArray(fm.sections) ? fm.sections : [];
  const skillSec = sections.find((s: any) => (s?.type || '').toLowerCase() === 'skills');
  const groups = skillSec?.data?.groups || [];
  
  return groups.map((group: any) => ({
    title: group.title || '',
    items: (group.items || []).map((item: any) => ({
      name: item.name || '',
      icon: item.icon || '',
      level: item.level,
      description: item.description || '',
    }))
  }));
}

export function getMarkdownSkillsData(locale: 'en' | 'ru') {
  const mdPath = join(CONTENT_ROOT, locale, 'about-expanded.md');
  const raw = readFileSync(mdPath, 'utf8');
  const fm = parseFrontmatter(raw);
  const skillSets = extractSkillsFromMarkdown(fm);
  
  return {
    config: {
      title: 'Skills',
      slug: 'skills',
      icon: 'fa6-solid:bars-progress',
      visible: true,
    },
    skillSets,
  };
}
