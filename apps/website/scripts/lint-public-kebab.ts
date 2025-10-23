#!/usr/bin/env node
/**
 * Public Asset Linter
 * 
 * Validates that all files in public/** follow kebab-case naming conventions.
 * Exits with non-zero code if violations are found.
 */

import { readdir, stat } from 'fs/promises';
import { join, basename } from 'path';

interface Violation {
  file: string;
  reason: string;
}

/**
 * Check if filename follows kebab-case conventions
 */
function isKebabCase(filename: string): { valid: boolean; reason?: string } {
  const name = basename(filename);
  
  // Check for uppercase letters
  if (/[A-Z]/.test(name)) {
    return { valid: false, reason: 'contains uppercase letters' };
  }
  
  // Check for spaces
  if (/\s/.test(name)) {
    return { valid: false, reason: 'contains spaces' };
  }
  
  // Check for parentheses
  if (/[()]/.test(name)) {
    return { valid: false, reason: 'contains parentheses' };
  }
  
  // Check for multiple consecutive dashes
  if (/--/.test(name)) {
    return { valid: false, reason: 'contains multiple consecutive dashes' };
  }
  
  // Check for leading/trailing dashes
  if (/^-|-$/.test(name)) {
    return { valid: false, reason: 'has leading or trailing dashes' };
  }
  
  // Check for underscores (should be dashes)
  if (/_/.test(name)) {
    return { valid: false, reason: 'contains underscores (should use dashes)' };
  }
  
  // Check for special characters (allow dots, dashes, alphanumeric)
  if (!/^[a-z0-9.-]+$/.test(name)) {
    return { valid: false, reason: 'contains invalid characters' };
  }
  
  return { valid: true };
}

/**
 * Recursively check directory for violations
 */
async function checkDirectory(dirPath: string, basePath: string): Promise<Violation[]> {
  const violations: Violation[] = [];
  const entries = await readdir(dirPath);
  
  for (const entry of entries) {
    const fullPath = join(dirPath, entry);
    const statInfo = await stat(fullPath);
    
    if (statInfo.isDirectory()) {
      const subViolations = await checkDirectory(fullPath, basePath);
      violations.push(...subViolations);
    } else if (statInfo.isFile()) {
      const check = isKebabCase(entry);
      if (!check.valid) {
        const relativePath = fullPath.replace(basePath, '').replace(/\\/g, '/');
        violations.push({
          file: relativePath,
          reason: check.reason!
        });
      }
    }
  }
  
  return violations;
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  // Handle both direct execution and workspace execution
  const isWorkspace = process.cwd().endsWith('website');
  const baseDir = isWorkspace ? process.cwd() : join(process.cwd(), 'apps', 'website');
  const publicDir = join(baseDir, 'public');
  
  console.log('🔍 Linting public assets for kebab-case compliance...');
  console.log(`📁 Checking: ${publicDir}`);
  
  try {
    const violations = await checkDirectory(publicDir, publicDir);
    
    if (violations.length === 0) {
      console.log('✅ All public assets follow kebab-case naming conventions!');
      process.exit(0);
    } else {
      console.log(`❌ Found ${violations.length} naming violations:`);
      console.log('');
      
      violations.forEach((violation, index) => {
        console.log(`${index + 1}. ${violation.file}`);
        console.log(`   Reason: ${violation.reason}`);
        console.log('');
      });
      
      console.log('💡 To fix these issues, run:');
      console.log('   npm run prebuild');
      console.log('');
      
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Linting failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
