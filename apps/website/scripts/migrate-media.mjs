#!/usr/bin/env node

/**
 * Script to migrate media files from /logos and /devscard to /uploads structure
 * and update references in about-expanded.md files
 */

import { readFileSync, writeFileSync, existsSync, copyFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Media migration mapping
const MEDIA_MIGRATIONS = [
  // Logos
  { from: '/logos/cloudblue.svg', to: '/uploads/logos/cloudblue.svg' },
  { from: '/logos/datacom.svg', to: '/uploads/logos/datacom.svg' },
  { from: '/logos/banking.svg', to: '/uploads/logos/banking.svg' },
  { from: '/logos/sibsutis_logo.png', to: '/uploads/logos/sibsutis_logo.png' },
  { from: '/logos/sibsutis_logo.svg', to: '/uploads/logos/sibsutis_logo.svg' },
  
  // Favorites - People
  { from: '/devscard/favorites/people/joerogan.jpg', to: '/uploads/about/favorites/joerogan.jpg' },
  { from: '/devscard/favorites/people/sethrogen.jpg', to: '/uploads/about/favorites/sethrogen.jpg' },
  { from: '/devscard/favorites/people/markmanson.jpg', to: '/uploads/about/favorites/markmanson.jpg' },
  { from: '/devscard/favorites/people/travisrice.jpg', to: '/uploads/about/favorites/travisrice.jpg' },
  { from: '/devscard/favorites/people/andrewberman.jpg', to: '/uploads/about/favorites/andrewberman.jpg' },
  
  // Favorites - Media
  { from: '/devscard/favorites/media/bbc.jpeg', to: '/uploads/about/favorites/bbc.jpeg' },
  { from: '/devscard/favorites/media/ycombinator.jpeg', to: '/uploads/about/favorites/ycombinator.jpeg' },
  { from: '/devscard/favorites/media/redbull.png', to: '/uploads/about/favorites/redbull.png' },
  { from: '/devscard/favorites/media/artsy.png', to: '/uploads/about/favorites/artsy.png' },
  { from: '/devscard/favorites/media/inked.jpeg', to: '/uploads/about/favorites/inked.jpeg' },
  
  // Favorites - Books
  { from: '/devscard/favorites/books/tech-products.jpeg', to: '/uploads/about/favorites/tech-products.jpeg' },
  { from: '/devscard/favorites/books/shantaram.jpg', to: '/uploads/about/favorites/shantaram.jpg' },
  { from: '/devscard/favorites/books/subtle-art.jpeg', to: '/uploads/about/favorites/subtle-art.jpeg' },
  { from: '/devscard/favorites/books/idiot.jpeg', to: '/uploads/about/favorites/idiot.jpeg' },
  { from: '/devscard/favorites/books/crime-punishment.jpeg', to: '/uploads/about/favorites/crime-punishment.jpeg' },
  
  // Favorites - Movies
  { from: '/devscard/favorites/movies/pulp-fiction.jpeg', to: '/uploads/about/favorites/pulp-fiction.jpeg' },
  { from: '/devscard/favorites/movies/spirited-away.jpeg', to: '/uploads/about/favorites/spirited-away.jpeg' },
  { from: '/devscard/favorites/movies/big-lebowski.jpeg', to: '/uploads/about/favorites/big-lebowski.jpeg' },
  { from: '/devscard/favorites/movies/snatch.jpeg', to: '/uploads/about/favorites/snatch.jpeg' },
  { from: '/devscard/favorites/movies/fight-club.jpeg', to: '/uploads/about/favorites/fight-club.jpeg' },
];

function ensureDirectoryExists(filePath) {
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function copyMediaFile(fromPath, toPath) {
  const fullFromPath = join(projectRoot, 'public', fromPath);
  const fullToPath = join(projectRoot, 'public', toPath);
  
  if (!existsSync(fullFromPath)) {
    console.warn(`⚠️  Source file not found: ${fromPath}`);
    return false;
  }
  
  ensureDirectoryExists(fullToPath);
  copyFileSync(fullFromPath, fullToPath);
  console.log(`✅ Copied: ${fromPath} → ${toPath}`);
  return true;
}

function updateFileReferences(filePath, lang) {
  console.log(`\n📝 Updating references in ${lang} file: ${filePath}`);
  
  if (!existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    return false;
  }

  try {
    const content = readFileSync(filePath, 'utf-8');
    let updatedContent = content;
    let changesCount = 0;
    
    MEDIA_MIGRATIONS.forEach(({ from, to }) => {
      const regex = new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      const matches = updatedContent.match(regex);
      if (matches) {
        updatedContent = updatedContent.replace(regex, to);
        changesCount += matches.length;
        console.log(`   🔄 ${from} → ${to} (${matches.length} occurrences)`);
      }
    });
    
    if (changesCount > 0) {
      writeFileSync(filePath, updatedContent, 'utf-8');
      console.log(`✅ Updated ${changesCount} references in ${lang} file`);
      return true;
    } else {
      console.log(`ℹ️  No references to update in ${lang} file`);
      return true;
    }
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🚀 Starting media migration...');
  
  // Copy media files
  console.log('\n📁 Copying media files...');
  let copiedCount = 0;
  MEDIA_MIGRATIONS.forEach(({ from, to }) => {
    if (copyMediaFile(from, to)) {
      copiedCount++;
    }
  });
  
  console.log(`\n📊 Copied ${copiedCount}/${MEDIA_MIGRATIONS.length} media files`);
  
  // Update file references
  const enFile = join(projectRoot, 'src/content/aboutPage/en/about-expanded.md');
  const ruFile = join(projectRoot, 'src/content/aboutPage/ru/about-expanded.md');
  
  const enUpdated = updateFileReferences(enFile, 'EN');
  const ruUpdated = updateFileReferences(ruFile, 'RU');
  
  if (enUpdated && ruUpdated) {
    console.log('\n✅ Media migration completed successfully!');
    process.exit(0);
  } else {
    console.log('\n❌ Media migration failed!');
    process.exit(1);
  }
}

main();
