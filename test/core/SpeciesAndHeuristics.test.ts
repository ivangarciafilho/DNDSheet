import assert from 'node:assert/strict'
import test from 'node:test'
import {
  calculatePointBuySpent,
  STANDARD_ARRAY,
  MONSTER_ROLE_ARCHETYPES,
  SPECIES_CATALOG,
} from '../../src/core/domain/species-and-heuristics.ts'

test('point buy: standard array costs exactly 27 points', () => {
  const result = calculatePointBuySpent(STANDARD_ARRAY)
  assert.equal(result.spent, 27)
  assert.equal(result.remaining, 0)
  assert.equal(result.isValid, true)
})

test('point buy: baseline 8s cost 0 points leaving 27 remaining', () => {
  const allEights = { STR: 8, DEX: 8, CON: 8, INT: 8, WIS: 8, CHA: 8 }
  const result = calculatePointBuySpent(allEights)
  assert.equal(result.spent, 0)
  assert.equal(result.remaining, 27)
  assert.equal(result.isValid, true)
})

test('point buy: flags stats outside 8-15 bounds', () => {
  const monsterStats = { STR: 18, DEX: 14, CON: 16, INT: 10, WIS: 10, CHA: 8 }
  const result = calculatePointBuySpent(monsterStats)
  assert.equal(result.isValid, false)
  assert.deepEqual(result.outOfRangeStats.sort(), ['CON', 'STR'])
})

test('monster role archetypes: cover all 6 requested roles with appropriate stat profiles', () => {
  const roles = Object.keys(MONSTER_ROLE_ARCHETYPES)
  assert.deepEqual(roles, ['brute', 'skirmisher', 'artillery', 'controller', 'leader', 'soldier'])
  assert.equal(MONSTER_ROLE_ARCHETYPES.brute.stats.STR, 18)
  assert.equal(MONSTER_ROLE_ARCHETYPES.skirmisher.stats.DEX, 18)
  assert.equal(MONSTER_ROLE_ARCHETYPES.controller.stats.INT, 18)
  assert.equal(MONSTER_ROLE_ARCHETYPES.leader.stats.CHA, 18)
})

test('species catalog: carries core species with traits, stat hints, and senses', () => {
  assert.ok(SPECIES_CATALOG.length >= 50)
  const drow = SPECIES_CATALOG.find((s) => s.id === 'elf_drow')
  assert.ok(drow)
  assert.equal(drow?.statBonuses.DEX, 2)
  assert.equal(drow?.senses?.[0].value, '120 ft.')

  const celestial = SPECIES_CATALOG.find((s) => s.id === 'celestial')
  assert.ok(celestial)
  assert.ok(celestial?.traits.some((t) => t.name === 'Angelic Weapons'))

  const aasimar = SPECIES_CATALOG.find((s) => s.id === 'aasimar_protector')
  assert.ok(aasimar)
  assert.equal(aasimar?.statBonuses.CHA, 2)
  assert.ok(aasimar?.traits.some((t) => t.name === 'Radiant Soul'))

  const goliath = SPECIES_CATALOG.find((s) => s.id === 'goliath')
  assert.ok(goliath)
  assert.ok(goliath?.traits.some((t) => t.name === "Stone's Endurance"))

  const warforged = SPECIES_CATALOG.find((s) => s.id === 'warforged')
  assert.ok(warforged)
  assert.ok(warforged?.traits.some((t) => t.name === 'Constructed Resilience'))

  const dhampir = SPECIES_CATALOG.find((s) => s.id === 'dhampir')
  assert.ok(dhampir)
  assert.ok(dhampir?.traits.some((t) => t.name === 'Spider Climb'))

  const eladrin = SPECIES_CATALOG.find((s) => s.id === 'eladrin')
  assert.ok(eladrin)
  assert.ok(eladrin?.traits.some((t) => t.name === 'Fey Step'))
})

test('B3.6: rollSeededAbilityScores is deterministic per seed and applies single-step with undo snapshot', async () => {
  const { rollSeededAbilityScores, proposeAbilityScores, applyProposal } = await import(
    '../../src/core/domain/species-and-heuristics.ts'
  )
  const rollA = rollSeededAbilityScores(4242)
  const rollB = rollSeededAbilityScores(4242)
  assert.deepStrictEqual(rollA, rollB)
  assert.strictEqual(rollA.rolls.length, 6)
  for (const score of rollA.rolls) {
    assert.ok(score >= 3 && score <= 18)
  }

  const monster = { stats: { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 } }
  const proposal = proposeAbilityScores(monster, rollA.assignments, { seed: 4242 })
  assert.strictEqual(proposal.provenance.sourceType, 'ability-scores')
  assert.strictEqual(proposal.provenance.seed, 4242)
  const applied = applyProposal(monster, proposal)
  assert.deepStrictEqual(applied.monster.stats, rollA.assignments)
  assert.deepStrictEqual(applied.undoSnapshot.stats, monster.stats)
})

