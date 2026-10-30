import type { Monster } from './types.ts'
import type { ChainRowView } from './composer-chain.ts'

export type HeaderRole = 'legendary' | 'mythic' | 'lair'
export interface RoleHeaderDraft {
  count: number | string
  initiative: number | string
  custom: boolean
  preamble: string
  triggerName: string
  triggerRecharge: string
  triggerDescription: string
}
type HeaderField = { id: 'count' | 'initiative'; kind: 'number'; label: string }
  | { id: 'custom'; kind: 'toggle'; label: string }
  | { id: 'preamble' | 'triggerDescription'; kind: 'prose'; label: string }
  | { id: 'triggerName' | 'triggerRecharge'; kind: 'text'; label: string }

/** Section context is owned by the monster, never invented as fields on an individual entry. */
export const ROLE_HEADERS: Readonly<Record<HeaderRole, readonly HeaderField[]>> = {
  legendary: [
    { id: 'count', kind: 'number', label: 'Legendary action pool' },
    { id: 'custom', kind: 'toggle', label: 'Use custom legendary preamble' },
    { id: 'preamble', kind: 'prose', label: 'Legendary preamble' },
  ],
  mythic: [
    { id: 'triggerName', kind: 'text', label: 'Mythic trait name' },
    { id: 'triggerRecharge', kind: 'text', label: 'Mythic recharge' },
    { id: 'triggerDescription', kind: 'prose', label: 'Mythic trigger description' },
    { id: 'preamble', kind: 'prose', label: 'Mythic preamble' },
  ],
  lair: [
    { id: 'initiative', kind: 'number', label: 'Lair initiative count' },
    { id: 'custom', kind: 'toggle', label: 'Use custom lair preamble' },
    { id: 'preamble', kind: 'prose', label: 'Lair preamble' },
  ],
}

/** Legacy preset identities; reset edits only the local field until Apply. */
export const ROLE_HEADER_RESETS: Readonly<Record<HeaderRole, Partial<Record<keyof RoleHeaderDraft, string>>>> = {
  legendary: { preamble: 'presets.legendaryActions' },
  mythic: { triggerDescription: 'presets.mythicDescription', preamble: 'presets.mythicPreamble' },
  lair: { preamble: 'presets.lair' },
}

export function roleHeaderDraft(monster: Monster, role: HeaderRole): RoleHeaderDraft {
  return {
    count: monster.legendaryActions.count,
    initiative: monster.initiativeConfig?.lairInitiative ?? 20,
    custom: role === 'legendary' ? monster.legendaryActions.useCustomPreamble : monster.useCustomLairActionPreamble,
    preamble: role === 'legendary' ? monster.legendaryActions.customPreamble : role === 'mythic' ? monster.mythicActions.preamble : monster.lairActionPreamble,
    triggerName: monster.mythicActions.triggerName,
    triggerRecharge: monster.mythicActions.triggerRecharge,
    triggerDescription: monster.mythicActions.triggerDescription,
  }
}

export function validateRoleHeader(role: HeaderRole, draft: RoleHeaderDraft): string {
  const field = role === 'legendary' ? 'count' : role === 'lair' ? 'initiative' : undefined
  if (!field) return ''
  const value = draft[field]
  const max = field === 'count' ? 99 : 40
  return String(value).trim() !== '' && Number.isInteger(Number(value)) && Number(value) >= 0 && Number(value) <= max
    ? '' : `Use a whole ${field === 'count' ? 'pool' : 'initiative'} count from 0 to ${max}`
}

/** Patch from the current model at Apply time, retaining memberships and all unrelated tuning. */
export function roleHeaderPatch(monster: Monster, role: HeaderRole, draft: RoleHeaderDraft): Partial<Monster> {
  if (validateRoleHeader(role, draft)) return {}
  if (role === 'legendary') return { legendaryActions: {
    ...monster.legendaryActions, count: Number(draft.count), useCustomPreamble: draft.custom, customPreamble: draft.preamble,
  } }
  if (role === 'mythic') return { mythicActions: {
    ...monster.mythicActions, triggerName: draft.triggerName, triggerRecharge: draft.triggerRecharge,
    triggerDescription: draft.triggerDescription, preamble: draft.preamble,
  } }
  return {
    initiativeConfig: { ...monster.initiativeConfig, lairInitiative: Number(draft.initiative) },
    useCustomLairActionPreamble: draft.custom, lairActionPreamble: draft.preamble,
  }
}

export function lairChainView(): ChainRowView[] {
  return [{ row: 'head', cells: [{ id: 'role-label', label: 'Lair Action', row: 'head', editor: 'text', state: 'set', text: 'Lair Action', legacy: false }] }]
}
