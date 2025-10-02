#!/usr/bin/env tsx

import { rmSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * Rollback script to disable CMS integration
 * This removes the CMS JSON files and allows pages to fall back to existing components
 */
async function rollback(): Promise<void> {
  console.log('🔄 Rolling back CMS integration...\n');

  const cmsPaths = [
    join(process.cwd(), 'content', 'pages', 'about'),
    join(process.cwd(), 'content', 'pages', 'bookme'),
    join(process.cwd(), 'public', 'website-admin')
  ];

  for (const path of cmsPaths) {
    if (existsSync(path)) {
      rmSync(path, { recursive: true, force: true });
      console.log(`✓ Removed: ${path}`);
    }
  }

  console.log('\n✅ CMS rollback completed!');
  console.log('\nWhat was removed:');
  console.log('- CMS JSON files in content/pages/');
  console.log('- Admin UI at public/website-admin/');
  console.log('\nPages will now fall back to existing components:');
  console.log('- About pages will use AboutShell component');
  console.log('- BookMe pages will use existing CAL_EVENT_TYPES');
  console.log('\nTo re-enable CMS:');
  console.log('1. Run: npx tsx scripts/cms/seed-pages.ts');
  console.log('2. Restore public/website-admin/ from git');
  console.log('3. Run: npm run cms:dev');
}

// Run the rollback script
rollback().catch(console.error);
