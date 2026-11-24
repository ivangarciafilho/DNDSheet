import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildEncounterMarkdown,
  buildEncounterSummaryJson,
  calculateEncounterBudget,
  crToXp,
  parseEncounterSummaryJson,
} from '../../src/core/domain/encounter-budget.ts'
import { createCombatantFromMonster } from '../../src/core/usecases/CombatTracker.ts'
import { defaultMonster } from '../../src/core/domain/types.ts'

test('F1.1: crToXp resolves fractional and integer challenge ratings', () => {
  assert.equal(crToXp('0'), 10)
  assert.equal(crToXp('1/8'), 25)
  assert.equal(crToXp('1/4'), 50)
  assert.equal(crToXp('1/2'), 100)
  assert.equal(crToXp('5'), 1800)
  assert.equal(crToXp(30), 155000)
})

test('F1.1: calculateEncounterBudget applies 2014 multipliers & party-size shifts vs multiplier-free 2024 budgets', () => {
  // 4x level 5 PCs in 2014: easy 1000, medium 2000, hard 3000, deadly 4400
  // Four CR 1 monsters (4 * 200 = 800 raw) -> x2 multiplier = 1600 adjusted (easy)
  const res2014 = calculateEncounterBudget([{ name: 'Goblin Boss', cr: '1', count: 4 }], { size: 4, level: 5 }, '2014')
  assert.equal(res2014.rawXp, 800)
  assert.equal(res2014.multiplier, 2)
  assert.equal(res2014.adjustedXp, 1600)
  assert.equal(res2014.difficulty, 'easy')

  // Small party (<3 PCs) shifts multiplier tier up (4 monsters -> x2.5); 2x L5 deadly = 2200, hard = 1500 -> 2000 = hard
  const smallParty = calculateEncounterBudget([{ name: 'Bugbear', cr: '1', count: 4 }], { size: 2, level: 5 }, '2014')
  assert.equal(smallParty.multiplier, 2.5)
  assert.equal(smallParty.adjustedXp, 2000)
  assert.equal(smallParty.difficulty, 'hard')

  // 4x level 5 PCs in 2024: low 2000, moderate 3000, high 4400 (no multiplier)
  const res2024 = calculateEncounterBudget([{ name: 'Goblin Boss', cr: '1', count: 4 }], { size: 4, level: 5 }, '2024')
  assert.equal(res2024.multiplier, 1)
  assert.equal(res2024.adjustedXp, 800)
  assert.equal(res2024.difficulty, 'trivial')

  const high2024 = calculateEncounterBudget([{ name: 'Adult Dragon', cr: '10', count: 1 }], { size: 4, level: 5 }, '2024')
  assert.equal(high2024.rawXp, 5900)
  assert.equal(high2024.difficulty, 'high')
})

test('F1.3: Encounter JSON export/import roundtrip sanitizes prototype keys and renders Markdown table', () => {
  const m = defaultMonster()
  m.name = 'Goblin|Scout'
  m.CR = '1/4'
  m.AC = 15
  m.HP = { HD: 2, type: 6, modifier: 0 }

  const c1 = createCombatantFromMonster(m, 14)
  const c2 = createCombatantFromMonster(m, 9)
  c2.id = c1.id // Force duplicate ID to test deduplication on import
  const budget = calculateEncounterBudget([{ name: m.name, cr: m.CR, count: 2 }], { size: 4, level: 3 }, '2024')
  const roster = buildEncounterSummaryJson([c1, c2], budget, 'Ambush')

  const serialized = JSON.stringify(roster)
  const injected = JSON.parse(serialized) as Record<string, unknown>
  Object.defineProperty(injected, '__proto__', { value: { polluted: true }, enumerable: true })

  const parsed = parseEncounterSummaryJson(injected)
  assert.equal(parsed.ok, true)
  if (parsed.ok) {
    assert.equal(parsed.roster.combatants.length, 2)
    assert.notEqual(parsed.roster.combatants[0].id, parsed.roster.combatants[1].id)
    assert.equal(Object.hasOwn(parsed.roster, 'polluted'), false)
  }

  const md = buildEncounterMarkdown([c1], budget, 'Ambush')
  assert.ok(md.includes('## Ambush'))
  assert.ok(md.includes('Goblin\\|Scout'))
  assert.ok(md.includes('Ruleset:** 2024'))
})
