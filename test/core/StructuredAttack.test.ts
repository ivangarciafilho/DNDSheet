import test from 'node:test'
import assert from 'node:assert/strict'
import { structuredAttackBonus } from '../../src/core/domain/structured-attack.ts'
import type { MonsterAction } from '../../src/core/domain/types.ts'

const source = (spellcasting?: { stat?: 'INT' | 'WIS' | 'CHA'; attack?: { override: boolean; overrideValue: number } }) => ({
  proficiency: 3,
  stats: { STR: 18, DEX: 14, CON: 12, INT: 10, WIS: 10, CHA: 20 },
  spellcasting,
})
const attack = (fields: Partial<MonsterAction>) => fields

test('weapon attacks default by reach: melee and thrown use Strength, ranged uses Dexterity', () => {
  assert.equal(structuredAttackBonus(attack({ attackSource: 'weapon', attackReach: 'melee' }), source()), 7)
  assert.equal(structuredAttackBonus(attack({ attackSource: 'weapon', attackReach: 'ranged' }), source()), 5)
  assert.equal(structuredAttackBonus(attack({ attackSource: 'weapon', attackReach: 'melee_or_ranged' }), source()), 7)
  assert.equal(structuredAttackBonus(attack({ attackSource: 'weapon' }), source()), 7)
  assert.equal(structuredAttackBonus(attack({ actionType: 'weapon_attack', attackReach: 'ranged' }), source()), 5)
})

test('spell attacks follow the spellcasting ability and its override, exactly like the sheet', () => {
  assert.equal(structuredAttackBonus(attack({ attackSource: 'spell', attackReach: 'ranged' }), source({ stat: 'CHA' })), 8)
  assert.equal(structuredAttackBonus(attack({ attackSource: 'spell' }), source({ stat: 'CHA', attack: { override: true, overrideValue: 11 } })), 11)
  assert.equal(structuredAttackBonus(attack({ attackSource: 'spell' }), source()), 3)
})

test('an authored bonus always wins and a non-attack has no bonus', () => {
  assert.equal(structuredAttackBonus(attack({ attackSource: 'weapon', attackReach: 'ranged', attackBonus: 9 }), source()), 9)
  assert.equal(structuredAttackBonus(attack({ attackSource: 'spell', attackBonus: 0 }), source({ stat: 'CHA' })), 0)
  assert.equal(structuredAttackBonus(attack({}), source()), undefined)
  assert.equal(structuredAttackBonus(attack({ stat: 'WIS' }), source()), undefined)
})
