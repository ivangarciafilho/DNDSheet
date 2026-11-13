/**
 * One catalog for every insertable macro: formula references, monster and stat tokens, roll
 * helpers, context tokens, prose snippets and the monster's own variables and macros.
 * Editors filter it by scope, so a field only offers what its renderer can resolve.
 */
import { FORMULA_GROUPS, FORMULA_REFS } from './formula.ts'

/** Where a field lives; decides which tokens its renderer resolves. */
export type MacroScope = 'mechanic' | 'trait' | 'action' | 'reaction' | 'legendary' | 'attack' | 'spell' | 'prose' | 'character'

export type MacroKind = 'reference' | 'token' | 'roll' | 'context' | 'snippet' | 'custom'

export interface MacroEntry {
  /** Text inserted into the field. */
  insert: string
  label: string
  group: string
  kind: MacroKind
  tip: string
  /** Scopes that resolve it. Absent: every scope. */
  scopes?: readonly MacroScope[]
}

const STATS = [['STR', 'Strength'], ['DEX', 'Dexterity'], ['CON', 'Constitution'], ['INT', 'Intelligence'], ['WIS', 'Wisdom'], ['CHA', 'Charisma']] as const
const PROSE: readonly MacroScope[] = ['trait', 'action', 'reaction', 'legendary', 'attack', 'spell', 'prose']
/** Monster-only data (CR, legendary budget, saves table, senses): not resolvable on a character sheet. */
const MONSTER: readonly MacroScope[] = ['mechanic', ...PROSE]
/** Formula groups a character resolves from its own scores, proficiency, AC, hit points and casting ability. */
const CHARACTER_GROUPS = new Set(['ability_mod', 'ability_score', 'attack', 'proficiency', 'save_dc', 'hit_points', 'spellcasting', 'combat'])

const groupLabel = (id: string) => FORMULA_GROUPS.find((group) => group.id === id)?.label ?? 'Formula'

const REFERENCES: MacroEntry[] = FORMULA_REFS.map((ref): MacroEntry => ({
  insert: `{${ref.id}}`, label: ref.label, group: groupLabel(ref.group), kind: 'reference', tip: ref.tip,
  ...(CHARACTER_GROUPS.has(ref.group) ? {} : { scopes: MONSTER }),
}))

const TOKENS: MacroEntry[] = [
  { insert: '{NAME}', label: 'Monster name', group: 'Monster', kind: 'token', tip: 'The monster name (or nickname), with "the" when the article option is on.' },
  { insert: '{monster.AC}', label: 'Armor Class', group: 'Monster', kind: 'token', tip: 'The monster Armor Class.', scopes: MONSTER },
  { insert: '{monster.hp}', label: 'Hit points with dice', group: 'Monster', kind: 'token', tip: 'Average hit points and the hit dice formula.', scopes: MONSTER },
  { insert: '{XP:monster}', label: 'Experience points', group: 'Monster', kind: 'token', tip: 'XP for the monster Challenge Rating.', scopes: MONSTER },
  ...STATS.map(([s, name]): MacroEntry => ({ insert: `{DC:${s}}`, label: `${name} save DC`, group: 'Saves and attacks', kind: 'token', tip: `8 + proficiency bonus + ${name} modifier, printed as "DC n".` })),
  ...STATS.map(([s, name]): MacroEntry => ({ insert: `{A:${s}}`, label: `${name} attack bonus`, group: 'Saves and attacks', kind: 'token', tip: `Proficiency bonus + ${name} modifier, printed as "+n".` })),
]

const ROLLS: MacroEntry[] = [
  { insert: '{1d8 + STR_MOD}', label: 'Damage roll with modifier', group: 'Rolls', kind: 'roll', tip: 'Average and dice: "8 (1d8 + 3)". Change the dice and the modifier freely.' },
  { insert: '{2d6}', label: 'Plain dice roll', group: 'Rolls', kind: 'roll', tip: 'Average and dice: "7 (2d6)".' },
  { insert: '{8 + PB + CHA_MOD}', label: 'Computed number', group: 'Rolls', kind: 'roll', tip: 'Any arithmetic over references resolves to a number.' },
]

const CONTEXT: MacroEntry[] = [
  ...['name', 'limitedUse', 'limitedUse.count', 'limitedUse.rate'].map((field): MacroEntry => ({ insert: `{trait.${field}}`, label: `Trait ${field.replace('limitedUse', 'uses').replace('.', ' ')}`, group: 'This trait', kind: 'context', tip: 'Resolved from the trait being written.', scopes: ['trait'] })),
  ...['name', 'limitedUse', 'limitedUse.count', 'limitedUse.rate', 'recharge', 'effects'].map((field): MacroEntry => ({ insert: `{action.${field}}`, label: `Action ${field.replace('limitedUse', 'uses').replace('.', ' ')}`, group: 'This action', kind: 'context', tip: 'Resolved from the action being written.', scopes: ['action', 'reaction'] })),
  ...['damage', 'distance', 'modifier', 'save', 'targets', 'additionalDamage', 'conditionalDamage'].map((field): MacroEntry => ({ insert: `{attack.${field}}`, label: `Attack ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`, group: 'This attack', kind: 'context', tip: 'Resolved from the attack being written.', scopes: ['attack'] })),
  ...['level', 'ordinal', 'class', 'stat', 'save', 'attack', 'modifier'].map((field): MacroEntry => ({ insert: `{spellcasting.${field}}`, label: `Spellcasting ${field}`, group: 'Spellcasting', kind: 'context', tip: 'Resolved from the spellcasting block.', scopes: ['spell'] })),
  { insert: '{legendaryActions.count}', label: 'Legendary action uses', group: 'Legendary', kind: 'context', tip: 'Legendary actions per round.', scopes: ['legendary'] },
  { insert: '{multiattack.all}', label: 'All multiattack entries', group: 'This action', kind: 'context', tip: 'Every multiattack option, joined.', scopes: ['action'] },
]

