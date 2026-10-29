import { avgHP } from '../domain/math-utils.ts'
import type { Monster, CharacterActor } from '../domain/types.ts'

export interface Combatant {
  id: string
  name: string
  initiative: number
  currentHp: number
  maxHp: number
  tempHp: number
  conditions: string[]
  deathSaves: {
    successes: number
    failures: number
  }
  isMonster: boolean
}

export function createCombatantFromMonster(
  monster: Monster,
  initiative = 10
): Combatant {
  const hp = avgHP(monster.HP)
  return {
    id: monster.id || `monster-${Date.now()}`,
    name: monster.nickname || monster.name,
    initiative,
    currentHp: hp,
    maxHp: hp,
    tempHp: 0,
    conditions: [],
    deathSaves: {
      successes: 0,
      failures: 0,
    },
    isMonster: true,
  }
}

export function createCombatantFromCharacter(
  character: CharacterActor,
  initiative = 10
): Combatant {
  return {
    id: character.id || `char-${Date.now()}`,
    name: character.name,
    initiative,
    currentHp: character.hp.current,
    maxHp: character.hp.max,
    tempHp: character.hp.temp,
    conditions: [],
    deathSaves: {
      successes: character.deathSaves.successes,
      failures: character.deathSaves.failures,
    },
    isMonster: false,
  }
}

export function applyDamage(
  combatant: Combatant,
  amount: number
): { netDamage: number; remainingHp: number; unconscious: boolean } {
  const damage = Math.max(0, amount)
  let remainingDamage = damage

  // 1. Temp HP absorbs first
  if (combatant.tempHp > 0) {
    if (combatant.tempHp >= remainingDamage) {
      combatant.tempHp -= remainingDamage
      remainingDamage = 0
    } else {
      remainingDamage -= combatant.tempHp
      combatant.tempHp = 0
    }
  }

  // 2. Subtract remainder from current HP
  combatant.currentHp = Math.max(0, combatant.currentHp - remainingDamage)

  const unconscious = combatant.currentHp === 0
  if (unconscious && !combatant.conditions.includes('Unconscious')) {
    combatant.conditions.push('Unconscious')
  }

  return {
    netDamage: damage,
    remainingHp: combatant.currentHp,
    unconscious,
  }
}

export function applyHealing(
  combatant: Combatant,
  amount: number
): { remainingHp: number } {
  const heal = Math.max(0, amount)
  combatant.currentHp = Math.min(combatant.maxHp, combatant.currentHp + heal)

  if (combatant.currentHp > 0) {
    combatant.conditions = combatant.conditions.filter((c) => c !== 'Unconscious')
  }

  return {
    remainingHp: combatant.currentHp,
  }
}

export function toggleCondition(combatant: Combatant, condition: string): boolean {
  const index = combatant.conditions.indexOf(condition)
  if (index >= 0) {
    combatant.conditions.splice(index, 1)
    return false
  } else {
    combatant.conditions.push(condition)
    return true
  }
}

export function sortInitiative(combatants: Combatant[]): Combatant[] {
  return [...combatants].sort((a, b) => b.initiative - a.initiative)
}

export function advanceTurn(
  turnIndex: number,
  round: number,
  totalCombatants: number
): { turnIndex: number; round: number } {
  if (totalCombatants <= 0) return { turnIndex: 0, round }
  let nextIdx = turnIndex + 1
  let nextRound = round
  if (nextIdx >= totalCombatants) {
    nextIdx = 0
    nextRound += 1
  }
  return { turnIndex: nextIdx, round: nextRound }
}

export function previousTurn(
  turnIndex: number,
  round: number,
  totalCombatants: number
): { turnIndex: number; round: number } {
  if (totalCombatants <= 0) return { turnIndex: 0, round }
  let prevIdx = turnIndex - 1
  let prevRound = round
  if (prevIdx < 0) {
    if (prevRound > 1) {
      prevRound -= 1
      prevIdx = totalCombatants - 1
    } else {
      prevIdx = 0
    }
  }
  return { turnIndex: prevIdx, round: prevRound }
}

export function recordDeathSave(
  combatant: Combatant,
  result: 'success' | 'failure'
): { successes: number; failures: number; stabilized: boolean; dead: boolean } {
  if (result === 'success') {
    combatant.deathSaves.successes = Math.min(3, combatant.deathSaves.successes + 1)
  } else {
    combatant.deathSaves.failures = Math.min(3, combatant.deathSaves.failures + 1)
  }

  const stabilized = combatant.deathSaves.successes >= 3
  const dead = combatant.deathSaves.failures >= 3

  return {
    successes: combatant.deathSaves.successes,
    failures: combatant.deathSaves.failures,
    stabilized,
    dead,
  }
}
