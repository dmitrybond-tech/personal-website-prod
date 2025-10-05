#!/usr/bin/env node

import { fileURLToPath } from 'node:url';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import jsyaml from 'js-yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Fields that should be optional (soft fields)
const OPTIONAL_FIELD_NAMES = new Set([
  "action", "label", "url", "downloadedFileName", "image", "icon", "color",
  "subtitle", "author", "year", "timeframe", "variant", "cols", "base", "sm", "lg",
  "limit", "tags", "links", "notes", "bullets", "technologies", "description",
  "location", "logo", "website", "degree", "period", "tech", "bullet", "faculty",
  "program", "institution", "cta_text", "cta_kind", "cal_preset", "href", "visible",
  "footer_note", "page_title", "page_subtitle", "eventType", "attrs", "hideEventTypeDetails",
  "defaultTileSlug", "caption", "slug", "typeKey", "value", "name", "title", "level",
  "visible", "fullName", "role", "bio", "contact", "email", "phone", "avatar"
]);

// Fields that should remain required (hard fields) - only core document structure
// NOTE: Removed most fields to make everything optional as per requirements
const REQUIRED_FIELD_NAMES = new Set([
  // Only keep absolutely essential infrastructure fields if any
]);

// Candidates to sanitize, in this order:
const CANDIDATES = [
  path.resolve(__dirname, '../public/website-admin/config.yml'),
  path.resolve(__dirname, '../public/website-admin/config.generated.yml'),
  path.resolve(__dirname, '../public/website-admin/config.dev.yml'),
  path.resolve(__dirname, '../public/website-admin/config.prod.yml')
];

// No longer need MD file analysis since we're not doing schema rebuilding

// Icon validation function for skills.data.groups[].items[].icon
function addIconValidation(field) {
  if (field.name === 'icon' && field.widget === 'string') {
    return {
      ...field,
      required: false,
      hint: "Iconify token (e.g., simple-icons:aws) or /logos/foo.svg",
      pattern: [
        "^(?:[a-z0-9-]+:[a-z0-9-]+|/[^\\s]+\\.(?:svg|png|jpg|jpeg))$",
        "Use Iconify token like set:name or a valid /logos/*.svg|png path"
      ]
    };
  }
  return field;
}

function makeFieldsOptional(field) {
  const newField = { ...field };
  newField.required = false;
  
  if (newField.fields) {
    newField.fields = newField.fields.map(subField => makeFieldsOptional(subField));
  }
  
  return newField;
}

// No longer doing schema rebuilding - just adding icon validation
function addIconValidationToFields(fields, path = '') {
  return fields.map(field => {
    const newField = addIconValidation(field);
    
    // Recursively process nested fields
    if (newField.fields) {
      newField.fields = addIconValidationToFields(newField.fields, `${path}.${field.name}.fields`);
    }
    if (newField.types) {
      newField.types = newField.types.map(type => {
        if (type.fields) {
          type.fields = addIconValidationToFields(type.fields, `${path}.${field.name}.types.${type.name}.fields`);
        }
        return type;
      });
    }
    
    return newField;
  });
}

function optionalizeFields(fields, path = '') {
  const result = [];
  
  for (const field of fields) {
    const key = field.name;
    const fullPath = path ? `${path}.${key}` : key;
    
    // Make a copy of the field
    const newField = { ...field };
    
    // Handle action objects specially
    if (key === 'action' && newField.widget === 'object') {
      newField.required = false;
      newField.collapsed = true;
      if (newField.fields) {
        newField.fields = newField.fields.map(subField => {
          const newSubField = { ...subField };
          newSubField.required = false;
          if (newSubField.widget === 'string') {
            newSubField.default = "";
          }
          return newSubField;
        });
      }
      console.log(`[sanitize] Optionalized action object at ${fullPath}`);
    }
    // Handle style objects
    else if (key === 'style' && newField.widget === 'object') {
      newField.required = false;
      newField.collapsed = true;
      if (newField.fields) {
        newField.fields = optionalizeFields(newField.fields, `${fullPath}.fields`);
      }
    }
    // Handle optional field names
    else if (OPTIONAL_FIELD_NAMES.has(key) && !REQUIRED_FIELD_NAMES.has(key)) {
      newField.required = false;
      if (newField.widget === 'string') {
        newField.default = "";
      }
      console.log(`[sanitize] Made field optional: ${fullPath}`);
    }
    
    // Recursively process nested fields
    if (newField.fields) {
      newField.fields = optionalizeFields(newField.fields, `${fullPath}.fields`);
    }
    if (newField.types) {
      newField.types = newField.types.map(type => {
        if (type.fields) {
          type.fields = optionalizeFields(type.fields, `${fullPath}.types.${type.name}.fields`);
        }
        return type;
      });
    }
    
    result.push(newField);
  }
  
  return result;
}

