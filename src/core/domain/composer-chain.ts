import { WEAPON_ABILITY_RULES } from './action-composer.ts'
import { actionUsageDraft, actionUsagePatch, validateActionUsage } from './action-usage.ts'
import type {
  AbilityArea,
  AbilityOutcome,
  AbilityTargeting,
  ActionEffect,
  AttackReach,
  AttackSource,
  DndStat,
  EffectClause,
  MonsterAction,
  RangeSpec,
} from './types.ts'
import {
  ABILITY_NAMES,
  abilityHeadOrder,
  areaPhrase,
  hasStructuredAbility,
  inferAbility,
  mechanicsPhrase,
  outcomePhrase,
  planesPhrase,
  rangePhrase,
  scopePhrase,
} from './ability-grammar.ts'
import { parseFormula } from './formula.ts'
import { COMPONENT_TAGS, COMPOSER_ROW_ORDER, ROLE_CHAINS } from './action-composer.ts'
import type { ComposerEditor, ComposerRow } from './action-composer.ts'

/** Roles persisted as `MonsterAction`; traits, reactions and lair actions keep their own models. */
export type ActionModelRole = 'action' | 'bonus_action' | 'legendary' | 'mythic'

/** What only the renderer knows: the usage text and the resolved bonus and DC the plate prints. */
export interface ChainContext {
  usage?: string
  attackBonus?: number
  saveDc?: number
}

export interface ChainCellView {
  id: string
  label: string
  row: ComposerRow
  editor: ComposerEditor
  state: 'empty' | 'set'
  /** Plate text when set; the label, as a placeholder, when empty. */
  text: string
  /** One line per outcome or legacy effect. */
  items?: string[]
  /** The plate derives this value because the action leaves it unset. */
  auto?: boolean
  legacy: boolean
  /** A legacy value the plate ignores because structured data takes precedence. */
  shadowed?: boolean
  invalid?: string
}

export interface ChainRowView {
  row: ComposerRow
  cells: ChainCellView[]
}

export interface AttackKind {
  id: string
  label: string
  reach: AttackReach
  source: AttackSource
}

export const ATTACK_KINDS: readonly AttackKind[] = [
  { id: 'melee-weapon', label: 'Melee Weapon Attack', reach: 'melee', source: 'weapon' },
  { id: 'ranged-weapon', label: 'Ranged Weapon Attack', reach: 'ranged', source: 'weapon' },
  { id: 'melee-or-ranged-weapon', label: 'Melee or Ranged Weapon Attack', reach: 'melee_or_ranged', source: 'weapon' },
  { id: 'melee-spell', label: 'Melee Spell Attack', reach: 'melee', source: 'spell' },
  { id: 'ranged-spell', label: 'Ranged Spell Attack', reach: 'ranged', source: 'spell' },
  { id: 'melee-or-ranged-spell', label: 'Melee or Ranged Spell Attack', reach: 'melee_or_ranged', source: 'spell' },
]

const REACH_TEXT: Readonly<Record<AttackReach, string>> = { melee: 'Melee', ranged: 'Ranged', melee_or_ranged: 'Melee or Ranged' }
const POOLED_ROLES: readonly ActionModelRole[] = ['legendary', 'mythic']
const NUMBER_ERROR = 'Use a number or a formula such as PB'
const COUNT_ERROR = 'Use a count of at least 1, all, or a formula'
const DISTANCE_ERROR = 'Distance must be a number or a formula'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const trimmed = (value: unknown): string => (typeof value === 'string' ? value.trim() : '')

const isNone = (value: string): boolean => !value || /^none$/i.test(value)

const validStat = (value: unknown): DndStat | undefined =>
  typeof value === 'string' && Object.prototype.hasOwnProperty.call(ABILITY_NAMES, value) ? (value as DndStat) : undefined

const signed = (value: number): string => (value > 0 ? `+${value}` : String(value))

const targetingOf = (action: Partial<MonsterAction>): AbilityTargeting =>
  isRecord(action.targeting) ? (action.targeting as AbilityTargeting) : {}

