import { defaultAction, defaultTrait, defaultCrAnnotation } from './types.ts'
import type { Monster, MonsterAction, MonsterTrait, MonsterReaction, LairAction } from './types.ts'
import type { ActionComposerRole } from './action-composer.ts'

export const ROLE_NAMES: Record<ActionComposerRole, string> = {
  action: 'Action', bonus_action: 'Bonus Action', trait: 'Trait', reaction: 'Reaction',
  legendary: 'Legendary Action', mythic: 'Mythic Action', lair: 'Lair Action',
}
const family = new Set<ActionComposerRole>(['action', 'bonus_action', 'legendary', 'mythic'])
type Entry = MonsterAction | MonsterTrait | MonsterReaction | LairAction
export interface RoleTransition {
  kind: 'noop' | 'unavailable' | 'move' | 'copy'
  title: string
  message: string
  patch?: Partial<Monster>
}
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

/** Pure preview/commit decision: IDs are supplied by the shell, not generated here. */
export function roleTransition(monster: Monster, id: string, source: ActionComposerRole, target: ActionComposerRole, copyId: string): RoleTransition {
  const unavailable: RoleTransition = { kind: 'unavailable', title: 'Entry changed', message: 'This entry is no longer available. Review the current studio before trying again.' }
  if (!Object.hasOwn(ROLE_NAMES, source) || !Object.hasOwn(ROLE_NAMES, target)) return unavailable
  const collection = source === 'trait' ? monster.traits : source === 'reaction' ? monster.reactions : source === 'lair' ? monster.lairActions : monster.actions
  const entry: Entry | undefined = collection.find(item => item.id === id)
  if (!entry) return unavailable
  if (source === target) return { kind: 'noop', title: '', message: '' }
  const move = family.has(source) && family.has(target)
  if (!move && (!copyId || [...monster.actions, ...monster.traits, ...monster.reactions, ...monster.lairActions].some(item => item.id === copyId))) return unavailable
  const destinationId = move ? id : copyId
  const oldCost = monster.legendaryActions.actions.find(item => item.actionId === id)?.cost ?? monster.mythicActions.actions.find(item => item.actionId === id)?.cost ?? 1
  const memberships = (current: Monster['legendaryActions']['actions'], active: boolean) => {
    if (!move) return active ? [...current, { actionId: destinationId, cost: 1 }] : current
    if (!active) return current.filter(item => item.actionId !== id)
    return current.some(item => item.actionId === id) ? current : [...current, { actionId: id, cost: oldCost }]
  }
  const patch: Partial<Monster> = {}
  if (move) {
    patch.actions = monster.actions.map(item => item.id === id
      ? { ...item, bonusAction: target === 'bonus_action', legendaryOnly: target === 'legendary' || target === 'mythic' } : item)
  } else {
    const common = { id: copyId, description: entry.description }
    const name = 'name' in entry ? entry.name : 'Lair Action'
    const uses = 'limitedUse' in entry ? clone(entry.limitedUse) : { count: 0, rate: 'DAY' }
    // A retained source and its copy must not both contribute the same CR estimates by default.
    const cr = { ...defaultCrAnnotation(), ...('crAnnotation' in entry ? clone(entry.crAnnotation) : {}), include: false }
    if (target === 'trait') patch.traits = [...monster.traits, { ...defaultTrait(copyId), ...common, name, limitedUse: uses, crAnnotation: cr }]
    else if (target === 'reaction') patch.reactions = [...monster.reactions, { ...common, name, limitedUse: uses, trigger: '' }]
    else if (target === 'lair') patch.lairActions = [...monster.lairActions, { ...common, crAnnotation: cr }]
    else patch.actions = [...monster.actions, { ...defaultAction(copyId), ...common, name, limitedUse: uses, crAnnotation: cr,
      bonusAction: target === 'bonus_action', legendaryOnly: target === 'legendary' || target === 'mythic' }]
  }
  if (move || target === 'legendary') patch.legendaryActions = { ...monster.legendaryActions, actions: memberships(monster.legendaryActions.actions, target === 'legendary') }
  if (move || target === 'mythic') patch.mythicActions = { ...monster.mythicActions, actions: memberships(monster.mythicActions.actions, target === 'mythic') }
  return move ? {
    kind: 'move', title: `Change to ${ROLE_NAMES[target]}?`, patch,
    message: 'Keeps this entry’s ID, position, mechanics, usage, CR settings and multiattack references. Its action/bonus flags and legendary/mythic memberships will change to the selected role. Section settings stay unchanged.',
  } : {
    kind: 'copy', title: `Create ${ROLE_NAMES[target]} copy?`, patch,
    message: 'The original entry and all its references stay unchanged. The copy receives a new ID, description, name where supported, compatible limited uses and CR estimates. Other role-specific mechanics stay on the original; review the copy’s mechanics and any description macros before use. Copies start excluded from CR calculations where supported. Section settings stay unchanged.',
  }
}
