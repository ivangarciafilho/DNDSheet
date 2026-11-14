import test from 'node:test'
import assert from 'node:assert'
import {
  SKILL_ACTION_GROUPS,
  computeSkillGroupLayout,
  mergeIdenticalEntries,
  normalizeSkillKey,
  passiveScore,
  skillActionGroupFor,
  skillGroupPlacement,
} from '../../src/core/domain/skill-action-groups.ts'

import { defaultMonster } from '../../src/core/domain/types.ts'
import { migrateMonsterSchema } from '../../src/core/usecases/MigrateMonsterSchema.ts'

const stats = { STR: 8, DEX: 12, CON: 16, INT: 12, WIS: 16, CHA: 20 }

test('every standard skill belongs to exactly one action group', () => {
  const all = SKILL_ACTION_GROUPS.flatMap((g) => g.skills)
  assert.strictEqual(new Set(all).size, all.length, 'a skill is listed twice')
  for (const key of ['INSIGHT', 'MEDICINE', 'PERCEPTION', 'SURVIVAL']) assert.strictEqual(skillActionGroupFor(key)?.id, 'search')
  for (const key of ['ARCANA', 'HISTORY', 'INVESTIGATION', 'NATURE', 'RELIGION']) assert.strictEqual(skillActionGroupFor(key)?.id, 'study')
  for (const key of ['ANIMAL_HANDLING', 'DECEPTION', 'INTIMIDATION', 'PERFORMANCE', 'PERSUASION']) assert.strictEqual(skillActionGroupFor(key)?.id, 'influence')
  for (const key of ['ACROBATICS', 'ATHLETICS', 'SLIGHT_OF_HAND', 'STEALTH']) assert.strictEqual(skillActionGroupFor(key)?.id, 'hide')
})

test('the misspelled stored key and its correct spelling both resolve', () => {
  assert.strictEqual(normalizeSkillKey('SLEIGHT_OF_HAND'), 'SLIGHT_OF_HAND')
  assert.strictEqual(normalizeSkillKey('sleight of hand'), 'SLIGHT_OF_HAND')
  assert.strictEqual(skillActionGroupFor('SLEIGHT_OF_HAND')?.id, 'hide')
})

test('passive score follows 10 + bonus with +/-5 and cancels when both apply', () => {
  assert.strictEqual(passiveScore(3), 13)
  assert.strictEqual(passiveScore(3, true), 18)
  assert.strictEqual(passiveScore(3, false, true), 8)
  assert.strictEqual(passiveScore(3, true, true), 13)
})

test('all four group rows render even with no trained skills', () => {
  const rows = computeSkillGroupLayout({ stats, skills: [] })
  assert.deepStrictEqual(rows.map((r) => r.label), ['Search', 'Study', 'Influence', 'Hide'])
  const search = rows[0]
  assert.deepStrictEqual(search.base, { passive: 13, bonus: 3 })
  assert.strictEqual(search.entries.length, 0)
})

test('trained skills are disclosed only inside their own group and never in a Skills row', () => {
  const rows = computeSkillGroupLayout({
    stats,
    skills: [
      { key: 'RELIGION', label: 'Religion', stat: 'INT', bonus: 3, advantage: true },
      { key: 'INSIGHT', label: 'Insight', stat: 'WIS', bonus: 5 },
      { key: 'PERSUASION', label: 'Persuasion', stat: 'CHA', bonus: 7 },
      { key: 'SLIGHT_OF_HAND', label: 'Sleight of Hand', stat: 'DEX', bonus: 3 },
      { key: 'MEDICINE', label: 'Medicine', stat: 'WIS', bonus: 5 },
    ],
  })
  const byLabel = Object.fromEntries(rows.map((r) => [r.label, r]))
  assert.ok(!('Skills' in byLabel), 'no leftover Skills row')
  assert.deepStrictEqual(byLabel.Search.entries.map((e) => [e.label, e.passive, e.bonus]), [['Insight', 15, 5], ['Medicine', 15, 5]])
  assert.deepStrictEqual(byLabel.Study.entries.map((e) => [e.label, e.passive, e.bonus, e.advantage]), [
    ['Religion', 18, 3, true],
  ])
  assert.deepStrictEqual(byLabel.Influence.entries.map((e) => e.label), ['Persuasion'])
  assert.deepStrictEqual(byLabel.Hide.entries.map((e) => [e.label, e.passive, e.bonus]), [['Sleight of Hand', 13, 3]])
})

test('a skill equal to its group base is omitted as redundant', () => {
  const rows = computeSkillGroupLayout({
    stats,
    skills: [{ key: 'PERCEPTION', label: 'Perception', stat: 'WIS', bonus: 3 }],
  })
  assert.strictEqual(rows[0].entries.length, 0)
})