/** Plain-data copy so editor drafts never share nested objects with the store. */
function cloneData<T>(value: T): T {
  if (Array.isArray(value)) return value.map((item) => cloneData(item)) as T
  if (isRecord(value)) return Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, cloneData(nested)])) as T
  return value
}

export type ParsedAbilityNumber = { ok: true; value: number | string | undefined } | { ok: false; error: string }

/** Counts and distances are numbers or formulas (`PB`, `CHA_MOD + 1`); blank means unset. */
export function parseAbilityNumber(input: unknown): ParsedAbilityNumber {
  if (typeof input === 'number') return Number.isFinite(input) ? { ok: true, value: input } : { ok: false, error: NUMBER_ERROR }
  const source = trimmed(input)
  if (!source) return { ok: true, value: undefined }
  if (/^-?\d+(?:\.\d+)?$/.test(source)) return { ok: true, value: Number(source) }
  return parseFormula(source).ok ? { ok: true, value: source } : { ok: false, error: NUMBER_ERROR }
}

/** Returns `undefined` for blank input and `null` for anything that is not a whole number. */
const wholeNumber = (input: unknown): number | undefined | null => {
  if (input === undefined || input === null || (typeof input !== 'number' && trimmed(input) === '')) return undefined
  const value = typeof input === 'number' ? input : /^-?\d+$/.test(trimmed(input)) ? Number(trimmed(input)) : NaN
  return Number.isInteger(value) ? value : null
}

export function attackKindOf(action: Partial<MonsterAction>): string {
  const ability = inferAbility(action)
  if (!ability.attackSource || !ability.attackReach) return ''
  return ATTACK_KINDS.find((kind) => kind.source === ability.attackSource && kind.reach === ability.attackReach)?.id ?? ''
}

interface CellReading {
  text: string
  items?: string[]
  auto?: boolean
}

function readCell(cellId: string, role: ActionModelRole, action: Partial<MonsterAction>, context: ChainContext): CellReading | undefined {
  const text = (value: string): CellReading | undefined => (value ? { text: value } : undefined)
  switch (cellId) {
    case 'usage':
      return text(POOLED_ROLES.includes(role) ? trimmed(context.usage) : trimmed(context.usage) || trimmed(action.recharge))
    case 'discipline':
      return isNone(trimmed(action.school)) ? undefined : text(trimmed(action.school))
    case 'tier':
      return isNone(trimmed(action.spellLevel)) ? undefined : text(trimmed(action.spellLevel))
    case 'name':
      return text(trimmed(action.name))
    case 'components':
      return text((Array.isArray(action.components) ? action.components.map(trimmed).filter(Boolean) : []).join(', '))
    case 'duration':
      return text(trimmed(action.duration))
    case 'attack': {
      const ability = inferAbility(action)
      if (!ability.attackSource) return undefined
      const reach = ability.attackReach ? `${REACH_TEXT[ability.attackReach]} ` : ''
      return text(`${reach}${ability.attackSource === 'spell' ? 'Spell' : 'Weapon'} Attack`)
    }
    case 'weapon-ability': return text(WEAPON_ABILITY_RULES.find(rule => rule.value === (action.weaponAttackAbility || 'auto'))?.label || 'Automatic by reach')
    case 'attack-bonus': {
      const explicit = typeof action.attackBonus === 'number' && Number.isFinite(action.attackBonus)
      const value = explicit ? action.attackBonus : context.attackBonus
      return value === undefined ? undefined : { text: signed(value), auto: !explicit }
    }
    case 'save-ability': {
      const stat = validStat(action.stat)
      return stat ? text(`${ABILITY_NAMES[stat]} Save`) : undefined
    }
    case 'save-dc': {
      const override = action.save?.override === true
      const value = override ? action.save?.overrideValue : context.saveDc
      return value === undefined ? undefined : { text: `DC ${value}`, auto: !override }
    }
    case 'target-count': {
      const targeting = targetingOf(action)
      if (targeting.count === undefined || targeting.count === '') return undefined
      return text(`${targeting.countMode === 'up_to' ? 'up to ' : ''}${targeting.count}`)
    }
    case 'target-kind':
      return text(trimmed(targetingOf(action).kind))
    case 'target-qualifier':
      return text(trimmed(targetingOf(action).qualifier))
    case 'target-range': {
      const range = rangeValue(targetingOf(action).range)
      return range ? text(rangePhrase(range)) : undefined
    }
    case 'target-area': {
      const area = areaValue(targetingOf(action).area)
      return area ? text(areaPhrase(area)) : undefined
    }
    case 'target-planes': {
      const planes = targetingOf(action).planes
      return text(planesPhrase(Array.isArray(planes) ? planes.filter((plane): plane is string => typeof plane === 'string') : []))
    }
    case 'legacy-targets':
      return text(trimmed(action.targetsText))
    case 'legacy-range':
      return text(trimmed(action.range))
    case 'legacy-area':
      return text(trimmed(action.areaShape))
    case 'legacy-area-distance':
      return text(trimmed(action.areaDistance))
    case 'outcomes': {
      if (action.outcomes === undefined) return undefined
      const items = outcomePhrase(inferAbility(action))
      return items.length ? { text: items.join(' '), items } : undefined
    }
    case 'legacy-effects': {
      const items = (Array.isArray(action.effects) ? action.effects : [])
        .filter((effect) => isRecord(effect) && (trimmed(effect.case) || trimmed(effect.effect)))
        .map((effect) => `${trimmed(effect.case)}: ${trimmed(effect.effect)}`)
      return items.length ? { text: items.join(' '), items } : undefined
    }
    case 'description':
      return text(trimmed(action.description))
    default:
      return undefined
  }
}

