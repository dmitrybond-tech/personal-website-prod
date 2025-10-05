#!/usr/bin/env node

/**
 * Script to create placeholder images for missing media files
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

function ensureDirectoryExists(filePath) {
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function createPlaceholderImage(filePath, type = 'cover') {
  const fullPath = join(projectRoot, 'public', filePath);
  
  if (existsSync(fullPath)) {
    console.log(`ℹ️  File already exists: ${filePath}`);
    return;
  }
  
  ensureDirectoryExists(fullPath);
  
  let svgContent;
  if (type === 'logo') {
    svgContent = `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="32" cy="32" r="30" fill="#f3f4f6" stroke="#d1d5db" stroke-width="2"/>
  <text x="32" y="38" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#6b7280">LOGO</text>
</svg>`;
  } else {
    svgContent = `<svg width="200" height="133" viewBox="0 0 200 133" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="200" height="133" fill="#f3f4f6" stroke="#d1d5db" stroke-width="1"/>
  <text x="100" y="70" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#6b7280">No image</text>
</svg>`;
  }
  
  writeFileSync(fullPath, svgContent, 'utf-8');
  console.log(`✅ Created placeholder: ${filePath}`);
}

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

function main() {
  console.log('🚀 Creating placeholder images...');
  
  const enFile = join(projectRoot, 'src/content/aboutPage/en/about-expanded.md');
  const ruFile = join(projectRoot, 'src/content/aboutPage/ru/about-expanded.md');
  
  const enContent = readFileSync(enFile, 'utf-8');
  const ruContent = readFileSync(ruFile, 'utf-8');
  
  const enPaths = extractImagePaths(enContent);
  const ruPaths = extractImagePaths(ruContent);
  
  const allPaths = [...new Set([...enPaths, ...ruPaths])];
  
  console.log(`\n📊 Found ${allPaths.length} image references to check`);
  
  let createdCount = 0;
  allPaths.forEach(path => {
    const fullPath = join(projectRoot, 'public', path);
    
    if (!existsSync(fullPath)) {
      // Determine placeholder type based on path
      const isLogo = path.includes('/logos/') || path.includes('logo');
      const placeholderType = isLogo ? 'logo' : 'cover';
      
      createPlaceholderImage(path, placeholderType);
      createdCount++;
    }
  });
  
  console.log(`\n✅ Created ${createdCount} placeholder images`);
  console.log('🎉 Placeholder creation completed!');
}

main();
