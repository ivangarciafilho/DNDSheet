import test from 'node:test'
import assert from 'node:assert/strict'
import { composeAcAndDefenses } from '../../src/core/domain/ac-and-defenses.ts'

test('Build 269: natural armor base is 10 + DEX + the flat bonus and prints "natural armor"', () => {
  const result = composeAcAndDefenses({ AC: 10, stats: { STR: 10, DEX: 14, CON: 10, INT: 10, WIS: 10, CHA: 10 }, acConfig: { baseMode: 'natural', naturalBonus: 3 } } as never)
  assert.equal(result.totalAc, 15)
  assert.match(result.fullText, /natural armor/)
})

test('Build 269: natural armor never adds DEX twice when the ability bonus is also DEX', () => {
  const result = composeAcAndDefenses({ AC: 10, stats: { STR: 10, DEX: 14, CON: 10, INT: 10, WIS: 10, CHA: 10 }, acConfig: { baseMode: 'natural', naturalBonus: 2, abilityBonus: 'DEX' } } as never)
  assert.equal(result.totalAc, 14)
})
