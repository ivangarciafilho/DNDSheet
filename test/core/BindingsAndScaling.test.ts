import assert from 'node:assert/strict'
import test from 'node:test'
import { defaultMonster, type DndAttack, type MonsterAction } from '../../src/core/domain/types.ts'
import { migrateMonsterSchema } from '../../src/core/usecases/MigrateMonsterSchema.ts'
import { setMonsterBinding, resolveMonsterBindings } from '../../src/core/domain/monster-bindings.ts'
import { inspectNumericField } from '../../src/core/domain/catalogs/field-inspection.ts'
import { entryBindingPrefix, withoutEntryBindings } from '../../src/core/domain/entry-bindings.ts'
import { formulaContextForMonster } from '../../src/core/domain/formula-context.ts'
import { structuredOutcomeDamage } from '../../src/core/domain/cr-structured-damage.ts'
import { abilityIdentity, inferAbility, mechanicsPhrase, text2024 } from '../../src/core/domain/ability-grammar.ts'
import { formatRollScalingPhrases, normalizeRollScaling, resolveRollScaling, rollScalingChipText } from '../../src/core/domain/roll-scaling.ts'
import { exportToMarkdown } from '../../src/core/usecases/ExportStatblock.ts'

test('A11.2 / A11.3: anatomyParts, paragonConfig.phaseConfigs, and languagesList[id=*].saveDc support stable formula bindings', () => {
  const migrated = migrateMonsterSchema({
    ...defaultMonster(),
    proficiency: 4,
    proficiencyOverride: true,
    anatomyParts: [{ name: 'Wings', hp: 20, ac: 14, threshold: 8, breakEffect: 'Falls' }],
    languagesList: [{ name: 'Abyssal', proficiency: 'fluent', understanding: true, speaking: true, saveDc: 13 }],
    paragonConfig: {
      enabled: true,
      poolCount: 2,
      phaseName: 'Phase',
      phaseConfigs: [
        { name: 'Phase 2', source: 'flat', hpOverride: 40, initiativeBonus: '+10' },
        { name: 'Final', source: 'flat', hpOverride: 30, initiativeBonus: 20 },
      ],
    },
  })

  assert.equal(migrated.anatomyParts?.[0].id, 'part-1')
  assert.equal(migrated.languagesList?.[0].id, 'lang-1')
  assert.equal(migrated.paragonConfig?.phaseConfigs?.[0].id, 'phase-1')
  assert.equal(migrated.paragonConfig?.phaseConfigs?.[0].initiativeBonus, 10)

  let res = setMonsterBinding(migrated, 'anatomyParts[id=part-1].hp', { mode: 'formula', expr: 'PB * 10' })
  res = setMonsterBinding(res.model, 'anatomyParts[id=part-1].ac', { mode: 'formula', expr: '10 + PB' })
  res = setMonsterBinding(res.model, 'anatomyParts[id=part-1].threshold', { mode: 'formula', expr: 'PB * 2' })
  res = setMonsterBinding(res.model, 'languagesList[id=lang-1].saveDc', { mode: 'formula', expr: '8 + PB' })
  res = setMonsterBinding(res.model, 'paragonConfig.phaseConfigs[id=phase-1].initiativeBonus', { mode: 'formula', expr: 'PB * 3' })
  res = setMonsterBinding(res.model, 'paragonConfig.phaseConfigs[id=phase-1].hpOverride', { mode: 'formula', expr: 'PB * 25' })

  assert.equal(res.model.anatomyParts?.[0].hp, 40)
  assert.equal(res.model.anatomyParts?.[0].ac, 14)
  assert.equal(res.model.anatomyParts?.[0].threshold, 8)
  assert.equal(res.model.languagesList?.[0].saveDc, 12)
  assert.equal(res.model.paragonConfig?.phaseConfigs?.[0].initiativeBonus, 12)
  assert.equal(res.model.paragonConfig?.phaseConfigs?.[0].hpOverride, 100)

  res.model.proficiency = 5
  const updated = resolveMonsterBindings(res.model)
  assert.equal(updated.model.anatomyParts?.[0].hp, 50)
  assert.equal(updated.model.paragonConfig?.phaseConfigs?.[0].hpOverride, 125)
  assert.equal(updated.model.languagesList?.[0].saveDc, 13)

  assert.equal(inspectNumericField(updated.model, 'paragonConfig.phaseConfigs[id=phase-1].hpOverride').editable, true)
  const cleaned = withoutEntryBindings(updated.model.bindings, entryBindingPrefix('paragonConfig.phaseConfigs', 'phase-1'))
  assert.equal(cleaned['paragonConfig.phaseConfigs[id=phase-1].hpOverride'], undefined)
  assert.ok(cleaned['anatomyParts[id=part-1].hp'])
})

