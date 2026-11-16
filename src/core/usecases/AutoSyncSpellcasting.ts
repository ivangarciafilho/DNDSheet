import { statModifier } from '../domain/math-utils.ts'
import type { DndStat, Monster } from '../domain/types.ts'
export * from './spell-slot-tables.ts'
import { getDefaultStatForClass, getSpellSlotsForClass, resolveDefaultStatForClass } from './spell-slot-tables.ts'
export * from './spellcasting-metrics.ts'
import { SRD_SUBCLASSES_BY_CLASS } from './spellcasting-metrics.ts'

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
  source: string
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

export function resolveSubclassExpandedSpellKey(className?: string, subclass?: string): string | undefined {
  const cls = (className || '').trim().toLowerCase()
  const rawSub = (subclass || '').trim().toLowerCase()
  if (!cls || !rawSub) return undefined

  const normalizedSub = rawSub
    .replace(/^(?:oath\s+of\s+(?:the\s+)?|the\s+)/, '')
    .replace(/\s+(?:domain|patron|soul)$/, '')
    .trim()

  const candidates = new Set([`${cls}:${rawSub}`, ...(normalizedSub ? [`${cls}:${normalizedSub}`] : [])])
  return Object.keys(SUBCLASS_EXPANDED_SPELLS).find((k) => candidates.has(k.toLowerCase()))
}

export const SUBCLASS_CATALOG: SubclassCatalogEntry[] = Object.entries(SRD_SUBCLASSES_BY_CLASS).flatMap(
  ([className, subclasses]) =>
    subclasses.map((subclass) => {
      const progressionOverride: CasterProgressionType | undefined =
        subclass === 'Eldritch Knight' || subclass === 'Arcane Trickster' ? 'third' : undefined
      return {
        id: `${className.toLowerCase()}-${subclass.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        className,
        subclass,
        source: 'SRD 5.1 / 5.2',
        ...(progressionOverride ? { progressionOverride } : {}),
        defaultAbility: getDefaultStatForClass(className),
        hasExpandedSpells: Boolean(resolveSubclassExpandedSpellKey(className, subclass)),
      }
    })
)

export function getCatalogSubclassesForClass(className?: string): SubclassCatalogEntry[] {
  const clean = (className || '').trim().toLowerCase()
  if (!clean) return []
  return SUBCLASS_CATALOG.filter((entry) => entry.className.toLowerCase() === clean)
}

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
  const matchKey = resolveSubclassExpandedSpellKey(cls, sub)
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
  subclass?: string
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
      ? resolveDefaultStatForClass(input.className, input.subclass) ?? ''
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- legacy spellcasting payloads are untyped JSON; this function is their migration boundary
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- legacy spellcasting payloads are untyped JSON; this function is their migration boundary
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- legacy spellcasting payloads are untyped JSON; this function is their migration boundary
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- legacy spellcasting payloads are untyped JSON; this function is their migration boundary
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
