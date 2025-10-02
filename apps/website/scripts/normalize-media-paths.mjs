#!/usr/bin/env node

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const POSTS_DIR = join(__dirname, '..', 'src', 'content', 'posts');

/**
 * Normalize media paths in markdown content to use /uploads/ prefix
 */
function normalizeMediaPaths(content) {
  // Match various media path patterns and normalize them to /uploads/
  const patterns = [
    // Relative paths like ./uploads/, ../uploads/, uploads/
    /(!\[[^\]]*\]\()(?:\.\/)?(?:\.\.\/)?uploads\//g,
    // Absolute paths that should be relative to site root
    /(!\[[^\]]*\]\()\/uploads\//g,
    // Paths without uploads prefix that should have it
    /(!\[[^\]]*\]\()(?!https?:\/\/)(?!\/uploads\/)([^)]*\.(jpg|jpeg|png|gif|webp|svg|pdf))\)/g
  ];
  
  let normalized = content;
  
  // Normalize existing uploads paths
  normalized = normalized.replace(patterns[0], '$1/uploads/');
  normalized = normalized.replace(patterns[1], '$1/uploads/');
  
  // Add uploads prefix to media files without it (optional - commented out for safety)
  // normalized = normalized.replace(patterns[2], '$1/uploads/$2)');
  
  return normalized;
}

/**
 * Process a single markdown file
 */
function processFile(filePath) {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const normalized = normalizeMediaPaths(content);
    
    if (content !== normalized) {
      writeFileSync(filePath, normalized, 'utf-8');
      console.log(`[NORMALIZE] Updated media paths in: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`[NORMALIZE] Error processing ${filePath}:`, error.message);
    return false;
  }
}

/**
 * Recursively process all markdown files in a directory
 */
function processDirectory(dirPath) {
  let processedCount = 0;
  
  try {
    const items = readdirSync(dirPath);
    
    for (const item of items) {
      const itemPath = join(dirPath, item);
      const stat = statSync(itemPath);
      
      if (stat.isDirectory()) {
        processedCount += processDirectory(itemPath);
      } else if (item.endsWith('.md')) {
        if (processFile(itemPath)) {
          processedCount++;
        }
      }
    }
  } catch (error) {
    console.error(`[NORMALIZE] Error processing directory ${dirPath}:`, error.message);
  }
  
  return processedCount;
}

/**
 * Main normalization function
 */
function normalizeMediaPaths() {
  console.log('[NORMALIZE] Starting media path normalization...');
  
  if (!statSync(POSTS_DIR).isDirectory()) {
    console.log('[NORMALIZE] Posts directory not found, nothing to normalize');
    return;
  }
  
  const processedCount = processDirectory(POSTS_DIR);
  
  if (processedCount > 0) {
    console.log(`[NORMALIZE] Normalized media paths in ${processedCount} files`);
  } else {
    console.log('[NORMALIZE] No files needed media path normalization');
  }
}

// Run normalization
normalizeMediaPaths();
