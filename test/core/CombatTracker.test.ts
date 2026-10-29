import test from 'node:test'
import assert from 'node:assert'
import {
  applyDamage,
  applyHealing,
  createCombatantFromMonster,
  createCombatantFromCharacter,
  sortInitiative,
  toggleCondition,
  advanceTurn,
  previousTurn,
  recordDeathSave,
} from '../../src/core/usecases/CombatTracker.ts'
import { defaultMonster, defaultCharacterActor } from '../../src/core/domain/types.ts'

test('CombatTracker - Damage absorption through Temp HP, Healing, and Conditions', () => {
  const monster = defaultMonster()
  monster.HP = { HD: 5, type: 8, modifier: 10 } // 5d8 + 10 = 22 + 10 = 32 HP

  const combatant = createCombatantFromMonster(monster, 14)
  assert.strictEqual(combatant.maxHp, 32)
  assert.strictEqual(combatant.currentHp, 32)
  assert.strictEqual(combatant.initiative, 14)

  // 1. Give 10 Temp HP
  combatant.tempHp = 10

  // 2. Take 15 damage (10 from temp, 5 from current HP)
  const dmg1 = applyDamage(combatant, 15)
  assert.strictEqual(dmg1.remainingHp, 27)
  assert.strictEqual(combatant.tempHp, 0)
  assert.strictEqual(combatant.currentHp, 27)
  assert.strictEqual(dmg1.unconscious, false)

  // 3. Take lethal damage (30 damage on 27 HP)
  const dmg2 = applyDamage(combatant, 30)
  assert.strictEqual(dmg2.remainingHp, 0)
  assert.strictEqual(dmg2.unconscious, true)
  assert.ok(combatant.conditions.includes('Unconscious'))

  // 4. Overkill damage check: HP cannot drop below 0
  const dmg3 = applyDamage(combatant, 50)
  assert.strictEqual(dmg3.remainingHp, 0)
  assert.strictEqual(combatant.currentHp, 0)

  // 5. Heal 10 HP revives from unconscious
  const heal1 = applyHealing(combatant, 10)
  assert.strictEqual(heal1.remainingHp, 10)
  assert.strictEqual(combatant.currentHp, 10)
  assert.ok(!combatant.conditions.includes('Unconscious'))

  // 6. Overheal check: HP cannot exceed maxHp
  const heal2 = applyHealing(combatant, 500)
  assert.strictEqual(heal2.remainingHp, 32)
  assert.strictEqual(combatant.currentHp, 32)

  // 7. Toggle Condition
  const added = toggleCondition(combatant, 'Poisoned')
  assert.strictEqual(added, true)
  assert.ok(combatant.conditions.includes('Poisoned'))

  const removed = toggleCondition(combatant, 'Poisoned')
  assert.strictEqual(removed, false)
  assert.ok(!combatant.conditions.includes('Poisoned'))
})

test('CombatTracker - Initiative Sorting', () => {
  const c1 = { id: '1', name: 'Goblin', initiative: 8, currentHp: 7, maxHp: 7, tempHp: 0, conditions: [], deathSaves: { successes: 0, failures: 0 }, isMonster: true }
  const c2 = { id: '2', name: 'Rogue', initiative: 22, currentHp: 18, maxHp: 18, tempHp: 0, conditions: [], deathSaves: { successes: 0, failures: 0 }, isMonster: false }
  const c3 = { id: '3', name: 'Cleric', initiative: 14, currentHp: 24, maxHp: 24, tempHp: 0, conditions: [], deathSaves: { successes: 0, failures: 0 }, isMonster: false }

  const sorted = sortInitiative([c1, c2, c3])
  assert.strictEqual(sorted[0].name, 'Rogue')
  assert.strictEqual(sorted[1].name, 'Cleric')
  assert.strictEqual(sorted[2].name, 'Goblin')
})

test('CombatTracker - Create combatant from CharacterActor', () => {
  const char = defaultCharacterActor()
  char.name = 'Eldrin the Mage'
  char.hp = { current: 18, max: 24, temp: 5 }

  const combatant = createCombatantFromCharacter(char, 16)
  assert.strictEqual(combatant.name, 'Eldrin the Mage')
  assert.strictEqual(combatant.currentHp, 18)
  assert.strictEqual(combatant.maxHp, 24)
  assert.strictEqual(combatant.tempHp, 5)
  assert.strictEqual(combatant.initiative, 16)
  assert.strictEqual(combatant.isMonster, false)
})

test('CombatTracker - Advance and Previous Turn Lifecycle across rounds', () => {
  const total = 3

  // Round 1, turn 0
  let state = { turnIndex: 0, round: 1 }

  // Turn 0 -> 1
  state = advanceTurn(state.turnIndex, state.round, total)
  assert.strictEqual(state.turnIndex, 1)
  assert.strictEqual(state.round, 1)

  // Turn 1 -> 2
  state = advanceTurn(state.turnIndex, state.round, total)
  assert.strictEqual(state.turnIndex, 2)
  assert.strictEqual(state.round, 1)

  // Turn 2 -> Round boundary -> Turn 0, Round 2
  state = advanceTurn(state.turnIndex, state.round, total)
  assert.strictEqual(state.turnIndex, 0)
  assert.strictEqual(state.round, 2)

  // Reverse back across boundary: Turn 0, Round 2 -> Turn 2, Round 1
  state = previousTurn(state.turnIndex, state.round, total)
  assert.strictEqual(state.turnIndex, 2)
  assert.strictEqual(state.round, 1)

  // Reverse at start of combat: cannot go before Turn 0, Round 1
  state = previousTurn(0, 1, total)
  assert.strictEqual(state.turnIndex, 0)
  assert.strictEqual(state.round, 1)
})

test('CombatTracker - Death Save progression and stabilization/death thresholds', () => {
  const c = {
    id: 'hero-1',
    name: 'Fallen Knight',
    initiative: 10,
    currentHp: 0,
    maxHp: 20,
    tempHp: 0,
    conditions: ['Unconscious'],
    deathSaves: { successes: 0, failures: 0 },
    isMonster: false,
  }

  // Success 1
  let res = recordDeathSave(c, 'success')
  assert.strictEqual(res.successes, 1)
  assert.strictEqual(res.stabilized, false)
  assert.strictEqual(res.dead, false)

  // Success 2
  res = recordDeathSave(c, 'success')
  assert.strictEqual(res.successes, 2)
  assert.strictEqual(res.stabilized, false)

  // Success 3 -> Stabilized!
  res = recordDeathSave(c, 'success')
  assert.strictEqual(res.successes, 3)
  assert.strictEqual(res.stabilized, true)
  assert.strictEqual(res.dead, false)

  // Reset saves and test death threshold
  c.deathSaves = { successes: 0, failures: 0 }
  recordDeathSave(c, 'failure')
  recordDeathSave(c, 'failure')
  res = recordDeathSave(c, 'failure')
  assert.strictEqual(res.failures, 3)
  assert.strictEqual(res.dead, true)
})
