#!/usr/bin/env tsx

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get the project root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

interface SanitizeResult {
  path: string;
  hasBom: boolean;
  firstLine: string;
  hasFrontmatter: boolean;
  errors: string[];
}

function sanitizeFile(filePath: string): SanitizeResult {
  const result: SanitizeResult = {
    path: filePath,
    hasBom: false,
    firstLine: '',
    hasFrontmatter: false,
    errors: []
  };

  try {
    if (!existsSync(filePath)) {
      result.errors.push('File does not exist');
      return result;
    }

    // Read file as buffer to detect BOM
    const buffer = readFileSync(filePath);
    let content = buffer.toString('utf-8');
    
    // Check for UTF-8 BOM
    if (buffer.length >= 3 && buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
      result.hasBom = true;
      content = buffer.slice(3).toString('utf-8');
    }

    // Get first line
    const lines = content.split('\n');
    result.firstLine = lines[0] || '';

    // Check if first line is exactly '---'
    if (result.firstLine.trim() !== '---') {
      result.errors.push('First line is not "---"');
    } else {
      result.hasFrontmatter = true;
    }

    // Find frontmatter block
    const frontmatterStart = content.indexOf('---\n');
    if (frontmatterStart !== 0) {
      result.errors.push('Frontmatter does not start at beginning of file');
    }

    const secondDashIndex = content.indexOf('---\n', 4);
    if (secondDashIndex === -1) {
      result.errors.push('No closing frontmatter delimiter found');
    }

    // Sanitize content
    let sanitizedContent = content;
    
    // Remove BOM if present
    if (result.hasBom) {
      sanitizedContent = content;
    }

    // Ensure first line is exactly '---' with no leading whitespace
    const linesArray = sanitizedContent.split('\n');
    if (linesArray[0]?.trim() !== '---') {
      linesArray[0] = '---';
    }
    
    // Ensure proper line endings (LF)
    sanitizedContent = linesArray.join('\n');

    // Write sanitized content (UTF-8 without BOM)
    writeFileSync(filePath, sanitizedContent, 'utf-8');

    console.log(`[INFO] Sanitized: ${filePath}`);
    console.log(`[INFO]   - BOM removed: ${result.hasBom}`);
    console.log(`[INFO]   - First line: "${result.firstLine}"`);
    console.log(`[INFO]   - Has frontmatter: ${result.hasFrontmatter}`);
    if (result.errors.length > 0) {
      console.log(`[INFO]   - Errors: ${result.errors.join(', ')}`);
    }

  } catch (error) {
    result.errors.push(`Failed to sanitize: ${error}`);
    console.error(`[ERROR] Failed to sanitize ${filePath}:`, error);
  }

  return result;
}

function main() {
  console.log('[INFO] Starting frontmatter sanitization...');
  
  const aboutPageDir = join(projectRoot, 'apps', 'website', 'src', 'content', 'aboutPage');
  const locales = ['en', 'ru'];
  const results: SanitizeResult[] = [];

  for (const locale of locales) {
    const filePath = join(aboutPageDir, locale, 'about.md');
    const result = sanitizeFile(filePath);
    results.push(result);
  }

  // Summary
  console.log('\n[INFO] ========== SANITIZATION SUMMARY ==========');
  const successCount = results.filter(r => r.errors.length === 0).length;
  const totalCount = results.length;
  
  console.log(`[INFO] Files processed: ${totalCount}`);
  console.log(`[INFO] Files sanitized successfully: ${successCount}`);
  
  if (successCount < totalCount) {
    console.log('[WARN] Some files had issues:');
    results.forEach(result => {
      if (result.errors.length > 0) {
        console.log(`[WARN]   ${result.path}: ${result.errors.join(', ')}`);
      }
    });
  }

  console.log('[INFO] Frontmatter sanitization complete!');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.includes('content-sanitize-frontmatter.ts')) {
  main();
}
