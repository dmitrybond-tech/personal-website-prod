#!/usr/bin/env node

/**
 * Preflight script to validate section types in about-expanded.md files
 * Ensures all section types have corresponding components in SECTION_COMPONENTS
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Expected section components (must match SECTION_COMPONENTS in about.astro)
const EXPECTED_SECTION_TYPES = [
  'main',
  'skills', 
  'experience',
  'education',
  'favorites',
  'projects',
  'testimonials',
  'cards',
  'hero'
];

function validateAboutFile(filePath, lang) {
  console.log(`\n🔍 Validating ${lang} about file: ${filePath}`);
  
  if (!existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    return false;
  }

  try {
    const content = readFileSync(filePath, 'utf-8');
    const { data } = matter(content);
    
    if (!data.sections || !Array.isArray(data.sections)) {
      console.error(`❌ No sections array found in ${filePath}`);
      return false;
    }

    const foundTypes = new Set();
    const unknownTypes = new Set();
    
    data.sections.forEach((section, index) => {
      const type = section.type;
      if (!type) {
        console.error(`❌ Section ${index} has no type`);
        return;
      }
      
      foundTypes.add(type);
      
      if (!EXPECTED_SECTION_TYPES.includes(type)) {
        unknownTypes.add(type);
        console.error(`❌ Unknown section type: "${type}" in section ${index}`);
      }
    });

    console.log(`✅ Found ${foundTypes.size} section types: ${Array.from(foundTypes).join(', ')}`);
    
    if (unknownTypes.size > 0) {
      console.error(`❌ Unknown types found: ${Array.from(unknownTypes).join(', ')}`);
      console.error(`   Expected types: ${EXPECTED_SECTION_TYPES.join(', ')}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`❌ Error reading ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🚀 Running section type validation...');
  
  const enFile = join(projectRoot, 'src/content/aboutPage/en/about-expanded.md');
  const ruFile = join(projectRoot, 'src/content/aboutPage/ru/about-expanded.md');
  
  const enValid = validateAboutFile(enFile, 'EN');
  const ruValid = validateAboutFile(ruFile, 'RU');
  
  if (enValid && ruValid) {
    console.log('\n✅ All section types are valid!');
    process.exit(0);
  } else {
    console.log('\n❌ Section validation failed!');
    process.exit(1);
  }
}

main();
