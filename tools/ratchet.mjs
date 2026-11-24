// Quality ratchet (C11/C12 + guards for C1, C3, C8, C10): every debt metric may only fall.
// Usage: node tools/ratchet.mjs [--update]   (--update records lower counts; it refuses to record a rise)
import fs from 'node:fs'
import path from 'node:path'
import { checkBundleBudgets } from './bundle-budget.mjs'
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]))
const files = walk('src').filter((f) => /\.(ts|vue|scss|css)$/.test(f)).map((f) => ({ rel: f.split(path.sep).join('/'), text: fs.readFileSync(f, 'utf8') }))
const count = (re, pick = () => true) => files.filter(pick).reduce((n, f) => n + (f.text.match(re) || []).length, 0)
const code = (f) => /\.(ts|vue)$/.test(f.rel)
const metrics = {
  // app.scss and its in-place partials (Build 267) count as one stylesheet.
  importantAppScss: count(/!important/g, (f) => /^src\/css\/(app|_app-\d+)\.scss$/.test(f.rel)),
  importantDarkContrast: count(/!important/g, (f) => f.rel === 'src/css/dark-contrast.scss'),
  importantTotal: count(/!important/g),
  filesOver900Lines: files.filter((f) => f.text.split('\n').length >= 900).length,
  explicitAny: count(/(:\s*any\b|\bas any\b|<any>)/g, code),
  todoFixme: count(/\b(TODO|FIXME)\b/g, code),
  eslintDisables: count(/eslint-disable/g, code),
  vHtml: count(/\bv-html=/g, code),
}
const file = 'tools/ratchet.json'
const recorded = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {}
const rose = Object.entries(metrics).filter(([k, v]) => recorded[k] !== undefined && v > recorded[k])
for (const [k, v] of Object.entries(metrics)) console.log(`${k.padEnd(22)} ${String(v).padStart(5)}  (recorded ${recorded[k] ?? '-'})`)
if (rose.length) {
  console.error('Ratchet: rose -> ' + rose.map(([k, v]) => `${k} ${recorded[k]} -> ${v}`).join(', '))
  process.exit(1)
}
if (process.argv.includes('--update')) fs.writeFileSync(file, JSON.stringify(metrics, null, 2) + '\n')
if (process.argv.includes('--bundle')) {
  const bundle = checkBundleBudgets(path.resolve('dist-pages/assets'))
  console.log(`Bundle: largest=${bundle.largestChunkName} ${(bundle.largestChunkRaw / 1024).toFixed(1)}KB raw / ${(bundle.largestChunkGzip / 1024).toFixed(1)}KB gz; total=${(bundle.totalJsRaw / 1024).toFixed(1)}KB raw / ${(bundle.totalJsGzip / 1024).toFixed(1)}KB gz`)
  if (!bundle.ok) {
    console.error('Bundle budget failed -> ' + bundle.violations.join('; '))
    process.exit(1)
  }
}
