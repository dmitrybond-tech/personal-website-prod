#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Icon replacements
const replacements = [
  ['/logos/discovery-icon-png.svg', 'simple-icons:discovery'],
  ['/logos/delivery-icon-png.svg', 'simple-icons:delivery'],
  ['/logos/analytics-icon-png.svg', 'simple-icons:googleanalytics'],
  ['/logos/itil-pb-logo.svg', 'simple-icons:itil'],
  ['/logos/pmi-logo-png.svg', 'simple-icons:projectmanagementinstitute'],
  ['/logos/pmi-agile-certified-practitioner.svg', 'simple-icons:agile'],
  ['/logos/google-cloud-logo.svg', 'simple-icons:googlecloud'],
  ['/logos/Logo-ISO-27001.svg', 'simple-icons:iso'],
  ['/logos/eslint.svg', 'simple-icons:eslint'],
  ['/logos/Amazon_Web_Services_Logo.svg', 'simple-icons:amazonaws'],
  ['/logos/linux-logo.svg', 'simple-icons:linux'],
  ['/logos/webdev-logo.svg', 'simple-icons:webcomponents'],
  ['/logos/python-logo.svg', 'simple-icons:python'],
  ['/logos/SQL-logo.svg', 'simple-icons:postgresql'],
  ['/logos/ml-ai-logo.svg', 'simple-icons:tensorflow'],
  ['/logos/flag-united-kingdom.svg', 'twemoji:flag-united-kingdom'],
  ['/logos/flag-russia.svg', 'twemoji:flag-russia'],
  ['/logos/flag-netherlands.svg', 'twemoji:flag-netherlands']
];

function replaceIcons(filePath) {
  console.log(`Replacing icons in ${filePath}...`);
  
  let content = readFileSync(filePath, 'utf8');
  let totalReplacements = 0;
  
  for (const [oldIcon, newIcon] of replacements) {
    const regex = new RegExp(`icon: "${oldIcon.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'g');
    const matches = content.match(regex);
    if (matches) {
      content = content.replace(regex, `icon: "${newIcon}"`);
      totalReplacements += matches.length;
      console.log(`  Replaced ${matches.length} instances of ${oldIcon} with ${newIcon}`);
    }
  }
  
  if (totalReplacements > 0) {
    writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Updated ${filePath} with ${totalReplacements} replacements`);
  } else {
    console.log(`  No replacements needed in ${filePath}`);
  }
}

// Update files
const files = [
  path.resolve(__dirname, '../src/content/aboutPage/en/about-expanded.md'),
  path.resolve(__dirname, '../src/content/aboutPage/ru/about-expanded.md')
];

for (const file of files) {
  try {
    replaceIcons(file);
  } catch (error) {
    console.error(`Error updating ${file}:`, error.message);
  }
}

console.log('Icon replacement complete!');
