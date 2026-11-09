// Read-only: count backlog task checkboxes per loop (A, B and H series). Usage: node tools/qa/count-tasks.mjs [backlog.md]
import fs from 'node:fs'
const text = fs.readFileSync(process.argv[2] || 'docs/roadmap/DNDSheet-Implementation-Backlog.md', 'utf8')
const loops = new Map()
const ids = new Map()
for (const line of text.split(/\r?\n/)) {
  const m = line.match(/^\s*- \[([ x~])\] \*\*([ABH]\d+)(?:\.(\d+[a-z]?))?\*\*/)
  if (!m) continue
  const [, mark, loop, n] = m
  const id = n === undefined ? loop : `${loop}.${n}`
  if (ids.has(id)) { ids.set(id, ids.get(id) + 1); continue }
  ids.set(id, 1)
  // H items have no sub-number; they are counted together as one series.
  const key = n === undefined ? loop.replace(/\d+$/, '') : loop
  const entry = loops.get(key) ?? { done: 0, active: 0, pending: 0 }
  entry[mark === 'x' ? 'done' : mark === '~' ? 'active' : 'pending']++
  loops.set(key, entry)
}
let total = { done: 0, active: 0, pending: 0 }
for (const [loop, e] of [...loops].sort((a, b) => a[0][0].localeCompare(b[0][0]) || Number(a[0].slice(1)) - Number(b[0].slice(1)))) {
  console.log(`${loop}: done ${e.done} active ${e.active} pending ${e.pending} total ${e.done + e.active + e.pending}`)
  for (const k of Object.keys(total)) total[k] += e[k]
}
const dupes = [...ids].filter(([, n]) => n > 1).map(([id, n]) => `${id}×${n}`)
console.log('TOTAL', JSON.stringify(total), 'sum', total.done + total.active + total.pending, 'duplicates', dupes.join(' ') || 'none')
