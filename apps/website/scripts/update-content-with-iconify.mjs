#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Icon mapping from file paths to Iconify tokens
const iconMapping = {
  '/logos/discovery-icon-png.svg': 'simple-icons:discovery',
  '/logos/delivery-icon-png.svg': 'simple-icons:delivery',
  '/logos/analytics-icon-png.svg': 'simple-icons:googleanalytics',
  '/logos/itil-pb-logo.svg': 'simple-icons:itil',
  '/logos/pmi-logo-png.svg': 'simple-icons:projectmanagementinstitute',
  '/logos/pmi-agile-certified-practitioner.svg': 'simple-icons:agile',
  '/logos/google-cloud-logo.svg': 'simple-icons:googlecloud',
  '/logos/Logo-ISO-27001.svg': 'simple-icons:iso',
  '/logos/eslint.svg': 'simple-icons:eslint',
  '/logos/Amazon_Web_Services_Logo.svg': 'simple-icons:amazonaws',
  '/logos/linux-logo.svg': 'simple-icons:linux',
  '/logos/webdev-logo.svg': 'simple-icons:webcomponents',
  '/logos/python-logo.svg': 'simple-icons:python',
  '/logos/SQL-logo.svg': 'simple-icons:postgresql',
  '/logos/ml-ai-logo.svg': 'simple-icons:tensorflow',
  '/logos/flag-united-kingdom.svg': 'twemoji:flag-united-kingdom',
  '/logos/flag-russia.svg': 'twemoji:flag-russia',
  '/logos/flag-netherlands.svg': 'twemoji:flag-netherlands'
};

// Function to update content file with Iconify tokens
function updateContentWithIconify(filePath) {
  console.log(`[iconify] Updating ${filePath}...`);
  
  const content = readFileSync(filePath, 'utf8');
  
  let updatedContent = content;
  let replacements = 0;
  
  // Replace each icon path with its Iconify token
  for (const [oldPath, newToken] of Object.entries(iconMapping)) {
    const regex = new RegExp(`icon: "${oldPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'g');
    const matches = updatedContent.match(regex);
    if (matches) {
      updatedContent = updatedContent.replace(regex, `icon: "${newToken}"`);
      replacements += matches.length;
      console.log(`[iconify] Replaced ${matches.length} instances of ${oldPath} with ${newToken}`);
    }
  }
  
  if (replacements > 0) {
    writeFileSync(filePath, updatedContent, 'utf8');
    console.log(`[iconify] ✓ Updated ${filePath} with ${replacements} replacements`);
  } else {
    console.log(`[iconify] No replacements needed in ${filePath}`);
  }
}

// Update both content files
const contentFiles = [
  path.resolve(__dirname, '../src/content/aboutPage/en/about-expanded.md'),
  path.resolve(__dirname, '../src/content/aboutPage/ru/about-expanded.md')
];

for (const contentFile of contentFiles) {
  try {
    updateContentWithIconify(contentFile);
  } catch (error) {
    console.error(`[iconify] ✗ Failed to update ${contentFile}:`, error.message);
  }
}

console.log('[iconify] Complete! Content files updated with Iconify tokens.');
