#!/usr/bin/env node
/**
 * fetch-decap.mjs
 * Downloads and vendors Decap CMS script locally to avoid CDN dependency
 * Pin version 3.9.0 for deterministic builds
 */

import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DECAP_VERSION = '3.8.4';
// Try multiple CDN sources for reliability
const CDN_SOURCES = [
  `https://cdn.jsdelivr.net/npm/decap-cms@${DECAP_VERSION}/dist/decap-cms.js`,
  `https://unpkg.com/decap-cms@${DECAP_VERSION}/dist/decap-cms.js`,
  `https://unpkg.com/decap-cms@${DECAP_VERSION}/dist/decap-cms.min.js`
];
const OUTPUT_PATH = join(__dirname, '..', 'apps', 'website', 'public', 'website-admin', `decap-cms-${DECAP_VERSION}.min.js`);
const MIN_SIZE = 300 * 1024; // 300KB minimum

async function fetchDecap() {
  console.log(`📦 Fetching Decap CMS v${DECAP_VERSION}...`);
  
  let lastError = null;
  
  // Try each CDN source until one works
  for (const url of CDN_SOURCES) {
    try {
      console.log(`   Trying: ${url}`);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const content = await response.text();
      const size = Buffer.byteLength(content, 'utf8');
      
      console.log(`   Size: ${(size / 1024).toFixed(1)} KB`);
      
      if (size < MIN_SIZE) {
        throw new Error(`Downloaded file too small (${size} bytes < ${MIN_SIZE} bytes). Possible CDN error.`);
      }
      
      // Ensure output directory exists
      await mkdir(dirname(OUTPUT_PATH), { recursive: true });
      
      // Write file
      await writeFile(OUTPUT_PATH, content, 'utf8');
      
      console.log(`   ✓ Saved to: ${OUTPUT_PATH}`);
      console.log('✅ Decap CMS vendored successfully');
      return;
      
    } catch (error) {
      lastError = error;
      console.log(`   ✗ Failed: ${error.message}`);
      continue;
    }
  }
  
  // If we got here, all CDN sources failed
  console.error('❌ Failed to fetch Decap CMS from any CDN source:');
  console.error(`   Last error: ${lastError.message}`);
  process.exit(1);
}

fetchDecap();

