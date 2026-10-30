import test from 'node:test'
import assert from 'node:assert/strict'
import { listJoin } from '../../src/components/rendering/list-join.ts'

test('list join: one item stands alone and two items take a plain "and"', () => {
  assert.equal(listJoin([], ', '), '')
  assert.equal(listJoin(['one Bite attack'], ', '), 'one Bite attack')
  assert.equal(listJoin(['one Bite attack', 'two Claw attacks'], ', '), 'one Bite attack and two Claw attacks')
})

test('list join: three or more items keep the serial comma', () => {
  assert.equal(listJoin(['Bite', 'Claw', 'Tail'], ', '), 'Bite, Claw, and Tail')
})
