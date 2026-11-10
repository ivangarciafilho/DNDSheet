import assert from 'node:assert/strict'
import test from 'node:test'
import { buildSpellPlate, spellLevelHeading, spellLevelLead } from '../../src/core/domain/spell-plate.ts'

const slots = [4, 3, 2, 0, 0, 0, 0, 0, 0]

test('exports read the web heading order: lead, then Level N, then colon', () => {
  assert.equal(spellLevelHeading({ level: 1, slots }), '(4/Long Rest), Level 1:')
  assert.equal(spellLevelHeading({ level: 2, slots, bonusAction: true }), '(3/Long Rest), Level 2 (Bonus Action):')
})

test('cantrips, hidden cadence and a custom refresh', () => {
  assert.equal(spellLevelHeading({ level: 0, slots }), 'Cantrips:')
  assert.equal(spellLevelHeading({ level: 1, slots, levelCadence: 'hidden' }), '(4), Level 1:')
  assert.equal(spellLevelHeading({ level: 3, slots, refreshRate: 'short_rest' }), '(2/Short Rest), Level 3:')
})

test('pact magic shows the shared slot lead only on the pact level', () => {
  const pact = [0, 0, 2, 0, 0, 0, 0, 0, 0]
  assert.equal(spellLevelHeading({ level: 3, slots: pact, className: 'Warlock' }), '(2/Short Rest), Level 3:')
  assert.equal(spellLevelHeading({ level: 1, slots: pact, className: 'Warlock' }), 'Level 1:')
})

test('the helper and the web plate composition never diverge', () => {
  for (const className of ['Wizard', 'Warlock']) {
    const levelCadenceMap = { 2: 'hidden' }
    const plate = buildSpellPlate({
      title: 'Spellcasting', stat: 'INT', save: 15, attack: 7, className, level: 9, resourceType: 'slots',
      slots, levelCadenceMap, edition: '2024',
      spellLevels: [1, 2, 3].map((level) => ({ level, spells: [{ name: 'Test Spell' }] })),
    } as Parameters<typeof buildSpellPlate>[0])
    for (const row of plate.levels) {
      const lead = !plate.isPact || row.level === plate.maxPactLevel ? spellLevelLead(row.slotCount, row.cadence) : spellLevelLead(undefined, row.cadence)
      const web = `${lead}Level ${row.level}${row.bonusAction ? ' (Bonus Action)' : ''}:`
      assert.equal(spellLevelHeading({ level: row.level, slots, className, levelCadence: levelCadenceMap[row.level as 2] }), web, `${className} level ${row.level}`)
    }
  }
})

test('explicit cantrip cadence and bonus casting time survive shared headings', () => {
  assert.equal(spellLevelHeading({ level: 0, levelCadence: 'short_rest', bonusAction: true }), 'Cantrips (Bonus Action):')
  assert.equal(spellLevelHeading({ level: 0, levelCadence: 'hidden', bonusAction: true }), 'Cantrips (Bonus Action):')
})
test('explicit lower pact row cadence is visible without repeating its shared slots', () => {
  assert.equal(spellLevelHeading({ level: 1, slots: [0,0,2], className: 'Warlock', levelCadence: 'long_rest' }), 'Level 1:')
})

test('saved counted cadence supplies its own amount unless the author overrides or hides it', () => {
  const row = { level: 3, slots: [4, 3, 3], levelCadence: '1_day' }
  assert.equal(spellLevelHeading(row), '(1/Day), Level 3:')
  assert.equal(spellLevelHeading({ ...row, amount: 2 }), '(2/Day), Level 3:')
  assert.equal(spellLevelHeading({ ...row, amount: null }), 'Level 3:')
})
