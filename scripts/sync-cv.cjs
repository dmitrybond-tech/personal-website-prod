const fs = require('fs');
const fsp = fs.promises;
const path = require('path');

const lang = process.argv[2]; // 'en' | 'ru'
if (!['en','ru'].includes(lang)) {
  console.error('[sync-cv] usage: node scripts/sync-cv.cjs <en|ru>');
  process.exit(1);
}

const appDir = path.resolve(__dirname, '..', 'apps', 'CV', `devscard_${lang}`);
const src = path.join(appDir, 'dist');
const dest = path.resolve(__dirname, '..', 'apps', 'website', 'public', `cv_${lang}`);

async function rimraf(p){ if (fs.existsSync(p)) await fsp.rm(p, {recursive:true, force:true}); }
async function copyDir(from,to){
  await fsp.mkdir(to, {recursive:true});
  const items = await fsp.readdir(from, {withFileTypes:true});
  for(const it of items){
    const s = path.join(from, it.name);
    const d = path.join(to, it.name);
    if (it.isDirectory()) await copyDir(s,d); else await fsp.copyFile(s,d);
  }
}

(async () => {
  if (!fs.existsSync(src)) { console.error('[sync-cv] dist missing:', src); process.exit(1); }
  await rimraf(dest);
  await copyDir(src, dest);
  const astroDir = path.join(dest, '_astro');
  const first = fs.existsSync(astroDir) ? (await fsp.readdir(astroDir)).slice(0,3) : [];
  console.log(`[sync-cv] ${lang} → ${dest}`);
  console.log('[sync-cv] preview _astro:', first);
})();
