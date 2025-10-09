#!/usr/bin/env node

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Функция для устойчивого резолва пакетов в монорепо с hoisting
function resolveFromWorkspaces(spec) {
  const candidates = [
    // локальный node_modules внутри пакета
    join(__dirname, '../node_modules'),
    // корень монорепо (на два уровня выше)
    join(__dirname, '../../../node_modules'),
    // корень монорепо (на три уровня выше) - альтернативный путь
    join(__dirname, '../../../../node_modules'),
    // сам __dirname как fallback
    __dirname,
  ];
  
  // Извлекаем имя пакета из spec (например, @iconify-json/fa6-solid/icons.json)
  const packageName = spec.split('/')[0] + '/' + spec.split('/')[1];
  const fileName = spec.split('/').slice(2).join('/');
  
  for (const p of candidates) {
    try {
      const fullPath = join(p, packageName, fileName);
      if (statSync(fullPath).isFile()) {
        console.log(`[iconify] resolved ${spec} from ${fullPath}`);
        return fullPath;
      }
    } catch {}
  }
  return null;
}

function resolveIconifyIconsJson(collection) {
  const spec = `@iconify-json/${collection}/icons.json`;
  const found = resolveFromWorkspaces(spec);
  if (!found) {
    console.warn(`[iconify] collection not found (skipping): ${spec}`);
    return null;
  }
  return found;
}

// Static list of additional icons that might be missing from content
const ADDITIONAL_ICONS = [
  // Font Awesome 6 Solid
  'fa6-solid:user',
  'fa6-solid:briefcase', 
  'fa6-solid:star',
  'fa6-solid:circle-info',
  'fa6-solid:building',
  
  // Material Design Icons
  'mdi:download',
  'mdi:telegram',
  'mdi:linkedin',
  'mdi:link-variant',
  'mdi:magnify',
  'mdi:truck-delivery',
  'mdi:book-open-variant',
  'mdi:book-account',
  'mdi:rocket-launch',
  'mdi:certificate',
  'mdi:cloud',
  'mdi:linux',
  'mdi:web',
  'mdi:language-python',
  'mdi:database',
  'mdi:brain',
  
  // Simple Icons
  'simple-icons:telegram',
  'simple-icons:linkedin',
  'simple-icons:portfolio',
  'simple-icons:discovery',
  'simple-icons:delivery',
  'simple-icons:googleanalytics',
  'simple-icons:itil',
  'simple-icons:projectmanagementinstitute',
  'simple-icons:agile',
  'simple-icons:googlecloud',
  'simple-icons:iso',
  'simple-icons:eslint',
  'simple-icons:amazonaws',
  'simple-icons:linux',
  'simple-icons:webcomponents',
  'simple-icons:python',
  'simple-icons:postgresql',
  'simple-icons:tensorflow',
  'simple-icons:github',
  'simple-icons:snowboarding',
  'simple-icons:artstation',
  'simple-icons:netflix',
  'simple-icons:chef',
  
  // Twemoji
  'twemoji:flag-united-kingdom',
  'twemoji:flag-russia',
  'twemoji:flag-netherlands'
];

