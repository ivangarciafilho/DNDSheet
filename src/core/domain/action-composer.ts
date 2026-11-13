export type ActionComposerRole = 'action' | 'bonus_action' | 'trait' | 'reaction' | 'legendary' | 'mythic' | 'lair'
export type ComposerRow = 'head' | 'trigger' | 'mechanics' | 'scope' | 'outcomes' | 'prose'
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
  // Turn & Round Milestones (Alphabetical within group)
  'Instantaneous',
  'Until end of combat',
  'Until end of target\'s next turn',
  'Until end of target\'s turn',
  'Until end of turn',
  'Until end of your next turn',
  'Until start of target\'s next turn',
  'Until start of your next turn',
  // Measured Time Durations
  '1 round',
  '1 minute',
  '10 minutes',
  '1 hour',
  '8 hours',
  '24 hours',
  // Concentration Durations
  'Concentration, up to 1 round',
  'Concentration, up to 1 minute',
  'Concentration, up to 10 minutes',
  'Concentration, up to 1 hour',
  'Concentration, up to 8 hours',
  'Concentration, up to 24 hours',
  // Rest, Cycle & Condition Milestones
  'Permanent',
  'Special',
  'Until Bloodied',
  'Until Dawn',
  'Until Dusk',
  'Until Long Rest',
  'Until Reduced to 0 HP',
  'Until Short or Long Rest',
  'Until dispelled',
  'Until triggered',
]
export const SAVE_ABILITIES: readonly string[] = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA']
export const TARGET_KINDS: readonly string[] = [
  'ally', 'allies', 'celestial', 'celestials', 'construct', 'constructs',
  'creature', 'creatures', 'dragon', 'dragons', 'elemental', 'elementals',
  'enemy', 'enemies', 'fey', 'fiend', 'fiends', 'humanoid', 'humanoids',
  'object', 'objects', 'point', 'self', 'space', 'spaces', 'structure', 'structures',
  'target', 'targets', 'undead',
]
export const TARGET_QUALIFIERS: readonly string[] = [
  'which you can see', 'that it can see', 'of its choice', 'of your choice',
  'hostile to it', 'friendly to it', 'within reach', 'within range',
  'that can hear it', 'that can see it', 'that is Bloodied', 'that is Prone',
  'that is Grappled by it', 'that is Restrained', 'that is not Construct or Undead',
  'including itself', 'other than itself',
]
export const PLANES: readonly string[] = [
  'Material', 'Ethereal', 'Astral', 'Shadowfell', 'Feywild',
  'Elemental Chaos', 'Nine Hells', 'Abyss', 'Celestia', 'Limbo', 'Mechanus', 'Far Realm',
]
export const AREA_SHAPES: readonly string[] = [
  'cone', 'cube', 'cylinder', 'emanation', 'hemisphere', 'line', 'radius', 'radius sphere', 'sphere', 'square', 'wall',
]
export const LEGENDARY_COSTS: readonly string[] = ['1', '2', '3']
export const DAMAGE_TYPES: readonly string[] = [
  'acid', 'bludgeoning', 'cold', 'fire', 'force', 'lightning', 'necrotic',
  'piercing', 'poison', 'psychic', 'radiant', 'slashing', 'thunder',
]
/** Authored rule labels are shared by editor reading, validation and patches. */
export const WEAPON_ABILITY_RULES = [
  { value: 'auto', label: 'Automatic by reach' },
  { value: 'CHA', label: 'Charisma' }, { value: 'CON', label: 'Constitution' },
  { value: 'DEX', label: 'Dexterity' },
  { value: 'finesse', label: 'Finesse (better of STR and DEX)' },
  { value: 'finesse_thrown', label: 'Finesse thrown melee weapon (better of STR and DEX)' },
  { value: 'INT', label: 'Intelligence' }, { value: 'STR', label: 'Strength' },
  { value: 'thrown', label: 'Thrown melee weapon (STR)' }, { value: 'WIS', label: 'Wisdom' },
] as const

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
  { id: 'weapon-ability', label: 'Weapon ability', row: 'mechanics', editor: 'catalog', field: 'weaponAttackAbility', options: WEAPON_ABILITY_RULES.map(rule => rule.label) },
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

const traitChain: readonly ComposerCellSpec[] = actionChain.map(cell => cell.id === 'usage'
 ? { ...cell, id:'trait-usage', label:'Cadence', editor:'structured' } : cell)
const reactionChain: readonly ComposerCellSpec[] = [
 ...actionChain.filter(cell => cell.row === 'head'),
 { id:'trigger',label:'Trigger',row:'trigger',editor:'text',field:'trigger' },
 ...actionChain.filter(cell => cell.row !== 'head'),
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

export const COMPOSER_ROW_ORDER: readonly ComposerRow[] = ['head', 'trigger', 'mechanics', 'scope', 'outcomes', 'prose']
