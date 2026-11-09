import test from 'node:test'
import assert from 'node:assert'
import { diagnoseTable, diceRange, lookupRoll, parseLegacyTable, tableToMarkdown, tableToProse } from '../../src/core/domain/random-table.ts'

test('diceRange parses counts, faces and modifiers', () => {
  assert.deepStrictEqual(diceRange('1d8'), { min: 1, max: 8 })
  assert.deepStrictEqual(diceRange('2d6+1'), { min: 3, max: 13 })
  assert.deepStrictEqual(diceRange('d20 - 2'), { min: -1, max: 18 })
  assert.strictEqual(diceRange('banana'), null)
  assert.strictEqual(diceRange('0d6'), null)
})

test('diagnoseTable finds gaps, overlaps, reversed ranges and bad dice', () => {
  const kinds = (t: Parameters<typeof diagnoseTable>[0]) => diagnoseTable(t).map((d) => d.kind).sort()
  assert.deepStrictEqual(kinds({ id: 't', dice: '1d6', rows: [{ id: 'a', min: 1, max: 6, text: 'x' }] }), [])
  assert.deepStrictEqual(kinds({ id: 't', dice: '1d6', rows: [{ id: 'a', min: 1, max: 3, text: 'x' }, { id: 'b', min: 3, max: 6, text: 'y' }] }), ['overlap'])
  assert.deepStrictEqual(kinds({ id: 't', dice: '1d6', rows: [{ id: 'a', min: 1, max: 2, text: 'x' }, { id: 'b', min: 5, max: 6, text: 'y' }] }), ['gap'])
  assert.deepStrictEqual(kinds({ id: 't', dice: '1d6', rows: [{ id: 'a', min: 1, max: 2, text: 'x' }] }), ['gap'])
  assert.deepStrictEqual(kinds({ id: 't', dice: '1d6', fallback: 'nothing', rows: [{ id: 'a', min: 1, max: 2, text: 'x' }] }), [])
  assert.ok(kinds({ id: 't', dice: 'x', rows: [{ id: 'a', min: 4, max: 2, text: 'x' }] }).includes('dice'))
  assert.ok(kinds({ id: 't', dice: '1d6', rows: [{ id: 'a', min: 4, max: 2, text: 'x' }] }).includes('range'))
  assert.deepStrictEqual(kinds({ id: 't', dice: '1d6', rows: [] }), ['empty'])
})

test('lookupRoll only answers an explicit roll', () => {
  const t = { id: 't', dice: '1d4', fallback: 'calm', rows: [{ id: 'a', min: 1, max: 2, text: 'storm' }] }
  assert.strictEqual(lookupRoll(t, 2), 'storm')
  assert.strictEqual(lookupRoll(t, 4), 'calm')
})

test('prose and markdown output are sorted and escaped', () => {
  const t = { id: 't', dice: '1d4', rows: [{ id: 'b', min: 3, max: 4, text: 'b|c' }, { id: 'a', min: 1, max: 2, text: 'a' }] }
  assert.strictEqual(tableToProse(t), 'Roll 1d4: 1–2: a; 3–4: b|c.')
  assert.strictEqual(tableToMarkdown(t), '| 1d4 | Result |\n|---|---|\n| 1–2 | a |\n| 3–4 | b\\|c |')
})

test('parseLegacyTable turns free text into stable rows', () => {
  const t = parseLegacyTable('wild', '1d4', '1-2: Fire\n3. Ice\nnoise\n4) Wind')
  assert.deepStrictEqual(t.rows.map((r) => [r.id, r.min, r.max, r.text]), [['wild-r1', 1, 2, 'Fire'], ['wild-r2', 3, 3, 'Ice'], ['wild-r3', 4, 4, 'Wind']])
})

import { nextRandomTableRow, normalizeRandomTables } from '../../src/core/domain/random-table.ts'
import { migrateMonsterSchema } from '../../src/core/usecases/MigrateMonsterSchema.ts'

