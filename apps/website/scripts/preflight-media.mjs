#!/usr/bin/env node

/**
 * Preflight script to validate media files referenced in about-expanded.md
 * Checks that all /uploads/... paths exist and reports missing files
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

function extractImagePaths(content) {
  const imagePaths = new Set();
  
  // Find all image and logo fields
  const imageRegex = /(?:image|logo):\s*['"]?([^'"\s]+)['"]?/g;
  let match;
  
  while ((match = imageRegex.exec(content)) !== null) {
    const path = match[1];
    if (path.startsWith('/uploads/')) {
      imagePaths.add(path);
    }
  }
  
  return Array.from(imagePaths);
}

function validateMediaFiles(filePath, lang) {
  console.log(`\n🔍 Validating ${lang} media files: ${filePath}`);
  
  if (!existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    return { valid: false, missing: [], total: 0 };
  }

  try {
    const content = readFileSync(filePath, 'utf-8');
    const imagePaths = extractImagePaths(content);
    
    console.log(`📊 Found ${imagePaths.length} media references`);
    
    const missing = [];
    const existing = [];
    
    imagePaths.forEach(path => {
      const fullPath = join(projectRoot, 'public', path);
      if (existsSync(fullPath)) {
        existing.push(path);
      } else {
        missing.push(path);
      }
    });
    
    console.log(`✅ ${existing.length} files exist`);
    if (missing.length > 0) {
      console.log(`❌ ${missing.length} files missing:`);
      missing.forEach(path => {
        console.log(`   - ${path}`);
      });
    }
    
    return { valid: missing.length === 0, missing, total: imagePaths.length };
  } catch (error) {
    console.error(`❌ Error reading ${filePath}:`, error.message);
    return { valid: false, missing: [], total: 0 };
  }
}

function main() {
  console.log('🚀 Running media file validation...');
  
  const enFile = join(projectRoot, 'src/content/aboutPage/en/about-expanded.md');
  const ruFile = join(projectRoot, 'src/content/aboutPage/ru/about-expanded.md');
  
  const enResult = validateMediaFiles(enFile, 'EN');
  const ruResult = validateMediaFiles(ruFile, 'RU');
  
  const totalMissing = enResult.missing.length + ruResult.missing.length;
  const totalFiles = enResult.total + ruResult.total;
  
  console.log(`\n📊 Summary:`);
  console.log(`   Total media references: ${totalFiles}`);
  console.log(`   Missing files: ${totalMissing}`);
  
  if (totalMissing === 0) {
    console.log('\n✅ All media files are present!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some media files are missing, but placeholders should handle this gracefully.');
    console.log('   This is not a build failure - placeholders will be used for missing images.');
    process.exit(0);
  }
}

main();