function dedupeFields(fields, path = '') {
  const seen = new Map();
  const result = [];
  
  for (const field of fields) {
    const key = field.name;
    if (seen.has(key)) {
      const existing = seen.get(key);
      
      // Check if they're exact clones
      const isClone = JSON.stringify(existing) === JSON.stringify(field);
      
      if (isClone) {
        console.warn(`[sanitize] Removing duplicate field "${key}" at ${path} (exact clone)`);
        continue;
      } else {
        console.error(`[sanitize] FAIL: Non-clone duplicate field "${key}" at ${path}`);
        console.error(`[sanitize] Existing:`, JSON.stringify(existing, null, 2));
        console.error(`[sanitize] Duplicate:`, JSON.stringify(field, null, 2));
        process.exit(1);
      }
    }
    
    seen.set(key, field);
    
    // Recursively process nested fields
    if (field.fields) {
      field.fields = dedupeFields(field.fields, `${path}.${key}.fields`);
    }
    if (field.types) {
      field.types = field.types.map(type => {
        if (type.fields) {
          type.fields = dedupeFields(type.fields, `${path}.${key}.types.${type.name}.fields`);
        }
        return type;
      });
    }
    
    result.push(field);
  }
  
  return result;
}

function validateCollection(collection) {
  const hasFiles = !!collection.files;
  const hasFolder = !!collection.folder;
  
  if (!hasFiles && !hasFolder) {
    console.error(`[sanitize] FAIL: Collection "${collection.name}" has neither files nor folder`);
    process.exit(1);
  }
  
  if (hasFiles && hasFolder) {
    console.error(`[sanitize] FAIL: Collection "${collection.name}" has both files and folder`);
    process.exit(1);
  }
  
  if (collection.type === 'files') {
    console.error(`[sanitize] FAIL: Collection "${collection.name}" has forbidden type: files`);
    process.exit(1);
  }
}

function sanitizeConfig(config, mdListKey) {
  console.log(`[sanitize] Sanitizing config (no schema rewrites, only optionalize + icon validation)`);
  
  // Remove erroneous media_library blocks
  if (config.media_library && config.media_library.name === 'git') {
    console.log(`[sanitize] Removing erroneous media_library block with name: git`);
    delete config.media_library;
  }
  
  // Normalize paths (convert backslashes to forward slashes)
  if (config.media_folder) {
    config.media_folder = config.media_folder.replace(/\\/g, '/');
  }
  
  // Validate collections
  for (const collection of config.collections || []) {
    validateCollection(collection);
    
    // Optionalize, add icon validation, and dedupe fields in all collections
    const files = collection.files || [];
    for (const file of files) {
      if (file.fields) {
        file.fields = optionalizeFields(file.fields, `collections.${collection.name}.files.${file.name}.fields`);
        file.fields = addIconValidationToFields(file.fields, `collections.${collection.name}.files.${file.name}.fields`);
        file.fields = dedupeFields(file.fields, `collections.${collection.name}.files.${file.name}.fields`);
      }
    }
    
    // Also optionalize, add icon validation, and dedupe folder collections
    if (collection.fields) {
      collection.fields = optionalizeFields(collection.fields, `collections.${collection.name}.fields`);
      collection.fields = addIconValidationToFields(collection.fields, `collections.${collection.name}.fields`);
      collection.fields = dedupeFields(collection.fields, `collections.${collection.name}.fields`);
    }
  }
  
  return config;
}

async function main() {
  console.log('[sanitize] Starting Decap config sanitization (no schema rewrites)...');
  
  let sanitizedCount = 0;
  
  for (const configPath of CANDIDATES) {
    if (!existsSync(configPath)) {
      console.log(`[sanitize] Skipping non-existent: ${configPath}`);
      continue;
    }
    
    console.log(`[sanitize] Processing: ${configPath}`);
    
    try {
      // Create backup
      const backupPath = configPath + '.bak';
      const content = readFileSync(configPath, 'utf8');
      writeFileSync(backupPath, content, 'utf8');
      console.log(`[sanitize] Created backup: ${backupPath}`);
      
      // Parse and sanitize
      const config = jsyaml.load(content);
      const sanitized = sanitizeConfig(config, null); // No longer using mdListKey
      
      // Write back
      const yamlOutput = jsyaml.dump(sanitized, { 
        lineWidth: -1,
        noRefs: true,
        sortKeys: false
      });
      writeFileSync(configPath, yamlOutput, 'utf8');
      
      console.log(`[sanitize] ✓ Sanitized: ${configPath}`);
      sanitizedCount++;
      
    } catch (error) {
      console.error(`[sanitize] ✗ Failed to process ${configPath}:`, error.message);
      process.exit(1);
    }
  }
  
  console.log(`[sanitize] Complete! Sanitized ${sanitizedCount} config files.`);
}

main().catch(error => {
  console.error('[sanitize] Fatal error:', error);
  process.exit(1);
});