import test from 'node:test'
import assert from 'node:assert'
import { isMultitarget } from '../../src/core/domain/cr-targeting.ts'

test('C10: a numeric target count above one is multitarget', () => {
  assert.equal(isMultitarget({ targeting: { count: 3, kind: 'creatures' } }), true)
  assert.equal(isMultitarget({ targeting: { count: 1, kind: 'target' } }), false)
})

test('C10: "all" targets and any area of effect are multitarget', () => {
  assert.equal(isMultitarget({ targeting: { count: 'all', kind: 'enemies' } }), true)
  assert.equal(isMultitarget({ targeting: { area: { shape: 'cone', distance: 30, unit: 'ft' } } }), true)
})

test('C10: no structured targeting, or a formula count, stays single-target', () => {
  assert.equal(isMultitarget(undefined), false)
  assert.equal(isMultitarget({}), false)
  assert.equal(isMultitarget({ targeting: { count: '{PB}', kind: 'creatures' } }), false)
})