const LEGACY_CLEARED: Readonly<Record<string, Partial<MonsterAction>>> = {
  'legacy-targets': { targetsText: '' },
  'legacy-range': { range: '' },
  'legacy-area': { areaShape: '' },
  'legacy-area-distance': { areaDistance: '' },
  'legacy-effects': { effects: [] },
}

const projection = (action: Partial<MonsterAction>): string => {
  const ability = inferAbility(action)
  return JSON.stringify([mechanicsPhrase(ability), scopePhrase(ability), outcomePhrase(ability)])
}

/** Legacy text only reaches a structured plate when the grammar can parse it; otherwise it is dropped. */
const isShadowed = (cellId: string, action: Partial<MonsterAction>): boolean =>
  hasStructuredAbility(action) && projection(action) === projection({ ...action, ...LEGACY_CLEARED[cellId] })

const squash = (text: string): string => text.toLowerCase().replace(/[^a-z0-9]+/g, '')

/** Templates keep a legacy copy of their scope; a hidden copy that the plate already prints adds nothing. */
const repeatsPrintedText = (cellId: string, action: Partial<MonsterAction>, text: string): boolean => {
  const ability = inferAbility(action)
  const printed = cellId === 'legacy-effects' ? outcomePhrase(ability).join(' ') : scopePhrase(ability)
  const legacy = squash(text)
  return !!legacy && squash(printed).includes(legacy)
}

const isVisible = (cellId: string, action: Partial<MonsterAction>, reading: CellReading | undefined): boolean => {
  if (cellId.startsWith('legacy-')) return reading !== undefined
  if (cellId === 'weapon-ability') return inferAbility(action).attackSource === 'weapon'
  if (cellId === 'attack-bonus') return !!inferAbility(action).attackSource
  if (cellId === 'save-dc') return !!validStat(action.stat)
  return true
}

/** Editor cells consume the same identity/classification order as rendered entry heads. */
function inPlateWordOrder(cells: ChainCellView[], action: Partial<MonsterAction>): ChainCellView[] {
  const order = abilityHeadOrder(action)
  const rank = (id: string) => { const index = order.indexOf(id); return index < 0 ? order.length : index }
  return [...cells].sort((a, b) => rank(a.id) - rank(b.id))
}