// Function to recursively find all files in a directory
function findFiles(dir, extensions = ['.md', '.astro', '.ts', '.tsx', '.js', '.jsx']) {
  const files = [];
  
  try {
    const items = readdirSync(dir);
    
    for (const item of items) {
      const fullPath = join(dir, item);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip node_modules and other common directories
        if (!['node_modules', '.git', 'dist', '.astro'].includes(item)) {
          files.push(...findFiles(fullPath, extensions));
        }
      } else if (stat.isFile()) {
        const ext = item.substring(item.lastIndexOf('.'));
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not read directory ${dir}:`, error.message);
  }
  
  return files;
}

// Function to extract icon tokens from file content
function extractIconTokens(content) {
  const iconRegex = /(mdi:[a-z0-9-]+|simple-icons:[a-z0-9-]+|fa6-solid:[a-z0-9-]+|fa6-brands:[a-z0-9-]+|twemoji:[a-z0-9-]+)/g;
  const matches = content.match(iconRegex) || [];
  return [...new Set(matches)]; // Remove duplicates
}

// Function to collect all icon tokens from content
function collectIconTokens() {
  console.log('🔍 Scanning content for icon tokens...');
  
  const contentDir = join(__dirname, '../src');
  const files = findFiles(contentDir);
  
  const allTokens = new Set();
  
  for (const file of files) {
    try {
      const content = readFileSync(file, 'utf8');
      const tokens = extractIconTokens(content);
      tokens.forEach(token => allTokens.add(token));
    } catch (error) {
      console.warn(`Warning: Could not read file ${file}:`, error.message);
    }
  }
  
  // Add additional static icons
  ADDITIONAL_ICONS.forEach(token => allTokens.add(token));
  
  const iconTokens = Array.from(allTokens).sort();
  console.log(`✅ Found ${iconTokens.length} unique icon tokens`);
  
  return iconTokens;
}

// Функция для загрузки коллекции иконок
function loadIconCollection(prefix) {
  try {
    const collectionPath = resolveIconifyIconsJson(prefix);
    if (!collectionPath) {
      console.warn(`[iconify] Failed to resolve collection: ${prefix}`);
      return null;
    }
    const collectionData = JSON.parse(readFileSync(collectionPath, 'utf8'));
    return collectionData;
  } catch (error) {
    console.error(`Failed to load collection ${prefix}:`, error.message);
    return null;
  }
}

// Функция для извлечения нужных иконок из коллекции
function extractIcons(collection, prefix, tokens) {
  const icons = {};
  const neededIcons = tokens.filter(token => token.startsWith(prefix + ':'));
  
  for (const token of neededIcons) {
    const iconName = token.replace(prefix + ':', '');
    if (collection.icons && collection.icons[iconName]) {
      icons[iconName] = collection.icons[iconName];
    }
  }
  
  return icons;
}

// Main bundle building function
function buildIconifyBundle() {
  console.log('🔨 Building Iconify bundle...');
  
  // Collect all icon tokens from content
  const iconTokens = collectIconTokens();
  
  const bundle = {};
  
  // Process each collection
  const collections = {
    'fa6-solid': 'fa6-solid',
    'fa6-brands': 'fa6-brands',
    'mdi': 'mdi',
    'simple-icons': 'simple-icons', 
    'twemoji': 'twemoji'
  };
  
  for (const [prefix, packageName] of Object.entries(collections)) {
    console.log(`📦 Processing ${prefix} collection...`);
    
    const collection = loadIconCollection(packageName);
    if (!collection) {
      console.warn(`⚠️  Skipping ${prefix} collection (not found)`);
      continue;
    }
    
    const icons = extractIcons(collection, prefix, iconTokens);
    const iconCount = Object.keys(icons).length;
    
    if (iconCount > 0) {
      bundle[prefix] = {
        ...collection,
        icons: icons
      };
      console.log(`✅ Added ${iconCount} icons from ${prefix}`);
    } else {
      console.log(`ℹ️  No icons found for ${prefix}`);
    }
  }
  
  // Save bundle
  const outputPath = join(__dirname, '../public/iconify-bundle.json');
  writeFileSync(outputPath, JSON.stringify(bundle, null, 2));
  
  const totalIcons = Object.values(bundle).reduce((sum, collection) => {
    return sum + Object.keys(collection.icons || {}).length;
  }, 0);
  
  console.log(`🎉 Bundle created successfully!`);
  console.log(`📊 Total icons: ${totalIcons}`);
  console.log(`📁 Output: ${outputPath}`);
  console.log(`📏 Bundle size: ${(JSON.stringify(bundle).length / 1024).toFixed(2)} KB`);
  
  // Log collected tokens for debugging
  console.log(`🔍 Collected tokens: ${iconTokens.join(', ')}`);
  
  // Проверка на пустой бандл
  if (totalIcons === 0) {
    console.error('[iconify] bundle is empty — check collections or tokens');
    console.error('[iconify] This may indicate missing @iconify-json packages or hoisting issues');
    // Не валим билд жестко, но подсвечиваем ошибку возвратным кодом
    process.exitCode = 1;
  }
}

// Запускаем сборку
buildIconifyBundle();
