import test from 'node:test'
import assert from 'node:assert/strict'
import {
  HALF_CASTER_2024_SLOTS,
  HALF_CASTER_SLOTS,
  SRD_2024_PREPARED_TABLES,
  calculateMulticlassSpellcasting,
  getSpellSlotsForClass,
  sourceLearningMetrics,
} from '../../src/core/usecases/AutoSyncSpellcasting.ts'
import { sourceCapacityReference } from '../../src/core/domain/casting-source-selection.ts'
import { buildCastingProjection } from '../../src/core/domain/casting-projection.ts'
import { resolveRulesPolicy } from '../../src/core/domain/document-envelope.ts'
import { defaultMonster } from '../../src/core/domain/types.ts'

test('SRD 5.2.1 (2024) half-caster L1 slots start at 2 while 2014 starts at 0 (A12.0)', () => {
  assert.deepStrictEqual(HALF_CASTER_2024_SLOTS[1], [2, 0, 0, 0, 0, 0, 0, 0, 0])
  assert.deepStrictEqual(HALF_CASTER_SLOTS[1], [0, 0, 0, 0, 0, 0, 0, 0, 0])
  assert.deepStrictEqual(getSpellSlotsForClass('Paladin', 1, '2014'), [0, 0, 0, 0, 0, 0, 0, 0, 0])
  assert.deepStrictEqual(getSpellSlotsForClass('Paladin', 1, '2024'), [2, 0, 0, 0, 0, 0, 0, 0, 0])
  assert.deepStrictEqual(getSpellSlotsForClass('Ranger', 1, '2024'), [2, 0, 0, 0, 0, 0, 0, 0, 0])
})

test('SRD 5.2.1 (2024) prepared tables match Sorcerer/Bard/Wizard/Paladin progressions (A12.0, A12.9)', () => {
  assert.strictEqual(SRD_2024_PREPARED_TABLES.sorcerer[0], 2)
  assert.strictEqual(SRD_2024_PREPARED_TABLES.sorcerer[19], 22)
  assert.strictEqual(SRD_2024_PREPARED_TABLES.wizard[4], 9)
  assert.strictEqual(SRD_2024_PREPARED_TABLES.paladin[0], 2)
  assert.strictEqual(SRD_2024_PREPARED_TABLES.bard[0], 4)

  const wiz2024 = sourceLearningMetrics({ className: 'Wizard', level: 5, rulesEdition: '2024' }, 4)
  assert.strictEqual(wiz2024.ruleset, '2024')
  assert.strictEqual(wiz2024.preparedSpells, 9)
  assert.strictEqual(wiz2024.cantripsKnown, 4)

  const pal2024 = sourceLearningMetrics({ className: 'Paladin', level: 1, rulesEdition: '2024' }, 3)
  assert.strictEqual(pal2024.ruleset, '2024')
  assert.strictEqual(pal2024.preparedSpells, 2)
})

test('2024 half-caster multiclass contribution rounds up (ceil(lvl/2)) while 2014 rounds down (A12.9)', () => {
  const mc2014 = calculateMulticlassSpellcasting([
    { className: 'Paladin', level: 1, rulesEdition: '2014' },
    { className: 'Wizard', level: 2, rulesEdition: '2014' },
  ], { INT: 16, CHA: 14 })
  assert.strictEqual(mc2014.combinedCasterLevel, 2)

  const mc2024 = calculateMulticlassSpellcasting([
    { className: 'Paladin', level: 1, rulesEdition: '2024' },
    { className: 'Wizard', level: 2, rulesEdition: '2024' },
  ], { INT: 16, CHA: 14 })
  assert.strictEqual(mc2024.combinedCasterLevel, 3)
})

test('sourceCapacityReference preserves Legacy label for legacy/2014 and uses SRD 5.2.1 label for 2024 (A12.9)', () => {
  const legacyCap = sourceCapacityReference([], {
    className: 'Wizard',
    level: 5,
    cantrips: [],
    spells: [],
  }, 3)
  assert.strictEqual(legacyCap?.capacityLabel, 'Legacy base-class capacity')

  const modernCap = sourceCapacityReference([], {
    className: 'Sorcerer',
    level: 5,
    rulesEdition: '2024',
    cantrips: [],
    spells: [],
  }, 3, undefined, 1, '2024')
  assert.strictEqual(modernCap?.capacityLabel, 'SRD 5.2.1 (2024) capacity')
  assert.strictEqual(modernCap?.selectionModel, 'prepared')
  assert.strictEqual(modernCap?.preparedSpells, 9)
})

test('per-source sorceryPoints aggregate into metamagic resource plate and rulesPolicy adapts metamagic costs (A12.10, B8.2)', () => {
  const monster = defaultMonster()
  monster.stats.CHA = 16
  monster.spellcasting = {
    ...monster.spellcasting,
    enabled: true,
    class: 'Sorcerer',
    level: 3,
    rulesEdition: '2024',
    sorceryPoints: 3,
    metamagic: {
      enabled: true,
      sorceryPoints: 3,
      refreshRate: 'long_rest',
      options: ['Twinned Spell', 'Careful Spell'],
    },
    classes: [
      {
        id: 'sec-1',
        class: 'Warlock',
        level: 2,
        sorceryPoints: 2,
        metamagic: {
          enabled: true,
          sorceryPoints: 2,
          options: ['Subtle Spell'],
        },
      },
    ],
  }
  const plate = buildCastingProjection(monster.spellcasting, {
    stats: monster.stats,
    proficiency: 2,
    save: 13,
    attack: 5,
    spellLevel: () => 1,
    edition: '2024',
  })
  assert.ok(plate.metamagic, 'metamagic projection exists')
  assert.strictEqual(plate.metamagic?.points, 5)
  const names = plate.metamagic?.options.map((o) => o.name) || []
  assert.ok(names.includes('Twinned Spell'))
  assert.ok(names.includes('Subtle Spell'))
  assert.strictEqual(plate.metamagic?.options.find((o) => o.name === 'Twinned Spell')?.cost, '1')

  const policy2024 = resolveRulesPolicy(monster, '2014')
  assert.strictEqual(policy2024.activeRuleset, '2024')
  const twinned2024 = policy2024.metamagicOptions.find((m) => m.name === 'Twinned Spell')
  assert.strictEqual(twinned2024?.activeCost, '1')

  const monster2014 = { ...monster, spellcasting: { ...monster.spellcasting, rulesEdition: '2014' as const } }
  const policy2014 = resolveRulesPolicy(monster2014, '2024')
  assert.strictEqual(policy2014.activeRuleset, '2014')
  const twinned2014 = policy2014.metamagicOptions.find((m) => m.name === 'Twinned Spell')
  assert.strictEqual(twinned2014?.activeCost, 'Spell level')
})
