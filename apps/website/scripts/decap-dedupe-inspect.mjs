// node apps/website/scripts/decap-dedupe-inspect.mjs
import fs from 'node:fs/promises'
import path from 'node:path'
import yaml from 'yaml'

const __dirname = path.dirname(new URL(import.meta.url).pathname.replace(/^\/[A-Z]:/, ''))
const CONFIG = path.resolve(__dirname, '../public/website-admin/config.generated.yml')
const text = await fs.readFile(CONFIG, 'utf8')
const cfg = yaml.parse(text)
const errs = []

function scanFields(node, trail) {
  if (!node || typeof node !== 'object') return
  // list of fields on this level
  if (Array.isArray(node.fields)) {
    const seen = new Map()
    node.fields.forEach((f, i) => {
      const nm = f?.name
      if (nm) {
        const arr = seen.get(nm) || []
        arr.push(i)
        seen.set(nm, arr)
      }
    })
    for (const [nm, idxs] of seen.entries()) {
      if (idxs.length > 1) errs.push(`${trail}.fields -> duplicate "name: ${nm}" at indexes [${idxs.join(', ')}]`)
    }
    node.fields.forEach((f, i) => {
      scanFields(f, `${trail}.fields[${i}]`)
      if (f?.field) scanFields({ fields:[f.field] }, `${trail}.fields[${i}].field`)
    })
  }
  // scan common nested objects
  for (const k of Object.keys(node)) {
    if (k !== 'fields' && typeof node[k] === 'object') scanFields(node[k], `${trail}.${k}`)
  }
}

(cfg.collections || []).forEach((col, ci) => {
  if (Array.isArray(col.files)) {
    col.files.forEach((file, fi) => {
      if (Array.isArray(file.fields)) {
        file.fields.forEach((fld, i) => scanFields(fld, `collections[${ci}].files[${fi}].fields[${i}]`))
      }
    })
  }
})
if (errs.length) {
  console.error('[dedupe-inspect] duplicates found:')
  errs.forEach(e => console.error(' -', e))
  process.exit(1)
}
console.log('[dedupe-inspect] no duplicates ✓')
