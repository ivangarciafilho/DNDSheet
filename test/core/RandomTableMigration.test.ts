import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeContainer, descriptionContainersText } from '../../src/core/domain/description-containers.ts'
import { normalizeRandomTables, diagnoseOutcomeRandomTables, resolveTableOutcome } from '../../src/core/domain/random-table.ts'
import type { ActionDescriptionContainer } from '../../src/core/domain/types.ts'

test('A11.9 migration: pre-224 saved containers without randomTableId load unchanged', () => {
  const legacy = JSON.parse(JSON.stringify({ id: 'c1', kind: 'text', text: 'Old prose.' })) as ActionDescriptionContainer
  const out = normalizeContainer(legacy)
  assert.equal(out.kind, 'text')
  assert.equal(out.text, 'Old prose.')
  assert.equal(out.randomTableId, undefined)
})

test('A11.9 migration: normalized containers survive a JSON save/load round trip', () => {
  const once = normalizeContainer({ id: 'c2', kind: 'random_table', randomTableId: 'rt-1' } as ActionDescriptionContainer)
  const twice = normalizeContainer(JSON.parse(JSON.stringify(once)) as ActionDescriptionContainer)
  assert.deepStrictEqual(twice, once)
})

test('A11.9 migration: unresolved table links degrade without throwing', () => {
  const container = { id: 'c3', kind: 'random_table', randomTableId: 'missing' } as ActionDescriptionContainer
  assert.doesNotThrow(() => descriptionContainersText([container], {}, []))
  assert.deepStrictEqual(diagnoseOutcomeRandomTables([], ['missing']).missingTableIds, ['missing'])
})

test('A11.9 migration: absent or malformed random table lists normalize to empty', () => {
  assert.deepStrictEqual(normalizeRandomTables(undefined), [])
  assert.deepStrictEqual(normalizeRandomTables('junk'), [])
})

test('A11.9 resolve: explicit roll uses fallback only when no row matches', () => {
  const table = { id: 't', dice: '1d4', rows: [{ id: 'a', min: 1, max: 2, text: 'Low' }], fallback: 'Else' }
  assert.equal(resolveTableOutcome(table, 2).resultText, 'Low')
  assert.equal(resolveTableOutcome(table, 4).resultText, 'Else')
  assert.equal(resolveTableOutcome(table, 4).isFallback, true)
})
