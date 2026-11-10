import { cadenceLabel } from './catalogs/cadence.ts'
import { getMetamagicOption, metamagicCost, type RulesEdition } from './catalogs/metamagic.ts'

export interface SpellPlateSpellInput {
  name: string
  tags?: string
  cadence?: string
  amount?: number | null
  bonusAction?: boolean
}

export interface SpellPlateLevelInput {
  level: number
  spells: SpellPlateSpellInput[]
  cadence?: string
  bonusAction?: boolean
  amount?: number | null
}

export interface SpellPlateInput {
  title: string
  stat: string
  save: string | number
  attack: string | number
  className?: string
  level: number
  resourceType?: 'slots' | 'points' | 'focus' | 'pact' | string
  pactPool?: boolean
  resourceValue?: number
  refreshRate?: string
  customRefreshRate?: string
  slots?: number[]
  preparedCount?: number
  preparedInterval?: string
  levelCadenceMap?: Record<number | string, string>
  levelAmountMap?: Record<number | string, number | null>
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
  amount?: number
  bonusAction?: boolean
  lead: string
  actionLabel: string
}

export interface SpellPlateLevel {
  level: number
  ordinal: string
  slotCount?: number
  amount?: number
  cadence: string
  bonusAction: boolean
  spells: SpellPlateSpell[]
  heading: string
  effectiveCadence: string
  sourceId?: string
  sourceLabel?: string
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

/** A non-negative finite explicit amount; zero remains an authored fact. */
export function spellAmount(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.trunc(value) : undefined
}

/** Amount precedes cadence. No amount means no cadence label, including At Will. */
export function spellLevelLead(amount: number | undefined, cadence: string | undefined): string {
  const count = spellAmount(amount)
  if (count === undefined || count === 0) return ''
  const text = cadenceLabel((cadence ?? '').replace(/^Per\s+/i, '')).trim()
  if (!text || /^hidden$/i.test(text)) return `(${count}), `
  // Cadences such as 1/Day already contain their frequency; the explicit amount remains authoritative.
  const recovery = text.replace(/^\d+\s*\/\s*/, '')
  return `(${count}/${recovery}), `
}

/** Older saved cadence values such as 1_day already carry an explicit use count. */
export function spellCadenceAmount(cadence?: string): number | undefined {
  const counted = cadenceLabel(cadence).trim().match(/^(\d+)\s*\//)
  return counted ? Number(counted[1]) : undefined
}

export interface SpellEntryPresentation {
  amount?: number | null
  cadence?: string
  bonusAction?: boolean
  rowAmount?: number | null
  rowCadence?: string
  rowBonusAction?: boolean
}

/** Cadence may inherit, but a displayed per-spell budget always requires an authored positive amount. */
export function spellEntryLead(input: SpellEntryPresentation): string {
  const ownAmount = input.amount === null ? undefined : spellAmount(input.amount) ?? spellCadenceAmount(input.cadence)
  const rowAmount = spellAmount(input.rowAmount)
  const amount = ownAmount
  const differs = (ownAmount !== undefined && ownAmount !== rowAmount)
    || spellCadenceDiffers(input.cadence, input.rowCadence)
  if (!differs || amount === undefined || amount === 0) return ''
  const cadenceDiffers = spellCadenceDiffers(input.cadence, input.rowCadence)
  return spellLevelLead(amount, cadenceDiffers ? input.cadence : 'hidden')
}

/** Explicit false is meaningful: an Action spell may override a Bonus Action row. */
export function spellEntryActionLabel(bonusAction?: boolean, rowBonusAction = false): string {
  return bonusAction === undefined || bonusAction === rowBonusAction ? '' : bonusAction ? '(Bonus Action)' : '(Action)'
}

export const ordinalLabel = (value: number): string => {
  const n = Math.abs(Math.trunc(value))
  const lastTwo = n % 100
  const suffix = lastTwo >= 11 && lastTwo <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] ?? 'th')
  return `${n}${suffix}`
}

const normalizedSlots = (slots?: number[]) =>
  Array.from({ length: 9 }, (_, index) => Math.max(0, Math.trunc(Number(slots?.[index]) || 0)))