test('normalizeRandomTables repairs partial and hostile shapes', () => {
  assert.deepStrictEqual(normalizeRandomTables(undefined), [])
  assert.deepStrictEqual(normalizeRandomTables('x'), [])
  const out = normalizeRandomTables([null, { id: 'a', rows: [{ min: 'x', max: null, text: 3 }, { id: 'r', min: 2, max: 5, text: 'ok' }, { id: 'r', min: 6, max: 6, text: 'dup' }] }, { id: 'a', dice: '1d4' }])
  assert.strictEqual(out.length, 2)
  assert.strictEqual(out[0].dice, '1d6')
  assert.deepStrictEqual(out[0].rows.map((r) => [r.min, r.max, r.text]), [[1, 1, ''], [2, 5, 'ok'], [6, 6, 'dup']])
  assert.strictEqual(new Set(out[0].rows.map((r) => r.id)).size, 3)
  assert.notStrictEqual(out[0].id, out[1].id)
})

test('migration always yields a randomTables array and keeps authored tables', () => {
  const kept = migrateMonsterSchema({ saveVersion: 11, randomTables: [{ id: 't', title: 'Wild', dice: '1d4', rows: [{ id: 'r', min: 1, max: 4, text: 'boom' }] }] })
  assert.deepStrictEqual(kept.randomTables, [{ id: 't', title: 'Wild', dice: '1d4', rows: [{ id: 'r', min: 1, max: 4, text: 'boom' }] }])
  assert.deepStrictEqual(migrateMonsterSchema({ saveVersion: 11 }).randomTables, [])
})

test('nextRandomTableRow continues after the highest range and clamps to the dice', () => {
  assert.deepStrictEqual(nextRandomTableRow({ id: 't', dice: '1d6', rows: [{ id: 'a', min: 1, max: 3, text: '' }] }, 'n'), { id: 'n', min: 4, max: 4, text: '' })
  assert.strictEqual(nextRandomTableRow({ id: 't', dice: '1d6', rows: [{ id: 'a', min: 1, max: 6, text: '' }] }, 'n').min, 6)
  assert.strictEqual(nextRandomTableRow({ id: 't', dice: '1d6', rows: [] }, 'n').min, 1)
})


import { previewRandomTableImport } from '../../src/core/domain/random-table.ts'

test('table text import previews without mutation and preserves authored metadata and unchanged row identities', () => {
  const table = { id: 't', title: 'Wild', dice: '1d6', fallback: 'calm', rows: [{ id: 'stable', min: 1, max: 2, text: 'Fire' }] }
  const before = JSON.stringify(table)
  const preview = previewRandomTableImport(table, '1-2: Fire\n3–6. Ice')
  assert.ok(preview.canApply)
  assert.strictEqual(JSON.stringify(table), before)
  assert.strictEqual(preview.table.rows[0].id, 'stable')
  assert.deepStrictEqual(preview.table.rows.map(r => [r.min, r.max, r.text]), [[1,2,'Fire'],[3,6,'Ice']])
  assert.strictEqual(preview.table.fallback, 'calm')
  assert.strictEqual(preview.table.title, 'Wild')
  assert.deepStrictEqual(preview, previewRandomTableImport(table, '1-2: Fire\n3–6. Ice'))
})

test('table text import refuses partial, overlapping, reversed and outside-dice input', () => {
  const table = { id: 't', dice: '1d6', rows: [] }
  for (const input of ['', '1: Fire\nmisspelled row', '1-4: Fire\n4-6: Ice', '3-1: Fire', '0-6: Fire', '1-7: Fire']) {
    assert.strictEqual(previewRandomTableImport(table, input).canApply, false, input)
  }
  assert.deepStrictEqual(previewRandomTableImport(table, '1: Fire\nbad').invalidLines, [2])
  assert.ok(previewRandomTableImport(table, '1-2: Fire').canApply, 'gaps remain explicit warnings')
})

test('signed table ranges import safely and row ids never collide with retained rows', () => {
  const table = { id: 't', dice: '1d4-3', rows: [{ id: 't-r1', min: 1, max: 1, text: 'Wind' }] }
  const preview = previewRandomTableImport(table, '-2--1: Frost\n0: Fire\n1: Wind')
  assert.ok(preview.canApply)
  assert.strictEqual(preview.table.rows[2].id, 't-r1')
  assert.strictEqual(new Set(preview.table.rows.map(r => r.id)).size, 3)
})


test('text import reserves ids from other saved tables before allocating rows', () => {
  const preview = previewRandomTableImport({ id: 't', dice: '1d6', rows: [] }, '1-6: Fire', ['t-import-1'])
  assert.ok(preview.canApply)
  assert.notStrictEqual(preview.table.rows[0].id, 't-import-1')
})
