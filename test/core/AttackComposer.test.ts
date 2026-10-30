import test from 'node:test'
import assert from 'node:assert/strict'
import { attackFields, attackValue, attackPatch, validateAttackField } from '../../src/core/domain/attack-composer.ts'
import type { DndAttack } from '../../src/core/domain/types.ts'
const fixture = () => ({ id: 'spear', name: 'Spear', distance: 'BOTH', kind: 'WEAPON', targets: 1,
 modifier: { override: false, overrideValue: 8, stat: 'STR', proficient: true, note: 'retain' },
 range: { reach: 5, standard: 20, long: 60 }, damage: { count: 1, dice: 6, type: 'piercing', modifier: { override: false, overrideValue: 0, stat: 'STR' } },
 alternateDamage: { active: true, condition: 'with two hands', count: 1, dice: 8, type: 'piercing', modifier: { override: false, overrideValue: 0, stat: 'STR' } },
 additionalDamage: [{ id: 'fire', count: 2, dice: 6, type: 'fire', note: 'while burning' }],
 save: 0, description: 'Authored', legendaryOnly: false, useCustomRenderer: false, customRenderer: '{attack.name}', stagePool: '2', extension: 'keep'
} as unknown as DndAttack)
test('attack adapter covers distinct ranges, modifiers and all damage models', () => {
 const ids = attackFields(fixture()).map(f => f.id)
 for (const id of ['range.reach','range.standard','range.long','modifier.proficient','modifier.override','alternateDamage.condition','additional.fire.count','save']) assert.ok(ids.includes(id), id)
})
test('nested attack patches preserve identity, extensions and sibling distances', () => {
 const attack = fixture(), before = JSON.stringify(attack)
 const updated = { ...attack, ...attackPatch(attack, 'range.standard', '30') }
 assert.deepEqual(updated.range, { reach: 5, standard: 30, long: 60 })
 assert.equal(updated.id, attack.id)
 assert.equal(JSON.stringify(attack), before)
 const modifier = attackPatch(attack, 'modifier.override', 'Yes').modifier!
 assert.equal(modifier.override, true)
 assert.equal((modifier as unknown as {note:string}).note, 'retain')
})
test('additional damage edits retain IDs and notes without mutating source', () => {
 const attack = fixture(), patch = attackPatch(attack, 'additional.fire.count', '3')
 assert.equal(patch.additionalDamage![0].count, 3)
 assert.equal(patch.additionalDamage![0].id, 'fire')
 assert.equal(patch.additionalDamage![0].note, 'while burning')
 assert.equal(attack.additionalDamage[0].count, 2)
 assert.deepEqual(attackPatch(attack, 'additional.missing.count', '4'), {})
})
test('invalid and unknown attack edits are rejected at the domain boundary', () => {
 const attack = fixture()
 for (const [id, value] of [['targets','0'],['range.reach','-1'],['damage.count','1.5'],['damage.dice','3'],['distance','TELEPORT'],['name',''],['modifier.override','maybe'],['id','replace']]) {
  assert.ok(validateAttackField(attack, id, value), id)
  assert.deepEqual(attackPatch(attack, id, value), {}, id)
 }
})
test('clearing an attack field cannot silently reset a required value', () => {
 const attack = fixture()
 assert.deepEqual(attackPatch(attack, 'targets', ''), {})
 assert.equal(attackPatch(attack, 'alternateDamage.condition', '').alternateDamage!.condition, '')
 assert.equal(attackValue(attack, 'modifier.proficient'), 'Yes')
 assert.equal(attackValue(attack, 'damage.dice'), '6')
})

test('additional damage IDs containing dots and URL characters remain stable', () => {
 const attack = fixture(); attack.additionalDamage[0].id = 'fire.ice/%'
 const id = attackFields(attack).find(f => f.id.startsWith('additional.') && f.id.endsWith('.count'))!.id
 const patch = attackPatch(attack, id, '5')
 assert.equal(patch.additionalDamage![0].id, 'fire.ice/%')
 assert.equal(patch.additionalDamage![0].count, 5)
 assert.equal(attackValue({ ...attack, ...patch }, id), '5')
})
