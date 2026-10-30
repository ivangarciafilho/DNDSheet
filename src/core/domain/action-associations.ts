import type { Monster } from './types.ts'

export type AssociationRole = 'legendary' | 'mythic'
export type AssociationChange = { kind: 'add'; actionId: string }
  | { kind: 'cost'; index: number; actionId: string; cost: number }
  | { kind: 'remove'; index: number; actionId: string }
  | { kind: 'repair'; index: number; actionId: string; replacementId: string }
export interface AssociationChoice { id: string; label: string; group: 'Attacks' | 'Actions' }

/** References contain only a source ID, so ambiguous imported IDs cannot be safely chosen. */
export function associationChoices(monster: Monster, role: AssociationRole): AssociationChoice[] {
  const sources = [
    ...monster.attacks.map(source => ({ id: source.id, label: source.name || 'Unnamed attack', group: 'Attacks' as const })),
    ...monster.actions.map(source => ({ id: source.id, label: source.name || 'Unnamed action', group: 'Actions' as const })),
  ]
  const members = role === 'legendary' ? monster.legendaryActions.actions : monster.mythicActions.actions
  const counts = new Map<string, number>()
  sources.forEach(source => counts.set(source.id, (counts.get(source.id) || 0) + 1))
  return sources.filter(source => source.id && counts.get(source.id) === 1 && !members.some(member => member.actionId === source.id))
}

/** Patches membership only: source records and cross-role references retain their identity. */
export function associationPatch(monster: Monster, role: AssociationRole, change: AssociationChange): Partial<Monster> {
  const section = role === 'legendary' ? monster.legendaryActions : monster.mythicActions
  const actions = [...section.actions]
  if (change.kind === 'add') {
    if (!associationChoices(monster, role).some(choice => choice.id === change.actionId)) return {}
    actions.push({ actionId: change.actionId, cost: 1 })
  } else {
    const current = actions[change.index]
    if (!current || current.actionId !== change.actionId) return {}
    if (change.kind === 'remove') actions.splice(change.index, 1)
    else if (change.kind === 'cost') {
      if (!Number.isSafeInteger(change.cost) || change.cost < 1) return {}
      actions[change.index] = { ...current, cost: change.cost }
    } else {
      const sourceExists = [...monster.attacks, ...monster.actions].some(source => source.id === current.actionId)
      if (sourceExists || !associationChoices(monster, role).some(choice => choice.id === change.replacementId)) return {}
      actions[change.index] = { ...current, actionId: change.replacementId }
    }
  }
  if (role === 'legendary') return { legendaryActions: { ...monster.legendaryActions, actions, count: change.kind === 'add' && monster.legendaryActions.count === 0 ? 3 : monster.legendaryActions.count } }
  return { mythicActions: { ...monster.mythicActions, actions } }
}
