export type ActionComposerRole = 'action' | 'bonus_action' | 'trait' | 'reaction' | 'legendary' | 'mythic' | 'lair'
export type ComposerRow = 'head' | 'mechanics' | 'scope' | 'outcomes' | 'prose'
export type ComposerEditor = 'text' | 'number' | 'catalog' | 'structured'

export interface ComposerCellSpec {
  id: string
  label: string
  row: ComposerRow
  editor: ComposerEditor
  /** Existing model field or role adapter path when the cell edits persisted data. */
  field?: string
  editable?: boolean
  /** Cells without a field are derived or role metadata and must not write directly. */
  options?: readonly string[]
  /** Catalog cells holding several values at once (components, planes). */
  multiple?: boolean
  /** Catalog cells that also accept free text beyond their options. */
  allowCustom?: boolean
}

export const DISCIPLINES: readonly string[] = [
  'Abjuration', 'Conjuration', 'Divination', 'Enchantment', 'Evocation', 'Illusion',
  'Necromancy', 'Transmutation', 'Martial', 'Psionic', 'Supernatural',
]
export const TIERS: readonly string[] = [
  'Cantrip', '1st Level', '2nd Level', '3rd Level', '4th Level', '5th Level', '6th Level',
  '7th Level', '8th Level', '9th Level', 'Heroic', 'Legendary', 'Mythic',
]
/** Verbal, Somatic, Material, then the Concentration and Ritual tags, in stat block order. */
export const COMPONENT_TAGS: readonly string[] = ['V', 'S', 'M', 'C', 'R']
export const DURATIONS: readonly string[] = [
  'Instantaneous', '1 round', '1 minute', '10 minutes', '1 hour', '8 hours', '24 hours',
  'Until dispelled', 'Concentration, up to 1 minute',
]
export const SAVE_ABILITIES: readonly string[] = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA']
export const TARGET_KINDS: readonly string[] = ['creature', 'creatures', 'target', 'targets', 'object', 'objects', 'ally', 'allies', 'enemy', 'enemies']
export const TARGET_QUALIFIERS: readonly string[] = ['which you can see', 'that it can see', 'of its choice', 'hostile to it', 'friendly to it']
export const PLANES: readonly string[] = ['Material', 'Ethereal', 'Astral', 'Shadowfell', 'Feywild']
export const AREA_SHAPES: readonly string[] = ['cone', 'cube', 'cylinder', 'emanation', 'line', 'sphere', 'radius sphere']
export const LEGENDARY_COSTS: readonly string[] = ['1', '2', '3']
export const DAMAGE_TYPES: readonly string[] = [
  'acid', 'bludgeoning', 'cold', 'fire', 'force', 'lightning', 'necrotic',
  'piercing', 'poison', 'psychic', 'radiant', 'slashing', 'thunder',
]
/** Stored lower-case so the grammar prints "On Hit", "On Failure" and "On Success". */
export const OUTCOME_TRIGGERS: readonly string[] = ['hit', 'failure', 'success']

