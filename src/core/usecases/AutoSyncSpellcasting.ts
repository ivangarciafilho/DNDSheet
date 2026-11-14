import { statModifier } from '../domain/math-utils.ts'
import type { DndStat, Monster } from '../domain/types.ts'

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

export function getSpellSlotsForClass(className: string, level: number): number[] {
  const clampedLevel = Math.max(1, Math.min(20, level))
  const lower = className.toLowerCase()

  if (lower === 'paladin' || lower === 'ranger') {
    return [...(HALF_CASTER_SLOTS[clampedLevel] || [0, 0, 0, 0, 0, 0, 0, 0, 0])]
  }
  if (lower === 'warlock') {
    return [...(WARLOCK_PACT_SLOTS[clampedLevel] || [0, 0, 0, 0, 0, 0, 0, 0, 0])]
  }
  if (lower === 'artificer') {
    return [...(ARTIFICER_SLOTS[clampedLevel] || [0, 0, 0, 0, 0, 0, 0, 0, 0])]
  }
  if (lower.includes('eldritch') || lower.includes('trickster') || lower.includes('third')) {
    return [...(THIRD_CASTER_SLOTS[clampedLevel] || [0, 0, 0, 0, 0, 0, 0, 0, 0])]
  }

  return [...(FULL_CASTER_SLOTS[clampedLevel] || [0, 0, 0, 0, 0, 0, 0, 0, 0])]
}

export function getDefaultStatForClass(className: string): DndStat {
  return CLASS_DEFAULT_STAT[className] || 'INT'
}

export interface SpellcastingMetrics {
  cantripsKnown: number
  preparedSpells: number
  highestSlot: number
  casterType: 'full' | 'half' | 'third' | 'pact' | 'artificer'
}

/**
 * Calculates 5e standard metrics: known cantrips, prepared spells count, highest slot available.
 */
export function calculateSpellcastingMetrics(
  className: string,
  level: number,
  statMod = 0
): SpellcastingMetrics {
  const lower = (className || 'Wizard').toLowerCase()
  const lvl = Math.max(1, Math.min(20, level || 1))

  let cantripsKnown = 3
  let preparedSpells = Math.max(1, lvl + statMod)
  let highestSlot = Math.min(9, Math.ceil(lvl / 2))
  let casterType: SpellcastingMetrics['casterType'] = 'full'

  if (lower === 'sorcerer') {
    cantripsKnown = lvl >= 10 ? 6 : (lvl >= 4 ? 5 : 4)
    // Spells known table
    const sorcKnown = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 12, 13, 13, 14, 14, 15, 15, 15, 15]
    preparedSpells = sorcKnown[lvl - 1] || lvl
    casterType = 'full'
  } else if (lower === 'bard') {
    cantripsKnown = lvl >= 10 ? 4 : (lvl >= 4 ? 3 : 2)
    const bardKnown = [4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 15, 16, 18, 19, 19, 20, 22, 22, 22]
    preparedSpells = bardKnown[lvl - 1] || lvl
    casterType = 'full'
  } else if (lower === 'warlock') {
    cantripsKnown = lvl >= 10 ? 4 : (lvl >= 4 ? 3 : 2)
    const warlockKnown = [2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15]
    preparedSpells = warlockKnown[lvl - 1] || lvl
    highestSlot = Math.min(5, Math.ceil(lvl / 2))
    casterType = 'pact'
  } else if (lower === 'cleric' || lower === 'druid') {
    cantripsKnown = lvl >= 10 ? 5 : (lvl >= 4 ? 4 : 3)
    preparedSpells = Math.max(1, lvl + statMod)
    casterType = 'full'
  } else if (lower === 'paladin') {
    cantripsKnown = 0
    preparedSpells = Math.max(1, Math.floor(lvl / 2) + statMod)
    highestSlot = Math.min(5, Math.ceil(lvl / 4))
    casterType = 'half'
  } else if (lower === 'ranger') {
    cantripsKnown = 0
    const rangerKnown = [0, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11]
    preparedSpells = rangerKnown[lvl - 1] || Math.floor(lvl / 2)
    highestSlot = Math.min(5, Math.ceil(lvl / 4))
    casterType = 'half'
  } else if (lower === 'artificer') {
    cantripsKnown = lvl >= 14 ? 4 : (lvl >= 10 ? 3 : 2)
    preparedSpells = Math.max(1, Math.floor(lvl / 2) + statMod)
    highestSlot = Math.min(5, Math.ceil(lvl / 4))
    casterType = 'artificer'
  } else if (lower.includes('eldritch') || lower.includes('trickster')) {
    cantripsKnown = lvl >= 10 ? 3 : 2
    highestSlot = Math.min(4, Math.ceil(lvl / 6))
    casterType = 'third'
  } else {
    // Default Wizard
    cantripsKnown = lvl >= 10 ? 5 : (lvl >= 4 ? 4 : 3)
    preparedSpells = Math.max(1, lvl + statMod)
    highestSlot = Math.min(9, Math.ceil(lvl / 2))
    casterType = 'full'
  }

  return {
    cantripsKnown,
    preparedSpells,
    highestSlot,
    casterType,
  }
}

export interface ClassEntry {
  className: string
  subclass?: string
  level: number
  stat?: DndStat
}

