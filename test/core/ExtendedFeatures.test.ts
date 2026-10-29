import test from 'node:test'
import assert from 'node:assert'
import type { Monster, DetailedDamageModifier } from '../../src/core/domain/types.ts'
import { migrateMonsterSchema } from '../../src/core/usecases/MigrateMonsterSchema.ts'

function createMinimalMonster(): Monster {
  return migrateMonsterSchema({
    name: 'Gargoyle King',
    size: 'Large',
    type: 'Monstrosity',
    alignment: 'Chaotic Evil',
    AC: 17,
    ACType: 'natural armor',
    CR: 8,
    HP: { HD: 12, type: 10, modifier: 36 },
    stats: { STR: 18, DEX: 12, CON: 16, INT: 10, WIS: 14, CHA: 8 },
    saves: {
      STR: { override: false, overrideValue: 0, proficient: true },
      DEX: { override: false, overrideValue: 0, proficient: false },
      CON: { override: false, overrideValue: 0, proficient: true },
      INT: { override: false, overrideValue: 0, proficient: false },
      WIS: { override: false, overrideValue: 0, proficient: false },
      CHA: { override: false, overrideValue: 0, proficient: false },
    },
    speeds: [{ id: '1', speed: 30, type: 'walk', note: '' }],
    skills: [
      { id: '1', key: 'PERCEPTION', stat: 'WIS', proficient: 1, override: false, overrideValue: 0, conditional: '' },
      { id: '2', key: 'STEALTH', stat: 'DEX', proficient: 2, override: false, overrideValue: 0, conditional: '' },
    ],
    resistances: ['bludgeoning', 'piercing'],
    immunities: ['poison'],
    vulnerabilities: [],
    conditions: ['poisoned', 'petrified'],
    senses: { blindsight: 0, darkvision: 60, tremorsense: 0, truesight: 0 },
    sensesNotes: '',
    passivePerception: { override: false, overrideValue: null },
    traits: [
      {
        id: 't1',
        name: 'False Appearance',
        description: 'While motionless, indistinguishable from a statue.',
        limitedUse: { count: 0, rate: '' },
        crAnnotation: { maxDamage: 0, maxSave: 0, maxToHit: 0, ehpMultiplier: 1, ehpModifier: 0, acModifier: 0 },
      },
      {
        id: 't2',
        name: 'Stony Retaliation',
        description: 'When hit by a melee attack, deals 2d6 piercing damage.',
        limitedUse: { count: 0, rate: '' },
        crAnnotation: { maxDamage: 0, maxSave: 0, maxToHit: 0, ehpMultiplier: 1, ehpModifier: 0, acModifier: 0 },
        isConditional: true,
        conditionalTrigger: 'Bloodied (HP <= 51)',
      },
      {
        id: 't3',
        name: 'Dawn Burst',
        description: 'Blinds nearby foes for 1 round.',
        limitedUse: { count: 1, rate: 'DAWN' },
        crAnnotation: { maxDamage: 0, maxSave: 0, maxToHit: 0, ehpMultiplier: 1, ehpModifier: 0, acModifier: 0 },
        renderInRechargeSection: true,
        rechargeSection: 'At Dawn',
      },
    ],
    attacks: [],
    actions: [],
    multiattacks: [],
    multiattackOptions: { useCustomRenderer: false, customMultiattackRenderer: '', postscript: '' },
    legendaryActions: { count: 0, actions: [], useCustomPreamble: false, customPreamble: '' },
    mythicActions: { triggerName: '', triggerRecharge: '', triggerDescription: '', preamble: '', actions: [] },
    reactions: [],
    useCustomLairActionPreamble: false,
    lairActionPreamble: '',
    lairActions: [],
    regionalEffects: [],
    regionalEffectDescription: '',
    inventory: '',
    autoEstimateDefenseCr: false,
  })
}

