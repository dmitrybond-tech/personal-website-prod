#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join, dirname, basename, extname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const POSTS_DIR = join(__dirname, '..', 'src', 'content', 'posts');
const EN_DIR = join(POSTS_DIR, 'en');
const RU_DIR = join(POSTS_DIR, 'ru');

// Ensure locale directories exist
[EN_DIR, RU_DIR].forEach(dir => {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
    console.log(`[MIGRATE] Created directory: ${dir}`);
  }
});

function getTodayDate() {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
}

function parseFrontmatter(content) {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!frontmatterMatch) {
    return { frontmatter: {}, body: content };
  }
  
  const frontmatterText = frontmatterMatch[1];
  const body = frontmatterMatch[2];
  const frontmatter = {};
  
  // Simple YAML parsing for our use case
  frontmatterText.split('\n').forEach(line => {
    const match = line.match(/^(\w+):\s*(.*)$/);
    if (match) {
      const [, key, value] = match;
      if (value === 'true') {
        frontmatter[key] = true;
      } else if (value === 'false') {
        frontmatter[key] = false;
      } else if (value.startsWith('[') && value.endsWith(']')) {
        // Simple array parsing
        frontmatter[key] = value.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
      } else {
        frontmatter[key] = value.replace(/^["']|["']$/g, '');
      }
    }
  });
  
  return { frontmatter, body };
}

function generateFrontmatter(frontmatter) {
  const lines = ['---'];
  
  // Ensure required fields with defaults
  if (!frontmatter.date) {
    frontmatter.date = getTodayDate();
  }
  if (frontmatter.draft === undefined) {
    frontmatter.draft = false;
  }
  
  // Write fields in consistent order
  const fieldOrder = ['title', 'description', 'date', 'draft', 'tags'];
  fieldOrder.forEach(field => {
    if (frontmatter[field] !== undefined) {
      if (Array.isArray(frontmatter[field])) {
        lines.push(`${field}:`);
        frontmatter[field].forEach(item => {
          lines.push(`  - ${item}`);
        });
      } else if (typeof frontmatter[field] === 'boolean') {
        lines.push(`${field}: ${frontmatter[field]}`);
      } else {
        lines.push(`${field}: ${frontmatter[field]}`);
      }
    }
  });
  
  // Write any remaining fields
  Object.keys(frontmatter).forEach(key => {
    if (!fieldOrder.includes(key)) {
      if (Array.isArray(frontmatter[key])) {
        lines.push(`${key}:`);
        frontmatter[key].forEach(item => {
          lines.push(`  - ${item}`);
        });
      } else if (typeof frontmatter[key] === 'boolean') {
        lines.push(`${key}: ${frontmatter[key]}`);
      } else {
        lines.push(`${key}: ${frontmatter[key]}`);
      }
    }
  });
  
  lines.push('---');
  return lines.join('\n');
}

function migrateFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const { frontmatter, body } = parseFrontmatter(content);
  
  // Determine locale from frontmatter or default to 'en'
  let locale = frontmatter.lang || 'en';
  if (!['en', 'ru'].includes(locale)) {
    locale = 'en';
  }
  
  // Determine target directory and filename
  const targetDir = locale === 'ru' ? RU_DIR : EN_DIR;
  const filename = basename(filePath);
  const targetPath = join(targetDir, filename);
  
  // Skip if file already exists in target location
  if (existsSync(targetPath)) {
    console.log(`[MIGRATE] Skipping ${filename} - already exists in ${locale}/`);
    return;
  }
  
  // Generate new content with normalized frontmatter
  const newFrontmatter = generateFrontmatter(frontmatter);
  const newContent = `${newFrontmatter}\n${body}`;
  
  // Write to target location
  writeFileSync(targetPath, newContent, 'utf-8');
  console.log(`[MIGRATE] Migrated ${filename} to ${locale}/${filename}`);
}

function migratePosts() {
  console.log('[MIGRATE] Starting post migration...');
  
  if (!existsSync(POSTS_DIR)) {
    console.log('[MIGRATE] No posts directory found, nothing to migrate');
    return;
  }
  
  let migratedCount = 0;
  
  // Look for .md files in the root posts directory
  const files = readdirSync(POSTS_DIR);
  const mdFiles = files.filter(file => {
    const fullPath = join(POSTS_DIR, file);
    return statSync(fullPath).isFile() && extname(file) === '.md';
  });
  
  if (mdFiles.length === 0) {
    console.log('[MIGRATE] No .md files found in posts root directory');
    return;
  }
  
  mdFiles.forEach(file => {
    const filePath = join(POSTS_DIR, file);
    try {
      migrateFile(filePath);
      migratedCount++;
    } catch (error) {
      console.error(`[MIGRATE] Error migrating ${file}:`, error.message);
    }
  });
  
  console.log(`[MIGRATE] Migration complete. ${migratedCount} files processed.`);
}

// Run migration
migratePosts();
