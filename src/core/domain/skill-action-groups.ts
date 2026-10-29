import type { DndStat } from './types.ts'

/**
 * Single source of truth for how skills are grouped under the four 2024
 * ability-check actions (Search, Study, Influence, Hide).
 *
 * The stat block renders one row per group: the group's base check
 * (passive/bonus of its ability) followed only by the skills whose numbers
 * differ from that base, so nothing is disclosed twice.
 *
 * Mapping notes (house mapping requested for this tool):
 * - 2024 PHB lists Insight, Medicine, Perception and Survival under Search.
 *   Here Medicine moves to Study; Insight stays under Search.
 * - 2024 PHB Hide is a Dexterity (Stealth) check. Here Hide also covers
 *   Acrobatics, Athletics and Sleight of Hand.
 * Change the table below to switch back to the strict RAW mapping.
 */

export type SkillActionGroupId = 'search' | 'study' | 'influence' | 'hide'
export type SkillActionType = 'Action' | 'Bonus Action'

export interface SkillActionGroupDef {
  id: SkillActionGroupId
  label: string
  /** Ability used for the group's default (untrained) check. */
  stat: DndStat
  /** Quasar color token used by the editor for this group. */
  color: string
  icon: string
  /** One-line rules summary for tooltips. */
  tip: string
  /** Skill keys as stored in monster.skills (see src/data/SKILL.ts), alphabetical. */
  skills: readonly string[]
}

export const SKILL_ACTION_GROUPS: readonly SkillActionGroupDef[] = [
  {
    id: 'search',
    label: 'Search',
    stat: 'WIS',
    color: 'primary',
    icon: 'fa-solid fa-magnifying-glass',
    tip: 'Wisdom check to notice what is hidden: a concealed creature, tracks, a lie or a mood. Its passive score is the creature\'s passive Perception.',
    skills: ['INSIGHT', 'PERCEPTION', 'SURVIVAL'],
  },
  {
    id: 'study',
    label: 'Study',
    stat: 'INT',
    color: 'info',
    icon: 'fa-solid fa-book-open',
    tip: 'Intelligence check to recall lore or examine a clue: magic, history, religion, nature, traps, ailments.',
    skills: ['ARCANA', 'HISTORY', 'INVESTIGATION', 'MEDICINE', 'NATURE', 'RELIGION'],
  },
  {
    id: 'influence',
    label: 'Influence',
    stat: 'CHA',
    color: 'amber-8',
    icon: 'fa-solid fa-comments',
    tip: 'Charisma check to sway a creature (Wisdom with Animal Handling): deceive, frighten, perform or persuade.',
    skills: ['ANIMAL_HANDLING', 'DECEPTION', 'INTIMIDATION', 'PERFORMANCE', 'PERSUASION'],
  },
  {
    id: 'hide',
    label: 'Hide',
    stat: 'DEX',
    color: 'deep-purple-5',
    icon: 'fa-solid fa-user-ninja',
    tip: 'Dexterity check to slip out of sight or conceal something; its passive score is the DC to find the creature.',
    skills: ['ACROBATICS', 'ATHLETICS', 'SLIGHT_OF_HAND', 'STEALTH'],
  },
]

/** Legacy / alternate spellings that must resolve to the stored key. */
const SKILL_KEY_ALIASES: Record<string, string> = {
  SLEIGHT_OF_HAND: 'SLIGHT_OF_HAND',
  SLEIGHTOFHAND: 'SLIGHT_OF_HAND',
  ANIMALHANDLING: 'ANIMAL_HANDLING',
}

export function normalizeSkillKey(key: string | undefined | null): string {
  const upper = String(key ?? '').trim().toUpperCase().replace(/[\s-]+/g, '_')
  return SKILL_KEY_ALIASES[upper] ?? SKILL_KEY_ALIASES[upper.replace(/_/g, '')] ?? upper
}

/** Key used by the editor's per-skill passive config (monster.passives). */
export function passiveConfigKey(skillKey: string): string {
  const key = normalizeSkillKey(skillKey)
  if (key === 'SLIGHT_OF_HAND') return 'sleightOfHand'
  if (key === 'ANIMAL_HANDLING') return 'animalHandling'
  return key.toLowerCase()
}

export function skillActionGroupFor(skillKey: string): SkillActionGroupDef | undefined {
  const key = normalizeSkillKey(skillKey)
  return SKILL_ACTION_GROUPS.find((g) => g.skills.includes(key))
}

export interface SkillCheckInput {
  key: string
  label: string
  stat: DndStat
  /** Final check bonus (ability + proficiency/expertise, or its override). */
  bonus: number
  advantage?: boolean
  disadvantage?: boolean
  condition?: string
  /** Explicit per-skill action economy; undefined follows its group. */
  bonusAction?: boolean
  /** Replaces the computed passive score when set. */
  passiveOverride?: number | null
}

export interface SkillCheckEntry {
  key: string
  label: string
  stat: DndStat
  passive: number
  bonus: number
  advantage: boolean
  disadvantage: boolean
  condition: string
}

export interface SkillGroupRow {
  id: SkillActionGroupId | 'skills'
  label: string
  actionType: SkillActionType
  stat?: DndStat
  /** Untrained check of the group's ability; absent on rows that only list exceptions. */
  base?: { passive: number; bonus: number }
  entries: SkillCheckEntry[]
  tip: string
}

