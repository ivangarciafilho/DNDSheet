import { v4 as uuidv4 } from 'uuid'
import { avgHP } from '../domain/math-utils.ts'
import type { Monster, CharacterActor } from '../domain/types.ts'

export interface CombatantSnapshot {
  sourceKind: 'monster' | 'character' | 'custom'
  sourceDocumentId?: string
  sourceRevision?: number
  name: string
  ac: number
  maxHp: number
  hpFormula?: string
  stats?: Record<string, number>
  monsterSnapshot?: Monster
  characterSnapshot?: CharacterActor
}

export interface Combatant {
  id: string
  sourceDocumentId?: string
  sourceRevision?: number
  sourceKind?: 'monster' | 'character' | 'custom'
  sourceSnapshot?: CombatantSnapshot
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

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value))
}

export interface CombatantSourceMeta {
  sourceDocumentId?: string
  sourceRevision?: number
}

export function createCombatantFromMonster(
  monster: Monster,
  initiative = 10,
  meta: CombatantSourceMeta = {},
): Combatant {
  const cloned = deepClone(monster)
  const hp = avgHP(cloned.HP)
  const hpFormula = `${cloned.HP.HD}d${cloned.HP.type}${
    cloned.HP.modifier ? (cloned.HP.modifier > 0 ? ` + ${cloned.HP.modifier}` : ` - ${Math.abs(cloned.HP.modifier)}`) : ''
  }`
  const sourceDocumentId = meta.sourceDocumentId ?? cloned.id
  return {
    id: `cbt-${uuidv4()}`,
    sourceDocumentId,
    sourceRevision: meta.sourceRevision,
    sourceKind: 'monster',
    sourceSnapshot: {
      sourceKind: 'monster',
      sourceDocumentId,
      sourceRevision: meta.sourceRevision,
      name: cloned.nickname || cloned.name,
      ac: cloned.AC,
      maxHp: hp,
      hpFormula,
      stats: { ...cloned.stats },
      monsterSnapshot: cloned,
    },
    name: cloned.nickname || cloned.name,
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

import { characterVitals } from '../domain/character-truth.ts'

export function createCombatantFromCharacter(
  character: CharacterActor,
  initiative = 10,
  meta: CombatantSourceMeta = {},
): Combatant {
  const cloned = deepClone(character)
  const sourceDocumentId = meta.sourceDocumentId ?? cloned.id
  const ac = characterVitals(cloned).armorClass.value
  return {
    id: `cbt-${uuidv4()}`,
    sourceDocumentId,
    sourceRevision: meta.sourceRevision,
    sourceKind: 'character',
    sourceSnapshot: {
      sourceKind: 'character',
      sourceDocumentId,
      sourceRevision: meta.sourceRevision,
      name: cloned.name,
      ac,
      maxHp: cloned.hp.max,
      stats: { ...cloned.stats },
      characterSnapshot: cloned,
    },
    name: cloned.name,
    initiative,
    currentHp: cloned.hp.current,
    maxHp: cloned.hp.max,
    tempHp: cloned.hp.temp,
    conditions: [],
    deathSaves: {
      successes: cloned.deathSaves.successes,
      failures: cloned.deathSaves.failures,
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

export function migrateActiveTurnIndex(
  sortedNext: readonly Combatant[],
  activeCombatantId: string | null | undefined,
  fallbackIndex = 0,
): { activeTurnIndex: number; activeCombatantId: string | null } {
  if (sortedNext.length === 0) {
    return { activeTurnIndex: 0, activeCombatantId: null }
  }
  if (activeCombatantId) {
    const idx = sortedNext.findIndex((c) => c.id === activeCombatantId)
    if (idx >= 0) {
      return { activeTurnIndex: idx, activeCombatantId }
    }
  }
  const safeIdx = Math.max(0, Math.min(sortedNext.length - 1, fallbackIndex))
  return {
    activeTurnIndex: safeIdx,
    activeCombatantId: sortedNext[safeIdx]?.id ?? null,
  }
}

export function addCombatantPreserveTurn(
  combatants: readonly Combatant[],
  added: Combatant,
  activeCombatantId: string | null | undefined,
  activeTurnIndex: number,
): {
  combatants: Combatant[]
  activeTurnIndex: number
  activeCombatantId: string | null
  isEncounterActive: boolean
} {
  const beforeSorted = sortInitiative([...combatants])
  const currentActorId = beforeSorted.length
    ? (activeCombatantId ?? beforeSorted[activeTurnIndex % beforeSorted.length]?.id ?? null)
    : added.id
  const nextList = [...combatants, added]
  const nextSorted = sortInitiative(nextList)
  const migrated = migrateActiveTurnIndex(nextSorted, currentActorId, activeTurnIndex)
  return {
    combatants: nextList,
    activeTurnIndex: migrated.activeTurnIndex,
    activeCombatantId: migrated.activeCombatantId,
    isEncounterActive: true,
  }
}

export function setInitiativePreserveTurn(
  combatants: readonly Combatant[],
  combatantId: string,
  nextInitiative: number,
  activeCombatantId: string | null | undefined,
  activeTurnIndex: number,
): {
  combatants: Combatant[]
  activeTurnIndex: number
  activeCombatantId: string | null
} {
  const beforeSorted = sortInitiative([...combatants])
  const currentActorId = beforeSorted.length
    ? (activeCombatantId ?? beforeSorted[activeTurnIndex % beforeSorted.length]?.id ?? null)
    : null
  const updated = combatants.map((c) =>
    c.id === combatantId && Number.isFinite(nextInitiative)
      ? { ...c, initiative: Math.trunc(nextInitiative) }
      : c,
  )
  const nextSorted = sortInitiative(updated)
  const migrated = migrateActiveTurnIndex(nextSorted, currentActorId, activeTurnIndex)
  return {
    combatants: updated,
    activeTurnIndex: migrated.activeTurnIndex,
    activeCombatantId: migrated.activeCombatantId,
  }
}

export function removeCombatantPreserveTurn(
  combatants: readonly Combatant[],
  removeId: string,
  activeTurnIndex: number,
  currentRound: number,
  activeCombatantId?: string | null,
): {
  combatants: Combatant[]
  activeTurnIndex: number
  currentRound: number
  activeCombatantId: string | null
  isEncounterActive: boolean
} {
  const beforeSorted = sortInitiative([...combatants])
  const safeBeforeIdx = beforeSorted.length ? activeTurnIndex % beforeSorted.length : 0
  const effectiveActiveId = activeCombatantId ?? beforeSorted[safeBeforeIdx]?.id ?? null
  const remaining = combatants.filter((c) => c.id !== removeId)
  if (remaining.length === 0) {
    return {
      combatants: [],
      activeTurnIndex: 0,
      currentRound: 1,
      activeCombatantId: null,
      isEncounterActive: false,
    }
  }
  const afterSorted = sortInitiative(remaining)
  if (effectiveActiveId && effectiveActiveId !== removeId) {
    const nextIdx = afterSorted.findIndex((c) => c.id === effectiveActiveId)
    if (nextIdx >= 0) {
      return {
        combatants: remaining,
        activeTurnIndex: nextIdx,
        currentRound,
        activeCombatantId: effectiveActiveId,
        isEncounterActive: true,
      }
    }
  }
  // If the active combatant itself was removed, stay on the slot filling its position cleanly.
  const nextIdx = Math.min(safeBeforeIdx, afterSorted.length - 1)
  return {
    combatants: remaining,
    activeTurnIndex: nextIdx,
    currentRound,
    activeCombatantId: afterSorted[nextIdx]?.id ?? null,
    isEncounterActive: true,
  }
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
