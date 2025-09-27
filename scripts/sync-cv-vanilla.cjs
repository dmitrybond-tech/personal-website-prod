// копируем dist devscard_vanilla в website/public/cv_vanilla
const fs = require('fs');
const path = require('path');
const fsp = fs.promises;

const src = path.resolve(__dirname, '..', 'apps', 'CV', 'devscard_vanilla', 'dist');
const dest = path.resolve(__dirname, '..', 'apps', 'website', 'public', 'cv_vanilla');

async function rimraf(p) {
  if (fs.existsSync(p)) {
    await fsp.rm(p, { recursive: true, force: true });
  }
}

async function copyDir(from, to) {
  await fsp.mkdir(to, { recursive: true });
  const entries = await fsp.readdir(from, { withFileTypes: true });
  for (const e of entries) {
    const s = path.join(from, e.name);
    const d = path.join(to, e.name);
    if (e.isDirectory()) await copyDir(s, d);
    else await fsp.copyFile(s, d);
  }
}

(async () => {
  if (!fs.existsSync(src)) {
    console.error('[cv:vanilla:sync] build сначала: dist не найден', src);
    process.exit(1);
  }
  
  // Подчищаем и копируем заново
  await rimraf(dest);
  await copyDir(src, dest);
  console.log('[cv:vanilla:sync] synced to', dest);

  // Выводим список ключевых файлов
  const cvIndex = path.join(dest, 'index.html');
  if (fs.existsSync(cvIndex)) {
    console.log('[cv:vanilla:sync] ✓ cv_vanilla/index.html');
  }
  
  const astroDir = path.join(dest, '_astro');
  if (fs.existsSync(astroDir)) {
    const astroFiles = await fsp.readdir(astroDir);
    const firstThree = astroFiles.slice(0, 3);
    console.log('[cv:vanilla:sync] ✓ cv_vanilla/_astro:', firstThree.join(', '));
  }
})().catch((e) => { console.error(e); process.exit(1); });
