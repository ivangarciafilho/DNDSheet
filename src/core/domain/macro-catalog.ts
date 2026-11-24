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
  // Build 274: weapon damage by die size, each tied to the ability a creature would swing or shoot with.
  ...([['1d4', 'DEX', 'Dagger, claw (Tiny)'], ['1d6', 'DEX', 'Shortsword, shortbow, bite (Small)'], ['1d10', 'STR', 'Halberd, heavy crossbow, slam'], ['1d12', 'STR', 'Greataxe, lance'], ['2d6', 'STR', 'Greatsword, maul, bite (Large)'],
    ['2d8', 'STR', 'Large creature claw or slam'], ['2d10', 'STR', 'Huge creature bite'], ['3d8', 'STR', 'Huge creature slam'],
    ['3d10', 'STR', 'Gargantuan creature bite'], ['4d6', 'STR', 'Gargantuan creature stomp'], ['1d8', 'DEX', 'Longbow, light crossbow (DEX)']] as const)
    .map(([dice, stat, tip]): MacroEntry => ({ insert: `{${dice} + ${stat}_MOD}`, label: `${dice} + ${stat} damage`, group: 'Weapon damage', kind: 'roll', tip })),
  { insert: '{1d10 + SPELL_MOD}', label: 'Spell bolt with modifier', group: 'Spell damage', kind: 'roll', tip: 'A cantrip-style bolt plus the spellcasting modifier.' },
  { insert: '{2d8 + SPELL_MOD}', label: 'Touch spell with modifier', group: 'Spell damage', kind: 'roll', tip: 'A melee spell attack payload.' },
  { insert: '{3d6}', label: '3d6 area damage', group: 'Spell damage', kind: 'roll', tip: 'A burning hands or thunderwave-sized area.' },
  { insert: '{8d6}', label: '8d6 area damage', group: 'Spell damage', kind: 'roll', tip: 'A fireball-sized area.' },
  { insert: '{10 + PB}', label: '10 + proficiency', group: 'Computed values', kind: 'roll', tip: 'A flat value that grows with Challenge Rating.' },
  { insert: '{PB * 2}', label: 'Twice proficiency', group: 'Computed values', kind: 'roll', tip: 'Common for temporary hit points or healing.' },
  { insert: '{5 * PB}', label: 'Five times proficiency', group: 'Computed values', kind: 'roll', tip: 'Common for damage absorbed or temporary hit points.' },
  { insert: '{HP / 2}', label: 'Half hit points', group: 'Computed values', kind: 'roll', tip: 'Half the hit point maximum (the Bloodied line).' },
  { insert: '{8 + PB + SPELL_MOD}', label: 'Spell save DC formula', group: 'Computed values', kind: 'roll', tip: 'The raw spell save DC arithmetic.' },
]

const CONTEXT: MacroEntry[] = [
  ...['name', 'limitedUse', 'limitedUse.count', 'limitedUse.rate'].map((field): MacroEntry => ({ insert: `{trait.${field}}`, label: `Trait ${field.replace('limitedUse', 'uses').replace('.', ' ')}`, group: 'This trait', kind: 'context', tip: 'Resolved from the trait being written.', scopes: ['trait'] })),
  ...['name', 'limitedUse', 'limitedUse.count', 'limitedUse.rate', 'recharge', 'effects'].map((field): MacroEntry => ({ insert: `{action.${field}}`, label: `Action ${field.replace('limitedUse', 'uses').replace('.', ' ')}`, group: 'This action', kind: 'context', tip: 'Resolved from the action being written.', scopes: ['action', 'reaction'] })),
  ...['damage', 'distance', 'modifier', 'save', 'targets', 'additionalDamage', 'conditionalDamage'].map((field): MacroEntry => ({ insert: `{attack.${field}}`, label: `Attack ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`, group: 'This attack', kind: 'context', tip: 'Resolved from the attack being written.', scopes: ['attack'] })),
  ...['level', 'ordinal', 'class', 'stat', 'save', 'attack', 'modifier'].map((field): MacroEntry => ({ insert: `{spellcasting.${field}}`, label: `Spellcasting ${field}`, group: 'Spellcasting', kind: 'context', tip: 'Resolved from the spellcasting block.', scopes: ['spell'] })),
  { insert: '{legendaryActions.count}', label: 'Legendary action uses', group: 'Legendary', kind: 'context', tip: 'Legendary actions per round.', scopes: ['legendary'] },
  { insert: '{multiattack.all}', label: 'All multiattack entries', group: 'This action', kind: 'context', tip: 'Every multiattack option, joined.', scopes: ['action'] },
]

