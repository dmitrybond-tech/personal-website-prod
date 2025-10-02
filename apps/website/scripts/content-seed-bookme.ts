#!/usr/bin/env tsx

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(new URL(import.meta.url)));
const projectRoot = join(__dirname, '..');
const refRoot = join(projectRoot, '..', 'website-vanilla_ref');

interface SeedOptions {
  force?: boolean;
  verbose?: boolean;
}

function log(message: string, verbose = false) {
  if (verbose) {
    console.log(`[SEED] ${message}`);
  }
}

function seedBookmeContent(locale: 'en' | 'ru', options: SeedOptions = {}) {
  const { force = false, verbose = false } = options;
  
  log(`Seeding bookme content for ${locale}`, verbose);
  
  // Source paths
  const refBookmePath = join(refRoot, 'src', 'content', locale, 'bookme.ts');
  
  // Target paths
  const targetConfigPath = join(projectRoot, 'src', 'content', 'bookmeConfig', locale, 'config.yaml');
  
  // Check if source exists
  if (!existsSync(refBookmePath)) {
    console.warn(`[SEED] Source file not found: ${refBookmePath}`);
    return;
  }
  
  // Check if target exists and force is not set
  if (existsSync(targetConfigPath) && !force) {
    console.log(`[SEED] Target file exists, skipping: ${targetConfigPath} (use --force to overwrite)`);
    return;
  }
  
  try {
    // Read reference data
    const refContent = readFileSync(refBookmePath, 'utf-8');
    
    // Extract data using simple regex
    const titleMatch = refContent.match(/title:\s*['"`]([^'"`]+)['"`]/);
    const subtitleMatch = refContent.match(/subtitle:\s*['"`]([^'"`]+)['"`]/);
    const descriptionMatch = refContent.match(/description:\s*['"`]([^'"`]+)['"`]/);
    
    const title = titleMatch?.[1] || (locale === 'ru' ? 'Записаться на встречу' : 'Book a Meeting');
    const subtitle = subtitleMatch?.[1] || (locale === 'ru' ? 'Запланируйте звонок для обсуждения вашего проекта' : 'Schedule a call to discuss your project');
    const description = descriptionMatch?.[1] || (locale === 'ru' ? 'Я доступен для консультаций, менторства и обсуждения проектов.' : 'I\'m available for consultation, mentoring, and project discussions.');
    
    // Generate YAML content
    const yamlContent = `page_title: "${title}"
page_subtitle: "${subtitle}"
cal:
  handle: "dima-bond-git"
  eventType: "intro"
  attrs:
    hideEventTypeDetails: "true"
    hideGdprBanner: "true"
    theme: "light"
tiles:
  - id: "intro-30"
    title: "${locale === 'ru' ? 'Знакомство' : 'Intro call'}"
    description: "${locale === 'ru' ? '30 минут' : '30 min'}"
    cta_text: "${locale === 'ru' ? 'Записаться' : 'Book'}"
    cta_kind: "cal"
    cal_preset: "dima-bond-git/intro-30m"
    visible: true
    icon: "calendar"
  - id: "tech-consultation"
    title: "${locale === 'ru' ? 'Техническая консультация' : 'Technical Consultation'}"
    description: "${locale === 'ru' ? '90 минут' : '90 min'}"
    cta_text: "${locale === 'ru' ? 'Записаться' : 'Book'}"
    cta_kind: "cal"
    cal_preset: "dima-bond-git/tech-90m"
    visible: true
    icon: "code"
  - id: "mentoring"
    title: "${locale === 'ru' ? 'Менторинг' : 'Mentoring'}"
    description: "${locale === 'ru' ? '60 минут' : '60 min'}"
    cta_text: "${locale === 'ru' ? 'Записаться' : 'Book'}"
    cta_kind: "cal"
    cal_preset: "dima-bond-git/mentoring-60m"
    visible: true
    icon: "graduation-cap"
footer_note: "${description}"`;
    
    // Ensure target directory exists
    mkdirSync(dirname(targetConfigPath), { recursive: true });
    
    // Write YAML file
    writeFileSync(targetConfigPath, yamlContent);
    log(`Created: ${targetConfigPath}`, verbose);
    
    console.log(`✅ Seeded bookme content for ${locale}`);
    
  } catch (error) {
    console.error(`❌ Failed to seed bookme content for ${locale}:`, error);
  }
}

// CLI handling
const args = process.argv.slice(2);
const force = args.includes('--force');
const verbose = args.includes('--verbose');
const locales = args.filter(arg => arg === 'en' || arg === 'ru');

const options = { force, verbose };

if (locales.length === 0) {
  // Seed both locales if none specified
  seedBookmeContent('en', options);
  seedBookmeContent('ru', options);
} else {
  // Seed specified locales
  locales.forEach(locale => seedBookmeContent(locale as 'en' | 'ru', options));
}

console.log('Bookme content seeding completed!');