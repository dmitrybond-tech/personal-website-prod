// apps/website/scripts/fm-education-fix.mjs
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs/promises';
import matter from 'gray-matter';
import yaml from 'yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = path.resolve(__dirname, '../public/website-admin/config.generated.yml');
const FILES = [
  path.resolve(__dirname, '../src/content/aboutPage/en/about-expanded.md'),
  path.resolve(__dirname, '../src/content/aboutPage/ru/about-expanded.md'),
];

function pickEduListKeyFromConfig(confYaml) {
  const cfg = yaml.parse(confYaml);
  const colls = cfg?.collections || [];
  for (const c of colls) {
    const files = Array.isArray(c?.files) ? c.files : [];
    for (const f of files) {
      const fields = f?.fields || [];
      const sections = fields.find(x => x?.name === 'sections' && (x?.types || x?.typeKey));
      if (!sections?.types) continue;
      const edu = sections.types.find(t => t?.name === 'education' && Array.isArray(t?.fields));
      if (!edu) continue;
      // ищем первый list-поле в education
      const listField = edu.fields.find(fl => fl?.widget === 'list' && fl?.name);
      if (listField?.name) return listField.name;
    }
  }
  return 'items'; // fallback
}

function toArray(x) { return Array.isArray(x) ? x : (x == null ? [] : [x]); }
function isPlainObj(v){ return v && typeof v === 'object' && !Array.isArray(v); }

function normalizeEducationSection(sec, listKey) {
  const knownTop = new Set(['school','location','url','logo','degrees','extra']);
  const knownDegree = new Set(['degree','program','faculty','period','bullets','extra']);

  // найдём фактический ключ списка (items|educationItems|другой)
  const presentKeys = Object.keys(sec).filter(k => k !== 'type');
  const listCandidate = presentKeys.find(k => Array.isArray(sec[k]));
  const hasCorrectKey = listCandidate === listKey;

  // переназовём, если нужно
  if (listCandidate && listCandidate !== listKey) {
    sec[listKey] = sec[listCandidate];
    delete sec[listCandidate];
  } else if (!listCandidate) {
    // пустая секция — ничего не делаем
    sec[listKey] = toArray(sec[listKey]);
  }

  const list = sec[listKey] = toArray(sec[listKey]);

  for (const item of list) {
    if (!isPlainObj(item)) continue;
    // сбор лишних верхнеуровневых полей
    const topExtra = {};
    for (const k of Object.keys(item)) {
      if (!knownTop.has(k)) topExtra[k] = item[k];
    }
    // degrees нормализация
    if (!Array.isArray(item.degrees)) {
      // соберём возможную "плоскую" степень
      const deg = {};
      for (const key of ['degree','program','faculty','period','bullets']) {
        if (item[key] != null) deg[key] = item[key];
      }
      if (Object.keys(deg).length) item.degrees = [deg];
      else item.degrees = [];
      // удалим плоские ключи, они теперь в degrees[0]
      for (const key of ['degree','program','faculty','period','bullets']) delete item[key];
    }
    // degrees → массив объектов
    item.degrees = toArray(item.degrees).map(d => {
      const out = {};
      if (isPlainObj(d)) {
        for (const k of Object.keys(d)) {
          if (k === 'bullets') {
            out.bullets = toArray(d.bullets).map(x => String(x));
          } else if (knownDegree.has(k)) {
            out[k] = d[k];
          } else {
            out.extra ??= {};
            out.extra[k] = d[k];
          }
        }
      } else {
        out.bullets = [String(d)];
      }
      return out;
    });

    // прикрепим extra, если есть что сохранить
    if (Object.keys(topExtra).length) {
      item.extra = { ...(item.extra || {}), ...topExtra };
      // удалим с верхнего уровня всё, что переехало в extra
      for (const k of Object.keys(topExtra)) delete item[k];
    }

    // гарантируем порядок ключей (по красоте)
    const ordered = {};
    for (const k of ['school','location','url','logo','degrees','extra']) {
      if (item[k] != null) ordered[k] = item[k];
    }
    Object.assign(item, ordered);
  }

  return sec;
}

async function processFile(fp, listKey) {
  const raw = await fs.readFile(fp, 'utf8');
  const fm = matter(raw);
  const sections = Array.isArray(fm.data.sections) ? fm.data.sections : [];

  let changed = false;
  const changedSections = [];
  
  sections.forEach((sec, idx) => {
    if (sec?.type === 'education') {
      const before = yaml.stringify(sec);
      normalizeEducationSection(sec, listKey);
      const after = yaml.stringify(sec);
      if (before !== after) {
        changed = true;
        changedSections.push(idx);
      }
    }
  });

  if (!changed) return { fp, changed: false, changedSections: [] };

  // бэкап
  await fs.writeFile(fp + '.bak', raw, 'utf8');

  // сохраняем c тем же body
  const newContent = matter.stringify({ ...fm, data: { ...fm.data, sections } }, { lineWidth: 0 });
  await fs.writeFile(fp, newContent, 'utf8');

  return { fp, changed: true, changedSections };
}

async function main() {
  console.log('🔧 Education fixer');
  const conf = await fs.readFile(CONFIG_PATH, 'utf8').catch(()=>null);
  let listKey = 'items';
  if (conf) listKey = pickEduListKeyFromConfig(conf) || 'items';
  console.log('→ EDU_LIST_KEY:', JSON.stringify(listKey));

  for (const fp of FILES) {
    try {
      const res = await processFile(fp, listKey);
      if (res.changed) {
        console.log(`✓ fixed ${fp}`);
        console.log(`  Changed sections: [${res.changedSections.join(', ')}]`);
      } else {
        console.log(`• no changes ${fp}`);
      }
    } catch (e) {
      console.error(`✗ failed ${fp}:`, e.message);
      process.exitCode = 1;
    }
  }

  // optional post-checks
  try {
    const { exec } = await import('node:child_process');
    const run = (cmd) => new Promise((resolve) => exec(cmd, { cwd: path.resolve(__dirname, '../../..') }, (_, stdout, stderr) => {
      process.stdout.write(stdout);
      process.stderr.write(stderr);
      resolve();
    }));
    await run('npm run cms:sanitize');
    await run('npm run cms:inspect');
    await run('npm run cms:preflight');
  } catch {
    console.log('ℹ️ Skipped cms:* checks (scripts may be absent).');
  }
}
main();