test('a passive override is disclosed even when the bonus matches the base', () => {
  const rows = computeSkillGroupLayout({
    stats,
    skills: [{ key: 'PERCEPTION', label: 'Perception', stat: 'WIS', bonus: 3, passiveOverride: 20 }],
  })
  assert.deepStrictEqual(rows[0].entries.map((e) => [e.label, e.passive]), [['Perception', 20]])
})

test('a skill with a different action economy gets its own row for that group', () => {
  const rows = computeSkillGroupLayout({
    stats,
    groupActionTypes: { hide: 'Action' },
    skills: [{ key: 'STEALTH', label: 'Stealth', stat: 'DEX', bonus: 5, bonusAction: true }],
  })
  const hideRows = rows.filter((r) => r.id === 'hide')
  assert.deepStrictEqual(hideRows.map((r) => [r.actionType, r.entries.length, r.base != null]), [
    ['Action', 0, true],
    ['Bonus Action', 1, false],
  ])
})

test('skills outside every group fall into a Skills row', () => {
  const rows = computeSkillGroupLayout({
    stats,
    skills: [{ key: 'CUSTOM_LORE', label: 'Planar Lore', stat: 'INT', bonus: 5 }],
  })
  const skillsRow = rows.find((r) => r.id === 'skills')
  assert.ok(skillsRow)
  assert.deepStrictEqual(skillsRow!.entries.map((e) => e.label), ['Planar Lore'])
})

test('identical entries merge into one disclosure', () => {
  const rows = computeSkillGroupLayout({
    stats,
    skills: [
      { key: 'HISTORY', label: 'History', stat: 'INT', bonus: 3 },
      { key: 'INVESTIGATION', label: 'Investigation', stat: 'INT', bonus: 3 },
    ],
  })
  const merged = mergeIdenticalEntries(rows[1].entries)
  assert.deepStrictEqual(merged.map((m) => m.labels), [['History', 'Investigation']])
})


test('new group placement defaults on and follows the row action economy', () => {
  for (const group of ['search', 'study', 'influence', 'hide', 'tools'] as const) {
    assert.equal(skillGroupPlacement(group, 'Action'), 'action')
    assert.equal(skillGroupPlacement(group, 'Bonus Action'), 'bonus_action')
    assert.equal(skillGroupPlacement(group, 'Action', { [group + 'MoveToActionGroup']: false }), 'header')
  }
  assert.equal(skillGroupPlacement('skills', 'Bonus Action'), 'header', 'unmapped custom skills stay visible as skill rows')
})

test('an explicit checkbox overrides a legacy placement and remains cost-driven after reload', () => {
  const saved = { searchPlacement: 'header', searchMoveToActionGroup: true }
  const reload = JSON.parse(JSON.stringify(saved))
  assert.equal(skillGroupPlacement('search', 'Action', reload), 'action')
  assert.equal(skillGroupPlacement('search', 'Bonus Action', reload), 'bonus_action')
  assert.equal(skillGroupPlacement('search', 'Action', { searchMoveToActionGroup: false }, reload), 'header')
  assert.deepEqual(saved, { searchPlacement: 'header', searchMoveToActionGroup: true })
})

test('explicit saved legacy placements are retained until checkbox interaction', () => {
  for (const placement of ['header', 'action', 'bonus_action', 'legendary'] as const) {
    const saved = { hidePlacement: placement }
    assert.equal(skillGroupPlacement('hide', 'Bonus Action', undefined, JSON.parse(JSON.stringify(saved))), placement)
  }
  assert.equal(skillGroupPlacement('tools', 'Action', undefined, undefined, { toolsPlacement: 'header' }), 'header')
})

test('Medicine uses the Search economy while keeping its authored check and passive details', () => {
  const rows = computeSkillGroupLayout({ stats, groupActionTypes: { search: 'Bonus Action', study: 'Action' }, skills: [
    { key: 'MEDICINE', label: 'Medicine', stat: 'WIS', bonus: 5, passiveOverride: 21, advantage: true, condition: 'stabilizing an ally' },
  ] })
  const medicine = rows.find(row => row.entries.some(entry => entry.key === 'MEDICINE'))
  assert.ok(medicine)
  assert.equal(medicine.id, 'search')
  assert.equal(medicine.actionType, 'Bonus Action')
  assert.deepEqual(medicine.entries[0], { key: 'MEDICINE', label: 'Medicine', stat: 'WIS', passive: 21, bonus: 5, advantage: true, disadvantage: false, condition: 'stabilizing an ally' })
  assert.equal(skillGroupPlacement(medicine.id, medicine.actionType), 'bonus_action')
})

test('moving a group routes each explicit skill economy without duplicating or losing entries', () => {
  const rows = computeSkillGroupLayout({ stats, groupActionTypes: { search: 'Action' }, skills: [
    { key: 'MEDICINE', label: 'Medicine', stat: 'WIS', bonus: 5, bonusAction: true },
    { key: 'INSIGHT', label: 'Insight', stat: 'WIS', bonus: 7 },
  ] }).filter(row => row.id === 'search')
  assert.deepEqual(rows.map(row => [skillGroupPlacement(row.id, row.actionType, { searchMoveToActionGroup: true }), row.entries.map(entry => entry.key)]), [
    ['action', ['INSIGHT']], ['bonus_action', ['MEDICINE']],
  ])
})


