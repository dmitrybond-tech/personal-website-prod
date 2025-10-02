#!/usr/bin/env tsx

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

/**
 * Verification script to check CMS integration
 */
async function verify(): Promise<void> {
  console.log('🔍 Verifying CMS integration...\n');

  const checks = [
    {
      name: 'Admin UI files',
      files: [
        'public/website-admin/index.html',
        'public/website-admin/config.yml',
        'public/website-admin/health.txt'
      ]
    },
    {
      name: 'CMS content files',
      files: [
        'content/pages/about/en.json',
        'content/pages/about/ru.json',
        'content/pages/bookme/en.json',
        'content/pages/bookme/ru.json'
      ]
    },
    {
      name: 'Runtime components',
      files: [
        'src/app/content/lib/cmsLoader.ts',
        'src/app/content/ui/CmsBlocks.astro',
        'src/app/content/ui/CmsBookMeEvents.astro'
      ]
    },
    {
      name: 'Scripts',
      files: [
        'scripts/cms/seed-pages.ts',
        'scripts/cms/rollback.ts'
      ]
    }
  ];

  let allPassed = true;

  for (const check of checks) {
    console.log(`📁 ${check.name}:`);
    
    for (const file of check.files) {
      const filePath = join(process.cwd(), file);
      const exists = existsSync(filePath);
      
      if (exists) {
        console.log(`  ✅ ${file}`);
        
        // Additional validation for JSON files
        if (file.endsWith('.json')) {
          try {
            const content = readFileSync(filePath, 'utf8');
            JSON.parse(content);
            console.log(`    📄 Valid JSON structure`);
          } catch (e) {
            console.log(`    ❌ Invalid JSON: ${e}`);
            allPassed = false;
          }
        }
      } else {
        console.log(`  ❌ ${file} - MISSING`);
        allPassed = false;
      }
    }
    console.log('');
  }

  // Check package.json for new scripts
  console.log('📦 Package.json scripts:');
  try {
    const packageJson = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8'));
    const scripts = packageJson.scripts || {};
    
    if (scripts['cms:proxy']) {
      console.log('  ✅ cms:proxy script exists');
    } else {
      console.log('  ❌ cms:proxy script missing');
      allPassed = false;
    }
    
    if (scripts['cms:dev']) {
      console.log('  ✅ cms:dev script exists');
    } else {
      console.log('  ❌ cms:dev script missing');
      allPassed = false;
    }
  } catch (e) {
    console.log('  ❌ Failed to read package.json');
    allPassed = false;
  }

  console.log('\n' + '='.repeat(50));
  
  if (allPassed) {
    console.log('✅ All checks passed! CMS integration is ready.');
    console.log('\nNext steps:');
    console.log('1. Run: npm run cms:dev');
    console.log('2. Open: http://localhost:4321/website-admin/');
    console.log('3. Test editing content in the CMS');
    console.log('4. Verify pages show CMS content when available');
  } else {
    console.log('❌ Some checks failed. Please review the issues above.');
  }
}

// Run verification
verify().catch(console.error);