test('B3.7c: proposeSpeciesGrants defaults to 2024 no-auto-ASI unless includeStats is enabled', async () => {
  const { SPECIES_CATALOG, proposeSpeciesGrants, applyProposal } = await import(
    '../../src/core/domain/species-and-heuristics.ts'
  )
  const elf = SPECIES_CATALOG.find((s) => s.id === 'elf_high')!
  const monster = {
    type: 'Beast',
    stats: { STR: 10, DEX: 12, CON: 10, INT: 10, WIS: 10, CHA: 10 },
    languages: [],
    traits: [],
  }

  const prop2024 = proposeSpeciesGrants(monster, elf)
  assert.strictEqual(prop2024.provenance.ruleset, '2024')
  assert.strictEqual(prop2024.provenance.includeStats, false)
  assert.strictEqual(prop2024.diffs.some((d) => d.kind === 'stat'), false)

  const propOptIn = proposeSpeciesGrants(monster, elf, { ruleset: '2024', includeStats: true })
  assert.strictEqual(propOptIn.diffs.some((d) => d.path === 'stats.DEX' && d.after === 14), true)
  const applied = applyProposal(monster, propOptIn)
  assert.strictEqual(applied.monster.stats?.DEX, 14)
})

test('B3.7d: bound fields are skipped in proposals and left untouched by applyProposal', async () => {
  const { SPECIES_CATALOG, proposeSpeciesGrants, applyProposal } = await import(
    '../../src/core/domain/species-and-heuristics.ts'
  )
  const elf = SPECIES_CATALOG.find((s) => s.id === 'elf_high')!
  const monster = {
    type: 'Construct',
    speed: 25,
    stats: { STR: 10, DEX: 16, CON: 10, INT: 10, WIS: 10, CHA: 10 },
    boundPaths: ['type', 'stats.DEX'],
  }

  const proposal = proposeSpeciesGrants(monster, elf, { includeStats: true })
  assert.ok(proposal.skippedBoundPaths.includes('type'))
  assert.ok(proposal.skippedBoundPaths.includes('stats.DEX'))
  const applied = applyProposal(monster, proposal)
  assert.strictEqual(applied.monster.type, 'Construct')
  assert.strictEqual(applied.monster.stats?.DEX, 16)
  assert.strictEqual(applied.monster.speed, 30)
})

test('B3.7a/b: revokeSpeciesGrants and reapply preserve user-edited traits while cleaning unedited grants', async () => {
  const { SPECIES_CATALOG, proposeSpeciesGrants, applyProposal, revokeSpeciesGrants } = await import(
    '../../src/core/domain/species-and-heuristics.ts'
  )
  const elf = SPECIES_CATALOG.find((s) => s.id === 'elf_high')!
  const baseMonster = {
    type: 'Monstrosity',
    speed: 40,
    languages: ['Goblin'],
    senses: [],
    traits: [{ name: 'Pack Tactics', description: 'Custom monster trait.' }],
  }

  const applied = applyProposal(baseMonster, proposeSpeciesGrants(baseMonster, elf))
  assert.strictEqual(applied.monster.type, 'Humanoid')
  assert.ok(applied.monster.languages?.includes('Elvish'))

  // User customizes Fey Ancestry description
  const edited = {
    ...applied.monster,
    traits: applied.monster.traits?.map((t) =>
      t.name === 'Fey Ancestry' ? { ...t, description: 'User customized Fey Ancestry rule.' } : t
    ),
  }

  const revoked = revokeSpeciesGrants(edited, 'elf_high')
  assert.strictEqual(revoked.monster.type, 'Monstrosity')
  assert.deepStrictEqual(revoked.monster.languages, ['Goblin'])
  assert.ok(revoked.preservedUserEdits.includes('traits.Fey Ancestry'))
  assert.strictEqual(
    revoked.monster.traits?.find((t) => t.name === 'Fey Ancestry')?.description,
    'User customized Fey Ancestry rule.'
  )

  const reappliedProp = proposeSpeciesGrants(revoked.monster, elf)
  assert.ok(reappliedProp.preservedUserEditPaths.includes('traits.Fey Ancestry'))
  const reapplied = applyProposal(revoked.monster, reappliedProp)
  assert.strictEqual(
    reapplied.monster.traits?.find((t) => t.name === 'Fey Ancestry')?.description,
    'User customized Fey Ancestry rule.'
  )
})

test('B3.7b: cancelProposal marks proposal cancelled without mutating monster', async () => {
  const { SPECIES_CATALOG, proposeSpeciesGrants, cancelProposal, applyProposal } = await import(
    '../../src/core/domain/species-and-heuristics.ts'
  )
  const human = SPECIES_CATALOG.find((s) => s.id === 'human')!
  const monster = { type: 'Aberration', traits: [] }
  const cancelled = cancelProposal(proposeSpeciesGrants(monster, human))
  assert.strictEqual(cancelled.status, 'cancelled')
  const result = applyProposal(monster, cancelled)
  assert.strictEqual(result.appliedPaths.length, 0)
  assert.strictEqual(result.monster.type, 'Aberration')
})

test('B3.6/B3.7: boundPaths parameter on proposeAbilityScores protects locked ability scores', async () => {
  const { proposeAbilityScores, applyProposal } = await import(
    '../../src/core/domain/species-and-heuristics.ts'
  )
  const monster = { stats: { STR: 20, DEX: 10, CON: 14, INT: 8, WIS: 10, CHA: 8 } }
  const proposal = proposeAbilityScores(
    monster,
    { STR: 8, DEX: 16, CON: 12 },
    { boundPaths: ['stats.STR'] }
  )
  assert.deepStrictEqual(proposal.skippedBoundPaths, ['stats.STR'])
  const applied = applyProposal(monster, proposal)
  assert.strictEqual(applied.monster.stats?.STR, 20)
  assert.strictEqual(applied.monster.stats?.DEX, 16)
})