test('save/import migration retains checkbox choices, legacy placement and group metadata', () => {
  const original = defaultMonster()
  original.actionOrientedPassives = {
    searchMoveToActionGroup: true, studyMoveToActionGroup: false,
    hidePlacement: 'legendary', bonusActionSearch: true,
    riders: { search: 'Sense sentience' }, conditions: { medicine: 'stabilizing' },
  }
  const restored = migrateMonsterSchema(JSON.parse(JSON.stringify(original)))
  assert.deepEqual(restored.actionOrientedPassives, original.actionOrientedPassives)
  const config = restored.actionOrientedPassives as Record<string, unknown>
  assert.equal(skillGroupPlacement('search', 'Bonus Action', config), 'bonus_action')
  assert.equal(skillGroupPlacement('study', 'Action', config), 'header')
  assert.equal(skillGroupPlacement('hide', 'Action', config), 'legendary')
})

test('A11.7a/b: relocateCombatActivity routes once with full undo/redo restoration', async () => {
  const {
    createCombatActivityRoutingState,
    relocateCombatActivity,
    undoCombatActivityRelocation,
    redoCombatActivityRelocation,
    projectCombatActivitySections,
  } = await import('../../src/core/domain/skill-action-groups.ts')

  const initial = createCombatActivityRoutingState([
    {
      id: 'battle-cry',
      name: 'Battle Cry',
      defaultSection: 'Bonus Actions',
      economyLabel: 'Bonus Action',
      description: 'Allies gain advantage.',
    },
    {
      id: 'multiattack',
      name: 'Multiattack',
      defaultSection: 'Actions',
      economyLabel: 'Action',
    },
  ])

  const moved = relocateCombatActivity(initial, 'battle-cry', 'Traits')
  const projectedMoved = projectCombatActivitySections(moved.entries)
  assert.strictEqual(projectedMoved['Bonus Actions'].length, 0)
  assert.strictEqual(projectedMoved.Traits.length, 1)
  assert.strictEqual(projectedMoved.Traits[0].relocated, true)

  const undone = undoCombatActivityRelocation(moved)
  const projectedUndone = projectCombatActivitySections(undone.entries)
  assert.strictEqual(projectedUndone['Bonus Actions'].length, 1)
  assert.strictEqual(projectedUndone.Traits.length, 0)

  const redone = redoCombatActivityRelocation(undone)
  const projectedRedone = projectCombatActivitySections(redone.entries)
  assert.strictEqual(projectedRedone['Bonus Actions'].length, 0)
  assert.strictEqual(projectedRedone.Traits.length, 1)
})

test('A11.7b: projectCombatActivitySections deduplicates duplicate ids and relocated entries', async () => {
  const { projectCombatActivitySections, COMBAT_ACTIVITY_SECTIONS } = await import(
    '../../src/core/domain/skill-action-groups.ts'
  )
  const sections = projectCombatActivitySections([
    { id: 'parry', name: 'Parry', defaultSection: 'Reactions', economyLabel: 'Reaction' },
    {
      id: 'parry',
      name: 'Parry',
      defaultSection: 'Reactions',
      sectionOverride: 'Actions',
      economyLabel: 'Reaction',
    },
  ])
  const allOccurrences = COMBAT_ACTIVITY_SECTIONS.flatMap((s) => sections[s]).filter(
    (item) => item.id === 'parry'
  )
  assert.strictEqual(allOccurrences.length, 1)
  assert.strictEqual(allOccurrences[0].section, 'Actions')
})

test('A11.7c: formatSectionActivityTitle preserves economy label when relocated or specialized', async () => {
  const { formatSectionActivityTitle, projectCombatActivitySections } = await import(
    '../../src/core/domain/skill-action-groups.ts'
  )
  const native = formatSectionActivityTitle(
    { name: 'Shield Block', defaultSection: 'Reactions', economyLabel: 'Reaction' },
    'Reactions'
  )
  assert.strictEqual(native, 'Shield Block')

  const relocated = formatSectionActivityTitle(
    { name: 'Shield Block', defaultSection: 'Reactions', economyLabel: 'Reaction' },
    'Traits'
  )
  assert.strictEqual(relocated, 'Shield Block (Reaction)')

  const specialized = projectCombatActivitySections([
    {
      id: 'breath',
      name: 'Frost Breath',
      defaultSection: 'Actions',
      economyLabel: 'Recharge 5-6',
    },
  ])
  assert.strictEqual(specialized.Actions[0].renderedTitle, 'Frost Breath (Recharge 5-6)')
})
