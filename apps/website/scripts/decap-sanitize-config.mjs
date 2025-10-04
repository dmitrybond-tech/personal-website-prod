#!/usr/bin/env node

import { fileURLToPath } from 'node:url';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import jsyaml from 'js-yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Candidates to sanitize, in this order:
const CANDIDATES = [
  path.resolve(__dirname, '../public/website-admin/config.generated.yml'),
  path.resolve(__dirname, '../public/website-admin/config.yml')
];

// MD files to check for skills key determination
const MD_CANDIDATES = [
  path.resolve(__dirname, '../src/content/aboutPage/en/about-expanded.md'),
  path.resolve(__dirname, '../src/content/aboutPage/ru/about-expanded.md')
];

function determineMDListKey() {
  let skillsCount = 0;
  let itemsCount = 0;
  
  for (const mdPath of MD_CANDIDATES) {
    if (!existsSync(mdPath)) continue;
    
    try {
      const content = readFileSync(mdPath, 'utf8');
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
      if (!frontmatterMatch) continue;
      
      const frontmatter = frontmatterMatch[1];
      
      // Look for skills sections with categories
      const skillsSections = frontmatter.match(/type:\s*skills[\s\S]*?categories:[\s\S]*?(?=type:|$)/g) || [];
      
      for (const section of skillsSections) {
        // Count occurrences of "skills:" vs "items:"
        const skillsMatches = (section.match(/skills:/g) || []).length;
        const itemsMatches = (section.match(/items:/g) || []).length;
        
        skillsCount += skillsMatches;
        itemsCount += itemsMatches;
      }
    } catch (error) {
      console.warn(`[sanitize] Warning: Could not parse ${mdPath}:`, error.message);
    }
  }
  
  // Return majority, default to "skills" if equal
  if (itemsCount > skillsCount) return 'items';
  return 'skills';
}

function createSkillsSchema(mdListKey) {
  return {
    label: "Skills",
    name: "skills",
    widget: "object",
    fields: [
      {
        label: "Categories",
        name: "categories",
        widget: "list",
        fields: [
          { label: "Title", name: "title", widget: "string" },
          {
            label: "Skills",
            name: mdListKey, // "skills" or "items"
            widget: "list",
            fields: [
              { label: "Name", name: "name", widget: "string" },
              { 
                label: "Level", 
                name: "level", 
                widget: "select", 
                options: ["beginner", "intermediate", "advanced", "expert"] 
              },
              { label: "Icon", name: "icon", widget: "string", required: false },
              { label: "Color", name: "color", widget: "string", required: false },
              { label: "Description", name: "description", widget: "text", required: false }
            ]
          }
        ]
      }
    ]
  };
}

function createSkillsSchemaRU(mdListKey) {
  return {
    label: "Навыки",
    name: "skills",
    widget: "object",
    fields: [
      {
        label: "Категории",
        name: "categories",
        widget: "list",
        fields: [
          { label: "Заголовок", name: "title", widget: "string" },
          {
            label: "Навыки",
            name: mdListKey, // "skills" or "items"
            widget: "list",
            fields: [
              { label: "Название", name: "name", widget: "string" },
              { 
                label: "Уровень", 
                name: "level", 
                widget: "select", 
                options: ["beginner", "intermediate", "advanced", "expert"] 
              },
              { label: "Иконка", name: "icon", widget: "string", required: false },
              { label: "Цвет", name: "color", widget: "string", required: false },
              { label: "Описание", name: "description", widget: "text", required: false }
            ]
          }
        ]
      }
    ]
  };
}

function sanitizeSkillsInCollection(collection, mdListKey, isRU = false) {
  if (!collection.files && !collection.folder) return collection;
  
  const files = collection.files || [];
  const newFiles = files.map(file => {
    if (!file.fields) return file;
    
    const newFields = file.fields.map(field => {
      if (field.name === 'sections' && field.widget === 'list' && field.types) {
        const newTypes = field.types.map(type => {
          if (type.name === 'skills') {
            // Replace the entire skills type with canonicalized version
            return isRU ? createSkillsSchemaRU(mdListKey) : createSkillsSchema(mdListKey);
          }
          return type;
        });
        
        return { ...field, types: newTypes };
      }
      return field;
    });
    
    return { ...file, fields: newFields };
  });
  
  return { ...collection, files: newFiles };
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
  console.log(`[sanitize] Sanitizing config with MD_LIST_KEY: "${mdListKey}"`);
  
  // Validate collections
  for (const collection of config.collections || []) {
    validateCollection(collection);
    
    // Sanitize skills in about collections
    if (collection.name === 'about_en' || collection.name === 'about_ru') {
      const isRU = collection.name === 'about_ru';
      const sanitized = sanitizeSkillsInCollection(collection, mdListKey, isRU);
      Object.assign(collection, sanitized);
    }
    
    // Dedupe fields in all collections
    const files = collection.files || [];
    for (const file of files) {
      if (file.fields) {
        file.fields = dedupeFields(file.fields, `collections.${collection.name}.files.${file.name}.fields`);
      }
    }
    
    // Also dedupe folder collections
    if (collection.fields) {
      collection.fields = dedupeFields(collection.fields, `collections.${collection.name}.fields`);
    }
  }
  
  return config;
}

async function main() {
  console.log('[sanitize] Starting Decap config sanitization...');
  
  // Determine MD_LIST_KEY
  const mdListKey = determineMDListKey();
  console.log(`[sanitize] Determined MD_LIST_KEY: "${mdListKey}"`);
  
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
      const sanitized = sanitizeConfig(config, mdListKey);
      
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