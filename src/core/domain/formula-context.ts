import type { DndStat, Monster } from './types.ts'
import { abilityModifier, buildFormulaContext } from './formula.ts'
import type { FormulaContext } from './formula.ts'

const overrideOf = (block: { override?: boolean; overrideValue?: number } | undefined): number | undefined =>
  block?.override && Number.isFinite(Number(block.overrideValue)) ? Number(block.overrideValue) : undefined

/**
 * Formula context for a stored creature, overrides included (spell save DC,
 * spell attack, passive Perception, initiative proficiency). Pass live store
 * getters through `derived` when they know better (computed AC, average HP).
 */
export function formulaContextForMonster(
  monster: Partial<Monster> | null | undefined,
  derived: Partial<FormulaContext> = {}
): FormulaContext {
  const m = (monster ?? {}) as Partial<Monster>
  const stats = (m.stats ?? {}) as Partial<Record<DndStat, number>>
  const pb = Number.isFinite(Number(m.proficiency)) ? Number(m.proficiency) : 2
  const spellStat = ((m.spellcasting?.stat as DndStat | undefined) ?? 'INT') as DndStat
  const spellMod = abilityModifier(stats[spellStat] ?? 10)

  let passivePerception: number | undefined = overrideOf(
    m.passivePerception as { override?: boolean; overrideValue?: number } | undefined
  )
  if (passivePerception === undefined) {
    const perception = m.skills?.find((s) => String(s.key ?? '').toUpperCase() === 'PERCEPTION')
    if (perception) {
      const stat = (perception.skill?.stat ?? 'WIS') as DndStat
      const bonus = perception.override
        ? Number(perception.overrideValue ?? 0)
        : abilityModifier(stats[stat] ?? 10) + pb * (perception.expertise ? 2 : perception.proficient ? 1 : 0)
      passivePerception = 10 + bonus + (perception.advantage ? 5 : 0) - (perception.disadvantage ? 5 : 0)
    }
  }

  const initiative = abilityModifier(stats.DEX ?? 10) + (m.initiativeConfig?.proficient ? pb : 0)

  return buildFormulaContext(m, {
    spellSaveDc: overrideOf(m.spellcasting?.save) ?? 8 + pb + spellMod,
    spellAttack: overrideOf(m.spellcasting?.attack) ?? pb + spellMod,
    passivePerception,
    initiative,
    ...derived,
  })
}