/** The chain mirrors the plate: same rows, same order, the same phrases the renderer prints. */
export function chainView(role: ActionModelRole, action: Partial<MonsterAction>, context: ChainContext = {}): ChainRowView[] {
  const specs = ROLE_CHAINS[role]
  return COMPOSER_ROW_ORDER.map((row) => ({
    row,
    cells: specs
      .filter((spec) => spec.row === row)
      .flatMap((spec): ChainCellView[] => {
        const reading = readCell(spec.id, role, action, context)
        if (!isVisible(spec.id, action, reading)) return []
        const legacy = spec.id.startsWith('legacy-')
        const shadowed = legacy && isShadowed(spec.id, action)
        if (shadowed && reading && repeatsPrintedText(spec.id, action, reading.text)) return []
        const view: ChainCellView = {
          id: spec.id,
          label: spec.label,
          row: spec.row,
          editor: spec.editor,
          state: reading ? 'set' : 'empty',
          text: reading?.text ?? spec.label,
          legacy,
        }
        if (reading?.items) view.items = reading.items
        if (reading?.auto !== undefined) view.auto = reading.auto
        if (legacy) view.shadowed = shadowed
        if (spec.id === 'name' && !reading) view.invalid = 'Name is required'
        return [view]
      }),
  }))
    .map((row) => (row.row === 'head' ? { ...row, cells: inPlateWordOrder(row.cells, action) } : row))
    .filter((row) => row.cells.length > 0)
}

/** The value an editor starts from; nested data is copied so drafts never write through. */
export function cellValue(action: Partial<MonsterAction>, cellId: string): unknown {
  const targeting = targetingOf(action)
  switch (cellId) {
    case 'usage': return actionUsageDraft(action)
    case 'discipline': return isNone(trimmed(action.school)) ? '' : trimmed(action.school)
    case 'tier': return isNone(trimmed(action.spellLevel)) ? '' : trimmed(action.spellLevel)
    case 'name': return action.name ?? ''
    case 'components': return Array.isArray(action.components) ? [...action.components] : []
    case 'duration': return trimmed(action.duration)
    case 'attack': return attackKindOf(action)
    case 'weapon-ability': return WEAPON_ABILITY_RULES.find(rule => rule.value === (action.weaponAttackAbility || 'auto'))?.label || 'Automatic by reach'
    case 'attack-bonus': return typeof action.attackBonus === 'number' ? action.attackBonus : ''
    case 'save-ability': return validStat(action.stat) ?? ''
    case 'save-dc': return action.save?.override ? action.save.overrideValue : ''
    case 'target-count': return { count: targeting.count ?? '', mode: targeting.countMode === 'up_to' ? 'up_to' : 'exact' }
    case 'target-kind': return trimmed(targeting.kind)
    case 'target-qualifier': return trimmed(targeting.qualifier)
    case 'target-range': return cloneData(targeting.range)
    case 'target-area': return cloneData(targeting.area)
    case 'target-planes': return Array.isArray(targeting.planes) ? [...targeting.planes] : []
    case 'legacy-targets': return trimmed(action.targetsText)
    case 'legacy-range': return action.range ?? ''
    case 'legacy-area': return trimmed(action.areaShape)
    case 'legacy-area-distance': return trimmed(action.areaDistance)
    case 'outcomes': return cloneData(action.outcomes ?? [])
    case 'legacy-effects': return cloneData(action.effects ?? [])
    case 'description': return action.description ?? ''
    default: return undefined
  }
}

function rangeValue(input: unknown): RangeSpec | undefined {
  if (!isRecord(input)) return undefined
  const distance = parseAbilityNumber(input.distance)
  if (!distance.ok || distance.value === undefined) return undefined
  const range: RangeSpec = { distance: distance.value, unit: input.unit === 'mi' ? 'mi' : 'ft' }
  if (input.relation === 'within' || input.relation === 'reach' || input.relation === 'range') range.relation = input.relation
  if (trimmed(input.origin)) range.origin = trimmed(input.origin)
  return range
}

function areaValue(input: unknown): AbilityArea | undefined {
  if (!isRecord(input) || !trimmed(input.shape)) return undefined
  const area: AbilityArea = { shape: trimmed(input.shape) }
  const distance = parseAbilityNumber(input.distance)
  if (distance.ok && distance.value !== undefined) {
    area.distance = distance.value
    area.unit = input.unit === 'mi' ? 'mi' : 'ft'
  }
  if (trimmed(input.origin)) area.origin = trimmed(input.origin)
  return area
}

