import { cadenceLabel } from './catalogs/cadence.ts'
import { getMetamagicOption, metamagicCost, type RulesEdition } from './catalogs/metamagic.ts'

export interface SpellPlateSpellInput {
  name: string
  tags?: string
  cadence?: string
}

export interface SpellPlateLevelInput {
  level: number
  spells: SpellPlateSpellInput[]
  cadence?: string
  bonusAction?: boolean
}

export interface SpellPlateInput {
  title: string
  stat: string
  save: string | number
  attack: string | number
  className?: string
  level: number
  resourceType?: 'slots' | 'points' | 'focus' | 'pact' | string
  resourceValue?: number
  refreshRate?: string
  customRefreshRate?: string
  slots?: number[]
  preparedCount?: number
  preparedInterval?: string
  levelCadenceMap?: Record<number | string, string>
  metamagic?: {
    enabled: boolean
    points?: number
    refreshRate?: string
    options?: string[]
  }
  edition?: RulesEdition
  spellLevels: SpellPlateLevelInput[]
}

export interface SpellPlateSpell {
  name: string
  tags: string
  cadence: string
}

export interface SpellPlateLevel {
  level: number
  ordinal: string
  slotCount?: number
  cadence: string
  bonusAction: boolean
  spells: SpellPlateSpell[]
}

export interface SpellPlateOption {
  name: string
  cost: string
  effect: string
  source: string
}

export interface SpellPlateModel {
  title: string
  stat: string
  save: string
  attack: string
  resource: string
  prepared: string
  isPact?: boolean
  maxPactLevel?: number
  consolidatedSummary?: string
  metamagic?: {
    points: number
    refresh: string
    options: SpellPlateOption[]
  }
  levels: SpellPlateLevel[]
}

export interface InnateSpellPlateGroupInput {
  label: string
  spells: SpellPlateSpellInput[]
}

export interface InnateSpellPlateInput {
  stat: string
  save: string | number
  attack: string | number
  groups: InnateSpellPlateGroupInput[]
  /** Already passed through the app's token and HTML processing pipeline. */
  processedNotes?: string
}

export interface InnateSpellPlateModel {
  stat: string
  save: string
  attack: string
  groups: Array<{ label: string; spells: SpellPlateSpell[] }>
  processedNotes: string
}

/**
 * Lead printed before "Level N": "(4/Long Rest), ". A cadence that already carries a count
 * ("1/Day") or is At Will stands alone; Hidden keeps only the slot count.
 */
export function spellLevelLead(slotCount: number | undefined, cadence: string | undefined): string {
  const text = (cadence ?? '').replace(/^Per\s+/i, '').trim()
  const hidden = text.toLowerCase() === 'hidden'
  const count = slotCount && slotCount > 0 ? slotCount : undefined
  if (text && !hidden && (/^\d+\s*\//.test(text) || text.toLowerCase() === 'at will')) return `(${text}), `
  if (count && text && !hidden) return `(${count}/${text}), `
  if (count) return `(${count} slots), `
  if (text && !hidden) return `(${text}), `
  return ''
}

export const ordinalLabel = (value: number): string => {
  const n = Math.abs(Math.trunc(value))
  const lastTwo = n % 100
  const suffix = lastTwo >= 11 && lastTwo <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] ?? 'th')
  return `${n}${suffix}`
}

const normalizedSlots = (slots?: number[]) =>
  Array.from({ length: 9 }, (_, index) => Math.max(0, Math.trunc(Number(slots?.[index]) || 0)))

const spellView = (spell: SpellPlateSpellInput): SpellPlateSpell => ({
  name: spell.name,
  tags: spell.tags?.trim() ?? '',
  cadence: cadenceLabel(spell.cadence),
})

function resourceSummary(input: SpellPlateInput, slots: number[]): string {
  const resourceType = input.resourceType || 'slots'
  const className = input.className?.toLowerCase() ?? ''
  const isPact = resourceType === 'pact' || className === 'warlock'
  const refresh = cadenceLabel(input.customRefreshRate || input.refreshRate) || (isPact ? 'Short Rest' : 'Long Rest')
  const highest = slots.reduce((last, count, index) => count > 0 ? index + 1 : last, 0)
  const total = slots.reduce((sum, count) => sum + count, 0)

  if (resourceType === 'points') return Number.isFinite(input.resourceValue)
    ? `${Math.max(0, Math.trunc(input.resourceValue as number))} Spell Points · regained on ${refresh}`
    : ''
  if (resourceType === 'focus') return Number.isFinite(input.resourceValue)
    ? `${Math.max(0, Math.trunc(input.resourceValue as number))} Focus Points · regained on ${refresh}`
    : ''
  if (highest === 0 || total === 0) return ''
  if (isPact) return `Pact Magic · ${slots[highest - 1]} ${ordinalLabel(highest)}-level slot${slots[highest - 1] === 1 ? '' : 's'} · regained on ${refresh}`
  return `${total} Spell Slot${total === 1 ? '' : 's'} through ${ordinalLabel(highest)} level · regained on ${refresh}`
}

/** Builds a display-only spellcasting model; it does not mutate the monster or infer missing slots. */
interface LevelResourceInput {
  slots?: number[]
  resourceType?: string
  className?: string
  refreshRate?: string
  customRefreshRate?: string
}

