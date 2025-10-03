#!/usr/bin/env tsx

/**
 * Schema-first Migration: DevsCard → Decap/Astro
 * 
 * This script migrates one React skill to both EN/RU about pages,
 * fully conformant to content.config.ts schema.
 * 
 * Mapping (DevsCard → Target):
 * - Donor "I already know" items: name → name, icon → icon, url → url, 
 *   level → level (1-5), description → description
 * - Missing fields: default to undefined (omit from output)
 * - Unknown fields: log & ignore (e.g., iconColor)
 * - Validation: fail fast with helpful error messages
 * - Idempotency: safe to run multiple times, no duplicates
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { z } from 'zod';

// CLI argument parsing
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const overwrite = args.includes('--overwrite');
const langFilter = args.find(arg => arg.startsWith('--lang='))?.split('=')[1]?.split(',') || ['en', 'ru'];

// Content Collections schema validation (replicated from content.config.ts)
const AboutPageSchema = z.object({
  title: z.string(),
  slug: z.string(),
  lead: z.string().optional(),
  sections: z.array(
    z.object({
      type: z.string(),
      data: z.object({
        title: z.string().optional(),
        groups: z.array(
          z.object({
            title: z.string(),
            items: z.array(
              z.object({
                name: z.string(),
                icon: z.string().optional(),
                url: z.string().optional(),
                level: z.number().min(1).max(5).optional(),
                description: z.string().optional(),
              })
            )
          })
        ).optional(),
        items: z.array(
          z.object({
            name: z.string(),
            icon: z.string().optional(),
            url: z.string().optional(),
            level: z.number().min(1).max(5).optional(),
            description: z.string().optional(),
          })
        ).optional(),
      })
    })
  ).optional(),
  links: z.array(
    z.object({
      label: z.string(),
      url: z.string(),
      icon: z.string().optional(),
    })
  ).optional(),
  cv_pdf: z.string().optional(),
  gallery: z.array(z.string()).optional(),
});

type AboutPageData = z.infer<typeof AboutPageSchema>;

const contentDir = join(process.cwd(), 'src', 'content', 'aboutPage');

// React skill data conformant to schema
const reactSkillData: Record<'en' | 'ru', AboutPageData> = {
  en: {
    title: "About",
    slug: "en/about",
    sections: [
      {
        type: "skills",
        data: {
          title: "Skills",
          groups: [
            {
              title: "I already know",
              items: [
                {
                  name: "React",
                  icon: "simple-icons:react",
                  url: "https://react.dev",
                  level: 5,
                  description: "Hooks, Suspense, RSC basics"
                }
              ]
            }
          ]
        }
      }
    ]
  },
  ru: {
    title: "Обо мне",
    slug: "ru/about",
    sections: [
      {
        type: "skills",
        data: {
          title: "Навыки",
          groups: [
            {
              title: "Уже умею",
              items: [
                {
                  name: "React",
                  icon: "simple-icons:react",
                  url: "https://react.dev",
                  level: 5,
                  description: "Хуки, Suspense, основы RSC"
                }
              ]
            }
          ]
        }
      }
    ]
  }
};

function validateData(data: unknown, lang: string): AboutPageData {
  try {
    return AboutPageSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(`[migrate] ❌ Validation failed for ${lang}:`);
      error.errors.forEach(err => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      console.error(`[migrate] Expected schema:`, AboutPageSchema.shape);
      process.exit(1);
    }
    throw error;
  }
}

function parseFrontmatter(content: string): { frontmatter: string; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    return { frontmatter: '', body: content };
  }
  return { frontmatter: match[1], body: match[2] };
}

function yamlEscape(str: string): string {
  return str.replace(/"/g, '\\"');
}

function generateYaml(data: AboutPageData): string {
  const lines = ['---'];
  
  lines.push(`title: ${data.title}`);
  lines.push(`slug: ${data.slug}`);
  
  if (data.lead) {
    lines.push(`lead: "${yamlEscape(data.lead)}"`);
  }
  
  if (data.sections && data.sections.length > 0) {
    lines.push('sections:');
    data.sections.forEach(section => {
      lines.push(`  - type: ${section.type}`);
      lines.push('    data:');
      
      if (section.data.title) {
        lines.push(`      title: "${yamlEscape(section.data.title)}"`);
      }
      
      if (section.data.groups && section.data.groups.length > 0) {
        lines.push('      groups:');
        section.data.groups.forEach(group => {
          lines.push(`        - title: "${yamlEscape(group.title)}"`);
          lines.push('          items:');
          group.items.forEach(item => {
            lines.push(`            - name: "${yamlEscape(item.name)}"`);
            if (item.icon) lines.push(`              icon: "${yamlEscape(item.icon)}"`);
            if (item.url) lines.push(`              url: "${yamlEscape(item.url)}"`);
            if (item.level !== undefined) lines.push(`              level: ${item.level}`);
            if (item.description) lines.push(`              description: "${yamlEscape(item.description)}"`);
          });
        });
      }
    });
  }
  
  if (data.links && data.links.length > 0) {
    lines.push('links:');
    data.links.forEach(link => {
      lines.push(`  - label: "${yamlEscape(link.label)}"`);
      lines.push(`    url: "${yamlEscape(link.url)}"`);
      if (link.icon) lines.push(`    icon: "${yamlEscape(link.icon)}"`);
    });
  }
  
  if (data.cv_pdf) {
    lines.push(`cv_pdf: "${yamlEscape(data.cv_pdf)}"`);
  }
  
  if (data.gallery && data.gallery.length > 0) {
    lines.push('gallery:');
    data.gallery.forEach(img => {
      lines.push(`  - "${yamlEscape(img)}"`);
    });
  }
  
  lines.push('---');
  lines.push('');
  
  return lines.join('\n');
}

function mergeSections(existing: AboutPageData, newData: AboutPageData, overwrite: boolean): AboutPageData {
  if (overwrite) {
    return newData;
  }
  
  // Merge sections, replacing skills section if it exists
  const existingSections = existing.sections || [];
  const newSections = newData.sections || [];
  
  // Remove existing skills section
  const filteredSections = existingSections.filter(s => s.type !== 'skills');
  
  // Add new skills section
  const mergedSections = [...filteredSections, ...newSections];
  
  return {
    ...existing,
    sections: mergedSections
  };
}

async function migrateAboutPage(lang: 'en' | 'ru') {
  const filePath = join(contentDir, lang, 'about.md');
  
  console.log(`[migrate] Processing ${lang}/about.md...`);
  
  let existingData: AboutPageData | null = null;
  let body = '';
  
  if (existsSync(filePath)) {
    const content = readFileSync(filePath, 'utf-8');
    const { frontmatter, body: fileBody } = parseFrontmatter(content);
    body = fileBody;
    
    if (frontmatter) {
      try {
        // Simple YAML parsing for existing data
        const yaml = await import('js-yaml');
        const parsed = yaml.load(frontmatter);
        existingData = validateData(parsed, lang);
        console.log(`[migrate] Found existing ${lang}/about.md with ${existingData.sections?.length || 0} sections`);
      } catch (error) {
        console.warn(`[migrate] ⚠️  Could not parse existing frontmatter for ${lang}, will create new`);
        console.warn(`[migrate] Error: ${error.message}`);
      }
    }
  } else {
    console.log(`[migrate] Creating new ${lang}/about.md`);
  }
  
  const newData = reactSkillData[lang];
  const mergedData = existingData ? mergeSections(existingData, newData, overwrite) : newData;
  
  // Validate final data
  const validatedData = validateData(mergedData, lang);
  
  const yamlContent = generateYaml(validatedData);
  const finalContent = yamlContent + body;
  
  if (dryRun) {
    console.log(`[migrate] 🔍 DRY RUN - Would write to ${filePath}:`);
    console.log('---');
    console.log(yamlContent);
    console.log('---');
    return;
  }
  
  // Ensure directory exists
  mkdirSync(join(contentDir, lang), { recursive: true });
  
  writeFileSync(filePath, finalContent);
  console.log(`[migrate] ✅ Updated ${lang}/about.md`);
  console.log(`[migrate]   - slug: ${validatedData.slug}`);
  console.log(`[migrate]   - sections: ${validatedData.sections?.length || 0}`);
  console.log(`[migrate]   - validation: ✅ OK`);
}

// Main execution
async function main() {
  console.log('[migrate] Starting React skill migration...');
  console.log(`[migrate] Options: dry-run=${dryRun}, overwrite=${overwrite}, langs=${langFilter.join(',')}`);

  // Print mapping summary
  console.log('[migrate] Mapping summary (DevsCard → Target):');
  console.log('  - name → name (required)');
  console.log('  - icon → icon (Iconify name)');
  console.log('  - url → url (optional)');
  console.log('  - level → level (1-5, optional)');
  console.log('  - description → description (optional)');
  console.log('  - iconColor → ignored (DevsCard specific)');

  const targetLangs = langFilter.filter(lang => ['en', 'ru'].includes(lang)) as ('en' | 'ru')[];

  if (targetLangs.length === 0) {
    console.error('[migrate] ❌ No valid languages specified. Use --lang=en,ru');
    process.exit(1);
  }

  for (const lang of targetLangs) {
    await migrateAboutPage(lang);
  }

  console.log('[migrate] ✅ Migration completed!');
}

main().catch(error => {
  console.error('[migrate] ❌ Migration failed:', error);
  process.exit(1);
});
