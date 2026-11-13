import test from 'node:test'
import assert from 'node:assert/strict'
import { formulaReferences, openIdentifierAt } from '../../src/core/domain/macro-catalog.ts'

test('the identifier at the caret opens formula completion; numbers and dice do not', () => {
  assert.deepEqual(openIdentifierAt('PB + STR_M', 10), { query: 'STR_M', start: 5 })
  assert.equal(openIdentifierAt('PB + 15', 7), undefined)
  assert.equal(openIdentifierAt('PB + ', 5), undefined)
})

test('formula references insert bare and respect the field allowance', () => {
  const entries = formulaReferences('str_m')
  assert.equal(entries[0].insert, 'STR_MOD')
  assert.ok(entries.every((entry) => !entry.insert.includes('{') && entry.kind === 'reference'))
  assert.deepEqual(formulaReferences('spell', (id) => id === 'SPELL_DC').map((entry) => entry.insert), ['SPELL_DC'])
  assert.ok(formulaReferences('a', () => true, 3).length <= 3)
})