export interface PerClassBreakdown {
  className: string
  subclass?: string
  level: number
  stat: DndStat
  saveDc: number
  spellAttack: number
  cantripsKnown: number
  preparedSpells: number
}

export interface MulticlassCalculationResult {
  combinedCasterLevel: number
  slots: number[]
  warlockSlots?: number[]
  primarySaveDc: number
  primarySpellAttack: number
  secondarySaveDc?: number
  secondarySpellAttack?: number
  classes?: PerClassBreakdown[]
  totalPreparedSpells?: number
  totalCantripsKnown?: number
  highestSlot?: number
}

export const SRD_SUBCLASSES_BY_CLASS: Record<string, string[]> = {
  Wizard: ['Evocation', 'Abjuration', 'Conjuration', 'Divination', 'Enchantment', 'Illusion', 'Necromancy', 'Transmutation', 'War Magic', 'Bladesinging', 'Chronurgy', 'Graviturgy', 'Order of Scribes'],
  Sorcerer: ['Draconic Bloodline', 'Wild Magic', 'Divine Soul', 'Shadow Magic', 'Storm Sorcery', 'Aberrant Mind', 'Clockwork Soul', 'Lunar Sorcery'],
  Warlock: ['Fiend', 'Great Old One', 'Archfey', 'Hexblade', 'Celestial', 'Fathomless', 'Genie', 'Undead', 'Undying'],
  Cleric: ['Life Domain', 'Light Domain', 'War Domain', 'Trickery Domain', 'Tempest Domain', 'Nature Domain', 'Knowledge Domain', 'Forge Domain', 'Grave Domain', 'Twilight Domain', 'Peace Domain', 'Death Domain', 'Order Domain', 'Arcana Domain'],
  Druid: ['Circle of the Land', 'Circle of the Moon', 'Circle of the Shepherd', 'Circle of Stars', 'Circle of Wildfire', 'Circle of Spores', 'Circle of Dreams'],
  Bard: ['College of Lore', 'College of Valor', 'College of Glamour', 'College of Swords', 'College of Whispers', 'College of Eloquence', 'College of Creation', 'College of Spirits'],
  Paladin: ['Oath of Devotion', 'Oath of the Ancients', 'Oath of Vengeance', 'Oath of Conquest', 'Oath of Redemption', 'Oath of the Watchers', 'Oath of Glory', 'Oath of the Crown', 'Oathbreaker'],
  Ranger: ['Hunter', 'Beast Master', 'Gloom Stalker', 'Horizon Walker', 'Monster Slayer', 'Fey Wanderer', 'Swarmkeeper', 'Drakewarden'],
  Artificer: ['Alchemist', 'Armorer', 'Artillerist', 'Battle Smith'],
  Rogue: ['Arcane Trickster', 'Assassin', 'Thief', 'Swashbuckler', 'Inquisitive', 'Mastermind', 'Scout', 'Soulknife', 'Phantom'],
  Fighter: ['Eldritch Knight', 'Battle Master', 'Champion', 'Cavalier', 'Samurai', 'Arcane Archer', 'Psi Warrior', 'Rune Knight', 'Echo Knight'],
  Monk: ['Way of the Four Elements', 'Way of Shadow', 'Way of the Open Hand', 'Way of the Drunken Master', 'Kensei', 'Sun Soul', 'Way of Mercy', 'Way of the Astral Self', 'Way of the Ascendant Dragon'],
  Barbarian: ['Path of Wild Magic', 'Path of the Zealot', 'Path of the Totem Warrior', 'Path of the Ancestral Guardian', 'Path of the Berserker', 'Path of the Storm Herald', 'Path of the Beast'],
  'Blood Hunter': ['Order of the Ghostslayer', 'Order of the Profane Soul', 'Order of the Mutant', 'Order of the Lycan'],
}

/** Case-insensitive subclass lookup supporting all 5e classes and formatting variations */
export function getSubclassesForClass(clsName?: string): string[] {
  if (!clsName) return SRD_SUBCLASSES_BY_CLASS.Wizard || []
  const clean = clsName.trim().toLowerCase()
  for (const [key, list] of Object.entries(SRD_SUBCLASSES_BY_CLASS)) {
    if (key.toLowerCase() === clean) return list
  }
  return []
}

/**
 * Standard 5e Multiclass spellcaster slot calculator & multi-class Save DC resolver.
 * Supports arbitrary number of classes and subclasses (e.g. Fiend Warlock, Evocation Wizard, Draconic Sorcerer).
 */
