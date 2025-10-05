#!/usr/bin/env node

/**
 * Preflight script to validate icon fields in about-expanded.md files
 * Ensures all icon fields use Iconify tokens, not file paths
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Iconify token pattern: prefix:name (e.g., simple-icons:aws, fa6-solid:user)
const ICONIFY_PATTERN = /^[a-z0-9-]+:[a-z0-9-]+$/;

function validateIconField(value, path, lang) {
  if (!value || typeof value !== 'string') {
    return { valid: true, message: 'Empty or non-string icon field' };
  }

  // Check if it's a file path (starts with /)
  if (value.startsWith('/')) {
    return { 
      valid: false, 
      message: `File path found in icon field: "${value}" at ${path}`,
      suggestion: 'Use Iconify token instead (e.g., simple-icons:aws)'
    };
  }

  // Check if it's a valid Iconify token
  if (!ICONIFY_PATTERN.test(value)) {
    return { 
      valid: false, 
      message: `Invalid Iconify token: "${value}" at ${path}`,
      suggestion: 'Use format: prefix:name (e.g., simple-icons:aws)'
    };
  }

  return { valid: true, message: `Valid Iconify token: ${value}` };
}

function findIconFields(obj, path = '', lang) {
  const issues = [];
  
  if (typeof obj !== 'object' || obj === null) {
    return issues;
  }

  for (const [key, value] of Object.entries(obj)) {
    const currentPath = path ? `${path}.${key}` : key;
    
    if (key === 'icon') {
      const validation = validateIconField(value, currentPath, lang);
      if (!validation.valid) {
        issues.push(validation);
      }
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        issues.push(...findIconFields(item, `${currentPath}[${index}]`, lang));
      });
    } else if (typeof value === 'object' && value !== null) {
      issues.push(...findIconFields(value, currentPath, lang));
    }
  }
  
  return issues;
}

function validateAboutFile(filePath, lang) {
  console.log(`\n🔍 Validating ${lang} icon fields: ${filePath}`);
  
  if (!existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    return false;
  }

  try {
    const content = readFileSync(filePath, 'utf-8');
    const { data } = matter(content);
    
    const issues = findIconFields(data, '', lang);
    
    if (issues.length === 0) {
      console.log(`✅ All icon fields are valid Iconify tokens!`);
      return true;
    }

    console.error(`❌ Found ${issues.length} icon field issues:`);
    issues.forEach((issue, index) => {
      console.error(`   ${index + 1}. ${issue.message}`);
      if (issue.suggestion) {
        console.error(`      💡 ${issue.suggestion}`);
      }
    });

    return false;
  } catch (error) {
    console.error(`❌ Error reading ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🚀 Running icon field validation...');
  
  const enFile = join(projectRoot, 'src/content/aboutPage/en/about-expanded.md');
  const ruFile = join(projectRoot, 'src/content/aboutPage/ru/about-expanded.md');
  
  const enValid = validateAboutFile(enFile, 'EN');
  const ruValid = validateAboutFile(ruFile, 'RU');
  
  if (enValid && ruValid) {
    console.log('\n✅ All icon fields are valid!');
    process.exit(0);
  } else {
    console.log('\n❌ Icon validation failed!');
    process.exit(1);
  }
}

main();