/** Head order mirrors the plate head: usage · discipline · tier · NAME (components) duration. */
const actionChain: readonly ComposerCellSpec[] = [
  { id: 'usage', label: 'Usage', row: 'head', editor: 'text', field: 'recharge' },
  { id: 'discipline', label: 'Discipline', row: 'head', editor: 'catalog', field: 'school', options: DISCIPLINES },
  { id: 'tier', label: 'Tier', row: 'head', editor: 'catalog', field: 'spellLevel', options: TIERS },
  { id: 'name', label: 'Name', row: 'head', editor: 'text', field: 'name' },
  { id: 'components', label: 'Components', row: 'head', editor: 'catalog', field: 'components', options: COMPONENT_TAGS, multiple: true },
  { id: 'duration', label: 'Duration', row: 'head', editor: 'catalog', field: 'duration', options: DURATIONS, allowCustom: true },
  // One chip holds reach and source because the plate prints them as one phrase ("Ranged Spell Attack").
  { id: 'attack', label: 'Attack', row: 'mechanics', editor: 'catalog', field: 'attackSource' },
  { id: 'attack-bonus', label: 'Attack bonus', row: 'mechanics', editor: 'number', field: 'attackBonus' },
  { id: 'save-ability', label: 'Save', row: 'mechanics', editor: 'catalog', field: 'stat', options: SAVE_ABILITIES },
  { id: 'save-dc', label: 'Save DC', row: 'mechanics', editor: 'number', field: 'save' },
  { id: 'target-count', label: 'Targets', row: 'scope', editor: 'structured', field: 'targeting.count' },
  { id: 'target-kind', label: 'Target kind', row: 'scope', editor: 'catalog', field: 'targeting.kind', options: TARGET_KINDS, allowCustom: true },
  { id: 'target-qualifier', label: 'Qualifier', row: 'scope', editor: 'catalog', field: 'targeting.qualifier', options: TARGET_QUALIFIERS, allowCustom: true },
  { id: 'target-range', label: 'Range', row: 'scope', editor: 'structured', field: 'targeting.range' },
  { id: 'target-area', label: 'Area', row: 'scope', editor: 'structured', field: 'targeting.area' },
  { id: 'target-planes', label: 'Planes', row: 'scope', editor: 'catalog', field: 'targeting.planes', options: PLANES, multiple: true, allowCustom: true },
  { id: 'legacy-targets', label: 'Legacy target text', row: 'scope', editor: 'text', field: 'targetsText' },
  { id: 'legacy-range', label: 'Legacy range text', row: 'scope', editor: 'text', field: 'range' },
  { id: 'legacy-area', label: 'Legacy area text', row: 'scope', editor: 'text', field: 'areaShape' },
  { id: 'legacy-area-distance', label: 'Legacy area distance', row: 'scope', editor: 'text', field: 'areaDistance' },
  { id: 'outcomes', label: 'Outcomes', row: 'outcomes', editor: 'structured', field: 'outcomes' },
  { id: 'legacy-effects', label: 'Legacy effects', row: 'outcomes', editor: 'structured', field: 'effects' },
  { id: 'description', label: 'Description', row: 'prose', editor: 'text', field: 'description' },
]

/** Legendary and mythic plates print the action-point cost where actions print recharge or uses. */
const pooledActionChain: readonly ComposerCellSpec[] = actionChain.map((cell) =>
  cell.id === 'usage' ? { ...cell, label: 'Cost', editor: 'catalog', field: 'cost', options: LEGENDARY_COSTS } : cell
)

const traitChain: readonly ComposerCellSpec[] = [
  { id: 'trait-usage', label: 'Cadence', row: 'head', editor: 'structured', field: 'limitedUse' },
  { id: 'name', label: 'Name', row: 'head', editor: 'text', field: 'name' },
  { id: 'description', label: 'Description', row: 'prose', editor: 'text' },
]

const reactionChain: readonly ComposerCellSpec[] = [
  { id: 'name', label: 'Name', row: 'head', editor: 'text' },
  { id: 'usage', label: 'Uses', row: 'head', editor: 'text' },
  { id: 'trigger', label: 'Trigger', row: 'mechanics', editor: 'text' },
  { id: 'description', label: 'Description', row: 'prose', editor: 'text' },
]

const lairChain: readonly ComposerCellSpec[] = [
  { id: 'role-label', label: 'Lair Action', row: 'head', editor: 'text', editable: false },
  { id: 'description', label: 'Description', row: 'prose', editor: 'text' },
]

/**
 * Presentation metadata only. The existing role collections and persisted model remain authoritative.
 * Rows follow buildPlateEntry's stable order; outcomes are body content before authored description.
 */
export const ROLE_CHAINS: Readonly<Record<ActionComposerRole, readonly ComposerCellSpec[]>> = {
  action: actionChain,
  bonus_action: actionChain,
  legendary: pooledActionChain,
  mythic: pooledActionChain,
  trait: traitChain,
  reaction: reactionChain,
  lair: lairChain,
}

export const COMPOSER_ROW_ORDER: readonly ComposerRow[] = ['head', 'mechanics', 'scope', 'outcomes', 'prose']
