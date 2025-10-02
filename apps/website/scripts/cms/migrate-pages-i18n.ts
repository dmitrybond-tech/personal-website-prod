#!/usr/bin/env tsx

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

interface AboutBlock {
  type: 'heading' | 'text' | 'items';
  text?: string;
  md?: string;
  items?: Array<{ label: string; value: string }>;
}

interface BookMeEvent {
  id: string;
  label: string;
  link: string;
}

interface AboutPageData {
  route: string;
  lang: string;
  title: string;
  blocks: AboutBlock[];
}

interface BookMePageData {
  route: string;
  lang: string;
  title: string;
  intro?: string;
  events: BookMeEvent[];
}

function migrateAboutPage(lang: 'en' | 'ru'): void {
  const sourcePath = join(process.cwd(), 'src/content/pages/about', `${lang}.json`);
  const targetDir = join(process.cwd(), 'src/content/pages/about', lang);
  const targetPath = join(targetDir, 'index.json');

  if (!existsSync(sourcePath)) {
    console.warn(`[MIGRATION] Source file not found: ${sourcePath}`);
    return;
  }

  // Create target directory if it doesn't exist
  if (!existsSync(targetDir)) {
    mkdirSync(targetDir, { recursive: true });
  }

  try {
    const sourceData: AboutPageData = JSON.parse(readFileSync(sourcePath, 'utf-8'));
    
    // Transform blocks to match new structure
    const transformedBlocks = sourceData.blocks.map(block => {
      if (block.type === 'heading') {
        return {
          type: 'heading',
          text: block.text
        };
      } else if (block.type === 'text') {
        return {
          type: 'text',
          md: block.md
        };
      } else if (block.type === 'items') {
        return {
          type: 'items',
          items: block.items
        };
      }
      return block;
    });

    const transformedData = {
      route: sourceData.route,
      title: sourceData.title,
      blocks: transformedBlocks
    };

    writeFileSync(targetPath, JSON.stringify(transformedData, null, 2));
    console.log(`[MIGRATION] Migrated About page for ${lang}: ${targetPath}`);
  } catch (error) {
    console.error(`[MIGRATION] Failed to migrate About page for ${lang}:`, error);
  }
}

function migrateBookMePage(lang: 'en' | 'ru'): void {
  const sourcePath = join(process.cwd(), 'src/content/pages/bookme', `${lang}.json`);
  const targetDir = join(process.cwd(), 'src/content/pages/bookme', lang);
  const targetPath = join(targetDir, 'index.json');

  if (!existsSync(sourcePath)) {
    console.warn(`[MIGRATION] Source file not found: ${sourcePath}`);
    return;
  }

  // Create target directory if it doesn't exist
  if (!existsSync(targetDir)) {
    mkdirSync(targetDir, { recursive: true });
  }

  try {
    const sourceData: BookMePageData = JSON.parse(readFileSync(sourcePath, 'utf-8'));
    
    const transformedData = {
      route: sourceData.route,
      title: sourceData.title,
      intro: sourceData.intro,
      events: sourceData.events
    };

    writeFileSync(targetPath, JSON.stringify(transformedData, null, 2));
    console.log(`[MIGRATION] Migrated BookMe page for ${lang}: ${targetPath}`);
  } catch (error) {
    console.error(`[MIGRATION] Failed to migrate BookMe page for ${lang}:`, error);
  }
}

function migrateFooterFiles(): void {
  const locales: ('en' | 'ru')[] = ['en', 'ru'];
  
  for (const lang of locales) {
    const sourcePath = join(process.cwd(), 'src/content/footer', lang, 'footer.json');
    const targetPath = join(process.cwd(), 'src/content/footer', lang, 'index.json');

    if (!existsSync(sourcePath)) {
      console.warn(`[MIGRATION] Footer source file not found: ${sourcePath}`);
      continue;
    }

    try {
      const sourceData = JSON.parse(readFileSync(sourcePath, 'utf-8'));
      writeFileSync(targetPath, JSON.stringify(sourceData, null, 2));
      console.log(`[MIGRATION] Renamed footer file for ${lang}: ${targetPath}`);
    } catch (error) {
      console.error(`[MIGRATION] Failed to rename footer file for ${lang}:`, error);
    }
  }
}

function main(): void {
  console.log('[MIGRATION] Starting i18n migration...');
  
  // Migrate About pages
  console.log('[MIGRATION] Migrating About pages...');
  migrateAboutPage('en');
  migrateAboutPage('ru');
  
  // Migrate BookMe pages
  console.log('[MIGRATION] Migrating BookMe pages...');
  migrateBookMePage('en');
  migrateBookMePage('ru');
  
  // Rename footer files
  console.log('[MIGRATION] Renaming footer files...');
  migrateFooterFiles();
  
  console.log('[MIGRATION] Migration completed!');
}

// Run the migration
main();
