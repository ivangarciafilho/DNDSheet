import assert from 'node:assert/strict'
import test from 'node:test'
import { CADENCE_LABELS, CADENCE_OPTIONS, RESOURCE_REFRESH_OPTIONS, cadenceLabel } from '../../src/core/domain/catalogs/cadence.ts'
import { METAMAGIC_OPTIONS, metamagicCost } from '../../src/core/domain/catalogs/metamagic.ts'
import { buildInnateSpellPlate, buildSpellPlate, ordinalLabel, spellLevelLead, spellCadenceDiffers, consolidateSpellPlates, spellNameWithCadence, spellEntryLead, spellEntryActionLabel, pactResourceSummary } from '../../src/core/domain/spell-plate.ts'

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
  assert.equal(plate.resource, 'You have 4 spell slots of 5th level, regained on Short Rests')
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
  assert.equal(plate.resource, 'You have 14 spell slots through 5th level, regained on Long Rests')
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

test('spell level lead: explicit amount leads cadence, while missing amount hides cadence', () => {
  assert.equal(spellLevelLead(4, 'Per Long Rest'), '(4/Long Rest), ')
  assert.equal(spellLevelLead(3, 'Per 1/Day'), '(3/Day), ')
  assert.equal(spellLevelLead(3, '2/Day'), '(3/Day), ')
  assert.equal(spellLevelLead(2, 'At Will'), '(2/At Will), ')
  assert.equal(spellLevelLead(3, 'Hidden'), '(3), ')
  assert.equal(spellLevelLead(undefined, 'Per Short Rest'), '')
  assert.equal(spellLevelLead(undefined, 'Hidden'), '')
  assert.equal(spellLevelLead(undefined, ''), '')
})
test('cadence tags compare the owning row rather than sibling majority', () => {
  assert.equal(spellCadenceDiffers('long_rest', 'Per Long Rest'), false)
  assert.equal(spellCadenceDiffers('Long Rest', 'Short Rest'), true)
  assert.equal(spellCadenceDiffers('hidden', 'Long Rest'), false)
  assert.equal(spellCadenceDiffers(undefined, 'Long Rest'), false)
  assert.equal(spellCadenceDiffers('long_rest', ''), true)
})
test('row-local cadence has precedence over legacy level map and preserves spell overrides', () => {
  const plate = buildSpellPlate({ ...base, levelCadenceMap: { 1: 'short_rest' }, spellLevels: [{level: 1, cadence: 'long_rest', bonusAction: true, spells: [{ name: 'Shield', cadence: 'short_rest' }]}] })
  assert.equal(plate.levels[0].effectiveCadence, 'Long Rest')
  assert.equal(plate.levels[0].heading, 'Level 1 (Bonus Action):')
  assert.equal(plate.levels[0].spells[0].cadence, 'Short Rest')
})

test('consolidated trait retains local source row rules and explicit custom resources', () => {
  const primary = buildSpellPlate({ ...base, className: 'Wizard', resourceType: 'slots', slots: [4], spellLevels: [{level: 1, spells: [{name: 'Shield'}], cadence: 'long_rest'}] })
  const extra = buildSpellPlate({ ...base, className: 'Custom Focus', resourceType: 'focus', resourceValue: 6, refreshRate: 'short_rest', slots: [], spellLevels: [{level: 1, spells: [{name: 'Shield', cadence: 'long_rest'}], cadence: 'short_rest', bonusAction: true}] })
  const result = consolidateSpellPlates(primary, [{id: 'focus-1', label: 'Custom Focus', plate: extra}])
  assert.equal(result.levels.length, 2)
  assert.equal(result.levels[0].effectiveCadence, 'Long Rest')
  assert.equal(result.levels[1].effectiveCadence, 'Short Rest')
  assert.match(result.levels[1].heading, /Custom Focus.*Level 1.*Bonus Action/)
  assert.match(result.resource, /Custom Focus: 6 Focus Points.*Short Rest/)
  assert.equal(result.levels[1].slotCount, undefined)
  assert.equal(primary.levels[0].sourceId, undefined)
})

