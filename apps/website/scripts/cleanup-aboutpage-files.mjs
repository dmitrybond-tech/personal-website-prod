#!/usr/bin/env node

/**
 * Cleanup script for aboutPage redundant files
 * Removes duplicate and backup files, keeping only about-expanded.md
 */

import { readdir, unlink, stat } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const aboutPageDir = join(__dirname, '..', 'src', 'content', 'aboutPage');

// Files to keep (the canonical files)
const KEEP_FILES = {
  en: ['about-expanded.md'],
  ru: ['about-expanded.md']
};

// Files to remove (redundant/backup files)
const REMOVE_PATTERNS = [
  'about-expanded-new.md',
  'about-expanded-updated.md', 
  'about-expanded-iconify.md',
  'about-expanded-final.md',
  'about-expanded-v1',
  'about.md', // Remove fallback file
  /\.bak$/,
  /\.bak\.\d+$/,
  /\.bak\.\d{4}-\d{2}-\d{2}-\d{4}$/
];

async function cleanupLanguageDir(lang) {
  const langDir = join(aboutPageDir, lang);
  console.log(`\n📁 Processing ${lang}/ directory...`);
  
  try {
    const files = await readdir(langDir);
    console.log(`   Found ${files.length} files: ${files.join(', ')}`);
    
    let removedCount = 0;
    let keptCount = 0;
    
    for (const file of files) {
      const shouldKeep = KEEP_FILES[lang]?.includes(file);
      const shouldRemove = REMOVE_PATTERNS.some(pattern => {
        if (typeof pattern === 'string') {
          return file === pattern;
        } else if (pattern instanceof RegExp) {
          return pattern.test(file);
        }
        return false;
      });
      
      if (shouldKeep) {
        console.log(`   ✅ KEEP: ${file}`);
        keptCount++;
      } else if (shouldRemove) {
        const filePath = join(langDir, file);
        const stats = await stat(filePath);
        console.log(`   🗑️  REMOVE: ${file} (${(stats.size / 1024).toFixed(1)}KB)`);
        await unlink(filePath);
        removedCount++;
      } else {
        console.log(`   ⚠️  UNKNOWN: ${file} (keeping for safety)`);
        keptCount++;
      }
    }
    
    console.log(`   📊 Summary: ${keptCount} kept, ${removedCount} removed`);
    return { kept: keptCount, removed: removedCount };
    
  } catch (error) {
    console.error(`   ❌ Error processing ${lang}/:`, error.message);
    return { kept: 0, removed: 0 };
  }
}

async function main() {
  console.log('🧹 AboutPage Files Cleanup Script');
  console.log('==================================');
  console.log(`📂 Target directory: ${aboutPageDir}`);
  
  const languages = ['en', 'ru'];
  let totalKept = 0;
  let totalRemoved = 0;
  
  for (const lang of languages) {
    const result = await cleanupLanguageDir(lang);
    totalKept += result.kept;
    totalRemoved += result.removed;
  }
  
  console.log('\n🎉 Cleanup Complete!');
  console.log(`📊 Total: ${totalKept} files kept, ${totalRemoved} files removed`);
  
  if (totalRemoved > 0) {
    console.log('\n💡 Next steps:');
    console.log('   1. Update the loader to remove fallback logic');
    console.log('   2. Test the about pages to ensure they still work');
    console.log('   3. Commit the changes');
  }
}

main().catch(console.error);
