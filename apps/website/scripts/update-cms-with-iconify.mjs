#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import jsyaml from 'js-yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load iconify icons configuration
const iconsConfigPath = path.resolve(__dirname, '../public/website-admin/iconify-icons-config.yml');
const iconsConfig = jsyaml.load(readFileSync(iconsConfigPath, 'utf8'));

// Extract icon options
const iconOptions = iconsConfig.iconify_icons;

// Function to update config file with iconify icons
function updateConfigWithIconify(configPath) {
  console.log(`[iconify] Updating ${configPath}...`);
  
  const content = readFileSync(configPath, 'utf8');
  const config = jsyaml.load(content);
  
  // Update skills section icon field
  for (const collection of config.collections || []) {
    if (collection.name === 'about_en' || collection.name === 'about_ru') {
      const files = collection.files || [];
      for (const file of files) {
        if (file.fields) {
          for (const field of file.fields) {
            if (field.name === 'sections' && field.widget === 'list' && field.types) {
              for (const type of field.types) {
                if (type.name === 'skills') {
                  // Find the icon field in skills items
                  const dataField = type.fields?.find(f => f.name === 'data');
                  if (dataField) {
                    const groupsField = dataField.fields?.find(f => f.name === 'groups');
                    if (groupsField) {
                      const itemsField = groupsField.fields?.find(f => f.name === 'items');
                      if (itemsField) {
                        const iconField = itemsField.fields?.find(f => f.name === 'icon');
                        if (iconField) {
                          // Update icon field to use select widget with iconify options
                          iconField.widget = 'select';
                          iconField.options = iconOptions;
                          iconField.hint = 'Choose an icon from the Iconify library';
                          console.log(`[iconify] Updated icon field in ${collection.name}`);
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  
  // Write back the updated config
  const yamlOutput = jsyaml.dump(config, { 
    lineWidth: -1,
    noRefs: true,
    sortKeys: false
  });
  writeFileSync(configPath, yamlOutput, 'utf8');
  console.log(`[iconify] ✓ Updated ${configPath}`);
}

// Update both config files
const configFiles = [
  path.resolve(__dirname, '../public/website-admin/config.dev.yml'),
  path.resolve(__dirname, '../public/website-admin/config.prod.yml')
];

for (const configFile of configFiles) {
  try {
    updateConfigWithIconify(configFile);
  } catch (error) {
    console.error(`[iconify] ✗ Failed to update ${configFile}:`, error.message);
  }
}

console.log('[iconify] Complete! CMS configuration updated with Iconify icons.');
