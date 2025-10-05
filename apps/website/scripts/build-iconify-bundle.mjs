#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Список всех Iconify токенов из about-expanded.md файлов и компонентов
const ICON_TOKENS = [
  // Font Awesome 6 Solid
  'fa6-solid:user',
  'fa6-solid:briefcase', 
  'fa6-solid:star',
  'fa6-solid:circle-info',
  
  // Material Design Icons
  'mdi:download',
  'mdi:telegram',
  'mdi:linkedin',
  'mdi:link-variant',
  
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

// Функция для загрузки коллекции иконок
function loadIconCollection(prefix) {
  try {
    const collectionPath = join(__dirname, '../node_modules/@iconify-json', prefix, 'icons.json');
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

// Основная функция сборки bundle
function buildIconifyBundle() {
  console.log('🔨 Building Iconify bundle...');
  
  const bundle = {};
  
  // Обрабатываем каждую коллекцию
  const collections = {
    'fa6-solid': 'fa6-solid',
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
    
    const icons = extractIcons(collection, prefix, ICON_TOKENS);
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
  
  // Сохраняем bundle
  const outputPath = join(__dirname, '../public/iconify-bundle.json');
  writeFileSync(outputPath, JSON.stringify(bundle, null, 2));
  
  const totalIcons = Object.values(bundle).reduce((sum, collection) => {
    return sum + Object.keys(collection.icons || {}).length;
  }, 0);
  
  console.log(`🎉 Bundle created successfully!`);
  console.log(`📊 Total icons: ${totalIcons}`);
  console.log(`📁 Output: ${outputPath}`);
  console.log(`📏 Bundle size: ${(JSON.stringify(bundle).length / 1024).toFixed(2)} KB`);
}

// Запускаем сборку
buildIconifyBundle();
