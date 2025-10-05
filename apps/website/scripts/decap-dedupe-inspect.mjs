#!/usr/bin/env node

import { fileURLToPath } from 'node:url';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import jsyaml from 'js-yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Candidates to inspect
const CANDIDATES = [
  path.resolve(__dirname, '../public/website-admin/config.yml'),
  path.resolve(__dirname, '../public/website-admin/config.generated.yml'),
  path.resolve(__dirname, '../public/website-admin/config.dev.yml'),
  path.resolve(__dirname, '../public/website-admin/config.prod.yml')
];

function inspectFieldsForDuplicates(fields, path = '') {
  const seen = new Map();
  let hasDuplicates = false;
  
  for (const field of fields) {
    const key = field.name;
    const fullPath = path ? `${path}.${key}` : key;
    
    if (seen.has(key)) {
      console.error(`[inspect] DUPLICATE FIELD NAME: "${key}" at path: ${fullPath}`);
      console.error(`[inspect] First occurrence: ${seen.get(key)}`);
      console.error(`[inspect] Duplicate occurrence: ${fullPath}`);
      hasDuplicates = true;
    } else {
      seen.set(key, fullPath);
    }
    
    // Recursively inspect nested fields
    if (field.fields) {
      const nestedDuplicates = inspectFieldsForDuplicates(field.fields, `${fullPath}.fields`);
      hasDuplicates = hasDuplicates || nestedDuplicates;
    }
    
    // Inspect types in list widgets
    if (field.types) {
      for (const type of field.types) {
        if (type.fields) {
          const typeDuplicates = inspectFieldsForDuplicates(type.fields, `${fullPath}.types.${type.name}.fields`);
          hasDuplicates = hasDuplicates || typeDuplicates;
        }
      }
    }
  }
  
  return hasDuplicates;
}

function inspectCollection(collection, collectionPath) {
  let hasDuplicates = false;
  
  // Inspect files collections
  if (collection.files) {
    for (const file of collection.files) {
      if (file.fields) {
        const filePath = `${collectionPath}.files.${file.name}.fields`;
        const fileDuplicates = inspectFieldsForDuplicates(file.fields, filePath);
        hasDuplicates = hasDuplicates || fileDuplicates;
      }
    }
  }
  
  // Inspect folder collections
  if (collection.fields) {
    const folderPath = `${collectionPath}.fields`;
    const folderDuplicates = inspectFieldsForDuplicates(collection.fields, folderPath);
    hasDuplicates = hasDuplicates || folderDuplicates;
  }
  
  return hasDuplicates;
}

function inspectConfig(config, configPath) {
  console.log(`[inspect] Inspecting: ${configPath}`);
  
  let hasDuplicates = false;
  
  // Inspect collections
  for (const collection of config.collections || []) {
    const collectionPath = `collections.${collection.name}`;
    const collectionDuplicates = inspectCollection(collection, collectionPath);
    hasDuplicates = hasDuplicates || collectionDuplicates;
  }
  
  return hasDuplicates;
}

async function main() {
  console.log('[inspect] Starting duplicate field inspection...');
  
  let totalDuplicates = 0;
  
  for (const configPath of CANDIDATES) {
    if (!existsSync(configPath)) {
      console.log(`[inspect] Skipping non-existent: ${configPath}`);
      continue;
    }
    
    try {
      const content = readFileSync(configPath, 'utf8');
      const config = jsyaml.load(content);
      
      const hasDuplicates = inspectConfig(config, configPath);
      
      if (hasDuplicates) {
        totalDuplicates++;
        console.error(`[inspect] ✗ Found duplicates in: ${configPath}`);
      } else {
        console.log(`[inspect] ✓ No duplicates found in: ${configPath}`);
      }
      
    } catch (error) {
      console.error(`[inspect] ✗ Failed to inspect ${configPath}:`, error.message);
      process.exit(1);
    }
  }
  
  if (totalDuplicates > 0) {
    console.error(`[inspect] FAIL: Found duplicates in ${totalDuplicates} config files`);
    process.exit(1);
  } else {
    console.log('[inspect] SUCCESS: No duplicate field names found in any config files');
  }
}

main().catch(error => {
  console.error('[inspect] Fatal error:', error);
  process.exit(1);
});