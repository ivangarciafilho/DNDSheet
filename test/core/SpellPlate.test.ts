import assert from 'node:assert/strict'
import test from 'node:test'
import { CADENCE_LABELS, CADENCE_OPTIONS, RESOURCE_REFRESH_OPTIONS, cadenceLabel } from '../../src/core/domain/catalogs/cadence.ts'
import { METAMAGIC_OPTIONS, metamagicCost } from '../../src/core/domain/catalogs/metamagic.ts'
import { buildInnateSpellPlate, buildSpellPlate, ordinalLabel, spellLevelLead } from '../../src/core/domain/spell-plate.ts'

const base = {
  title: 'Warlock',
  stat: 'CHA',
  save: 15,
  attack: 7,
  className: 'Warlock',
  level: 15,
  resourceType: 'pact',
  refreshRate: 'short_rest',
  slots: [0, 0, 0, 0, 4, 0, 0, 0, 0],
  spellLevels: [
    { level: 0, spells: [{ name: 'Prestidigitation', tags: 'V, S' }] },
    { level: 1, spells: [{ name: 'Protection from Evil and Good', tags: 'V, S, M', cadence: 'long_rest' }] },
    { level: 3, spells: [{ name: 'Counterspell', tags: 'S' }] },
  ],
}

test('spell plate: ordinals use teen exceptions and level rows stay sorted', () => {
  assert.deepEqual([1, 3, 11, 12, 13, 21].map(ordinalLabel), ['1st', '3rd', '11th', '12th', '13th', '21st'])
  const plate = buildSpellPlate({
    ...base,
    spellLevels: [
      { level: 9, spells: [{ name: 'Ninth' }] },
      { level: 1, spells: [{ name: 'First' }] },
      { level: 3, spells: [{ name: 'Third' }] },
    ],
  })
  assert.deepEqual(plate.levels.map(({ level, ordinal }) => [level, ordinal]), [
    [1, '1st'],
    [3, '3rd'],
    [9, '9th'],
  ])
})

test('spell plate: Pact Magic reports its highest slot pool without fabricating other levels', () => {
  const plate = buildSpellPlate(base)
  assert.equal(plate.resource, 'Pact Magic · 4 5th-level slots · regained on Short Rest')
  assert.equal(plate.levels.find((row) => row.level === 1)?.slotCount, 4)
  assert.equal(plate.levels.find((row) => row.level === 3)?.slotCount, 4)
  assert.equal(plate.levels[1].spells[0].cadence, 'Long Rest')
})

test('spell plate: full caster totals and per-level slot counts are distinct from pact slots', () => {
  const plate = buildSpellPlate({
    ...base,
    className: 'Wizard',
    resourceType: 'slots',
    refreshRate: 'long_rest',
    slots: [4, 3, 3, 3, 1, 0, 0, 0, 0],
    spellLevels: [
      { level: 1, spells: [{ name: 'Shield', tags: 'V, S' }] },
      { level: 5, spells: [{ name: 'Wall of Force', tags: 'V, S, M', cadence: 'at_will' }], bonusAction: true },
    ],
  })
  assert.equal(plate.resource, '14 Spell Slots through 5th level · regained on Long Rest')
  assert.equal(plate.levels[0].slotCount, 4)
  assert.equal(plate.levels[1].slotCount, 1)
  assert.equal(plate.levels[1].bonusAction, true)
  assert.equal(plate.levels[1].cadence, 'Per Long Rest')
  assert.equal(plate.levels[0].cadence, 'Per Long Rest')
  assert.equal(plate.levels[1].spells[0].cadence, 'At Will')
})

