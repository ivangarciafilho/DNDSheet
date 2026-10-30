import test from 'node:test'
import assert from 'node:assert/strict'
import { defaultMonster } from '../../src/core/domain/types.ts'
import { associationChoices, associationPatch } from '../../src/core/domain/action-associations.ts'

const fixture = () => {
  const monster = defaultMonster()
  monster.attacks = [{ id: 'attack', name: 'Claw' }] as typeof monster.attacks
  monster.actions = [{ id: 'action', name: 'Roar', legendaryOnly: false }] as typeof monster.actions
  monster.legendaryActions.actions = [{ actionId: 'action', cost: 3 }]
  monster.mythicActions.actions = []
  return monster
}

test('choices exclude current membership, allow other-role membership and group stable IDs', () => {
  const monster = fixture()
  assert.deepEqual(associationChoices(monster, 'legendary').map(c => [c.id, c.group]), [['attack', 'Attacks']])
  assert.deepEqual(associationChoices(monster, 'mythic').map(c => c.id), ['attack', 'action'])
})

test('adding membership preserves source identity and content and defaults the legendary pool', () => {
  const monster = fixture()
  monster.legendaryActions.count = 0
  const before = JSON.stringify(monster)
  const patch = associationPatch(monster, 'legendary', { kind: 'add', actionId: 'attack' })
  assert.deepEqual(patch.legendaryActions?.actions, [{ actionId: 'action', cost: 3 }, { actionId: 'attack', cost: 1 }])
  assert.equal(patch.legendaryActions?.count, 3)
  assert.deepEqual(Object.keys(patch), ['legendaryActions'])
  assert.equal(JSON.stringify(monster), before)
  assert.deepEqual(associationPatch(monster, 'legendary', { kind: 'add', actionId: 'action' }), {})
  assert.deepEqual(associationPatch(monster, 'mythic', { kind: 'add', actionId: 'missing' }), {})
})

test('remove membership keeps source and other role references, including duplicate legacy records', () => {
  const monster = fixture()
  monster.legendaryActions.actions.push({ actionId: 'action', cost: 2 })
  monster.mythicActions.actions.push({ actionId: 'action', cost: 4 })
  const patch = associationPatch(monster, 'legendary', { kind: 'remove', index: 0, actionId: 'action' })
  assert.deepEqual(patch.legendaryActions?.actions, [{ actionId: 'action', cost: 2 }])
  assert.equal(monster.actions[0]?.id, 'action')
  assert.equal(monster.mythicActions.actions[0]?.cost, 4)
  assert.deepEqual(associationPatch(monster, 'legendary', { kind: 'remove', index: 0, actionId: 'stale' }), {})
})

test('repair a missing reference preserves cost and rejects stale, duplicate and ambiguous sources', () => {
  const monster = fixture()
  monster.legendaryActions.actions.push({ actionId: 'missing', cost: 5 })
  const patch = associationPatch(monster, 'legendary', { kind: 'repair', index: 1, actionId: 'missing', replacementId: 'attack' })
  assert.deepEqual(patch.legendaryActions?.actions[1], { actionId: 'attack', cost: 5 })
  assert.deepEqual(associationPatch(monster, 'legendary', { kind: 'repair', index: 1, actionId: 'missing', replacementId: 'action' }), {})
  assert.deepEqual(associationPatch(monster, 'legendary', { kind: 'repair', index: 0, actionId: 'action', replacementId: 'attack' }), {})
  monster.actions.push({ id: 'attack', name: 'Ambiguous' } as typeof monster.actions[number])
  assert.deepEqual(associationPatch(monster, 'mythic', { kind: 'add', actionId: 'attack' }), {})
  assert.equal(associationChoices(monster, 'mythic').some(c => c.id === 'attack'), false)
})

test('membership cost edits are scoped, validated and preserve missing source metadata',()=>{
  const monster=fixture()
  monster.legendaryActions.actions.push({actionId:'missing',cost:5,extension:'keep'} as typeof monster.legendaryActions.actions[number])
  const patch=associationPatch(monster,'legendary',{kind:'cost',index:1,actionId:'missing',cost:2})
  assert.deepEqual(patch.legendaryActions?.actions[1],{actionId:'missing',cost:2,extension:'keep'})
  assert.equal(monster.legendaryActions.actions[1].cost,5)
  for(const cost of [0,-1,1.5,Infinity,NaN])assert.deepEqual(associationPatch(monster,'legendary',{kind:'cost',index:1,actionId:'missing',cost}),{})
})
