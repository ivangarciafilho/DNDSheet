import type { AbilityArea, AbilityOutcome, AbilityTargeting, AttackReach, AttackSource, DndStat, MonsterAction } from './types.ts'
import { evaluateFormula } from './formula.ts'
import type { FormulaContext, FormulaStyle } from './formula.ts'

export interface AbilityProjection {
  attackReach?: AttackReach
  attackSource?: AttackSource
  attackBonus?: number | string
  saveAbility?: DndStat
  saveDc?: number | string
  targeting?: AbilityTargeting
  outcomes: AbilityOutcome[]
  description: string
  attackCount?: number | string
  attackRollModifier?: 'advantage' | 'disadvantage' | 'none'
  attackException?: string
}

export interface AbilityRenderContext {
  attackBonus?: number
  saveDc?: number
  formulaContext?: FormulaContext
}

/** `html` wraps clause labels (Attack Roll, Saving Throw, Hit, Failure…) in `<i>` for web surfaces. */
export type AbilityMarkup = 'text' | 'html'

export interface Text2024Options {
  markup?: AbilityMarkup
  /** Full entry projections put components beside their caller-owned name. Standalone rules text retains them. */
  componentsInLead?: boolean
}

const markLabel = (label: string, markup: AbilityMarkup): string => markup === 'html' ? `<i>${label}</i>` : label

const ATTACK_SOURCES: Record<string, AttackSource> = {
  spell_attack: 'spell',
  weapon_attack: 'weapon',
}

const REACH_LABELS: Record<AttackReach, string> = {
  melee: 'Melee',
  ranged: 'Ranged',
  melee_or_ranged: 'Melee or Ranged',
}

export const ABILITY_NAMES: Readonly<Record<DndStat, string>> = {
  STR: 'Strength',
  DEX: 'Dexterity',
  CON: 'Constitution',
  INT: 'Intelligence',
  WIS: 'Wisdom',
  CHA: 'Charisma',
}

const NUMBER_WORDS: Record<number, string> = {
  0: 'zero', 1: 'one', 2: 'two', 3: 'three', 4: 'four', 5: 'five',
  6: 'six', 7: 'seven', 8: 'eight', 9: 'nine', 10: 'ten',
  11: 'eleven', 12: 'twelve', 13: 'thirteen', 14: 'fourteen', 15: 'fifteen',
  16: 'sixteen', 17: 'seventeen', 18: 'eighteen', 19: 'nineteen', 20: 'twenty',
}

const hasOwnValue = (object: object, key: string): boolean =>
  Object.prototype.hasOwnProperty.call(object, key) && (object as Record<string, unknown>)[key] !== undefined

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const nonEmptyText = (value: unknown): string => typeof value === 'string' ? value.trim() : ''

/** Authored presentation facts shared by modern headers and classic/export prose. */
export function abilityHeader(action: Partial<MonsterAction>): { discipline: string; components: string[]; duration: string } {
  const field = (value: unknown) => /^none$/i.test(nonEmptyText(value)) ? '' : nonEmptyText(value)
  const tier = field(action.spellLevel), school = field(action.school)
  return {
    discipline: (/^cantrip$/i.test(tier) ? [school, tier] : [tier, school]).filter(Boolean).join(' '),
    components: Array.isArray(action.components) ? action.components.map(nonEmptyText).filter(Boolean) : [],
    duration: /^instantaneous$/i.test(field(action.duration)) ? '' : field(action.duration),
  }
}

/** A shared head contract: cadence, identity, classification, duration. Unknown extension cells stay last. */
export function abilityHeadOrder(action: Partial<MonsterAction>): readonly string[] {
  const tier = nonEmptyText(action.spellLevel)
  const classification = tier && !/^cantrip$|^none$/i.test(tier) ? ['tier', 'discipline'] : ['discipline', 'tier']
  return ['usage', 'name', 'components', ...classification, 'duration']
}

/** Authored identity; HTML adapters request escaped text before adding their own emphasis. */
export function abilityIdentity(action: Partial<MonsterAction>, markup: AbilityMarkup = 'text'): string {
  const components = abilityHeader(action).components
  const identity = [action.name || '', components.length ? `(${components.join(', ')})` : ''].filter(Boolean).join(' ')
  return markup === 'html' ? identity.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : identity
}