const spellView = (spell: SpellPlateSpellInput, row: SpellEntryPresentation = {}): SpellPlateSpell => ({
  name: spell.name,
  tags: spell.tags?.trim() ?? '',
  cadence: cadenceLabel(spell.cadence),
  amount: spellAmount(spell.amount),
  bonusAction: spell.bonusAction,
  lead: spellEntryLead({ ...row, ...spell }),
  actionLabel: spellEntryActionLabel(spell.bonusAction, row.rowBonusAction),
})

/** One Pact sentence for consolidated summaries and per-source plates. */
export function pactResourceSummary(slots: number[], recoveryCadence = 'short_rest'): string {
  const values = normalizedSlots(slots)
  const highest = values.reduce((last, count, index) => count > 0 ? index + 1 : last, 0)
  if (!highest) return ''
  const count = values[highest - 1]
  if (recoveryCadence === 'hidden') return `You have ${count} spell slot${count === 1 ? '' : 's'} of ${ordinalLabel(highest)} level`
  const cadence = (cadenceLabel(recoveryCadence) || 'Short Rest').replace(/\b(Short|Long) Rest$/i, '$1 Rests')
  return `You have ${count} spell slot${count === 1 ? '' : 's'} of ${ordinalLabel(highest)} level, regained on ${cadence}`
}

function resourceSummary(input: SpellPlateInput, slots: number[]): string {
  const resourceType = input.resourceType || 'slots'
  const className = input.className?.toLowerCase() ?? ''
  const isPact = input.pactPool ?? (resourceType === 'pact' || className === 'warlock')
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
  const recovery = refresh.replace(/\b(Short|Long) Rest$/i, '$1 Rests')
  if (isPact) return pactResourceSummary(slots, refresh)
  return `You have ${total} spell slot${total === 1 ? '' : 's'} through ${ordinalLabel(highest)} level, regained on ${recovery}`
}

/** Builds a display-only spellcasting model; it does not mutate the monster or infer missing slots. */
interface LevelResourceInput {
  contribution?: { mode?: string; target?: string }
  slots?: number[]
  pactPool?: boolean
  resourceType?: string
  className?: string
  refreshRate?: string
  customRefreshRate?: string
}

/** One default for editor controls, row headings and exception badges. */
export function spellRowRecovery(level: number, explicit: string | undefined, source: LevelResourceInput = {}): string {
  if (explicit?.trim()) return explicit
  if (level === 0) return 'at_will'
  const pact = source.pactPool ?? (source.contribution?.mode === 'custom' ? source.contribution.target === 'pact' : source.resourceType === 'pact' || source.className?.toLowerCase() === 'warlock')
  return source.customRefreshRate || source.refreshRate || (pact ? 'short_rest' : 'long_rest')
}

/** Pact detection, default refresh and pact level: one rule for the web plate and every text export. */
function resourceContext(input: LevelResourceInput) {
  const slots = normalizedSlots(input.slots)
  const isPact = input.pactPool ?? (input.resourceType === 'pact' || input.className?.toLowerCase() === 'warlock')
  const defaultCadence = cadenceLabel(input.customRefreshRate || input.refreshRate) || (isPact ? 'Short Rest' : 'Long Rest')
  const maxPactLevel = slots.reduce((last, count, index) => count > 0 ? index + 1 : last, 0)
  return { slots, isPact, defaultCadence, maxPactLevel }
}

/** Slot count and "Per <cadence>" text a spell level row shows. */
function levelResource(level: number, levelCadence: string | undefined, ctx: ReturnType<typeof resourceContext>, explicitAmount?: number | null) {
  const isExplicitlyHidden = levelCadence?.trim().toLowerCase() === 'hidden'
  const customCadence = cadenceLabel(levelCadence)
  const rawCadence = isExplicitlyHidden ? '' : (customCadence || (level === 0 ? 'At Will' : ctx.defaultCadence))
  const slotCount = level === 0 ? undefined : (ctx.isPact ? ctx.slots[ctx.maxPactLevel - 1] : ctx.slots[level - 1])
  const defaultAmount = level === 0 || (ctx.isPact && level !== ctx.maxPactLevel) ? undefined : slotCount && slotCount > 0 ? slotCount : undefined
  const amount = explicitAmount === null ? undefined : spellAmount(explicitAmount) ?? spellCadenceAmount(levelCadence) ?? defaultAmount
  const cadence = isExplicitlyHidden || !rawCadence
    ? ''
    : (rawCadence === 'At Will' ? rawCadence : `Per ${rawCadence}`)
  return { slotCount: slotCount && slotCount > 0 ? slotCount : undefined, amount, cadence }
}

