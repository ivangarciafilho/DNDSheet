import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

// A13.9: rolled values render through .dnd-num and advHtml only; the retired pill classes must not return.
const RETIRED = ['pill-number', 'pill-bold', 'dnd-adv-pill', 'dnd-disadv-pill', 'dnd-badge-adv', 'dnd-badge-disadv', 'dnd-adv-arrow', 'dnd-disadv-arrow', 'dnd-bonus-badge']

const walk = (dir: string): string[] => fs.readdirSync(dir, { withFileTypes: true })
  .flatMap((e) => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)])

test('retired pill classes are neither emitted nor styled anywhere in src', () => {
  const hits: string[] = []
  for (const file of walk('src').filter((f) => /\.(ts|vue|scss|css|js)$/.test(f))) {
    const text = fs.readFileSync(file, 'utf8')
    for (const cls of RETIRED) if (new RegExp(`(^|[^\\w-])${cls}(?![\\w-])`).test(text)) hits.push(`${file}: ${cls}`)
  }
  assert.deepEqual(hits, [])
})
