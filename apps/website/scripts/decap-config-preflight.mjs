#!/usr/bin/env node

import { fileURLToPath } from 'node:url';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import jsyaml from 'js-yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Candidates to validate
const CANDIDATES = [
  path.resolve(__dirname, '../public/website-admin/config.generated.yml'),
  path.resolve(__dirname, '../public/website-admin/config.yml')
];

function validateFieldsUniqueness(fields, path = '') {
  const seen = new Map();
  let hasDuplicates = false;
  
  for (const field of fields) {
    const key = field.name;
    const fullPath = path ? `${path}.${key}` : key;
    
    if (seen.has(key)) {
      console.error(`[preflight] DUPLICATE FIELD NAME: "${key}" at path: ${fullPath}`);
      hasDuplicates = true;
    } else {
      seen.set(key, fullPath);
    }
    
    // Recursively validate nested fields
    if (field.fields) {
      const nestedDuplicates = validateFieldsUniqueness(field.fields, `${fullPath}.fields`);
      hasDuplicates = hasDuplicates || nestedDuplicates;
    }
    
    // Validate types in list widgets
    if (field.types) {
      for (const type of field.types) {
        if (type.fields) {
          const typeDuplicates = validateFieldsUniqueness(type.fields, `${fullPath}.types.${type.name}.fields`);
          hasDuplicates = hasDuplicates || typeDuplicates;
        }
      }
    }
  }
  
  return hasDuplicates;
}

function validateCollection(collection) {
  const name = collection.name || 'unnamed';
  let hasErrors = false;
  
  // Check files XOR folder constraint
  const hasFiles = !!collection.files;
  const hasFolder = !!collection.folder;
  
  if (!hasFiles && !hasFolder) {
    console.error(`[preflight] FAIL: Collection "${name}" has neither files nor folder`);
    hasErrors = true;
  }
  
  if (hasFiles && hasFolder) {
    console.error(`[preflight] FAIL: Collection "${name}" has both files and folder`);
    hasErrors = true;
  }
  
  // Check for forbidden type: files
  if (collection.type === 'files') {
    console.error(`[preflight] FAIL: Collection "${name}" has forbidden type: files`);
    hasErrors = true;
  }
  
  // Validate field uniqueness in files collections
  if (collection.files) {
    for (const file of collection.files) {
      if (file.fields) {
        const fileDuplicates = validateFieldsUniqueness(file.fields, `collections.${name}.files.${file.name}.fields`);
        hasErrors = hasErrors || fileDuplicates;
      }
    }
  }
  
  // Validate field uniqueness in folder collections
  if (collection.fields) {
    const folderDuplicates = validateFieldsUniqueness(collection.fields, `collections.${name}.fields`);
    hasErrors = hasErrors || folderDuplicates;
  }
  
  return hasErrors;
}

function validateConfig(config, configPath) {
  console.log(`[preflight] Validating: ${configPath}`);
  
  let hasErrors = false;
  
  // Validate collections
  for (const collection of config.collections || []) {
    const collectionErrors = validateCollection(collection);
    hasErrors = hasErrors || collectionErrors;
  }
  
  return hasErrors;
}

async function main() {
  console.log('[preflight] Starting Decap config preflight validation...');
  
  let totalErrors = 0;
  
  for (const configPath of CANDIDATES) {
    if (!existsSync(configPath)) {
      console.log(`[preflight] Skipping non-existent: ${configPath}`);
      continue;
    }
    
    try {
      const content = readFileSync(configPath, 'utf8');
      const config = jsyaml.load(content);
      
      const hasErrors = validateConfig(config, configPath);
      
      if (hasErrors) {
        totalErrors++;
        console.error(`[preflight] ✗ Validation failed for: ${configPath}`);
      } else {
        console.log(`[preflight] ✓ Validation passed for: ${configPath}`);
      }
      
    } catch (error) {
      console.error(`[preflight] ✗ Failed to validate ${configPath}:`, error.message);
      process.exit(1);
    }
  }
  
  if (totalErrors > 0) {
    console.error(`[preflight] FAIL: ${totalErrors} config files failed validation`);
    process.exit(1);
  } else {
    console.log('[preflight] SUCCESS: All config files passed validation');
  }
}

main().catch(error => {
  console.error('[preflight] Fatal error:', error);
  process.exit(1);
});