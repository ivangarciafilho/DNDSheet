import type { DndStat } from '../domain/types.ts'

// Standard Full Caster Progression (Levels 1 to 20, 9 spell levels)
export const FULL_CASTER_SLOTS: number[][] = [
  [], // level 0 (unused)
  [2, 0, 0, 0, 0, 0, 0, 0, 0], // level 1
  [3, 0, 0, 0, 0, 0, 0, 0, 0], // level 2
  [4, 2, 0, 0, 0, 0, 0, 0, 0], // level 3
  [4, 3, 0, 0, 0, 0, 0, 0, 0], // level 4
  [4, 3, 2, 0, 0, 0, 0, 0, 0], // level 5
  [4, 3, 3, 0, 0, 0, 0, 0, 0], // level 6
  [4, 3, 3, 1, 0, 0, 0, 0, 0], // level 7
  [4, 3, 3, 2, 0, 0, 0, 0, 0], // level 8
  [4, 3, 3, 3, 1, 0, 0, 0, 0], // level 9
  [4, 3, 3, 3, 2, 0, 0, 0, 0], // level 10
  [4, 3, 3, 3, 2, 1, 0, 0, 0], // level 11
  [4, 3, 3, 3, 2, 1, 0, 0, 0], // level 12
  [4, 3, 3, 3, 2, 1, 1, 0, 0], // level 13
  [4, 3, 3, 3, 2, 1, 1, 0, 0], // level 14
  [4, 3, 3, 3, 2, 1, 1, 1, 0], // level 15
  [4, 3, 3, 3, 2, 1, 1, 1, 0], // level 16
  [4, 3, 3, 3, 2, 1, 1, 1, 1], // level 17
  [4, 3, 3, 3, 3, 1, 1, 1, 1], // level 18
  [4, 3, 3, 3, 3, 2, 1, 1, 1], // level 19
  [4, 3, 3, 3, 3, 2, 2, 1, 1], // level 20
]

export const HALF_CASTER_SLOTS: number[][] = [
  [],
  [0, 0, 0, 0, 0, 0, 0, 0, 0], // level 1
  [2, 0, 0, 0, 0, 0, 0, 0, 0], // level 2
  [3, 0, 0, 0, 0, 0, 0, 0, 0], // level 3
  [3, 0, 0, 0, 0, 0, 0, 0, 0], // level 4
  [4, 2, 0, 0, 0, 0, 0, 0, 0], // level 5
  [4, 2, 0, 0, 0, 0, 0, 0, 0], // level 6
  [4, 3, 0, 0, 0, 0, 0, 0, 0], // level 7
  [4, 3, 0, 0, 0, 0, 0, 0, 0], // level 8
  [4, 3, 2, 0, 0, 0, 0, 0, 0], // level 9
  [4, 3, 2, 0, 0, 0, 0, 0, 0], // level 10
  [4, 3, 3, 0, 0, 0, 0, 0, 0], // level 11
  [4, 3, 3, 0, 0, 0, 0, 0, 0], // level 12
  [4, 3, 3, 1, 0, 0, 0, 0, 0], // level 13
  [4, 3, 3, 1, 0, 0, 0, 0, 0], // level 14
  [4, 3, 3, 2, 0, 0, 0, 0, 0], // level 15
  [4, 3, 3, 2, 0, 0, 0, 0, 0], // level 16
  [4, 3, 3, 3, 1, 0, 0, 0, 0], // level 17
  [4, 3, 3, 3, 1, 0, 0, 0, 0], // level 18
  [4, 3, 3, 3, 2, 0, 0, 0, 0], // level 19
  [4, 3, 3, 3, 2, 0, 0, 0, 0], // level 20
]

/** SRD 5.2.1 (2024) half casters begin Spellcasting at class level 1 with 2 1st-level slots. */
export const HALF_CASTER_2024_SLOTS: number[][] = [
  [],
  [2, 0, 0, 0, 0, 0, 0, 0, 0], // level 1
  ...HALF_CASTER_SLOTS.slice(2),
]