function outcomeValue(input: unknown): AbilityOutcome | undefined {
  if (!isRecord(input) || !trimmed(input.trigger)) return undefined
  const effects = (Array.isArray(input.effects) ? input.effects : []).filter(isRecord).flatMap((effect): EffectClause[] => {
    if (effect.kind === 'damage' && trimmed(effect.formula)) {
      const clause: EffectClause = { kind: 'damage', formula: trimmed(effect.formula) }
      if (trimmed(effect.damageType)) clause.damageType = trimmed(effect.damageType)
      return [clause]
    }
    return trimmed(effect.text) ? [{ kind: 'text', text: trimmed(effect.text) }] : []
  })
  const outcome: AbilityOutcome = { trigger: trimmed(input.trigger), effects }
  if (trimmed(input.rider)) outcome.rider = trimmed(input.rider)
  return outcome
}

const withTargeting = (action: Partial<MonsterAction>, change: (targeting: AbilityTargeting) => void): Partial<MonsterAction> => {
  const next: AbilityTargeting = { ...targetingOf(action) }
  change(next)
  for (const key of Object.keys(next) as (keyof AbilityTargeting)[]) {
    if (next[key] === undefined) delete next[key]
  }
  return { targeting: Object.keys(next).length ? next : undefined }
}

/**
 * The fields one cell edit changes. Pure: the caller assigns them onto the store object, and a field set
 * to `undefined` reads as absent everywhere (`hasStructuredAbility`, JSON persistence).
 */
export function cellPatch(action: Partial<MonsterAction>, cellId: string, value: unknown): Partial<MonsterAction> {
  const text = trimmed(value)
  switch (cellId) {
    case 'usage':
      return actionUsagePatch(action, value)
    case 'discipline':
      return { school: isNone(text) ? undefined : text }
    case 'tier':
      return { spellLevel: isNone(text) ? undefined : text }
    case 'name':
      return { name: text }
    case 'components': {
      const chosen = [...new Set(Array.isArray(value) ? value.map(trimmed).filter(Boolean) : [])]
      const ordered = [...COMPONENT_TAGS.filter((tag) => chosen.includes(tag)), ...chosen.filter((tag) => !COMPONENT_TAGS.includes(tag))]
      return { components: ordered.length ? ordered : undefined }
    }
    case 'duration':
      return { duration: text || undefined }
    case 'attack': {
      const kind = ATTACK_KINDS.find((candidate) => candidate.id === text)
      if (kind) return { attackReach: kind.reach, attackSource: kind.source, actionType: `${kind.source}_attack` }
      // The legacy action type also implies an attack, so clearing must neutralise it too.
      const type = action.actionType
      return { attackReach: undefined, attackSource: undefined, actionType: type === 'spell_attack' || type === 'weapon_attack' ? undefined : type }
    }
    case 'weapon-ability':
      return { weaponAttackAbility: WEAPON_ABILITY_RULES.find(rule => rule.label === text)?.value }
    case 'attack-bonus':
      return { attackBonus: wholeNumber(value) ?? undefined }
    case 'save-ability':
      return { stat: validStat(text) ?? 'none' }
    case 'save-dc': {
      const dc = wholeNumber(value)
      return { save: typeof dc === 'number' ? { override: true, overrideValue: dc } : { override: false, overrideValue: 0 } }
    }
    case 'target-count':
      return withTargeting(action, (targeting) => {
        const count = isRecord(value) ? value.count : undefined
        const parsed: ParsedAbilityNumber = count === 'all' ? { ok: true, value: 'all' } : parseAbilityNumber(count)
        if (!parsed.ok || parsed.value === undefined) {
          targeting.count = undefined
          targeting.countMode = undefined
          return
        }
        targeting.count = parsed.value
        targeting.countMode = isRecord(value) && value.mode === 'up_to' ? 'up_to' : 'exact'
      })
    case 'target-kind':
      return withTargeting(action, (targeting) => { targeting.kind = text || undefined })
    case 'target-qualifier':
      return withTargeting(action, (targeting) => { targeting.qualifier = text || undefined })
    case 'target-range':
      return withTargeting(action, (targeting) => { targeting.range = rangeValue(value) })
    case 'target-area':
      return withTargeting(action, (targeting) => { targeting.area = areaValue(value) })
    case 'target-planes':
      return withTargeting(action, (targeting) => {
        const planes = [...new Set(Array.isArray(value) ? value.map(trimmed).filter(Boolean) : [])]
        targeting.planes = planes.length ? planes : undefined
      })
    case 'legacy-targets':
      return { targetsText: text || undefined }
    case 'legacy-range':
      return { range: text }
    case 'legacy-area':
      return { areaShape: text || undefined }
    case 'legacy-area-distance':
      return { areaDistance: text || undefined }
    case 'outcomes': {
      const outcomes = (Array.isArray(value) ? value : []).map(outcomeValue).filter((outcome): outcome is AbilityOutcome => !!outcome)
      return { outcomes: outcomes.length ? outcomes : undefined }
    }
    case 'legacy-effects': {
      const effects: ActionEffect[] = (Array.isArray(value) ? value : [])
        .filter(isRecord)
        .map((effect) => ({ case: trimmed(effect.case), effect: trimmed(effect.effect) }))
        .filter((effect) => effect.case || effect.effect)
      return { effects }
    }
    case 'description':
      return { description: typeof value === 'string' ? value : '' }
    default:
      return {}
  }
}

