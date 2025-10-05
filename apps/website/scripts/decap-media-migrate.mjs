#!/usr/bin/env node

import { fileURLToPath } from 'node:url';
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from 'node:fs';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// MD files to scan for media migration
const MD_FILES = [
  path.resolve(__dirname, '../src/content/aboutPage/en/about-expanded.md'),
  path.resolve(__dirname, '../src/content/aboutPage/ru/about-expanded.md')
];

// Target uploads directory
const UPLOADS_DIR = path.resolve(__dirname, '../public/uploads');

// Project root for resolving relative paths
const PROJECT_ROOT = path.resolve(__dirname, '../..');

function ensureUploadsDir() {
  if (!existsSync(UPLOADS_DIR)) {
    mkdirSync(UPLOADS_DIR, { recursive: true });
    console.log(`[migrate] Created uploads directory: ${UPLOADS_DIR}`);
  }
}

function findImageReferences(content) {
  const references = [];
  
  // Find markdown image syntax: ![alt](path)
  const markdownImages = content.match(/!\[.*?\]\((.*?)\)/g) || [];
  for (const match of markdownImages) {
    const pathMatch = match.match(/!\[.*?\]\((.*?)\)/);
    if (pathMatch) {
      references.push({
        type: 'markdown',
        fullMatch: match,
        path: pathMatch[1],
        originalPath: pathMatch[1]
      });
    }
  }
  
  // Find HTML img tags: <img src="path" ...>
  const htmlImages = content.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi) || [];
  for (const match of htmlImages) {
    const pathMatch = match.match(/src=["']([^"']+)["']/i);
    if (pathMatch) {
      references.push({
        type: 'html',
        fullMatch: match,
        path: pathMatch[1],
        originalPath: pathMatch[1]
      });
    }
  }
  
  // Find frontmatter image references (simple string matching)
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (frontmatterMatch) {
    const frontmatter = frontmatterMatch[1];
    const lines = frontmatter.split('\n');
    
    for (const line of lines) {
      // Match lines like: image: 'path' or image: "path"
      const imageMatch = line.match(/^\s*image:\s*["']([^"']+)["']/);
      if (imageMatch) {
        references.push({
          type: 'frontmatter',
          fullMatch: line,
          path: imageMatch[1],
          originalPath: imageMatch[1]
        });
      }
      
      // Match lines like: logo: 'path' or logo: "path"
      const logoMatch = line.match(/^\s*logo:\s*["']([^"']+)["']/);
      if (logoMatch) {
        references.push({
          type: 'frontmatter',
          fullMatch: line,
          path: logoMatch[1],
          originalPath: logoMatch[1]
        });
      }
    }
  }
  
  return references;
}

function isLocalImage(imagePath) {
  // Skip external URLs
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return false;
  }
  
  // Skip data URLs
  if (imagePath.startsWith('data:')) {
    return false;
  }
  
  // Skip if already in uploads
  if (imagePath.startsWith('/uploads/')) {
    return false;
  }
  
  return true;
}

function resolveImagePath(imagePath, mdFilePath) {
  const mdDir = path.dirname(mdFilePath);
  
  // Handle absolute paths from project root
  if (imagePath.startsWith('/')) {
    return path.resolve(PROJECT_ROOT, imagePath.substring(1));
  }
  
  // Handle relative paths
  return path.resolve(mdDir, imagePath);
}

function generateUniqueFilename(originalPath, targetDir) {
  const basename = path.basename(originalPath);
  const ext = path.extname(basename);
  const nameWithoutExt = path.basename(basename, ext);
  
  let counter = 1;
  let newBasename = basename;
  
  while (existsSync(path.join(targetDir, newBasename))) {
    newBasename = `${nameWithoutExt}-${counter}${ext}`;
    counter++;
  }
  
  return newBasename;
}

function copyImageToUploads(sourcePath, targetDir, dryRun = true) {
  if (!existsSync(sourcePath)) {
    console.warn(`[migrate] Source image does not exist: ${sourcePath}`);
    return null;
  }
  
  const filename = generateUniqueFilename(sourcePath, targetDir);
  const targetPath = path.join(targetDir, filename);
  
  if (dryRun) {
    console.log(`[migrate] [DRY-RUN] Would copy: ${sourcePath} -> ${targetPath}`);
    return filename;
  }
  
  try {
    copyFileSync(sourcePath, targetPath);
    console.log(`[migrate] Copied: ${sourcePath} -> ${targetPath}`);
    return filename;
  } catch (error) {
    console.error(`[migrate] Failed to copy ${sourcePath}:`, error.message);
    return null;
  }
}

function updateImageReference(content, reference, newPath) {
  const newFullMatch = reference.fullMatch.replace(reference.originalPath, newPath);
  return content.replace(reference.fullMatch, newFullMatch);
}

function migrateMediaInFile(mdFilePath, dryRun = true) {
  console.log(`[migrate] Processing: ${mdFilePath}`);
  
  if (!existsSync(mdFilePath)) {
    console.warn(`[migrate] File does not exist: ${mdFilePath}`);
    return { found: 0, copied: 0, updated: 0 };
  }
  
  const content = readFileSync(mdFilePath, 'utf8');
  const references = findImageReferences(content);
  
  console.log(`[migrate] Found ${references.length} image references`);
  
  let copiedCount = 0;
  let updatedCount = 0;
  let newContent = content;
  
  for (const ref of references) {
    console.log(`[migrate] Processing reference: ${ref.path} (${ref.type})`);
    
    if (!isLocalImage(ref.path)) {
      console.log(`[migrate] Skipping external/already migrated image: ${ref.path}`);
      continue;
    }
    
    const resolvedPath = resolveImagePath(ref.path, mdFilePath);
    const filename = copyImageToUploads(resolvedPath, UPLOADS_DIR, dryRun);
    
    if (filename) {
      copiedCount++;
      const newPath = `/uploads/${filename}`;
      newContent = updateImageReference(newContent, ref, newPath);
      updatedCount++;
      
      console.log(`[migrate] Updated reference: ${ref.path} -> ${newPath}`);
    }
  }
  
  // Write updated content if not dry run and there were changes
  if (!dryRun && updatedCount > 0) {
    try {
      writeFileSync(mdFilePath, newContent, 'utf8');
      console.log(`[migrate] Updated file: ${mdFilePath}`);
    } catch (error) {
      console.error(`[migrate] Failed to update file ${mdFilePath}:`, error.message);
    }
  }
  
  return { found: references.length, copied: copiedCount, updated: updatedCount };
}

async function main() {
  const args = process.argv.slice(2);
  const isDryRun = !args.includes('--write');
  
  console.log(`[migrate] Starting media migration (${isDryRun ? 'DRY-RUN' : 'WRITE'} mode)...`);
  
  ensureUploadsDir();
  
  let totalFound = 0;
  let totalCopied = 0;
  let totalUpdated = 0;
  
  for (const mdFile of MD_FILES) {
    const stats = migrateMediaInFile(mdFile, isDryRun);
    totalFound += stats.found;
    totalCopied += stats.copied;
    totalUpdated += stats.updated;
  }
  
  console.log(`[migrate] Migration complete!`);
  console.log(`[migrate] Summary:`);
  console.log(`[migrate]   - Total references found: ${totalFound}`);
  console.log(`[migrate]   - Images copied: ${totalCopied}`);
  console.log(`[migrate]   - References updated: ${totalUpdated}`);
  
  if (isDryRun) {
    console.log(`[migrate] This was a dry run. Use --write to perform actual migration.`);
  }
}

main().catch(error => {
  console.error('[migrate] Fatal error:', error);
  process.exit(1);
});
