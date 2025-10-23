#!/usr/bin/env node
/**
 * Content Relinking Script
 * 
 * Rewrites asset references in content and source files based on the
 * asset rename mapping created by normalize-public.ts
 */

import { readFile, writeFile, readdir, stat } from 'fs/promises';
import { join, extname } from 'path';
import { existsSync } from 'fs';

interface RenameMapping {
  from: string;
  to: string;
}

interface FileStats {
  file: string;
  replacements: number;
}

/**
 * Load the asset rename mapping
 */
async function loadMapping(baseDir: string): Promise<RenameMapping[]> {
  const mappingFile = join(baseDir, '.tmp', 'asset-rename-map.json');
  
  if (!existsSync(mappingFile)) {
    console.log('📝 No asset rename mapping found. Run normalize-public.ts first.');
    return [];
  }
  
  try {
    const content = await readFile(mappingFile, 'utf8');
    return JSON.parse(content) as RenameMapping[];
  } catch (error) {
    console.error('❌ Failed to load mapping file:', error);
    return [];
  }
}

/**
 * Replace asset references in file content
 */
function replaceAssetReferences(content: string, mappings: RenameMapping[]): { content: string; count: number } {
  let newContent = content;
  let totalReplacements = 0;
  
  for (const mapping of mappings) {
    // Create regex patterns for different reference types
    const patterns = [
      // Direct /uploads/... references
      new RegExp(`(/uploads${mapping.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'g'),
      // Relative path references (../../public/...)
      new RegExp(`(\\.\\./.*?public${mapping.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'g'),
      // Import statements
      new RegExp(`(from\\s+["']\\.\\./.*?public${mapping.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'])`, 'g'),
      // new URL() references
      new RegExp(`(new URL\\(["']\\.\\./.*?public${mapping.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`, 'g'),
      // CSS url() references
      new RegExp(`(url\\(.*?public${mapping.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\))`, 'g'),
    ];
    
    for (const pattern of patterns) {
      const matches = newContent.match(pattern);
      if (matches) {
        const replacement = pattern.source.includes('uploads') 
          ? mapping.to 
          : pattern.source.includes('public') 
            ? mapping.to.replace('/uploads', '/uploads')
            : mapping.to;
            
        newContent = newContent.replace(pattern, (match) => {
          return match.replace(mapping.from, mapping.to);
        });
        totalReplacements += matches.length;
      }
    }
  }
  
  return { content: newContent, count: totalReplacements };
}

/**
 * Process a single file
 */
async function processFile(filePath: string, mappings: RenameMapping[]): Promise<FileStats> {
  const content = await readFile(filePath, 'utf8');
  const { content: newContent, count } = replaceAssetReferences(content, mappings);
  
  if (count > 0) {
    await writeFile(filePath, newContent, 'utf8');
    console.log(`✓ Updated ${filePath} (${count} replacements)`);
  }
  
  return { file: filePath, replacements: count };
}

/**
 * Recursively process directory
 */
async function processDirectory(dirPath: string, mappings: RenameMapping[]): Promise<FileStats[]> {
  const results: FileStats[] = [];
  const entries = await readdir(dirPath);
  
  for (const entry of entries) {
    const fullPath = join(dirPath, entry);
    const statInfo = await stat(fullPath);
    
    if (statInfo.isDirectory()) {
      const subResults = await processDirectory(fullPath, mappings);
      results.push(...subResults);
    } else if (statInfo.isFile()) {
      const ext = extname(fullPath).toLowerCase();
      const supportedExtensions = ['.md', '.mdx', '.yaml', '.yml', '.astro', '.tsx', '.ts', '.css', '.scss'];
      
      if (supportedExtensions.includes(ext)) {
        try {
          const result = await processFile(fullPath, mappings);
          results.push(result);
        } catch (error) {
          console.warn(`⚠️  Failed to process ${fullPath}:`, error);
        }
      }
    }
  }
  
  return results;
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  console.log('🔗 Starting content relinking...');
  
  // Handle both direct execution and workspace execution
  const isWorkspace = process.cwd().endsWith('website');
  const baseDir = isWorkspace ? process.cwd() : join(process.cwd(), 'apps', 'website');
  
  const mappings = await loadMapping(baseDir);
  
  if (mappings.length === 0) {
    console.log('📝 No mappings to process. Exiting.');
    return;
  }
  
  console.log(`📋 Found ${mappings.length} asset mappings`);
  
  const srcDir = join(baseDir, 'src');
  const results: FileStats[] = [];
  
  try {
    // Process src directory
    if (existsSync(srcDir)) {
      console.log(`📁 Processing: ${srcDir}`);
      const srcResults = await processDirectory(srcDir, mappings);
      results.push(...srcResults);
    }
    
    // Process content directory specifically
    const contentDir = join(baseDir, 'src', 'content');
    if (existsSync(contentDir)) {
      console.log(`📁 Processing content: ${contentDir}`);
      const contentResults = await processDirectory(contentDir, mappings);
      results.push(...contentResults);
    }
    
    // Summary
    const totalFiles = results.length;
    const totalReplacements = results.reduce((sum, r) => sum + r.replacements, 0);
    const filesWithChanges = results.filter(r => r.replacements > 0).length;
    
    console.log(`\n📊 Summary:`);
    console.log(`   Files processed: ${totalFiles}`);
    console.log(`   Files with changes: ${filesWithChanges}`);
    console.log(`   Total replacements: ${totalReplacements}`);
    
    if (filesWithChanges > 0) {
      console.log(`\n📝 Files with changes:`);
      results
        .filter(r => r.replacements > 0)
        .forEach(r => {
          console.log(`   ${r.file} (${r.replacements} replacements)`);
        });
    }
    
    console.log('\n✅ Content relinking completed successfully!');
    
  } catch (error) {
    console.error('❌ Content relinking failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
