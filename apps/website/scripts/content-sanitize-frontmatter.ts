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
    if (result.firstLine.trim() === '---') {
      result.hasFrontmatter = true;
    } else {
      result.errors.push('First line is not "---"');
    }

    // Ensure the very first bytes are exactly `---\n` (no leading whitespace/newlines)
    let cleanContent = content;
    
    // Remove leading whitespace and newlines
    cleanContent = cleanContent.replace(/^[\s\n\r]+/, '');
    
    // Ensure it starts with '---\n'
    if (!cleanContent.startsWith('---\n')) {
      cleanContent = '---\n' + cleanContent;
    }

    // Ensure there is a single frontmatter block at top
    const frontmatterEndIndex = cleanContent.indexOf('---\n', 4);
    if (frontmatterEndIndex === -1) {
      result.errors.push('No closing frontmatter delimiter found');
    }

    // Only write if there were changes or BOM was present
    if (result.hasBom || cleanContent !== content) {
      // Write UTF-8 without BOM, with LF endings
      writeFileSync(filePath, cleanContent, 'utf-8');
      console.log(`[INFO] Sanitized: ${filePath}`);
    } else {
      console.log(`[INFO] No changes needed: ${filePath}`);
    }

  } catch (error) {
    result.errors.push(`Failed to sanitize file: ${error}`);
  }

  return result;
}

function main() {
  console.log('[INFO] Starting frontmatter sanitization...');
  
  const aboutPageDir = join(projectRoot, 'src', 'content', 'aboutPage');
  const locales = ['en', 'ru'];
  const results: SanitizeResult[] = [];
  
  for (const locale of locales) {
    const filePath = join(aboutPageDir, locale, 'about.md');
    const result = sanitizeFile(filePath);
    results.push(result);
  }
  
  // Summary
  console.log('\n[INFO] ========== SANITIZATION SUMMARY ==========');
  results.forEach(result => {
    console.log(`[INFO] ${result.path}:`);
    console.log(`  - Has BOM: ${result.hasBom}`);
    console.log(`  - First line: "${result.firstLine}"`);
    console.log(`  - Has frontmatter: ${result.hasFrontmatter}`);
    if (result.errors.length > 0) {
      console.log(`  - Errors: ${result.errors.join(', ')}`);
    }
  });
  
  const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
  if (totalErrors > 0) {
    console.log(`[WARN] Total errors: ${totalErrors}`);
    process.exit(1);
  } else {
    console.log('[INFO] All files sanitized successfully!');
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.includes('content-sanitize-frontmatter.ts')) {
  main();
}