export interface SpellLevelHeadingInput extends LevelResourceInput {
  level: number
  levelCadence?: string
  amount?: number | null
  bonusAction?: boolean
  /** Localised words; English defaults keep the web plate and exports identical. */
  labels?: { cantrips?: string; level?: string; bonusAction?: string }
}

/** Plain-text spell level heading in the web plate's order: "(4/Long Rest), Level 1 (Bonus Action):". */
export function spellLevelHeading(input: SpellLevelHeadingInput): string {
  const words = { cantrips: 'Cantrips (at will)', level: 'Level', bonusAction: 'Bonus Action', ...input.labels }
  const ctx = resourceContext(input)
  const { amount, cadence } = levelResource(input.level, input.levelCadence, ctx, input.amount)
  const lead = spellLevelLead(amount, cadence)
  const level = input.level === 0 ? words.cantrips.replace(/\s*\(at will\)/i, '') : `${words.level} ${input.level}`
  return `${lead}${level}${input.bonusAction ? ` (${words.bonusAction})` : ''}:`
}

export function buildSpellPlate(input: SpellPlateInput): SpellPlateModel {
  const ctx = resourceContext(input)
  const { slots, isPact, maxPactLevel } = ctx
  const levels = input.spellLevels
    .filter((row) => Number.isInteger(row.level) && row.level >= 0 && row.level <= 9 && row.spells.length > 0)
    .sort((a, b) => a.level - b.level)
    .map((row): SpellPlateLevel => {
      const rowAmount = row.amount !== undefined ? row.amount : input.levelAmountMap?.[row.level]
      const { slotCount, amount, cadence: cadenceText } = levelResource(row.level, row.cadence ?? input.levelCadenceMap?.[row.level], ctx, rowAmount)
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
        heading: spellLevelHeading({ ...input, level: row.level, levelCadence: row.cadence ?? input.levelCadenceMap?.[row.level], bonusAction: row.bonusAction, amount: rowAmount }),
        effectiveCadence: cadenceText.replace(/^Per\s+/i, ''),
        level: row.level,
        ordinal: ordinalLabel(row.level),
        slotCount,
        amount,
        cadence: cadenceText,
        bonusAction: Boolean(row.bonusAction),
        spells: sortedSpells.map(spell => spellView(spell, { rowAmount: amount, rowCadence: cadenceText.replace(/^Per\s+/i, ''), rowBonusAction: Boolean(row.bonusAction) })),
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
      .map((group) => ({ label: group.label, spells: group.spells.map(spell => spellView(spell)) })),
    processedNotes: input.processedNotes ?? '',
  }
}

/** A spell badge only describes an explicit exception to its owning row. Never infer a majority. */
export function spellCadenceDiffers(spellCadence: string | undefined, rowCadence: string | undefined): boolean {
  const normalize = (value?: string) => cadenceLabel(value?.replace(/^Per\s+/i, '')).trim().toLowerCase()
  const spell = normalize(spellCadence)
  return Boolean(spell && spell !== 'none' && spell !== normalize(rowCadence))
}

/** Retains source ownership inside one consolidated trait; equal spell levels may have different rules. */
export function consolidateSpellPlates(primary: SpellPlateModel, additions: Array<{ id: string; label: string; plate: SpellPlateModel }>): SpellPlateModel {
  return {
    ...primary,
    resource: [primary.resource, ...additions.filter(({ plate }) => plate.resource).map(({ label, plate }) => `${label}: ${plate.resource}`)].filter(Boolean).join(' · '),
    levels: [
      ...primary.levels.map((row) => ({ ...row, sourceId: 'primary' })),
      ...additions.flatMap(({ id, label, plate }) => plate.levels.map((row) => ({ ...row, sourceId: id, sourceLabel: label, heading: `${label} · ${row.heading}` }))),
    ],
  }
}

/** Text adapters use the same exception rule as the web badge. */
export function spellNameWithCadence(name: string, cadence?: string, rowCadence?: string, options: Omit<SpellEntryPresentation, 'cadence' | 'rowCadence'> = {}): string {
  const lead = spellEntryLead({ ...options, cadence, rowCadence })
  const action = spellEntryActionLabel(options.bonusAction, options.rowBonusAction)
  return `${lead}${name}${action ? ` ${action}` : ''}`
}