/** Pact detection, default refresh and pact level: one rule for the web plate and every text export. */
function resourceContext(input: LevelResourceInput) {
  const slots = normalizedSlots(input.slots)
  const isPact = input.resourceType === 'pact' || input.className?.toLowerCase() === 'warlock'
  const defaultCadence = cadenceLabel(input.customRefreshRate || input.refreshRate) || (isPact ? 'Short Rest' : 'Long Rest')
  const maxPactLevel = slots.reduce((last, count, index) => count > 0 ? index + 1 : last, 0)
  return { slots, isPact, defaultCadence, maxPactLevel }
}

/** Slot count and "Per <cadence>" text a spell level row shows. */
function levelResource(level: number, levelCadence: string | undefined, ctx: ReturnType<typeof resourceContext>) {
  const isExplicitlyHidden = levelCadence === 'hidden'
  const customCadence = cadenceLabel(levelCadence)
  const rawCadence = isExplicitlyHidden ? '' : (customCadence || ctx.defaultCadence)
  const slotCount = level === 0 ? undefined : (ctx.isPact ? ctx.slots[ctx.maxPactLevel - 1] : ctx.slots[level - 1])
  const cadence = level === 0 || isExplicitlyHidden || !rawCadence
    ? ''
    : (rawCadence === 'At Will' ? rawCadence : `Per ${rawCadence}`)
  return { slotCount: slotCount && slotCount > 0 ? slotCount : undefined, cadence }
}

export interface SpellLevelHeadingInput extends LevelResourceInput {
  level: number
  levelCadence?: string
  bonusAction?: boolean
  /** Localised words; English defaults keep the web plate and exports identical. */
  labels?: { cantrips?: string; level?: string; bonusAction?: string }
}

/** Plain-text spell level heading in the web plate's order: "(4/Long Rest), Level 1 (Bonus Action):". */
export function spellLevelHeading(input: SpellLevelHeadingInput): string {
  const words = { cantrips: 'Cantrips (at will)', level: 'Level', bonusAction: 'Bonus Action', ...input.labels }
  if (input.level === 0) return `${words.cantrips}:`
  const ctx = resourceContext(input)
  const { slotCount, cadence } = levelResource(input.level, input.levelCadence, ctx)
  // Pact slots are shared, so their count is stated once, on the pact level.
  const lead = !ctx.isPact || input.level === ctx.maxPactLevel ? spellLevelLead(slotCount, cadence) : ''
  return `${lead}${words.level} ${input.level}${input.bonusAction ? ` (${words.bonusAction})` : ''}:`
}

export function buildSpellPlate(input: SpellPlateInput): SpellPlateModel {
  const ctx = resourceContext(input)
  const { slots, isPact, maxPactLevel } = ctx
  const levels = input.spellLevels
    .filter((row) => Number.isInteger(row.level) && row.level >= 0 && row.level <= 9 && row.spells.length > 0)
    .sort((a, b) => a.level - b.level)
    .map((row): SpellPlateLevel => {
      const { slotCount, cadence: cadenceText } = levelResource(row.level, input.levelCadenceMap?.[row.level], ctx)
      const isRestrictedCadence = (cadence?: string): boolean => {
        if (!cadence) return false
        const c = cadence.trim().toLowerCase()
        if (c === '' || c === 'hidden' || c === 'none' || c === 'at will' || c === 'at_will' || c === 'slots' || c === 'always' || c === 'always prepared') return false
        return true
      }
      const sortedSpells = [...row.spells].sort((a, b) => {
        const aRestricted = isRestrictedCadence(a.cadence)
        const bRestricted = isRestrictedCadence(b.cadence)
        if (aRestricted === bRestricted) return 0
        return aRestricted ? 1 : -1
      })
      return {
        level: row.level,
        ordinal: ordinalLabel(row.level),
        slotCount,
        cadence: cadenceText,
        bonusAction: Boolean(row.bonusAction),
        spells: sortedSpells.map(spellView),
      }
    })

  const metamagic = input.metamagic?.enabled
    ? {
        points: Math.max(0, Math.trunc(input.metamagic.points ?? input.level)),
        refresh: cadenceLabel(input.metamagic.refreshRate) || 'Long Rest',
        options: (input.metamagic.options ?? []).map((name): SpellPlateOption => {
          const option = getMetamagicOption(name)
          const edition = input.edition ?? '2024'
          return {
            name,
            cost: metamagicCost(name, edition),
            effect: option?.[edition === '2014' ? 'effect2014' : 'effect2024'] ?? '',
            source: option?.[edition === '2014' ? 'source2014' : 'source2024'] ?? 'Custom',
          }
        }),
      }
    : undefined

  return {
    title: input.title,
    stat: input.stat,
    save: String(input.save),
    attack: typeof input.attack === 'number' && input.attack >= 0 ? `+${input.attack}` : String(input.attack),
    resource: resourceSummary(input, slots),
    prepared: input.preparedCount && input.preparedCount > 0
      ? `${Math.trunc(input.preparedCount)} prepared ${input.className || 'Caster'} spells · ${cadenceLabel(input.preparedInterval) || 'Long Rest'}`
      : '',
    isPact,
    maxPactLevel,
    metamagic,
    levels,
  }
}

/** Keeps innate spell groups independent from class slots and recovery. */
export function buildInnateSpellPlate(input: InnateSpellPlateInput): InnateSpellPlateModel {
  return {
    stat: input.stat,
    save: String(input.save),
    attack: typeof input.attack === 'number' && input.attack >= 0 ? `+${input.attack}` : String(input.attack),
    groups: input.groups
      .filter((group) => group.spells.length > 0)
      .map((group) => ({ label: group.label, spells: group.spells.map(spellView) })),
    processedNotes: input.processedNotes ?? '',
  }
}
