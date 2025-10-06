#!/usr/bin/env node

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import yaml from 'js-yaml';

// Brand mapping for links
const brandMap = {
  github: 'simple-icons:github',
  linkedin: 'simple-icons:linkedin',
  x: 'simple-icons:x',
  twitter: 'simple-icons:x',
  youtube: 'simple-icons:youtube',
  medium: 'simple-icons:medium',
  notion: 'simple-icons:notion',
  figma: 'simple-icons:figma',
  vercel: 'simple-icons:vercel',
  'cal.com': 'simple-icons:cal',
  amazonaws: 'simple-icons:amazonaws',
  azure: 'simple-icons:microsoftazure',
  googlecloud: 'simple-icons:googlecloud',
  docker: 'simple-icons:docker',
  kubernetes: 'simple-icons:kubernetes',
  telegram: 'simple-icons:telegram'
};

// Category fallbacks by path keywords
const categoryFallbacks = {
  'skills.*discovery': 'mdi:compass',
  'skills.*delivery': 'mdi:truck-fast',
  'skills.*analytics': 'mdi:chart-line',
  'education': 'mdi:school',
  'experience': 'mdi:briefcase',
  'favorites.*books': 'mdi:book-open-variant',
  'favorites.*movies': 'mdi:movie-open',
  'favorites.*medias': 'mdi:newspaper-variant',
  'favorites.*hobbies': 'mdi:heart-pulse'
};

function isValidIconId(icon) {
  if (typeof icon !== 'string') return false;
  return /^[a-z0-9-]+:[a-z0-9-]+$/.test(icon);
}

function normalizeIcon(icon, link, filePath) {
  if (!icon) {
    // Try to map from link
    if (link) {
      const domain = link.replace(/^https?:\/\/(www\.)?/, '').split('/')[0].split('.')[0];
      const brandIcon = brandMap[domain];
      if (brandIcon) {
        return brandIcon;
      }
    }
    
    // Try category fallbacks
    for (const [pattern, fallbackIcon] of Object.entries(categoryFallbacks)) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      if (regex.test(filePath)) {
        return fallbackIcon;
      }
    }
    
    return null;
  }
  
  // Remove quotes if present
  const cleanIcon = icon.replace(/^['"]|['"]$/g, '');
  
  // Check if already valid and quoted
  if (isValidIconId(cleanIcon)) {
    // If it's valid but not quoted, return it quoted
    if (icon !== `'${cleanIcon}'` && icon !== `"${cleanIcon}"`) {
      return cleanIcon; // Return unquoted for YAML to handle
    }
    return null; // Already properly formatted
  }
  
  // Try to fix common issues
  if (cleanIcon.includes(':')) {
    const [prefix, name] = cleanIcon.split(':');
    if (prefix && name) {
      return `${prefix}:${name}`;
    }
  }
  
  return null;
}

function processObject(obj, filePath, changes = {}) {
  if (typeof obj !== 'object' || obj === null) return changes;
  
  for (const [key, value] of Object.entries(obj)) {
    if (key === 'icon' && typeof value === 'string') {
      const normalized = normalizeIcon(value, obj.link, filePath);
      if (normalized && normalized !== value) {
        obj[key] = normalized;
        changes[`${key}: ${value} -> ${normalized}`] = true;
      }
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (typeof item === 'object' && item !== null) {
          processObject(item, filePath, changes);
        }
      });
    } else if (typeof value === 'object' && value !== null) {
      processObject(value, filePath, changes);
    }
  }
  
  return changes;
}

function processMarkdownFile(filePath) {
  try {
    const content = readFileSync(filePath, 'utf8');
    const parts = content.split('---');
    if (parts.length < 3) {
      return null;
    }
    
    const frontmatterYaml = parts[1];
    const markdownContent = parts.slice(2).join('---');
    
    // First, fix unquoted icons in the raw YAML
    let fixedYaml = frontmatterYaml.replace(/icon:\s*([a-z0-9-]+:[a-z0-9-]+)/gm, (match, iconId) => `icon: '${iconId}'`);
    
    if (fixedYaml !== frontmatterYaml) {
      console.log(`Found unquoted icons in ${filePath}`);
    }
    
    try {
      const frontmatter = yaml.load(fixedYaml);
      const changes = processObject(frontmatter, filePath);
      
      if (Object.keys(changes).length > 0 || fixedYaml !== frontmatterYaml) {
        const newFrontmatterYaml = yaml.dump(frontmatter, { 
          lineWidth: -1,
          noRefs: true,
          quotingType: "'",
          forceQuotes: false
        });
        const newContent = `---${newFrontmatterYaml}---${markdownContent}`;
        writeFileSync(filePath, newContent, 'utf8');
        
        // Add changes for unquoted icons
        if (fixedYaml !== frontmatterYaml) {
          changes['Fixed unquoted icons'] = true;
        }
        
        return changes;
      }
    } catch (yamlError) {
      console.warn(`Warning: Could not parse YAML in ${filePath}:`, yamlError.message);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
  
  return null;
}

function scanDirectory(dirPath) {
  const results = [];
  
  try {
    const entries = readdirSync(dirPath);
    
    for (const entry of entries) {
      const fullPath = join(dirPath, entry);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        results.push(...scanDirectory(fullPath));
      } else if (extname(entry) === '.md') {
        const changes = processMarkdownFile(fullPath);
        if (changes) {
          results.push({ file: fullPath, changes });
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${dirPath}:`, error.message);
  }
  
  return results;
}

// Main execution
const contentDir = join(process.cwd(), 'src', 'content');
console.log(`Scanning ${contentDir} for markdown files...`);

const results = scanDirectory(contentDir);

if (results.length === 0) {
  console.log('No files needed icon normalization.');
} else {
  console.log(`\nFixed icon fields in ${results.length} files:`);
  results.forEach(({ file, changes }) => {
    console.log(`\n${file}:`);
    Object.keys(changes).forEach(change => {
      console.log(`  - ${change}`);
    });
  });
}

console.log('\nDone!');