const validAbilityNumber = (value: unknown): value is number | string =>
  (typeof value === 'number' && Number.isFinite(value)) || (typeof value === 'string' && !!value.trim())

export function hasStructuredAbility(action: Partial<MonsterAction>): boolean {
  return ['attackReach', 'attackSource', 'targeting', 'outcomes'].some((key) => hasOwnValue(action, key))
}

const inferReach = (range: string | undefined): AttackReach | undefined => {
  const value = String(range ?? '').trim()
  if (/^(?:melee(?:\s+(?:weapon|spell))?(?:\s+attack)?|reach\b)/i.test(value)) return 'melee'
  if (/^(?:ranged(?:\s+(?:weapon|spell))?(?:\s+attack)?|range\b)/i.test(value)) return 'ranged'
  return undefined
}

const parseDistance = (input: string | undefined): { distance: number; unit: 'ft' | 'mi'; relation?: 'within' | 'reach' | 'range' } | undefined => {
  const match = String(input ?? '').trim().match(/^(?:(within|reach|range)\s+)?(\d+(?:\.\d+)?)\s*(ft\.?|feet|foot|mi\.?|miles?)$/i)
  if (!match) return undefined
  const unitText = match[3].toLowerCase()
  return {
    distance: Number(match[2]),
    unit: unitText.startsWith('mi') ? 'mi' : 'ft',
    relation: match[1]?.toLowerCase() as 'within' | 'reach' | 'range' | undefined,
  }
}

const SMALL_NUMBER_VALUES: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
}

