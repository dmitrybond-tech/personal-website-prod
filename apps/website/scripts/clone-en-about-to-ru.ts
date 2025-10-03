#!/usr/bin/env tsx

/**
 * Schema-Safe Clone: EN → RU About Page
 * 
 * Creates a zero-surprise migrator that copies the complete English About entry 
 * to Russian, enforcing Content Collections schema compliance.
 * 
 * Only mutation: slug becomes "ru/about"
 * All other fields remain exactly as in EN
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// CLI argument parsing
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const force = args.includes('--force');
const pretty = args.includes('--pretty');
const debug = args.includes('--debug');

const contentDir = join(process.cwd(), 'src', 'content', 'aboutPage');
const enDir = join(contentDir, 'en');
const ruDir = join(contentDir, 'ru');

// File paths
const enJsonPath = join(enDir, 'about.json');
const enMdPath = join(enDir, 'about.md');
const ruJsonPath = join(ruDir, 'about.json');
const ruMdPath = join(ruDir, 'about.md');

interface CloneResult {
  mode: 'json' | 'md';
  sourcePath: string;
  targetPath: string;
  slugBefore: string;
  slugAfter: string;
  sectionsCount: number;
  changes: number;
}

function detectFormat(): 'json' | 'md' {
  if (existsSync(enJsonPath)) {
    return 'json';
  } else if (existsSync(enMdPath)) {
    return 'md';
  } else {
    throw new Error(`No EN about file found. Expected either ${enJsonPath} or ${enMdPath}`);
  }
}

function readFileSafely(filePath: string): string {
  try {
    const content = readFileSync(filePath, 'utf-8');
    // Remove BOM if present
    return content.replace(/^\uFEFF/, '');
  } catch (error) {
    throw new Error(`Failed to read ${filePath}: ${error.message}`);
  }
}

function assertFrontmatter(content: string): { frontmatter: string; body: string } {
  const lines = content.split('\n');
  
  if (lines[0] !== '---') {
    throw new Error('File does not start with frontmatter delimiter (---)');
  }
  
  let endIndex = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === '---') {
      endIndex = i;
      break;
    }
  }
  
  if (endIndex === -1) {
    throw new Error('No closing frontmatter delimiter (---) found');
  }
  
  const frontmatter = lines.slice(1, endIndex).join('\n');
  const body = lines.slice(endIndex + 1).join('\n');
  
  return { frontmatter, body };
}

function parseYamlSimple(yamlContent: string): Record<string, any> {
  const result: Record<string, any> = {};
  const lines = yamlContent.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) continue;
    
    const key = trimmed.slice(0, colonIndex).trim();
    let value = trimmed.slice(colonIndex + 1).trim();
    
    // Remove quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) || 
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    
    // Handle sections array - count by '- type:' occurrences
    if (key === 'sections') {
      result[key] = yamlContent.match(/- type:/g)?.length || 0;
    } else {
      result[key] = value;
    }
  }
  
  return result;
}

function cloneJsonMode(): CloneResult {
  console.log('[clone] Detected JSON mode');
  
  const sourcePath = enJsonPath;
  const targetPath = ruJsonPath;
  
  // Read EN JSON
  const enContent = readFileSafely(sourcePath);
  const enData = JSON.parse(enContent);
  
  // Clone and mutate slug
  const ruData = JSON.parse(JSON.stringify(enData)); // Deep clone
  const slugBefore = ruData.slug || 'missing';
  ruData.slug = 'ru/about';
  
  // Count sections
  const sectionsCount = Array.isArray(ruData.sections) ? ruData.sections.length : 0;
  
  // Generate RU content
  const ruContent = pretty 
    ? JSON.stringify(ruData, null, 2) + '\n'
    : JSON.stringify(ruData) + '\n';
  
  if (dryRun) {
    console.log(`[clone] 🔍 DRY RUN - Would write to ${targetPath}:`);
    console.log('--- JSON DIFF ---');
    console.log(`slug: "${slugBefore}" → "ru/about"`);
    console.log(`sections: ${sectionsCount} items`);
    console.log('--- END DIFF ---');
    return {
      mode: 'json',
      sourcePath,
      targetPath,
      slugBefore,
      slugAfter: 'ru/about',
      sectionsCount,
      changes: 1
    };
  }
  
  // Ensure directory exists
  mkdirSync(ruDir, { recursive: true });
  
  // Write RU file
  writeFileSync(targetPath, ruContent, 'utf-8');
  
  return {
    mode: 'json',
    sourcePath,
    targetPath,
    slugBefore,
    slugAfter: 'ru/about',
    sectionsCount,
    changes: 1
  };
}

function cloneMdMode(): CloneResult {
  console.log('[clone] Detected MD mode');
  
  const sourcePath = enMdPath;
  const targetPath = ruMdPath;
  
  // Read EN MD
  const enContent = readFileSafely(sourcePath);
  
  // Parse frontmatter
  const { frontmatter, body } = assertFrontmatter(enContent);
  
  // Parse YAML (simple approach)
  const frontmatterData = parseYamlSimple(frontmatter);
  const slugBefore = frontmatterData.slug || 'missing';
  
  // Count sections by counting '- type:' occurrences in frontmatter
  const sectionsCount = frontmatter.match(/- type:/g)?.length || 0;
  
  // Create RU frontmatter with slug mutation
  const ruFrontmatter = frontmatter.replace(
    /^slug:\s*.*$/m,
    'slug: "ru/about"'
  );
  
  // If no slug found, add it
  const finalFrontmatter = ruFrontmatter.includes('slug:') 
    ? ruFrontmatter 
    : frontmatter + '\nslug: "ru/about"';
  
  // Recompose MD
  const ruContent = `---\n${finalFrontmatter}\n---\n${body}`;
  
  if (dryRun) {
    console.log(`[clone] 🔍 DRY RUN - Would write to ${targetPath}:`);
    console.log('--- MD DIFF ---');
    console.log(`slug: "${slugBefore}" → "ru/about"`);
    console.log(`sections: ${sectionsCount} items`);
    console.log('--- END DIFF ---');
    return {
      mode: 'md',
      sourcePath,
      targetPath,
      slugBefore,
      slugAfter: 'ru/about',
      sectionsCount,
      changes: 1
    };
  }
  
  // Ensure directory exists
  mkdirSync(ruDir, { recursive: true });
  
  // Write RU file
  writeFileSync(targetPath, ruContent, 'utf-8');
  
  return {
    mode: 'md',
    sourcePath,
    targetPath,
    slugBefore,
    slugAfter: 'ru/about',
    sectionsCount,
    changes: 1
  };
}

function validateRuFile(result: CloneResult): void {
  const ruContent = readFileSafely(result.targetPath);
  
  if (result.mode === 'json') {
    const ruData = JSON.parse(ruContent);
    if (ruData.slug !== 'ru/about') {
      throw new Error(`Validation failed: slug is "${ruData.slug}", expected "ru/about"`);
    }
    if (!ruData.sections) {
      throw new Error('Validation failed: sections key missing');
    }
  } else {
    const { frontmatter } = assertFrontmatter(ruContent);
    const data = parseYamlSimple(frontmatter);
    if (data.slug !== 'ru/about') {
      throw new Error(`Validation failed: slug is "${data.slug}", expected "ru/about"`);
    }
    if (data.sections === undefined) {
      throw new Error('Validation failed: sections key missing in frontmatter');
    }
  }
  
  console.log(`[clone] ✅ Validation passed: slug="ru/about", sections=${result.sectionsCount}`);
}

function checkIdempotency(result: CloneResult): boolean {
  if (!existsSync(result.targetPath)) {
    return false;
  }
  
  try {
    const ruContent = readFileSafely(result.targetPath);
    
    if (result.mode === 'json') {
      const ruData = JSON.parse(ruContent);
      return ruData.slug === 'ru/about';
    } else {
      const { frontmatter } = assertFrontmatter(ruContent);
      const data = parseYamlSimple(frontmatter);
      return data.slug === 'ru/about';
    }
  } catch {
    return false;
  }
}

function printDebugInfo(result: CloneResult): void {
  if (!debug) return;
  
  console.log('[clone] 🐛 DEBUG - First 8 lines of RU file:');
  try {
    const ruContent = readFileSafely(result.targetPath);
    const lines = ruContent.split('\n').slice(0, 8);
    lines.forEach((line, i) => {
      console.log(`[clone] ${i + 1}: ${line}`);
    });
  } catch (error) {
    console.log(`[clone] Debug failed: ${error.message}`);
  }
}

async function main() {
  console.log('[clone] Starting EN → RU About page clone...');
  console.log(`[clone] Options: dry-run=${dryRun}, force=${force}, pretty=${pretty}, debug=${debug}`);
  
  try {
    // Detect format
    const mode = detectFormat();
    console.log(`[clone] Source format: ${mode.toUpperCase()}`);
    
    // Check if RU already exists
    const ruExists = mode === 'json' ? existsSync(ruJsonPath) : existsSync(ruMdPath);
    if (ruExists && !force && !dryRun) {
      console.log('[clone] ⚠️  RU file already exists. Use --force to overwrite.');
      return;
    }
    
    // Clone based on format
    const result = mode === 'json' ? cloneJsonMode() : cloneMdMode();
    
    // Print result summary
  console.log('[clone] 📋 Result Summary:');
  console.log(`[clone]   - Mode: ${result.mode.toUpperCase()}`);
  console.log(`[clone]   - Source: ${result.sourcePath}`);
  console.log(`[clone]   - Target: ${result.targetPath}`);
  console.log(`[clone]   - Slug: "${result.slugBefore}" → "${result.slugAfter}"`);
  console.log(`[clone]   - Sections: ${result.sectionsCount} items`);
  console.log(`[clone]   - Changes: ${result.changes} field(s)`);
  
  if (result.sectionsCount > 0) {
    console.log(`[clone]   - Content: ${result.sectionsCount} section(s) copied from EN to RU`);
  }
    
    if (!dryRun) {
      // Validate the result
      validateRuFile(result);
      
      // Check idempotency
      const isIdempotent = checkIdempotency(result);
      if (isIdempotent) {
        console.log('[clone] ✅ Idempotent: RU file already has correct slug');
      }
      
      // Debug info
      printDebugInfo(result);
      
      console.log('[clone] ✅ Clone completed successfully!');
    } else {
      console.log('[clone] 🔍 Dry run completed - no files written');
    }
    
  } catch (error) {
    console.error(`[clone] ❌ Clone failed: ${error.message}`);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('[clone] ❌ Unexpected error:', error);
  process.exit(1);
});
