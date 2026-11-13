import test from 'node:test'
import assert from 'node:assert/strict'
import { composeAcAndDefenses } from '../../src/core/domain/defense-and-traits-utils.ts'
import { defaultMonster } from '../../src/core/domain/types.ts'
import type { Monster } from '../../src/core/domain/types.ts'

const compositor = (ACType: string, extra: Record<string, unknown> = {}) => ({
  ...defaultMonster(), AC: 15, ACType, ...extra,
  acConfig: { ...defaultMonster().acConfig, enabled: true, conditionMode: 'has_temp_hp', secondaryAc: 20 },
} as unknown as Monster)

test('the compositor prints the author formatted copy of its own wording, once', () => {
  const formatted = '<b>20</b> if It Has <i>Temporary Hit Points</i>.'
  const result = composeAcAndDefenses(compositor(formatted))
  assert.equal(result.armorTypeDesc, formatted)
  const html = result.badges.join(' ')
  assert.match(html, /<b>20<\/b> if It Has <i>Temporary Hit Points<\/i>/)
  assert.equal((html.match(/Temporary Hit Points/g) ?? []).length, 1)
  const split = composeAcAndDefenses(compositor(formatted, { splitAcRiderRows: true }))
  assert.match(split.badges.join(' '), /<b>20<\/b>/)
})

test('unformatted or reworded AC types keep the existing compositor behaviour', () => {
  const plain = composeAcAndDefenses(compositor('20 if It Has Temporary Hit Points'))
  assert.equal(plain.armorTypeDesc, '20 if It Has Temporary Hit Points')
  const other = composeAcAndDefenses(compositor('<b>natural armor</b>'))
  assert.notEqual(other.armorTypeDesc, '<b>natural armor</b>')
  assert.match(other.badges.join(' '), /Temporary Hit Points/)
})