test('text spell names retain explicit cantrip cadence exceptions without redundant badges', () => {
  assert.equal(spellNameWithCadence('Light', 'at_will', 'At Will'), 'Light')
  assert.equal(spellNameWithCadence('Light', 'long_rest', 'at_will'), 'Light')
  assert.equal(spellNameWithCadence('Light', 'hidden', 'at_will'), 'Light')
})


test('spell row amount overrides preserve explicit zero and null without leaking cadence', () => {
 const input={...base,slots:[0,0,2],levelAmountMap:{0:3,1:5,3:null},spellLevels:[{level:0,spells:[{name:'Light'}]},{level:1,amount:0,spells:[{name:'Shield'}]},{level:3,spells:[{name:'Counterspell'}]}]}
 const rows=buildSpellPlate(input).levels
 assert.equal(rows[0].heading,'(3/At Will), Cantrips:')
 assert.equal(rows[1].amount,0);assert.equal(rows[1].heading,'Level 1:')
 assert.equal(rows[2].amount,undefined);assert.equal(rows[2].heading,'Level 3:')
 assert.equal(input.levelAmountMap[3],null)
})

test('per-spell cadence requires its own positive amount and never borrows the row budget', () => {
 assert.equal(spellEntryLead({cadence:'short_rest',rowAmount:4,rowCadence:'long_rest'}),'')
 assert.equal(spellEntryLead({amount:0,cadence:'short_rest',rowAmount:4,rowCadence:'long_rest'}),'')
 assert.equal(spellEntryLead({amount:2,cadence:'short_rest',rowAmount:4,rowCadence:'long_rest'}),'(2/Short Rest), ')
 assert.equal(spellEntryLead({amount:4,cadence:'long_rest',rowAmount:4,rowCadence:'Long Rest'}),'')
 assert.equal(spellEntryLead({amount:2,rowAmount:4,rowCadence:'long_rest'}),'(2), ')
 assert.equal(spellEntryLead({amount:2,cadence:'hidden',rowAmount:4,rowCadence:'long_rest'}),'(2), ')
})

test('per-spell casting time inherits the row and explicit false becomes an Action exception', () => {
 assert.equal(spellEntryActionLabel(undefined,true),'')
 assert.equal(spellEntryActionLabel(true,true),'')
 assert.equal(spellEntryActionLabel(true,false),'(Bonus Action)')
 assert.equal(spellEntryActionLabel(false,true),'(Action)')
 assert.equal(spellNameWithCadence('Misty Step','short_rest','long_rest',{amount:2,rowAmount:4,bonusAction:true,rowBonusAction:false}),'(2/Short Rest), Misty Step (Bonus Action)')
})

test('spell plate computes shared spell lead and action metadata without mutating authored records', () => {
 const input={...base,spellLevels:[{level:1,amount:4,cadence:'long_rest',bonusAction:true,spells:[{name:'Shield',amount:2,cadence:'short_rest',bonusAction:false}]}]}
 const snapshot=JSON.stringify(input),row=buildSpellPlate(input).levels[0]
 assert.equal(row.heading,'(4/Long Rest), Level 1 (Bonus Action):')
 assert.equal(row.spells[0].lead,'(2/Short Rest), ');assert.equal(row.spells[0].actionLabel,'(Action)')
 assert.equal(JSON.stringify(input),snapshot)
})

test('Pact resource sentence uses exact highest-level count and explicit recovery cadence', () => {
 assert.equal(pactResourceSummary([0,0,0,0,3]),'You have 3 spell slots of 5th level, regained on Short Rests')
 assert.equal(pactResourceSummary([0,1],'long_rest'),'You have 1 spell slot of 2nd level, regained on Long Rests')
 assert.equal(pactResourceSummary([0,0], 'at_dawn'),'')
 assert.equal(pactResourceSummary([2],'at_dawn'),'You have 2 spell slots of 1st level, regained on At Dawn')
})
