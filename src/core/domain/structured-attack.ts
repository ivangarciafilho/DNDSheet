import type { AttackReach, DndStat, MonsterAction } from './types.ts'
import { inferAbility } from './ability-grammar.ts'
import { statModifier } from './math-utils.ts'

/** The monster facts an automatic attack bonus reads; the store and exported monsters both satisfy it. */
export interface AttackBonusSource {
  proficiency: number
  stats: Partial<Record<DndStat, number>>
  spellcasting?: { stat?: DndStat; attack?: { override?: boolean; overrideValue?: number } }
}

/** Omitted provenance retains the existing reach default. A thrown ranged weapon
 * (such as a dart) keeps Automatic; the thrown rule explicitly means a melee weapon. */
export const weaponAttackStat = (reach: AttackReach | undefined): DndStat => (reach === 'ranged' ? 'DEX' : 'STR')
const finite = (value: unknown, fallback: number): number => typeof value === 'number' && Number.isFinite(value) ? value : fallback
const modifier = (source: AttackBonusSource, stat: DndStat): number => statModifier(finite(source.stats[stat], 10))
export function weaponAttackAbility(action: Partial<MonsterAction>, source: AttackBonusSource): DndStat {
  const rule = action.weaponAttackAbility
  if (rule === 'finesse' || rule === 'finesse_thrown') return modifier(source, 'DEX') > modifier(source, 'STR') ? 'DEX' : 'STR'
  if (rule === 'thrown') return 'STR'
  if (['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'].includes(rule || '')) return rule as DndStat
  return weaponAttackStat(inferAbility(action).attackReach)
}

/** One automatic bonus for the sheet, the composer chip and every export: an authored number always wins. */
export function structuredAttackBonus(action: Partial<MonsterAction>, source: AttackBonusSource): number | undefined {
  if (typeof action.attackBonus === 'number' && Number.isFinite(action.attackBonus)) return action.attackBonus
  const ability = inferAbility(action)
  if (ability.attackSource === 'spell') {
    const attack = source.spellcasting?.attack
    if (attack?.override && typeof attack.overrideValue === 'number' && Number.isFinite(attack.overrideValue)) return attack.overrideValue
    return finite(source.proficiency, 0) + modifier(source, source.spellcasting?.stat ?? 'INT')
  }
  if (ability.attackSource === 'weapon') {
    return finite(source.proficiency, 0) + modifier(source, weaponAttackAbility(action, source))
  }
  return undefined
}
