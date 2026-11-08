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
