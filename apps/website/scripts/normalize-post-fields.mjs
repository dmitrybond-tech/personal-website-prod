#!/usr/bin/env node

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const POSTS_DIR = 'src/content/posts';

function toISO(d) {
  if (typeof d !== 'string') return d;
  let s = d.trim().replace(/[\u2012\u2013\u2014\u2212]/g, '-');
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/^(\d{2})[./-](\d{2})[./-](\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return s;
}

function normalizePostFile(filePath) {
  try {
    const content = readFileSync(filePath, 'utf8');
    
    // Check if it's a markdown file with frontmatter
    if (!content.startsWith('---')) {
      console.log(`Skipping ${filePath}: No frontmatter found`);
      return;
    }
    
    const parts = content.split('---');
    if (parts.length < 3) {
      console.log(`Skipping ${filePath}: Invalid frontmatter format`);
      return;
    }
    
    const frontmatter = parts[1];
    const body = parts.slice(2).join('---');
    
    let lines = frontmatter.split('\n');
    let modified = false;
    let dateInserted = false;
    
    // Check for date field
    const dateIndex = lines.findIndex(line => line.startsWith('date:'));
    if (dateIndex === -1) {
      // Insert date after first line (title)
      const today = new Date().toISOString().slice(0, 10);
      lines.splice(1, 0, `date: ${today}`);
      modified = true;
      dateInserted = true;
      console.log(`Added date field to ${filePath}`);
    } else {
      // Normalize existing date
      const dateLine = lines[dateIndex];
      const dateMatch = dateLine.match(/^date:\s*(.+)$/);
      if (dateMatch) {
        const rawDate = dateMatch[1].trim();
        const normalizedDate = toISO(rawDate);
        if (normalizedDate !== rawDate) {
          lines[dateIndex] = `date: ${normalizedDate}`;
          modified = true;
          console.log(`Normalized date in ${filePath}: ${rawDate} -> ${normalizedDate}`);
        }
      }
    }
    
    // Check for draft field
    const draftIndex = lines.findIndex(line => line.startsWith('draft:'));
    if (draftIndex === -1) {
      // Insert draft after date (or after title if date was just inserted)
      const insertIndex = dateInserted ? 2 : (dateIndex !== -1 ? dateIndex + 1 : 1);
      lines.splice(insertIndex, 0, 'draft: false');
      modified = true;
      console.log(`Added draft field to ${filePath}`);
    }
    
    if (modified) {
      const newContent = `---${lines.join('\n')}\n---${body}`;
      writeFileSync(filePath, newContent, 'utf8');
      console.log(`Updated ${filePath}`);
    } else {
      console.log(`No changes needed for ${filePath}`);
    }
    
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

function walkDirectory(dir) {
  const items = readdirSync(dir);
  
  for (const item of items) {
    const fullPath = join(dir, item);
    const stat = statSync(fullPath);
    
    if (stat.isDirectory()) {
      walkDirectory(fullPath);
    } else if (stat.isFile() && (extname(item) === '.md' || extname(item) === '.mdx')) {
      normalizePostFile(fullPath);
    }
  }
}

console.log('Starting post field normalization...');
walkDirectory(POSTS_DIR);
console.log('Post field normalization completed!');