const SNIPPETS: MacroEntry[] = [
  { insert: 'Melee Weapon Attack: {A:STR} to hit, reach 5 ft., one target.', label: 'Melee weapon attack', group: 'Delivery', kind: 'snippet', tip: 'A complete attack lead.', scopes: PROSE },
  { insert: 'Ranged Weapon Attack: {A:DEX} to hit, range 80/320 ft., one target.', label: 'Ranged weapon attack', group: 'Delivery', kind: 'snippet', tip: 'A complete attack lead.', scopes: PROSE },
  { insert: 'Each creature in a 20-foot-radius sphere must make a {DC:DEX} saving throw.', label: 'Area saving throw', group: 'Delivery', kind: 'snippet', tip: 'An area save lead.', scopes: PROSE },
  { insert: 'and the target is grappled (escape {DC:STR}).', label: 'Grappled (escape DC)', group: 'Conditions', kind: 'snippet', tip: 'Grapple rider with its escape DC.', scopes: PROSE },
  { insert: 'must succeed on a {DC:CON} saving throw or be poisoned for 1 minute.', label: 'Poisoned (1 minute)', group: 'Conditions', kind: 'snippet', tip: 'Poison rider with a Constitution save.', scopes: PROSE },
  { insert: 'and the target is knocked prone.', label: 'Knocked prone', group: 'Conditions', kind: 'snippet', tip: 'Prone rider.', scopes: PROSE },
]

export const MACRO_CATALOG: readonly MacroEntry[] = [...REFERENCES, ...TOKENS, ...ROLLS, ...CONTEXT, ...SNIPPETS]

export interface CatalogOptions {
  scope?: MacroScope
  /** Text typed after "{", without the brace. */
  query?: string
  customVariables?: Record<string, unknown>
  customMacros?: Record<string, unknown>
  limit?: number
}

const customEntries = (values: Record<string, unknown> | undefined, group: string, kind: MacroKind): MacroEntry[] =>
  Object.entries(values ?? {}).filter(([key]) => key.trim()).map(([key, value]) => ({
    insert: `{${key}}`, label: key, group, kind, tip: `Your ${kind === 'custom' ? 'value' : 'macro'}: ${String(value).slice(0, 80)}`,
  }))

const inScope = (entry: MacroEntry, scope: MacroScope) => !entry.scopes || entry.scopes.includes(scope)

/** Rank: insert text starting with the query, then label start, then anywhere. Stable within a rank. */
function rank(entry: MacroEntry, query: string): number {
  if (!query) return 0
  const insert = entry.insert.replace(/^\{/, '').toLowerCase()
  const label = entry.label.toLowerCase()
  if (insert.startsWith(query)) return 0
  if (label.startsWith(query) || label.split(/\s+/).some((word) => word.startsWith(query))) return 1
  if (insert.includes(query) || label.includes(query)) return 2
  return -1
}

/** Entries a field in `scope` can resolve, matching `query`, best first. */
export function catalogFor(options: CatalogOptions = {}): MacroEntry[] {
  const scope = options.scope ?? 'mechanic'
  const query = (options.query ?? '').trim().toLowerCase()
  const entries = [
    ...customEntries(options.customVariables, 'Your variables', 'custom'),
    ...customEntries(options.customMacros, 'Your macros', 'custom'),
    ...MACRO_CATALOG,
  ].filter((entry) => inScope(entry, scope) && (!query || entry.kind !== 'snippet'))
  const ranked = entries.map((entry, index) => ({ entry, index, score: rank(entry, query) })).filter((item) => item.score >= 0)
  ranked.sort((left, right) => left.score - right.score || left.index - right.index)
  return ranked.slice(0, options.limit ?? ranked.length).map((item) => item.entry)
}

/** Groups for a browse menu, in catalog order. */
export function catalogGroups(entries: readonly MacroEntry[]): { group: string; entries: MacroEntry[] }[] {
  const groups = new Map<string, MacroEntry[]>()
  for (const entry of entries) groups.set(entry.group, [...(groups.get(entry.group) ?? []), entry])
  return [...groups].map(([group, list]) => ({ group, entries: list }))
}

/**
 * The open "{query" before the caret, if any: autocomplete triggers on an unclosed brace.
 * Returns the query and where the brace starts.
 */
export function openMacroAt(text: string, caret: number): { query: string; start: number } | undefined {
  const before = text.slice(0, caret)
  const match = /\{([\w.:+\- ]{0,40})$/.exec(before)
  if (!match || match[1].includes('}')) return undefined
  return { query: match[1].trim(), start: before.length - match[0].length }
}

/** Replace the open "{query" (from `start` to `caret`) with `insert`; returns text and new caret. */
export function insertMacro(text: string, start: number, caret: number, insert: string): { text: string; caret: number } {
  const next = text.slice(0, start) + insert + text.slice(caret)
  return { text: next, caret: start + insert.length }
}

/** Braced tokens left unresolved after rendering (shown as a quiet warning in editors). */
export function unresolvedMacros(rendered: string): string[] {
  return [...new Set(String(rendered ?? '').match(/\{[^{}]{1,60}\}/g) ?? [])]
}