const CONDITIONS = [
  ['blinded', 'CON'], ['charmed', 'WIS'], ['deafened', 'CON'], ['frightened', 'WIS'], ['incapacitated', 'CON'], ['invisible', 'WIS'],
  ['paralyzed', 'CON'], ['petrified', 'CON'], ['poisoned', 'CON'], ['restrained', 'STR'], ['stunned', 'CON'], ['unconscious', 'CON'],
] as const
const AREAS = [
  ['15-foot Cone', 'DEX'], ['30-foot Cone', 'DEX'], ['60-foot Cone', 'DEX'], ['60-foot-long, 5-foot-wide Line', 'DEX'], ['100-foot-long, 5-foot-wide Line', 'DEX'],
  ['10-foot Cube', 'CON'], ['20-foot-radius Sphere', 'DEX'], ['10-foot-radius, 40-foot-high Cylinder', 'CON'], ['10-foot Emanation', 'CON'], ['30-foot Emanation', 'WIS'],
] as const

const DAMAGE_TYPES = ['acid', 'bludgeoning', 'cold', 'fire', 'force', 'lightning', 'necrotic', 'piercing', 'poison', 'psychic', 'radiant', 'slashing', 'thunder'] as const

const SNIPPETS: MacroEntry[] = [
  ...DAMAGE_TYPES.map((type): MacroEntry => ({ insert: `plus {2d6} ${type} damage`, label: `Extra ${type} damage`, group: 'Damage riders', kind: 'snippet', tip: `Adds a ${type} damage rider to a hit or failed save.`, scopes: PROSE })),
  ...CONDITIONS.map(([condition, stat]): MacroEntry => ({ insert: `must succeed on a {DC:${stat}} saving throw or have the ${condition[0].toUpperCase() + condition.slice(1)} condition until the end of its next turn.`, label: `${condition[0].toUpperCase() + condition.slice(1)} (save ends next turn)`, group: 'Conditions', kind: 'snippet', tip: `A ${condition} rider with a saving throw.`, scopes: PROSE })),
  ...AREAS.map(([area, stat]): MacroEntry => ({ insert: `Each creature in a ${area} must make a {DC:${stat}} saving throw.`, label: `${area} area save`, group: 'Areas', kind: 'snippet', tip: 'An area saving throw lead.', scopes: PROSE })),
  { insert: 'Failure: {2d6} damage. Success: Half damage.', label: 'Failure / half on success', group: 'Outcomes', kind: 'snippet', tip: '2024 save outcome pair.', scopes: PROSE },
  { insert: 'Failure: {2d6} damage. Success: No effect.', label: 'Failure / no effect on success', group: 'Outcomes', kind: 'snippet', tip: 'Save-or-nothing outcome pair.', scopes: PROSE },
  { insert: 'Hit: {1d8 + STR_MOD} damage.', label: 'Hit damage line', group: 'Outcomes', kind: 'snippet', tip: 'Attack hit outcome.', scopes: PROSE },
  { insert: 'Miss: Half damage.', label: 'Half damage on a miss', group: 'Outcomes', kind: 'snippet', tip: 'Graze-style miss outcome.', scopes: PROSE },
  { insert: 'Melee Spell Attack: {SPELL_ATK} to hit, reach 5 ft., one target.', label: 'Melee spell attack', group: 'Delivery', kind: 'snippet', tip: 'A complete spell attack lead.', scopes: PROSE },
  { insert: 'Ranged Spell Attack: {SPELL_ATK} to hit, range 120 ft., one target.', label: 'Ranged spell attack', group: 'Delivery', kind: 'snippet', tip: 'A complete spell attack lead.', scopes: PROSE },
  { insert: '{NAME} makes two attacks.', label: 'Multiattack lead', group: 'Traits & actions', kind: 'snippet', tip: 'Opening line of a Multiattack.', scopes: PROSE },
  { insert: 'If {NAME} fails a saving throw, it can choose to succeed instead.', label: 'Legendary Resistance', group: 'Traits & actions', kind: 'snippet', tip: 'Legendary Resistance body (add uses per day).', scopes: PROSE },
  { insert: '{NAME} has Advantage on saving throws against spells and other magical effects.', label: 'Magic Resistance', group: 'Traits & actions', kind: 'snippet', tip: 'Magic Resistance body.', scopes: PROSE },
  { insert: '{NAME} has Advantage on an attack roll against a creature if at least one of its allies is within 5 feet of the creature and the ally doesn\'t have the Incapacitated condition.', label: 'Pack Tactics', group: 'Traits & actions', kind: 'snippet', tip: 'Pack Tactics body.', scopes: PROSE },
  { insert: '{NAME} regains {PB * 2} hit points at the start of each of its turns if it has at least 1 hit point.', label: 'Regeneration', group: 'Traits & actions', kind: 'snippet', tip: 'Regeneration body.', scopes: PROSE },
  { insert: '{NAME} gains {5 * PB} temporary hit points.', label: 'Gain temporary hit points', group: 'Traits & actions', kind: 'snippet', tip: 'Temporary hit points scaled by proficiency.', scopes: PROSE },
  { insert: 'When {NAME} is hit by an attack, it adds {PB} to its AC against that attack, possibly causing it to miss.', label: 'Parry (reaction)', group: 'Traits & actions', kind: 'snippet', tip: 'Parry reaction body.', scopes: PROSE },
  { insert: '{NAME} moves up to half its Speed without provoking Opportunity Attacks.', label: 'Disengaging move', group: 'Traits & actions', kind: 'snippet', tip: 'Common legendary action body.', scopes: PROSE },
  { insert: 'The target is pushed up to 10 feet straight away from {NAME}.', label: 'Push 10 feet', group: 'Conditions', kind: 'snippet', tip: 'Forced movement rider.', scopes: PROSE },
  { insert: 'and the target has the Grappled condition (escape {DC:STR}).', label: 'Grappled 2024 (escape DC)', group: 'Conditions', kind: 'snippet', tip: '2024 grapple rider.', scopes: PROSE },
  { insert: 'The target\'s Speed is reduced by 10 feet until the start of {NAME}\'s next turn.', label: 'Slowed 10 feet', group: 'Conditions', kind: 'snippet', tip: 'Speed reduction rider.', scopes: PROSE },
  { insert: 'The target can\'t regain hit points until the start of {NAME}\'s next turn.', label: 'No healing', group: 'Conditions', kind: 'snippet', tip: 'Healing denial rider.', scopes: PROSE },
  { insert: 'must succeed on a {DC:CON} saving throw or gain 1 Exhaustion level.', label: 'Exhaustion level', group: 'Conditions', kind: 'snippet', tip: '2024 Exhaustion rider.', scopes: PROSE },
  { insert: 'At the end of each of its turns, the target repeats the save, ending the effect on itself on a success.', label: 'Repeat the save each turn', group: 'Outcomes', kind: 'snippet', tip: 'Save-ends clause.', scopes: PROSE },
  { insert: '{NAME} casts one of the following spells, requiring no Material components and using its spellcasting ability (spell save {SPELL_DC}):', label: 'Spellcasting lead (2024)', group: 'Traits & actions', kind: 'snippet', tip: '2024 Spellcasting action lead.', scopes: PROSE },
  { insert: 'If damage reduces {NAME} to 0 hit points, it makes a Constitution saving throw with a DC of 5 plus the damage taken, unless the damage is Radiant or from a Critical Hit. On a successful save, {NAME} drops to 1 hit point instead.', label: 'Undead Fortitude', group: 'Traits & actions', kind: 'snippet', tip: 'Undead Fortitude body.', scopes: PROSE },
  { insert: '{NAME} can breathe air and water.', label: 'Amphibious', group: 'Traits & actions', kind: 'snippet', tip: 'Amphibious body.', scopes: PROSE },
  { insert: '{NAME} deals double damage to objects and structures.', label: 'Siege Monster', group: 'Traits & actions', kind: 'snippet', tip: 'Siege Monster body.', scopes: PROSE },
  { insert: 'While in sunlight, {NAME} has Disadvantage on ability checks and attack rolls.', label: 'Sunlight Sensitivity', group: 'Traits & actions', kind: 'snippet', tip: 'Sunlight Sensitivity body.', scopes: PROSE },
  { insert: '{NAME} can climb difficult surfaces, including along ceilings, without needing to make an ability check.', label: 'Spider Climb', group: 'Traits & actions', kind: 'snippet', tip: 'Spider Climb body.', scopes: PROSE },

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
  /** Inside a braced formula: offer bare references and variables only (no braces, no prose). */
  compose?: boolean
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
    .filter((entry) => !options.compose || entry.kind === 'reference' || entry.kind === 'custom')
    .map((entry) => (options.compose ? { ...entry, insert: entry.insert.replace(/^\{|\}$/g, '') } : entry))
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
export function openMacroAt(text: string, caret: number): { query: string; start: number; compose?: true } | undefined {
  const before = text.slice(0, caret)
  const brace = before.lastIndexOf('{')
  if (brace < 0) return undefined
  const body = before.slice(brace + 1)
  if (body.length > 80 || !/^[\w.: +\-*/(),]*$/.test(body)) return undefined
  // A single word is a token query; once an operator appears the caret is composing a formula,
  // so suggest for the identifier being typed and keep suggesting after every operator (Build 274).
  if (/^[\w.:]*$/.test(body.trim()) && !/[+\-*/(),]/.test(body)) return { query: body.trim(), start: brace }
  const fragment = /([A-Za-z_][\w.]*)$/.exec(body)?.[1] ?? ''
  return { query: fragment, start: caret - fragment.length, compose: true }
}

/** Replace the open "{query" (from `start` to `caret`) with `insert`; returns text and new caret. */
export function insertMacro(text: string, start: number, caret: number, insert: string): { text: string; caret: number } {
  const next = text.slice(0, start) + insert + text.slice(caret)
  return { text: next, caret: start + insert.length }
}

/** The identifier being typed at the caret in a bare formula ("PB + STR_M"), if any. */
export function openIdentifierAt(text: string, caret: number): { query: string; start: number } | undefined {
  const match = /([A-Za-z_][A-Za-z0-9_]*)$/.exec(text.slice(0, caret))
  return match ? { query: match[1], start: caret - match[1].length } : undefined
}

/** Formula references for bare formula fields: inserted without braces, limited to what `allow` accepts. */
export function formulaReferences(query: string, allow: (id: string) => boolean = () => true, limit = 8): MacroEntry[] {
  return catalogFor({ scope: 'mechanic', query })
    .filter((entry) => entry.kind === 'reference')
    .map((entry) => ({ ...entry, insert: entry.insert.slice(1, -1) }))
    .filter((entry) => allow(entry.insert))
    .slice(0, limit)
}

/** Braced tokens left unresolved after rendering (shown as a quiet warning in editors). */
export function unresolvedMacros(rendered: string): string[] {
  return [...new Set(String(rendered ?? '').match(/\{[^{}]{1,60}\}/g) ?? [])]
}
