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
}

const actionChain: readonly ComposerCellSpec[] = [
  { id: 'name', label: 'Name', row: 'head', editor: 'text', field: 'name' },
  { id: 'usage', label: 'Usage', row: 'head', editor: 'text', field: 'recharge' },
  { id: 'discipline', label: 'Discipline', row: 'head', editor: 'catalog', field: 'school' },
  { id: 'tier', label: 'Tier', row: 'head', editor: 'catalog', field: 'spellLevel' },
  { id: 'components', label: 'Components', row: 'head', editor: 'structured', field: 'components' },
  { id: 'duration', label: 'Duration', row: 'head', editor: 'catalog', field: 'duration' },
  { id: 'attack', label: 'Attack', row: 'mechanics', editor: 'catalog', field: 'actionType' },
  { id: 'attack-reach', label: 'Reach', row: 'mechanics', editor: 'catalog', field: 'attackReach' },
  { id: 'attack-source', label: 'Attack source', row: 'mechanics', editor: 'catalog', field: 'attackSource' },
  { id: 'attack-bonus', label: 'Attack bonus', row: 'mechanics', editor: 'number', field: 'attackBonus' },
  { id: 'save-ability', label: 'Save ability', row: 'mechanics', editor: 'catalog', field: 'stat' },
  { id: 'save-dc', label: 'Save DC', row: 'mechanics', editor: 'structured', field: 'save' },
  { id: 'target-count', label: 'Target count', row: 'scope', editor: 'number', field: 'targeting.count' },
  { id: 'target-kind', label: 'Target kind', row: 'scope', editor: 'text', field: 'targeting.kind' },
  { id: 'target-qualifier', label: 'Target qualifier', row: 'scope', editor: 'text', field: 'targeting.qualifier' },
  { id: 'target-range', label: 'Range', row: 'scope', editor: 'structured', field: 'targeting.range' },
  { id: 'target-area', label: 'Area', row: 'scope', editor: 'structured', field: 'targeting.area' },
  { id: 'target-planes', label: 'Planes', row: 'scope', editor: 'structured', field: 'targeting.planes' },
  { id: 'legacy-targets', label: 'Legacy target text', row: 'scope', editor: 'text', field: 'targetsText' },
  { id: 'legacy-range', label: 'Legacy range text', row: 'scope', editor: 'text', field: 'range' },
  { id: 'legacy-area', label: 'Legacy area text', row: 'scope', editor: 'text', field: 'areaShape' },
  { id: 'legacy-area-distance', label: 'Legacy area distance', row: 'scope', editor: 'text', field: 'areaDistance' },
  { id: 'outcomes', label: 'Outcomes', row: 'outcomes', editor: 'structured', field: 'outcomes' },
  { id: 'legacy-effects', label: 'Legacy effects', row: 'outcomes', editor: 'structured', field: 'effects' },
  { id: 'description', label: 'Description', row: 'prose', editor: 'text', field: 'description' },
]

const traitChain: readonly ComposerCellSpec[] = [
  { id: 'name', label: 'Name', row: 'head', editor: 'text' },
  { id: 'usage', label: 'Usage', row: 'head', editor: 'text' },
  { id: 'description', label: 'Description', row: 'prose', editor: 'text' },
]

const reactionChain: readonly ComposerCellSpec[] = [
  { id: 'name', label: 'Name', row: 'head', editor: 'text' },
  { id: 'usage', label: 'Usage', row: 'head', editor: 'text' },
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
  legendary: actionChain,
  mythic: actionChain,
  trait: traitChain,
  reaction: reactionChain,
  lair: lairChain,
}

export const COMPOSER_ROW_ORDER: readonly ComposerRow[] = ['head', 'mechanics', 'scope', 'outcomes', 'prose']