export const SRD_2024_PREPARED_TABLES: Record<string, readonly number[]> = {
  wizard:   [4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 19, 20, 21, 22, 25],
  cleric:   [4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 19, 20, 21, 22, 22],
  druid:    [4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 19, 20, 21, 22, 22],
  bard:     [4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 19, 20, 21, 22, 22],
  sorcerer: [2, 4, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 19, 20, 21, 22, 22],
  warlock:  [2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15],
  paladin:  [2, 3, 4, 5, 6, 6, 7, 7, 9, 9, 10, 10, 11, 11, 12, 12, 14, 14, 15, 15],
  ranger:   [2, 3, 4, 5, 6, 6, 7, 7, 9, 9, 10, 10, 11, 11, 12, 12, 14, 14, 15, 15],
}

export const WARLOCK_PACT_SLOTS: number[][] = [
  [],
  [1, 0, 0, 0, 0, 0, 0, 0, 0], // level 1
  [2, 0, 0, 0, 0, 0, 0, 0, 0], // level 2
  [0, 2, 0, 0, 0, 0, 0, 0, 0], // level 3
  [0, 2, 0, 0, 0, 0, 0, 0, 0], // level 4
  [0, 0, 2, 0, 0, 0, 0, 0, 0], // level 5
  [0, 0, 2, 0, 0, 0, 0, 0, 0], // level 6
  [0, 0, 0, 2, 0, 0, 0, 0, 0], // level 7
  [0, 0, 0, 2, 0, 0, 0, 0, 0], // level 8
  [0, 0, 0, 0, 2, 0, 0, 0, 0], // level 9
  [0, 0, 0, 0, 2, 0, 0, 0, 0], // level 10
  [0, 0, 0, 0, 3, 0, 0, 0, 0], // level 11
  [0, 0, 0, 0, 3, 0, 0, 0, 0], // level 12
  [0, 0, 0, 0, 3, 0, 0, 0, 0], // level 13
  [0, 0, 0, 0, 3, 0, 0, 0, 0], // level 14
  [0, 0, 0, 0, 3, 0, 0, 0, 0], // level 15
  [0, 0, 0, 0, 3, 0, 0, 0, 0], // level 16
  [0, 0, 0, 0, 4, 0, 0, 0, 0], // level 17
  [0, 0, 0, 0, 4, 0, 0, 0, 0], // level 18
  [0, 0, 0, 0, 4, 0, 0, 0, 0], // level 19
  [0, 0, 0, 0, 4, 0, 0, 0, 0], // level 20
]

export const ARTIFICER_SLOTS: number[][] = [
  [],
  [2, 0, 0, 0, 0, 0, 0, 0, 0], // level 1
  [2, 0, 0, 0, 0, 0, 0, 0, 0], // level 2
  [3, 0, 0, 0, 0, 0, 0, 0, 0], // level 3
  [3, 0, 0, 0, 0, 0, 0, 0, 0], // level 4
  [4, 2, 0, 0, 0, 0, 0, 0, 0], // level 5
  [4, 2, 0, 0, 0, 0, 0, 0, 0], // level 6
  [4, 3, 0, 0, 0, 0, 0, 0, 0], // level 7
  [4, 3, 0, 0, 0, 0, 0, 0, 0], // level 8
  [4, 3, 2, 0, 0, 0, 0, 0, 0], // level 9
  [4, 3, 2, 0, 0, 0, 0, 0, 0], // level 10
  [4, 3, 3, 0, 0, 0, 0, 0, 0], // level 11
  [4, 3, 3, 0, 0, 0, 0, 0, 0], // level 12
  [4, 3, 3, 1, 0, 0, 0, 0, 0], // level 13
  [4, 3, 3, 1, 0, 0, 0, 0, 0], // level 14
  [4, 3, 3, 2, 0, 0, 0, 0, 0], // level 15
  [4, 3, 3, 2, 0, 0, 0, 0, 0], // level 16
  [4, 3, 3, 3, 1, 0, 0, 0, 0], // level 17
  [4, 3, 3, 3, 1, 0, 0, 0, 0], // level 18
  [4, 3, 3, 3, 2, 0, 0, 0, 0], // level 19
  [4, 3, 3, 3, 2, 0, 0, 0, 0], // level 20
]