/** An empty string means the value can be committed; anything else is the message to show. */
export function validateCell(cellId: string, value: unknown): string {
  if (cellId === 'weapon-ability') return !trimmed(value) || WEAPON_ABILITY_RULES.some(rule => rule.label === trimmed(value)) ? '' : 'Choose a listed weapon ability rule.'
  if (cellId === 'usage' && typeof value === 'object') return validateActionUsage(value)
  switch (cellId) {
    case 'name':
      return trimmed(value) ? '' : 'Name is required'
    case 'attack-bonus': {
      const bonus = wholeNumber(value)
      return bonus === null || (typeof bonus === 'number' && (bonus < -20 || bonus > 40)) ? 'Use a whole number' : ''
    }
    case 'save-dc': {
      const dc = wholeNumber(value)
      return dc === null || (typeof dc === 'number' && (dc < 1 || dc > 40)) ? 'Use a whole number from 1 to 40' : ''
    }
    case 'target-count': {
      const count = isRecord(value) ? value.count : undefined
      if (count === undefined || count === '' || count === 'all') return ''
      const parsed = parseAbilityNumber(count)
      if (!parsed.ok) return COUNT_ERROR
      return typeof parsed.value === 'number' && (parsed.value < 1 || !Number.isInteger(parsed.value)) ? COUNT_ERROR : ''
    }
    case 'target-range': {
      if (!isRecord(value)) return ''
      const distance = parseAbilityNumber(value.distance)
      return !distance.ok || distance.value === undefined || (typeof distance.value === 'number' && distance.value <= 0) ? DISTANCE_ERROR : ''
    }
    case 'target-area': {
      if (!isRecord(value)) return ''
      if (!trimmed(value.shape)) return 'Choose a shape'
      const distance = parseAbilityNumber(value.distance)
      return distance.ok && !(typeof distance.value === 'number' && distance.value <= 0) ? '' : DISTANCE_ERROR
    }
    case 'outcomes': {
      for (const outcome of Array.isArray(value) ? value : []) {
        if (!isRecord(outcome) || !trimmed(outcome.trigger)) return 'Every outcome needs a trigger'
        for (const effect of Array.isArray(outcome.effects) ? outcome.effects : []) {
          if (isRecord(effect) && effect.kind === 'damage' && !(trimmed(effect.formula) && parseFormula(trimmed(effect.formula)).ok)) {
            return 'Damage needs a formula such as 2d6 + STR_MOD'
          }
        }
      }
      return ''
    }
    default:
      return ''
  }
}
