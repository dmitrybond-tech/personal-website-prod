#!/usr/bin/env node
/**
 * Asset Normalization Script
 * 
 * Normalizes all files under apps/website/public/** to kebab-case.
 * Creates a mapping JSON file for reference rewriting.
 */

import { readdir, stat, rename, mkdir } from 'fs/promises';
import { join, dirname, basename, extname } from 'path';
import { existsSync } from 'fs';

interface RenameMapping {
  from: string;
  to: string;
}

/**
 * Convert filename to kebab-case
 * - ASCII, lowercase
 * - spaces/underscores → -
 * - remove parentheses
 * - collapse multiple dashes
 * - keep extension
 */
function toKebabCase(filename: string): string {
  const ext = extname(filename);
  const nameWithoutExt = basename(filename, ext);
  
  return nameWithoutExt
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, '-')  // Replace non-alphanumeric chars with dash
    .replace(/[()]/g, '')          // Remove parentheses
    .replace(/-+/g, '-')           // Collapse multiple dashes
    .replace(/^-+|-+$/g, '')       // Remove leading/trailing dashes
    + ext;
}

/**
 * Recursively process directory and normalize filenames
 */
async function processDirectory(dirPath: string, basePath: string, mappings: RenameMapping[]): Promise<void> {
  const entries = await readdir(dirPath);
  
  for (const entry of entries) {
    const fullPath = join(dirPath, entry);
    const statInfo = await stat(fullPath);
    
    if (statInfo.isDirectory()) {
      await processDirectory(fullPath, basePath, mappings);
    } else if (statInfo.isFile()) {
      const normalizedName = toKebabCase(entry);
      
      if (entry !== normalizedName) {
        const newPath = join(dirname(fullPath), normalizedName);
        const relativeFrom = fullPath.replace(basePath, '').replace(/\\/g, '/');
        const relativeTo = newPath.replace(basePath, '').replace(/\\/g, '/');
        
        // Ensure the new path doesn't already exist
        if (existsSync(newPath)) {
          console.warn(`⚠️  Skipping rename: ${relativeFrom} → ${relativeTo} (target exists)`);
          continue;
        }
        
        try {
          await rename(fullPath, newPath);
          mappings.push({
            from: relativeFrom,
            to: relativeTo
          });
          console.log(`✓ Renamed: ${relativeFrom} → ${relativeTo}`);
        } catch (error) {
          console.error(`✗ Failed to rename ${relativeFrom}:`, error);
        }
      }
    }
  }
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  // Handle both direct execution and workspace execution
  const isWorkspace = process.cwd().endsWith('website');
  const isDocker = process.cwd().includes('/app');
  const baseDir = isDocker ? '/app/apps/website' : (isWorkspace ? process.cwd() : join(process.cwd(), 'apps', 'website'));
  const publicDir = join(baseDir, 'public');
  const tmpDir = join(baseDir, '.tmp');
  const mappingFile = join(tmpDir, 'asset-rename-map.json');
  
  console.log('🔧 Starting asset normalization...');
  console.log(`📁 Processing: ${publicDir}`);
  
  // Ensure .tmp directory exists
  if (!existsSync(tmpDir)) {
    await mkdir(tmpDir, { recursive: true });
  }
  
  const mappings: RenameMapping[] = [];
  
  try {
    await processDirectory(publicDir, publicDir, mappings);
    
    // Write mapping file
    const mappingContent = JSON.stringify(mappings, null, 2);
    await import('fs/promises').then(fs => fs.writeFile(mappingFile, mappingContent, 'utf8'));
    
    console.log(`\n📊 Summary:`);
    console.log(`   Files processed: ${mappings.length}`);
    console.log(`   Mapping file: ${mappingFile}`);
    
    if (mappings.length > 0) {
      console.log(`\n📝 Renamed files:`);
      mappings.forEach(mapping => {
        console.log(`   ${mapping.from} → ${mapping.to}`);
      });
    } else {
      console.log(`   No files needed normalization.`);
    }
    
    console.log('\n✅ Asset normalization completed successfully!');
    
  } catch (error) {
    console.error('❌ Asset normalization failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
