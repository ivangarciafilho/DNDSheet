import type { AttackReach, DndStat, MonsterAction } from './types.ts'
import { inferAbility } from './ability-grammar.ts'
import { statModifier } from './math-utils.ts'

/** The monster facts an automatic attack bonus reads; the store and exported monsters both satisfy it. */
export interface AttackBonusSource {
  proficiency: number
  stats: Partial<Record<DndStat, number>>
  spellcasting?: { stat?: DndStat; attack?: { override?: boolean; overrideValue?: number } }
}

/**
 * Weapon attacks without an authored bonus use Strength for melee/both reach and Dexterity for ranged-only reach.
 * Weapon properties cannot be inferred from reach. Finesse, thrown exceptions and homebrew need an authored bonus until explicit ability bindings land.
 */
export const weaponAttackStat = (reach: AttackReach | undefined): DndStat => (reach === 'ranged' ? 'DEX' : 'STR')

/** One automatic bonus for the sheet, the composer chip and every export: an authored number always wins. */
export function structuredAttackBonus(action: Partial<MonsterAction>, source: AttackBonusSource): number | undefined {
  if (typeof action.attackBonus === 'number' && Number.isFinite(action.attackBonus)) return action.attackBonus
  const ability = inferAbility(action)
  if (ability.attackSource === 'spell') {
    const attack = source.spellcasting?.attack
    if (attack?.override && typeof attack.overrideValue === 'number' && Number.isFinite(attack.overrideValue)) return attack.overrideValue
    return source.proficiency + statModifier(source.stats[source.spellcasting?.stat ?? 'INT'] ?? 10)
  }
  if (ability.attackSource === 'weapon') {
    return source.proficiency + statModifier(source.stats[weaponAttackStat(ability.attackReach)] ?? 10)
  }
  return undefined
}
