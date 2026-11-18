import test from 'node:test'
import assert from 'node:assert/strict'
import {
  convertMonsterRulesEdition,
  previewRulesEditionConversion,
} from '../../src/core/domain/rules-conversion.ts'
import type { Monster } from '../../src/core/domain/types.ts'

const sampleCaster = (): Partial<Monster> => ({
  name: 'Archmage Witness',
  saveVersion: 11,
  provenance: { ruleset: '2014', editionLabel: 'SRD 5.1 (2014)', sourceKind: 'authored' },
  spellcasting: {
    stat: 'CHA',
    save: { override: false, overrideValue: 15 },
    modifier: { override: false, overrideValue: 5 },
    attack: { override: false, overrideValue: 7 },
    class: 'Sorcerer',
    subclass: 'Draconic Bloodline',
    level: 9,
    slots: [4, 3, 3, 3, 1, 0, 0, 0, 0],
    atWill: [],
    standard: ['Fireball', 'Counterspell'],
    notes: '',
    atWillNotes: '',
    useCustomClassPreamble: false,
    customClassPreamble: '',
    useCustomInnatePreamble: false,
    customInnatePreamble: '',
    rulesEdition: '2014',
    metamagic: {
      enabled: true,
      sorceryPoints: 9,
      refreshRate: 'LONG_REST',
      options: ['Twinned Spell', 'Heightened Spell', 'Seeking Spell'],
    },
    classes: [
      {
        id: 'sec-1',
        className: 'Cleric',
        subclass: 'Life Domain',
        level: 3,
        stat: 'WIS',
        rulesEdition: '2014',
        metamagic: { enabled: true, sorceryPoints: 3, options: ['Subtle Spell'] },
      },
    ],
  },
})

test('D1.1/D1.2: converting 2014 -> 2024 updates edition tags, provenance, and emits metamagic & subclass warnings without mutating input', () => {
  const source = sampleCaster()
  const snapshot = JSON.stringify(source)

  const preview = previewRulesEditionConversion(source, '2024')
  const { monster: converted, report } = convertMonsterRulesEdition(source, '2024')

  assert.equal(JSON.stringify(source), snapshot, 'input object must remain untouched')
  assert.deepEqual(preview, report)
  assert.equal(report.fromEdition, '2014')
  assert.equal(report.toEdition, '2024')
  assert.equal(report.reversible, true)
  assert.ok(report.changedCount >= 5)

  assert.equal(converted.provenance?.ruleset, '2024')
  assert.equal(converted.provenance?.editionLabel, 'SRD 5.2.1 (2024)')
  assert.equal(converted.spellcasting?.rulesEdition, '2024')
  assert.equal(converted.spellcasting?.classes?.[0].rulesEdition, '2024')
  assert.deepEqual(converted.spellcasting?.standard, ['Fireball', 'Counterspell'])

  const warningCodes = new Set(report.warnings.map((w) => w.code))
  assert.ok(warningCodes.has('METAMAGIC_COST_SHIFT'))
  assert.ok(warningCodes.has('LEGACY_SUBCLASS_GRANTS_UNMAPPED'))
  assert.ok(report.adjustments.some((a) => a.path === 'spellcasting.metamagic.Twinned Spell' && a.before.startsWith('Spell level SP') && a.after.startsWith('1 SP')))
  assert.ok(report.adjustments.some((a) => a.path === 'spellcasting.metamagic.Heightened Spell' && a.before.startsWith('3 SP') && a.after.startsWith('2 SP')))
})

test('D1.3: roundtrip 2024 -> 2014 preserves authored spells and flags collapsed SRD 5.2.1 grants', () => {
  const { monster: as2024 } = convertMonsterRulesEdition(sampleCaster(), '2024')
  const { monster: backTo2014, report } = convertMonsterRulesEdition(as2024, '2014')

  assert.equal(report.fromEdition, '2024')
  assert.equal(report.toEdition, '2014')
  assert.equal(backTo2014.provenance?.ruleset, '2014')
  assert.equal(backTo2014.spellcasting?.rulesEdition, '2014')
  assert.deepEqual(backTo2014.spellcasting?.standard, ['Fireball', 'Counterspell'])
  assert.ok(report.warnings.some((w) => w.code === 'SRD_521_GRANTS_COLLAPSED'))
})

test('D1.2: legacy document without provenance reports UNKNOWN_SOURCE_PROVENANCE explicitly', () => {
  const legacy: Partial<Monster> = { name: 'Legacy Goblin', saveVersion: 10 }
  const { monster: converted, report } = convertMonsterRulesEdition(legacy, '2024')

  assert.equal(report.fromEdition, 'unknown')
  assert.equal(converted.provenance?.ruleset, '2024')
  assert.ok(report.warnings.some((w) => w.code === 'UNKNOWN_SOURCE_PROVENANCE'))
})
