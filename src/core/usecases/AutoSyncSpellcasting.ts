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

/** Unknown systems remain authored sources; they never inherit Wizard progression. */
export function spellcastingRuleClass(className: string, subclass = ''): string | undefined {
  const name = (className || '').trim().toLowerCase()
  const sub = subclass.toLowerCase()
  if (['artificer','bard','cleric','druid','paladin','ranger','sorcerer','warlock','wizard'].includes(name)) return name
  if ((name === 'fighter' && sub.includes('eldritch knight')) || (name === 'rogue' && sub.includes('arcane trickster')) || name.includes('eldritch knight') || name.includes('arcane trickster') || name === 'third caster') return 'third caster'
  return undefined
}

export function getSpellSlotsForClass(className: string, level: number): number[] {
  const clampedLevel = Math.max(1, Math.min(20, level))
  const lower = spellcastingRuleClass(className)
  if (!lower) return Array(9).fill(0)

  if (lower === 'paladin' || lower === 'ranger') {
    return [...(HALF_CASTER_SLOTS[clampedLevel] || [0, 0, 0, 0, 0, 0, 0, 0, 0])]
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

export function getDefaultStatForClass(className: string): DndStat {
  return CLASS_DEFAULT_STAT[className] || 'INT'
}

export interface SpellcastingMetrics {
  cantripsKnown: number
  preparedSpells: number
  highestSlot: number
  casterType: 'full' | 'half' | 'third' | 'pact' | 'artificer' | 'custom'
}

/**
 * Calculates 5e standard metrics: known cantrips, prepared spells count, highest slot available.
 */
export function calculateSpellcastingMetrics(
  className: string,
  level: number,
  statMod = 0,
  subclass = ''
): SpellcastingMetrics {
  const lower = spellcastingRuleClass(className, subclass)
  if (!lower) return { cantripsKnown: 0, preparedSpells: 0, highestSlot: 0, casterType: 'custom' }
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
    const initialCantrips = lower === 'druid' ? 2 : 3
    cantripsKnown = initialCantrips + (lvl >= 4 ? 1 : 0) + (lvl >= 10 ? 1 : 0)
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
  } else if (lower === 'third caster') {
    const trickster = (className + ' ' + subclass).toLowerCase().includes('trickster')
    cantripsKnown = lvl < 3 ? 0 : (trickster ? 3 : 2) + (lvl >= 10 ? 1 : 0)
    const thirdKnown = [0,0,3,4,4,4,5,6,6,7,8,8,9,10,10,11,11,11,12,13]
    preparedSpells = thirdKnown[lvl - 1]
    casterType = 'third'
  } else {
    // Default Wizard
    cantripsKnown = lvl >= 10 ? 5 : (lvl >= 4 ? 4 : 3)
    preparedSpells = Math.max(1, lvl + statMod)
    highestSlot = Math.min(9, Math.ceil(lvl / 2))
    casterType = 'full'
  }

  highestSlot = getSpellSlotsForClass(lower, lvl).reduce((maximum, count, index) => count > 0 ? index + 1 : maximum, 0)
  if (lower === 'paladin' && lvl < 2) preparedSpells = 0
  return {
    cantripsKnown,
    preparedSpells,
    highestSlot,
    casterType,
  }
}

export interface CastingCapacityContribution {
  /** Own class progression or the consolidated caster level; absent uses combined for stacked sources. */
  mode: 'own' | 'combined'
  /** Scale a count for cantrips/spells, or an effective level for highest-slot/grants. */
  multiplier?: number
  numerator: number
  denominator: number
}
export interface CastingContribution {
  cantrips?: CastingCapacityContribution
  spells?: CastingCapacityContribution
  highestSlot?: CastingCapacityContribution
  grants?: CastingCapacityContribution
  multiplier?: number
  mode: 'rules' | 'custom'
  target: 'slots' | 'pact' | 'points' | 'focus'
  focusPerLevel?: number
  numerator: number
  denominator: number
}

export interface CastingSpellGrant { spell: string; minLevel: number; origin: 'class' | 'subclass' | 'species'; kind?: 'known' | 'prepared' }
export interface CastingRollOverride { override: boolean; overrideValue: number }

export interface ClassEntry {
  save?: CastingRollOverride
  attack?: CastingRollOverride
  modifier?: CastingRollOverride
  preparedCountOverride?: number
  preparedInterval?: string
  id?: string
  resourceType?: string
  slots?: number[]
  contribution?: CastingContribution
  className: string
  subclass?: string
  level: number
  stat?: DndStat
}

export interface SpellcastingSourcesInput {
 save?: CastingRollOverride
 attack?: CastingRollOverride
 modifier?: CastingRollOverride
 preparedCountOverride?: number
 preparedInterval?: string
 primarySourceEnabled?: boolean
 resourceType?: string
 slots?: number[]
 class?: string
 subclass?: string
 level?: number
 stat?: DndStat
 contribution?: CastingContribution
 classes?: ClassEntry[]
 multiclass?: { enabled?: boolean; secondaryClass?: string; secondaryLevel?: number; secondaryStat?: DndStat }
}

/** One source projection for editor, renderers and exports. Unknown manual sources do not invent slots. */
export function allCastingSourceEntries(source: SpellcastingSourcesInput): ClassEntry[] {
 const entries: ClassEntry[] = source.primarySourceEnabled === false ? [] : [{ id: 'primary', className: source.class || '', subclass: source.subclass, level: source.level || 1, stat: source.stat, save: source.save, attack: source.attack, modifier: source.modifier, preparedCountOverride: source.preparedCountOverride, preparedInterval: source.preparedInterval, contribution: source.contribution, resourceType: source.resourceType, slots: source.slots }]
 entries.push(...(source.classes || []))
 if (source.primarySourceEnabled !== false && !(source.classes || []).length && source.multiclass?.enabled) entries.push({ id: 'legacy-secondary', className: source.multiclass.secondaryClass || 'Cleric', level: source.multiclass.secondaryLevel || 1, stat: source.multiclass.secondaryStat || 'WIS' })
 return entries
}
export const hasCastingSources = (source: SpellcastingSourcesInput): boolean => allCastingSourceEntries(source).length > 0
export function spellcastingSourceEntries(source: SpellcastingSourcesInput): ClassEntry[] {
 return allCastingSourceEntries(source).filter(entry => entry.contribution?.mode === 'custom' || spellcastingRuleClass(entry.className, entry.subclass) !== undefined)
}

/** Decimal controls take precedence; absent controls retain the saved rational ratio. */
export function scaleCastingCapacity(count: number, config?: { multiplier?: number; numerator?: number; denominator?: number }): number {
 if (!config) return count
 const ratio = config.multiplier !== undefined ? config.multiplier : Number(config.numerator) / Number(config.denominator)
 const valid = config.multiplier !== undefined || Number(config.denominator) > 0
 const result = count * ratio
 return valid && ratio >= 0 && Number.isFinite(result) ? Math.min(Number.MAX_SAFE_INTEGER, Math.floor(result + Number.EPSILON * Math.max(1, result))) : 0
}

export function castingCapacityBasis(ownLevel: number, config: CastingCapacityContribution | undefined, combinedLevel?: number, sourceCount = 1, combinedByDefault = false): number {
 const own = Math.min(20, Math.max(0, Math.trunc(Number(ownLevel) || 0)))
 if (config?.mode === 'own' || (!config?.mode && (!combinedByDefault || sourceCount <= 1))) return own
 const combined = Math.trunc(Number(combinedLevel ?? own) || 0)
 return Math.min(20, Math.max(0, combined, config?.mode === 'combined' ? 0 : own))
}

/** Learning capacities can use the shared level without changing source-owned spell eligibility. */
export function sourceLearningMetrics(entry: ClassEntry, abilityModifier = 0, combinedLevel?: number, sourceCount = 1) {
 const own = castingCapacityBasis(entry.level, undefined)
 const basis = (config?: CastingCapacityContribution) => castingCapacityBasis(own, config, combinedLevel, sourceCount, true)
 const cantripCapacityLevel = basis(entry.contribution?.cantrips), spellCapacityLevel = basis(entry.contribution?.spells)
 const native = calculateSpellcastingMetrics(entry.className, own, abilityModifier, entry.subclass)
 const cantripMetrics = calculateSpellcastingMetrics(entry.className, cantripCapacityLevel, abilityModifier, entry.subclass)
 const spellMetrics = calculateSpellcastingMetrics(entry.className, spellCapacityLevel, abilityModifier, entry.subclass)
 return { ...native, cantripCapacityLevel, spellCapacityLevel,
  cantripsKnown: cantripCapacityLevel > 0 ? scaleCastingCapacity(cantripMetrics.cantripsKnown, entry.contribution?.cantrips) : 0,
  preparedSpells: typeof entry.preparedCountOverride === 'number' && Number.isFinite(entry.preparedCountOverride) ? Math.max(0, Math.trunc(entry.preparedCountOverride)) : spellCapacityLevel > 0 ? scaleCastingCapacity(spellMetrics.preparedSpells, entry.contribution?.spells) : 0 }
}

export function aggregateSpellcastingSources(source: SpellcastingSourcesInput, stats: Record<string, number> = {}, proficiency = 2): MulticlassCalculationResult | undefined {
 const entries = spellcastingSourceEntries(source)
 return entries.length ? calculateMulticlassSpellcasting(entries, stats, proficiency) : undefined
}

export function castingLearningSummary(source: SpellcastingSourcesInput, stats: Record<string, number> = {}, proficiency = 2) {
 const result = aggregateSpellcastingSources(source, stats, proficiency)
 return {casterLevel: result?.combinedCasterLevel ?? 0, cantrips: result?.totalCantripsKnown ?? 0, spells: result?.totalPreparedSpells ?? 0, perClass: result?.classes ?? []}
}

export interface PerClassBreakdown {
  id?: string
  preparedInterval?: string
  className: string
  subclass?: string
  level: number
  stat: DndStat
  saveDc: number
  spellAttack: number
  cantripsKnown: number
  preparedSpells: number
  cantripCapacityLevel?: number
  spellCapacityLevel?: number
}

export interface MulticlassCalculationResult {
  combinedCasterLevel: number
  slots: number[]
  warlockSlots?: number[]
  /** Actual shared Spellcasting pool; legacy slots may alias pact slots for older consumers. */
  standardSlots: number[]
  customPoints: number
  customFocus: number
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


  // Contribution helper
  const getContribution = (cls: string, lvl: number) => {
    const l = (cls || '').toLowerCase()
    if (l === 'warlock') return 0 // Warlock pact magic stays separate
    if (l === 'paladin' || l === 'ranger') return Math.floor(lvl / 2)
    if (l === 'artificer') return Math.ceil(lvl / 2)
    if (l === 'third caster') return Math.floor(lvl / 3)
    return spellcastingRuleClass(cls) ? lvl : 0 // Custom systems never grant standard slots
  }

  let combinedLevelSum = 0
  let warlockLevel = 0
  let customPointsLevel = 0
  let customFocus = 0
  let customFocusLevel = 0
  const breakdowns: PerClassBreakdown[] = []

  let totalPrepared = 0
  let totalCantrips = 0

  for (const entry of classEntries) {
    const cls = entry.className || 'Wizard'
    const lvl = Math.max(1, Math.min(20, Math.trunc(Number(entry.level) || 1)))
    const stat = entry.stat || getDefaultStatForClass(cls)
    const mod = statModifier(effectiveStats[stat] ?? 10)
    const saveDc = entry.save?.override && Number.isFinite(entry.save.overrideValue) ? entry.save.overrideValue : 8 + effectiveProf + mod
    const spellAttack = entry.attack?.override && Number.isFinite(entry.attack.overrideValue) ? entry.attack.overrideValue : effectiveProf + mod

    const rulesClass = spellcastingRuleClass(cls, entry.subclass)
    const metrics = calculateSpellcastingMetrics(cls, lvl, mod, entry.subclass)

    if (entry.contribution?.mode === 'custom') {
      const contribution = Math.min(20, scaleCastingCapacity(lvl, entry.contribution))
      if (entry.contribution.target === 'pact') warlockLevel += contribution
      else if (entry.contribution.target === 'points') customPointsLevel += contribution
      else if (entry.contribution.target === 'focus') {
        customFocusLevel += contribution
        const rate = Number(entry.contribution.focusPerLevel)
        customFocus += contribution * (Number.isFinite(rate) && rate >= 0 ? rate : 0)
      }
      else combinedLevelSum += contribution
    } else if (['points', 'focus', 'at_will'].includes(entry.resourceType || '')) {
      // Authored manual resources replace this source's native slot budget.
    } else if (cls.toLowerCase() === 'warlock') {
      warlockLevel += lvl
    } else {
      combinedLevelSum += getContribution(rulesClass || cls, lvl)
    }

    breakdowns.push({
      id: entry.id,
      preparedInterval: entry.preparedInterval,
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
  const fallbackLevel = Math.max(0,...classEntries.map(entry => Math.max(0,Math.min(20,Math.trunc(Number(entry.level)||0)))))
  const learningLevel = combinedLevelSum > 0 ? combinedLevel : Math.min(20, warlockLevel || customPointsLevel || customFocusLevel || fallbackLevel)
  classEntries.forEach((entry, index) => {
    const mod = statModifier(effectiveStats[entry.stat || getDefaultStatForClass(entry.className)] ?? 10)
    const learning = sourceLearningMetrics(entry, mod, learningLevel, classEntries.length)
    totalPrepared += learning.preparedSpells
    totalCantrips += learning.cantripsKnown
    Object.assign(breakdowns[index], {cantripsKnown: learning.cantripsKnown, preparedSpells: learning.preparedSpells, cantripCapacityLevel: learning.cantripCapacityLevel, spellCapacityLevel: learning.spellCapacityLevel})
  })
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
    combinedCasterLevel: learningLevel,
    slots: combinedLevelSum > 0 ? slots : (warlockSlots || slots),
    warlockSlots,
    standardSlots: slots,
    customPoints: SPELL_POINTS_BY_LEVEL[Math.min(20, customPointsLevel)] || 0,
    customFocus,
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
