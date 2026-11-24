import test from 'node:test'
import assert from 'node:assert/strict'
import { ATTACK_PRESETS, attackPresetAction } from '../../src/core/domain/attack-presets.ts'
import { attackKindOf } from '../../src/core/domain/composer-chain.ts'
import { defaultAction } from '../../src/core/domain/monster-defaults.ts'

// Build 274: "Add Attack" variants create a composer Action that is already an attack.
test('each preset yields a composer action whose attack kind, range and hit outcome are set', () => {
  assert.deepEqual(ATTACK_PRESETS.map(p => p.kind), ['melee-weapon', 'ranged-weapon', 'melee-spell', 'ranged-spell'])
  for (const preset of ATTACK_PRESETS) {
    const action = { ...defaultAction('x'), ...attackPresetAction(preset.kind) }
    assert.equal(attackKindOf(action), preset.kind)
    assert.equal(action.targeting?.count, 1)
    assert.ok(Number(action.targeting?.range?.distance) > 0)
    assert.equal(action.outcomes?.[0]?.trigger, 'hit')
    assert.equal(action.outcomes?.[0]?.effects[0]?.kind, 'damage')
    assert.ok(action.outcomes?.[0]?.effects[0]?.formula)
  }
})

test('ranged presets carry long range; melee presets use reach', () => {
  assert.equal(attackPresetAction('melee-weapon').targeting?.range?.relation, 'reach')
  assert.equal(attackPresetAction('ranged-weapon').targeting?.range?.longDistance, 320)
  assert.throws(() => attackPresetAction('nope'))
})
