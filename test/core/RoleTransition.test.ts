import test from 'node:test'
import assert from 'node:assert/strict'
import { defaultMonster, defaultAction, defaultTrait, defaultCrAnnotation } from '../../src/core/domain/types.ts'
import { roleTransition, ROLE_NAMES } from '../../src/core/domain/role-transition.ts'
import type { ActionComposerRole } from '../../src/core/domain/action-composer.ts'

const roles = Object.keys(ROLE_NAMES) as ActionComposerRole[]
const family = ['action', 'bonus_action', 'legendary', 'mythic']
function fixture(role: ActionComposerRole) {
  const monster = defaultMonster()
  const action = { ...defaultAction(), id: 'source', name: 'Solar Strike', description: 'Deals {2d6} damage.',
    effects: [{ case: 'On Hit', effect: '{2d6} fire damage' }], targeting: { kind: 'creatures', count: '2' },
    crAnnotation: { ...defaultCrAnnotation(), include: true, automatic: false, maxDamage: 42 } }
  // Extra legacy fields must survive compatible changes too.
  Object.assign(action, { savedLegacy: { keep: ['every', 'field'] } })
  monster.actions = family.includes(role) ? [action as ReturnType<typeof defaultAction>] : []
  monster.traits = role === 'trait' ? [{ ...defaultTrait(), id: 'source', name: 'Solar Strike', description: action.description, stagePool: 'all', limitedUse: { count: 3, rate: 'DAY' } }] : []
  monster.reactions = role === 'reaction' ? [{ id: 'source', name: 'Solar Strike', description: action.description, trigger: 'When struck', limitedUse: { count: 2, rate: 'DAY' } }] : []
  monster.lairActions = role === 'lair' ? [{ id: 'source', description: action.description, crAnnotation: defaultCrAnnotation() }] : []
  monster.legendaryActions.actions = role === 'legendary' ? [{ actionId: 'source', cost: 2 }] : []
  monster.mythicActions.actions = role === 'mythic' ? [{ actionId: 'source', cost: 3 }] : []
  monster.multiattacks = [{ id: 'combo', name: 'Combo', attacks: [], actions: ['source'] }] as typeof monster.multiattacks
  return monster
}

for (const source of roles) for (const target of roles) {
  test(`role transition ${source} -> ${target} is non-destructive and deterministic`, () => {
    const monster = fixture(source)
    const before = JSON.stringify(monster)
    const result = roleTransition(monster, 'source', source, target, 'copy-id')
    assert.equal(JSON.stringify(monster), before)
    assert.deepEqual(result, roleTransition(monster, 'source', source, target, 'copy-id'))
    if (source === target) { assert.equal(result.kind, 'noop'); return }
    assert.equal(result.kind, family.includes(source) && family.includes(target) ? 'move' : 'copy')
    assert.ok(result.patch)
    const next = { ...monster, ...result.patch }
    assert.deepEqual(next.multiattacks, monster.multiattacks)
    if (result.kind === 'move') {
      const { bonusAction: _b, legendaryOnly: _l, ...actual } = next.actions[0]
      const { bonusAction: _oldB, legendaryOnly: _oldL, ...expected } = monster.actions[0]
      assert.deepEqual(actual, expected)
      assert.equal(next.actions[0].id, 'source')
      assert.equal(next.actions[0].bonusAction, target === 'bonus_action')
      assert.equal(next.actions[0].legendaryOnly, target === 'legendary' || target === 'mythic')
    } else {
      for (const key of ['traits', 'reactions', 'lairActions', 'actions'] as const) {
        for (const original of monster[key]) assert.deepEqual(next[key].find(entry => entry.id === original.id), original)
      }
      const copy = [...next.actions, ...next.traits, ...next.reactions, ...next.lairActions].find(entry => entry.id === 'copy-id')!
      assert.ok(copy)
      assert.equal(copy.description, 'Deals {2d6} damage.')
      if ('crAnnotation' in copy) assert.equal(copy.crAnnotation.include, false)
      copy.description = 'Independent copy'
      if ('limitedUse' in copy) copy.limitedUse.count = 99
      if ('crAnnotation' in copy) copy.crAnnotation.maxDamage = 999
      assert.equal(JSON.stringify(monster), before)
    }
  })
}

test('missing entries, invalid roles and duplicate target IDs cannot mutate a document', () => {
  const monster = fixture('action')
  assert.equal(roleTransition(monster, 'missing', 'action', 'trait', 'new').kind, 'unavailable')
  assert.equal(roleTransition(monster, 'source', 'action', 'trait', 'source').kind, 'unavailable')
  assert.equal(roleTransition(monster, 'source', 'invalid' as ActionComposerRole, 'trait', 'new').kind, 'unavailable')
})

test('pool transitions retain costs, position, unknown membership metadata and unrelated settings', () => {
  const monster = fixture('legendary')
  monster.legendaryActions.actions.push({ actionId: 'other', cost: 1 })
  monster.mythicActions.actions = [{ actionId: 'source', cost: 3 }, { actionId: 'other', cost: 2 }]
  Object.assign(monster.mythicActions.actions[0], { savedPoolMetadata: 'retain' })
  const result = roleTransition(monster, 'source', 'legendary', 'mythic', 'unused')
  assert.deepEqual(result.patch?.mythicActions?.actions, monster.mythicActions.actions)
  assert.deepEqual(result.patch?.legendaryActions?.actions, [{ actionId: 'other', cost: 1 }])
  assert.equal(result.patch?.legendaryActions?.count, monster.legendaryActions.count)
})