export function calculateMulticlassSpellcasting(
  primaryClassOrEntries: string | ClassEntry[],
  primaryLevelOrStats: number | Record<string, number>,
  secondaryClassOrProf?: string | number,
  secondaryLevel?: number,
  stats: Record<string, number> = {},
  proficiency = 2
): MulticlassCalculationResult {
  let classEntries: ClassEntry[] = []
  let effectiveStats = stats
  let effectiveProf = proficiency

  if (Array.isArray(primaryClassOrEntries)) {
    classEntries = primaryClassOrEntries
    if (typeof primaryLevelOrStats === 'object' && primaryLevelOrStats !== null) {
      effectiveStats = primaryLevelOrStats as Record<string, number>
    }
    if (typeof secondaryClassOrProf === 'number') {
      effectiveProf = secondaryClassOrProf
    }
  } else {
    const pClass = primaryClassOrEntries || 'Wizard'
    const pLvl = typeof primaryLevelOrStats === 'number' ? primaryLevelOrStats : 1
    classEntries.push({ className: pClass, level: pLvl })

    if (typeof secondaryClassOrProf === 'string' && secondaryLevel && secondaryLevel > 0) {
      classEntries.push({ className: secondaryClassOrProf, level: secondaryLevel })
    }
  }

  if (classEntries.length === 0) {
    classEntries.push({ className: 'Wizard', level: 1 })
  }

  // Contribution helper
  const getContribution = (cls: string, lvl: number) => {
    const l = (cls || '').toLowerCase()
    if (l === 'warlock') return 0 // Warlock pact magic stays separate
    if (l === 'paladin' || l === 'ranger') return Math.floor(lvl / 2)
    if (l === 'artificer') return Math.ceil(lvl / 2)
    if (l.includes('eldritch') || l.includes('trickster')) return Math.floor(lvl / 3)
    return lvl // Full caster
  }

  let combinedLevelSum = 0
  let warlockLevel = 0
  const breakdowns: PerClassBreakdown[] = []

  let totalPrepared = 0
  let totalCantrips = 0

  for (const entry of classEntries) {
    const cls = entry.className || 'Wizard'
    const lvl = Math.max(1, Math.min(20, entry.level || 1))
    const stat = entry.stat || getDefaultStatForClass(cls)
    const mod = statModifier(effectiveStats[stat] ?? 10)
    const saveDc = 8 + effectiveProf + mod
    const spellAttack = effectiveProf + mod

    const metrics = calculateSpellcastingMetrics(cls, lvl, mod)
    totalPrepared += metrics.preparedSpells
    totalCantrips += metrics.cantripsKnown

    if (cls.toLowerCase() === 'warlock') {
      warlockLevel += lvl
    } else {
      combinedLevelSum += getContribution(cls, lvl)
    }

    breakdowns.push({
      className: cls,
      subclass: entry.subclass,
      level: lvl,
      stat,
      saveDc,
      spellAttack,
      cantripsKnown: metrics.cantripsKnown,
      preparedSpells: metrics.preparedSpells,
    })
  }

  const combinedLevel = Math.max(1, Math.min(20, combinedLevelSum || (warlockLevel ? 1 : 1)))
  const slots = combinedLevelSum > 0 ? [...(FULL_CASTER_SLOTS[combinedLevel] || [0, 0, 0, 0, 0, 0, 0, 0, 0])] : [0, 0, 0, 0, 0, 0, 0, 0, 0]

  let warlockSlots: number[] | undefined
  if (warlockLevel > 0) {
    warlockSlots = [...(WARLOCK_PACT_SLOTS[Math.min(20, warlockLevel)] || [0, 0, 0, 0, 0, 0, 0, 0, 0])]
  }

  const primary = breakdowns[0] || { saveDc: 10, spellAttack: 2 }
  const secondary = breakdowns[1]

  let highestSlot = 0
  for (let i = slots.length - 1; i >= 0; i--) {
    if (slots[i] > 0) {
      highestSlot = Math.max(highestSlot, i + 1)
      break
    }
  }
  if (warlockSlots) {
    for (let i = warlockSlots.length - 1; i >= 0; i--) {
      if (warlockSlots[i] > 0) {
        highestSlot = Math.max(highestSlot, i + 1)
        break
      }
    }
  }

  return {
    combinedCasterLevel: combinedLevelSum > 0 ? combinedLevel : warlockLevel,
    slots: combinedLevelSum > 0 ? slots : (warlockSlots || slots),
    warlockSlots,
    primarySaveDc: primary.saveDc,
    primarySpellAttack: primary.spellAttack,
    secondarySaveDc: secondary?.saveDc,
    secondarySpellAttack: secondary?.spellAttack,
    classes: breakdowns,
    totalPreparedSpells: totalPrepared,
    totalCantripsKnown: totalCantrips,
    highestSlot,
  }
}

export function getCasterSource(className: string): 'Arcane' | 'Divine' | 'Primal' {
  const l = (className || '').toLowerCase()
  if (l.includes('cleric') || l.includes('paladin')) return 'Divine'
  if (l.includes('druid') || l.includes('ranger')) return 'Primal'
  return 'Arcane'
}

export const SPELL_POINTS_BY_LEVEL: number[] = [
  0,
  4, 6, 14, 17, 27, 32, 38, 44, 57, 64,
  73, 73, 83, 83, 94, 94, 107, 114, 123, 133
]

export function getMaxSlotLevelForClass(className: string, level: number): number {
  const slots = getSpellSlotsForClass(className, level)
  for (let s = slots.length - 1; s >= 0; s--) {
    if (slots[s] > 0) return s + 1
  }
  return 0
}

