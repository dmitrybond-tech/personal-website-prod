// node apps/website/scripts/decap-config-preflight.mjs
import fs from 'node:fs/promises'
import path from 'node:path'
import yaml from 'yaml'

const __dirname = path.dirname(new URL(import.meta.url).pathname.replace(/^\/[A-Z]:/, ''))
const CONFIG = path.resolve(__dirname, '../public/website-admin/config.generated.yml')
const text = await fs.readFile(CONFIG, 'utf8')
const cfg = yaml.parse(text)

const errors = []
const warns = []

function uniqNames(fields, pathStr) {
  if (!Array.isArray(fields)) return
  const seen = new Set()
  for (const f of fields) {
    if (!f || typeof f !== 'object') continue
    const n = f.name
    if (n) {
      const key = String(n)
      if (seen.has(key)) errors.push(`${pathStr}: duplicate field name "${key}"`)
      seen.add(key)
    }
    // recurse into nested fields/field
    if (Array.isArray(f.fields)) uniqNames(f.fields, `${pathStr}.${n || '?'}`)
    if (f.field && f.field.name) {
      // single-field list
      // nothing to dedupe here, but verify nested object
    }
  }
}

(cfg.collections || []).forEach((c, i) => {
  const base = `collections[${i}]`
  const hasFiles = 'files' in c
  const hasFolder = 'folder' in c
  if (hasFiles === hasFolder) {
    errors.push(`${base}: must have exactly one of "files" or "folder"`)
  }
  if (c.type === 'files') warns.push(`${base}: found "type: files" (should be "files:" list)`)
  const files = Array.isArray(c.files) ? c.files : []
  files.forEach((f, j) => {
    const fbase = `${base}.files[${j}]`
    if (!Array.isArray(f.fields)) errors.push(`${fbase}: missing "fields"`)
    uniqNames(f.fields, `${fbase}.fields`)
  })
})

if (warns.length) {
  console.warn('[preflight:warnings]')
  for (const w of warns) console.warn(' -', w)
}
if (errors.length) {
  console.error('[preflight:errors]')
  for (const e of errors) console.error(' -', e)
  process.exit(1)
}
console.log('Decap config OK ✓')
