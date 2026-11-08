import assert from 'node:assert/strict'
import test from 'node:test'
import { describePools } from '../../src/core/domain/paragon-pools.ts'

test('equal pools stored as the editor stores them (number[]) read as one phrase', () => {
  assert.deepEqual(describePools(3, [120, 120, 120]), { kind: 'uniform', count: 3, hp: 120 })
})

test('a legacy single number expands to poolCount equal pools', () => {
  assert.deepEqual(describePools(4, 50), { kind: 'uniform', count: 4, hp: 50 })
})

test('unequal pools are listed in order with their pool number', () => {
  assert.deepEqual(describePools(3, [120, 90, 60]), {
    kind: 'list',
    pools: [{ hp: 120, label: 'Pool 1' }, { hp: 90, label: 'Pool 2' }, { hp: 60, label: 'Pool 3' }]
  })
})

test('missing, empty or invalid pool HP yields null so the renderer keeps its fallback', () => {
  assert.equal(describePools(3, undefined), null)
  assert.equal(describePools(3, []), null)
  assert.equal(describePools(3, [0, -5, Number.NaN]), null)
  assert.equal(describePools(0, 40), null)
})

test('invalid entries are dropped without renumbering the valid pools', () => {
  assert.deepEqual(describePools(3, [100, 0, 80]), {
    kind: 'list',
    pools: [{ hp: 100, label: 'Pool 1' }, { hp: 80, label: 'Pool 3' }]
  })
})