export function statModifierOf(score: number | undefined): number {
  return Math.floor(((score ?? 10) - 10) / 2)
}

/** Advantage and Disadvantage cancel each other (PHB 2024, "Advantage and Disadvantage"). */
export function effectiveAdvantage(adv?: boolean, disadv?: boolean): 'advantage' | 'disadvantage' | 'none' {
  if (adv && !disadv) return 'advantage'
  if (disadv && !adv) return 'disadvantage'
  return 'none'
}

/** Passive score = 10 + bonus, +5 with Advantage, -5 with Disadvantage. */
export function passiveScore(bonus: number, adv?: boolean, disadv?: boolean): number {
  const mode = effectiveAdvantage(adv, disadv)
  return 10 + bonus + (mode === 'advantage' ? 5 : mode === 'disadvantage' ? -5 : 0)
}

function toEntry(input: SkillCheckInput): SkillCheckEntry {
  const mode = effectiveAdvantage(input.advantage, input.disadvantage)
  const passive =
    input.passiveOverride != null && Number.isFinite(input.passiveOverride)
      ? Number(input.passiveOverride)
      : passiveScore(input.bonus, input.advantage, input.disadvantage)
  return {
    key: normalizeSkillKey(input.key),
    label: input.label,
    stat: input.stat,
    passive,
    bonus: input.bonus,
    advantage: mode === 'advantage',
    disadvantage: mode === 'disadvantage',
    condition: (input.condition ?? '').trim(),
  }
}

function differsFromBase(entry: SkillCheckEntry, base: { passive: number; bonus: number }): boolean {
  return (
    entry.bonus !== base.bonus ||
    entry.passive !== base.passive ||
    entry.advantage ||
    entry.disadvantage ||
    entry.condition !== ''
  )
}

export interface SkillGroupLayoutParams {
  stats: Partial<Record<DndStat, number>>
  skills: SkillCheckInput[]
  /** Group-level action economy (e.g. Hide as a Bonus Action). */
  groupActionTypes?: Partial<Record<SkillActionGroupId, SkillActionType>>
}

/**
 * Lays out the Search / Study / Influence / Hide rows plus a Skills row for
 * anything that belongs to no group. Every group row is always present so the
 * passive scores (passive Perception included) are never lost.
 */
export function computeSkillGroupLayout(params: SkillGroupLayoutParams): SkillGroupRow[] {
  const rows: SkillGroupRow[] = []
  const seen = new Set<string>()
  const inputs = params.skills.filter((s) => {
    const key = normalizeSkillKey(s.key)
    if (!key || key === 'INITIATIVE' || seen.has(key)) return false
    seen.add(key)
    return true
  })

  for (const group of SKILL_ACTION_GROUPS) {
    const actionType = params.groupActionTypes?.[group.id] ?? 'Action'
    const otherType: SkillActionType = actionType === 'Action' ? 'Bonus Action' : 'Action'
    const mod = statModifierOf(params.stats[group.stat])
    const base = { passive: 10 + mod, bonus: mod }

    const members = group.skills
      .map((key) => inputs.find((s) => normalizeSkillKey(s.key) === key))
      .filter((s): s is SkillCheckInput => s != null)

    const sameEconomy = members.filter((s) => s.bonusAction == null || (s.bonusAction ? 'Bonus Action' : 'Action') === actionType)
    const otherEconomy = members.filter((s) => s.bonusAction != null && (s.bonusAction ? 'Bonus Action' : 'Action') !== actionType)

    rows.push({
      id: group.id,
      label: group.label,
      actionType,
      stat: group.stat,
      base,
      entries: sameEconomy.map(toEntry).filter((e) => differsFromBase(e, base)),
      tip: group.tip,
    })

    if (otherEconomy.length > 0) {
      rows.push({
        id: group.id,
        label: group.label,
        actionType: otherType,
        stat: group.stat,
        entries: otherEconomy.map(toEntry),
        tip: group.tip,
      })
    }
  }

  const ungrouped = inputs.filter((s) => !skillActionGroupFor(s.key))
  for (const actionType of ['Action', 'Bonus Action'] as SkillActionType[]) {
    const entries = ungrouped
      .filter((s) => (s.bonusAction ? 'Bonus Action' : 'Action') === actionType)
      .map(toEntry)
    if (entries.length > 0) {
      rows.push({
        id: 'skills',
        label: 'Skills',
        actionType,
        entries,
        tip: 'Skills that belong to no Search, Study, Influence or Hide group.',
      })
    }
  }

  return rows
}

/**
 * Collapses entries that share the same numbers, advantage and condition so
 * "13, +3 Investigation and History" is printed once.
 */
export function mergeIdenticalEntries(entries: SkillCheckEntry[]): { entry: SkillCheckEntry; labels: string[] }[] {
  const merged: { entry: SkillCheckEntry; labels: string[] }[] = []
  for (const entry of entries) {
    const match = merged.find(
      (m) =>
        m.entry.passive === entry.passive &&
        m.entry.bonus === entry.bonus &&
        m.entry.advantage === entry.advantage &&
        m.entry.disadvantage === entry.disadvantage &&
        m.entry.condition === entry.condition
    )
    if (match) match.labels.push(entry.label)
    else merged.push({ entry, labels: [entry.label] })
  }
  return merged
}