export function formatSpellcastingTitle(
  primaryClass = 'Wizard',
  primaryLevel = 1,
  secondaryClass?: string,
  secondaryLevel?: number,
  mode: 'class_names' | 'caster_source' | 'split_levels' = 'class_names'
): string {
  const pCls = primaryClass || 'Wizard'
  const pLvl = primaryLevel || 1

  if (mode === 'caster_source') {
    const src1 = getCasterSource(pCls)
    if (secondaryClass && secondaryLevel) {
      const src2 = getCasterSource(secondaryClass)
      return src1 === src2 ? `${src1} Caster` : `${src1} / ${src2} Caster`
    }
    return `${src1} Caster`
  }

  if (mode === 'split_levels') {
    if (secondaryClass && secondaryLevel) {
      return `${pCls} (${pLvl}) / ${secondaryClass} (${secondaryLevel})`
    }
    return `${pCls} (${pLvl})`
  }

  // Default: class_names
  if (secondaryClass && secondaryLevel) {
    return `Level ${pLvl} ${pCls} / Level ${secondaryLevel} ${secondaryClass}`
  }
  return `Level ${pLvl} ${pCls}`
}

/**
 * Format Pact Magic slot string (e.g. "Pact Magic 4 4th-level slots")
 */
export function formatPactMagicPill(slots: number[]): string {
  if (!Array.isArray(slots)) return ''
  for (let lvl = slots.length; lvl >= 1; lvl--) {
    const count = slots[lvl - 1]
    if (count > 0) {
      const suffixes = ['th', 'st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th', 'th']
      const sfx = suffixes[lvl] || 'th'
      return `Pact Magic ${count} ${lvl}${sfx}-level slots`
    }
  }
  return ''
}

/**
 * Format prepared spells badge (e.g. "Prepare 7 Cleric, Paladin spells per Long Rest")
 */
export function formatPreparedSpellsBadge(
  classList: { className: string; count: number }[],
  interval = 'Long Rest'
): string {
  if (!classList || classList.length === 0) return ''
  if (classList.length === 1) {
    const item = classList[0]
    return `Prepare ${item.count} ${item.className} spells per ${interval}`
  }
  const total = classList.reduce((acc, c) => acc + c.count, 0)
  const names = classList.map((c) => c.className).join(', ')
  return `Prepare ${total} ${names} spells per ${interval}`
}

/**
 * Format cantrip switch badge (e.g. "Switch 5 Wizard Cantrips per Short Rest")
 */
export function formatCantripSwitchBadge(
  count: number,
  className?: string,
  interval = 'Short Rest'
): string {
  const clsPart = className ? ` ${className}` : ''
  return `Switch ${count}${clsPart} Cantrips per ${interval}`
}

/**
 * Format Metamagic badge
 */
export function formatMetamagicBadge(
  sorceryPoints: number,
  refreshRate = 'Long Rest',
  options: string[] = []
): string {
  const optsStr = options.length > 0 ? `: ${options.join(', ')}` : ''
  return `Metamagic (${sorceryPoints} Sorcery Points / ${refreshRate})${optsStr}`
}

export function autoSyncSpellcasting(monster: Monster): Monster {
  const tuned: Monster = JSON.parse(JSON.stringify(monster))

  if (!tuned.spellcasting) {
    return tuned
  }

  const className = tuned.spellcasting.class || 'Wizard'
  const level = Math.max(1, Math.min(20, tuned.spellcasting.level || 1))
  const stat = (tuned.spellcasting.stat as DndStat) || getDefaultStatForClass(className)

  tuned.spellcasting.class = className
  tuned.spellcasting.level = level
  tuned.spellcasting.stat = stat

  // Auto-fill slots
  tuned.spellcasting.slots = getSpellSlotsForClass(className, level)

  // Calculate DC and Attack Bonus
  const statMod = statModifier(tuned.stats[stat] || 10)
  const saveDc = 8 + tuned.proficiency + statMod
  const attackBonus = tuned.proficiency + statMod

  tuned.spellcasting.save = {
    override: false,
    overrideValue: saveDc,
  }
  tuned.spellcasting.modifier = {
    override: false,
    overrideValue: attackBonus,
  }

  return tuned
}

export type CasterProgressionType = 'full' | 'half' | 'third' | 'pact' | 'none'

export interface CasterProgressionDefinition {
  type: CasterProgressionType
  label: string
  multiclassWeight: number
  poolKind: 'shared_slots' | 'pact_slots' | 'none'
  classes: string[]
}

export const CASTER_PROGRESSIONS: Record<CasterProgressionType, CasterProgressionDefinition> = {
  full: {
    type: 'full',
    label: 'Full Caster',
    multiclassWeight: 1,
    poolKind: 'shared_slots',
    classes: ['Bard', 'Cleric', 'Druid', 'Sorcerer', 'Wizard'],
  },
  half: {
    type: 'half',
    label: 'Half Caster',
    multiclassWeight: 0.5,
    poolKind: 'shared_slots',
    classes: ['Artificer', 'Paladin', 'Ranger'],
  },
  third: {
    type: 'third',
    label: 'One-Third Caster',
    multiclassWeight: 1 / 3,
    poolKind: 'shared_slots',
    classes: ['Eldritch Knight (Fighter)', 'Arcane Trickster (Rogue)'],
  },
  pact: {
    type: 'pact',
    label: 'Pact Magic',
    multiclassWeight: 0,
    poolKind: 'pact_slots',
    classes: ['Warlock'],
  },
  none: {
    type: 'none',
    label: 'Non-Caster / Innate Only',
    multiclassWeight: 0,
    poolKind: 'none',
    classes: [],
  },
}

