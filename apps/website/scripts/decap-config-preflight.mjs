#!/usr/bin/env node

import { fileURLToPath } from 'node:url';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import jsyaml from 'js-yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Candidates to validate
const CANDIDATES = [
  path.resolve(__dirname, '../public/website-admin/config.yml'),
  path.resolve(__dirname, '../public/website-admin/config.generated.yml'),
  path.resolve(__dirname, '../public/website-admin/config.dev.yml'),
  path.resolve(__dirname, '../public/website-admin/config.prod.yml')
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

function validateBackendConfig(config, configPath) {
  let hasErrors = false;
  
  // Check backend.name
  if (!config.backend || !config.backend.name) {
    console.error(`[preflight] FAIL: Missing backend.name in ${configPath}`);
    hasErrors = true;
  } else if (config.backend.name !== 'github') {
    console.error(`[preflight] FAIL: backend.name should be 'github', got '${config.backend.name}' in ${configPath}`);
    hasErrors = true;
  }
  
  // Check for erroneous media_library
  if (config.media_library) {
    if (config.media_library.name === 'git') {
      console.error(`[preflight] FAIL: Found erroneous media_library with name 'git' in ${configPath}`);
      hasErrors = true;
    } else {
      console.warn(`[preflight] WARNING: Found media_library with name '${config.media_library.name}' in ${configPath} - consider removing`);
    }
  }
  
  return hasErrors;
}

function validateMediaConfig(config, configPath) {
  let hasErrors = false;
  
  // Check media_folder
  if (!config.media_folder) {
    console.error(`[preflight] FAIL: Missing media_folder in ${configPath}`);
    hasErrors = true;
  } else if (config.media_folder !== 'apps/website/public/uploads') {
    console.error(`[preflight] FAIL: media_folder should be 'apps/website/public/uploads', got '${config.media_folder}' in ${configPath}`);
    hasErrors = true;
  }
  
  // Check public_folder
  if (!config.public_folder) {
    console.error(`[preflight] FAIL: Missing public_folder in ${configPath}`);
    hasErrors = true;
  } else if (config.public_folder !== '/uploads') {
    console.error(`[preflight] FAIL: public_folder should be '/uploads', got '${config.public_folder}' in ${configPath}`);
    hasErrors = true;
  }
  
  // Check if uploads folder exists
  const uploadsPath = path.resolve(__dirname, '../public/uploads');
  if (!existsSync(uploadsPath)) {
    console.error(`[preflight] FAIL: Uploads folder does not exist: ${uploadsPath}`);
    hasErrors = true;
  }
  
  return hasErrors;
}

function validateLocalBackendConfig(config, configPath) {
  let hasErrors = false;
  
  if (config.local_backend) {
    // Check local_backend URL
    if (!config.local_backend.url || config.local_backend.url !== 'http://localhost:8081') {
      console.error(`[preflight] FAIL: local_backend.url should be 'http://localhost:8081', got '${config.local_backend.url}' in ${configPath}`);
      hasErrors = true;
    }
    
    // Check allowed_hosts
    if (!config.local_backend.allowed_hosts || !Array.isArray(config.local_backend.allowed_hosts)) {
      console.error(`[preflight] FAIL: local_backend.allowed_hosts should be an array in ${configPath}`);
      hasErrors = true;
    } else {
      const allowedHosts = config.local_backend.allowed_hosts;
      if (!allowedHosts.includes('localhost:4321')) {
        console.error(`[preflight] FAIL: local_backend.allowed_hosts must include 'localhost:4321' in ${configPath}`);
        hasErrors = true;
      }
      
      // Check for *.lhr.life host if present
      const hasLhrHost = allowedHosts.some(host => host.includes('.lhr.life'));
      if (!hasLhrHost && configPath.includes('generated')) {
        console.warn(`[preflight] WARNING: No *.lhr.life host found in allowed_hosts for ${configPath}`);
      }
    }
  }
  
  return hasErrors;
}

function validateSkillsEducationStructure(fields, path = '') {
  let hasErrors = false;
  
  for (const field of fields) {
    const key = field.name;
    const fullPath = path ? `${path}.${key}` : key;
    
    // Check skills structure
    if (key === 'skills' && field.widget === 'object') {
      if (field.fields) {
        const hasDataField = field.fields.some(f => f.name === 'data');
        const hasGroupsField = field.fields.some(f => f.name === 'data' && f.fields && f.fields.some(df => df.name === 'groups'));
        
        if (!hasDataField) {
          console.error(`[preflight] FAIL: Skills type missing 'data' field at ${fullPath}`);
          hasErrors = true;
        } else if (!hasGroupsField) {
          console.error(`[preflight] FAIL: Skills type missing 'data.groups' structure at ${fullPath}`);
          hasErrors = true;
        } else {
          // Check for old structure traces
          const hasOldCategories = field.fields.some(f => f.name === 'categories');
          if (hasOldCategories) {
            console.warn(`[preflight] WARNING: Found old 'categories' structure in skills at ${fullPath} - should be 'data.groups'`);
          }
        }
      }
    }
    
    // Check education structure
    if (key === 'education' && field.widget === 'object') {
      if (field.fields) {
        const hasDataField = field.fields.some(f => f.name === 'data');
        const hasItemsField = field.fields.some(f => f.name === 'data' && f.fields && f.fields.some(df => df.name === 'items'));
        
        if (!hasDataField) {
          console.error(`[preflight] FAIL: Education type missing 'data' field at ${fullPath}`);
          hasErrors = true;
        } else if (!hasItemsField) {
          console.error(`[preflight] FAIL: Education type missing 'data.items' structure at ${fullPath}`);
          hasErrors = true;
        }
      }
    }
    
    // Check for required fields in skills/education
    if ((key === 'skills' || key === 'education') && field.widget === 'object') {
      if (field.required === true) {
        console.error(`[preflight] FAIL: ${key} type should be optional at ${fullPath}`);
        hasErrors = true;
      }
      
      // Recursively check for required fields in nested structure
      if (field.fields) {
        const nestedErrors = validateRequiredFields(field.fields, `${fullPath}.fields`);
        hasErrors = hasErrors || nestedErrors;
      }
    }
    
    // Recursively check nested fields
    if (field.fields) {
      const nestedErrors = validateSkillsEducationStructure(field.fields, `${fullPath}.fields`);
      hasErrors = hasErrors || nestedErrors;
    }
    if (field.types) {
      for (const type of field.types) {
        if (type.fields) {
          const typeErrors = validateSkillsEducationStructure(type.fields, `${fullPath}.types.${type.name}.fields`);
          hasErrors = hasErrors || typeErrors;
        }
      }
    }
  }
  
  return hasErrors;
}

function validateRequiredFields(fields, path = '') {
  let hasErrors = false;
  
  for (const field of fields) {
    const key = field.name;
    const fullPath = path ? `${path}.${key}` : key;
    
    if (field.required === true) {
      console.error(`[preflight] FAIL: Field '${key}' should be optional at ${fullPath}`);
      hasErrors = true;
    }
    
    // Recursively check nested fields
    if (field.fields) {
      const nestedErrors = validateRequiredFields(field.fields, `${fullPath}.fields`);
      hasErrors = hasErrors || nestedErrors;
    }
  }
  
  return hasErrors;
}

function validateIconField(field, path = '') {
  let hasErrors = false;
  
  if (field.name === 'icon' && field.widget === 'string') {
    const fullPath = path ? `${path}.${field.name}` : field.name;
    
    // Check if it has the required validation
    if (!field.hint || !field.pattern) {
      console.error(`[preflight] FAIL: Icon field missing hint and pattern validation at ${fullPath}`);
      hasErrors = true;
    } else {
      // Check hint content
      if (!field.hint.includes('Iconify token') || !field.hint.includes('/logos/')) {
        console.error(`[preflight] FAIL: Icon field hint should mention Iconify tokens and /logos/ paths at ${fullPath}`);
        hasErrors = true;
      }
      
      // Check pattern content
      if (!Array.isArray(field.pattern) || field.pattern.length !== 2) {
        console.error(`[preflight] FAIL: Icon field pattern should be array with 2 elements at ${fullPath}`);
        hasErrors = true;
      } else {
        const [regex, message] = field.pattern;
        if (!regex.includes('a-z0-9-]+:[a-z0-9-]+') || !regex.includes('/[^\\s]+\\.(?:svg|png|jpg|jpeg)')) {
          console.error(`[preflight] FAIL: Icon field pattern regex should match Iconify tokens and file paths at ${fullPath}`);
          hasErrors = true;
        }
        if (!message.includes('Iconify token') || !message.includes('/logos/')) {
          console.error(`[preflight] FAIL: Icon field pattern message should mention Iconify tokens and /logos/ paths at ${fullPath}`);
          hasErrors = true;
        }
      }
    }
  }
  
  // Recursively check nested fields
  if (field.fields) {
    const nestedErrors = validateIconField(field.fields, `${path}.${field.name}.fields`);
    hasErrors = hasErrors || nestedErrors;
  }
  if (field.types) {
    for (const type of field.types) {
      if (type.fields) {
        const typeErrors = validateIconField(type.fields, `${path}.${field.name}.types.${type.name}.fields`);
        hasErrors = hasErrors || typeErrors;
      }
    }
  }
  
  return hasErrors;
}

function validateActionFields(fields, path = '') {
  let hasErrors = false;
  
  for (const field of fields) {
    const key = field.name;
    const fullPath = path ? `${path}.${key}` : key;
    
    // Check for required action fields
    if (key === 'action' && field.widget === 'object') {
      if (field.required === true) {
        console.error(`[preflight] FAIL: Action object should be optional at ${fullPath}`);
        hasErrors = true;
      }
      if (field.fields) {
        for (const subField of field.fields) {
          if (subField.required === true && ['label', 'url', 'downloadedFileName'].includes(subField.name)) {
            console.error(`[preflight] FAIL: Action sub-field '${subField.name}' should be optional at ${fullPath}.fields.${subField.name}`);
            hasErrors = true;
          }
        }
      }
    }
    
    // Recursively check nested fields
    if (field.fields) {
      const nestedErrors = validateActionFields(field.fields, `${fullPath}.fields`);
      hasErrors = hasErrors || nestedErrors;
    }
    if (field.types) {
      for (const type of field.types) {
        if (type.fields) {
          const typeErrors = validateActionFields(type.fields, `${fullPath}.types.${type.name}.fields`);
          hasErrors = hasErrors || typeErrors;
        }
      }
    }
  }
  
  return hasErrors;
}

function validateConfig(config, configPath) {
  console.log(`[preflight] Validating: ${configPath}`);
  
  let hasErrors = false;
  
  // Validate backend configuration
  const backendErrors = validateBackendConfig(config, configPath);
  hasErrors = hasErrors || backendErrors;
  
  // Validate media configuration
  const mediaErrors = validateMediaConfig(config, configPath);
  hasErrors = hasErrors || mediaErrors;
  
  // Validate local_backend configuration (for dev configs)
  const localBackendErrors = validateLocalBackendConfig(config, configPath);
  hasErrors = hasErrors || localBackendErrors;
  
  // Validate collections
  for (const collection of config.collections || []) {
    const collectionErrors = validateCollection(collection);
    hasErrors = hasErrors || collectionErrors;
    
    // Validate action fields, skills/education structure, and icon validation in collections
    const files = collection.files || [];
    for (const file of files) {
      if (file.fields) {
        const actionErrors = validateActionFields(file.fields, `collections.${collection.name}.files.${file.name}.fields`);
        hasErrors = hasErrors || actionErrors;
        
        const skillsEducationErrors = validateSkillsEducationStructure(file.fields, `collections.${collection.name}.files.${file.name}.fields`);
        hasErrors = hasErrors || skillsEducationErrors;
        
        const iconErrors = validateIconField(file.fields, `collections.${collection.name}.files.${file.name}.fields`);
        hasErrors = hasErrors || iconErrors;
      }
    }
    
    if (collection.fields) {
      const actionErrors = validateActionFields(collection.fields, `collections.${collection.name}.fields`);
      hasErrors = hasErrors || actionErrors;
      
      const skillsEducationErrors = validateSkillsEducationStructure(collection.fields, `collections.${collection.name}.fields`);
      hasErrors = hasErrors || skillsEducationErrors;
      
      const iconErrors = validateIconField(collection.fields, `collections.${collection.name}.fields`);
      hasErrors = hasErrors || iconErrors;
    }
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