export const THIRD_CASTER_SLOTS: number[][] = [
  [],
  [0, 0, 0, 0, 0, 0, 0, 0, 0], // 1
  [0, 0, 0, 0, 0, 0, 0, 0, 0], // 2
  [2, 0, 0, 0, 0, 0, 0, 0, 0], // 3
  [3, 0, 0, 0, 0, 0, 0, 0, 0], // 4
  [3, 0, 0, 0, 0, 0, 0, 0, 0], // 5
  [3, 0, 0, 0, 0, 0, 0, 0, 0], // 6
  [4, 2, 0, 0, 0, 0, 0, 0, 0], // 7
  [4, 2, 0, 0, 0, 0, 0, 0, 0], // 8
  [4, 2, 0, 0, 0, 0, 0, 0, 0], // 9
  [4, 3, 0, 0, 0, 0, 0, 0, 0], // 10
  [4, 3, 0, 0, 0, 0, 0, 0, 0], // 11
  [4, 3, 0, 0, 0, 0, 0, 0, 0], // 12
  [4, 3, 2, 0, 0, 0, 0, 0, 0], // 13
  [4, 3, 2, 0, 0, 0, 0, 0, 0], // 14
  [4, 3, 2, 0, 0, 0, 0, 0, 0], // 15
  [4, 3, 3, 0, 0, 0, 0, 0, 0], // 16
  [4, 3, 3, 0, 0, 0, 0, 0, 0], // 17
  [4, 3, 3, 0, 0, 0, 0, 0, 0], // 18
  [4, 3, 3, 1, 0, 0, 0, 0, 0], // 19
  [4, 3, 3, 1, 0, 0, 0, 0, 0], // 20
]

export const CLASS_DEFAULT_STAT: Record<string, DndStat> = {
  Wizard: 'INT',
  Artificer: 'INT',
  Cleric: 'WIS',
  Druid: 'WIS',
  Ranger: 'WIS',
  Bard: 'CHA',
  Sorcerer: 'CHA',
  Warlock: 'CHA',
  Paladin: 'CHA',
}

/** Unknown systems remain authored sources; they never inherit Wizard progression. */
export function spellcastingRuleClass(className: string, subclass = ''): string | undefined {
  const name = (className || '').trim().toLowerCase()
  const sub = subclass.toLowerCase()
  if (['artificer','bard','cleric','druid','paladin','ranger','sorcerer','warlock','wizard'].includes(name)) return name
  if ((name === 'fighter' && sub.includes('eldritch knight')) || (name === 'rogue' && sub.includes('arcane trickster')) || name.includes('eldritch knight') || name.includes('arcane trickster') || name === 'third caster') return 'third caster'
  return undefined
}

export function getSpellSlotsForClass(className: string, level: number, ruleset: '2014' | '2024' = '2014'): number[] {
  const clampedLevel = Math.max(1, Math.min(20, level))
  const lower = spellcastingRuleClass(className)
  if (!lower) return Array(9).fill(0)

  if (lower === 'paladin' || lower === 'ranger') {
    const table = ruleset === '2024' ? HALF_CASTER_2024_SLOTS : HALF_CASTER_SLOTS
    return [...(table[clampedLevel] || [0, 0, 0, 0, 0, 0, 0, 0, 0])]
  }
  if (lower === 'warlock') {
    return [...(WARLOCK_PACT_SLOTS[clampedLevel] || [0, 0, 0, 0, 0, 0, 0, 0, 0])]
  }
  if (lower === 'artificer') {
    return [...(ARTIFICER_SLOTS[clampedLevel] || [0, 0, 0, 0, 0, 0, 0, 0, 0])]
  }
  if (lower === 'third caster' || lower.includes('third')) {
    return [...(THIRD_CASTER_SLOTS[clampedLevel] || [0, 0, 0, 0, 0, 0, 0, 0, 0])]
  }

  return [...(FULL_CASTER_SLOTS[clampedLevel] || [0, 0, 0, 0, 0, 0, 0, 0, 0])]
}

export function resolveDefaultStatForClass(className?: string, subclass = ''): DndStat | undefined {
  const clean = (className || '').trim().toLowerCase()
  if (!clean) return undefined
  for (const [key, stat] of Object.entries(CLASS_DEFAULT_STAT)) {
    if (key.toLowerCase() === clean) return stat
  }
  const sub = subclass.trim().toLowerCase()
  if ((clean === 'fighter' && sub.includes('eldritch knight')) || (clean === 'rogue' && sub.includes('arcane trickster')) || clean.includes('eldritch knight') || clean.includes('arcane trickster')) {
    return 'INT'
  }
  return undefined
}

export function getDefaultStatForClass(className: string): DndStat {
  return resolveDefaultStatForClass(className) ?? 'INT'
}