export interface SubclassCatalogEntry {
  id: string
  className: string
  subclass: string
  progressionOverride?: CasterProgressionType
  defaultAbility?: DndStat
  hasExpandedSpells: boolean
}

export interface SubclassExpandedSpellPlan {
  alwaysPrepared: boolean
  ruleset: '2024' | '2014'
  spellsByClassLevel: Record<number, string[]>
}

export const SUBCLASS_EXPANDED_SPELLS: Record<string, SubclassExpandedSpellPlan> = {
  'Cleric:Life': {
    alwaysPrepared: true,
    ruleset: '2024',
    spellsByClassLevel: {
      3: ['Aid', 'Bless', 'Cure Wounds', 'Lesser Restoration'],
      5: ['Mass Healing Word', 'Revivify'],
      7: ['Aura of Life', 'Death Ward'],
      9: ['Greater Restoration', 'Mass Cure Wounds'],
    },
  },
  'Cleric:Light': {
    alwaysPrepared: true,
    ruleset: '2024',
    spellsByClassLevel: {
      3: ['Burning Hands', 'Faerie Fire', 'Flaming Sphere', 'Scorching Ray'],
      5: ['Daylight', 'Fireball'],
      7: ['Arcane Eye', 'Wall of Fire'],
      9: ['Flame Strike', 'Scrying'],
    },
  },
  'Cleric:Tempest': {
    alwaysPrepared: true,
    ruleset: '2014',
    spellsByClassLevel: {
      1: ['Fog Cloud', 'Thunderwave'],
      3: ['Gust of Wind', 'Shatter'],
      5: ['Call Lightning', 'Sleet Storm'],
      7: ['Control Water', 'Ice Storm'],
      9: ['Destructive Wave', 'Insect Plague'],
    },
  },
  'Paladin:Devotion': {
    alwaysPrepared: true,
    ruleset: '2024',
    spellsByClassLevel: {
      3: ['Protection from Evil and Good', 'Shield of Faith'],
      5: ['Aid', 'Zone of Truth'],
      9: ['Beacon of Hope', 'Dispel Magic'],
      13: ['Freedom of Movement', 'Guardian of Faith'],
      17: ['Commune', 'Flame Strike'],
    },
  },
  'Paladin:Vengeance': {
    alwaysPrepared: true,
    ruleset: '2024',
    spellsByClassLevel: {
      3: ['Bane', "Hunter's Mark"],
      5: ['Hold Person', 'Misty Step'],
      9: ['Haste', 'Protection from Energy'],
      13: ['Banishment', 'Dimension Door'],
      17: ['Hold Monster', 'Scrying'],
    },
  },
  'Warlock:Fiend': {
    alwaysPrepared: true,
    ruleset: '2024',
    spellsByClassLevel: {
      3: ['Burning Hands', 'Command', 'Scorching Ray', 'Suggestion'],
      5: ['Fireball', 'Stinking Cloud'],
      7: ['Fire Shield', 'Wall of Fire'],
      9: ['Geas', 'Insect Plague'],
    },
  },
  'Warlock:Archfey': {
    alwaysPrepared: true,
    ruleset: '2024',
    spellsByClassLevel: {
      3: ['Calm Emotions', 'Faerie Fire', 'Misty Step', 'Phantasmal Force', 'Sleep'],
      5: ['Blink', 'Plant Growth'],
      7: ['Dominate Beast', 'Greater Invisibility'],
      9: ['Dominate Person', 'Seeming'],
    },
  },
  'Ranger:Gloom Stalker': {
    alwaysPrepared: true,
    ruleset: '2024',
    spellsByClassLevel: {
      3: ['Disguise Self'],
      5: ['Rope Trick'],
      9: ['Fear'],
      13: ['Greater Invisibility'],
      17: ['Seeming'],
    },
  },
  'Sorcerer:Clockwork': {
    alwaysPrepared: true,
    ruleset: '2024',
    spellsByClassLevel: {
      3: ['Aid', 'Alarm', 'Lesser Restoration', 'Protection from Evil and Good'],
      5: ['Dispel Magic', 'Protection from Energy'],
      7: ['Freedom of Movement', 'Summon Construct'],
      9: ['Greater Restoration', 'Wall of Force'],
    },
  },
}

