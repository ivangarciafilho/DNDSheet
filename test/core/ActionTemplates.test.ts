import test from 'node:test'
import assert from 'node:assert/strict'
import { ACTION_TEMPLATES, applyActionTemplate } from '../../src/core/domain/action-templates.ts'
import type { MonsterAction } from '../../src/core/domain/types.ts'

function action(overrides: Partial<MonsterAction> = {}): MonsterAction {
  return {
    id: 'stable-action-id',
    name: 'Existing Action',
    description: 'Authored text to replace only after explicit confirmation.',
    recharge: '5–6',
    legendaryOnly: true,
    limitedUse: { count: 2, rate: 'DAY' },
    stat: 'WIS',
    save: { override: true, overrideValue: 17 },
    range: 'self',
    effects: [{ case: 'Failure', effect: 'Old effect.' }],
    customPreamble: true,
    bonusAction: true,
    stagePool: 'all',
    crAnnotation: { maxDamage: 8, maxSave: 17, maxModifier: 1, multitarget: true, ehpMultiplier: 1, ehpModifier: 0, acModifier: 0, include: true },
    actionType: 'save_ability',
    attackReach: 'melee',
    attackSource: 'weapon',
    attackBonus: 9,
    targetsText: 'two old targets',
    targeting: { count: 2, kind: 'creatures' },
    outcomes: [{ trigger: 'failure', effects: [{ kind: 'text', text: 'Old structured effect.' }] }],
    school: 'Necromancy',
    spellLevel: '3rd Level',
    components: ['V'],
    duration: '1 minute',
    areaShape: 'cone',
    areaDistance: '30',
    deliveryType: 'Save',
    ...overrides,
  }
}

test('action template catalog has stable unique ids and human-readable names', () => {
  const ids = ACTION_TEMPLATES.map((template) => template.id)
  assert.strictEqual(new Set(ids).size, ids.length)
  assert.ok(ACTION_TEMPLATES.length >= 8)
  assert.ok(ACTION_TEMPLATES.some((template) => template.name === 'Veil of Radiance'))
  assert.ok(ACTION_TEMPLATES.some((template) => template.name === 'Holy Javelin'))
})

test('applying a template replaces its owned ability fields and keeps identity, role, usage, and CR settings', () => {
  const original = action()
  const before = structuredClone(original)
  const applied = applyActionTemplate(original, 'ranged-spell-attack')

  assert.strictEqual(applied.name, 'Ranged spell attack')
  assert.strictEqual(applied.attackReach, 'ranged')
  assert.strictEqual(applied.attackSource, 'spell')
  assert.strictEqual(applied.targeting?.range?.distance, 120)
  assert.strictEqual(applied.outcomes?.[0]?.trigger, 'hit')
  assert.strictEqual(applied.id, original.id)
  assert.strictEqual(applied.bonusAction, original.bonusAction)
  assert.strictEqual(applied.legendaryOnly, original.legendaryOnly)
  assert.strictEqual(applied.recharge, original.recharge)
  assert.deepStrictEqual(applied.limitedUse, original.limitedUse)
  assert.deepStrictEqual(applied.stagePool, original.stagePool)
  assert.deepStrictEqual(applied.crAnnotation, original.crAnnotation)
  assert.deepStrictEqual(original, before)
})

test('template application clears stale mechanics owned by the template', () => {
  const applied = applyActionTemplate(action(), 'utility-aura')

  assert.strictEqual(applied.actionType, 'standard')
  assert.strictEqual(applied.attackReach, undefined)
  assert.strictEqual(applied.attackSource, undefined)
  assert.strictEqual(applied.attackBonus, undefined)
  assert.strictEqual(applied.targeting, undefined)
  assert.strictEqual(applied.outcomes?.length, 0)
  assert.strictEqual(applied.stat, 'none')
  assert.deepStrictEqual(applied.save, { override: false, overrideValue: 0 })
  assert.strictEqual(applied.areaShape, undefined)
})

test('unknown template ids do not alter the action', () => {
  const original = action()
  assert.strictEqual(applyActionTemplate(original, 'missing-template'), original)
})

test('the ranged-weapon template does not imply a long range unsupported by the model', () => {
  const applied = applyActionTemplate(action(), 'ranged-weapon-attack')
  assert.deepStrictEqual(applied.targeting?.range, { distance: 80, unit: 'ft', relation: 'range' })
  assert.ok(!String(applied.description).includes('320'))
})