test('A9.13: rollScaling distinguishes targets vs rollCount vs beamCount vs damageMultiplier and scaling sources with provenance', () => {
  const spec = normalizeRollScaling({
    rollCount: 2,
    beamCount: 4,
    damageMultiplier: 3,
    source: 'cr',
    sourceLabel: 'Eldritch Volley tiers',
    tiers: [
      { minTier: 1, beamCount: 2, damageMultiplier: 1 },
      { minTier: 5, beamCount: 4, damageMultiplier: 2 },
      { minTier: 11, beamCount: 6, damageMultiplier: 3 },
    ],
    rollMode: 'advantage',
    rollCondition: 'against Undead',
    saveMode: 'disadvantage',
    saveCondition: 'in dim light',
  })
  assert.ok(spec)

  const lowTier = resolveRollScaling({ crNumeric: 3 }, spec, { targetCount: 1 })
  assert.equal(lowTier.targetCount, 1)
  assert.equal(lowTier.beamCount, 2)
  assert.equal(lowTier.damageMultiplier, 1)
  assert.equal(lowTier.rollCount, 2)
  assert.match(lowTier.provenanceLabel, /Challenge Rating \(CR\): Eldritch Volley tiers/)

  const highTier = resolveRollScaling({ crNumeric: 12 }, spec, { targetCount: 1 })
  assert.equal(highTier.beamCount, 6)
  assert.equal(highTier.damageMultiplier, 3)
  assert.equal(highTier.rollMode, 'advantage')
  assert.equal(highTier.rollCondition, 'against Undead')
  assert.equal(highTier.saveMode, 'disadvantage')
  assert.equal(highTier.saveCondition, 'in dim light')

  const phrases = formatRollScalingPhrases(highTier)
  assert.equal(phrases.beamPhrase, '6 beams')
  assert.equal(phrases.multiplierPhrase, '×3 damage')
  assert.match(phrases.rollAdvantagePhrase!, /attack rolls have advantage \(against Undead\)/)
  assert.match(phrases.saveAdvantagePhrase!, /saving throws have disadvantage \(in dim light\)/)
  assert.match(phrases.provenanceNote!, /Eldritch Volley tiers/)
  assert.match(rollScalingChipText(spec), /Roll Adv/)
  assert.match(rollScalingChipText(spec), /Save Disadv/)
})

test('A9.13: structuredOutcomeDamage, ability-grammar, migration, and export honor rollScaling while preserving legacy defaults', () => {
  const ctx = formulaContextForMonster({ stats: { STR: 10, DEX: 10, CON: 10, INT: 18, WIS: 10, CHA: 10 }, proficiency: 4 })
  const baseAction: MonsterAction = {
    id: 'beam-lash',
    name: 'Astral Beams',
    description: '',
    recharge: '',
    legendaryOnly: false,
    limitedUse: { count: 0, rate: '' },
    stat: 'WIS',
    save: { override: true, overrideValue: 16 },
    range: '',
    effects: [],
    customPreamble: false,
    bonusAction: false,
    attackReach: 'ranged',
    attackSource: 'spell',
    attackBonus: 8,
    targeting: { count: 1, kind: 'creature', range: { distance: 60, unit: 'ft', relation: 'within', origin: 'you' } },
    outcomes: [{ trigger: 'hit', effects: [{ kind: 'damage', formula: '2d6', damageType: 'radiant' }] }],
    rollScaling: {
      beamCount: 3,
      damageMultiplier: 2,
      source: 'hd',
      sourceLabel: 'Hit Dice surge',
      rollMode: 'advantage',
      rollCondition: 'versus Fiends',
      saveMode: 'disadvantage',
      saveCondition: 'if frightened',
    },
    crAnnotation: { maxDamage: 0, maxSave: 0, maxModifier: 0, multitarget: false, ehpMultiplier: 1, ehpModifier: 0, acModifier: 0, include: false },
  }

  // 2d6 avg = 7; 3 beams * 2 multiplier = 42
  assert.equal(structuredOutcomeDamage(baseAction, ctx), 42)
  const mech = mechanicsPhrase(inferAbility(baseAction), { formulaContext: ctx }).join(' ')
  assert.match(mech, /3 beams/)
  assert.match(mech, /×2 damage/)
  assert.match(mech, /attack rolls have advantage \(versus Fiends\)/)
  assert.match(mech, /saving throws have disadvantage \(if frightened\)/)
  assert.match(mech, /Hit Dice surge/)

  const prose2024 = text2024(baseAction, { formulaContext: ctx })
  assert.match(prose2024, /3 beams/)
  assert.match(prose2024, /×2 damage/)
  assert.match(prose2024, /saving throws have disadvantage/)

  const attack: DndAttack = {
    id: 'atk-beam',
    name: 'Radiant Ray',
    distance: 'RANGED',
    kind: 'SPELL',
    modifier: { override: false, overrideValue: 0, stat: 'WIS', proficient: true },
    range: { standard: 60, long: 120, reach: 5 },
    targets: 1,
    damage: { dice: 6, count: 2, modifier: { override: false, overrideValue: 0, stat: 'WIS' }, type: 'radiant' },
    alternateDamage: {
      dice: 6,
      count: 2,
      modifier: { override: false, overrideValue: 0, stat: 'WIS' },
      type: 'radiant',
      condition: '',
      active: false,
    },
    additionalDamage: [],
    save: undefined,
    description: '',
    legendaryOnly: false,
    useCustomRenderer: false,
    customRenderer: '',
    rollScaling: { beamCount: 2, rollMode: 'advantage', rollCondition: 'on first turn' },
  }

  const m = migrateMonsterSchema({
    ...defaultMonster(),
    name: 'Volley Archon',
    attacks: [attack],
    actions: [baseAction],
  })
  const md = exportToMarkdown(m, '2024')
  assert.match(md, /Astral Beams/)
  assert.match(md, /3 beams/)
  assert.match(md, /2 beams; attack rolls have advantage \(on first turn\)/)
  assert.ok(abilityIdentity(baseAction))
})