export const SUBCLASS_CATALOG: SubclassCatalogEntry[] = Object.entries(SRD_SUBCLASSES_BY_CLASS).flatMap(
  ([className, subclasses]) =>
    subclasses.map((subclass) => {
      const normalizedKey = `${className}:${subclass}`
      const progressionOverride: CasterProgressionType | undefined =
        subclass === 'Eldritch Knight' || subclass === 'Arcane Trickster' ? 'third' : undefined
      return {
        id: `${className.toLowerCase()}-${subclass.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        className,
        subclass,
        ...(progressionOverride ? { progressionOverride } : {}),
        defaultAbility: getDefaultStatForClass(className),
        hasExpandedSpells: Boolean(SUBCLASS_EXPANDED_SPELLS[normalizedKey]),
      }
    })
)

export function inferCasterProgression(className?: string, subclass?: string): CasterProgressionType {
  const cls = (className || '').trim().toLowerCase()
  const sub = (subclass || '').trim().toLowerCase()
  if (sub === 'eldritch knight' || sub === 'arcane trickster') return 'third'
  if (cls === 'warlock') return 'pact'
  if (['bard', 'cleric', 'druid', 'sorcerer', 'wizard'].includes(cls)) return 'full'
  if (['paladin', 'ranger', 'artificer'].includes(cls)) return 'half'
  return 'none'
}

export function planSubclassExpandedSpells(options: {
  className: string
  subclass?: string
  classLevel: number
  existingSpellNames?: string[]
}): {
  key: string
  found: boolean
  alwaysPrepared: boolean
  ruleset?: '2024' | '2014'
  eligibleSpells: Array<{ spell: string; unlockLevel: number }>
  missingSpells: Array<{ spell: string; unlockLevel: number }>
  alreadyPresent: string[]
} {
  const cls = (options.className || '').trim()
  const sub = (options.subclass || '').trim()
  const key = `${cls}:${sub}`
  const matchKey = Object.keys(SUBCLASS_EXPANDED_SPELLS).find(
    (k) => k.toLowerCase() === key.toLowerCase()
  )
  if (!matchKey) {
    return {
      key,
      found: false,
      alwaysPrepared: false,
      eligibleSpells: [],
      missingSpells: [],
      alreadyPresent: [],
    }
  }

  const plan = SUBCLASS_EXPANDED_SPELLS[matchKey]
  const existing = new Set((options.existingSpellNames || []).map((s) => s.trim().toLowerCase()))
  const eligibleSpells: Array<{ spell: string; unlockLevel: number }> = []
  const missingSpells: Array<{ spell: string; unlockLevel: number }> = []
  const alreadyPresent: string[] = []

  const levels = Object.keys(plan.spellsByClassLevel)
    .map((n) => Number.parseInt(n, 10))
    .sort((a, b) => a - b)

  for (const unlockLevel of levels) {
    if (options.classLevel < unlockLevel) continue
    for (const spell of plan.spellsByClassLevel[unlockLevel]) {
      eligibleSpells.push({ spell, unlockLevel })
      if (existing.has(spell.toLowerCase())) {
        alreadyPresent.push(spell)
      } else {
        missingSpells.push({ spell, unlockLevel })
      }
    }
  }

  return {
    key: matchKey,
    found: true,
    alwaysPrepared: plan.alwaysPrepared,
    ruleset: plan.ruleset,
    eligibleSpells,
    missingSpells,
    alreadyPresent,
  }
}

export type ComputedSpellMetricsResult =
  | {
      status: 'ok'
      ability: DndStat
      abilityModifier: number
      proficiency: number
      saveDc: number
      attackBonus: number
      saveDcOverridden: boolean
      attackOverridden: boolean
    }
  | {
      status: 'unavailable'
      reason: string
      ability?: DndStat
    }
  | {
      status: 'error'
      reason: string
    }

const VALID_SPELL_ABILITIES = new Set<DndStat>(['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'])

export function computeSpellMetrics(input: {
  ability?: DndStat | string
  className?: string
  stats?: Partial<Record<DndStat, number>>
  proficiency?: number
  saveDcOverride?: number
  attackBonusOverride?: number
}): ComputedSpellMetricsResult {
  const proficiency = input.proficiency ?? 2
  if (typeof proficiency !== 'number' || !Number.isFinite(proficiency) || proficiency < 0) {
    return { status: 'error', reason: `Invalid proficiency bonus: ${String(input.proficiency)}` }
  }

  const rawAbility = input.ability
    ? String(input.ability).trim().toUpperCase()
    : input.className
      ? getDefaultStatForClass(input.className)
      : ''

  if (!rawAbility) {
    return { status: 'unavailable', reason: 'No spellcasting ability or class specified.' }
  }

  if (!VALID_SPELL_ABILITIES.has(rawAbility as DndStat)) {
    return { status: 'error', reason: `Unknown spellcasting ability: ${rawAbility}` }
  }

  const ability = rawAbility as DndStat
  if (!input.stats || input.stats[ability] === undefined || input.stats[ability] === null) {
    return {
      status: 'unavailable',
      ability,
      reason: `Missing ${ability} score for spellcasting calculation.`,
    }
  }

  const score = input.stats[ability]!
  if (typeof score !== 'number' || !Number.isFinite(score)) {
    return { status: 'error', reason: `Non-numeric ${ability} score: ${String(score)}` }
  }

  if (input.saveDcOverride !== undefined && !Number.isFinite(input.saveDcOverride)) {
    return { status: 'error', reason: `Invalid save DC override: ${String(input.saveDcOverride)}` }
  }
  if (input.attackBonusOverride !== undefined && !Number.isFinite(input.attackBonusOverride)) {
    return {
      status: 'error',
      reason: `Invalid attack bonus override: ${String(input.attackBonusOverride)}`,
    }
  }

  const abilityModifier = statModifier(score)
  const saveDcOverridden = input.saveDcOverride !== undefined
  const attackOverridden = input.attackBonusOverride !== undefined
  const saveDc = saveDcOverridden ? input.saveDcOverride! : 8 + proficiency + abilityModifier
  const attackBonus = attackOverridden ? input.attackBonusOverride! : proficiency + abilityModifier

  return {
    status: 'ok',
    ability,
    abilityModifier,
    proficiency,
    saveDc,
    attackBonus,
    saveDcOverridden,
    attackOverridden,
  }
}

export type CastingPoolKind = 'shared_slots' | 'pact_slots' | 'innate_uses'

export interface PactSlotSummary {
  count: number
  slotLevel: number
  recharge: 'Short Rest'
}

export interface CastingSource {
  id: string
  kind: 'class' | 'subclass' | 'innate' | 'item'
  pool: CastingPoolKind
  label: string
  className?: string
  subclass?: string
  level?: number
  ability?: DndStat
  progression: CasterProgressionType
  slots?: number[]
  pactSlots?: PactSlotSummary
  atWill?: string[]
  perDaySpells?: Record<string, string[]>
  saveDcOverride?: number
  attackBonusOverride?: number
  provenance: {
    migratedFrom?: string
    sourceName: string
    ruleset: '2024' | '2014'
  }
}

function getWarlockPactSummary(level: number): PactSlotSummary {
  const lvl = Math.max(1, Math.min(20, Math.floor(level)))
  const count = lvl === 1 ? 1 : lvl <= 10 ? 2 : lvl <= 16 ? 3 : 4
  const slotLevel = Math.min(5, Math.ceil(lvl / 2))
  return { count, slotLevel, recharge: 'Short Rest' }
}

function slugSourceId(prefix: string, name: string, index: number): string {
  const clean = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return clean ? `${prefix}-${clean}` : `${prefix}-${index + 1}`
}

export function migrateCastingSources(spellcasting: Record<string, unknown> = {}): CastingSource[] {
  const sc = spellcasting as Record<string, any>
  const existing = Array.isArray(sc.castingSources) ? (sc.castingSources as CastingSource[]) : null
  if (existing && existing.length > 0) {
    return existing.map((src, idx) => ({
      ...src,
      id: src.id || slugSourceId(`src-${src.kind || 'class'}`, src.className || src.label || 'caster', idx),
      progression: src.progression || inferCasterProgression(src.className, src.subclass),
      provenance: src.provenance || {
        migratedFrom: 'castingSources',
        sourceName: src.label || src.className || 'Spellcasting',
        ruleset: '2024',
      },
    }))
  }

  const sources: CastingSource[] = []
  const usedIds = new Set<string>()
  const uniqueId = (base: string): string => {
    if (!usedIds.has(base)) {
      usedIds.add(base)
      return base
    }
    let counter = 2
    while (usedIds.has(`${base}-${counter}`)) counter++
    const candidate = `${base}-${counter}`
    usedIds.add(candidate)
    return candidate
  }

  const appendClassSource = (
    entry: {
      id?: string
      className?: string
      subclass?: string
      level?: number
      ability?: DndStat
      saveDcOverride?: number
      attackBonusOverride?: number
      slots?: number[]
    },
    migratedFrom: string,
    index: number
  ) => {
    const className = String(entry.className || '').trim()
    if (!className) return
    const subclass = typeof entry.subclass === 'string' && entry.subclass.trim() ? entry.subclass.trim() : undefined
    const level = Math.max(1, Math.min(20, Number(entry.level ?? 1)))
    const progression = inferCasterProgression(className, subclass)
    const pool: CastingPoolKind = progression === 'pact' ? 'pact_slots' : 'shared_slots'
    const ability = entry.ability || getDefaultStatForClass(className)
    const label = subclass ? `${className} (${subclass})` : className

    sources.push({
      id: uniqueId(entry.id || slugSourceId('src-class', className, index)),
      kind: 'class',
      pool,
      label,
      className,
      ...(subclass ? { subclass } : {}),
      level,
      ability,
      progression,
      ...(pool === 'pact_slots'
        ? { pactSlots: getWarlockPactSummary(level) }
        : { slots: Array.isArray(entry.slots) ? [...entry.slots] : getSpellSlotsForClass(className, level) }),
      ...(entry.saveDcOverride !== undefined ? { saveDcOverride: entry.saveDcOverride } : {}),
      ...(entry.attackBonusOverride !== undefined ? { attackBonusOverride: entry.attackBonusOverride } : {}),
      provenance: {
        migratedFrom,
        sourceName: label,
        ruleset: '2024',
      },
    })
  }

  if (Array.isArray(sc.classes) && sc.classes.length > 0) {
    sc.classes.forEach((cls: any, i: number) => {
      appendClassSource(
        {
          id: cls.id,
          className: cls.class || cls.className,
          subclass: cls.subclass ?? (i === 0 ? sc.subclass : undefined),
          level: cls.level,
          ability: cls.stat || cls.ability,
        },
        'spellcasting.classes',
        i
      )
    })
  } else {
    if (sc.class) {
      appendClassSource(
        {
          className: sc.class,
          subclass: sc.subclass,
          level: sc.level,
          ability: sc.stat,
          saveDcOverride: sc.save?.override ? sc.save.overrideValue : undefined,
          attackBonusOverride: sc.attack?.override
            ? sc.attack.overrideValue
            : sc.modifier?.override
              ? sc.modifier.overrideValue
              : undefined,
          slots: Array.isArray(sc.slots) ? sc.slots : undefined,
        },
        'spellcasting.primary',
        0
      )
    }
    if (sc.multiclass?.enabled && sc.multiclass.secondaryClass) {
      appendClassSource(
        {
          className: sc.multiclass.secondaryClass,
          subclass: sc.multiclass.secondarySubclass,
          level: sc.multiclass.secondaryLevel,
          ability: sc.multiclass.secondaryStat,
          saveDcOverride: sc.multiclass.secondarySaveDc,
          attackBonusOverride: sc.multiclass.secondarySpellAttack,
        },
        'spellcasting.multiclass',
        1
      )
    }
  }

  const hasAtWill = Array.isArray(sc.atWill) && sc.atWill.some((group: any) => Array.isArray(group?.spells) ? group.spells.length > 0 : Boolean(group))
  const hasInnateNotes = typeof sc.atWillNotes === 'string' && sc.atWillNotes.trim().length > 0
  if (hasAtWill || hasInnateNotes) {
    const atWillNames: string[] = []
    const perDaySpells: Record<string, string[]> = {}
    for (const item of sc.atWill || []) {
      if (typeof item === 'string') {
        atWillNames.push(item)
      } else if (item && typeof item === 'object') {
        const cadence = String(item.count || item.cadence || '').trim()
        const names = Array.isArray(item.spells)
          ? item.spells.map((s: any) => (typeof s === 'string' ? s : s?.name)).filter(Boolean)
          : []
        if (cadence && cadence.toLowerCase() !== 'at will') {
          perDaySpells[cadence] = [...(perDaySpells[cadence] || []), ...names]
        } else {
          atWillNames.push(...names)
        }
      }
    }
    sources.push({
      id: uniqueId('src-innate-primary'),
      kind: 'innate',
      pool: 'innate_uses',
      label: 'Innate Spellcasting',
      ability: sc.innateStat || sc.stat || 'CHA',
      progression: 'none',
      atWill: atWillNames,
      perDaySpells,
      provenance: {
        migratedFrom: 'spellcasting.atWill',
        sourceName: 'Innate Spellcasting',
        ruleset: '2024',
      },
    })
  }

  return sources
}

export interface ProjectedCastingSource extends CastingSource {
  metrics: ComputedSpellMetricsResult
}

export interface CastingProjection {
  sources: ProjectedCastingSource[]
  sharedPool: {
    sourceIds: string[]
    effectiveCasterLevel: number
    slots: number[]
  }
  pactPools: Array<{
    sourceId: string
    label: string
    pactSlots: PactSlotSummary
  }>
  innatePools: Array<{
    sourceId: string
    label: string
    atWill: string[]
    perDaySpells: Record<string, string[]>
  }>
}

export function resolveCastingProjection(
  sources: CastingSource[],
  context: { stats?: Partial<Record<DndStat, number>>; proficiency?: number } = {}
): CastingProjection {
  const projectedSources: ProjectedCastingSource[] = sources.map((src) => ({
    ...src,
    metrics: computeSpellMetrics({
      ability: src.ability,
      className: src.className,
      stats: context.stats,
      proficiency: context.proficiency,
      saveDcOverride: src.saveDcOverride,
      attackBonusOverride: src.attackBonusOverride,
    }),
  }))

  const sharedSources = projectedSources.filter((s) => s.pool === 'shared_slots')
  let sharedSlots = [0, 0, 0, 0, 0, 0, 0, 0, 0]
  let effectiveCasterLevel = 0

  if (sharedSources.length === 1 && sharedSources[0].className) {
    const only = sharedSources[0]
    const lvl = Math.max(1, Math.min(20, only.level ?? 1))
    effectiveCasterLevel = lvl
    sharedSlots = only.slots && only.slots.length === 9
      ? [...only.slots]
      : getSpellSlotsForClass(only.className!, lvl)
  } else if (sharedSources.length > 1) {
    let accumulated = 0
    for (const s of sharedSources) {
      const lvl = Math.max(1, Math.min(20, s.level ?? 1))
      const weight = CASTER_PROGRESSIONS[s.progression]?.multiclassWeight ?? 0
      accumulated += Math.floor(lvl * weight)
    }
    effectiveCasterLevel = Math.max(0, Math.min(20, accumulated))
    sharedSlots = effectiveCasterLevel > 0
      ? getSpellSlotsForClass('Wizard', effectiveCasterLevel)
      : [0, 0, 0, 0, 0, 0, 0, 0, 0]
  }

  const pactPools = projectedSources
    .filter((s) => s.pool === 'pact_slots')
    .map((s) => ({
      sourceId: s.id,
      label: s.label,
      pactSlots: s.pactSlots || getWarlockPactSummary(s.level ?? 1),
    }))

  const innatePools = projectedSources
    .filter((s) => s.pool === 'innate_uses')
    .map((s) => ({
      sourceId: s.id,
      label: s.label,
      atWill: [...(s.atWill || [])],
      perDaySpells: { ...(s.perDaySpells || {}) },
    }))

  return {
    sources: projectedSources,
    sharedPool: {
      sourceIds: sharedSources.map((s) => s.id),
      effectiveCasterLevel,
      slots: sharedSlots,
    },
    pactPools,
    innatePools,
  }
}
