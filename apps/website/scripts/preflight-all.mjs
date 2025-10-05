#!/usr/bin/env node

/**
 * Comprehensive preflight script that runs all validations
 */

import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

function runScript(scriptName) {
  return new Promise((resolve, reject) => {
    console.log(`\n🚀 Running ${scriptName}...`);
    
    const child = spawn('npm', ['run', scriptName], {
      cwd: projectRoot,
      stdio: 'inherit',
      shell: true
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${scriptName} passed`);
        resolve();
      } else {
        console.log(`❌ ${scriptName} failed with code ${code}`);
        reject(new Error(`${scriptName} failed`));
      }
    });
    
    child.on('error', (error) => {
      console.error(`❌ Error running ${scriptName}:`, error.message);
      reject(error);
    });
  });
}

async function main() {
  console.log('🚀 Running comprehensive preflight validation...');
  
  const scripts = [
    'preflight:sections',
    'preflight:icons', 
    'preflight:media'
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const script of scripts) {
    try {
      await runScript(script);
      passed++;
    } catch (error) {
      failed++;
      console.error(`\n❌ ${script} failed:`, error.message);
    }
  }
  
  console.log(`\n📊 Preflight Summary:`);
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  
  if (failed === 0) {
    console.log('\n🎉 All preflight checks passed!');
    process.exit(0);
  } else {
    console.log('\n💥 Some preflight checks failed!');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('💥 Preflight script error:', error.message);
  process.exit(1);
});