test('spell plate: metamagic catalog selects edition-specific costs and preserves unknown custom names', () => {
  const names = METAMAGIC_OPTIONS.map((option) => option.name)
  assert.equal(new Set(names).size, 10)
  assert.equal(metamagicCost('Heightened Spell', '2014'), '3')
  assert.equal(metamagicCost('Heightened Spell', '2024'), '2')
  assert.equal(metamagicCost('Seeking Spell', '2014'), '2')
  assert.equal(metamagicCost('Seeking Spell', '2024'), '1')
  assert.equal(metamagicCost('Twinned Spell', '2014'), 'Spell level')
  assert.equal(metamagicCost('Twinned Spell', '2024'), '1')
  assert.match(METAMAGIC_OPTIONS.find((option) => option.name === 'Twinned Spell')?.effect2014 ?? '', /second eligible creature/)
  assert.match(METAMAGIC_OPTIONS.find((option) => option.name === 'Twinned Spell')?.effect2024 ?? '', /effective level by one/)

  const plate = buildSpellPlate({
    ...base,
    edition: '2024',
    metamagic: { enabled: true, points: 6, options: ['Quickened Spell', 'Homebrew Pulse'] },
  })
  assert.deepEqual(plate.metamagic?.options.map(({ name, cost, source }) => [name, cost, source]), [
    ['Quickened Spell', '2', 'PHB 2024'],
    ['Homebrew Pulse', '', 'Custom'],
  ])
})

test('cadence catalog prevents long-rest resources from being labelled Daily', () => {
  assert.equal(cadenceLabel('long_rest'), 'Long Rest')
  assert.equal(cadenceLabel('1_day'), '1/Day')
  assert.equal(cadenceLabel('Always Available'), 'Always Prepared')
  assert.equal(cadenceLabel('A custom cadence'), 'A custom cadence')
  assert.equal(cadenceLabel('hidden'), '')
  assert.equal(cadenceLabel('while_bloodied'), 'While Bloodied')
  assert.equal(cadenceLabel('dawn'), 'At Dawn')
  assert.equal(CADENCE_LABELS.recharge_5_6, 'Recharge 5–6')
  assert.deepEqual(CADENCE_OPTIONS.map(({ value }) => value), [
    'long_rest', 'short_rest', 'at_will', '1_day', '2_day', '3_day',
    'recharge_5_6', 'downtime', 'ritual', 'always_available',
    'at_dawn', 'at_dusk', 'at_midday', 'at_midnight',
    'while_bloodied', 'when_bloodied', 'at_0_hp', 'at_1_hp',
    'hourly', '10_minutes', '1_minute', 'weekly', 'monthly', 'hidden',
  ])
  assert.equal(RESOURCE_REFRESH_OPTIONS[0].label, 'Long Rest')
  assert.equal(RESOURCE_REFRESH_OPTIONS[0].label.includes('Daily'), false)
})

test('spell plate: absent slot data stays absent instead of inventing a resource count', () => {
  const plate = buildSpellPlate({ ...base, slots: [], resourceType: 'slots' })
  assert.equal(plate.resource, '')
  assert.equal(plate.levels[0].slotCount, undefined)
  assert.equal(buildSpellPlate({ ...base, resourceType: 'points', slots: [] }).resource, '')
})

test('innate spell plate: keeps each recharge group separate and preserves processed notes', () => {
  const plate = buildInnateSpellPlate({
    stat: 'CHA',
    save: 15,
    attack: 7,
    groups: [
      { label: 'At Will', spells: [{ name: 'Light', tags: 'V, M' }] },
      { label: '3/Day', spells: [{ name: 'Misty Step', tags: 'V' }] },
      { label: 'Empty', spells: [] },
    ],
    processedNotes: 'A processed rule note.',
  })
  assert.deepEqual(plate.groups.map((group) => [group.label, group.spells.map((spell) => spell.name)]), [
    ['At Will', ['Light']],
    ['3/Day', ['Misty Step']],
  ])
  assert.equal(plate.processedNotes, 'A processed rule note.')
})

test('spell level lead: a cadence that carries its own count is not prefixed with the slot count', () => {
  assert.equal(spellLevelLead(4, 'Per Long Rest'), '(4/Long Rest), ')
  assert.equal(spellLevelLead(3, 'Per 1/Day'), '(1/Day), ')
  assert.equal(spellLevelLead(3, '2/Day'), '(2/Day), ')
  assert.equal(spellLevelLead(2, 'At Will'), '(At Will), ')
  assert.equal(spellLevelLead(3, 'Hidden'), '(3 slots), ')
  assert.equal(spellLevelLead(undefined, 'Per Short Rest'), '(Short Rest), ')
  assert.equal(spellLevelLead(undefined, 'Hidden'), '')
  assert.equal(spellLevelLead(undefined, ''), '')
})