const parseTargets = (input: string | undefined): Pick<AbilityTargeting, 'count' | 'countMode' | 'kind' | 'qualifier'> | undefined => {
  const text = String(input ?? '').trim()
  if (!text) return undefined
  // Support formula tokens like {1+CANTRIP_TIER} as well as numbers and words
  const match = text.match(/^(?:(up\s+to)\s+)?(\{.+?\}|all|\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+(.+)$/i)
  if (!match) {
    // If text starts with a relative clause without an explicit count (e.g. "which you can see")
    const relMatch = text.match(/^(?:(which|that|who)\s+(.+))$/i)
    if (relMatch) {
      return {
        count: 1,
        countMode: 'exact',
        kind: 'target',
        qualifier: text.trim(),
      }
    }
    return undefined
  }

  const rawCount = match[2]
  const countText = rawCount.toLowerCase()
  const count = /^\{.+\}$/.test(rawCount)
    ? rawCount
    : countText === 'all'
    ? 'all'
    : /^\d+$/.test(countText)
    ? Number(countText)
    : SMALL_NUMBER_VALUES[countText]

  const targetText = match[3].trim()
  // Check if targetText starts directly with relative pronoun e.g. "which you can see"
  const leadingRel = targetText.match(/^(which|that|who)\s+(.+)$/i)
  let kind = 'target'
  let qualifier: string | undefined

  if (leadingRel) {
    kind = 'target'
    qualifier = `${leadingRel[1].toLowerCase()} ${leadingRel[2].trim()}`
  } else {
    const targetDetail = targetText.match(/^(.+?)\s+(which|that|who)\s+(.+)$/i)
    kind = (targetDetail?.[1] ?? targetText).trim()
    qualifier = targetDetail ? `${targetDetail[2].toLowerCase()} ${targetDetail[3].trim()}` : undefined
  }

  return {
    count,
    countMode: match[1] ? 'up_to' : 'exact',
    kind,
    qualifier,
  }
}

const parseArea = (shape: string | undefined, distance: string | undefined): AbilityArea | undefined => {
  const cleanShape = String(shape ?? '').trim()
  const cleanDistance = String(distance ?? '').trim()
  if (!cleanShape) return undefined
  if (!cleanDistance) return { shape: cleanShape }
  const parsed = parseDistance(cleanDistance)
  if (parsed) return { shape: cleanShape, distance: parsed.distance, unit: parsed.unit }
  if (/^\d+(?:\.\d+)?$/.test(cleanDistance)) return { shape: cleanShape, distance: Number(cleanDistance), unit: 'ft' }
  return undefined
}

const canonicalTrigger = (input: string): string => {
  const value = input.trim().replace(/^on\s+/i, '').toLowerCase()
  if (value === 'hit' || value === 'failure' || value === 'success') return value
  return input.trim()
}

const legacyOutcomes = (effects: MonsterAction['effects'] | undefined): AbilityOutcome[] =>
  (Array.isArray(effects) ? effects : [])
    .filter((effect) => effect && (String(effect.case ?? '').trim() || String(effect.effect ?? '').trim()))
    .map((effect) => ({
      trigger: canonicalTrigger(String(effect.case ?? '')),
      effects: String(effect.effect ?? '').trim() ? [{ kind: 'text', text: String(effect.effect).trim() }] : [],
    }))

const inferTargeting = (action: Partial<MonsterAction>): AbilityTargeting | undefined => {
  const rawParts: string[] = []
  const targeting: AbilityTargeting = {}
  const targets = parseTargets(nonEmptyText(action.targetsText))
  if (targets) Object.assign(targeting, targets)
  else if (nonEmptyText(action.targetsText)) rawParts.push(nonEmptyText(action.targetsText))

  const rangeText = nonEmptyText(action.range)
  const range = parseDistance(rangeText)
  if (range) targeting.range = range
  else if (rangeText && !inferReach(rangeText)) rawParts.unshift(rangeText)

  const area = parseArea(action.areaShape, action.areaDistance)
  if (area) targeting.area = area
  else {
    if (nonEmptyText(action.areaDistance)) rawParts.push(nonEmptyText(action.areaDistance))
    if (nonEmptyText(action.areaShape)) rawParts.push(nonEmptyText(action.areaShape))
  }

  if (rawParts.length) targeting.raw = rawParts.join('; ')
  return Object.keys(targeting).length ? targeting : undefined
}

const normalizeTargeting = (input: unknown): AbilityTargeting | undefined => {
  if (!isRecord(input)) return undefined
  const result: AbilityTargeting = {}
  if (input.count === 'all' || validAbilityNumber(input.count)) result.count = input.count
  if (input.countMode === 'exact' || input.countMode === 'up_to') result.countMode = input.countMode
  if (typeof input.kind === 'string' && input.kind.trim()) result.kind = input.kind.trim()
  if (typeof input.qualifier === 'string' && input.qualifier.trim()) result.qualifier = input.qualifier.trim()
  if (typeof input.raw === 'string') result.raw = input.raw
  if (Array.isArray(input.planes)) result.planes = input.planes.filter((plane): plane is string => typeof plane === 'string')

  if (isRecord(input.range) && validAbilityNumber(input.range.distance) && (input.range.unit === 'ft' || input.range.unit === 'mi')) {
    result.range = {
      distance: input.range.distance,
      unit: input.range.unit,
      relation: input.range.relation === 'within' || input.range.relation === 'reach' || input.range.relation === 'range'
        ? input.range.relation
        : undefined,
      origin: typeof input.range.origin === 'string' ? input.range.origin : undefined,
    }
  }

  if (isRecord(input.area) && typeof input.area.shape === 'string' && input.area.shape.trim()) {
    result.area = {
      shape: input.area.shape,
      distance: validAbilityNumber(input.area.distance) ? input.area.distance : undefined,
      unit: input.area.unit === 'mi' ? 'mi' : 'ft',
      origin: typeof input.area.origin === 'string' ? input.area.origin : undefined,
    }
  }
  return Object.keys(result).length ? result : undefined
}

const normalizeOutcomes = (input: unknown): AbilityOutcome[] => {
  if (!Array.isArray(input)) return []
  return input.filter((outcome): outcome is Record<string, unknown> =>
    isRecord(outcome) && typeof outcome.trigger === 'string' && !!outcome.trigger.trim()
  ).map((outcome) => ({
    trigger: String(outcome.trigger).trim(),
    effects: Array.isArray(outcome.effects)
      ? outcome.effects.filter(isRecord).map((effect) => ({
        kind: effect.kind === 'damage' ? 'damage' : effect.kind === 'text' ? 'text' : undefined,
        text: typeof effect.text === 'string' ? effect.text : undefined,
        formula: typeof effect.formula === 'string' ? effect.formula : undefined,
        damageType: typeof effect.damageType === 'string' ? effect.damageType : undefined,
      }))
      : [],
    rider: typeof outcome.rider === 'string' ? outcome.rider : undefined,
    id: typeof outcome.id === 'string' ? outcome.id : undefined,
    recipient: typeof outcome.recipient === 'string' && outcome.recipient.trim() ? outcome.recipient.trim() : undefined,
    refs: Array.isArray(outcome.refs) ? outcome.refs.filter((r): r is string => typeof r === 'string') : undefined,
    presentation: outcome.presentation === 'vertical' || outcome.presentation === 'horizontal' ? outcome.presentation : undefined,
  }))
}

export function inferAbility(action: Partial<MonsterAction>): AbilityProjection {
  const validStat = action.stat && action.stat !== 'none' && Object.prototype.hasOwnProperty.call(ABILITY_NAMES, action.stat)
    ? action.stat as DndStat
    : undefined
  const inferredTargeting = inferTargeting(action)
  const explicitTargeting = normalizeTargeting(action.targeting)
  const hasExplicitTargeting = explicitTargeting !== undefined
  const safeInferredTargeting = inferredTargeting ? Object.fromEntries(
    Object.entries(inferredTargeting).filter(([key]) => key !== 'raw')
  ) as AbilityTargeting : undefined
  const targeting = hasExplicitTargeting
    ? { ...safeInferredTargeting, ...explicitTargeting }
    : inferredTargeting
  const explicitReach = typeof action.attackReach === 'string' && Object.prototype.hasOwnProperty.call(REACH_LABELS, action.attackReach)
    ? action.attackReach as AttackReach
    : undefined
  const explicitSource = typeof action.attackSource === 'string' && Object.prototype.hasOwnProperty.call({ spell: true, weapon: true }, action.attackSource)
    ? action.attackSource as AttackSource
    : undefined

  return {
    attackReach: explicitReach ?? (action.actionType && ATTACK_SOURCES[action.actionType] ? inferReach(action.range) : undefined),
    attackSource: explicitSource ?? ATTACK_SOURCES[String(action.actionType ?? '')],
    attackBonus: action.attackBonus,
    saveAbility: validStat,
    saveDc: action.save?.override ? action.save.overrideValue : undefined,
    targeting,
    outcomes: action.outcomes !== undefined ? normalizeOutcomes(action.outcomes) : legacyOutcomes(action.effects),
    description: String(action.description ?? ''),
    attackCount: action.attackCount,
    attackRollModifier: action.attackRollModifier,
    attackException: action.attackException,
  }
}

const valueText = (input: number | string, context: AbilityRenderContext = {}, style: FormulaStyle = 'number'): string => {
  if (typeof input === 'number') return Number.isFinite(input) ? formatNumber(input, style) : ''
  const source = String(input ?? '').trim()
  if (!source || !context.formulaContext) return source
  const result = evaluateFormula(source, context.formulaContext, { style })
  if (!result.ok || (style !== 'dice' && result.dice.length > 0)) return source
  return result.text
}

function formatNumber(value: number, style: FormulaStyle): string {
  if (style === 'bonus') return value > 0 ? `+${value}` : String(value)
  return String(value)
}

const resolvedCount = (count: AbilityTargeting['count'], context: AbilityRenderContext): { text: string; number?: number } | undefined => {
  if (count === undefined) return undefined
  if (count === 'all') return { text: 'all' }
  const text = valueText(count, context)
  const numeric = Number(text)
  return { text, number: Number.isFinite(numeric) ? numeric : undefined }
}

const formatCount = (count: { text: string; number?: number }, useWords: boolean): string => {
  if (!useWords || count.number === undefined) return count.text
  return NUMBER_WORDS[count.number] ?? count.text
}

// Catalog nouns and creature types that may be inflected for number; Fey and Undead are invariant in 5e.
const NOUN_PAIRS: readonly (readonly [string, string])[] = [
  ['creature', 'creatures'], ['target', 'targets'], ['object', 'objects'], ['ally', 'allies'], ['enemy', 'enemies'],
  ['aberration', 'aberrations'], ['beast', 'beasts'], ['celestial', 'celestials'], ['construct', 'constructs'],
  ['dragon', 'dragons'], ['elemental', 'elementals'], ['fiend', 'fiends'], ['giant', 'giants'], ['humanoid', 'humanoids'],
  ['monstrosity', 'monstrosities'], ['ooze', 'oozes'], ['plant', 'plants'], ['fey', 'fey'], ['undead', 'undead'],
]
const NOUN_FORMS = new Map<string, readonly [string, string]>()
for (const pair of NOUN_PAIRS) { NOUN_FORMS.set(pair[0], pair); NOUN_FORMS.set(pair[1], pair) }

const matchCase = (word: string, target: string): string => {
  if (word.length > 1 && word === word.toUpperCase() && word !== word.toLowerCase()) return target.toUpperCase()
  return /^[A-Z]/.test(word) ? target.charAt(0).toUpperCase() + target.slice(1) : target
}

// Inflects the last word of each coordinated conjunct in the noun head ("target creature", "creatures or objects"),
// leaving any trailing qualifier untouched ("creature of your choice"). Undefined when no catalog noun is present.
const HEAD_BOUNDARY = /\s+(?:of|that|which|who|within|in|with|from|on|at)\s+/i
const agreeNoun = (kind: string, plural: boolean): string | undefined => {
  const boundary = HEAD_BOUNDARY.exec(kind)
  const head = boundary ? kind.slice(0, boundary.index) : kind
  const tail = boundary ? kind.slice(boundary.index) : ''
  let changed = false
  const agreed = head.split(/(\s+(?:or|and)\s+)/i).map((part, index) => {
    if (index % 2) return part
    const words = part.split(/(\s+)/)
    const forms = NOUN_FORMS.get(words[words.length - 1].toLowerCase())
    if (!forms) return part
    changed = true
    words[words.length - 1] = matchCase(words[words.length - 1], forms[plural ? 1 : 0])
    return words.join('')
  }).join('')
  return changed ? agreed + tail : undefined
}

// Target nouns agree with their count. Unknown authored nouns keep the earlier contract: they are only singularized
// for a count of one and never guessed into a plural.
const normalizeKind = (kind: string, count: { text: string; number?: number } | undefined): string => {
  const value = kind.trim()
  if (!value || !count) return value
  const plural = count.text === 'all' || count.number !== 1
  const agreed = agreeNoun(value, plural)
  if (agreed !== undefined || plural) return agreed ?? value
  if (/ies$/i.test(value)) return `${value.slice(0, -3)}y`
  if (/s$/i.test(value)) return value.slice(0, -1)
  return value
}

const formatDistance = (distance: number | string, unit: 'ft' | 'mi', context: AbilityRenderContext): string => {
  const value = valueText(distance, context)
  return `${value} ${unit === 'ft' ? 'ft.' : Number(value) === 1 ? 'mile' : 'miles'}`.trim()
}

export const rangePhrase = (range: NonNullable<AbilityTargeting['range']>, context: AbilityRenderContext = {}): string => {
  const distance = formatDistance(range.distance, range.unit, context)
  const relation = range.relation
  const lead = relation ? `${relation} ` : ''
  const origin = range.origin?.trim() ? ` of ${range.origin.trim()}` : ''
  return `${lead}${distance}${origin}`
}

export const areaPhrase = (area: AbilityArea, context: AbilityRenderContext = {}): string => {
  const distance = area.distance !== undefined
    ? `${valueText(area.distance, context)}-${area.unit === 'mi' ? 'mile' : 'foot'} `
    : ''
  const origin = area.origin?.trim() ? ` originating from ${area.origin.trim()}` : ''
  return `in a ${distance}${area.shape.trim()}${origin}`.trim()
}

export const planesPhrase = (input: readonly string[] | undefined): string => {
  const planes = (input ?? []).map((plane) => plane.trim()).filter(Boolean)
  if (planes.length === 1) return `across the ${planes[0]} Plane`
  if (planes.length > 1) return `across the ${planes.slice(0, -1).join(', ')} and ${planes[planes.length - 1]} Planes`
  return ''
}

export function scopePhrase(
  ability: AbilityProjection,
  context: AbilityRenderContext = {},
  mode: 'screen' | 'text2024' = 'screen'
): string {
  const targeting = ability.targeting
  if (!targeting) return ''

  const count = resolvedCount(targeting.count, context)
  let rawKind = String(targeting.kind ?? '').trim()
  if (!rawKind && count) {
    const isPlural = count.text === 'all' || (count.number !== undefined && count.number > 1)
    rawKind = isPlural ? 'targets' : 'target'
  }
  const kind = normalizeKind(rawKind, count)
  const countText = count
    ? `${targeting.countMode === 'up_to' ? 'up to ' : ''}${formatCount(count, mode === 'text2024')}`
    : ''
  const pieces = [countText, kind].filter(Boolean)
  let subject = pieces.join(' ')
  if (targeting.qualifier?.trim()) subject += `${subject ? ' ' : ''}${targeting.qualifier.trim()}`

  const details: string[] = []
  if (targeting.range) details.push(rangePhrase(targeting.range, context))
  if (targeting.area) details.push(areaPhrase(targeting.area, context))
  let phrase = subject
  if (details.length) phrase += `${phrase ? ' ' : ''}${details.join(' ')}`
  const planes = planesPhrase(targeting.planes)
  if (planes) phrase += `${phrase ? ' ' : ''}${planes}`
  if (targeting.raw?.trim()) phrase += `${phrase ? '; ' : ''}${targeting.raw.trim()}`
  return phrase
}

const statName = (stat: DndStat | undefined): string => stat ? ABILITY_NAMES[stat] : ''

export function mechanicsPhrase(ability: AbilityProjection, context: AbilityRenderContext = {}): string[] {
  const phrases: string[] = []
  if (ability.attackSource) {
    const reach = ability.attackReach ? `${REACH_LABELS[ability.attackReach]} ` : ''
    const hasCount = ability.attackCount !== undefined && String(ability.attackCount).trim() !== ''
    const numCount = Number(ability.attackCount)
    const countStr = hasCount ? `${ability.attackCount} ` : ''
    const isPlural = hasCount && (isNaN(numCount) || numCount > 1)
    const attackWord = isPlural ? 'Attacks' : 'Attack'
    const bonus = context.attackBonus ?? ability.attackBonus
    const bonusPrefix = isPlural ? ' of ' : ' '
    const bonusText = bonus === undefined ? '' : `${bonusPrefix}${valueText(bonus, context, 'bonus')}`

    const glyph = ability.attackRollModifier === 'advantage'
      ? '▲▲'
      : ability.attackRollModifier === 'disadvantage'
      ? '▼▼'
      : ''
    const exception = ability.attackException?.trim() ?? ''
    const modParts = [glyph, exception].filter(Boolean)
    const modText = modParts.length ? ` (${modParts.join(' ')})` : ''

    phrases.push(`${countStr}${reach}${ability.attackSource === 'spell' ? 'Spell' : 'Weapon'} ${attackWord}${bonusText}${modText}`)
  }
  if (ability.saveAbility) {
    const dc = context.saveDc ?? ability.saveDc
    if (dc !== undefined) phrases.push(`${statName(ability.saveAbility)} Save ${valueText(dc, context)}`)
  }
  return phrases
}

const ensurePeriod = (text: string): string => {
  const value = text.trim()
  if (!value || /[.!?]$/.test(value)) return value
  return `${value}.`
}

const triggerLabel = (trigger: string, mode: 'screen' | 'text2024'): string => {
  const clean = trigger.trim().replace(/^on\s+/i, '')
  const known = ['hit', 'failure', 'success', 'end of turn']
  const matched = known.find((item) => item.toLowerCase() === clean.toLowerCase())
  const label = matched ? matched.replace(/\b\w/g, (letter) => letter.toUpperCase()) : clean
  return mode === 'screen' ? `On ${label}` : label
}

const effectText = (effect: AbilityOutcome['effects'][number], context: AbilityRenderContext): string => {
  if (effect.text?.trim()) return effect.text.trim()
  if (effect.formula?.trim()) {
    const source = effect.formula.trim()
    const result = context.formulaContext
      ? evaluateFormula(source, context.formulaContext, { style: 'dice' })
      : undefined
    const amount = result?.ok ? result.text : source
    const type = effect.damageType?.trim()
    const damage = type ? ` ${type[0].toUpperCase()}${type.slice(1)} damage` : ' damage'
    return `${amount}${damage}`
  }
  return ''
}

export function outcomePhrase(
  ability: AbilityProjection,
  context: AbilityRenderContext = {},
  mode: 'screen' | 'text2024' = 'screen',
  markup: AbilityMarkup = 'text'
): string[] {
  return ability.outcomes.map((outcome) => {
    const effects = outcome.effects.map((effect) => effectText(effect, context)).filter(Boolean).map(ensurePeriod)
    const parts = [...effects]
    if (outcome.rider?.trim()) parts.push(outcome.rider.trim())
    const refLeads = (outcome.refs ?? []).map((r) => ability.outcomes.find((o) => o.id === r)?.trigger).filter((x): x is string => !!x)
    if (refLeads.length) parts.push(`(builds on the  result)`)
    if (outcome.recipient) parts.unshift(`:`)
    if (outcome.diceTable && outcome.diceTable.length) {
      const rows = outcome.diceTable.map((r) => `${r.roll}: ${r.effect}`).join('; ')
      parts.push(`(${rows})`)
    }
    const filterPrefix = outcome.targetFilter?.trim() ? `[${outcome.targetFilter.trim()}] ` : ''
    const label = markLabel(`${filterPrefix}${triggerLabel(outcome.trigger, mode)}:`, markup)
    return parts.length ? `${label} ${ensurePeriod(parts.join(' '))}` : label
  })
}

const formatText2024Range = (ability: AbilityProjection, context: AbilityRenderContext): string => {
  const range = ability.targeting?.range
  if (!range) return ''
  const label = ability.attackReach === 'melee' ? 'reach' : 'range'
  return `${label} ${formatDistance(range.distance, range.unit, context)}`
}

export function text2024(action: Partial<MonsterAction>, context: AbilityRenderContext = {}, options: Text2024Options = {}): string {
  const markup = options.markup ?? 'text'
  const ability = inferAbility(action)
  const clauses: string[] = []
  const header = abilityHeader(action)
  const identity = [header.discipline, !options.componentsInLead && header.components.length ? `(${header.components.join(', ')})` : ''].filter(Boolean).join(' ')
  const metadata = [identity, header.duration ? `Duration: ${header.duration}` : ''].filter(Boolean).join('; ')
  if (metadata) {
    const text = ensurePeriod(metadata)
    clauses.push(markup === 'html' ? `<i>${text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</i>` : text)
  }
  const attackBonus = context.attackBonus ?? ability.attackBonus

  if (ability.attackSource) {
    const reach = ability.attackReach ? `${REACH_LABELS[ability.attackReach]} ` : ''
    const bonus = attackBonus === undefined ? '' : ` ${valueText(attackBonus, context, 'bonus')}`
    const count = (action.attackCount && Number(action.attackCount) > 1) ? Number(action.attackCount) : undefined
    const sourceLabel = ability.attackSource === 'spell' ? 'Spell' : 'Weapon'
    const rollMod = action.attackRollModifier === 'advantage' ? '▲▲ ' : action.attackRollModifier === 'disadvantage' ? '▼▼ ' : ''
    const exc = action.attackException ? `${rollMod}${action.attackException}`.trim() : rollMod.trim()
    const excText = exc ? ` (${exc})` : ''
    const attack = count
      ? `${markLabel(`${count} ${reach}${sourceLabel} Attacks of`, markup)}${bonus}${excText}`
      : `${markLabel(`${reach}Attack Roll:`, markup)}${bonus}${excText}`
    const range = ability.targeting?.range
    const attackScope = scopePhrase({ ...ability, targeting: ability.targeting ? {
      ...ability.targeting,
      range: range ? { ...range, relation: range.relation || (ability.attackReach === 'melee' ? 'reach' : 'range') } : undefined,
    } : undefined }, context, 'text2024')
    const mechanicalRange = range && range.relation !== 'within'
      ? [rangePhrase({ ...range, relation: range.relation || (ability.attackReach === 'melee' ? 'reach' : 'range') }, context),
        scopePhrase({ ...ability, targeting: { ...ability.targeting, range: undefined } }, context, 'text2024')].filter(Boolean).join(', ')
      : attackScope
    // A combined attack/save prints targeting with the saving throw, once.
    const scope = ability.saveAbility ? formatText2024Range(ability, context) : mechanicalRange
    clauses.push(ensurePeriod([attack, scope].filter(Boolean).join(', ')))
  }

  if (ability.saveAbility) {
    const dc = context.saveDc ?? ability.saveDc
    const scope = scopePhrase(ability, context, 'text2024')
    const save = `${markLabel(`${statName(ability.saveAbility)} Saving Throw:`, markup)}${dc === undefined ? '' : ` DC ${valueText(dc, context)}`}`
    clauses.push(ensurePeriod([save, scope].filter(Boolean).join(', ')))
  }

  if (!ability.attackSource && !ability.saveAbility) {
    const scope = scopePhrase(ability, context, 'text2024')
    if (scope) clauses.push(ensurePeriod(`${markLabel('Targets:', markup)} ${scope}`))
  }

  clauses.push(...outcomePhrase(ability, context, 'text2024', markup))
  if (ability.description.trim()) clauses.push(ability.description.trim())
  return clauses.join(' ')
}
