import test from 'node:test'
import assert from 'node:assert/strict'
import { copyEntryBindings, entryBindingPrefix, withoutEntryBindings } from '../../src/core/domain/entry-bindings.ts'
import { roleTransition } from '../../src/core/domain/role-transition.ts'
import { defaultMonster, defaultAction } from '../../src/core/domain/types.ts'
import { TEMPLATE_OWNED_FIELDS } from '../../src/core/domain/action-templates.ts'
import type { NumericBinding } from '../../src/core/domain/formula.ts'

const formula: NumericBinding = { mode: 'formula', expr: 'PB+1' }
test('explicit record deletion cleans only its exact encoded identity and descendants', () => {
  const prefix = entryBindingPrefix('attacks', 'a].x')
  const bindings = { [`${prefix}.targets`]: formula, 'attacks[id=other].targets': formula,
    [`${prefix}.additionalDamage[id=d].count`]: formula, 'HP.HD': formula }
  assert.deepEqual(Object.keys(withoutEntryBindings(bindings, prefix)), ['attacks[id=other].targets', 'HP.HD'])
  assert.equal(Object.keys(bindings).length, 4)
  assert.deepEqual(withoutEntryBindings(undefined, prefix), {})
})
test('template content replacement clears owned expressions and preserves usage and CR policy', () => {
  const prefix = entryBindingPrefix('actions', 'a')
  const bindings = Object.fromEntries(['attackBonus', 'save.overrideValue', 'targeting.count', 'limitedUse.count', 'rechargeMin', 'crAnnotation.maxDamage'].map(suffix => [`${prefix}.${suffix}`, formula]))
  assert.deepEqual(Object.keys(withoutEntryBindings(bindings, prefix, TEMPLATE_OWNED_FIELDS)), [`${prefix}.limitedUse.count`, `${prefix}.rechargeMin`, `${prefix}.crAnnotation.maxDamage`])
})
test('role copy rebases only compatible copied mechanics and detaches expression object identity', () => {
  const monster = defaultMonster()
  monster.actions = [{ ...defaultAction(), id: 'a/b' }]
  monster.bindings = { 'actions[id=a%2Fb].limitedUse.count': formula, 'actions[id=a%2Fb].attackBonus': formula,
    'actions[id=a%2Fb].crAnnotation.maxDamage': formula, 'HP.HD': formula }
  const before = JSON.stringify(monster)
  const result = roleTransition(monster, 'a/b', 'action', 'trait', 't x')
  assert.deepEqual(result.patch?.bindings?.['traits[id=t%20x].limitedUse.count'], formula)
  assert.deepEqual(result.patch?.bindings?.['traits[id=t%20x].crAnnotation.maxDamage'], formula)
  assert.deepEqual(result.patch?.bindings?.['traits[id=t%20x].attackBonus'], formula)
  assert.notEqual(result.patch?.bindings?.['traits[id=t%20x].limitedUse.count'], formula)
  assert.equal(JSON.stringify(monster), before)
  const reaction = roleTransition(monster, 'a/b', 'action', 'reaction', 'r')
  assert.equal(reaction.patch?.bindings?.['reactions[id=r].crAnnotation.maxDamage'], undefined)
})
test('compatible role moves retain overlay ownership and inactive expressions', () => {
  const monster = defaultMonster()
  monster.actions = [{ ...defaultAction(), id: 'a' }]
  monster.bindings = { 'actions[id=a].save.overrideValue': formula }
  assert.equal(roleTransition(monster, 'a', 'action', 'bonus_action', 'unused').patch?.bindings, undefined)
  assert.deepEqual(monster.bindings['actions[id=a].save.overrideValue'], formula)
  assert.deepEqual(copyEntryBindings(undefined, 'actions[id=a]', 'traits[id=b]', ['limitedUse']), {})
})
