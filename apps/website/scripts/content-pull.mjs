import { execSync } from 'node:child_process';

function sh(cmd) { 
  console.log('[pull]', cmd); 
  execSync(cmd, { stdio: 'inherit' }); 
}

try {
  sh('git fetch origin');
  sh('git rebase origin/main');
  console.log('[pull] done.');
  process.exit(0);
} catch (e) {
  console.error('[pull] failed:', e?.message || e);
  process.exit(1);
}