test('Extended Features - Extended HP Attributes & Bloodied Computation', () => {
  const m = createMinimalMonster()
  assert.ok(m.extendedHp !== undefined, 'extendedHp should be defined by schema migration')

  m.extendedHp = {
    showBloodied: true,
    bloodiedOverride: null,
    damageThreshold: 15,
    damageReduction: 5,
    regeneration: {
      enabled: true,
      amount: 10,
      disruptedBy: 'acid or sonic',
    },
  }

  assert.strictEqual(m.extendedHp.showBloodied, true)
  assert.strictEqual(m.extendedHp.damageThreshold, 15)
  assert.strictEqual(m.extendedHp.damageReduction, 5)
  assert.strictEqual(m.extendedHp.regeneration.enabled, true)
  assert.strictEqual(m.extendedHp.regeneration.amount, 10)
  assert.strictEqual(m.extendedHp.regeneration.disruptedBy, 'acid or sonic')
})

test('Extended Features - Detailed Damage Modifiers Vertical List Structure', () => {
  const m = createMinimalMonster()
  assert.ok(Array.isArray(m.detailedDamageModifiers), 'detailedDamageModifiers must be array')

  const mod1: DetailedDamageModifier = {
    id: 'm1',
    category: 'immunity',
    damageType: 'lightning',
    regainHp: true,
    conditionNote: 'absorbs charge',
  }

  const mod2: DetailedDamageModifier = {
    id: 'm2',
    category: 'resistance',
    damageType: 'slashing',
    nonmagicalOnly: true,
    conditionNote: "that aren't adamantine",
  }

  const mod3: DetailedDamageModifier = {
    id: 'm3',
    category: 'vulnerability',
    damageType: 'thunder',
    advantageOnSaves: false,
    disadvantageOnSaves: true,
    conditionNote: 'shatters brittle stone',
  }

  m.detailedDamageModifiers.push(mod1, mod2, mod3)
  assert.strictEqual(m.detailedDamageModifiers.length, 3)
  assert.strictEqual(m.detailedDamageModifiers[0].regainHp, true)
  assert.strictEqual(m.detailedDamageModifiers[1].nonmagicalOnly, true)
  assert.strictEqual(m.detailedDamageModifiers[2].disadvantageOnSaves, true)
})

test('Extended Features - Action Oriented Passives Data Model', () => {
  const m = createMinimalMonster()
  assert.ok(m.actionOrientedPassives !== undefined, 'actionOrientedPassives must be initialized')

  m.actionOrientedPassives = {
    search: { perception: true, investigation: true, survival: false },
    study: { arcana: true, history: false, nature: false, religion: false },
    hide: { stealth: true, acrobatics: false, sleightOfHand: false },
    influence: { insight: true, persuasion: false, deception: false, intimidation: true },
  }

  assert.strictEqual(m.actionOrientedPassives.search?.perception, true)
  assert.strictEqual(m.actionOrientedPassives.search?.investigation, true)
  assert.strictEqual(m.actionOrientedPassives.study?.arcana, true)
  assert.strictEqual(m.actionOrientedPassives.hide?.stealth, true)
  assert.strictEqual(m.actionOrientedPassives.influence?.insight, true)
  assert.strictEqual(m.actionOrientedPassives.influence?.intimidation, true)
})

test('Extended Features - Trait Recharge & Conditionals Section Flags', () => {
  const m = createMinimalMonster()
  const standardTrait = m.traits[0]
  const conditionalTrait = m.traits[1]
  const rechargeTrait = m.traits[2]

  assert.strictEqual(standardTrait.isConditional ?? false, false)
  assert.strictEqual(conditionalTrait.isConditional, true)
  assert.strictEqual(conditionalTrait.conditionalTrigger, 'Bloodied (HP <= 51)')
  assert.strictEqual(rechargeTrait.renderInRechargeSection, true)
  assert.strictEqual(rechargeTrait.rechargeSection, 'At Dawn')
})

test('Extended Features - Monster Portrait Configuration', () => {
  const m = createMinimalMonster()
  m.portrait = {
    url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    position: 'right',
    width: 250,
    caption: 'Ancient Guardian of the Obsidian Gate',
  }

  assert.strictEqual(m.portrait.position, 'right')
  assert.strictEqual(m.portrait.width, 250)
  assert.strictEqual(m.portrait.caption, 'Ancient Guardian of the Obsidian Gate')
  assert.ok(m.portrait.url.startsWith('data:image/png;base64,'))
})
