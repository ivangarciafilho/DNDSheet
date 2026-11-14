import type { AbilityOutcome, RollScalingSpec } from './types.ts'
import { evaluateFormula, type FormulaContext } from './formula.ts'
import { hasRollScaling, resolveRollScaling } from './roll-scaling.ts'

/** Outcome triggers that carry an action's full damage; a successful save's reduced damage is not added. */
const FULL_DAMAGE_TRIGGERS = new Set(['hit', 'failure', 'fail', 'failed', 'on hit', 'on failure', 'damage', ''])

/**
 * Average damage the CR estimate reads from an action's structured outcomes (A9.12 + A9.13):
 * the strongest full-damage outcome, summing its damage clauses and multiplying by any
 * explicit rollScaling beam/roll count and damageMultiplier. Prose is never parsed; invalid formulas count as 0.
 */
export function structuredOutcomeDamage(
  action: { outcomes?: AbilityOutcome[]; rollScaling?: RollScalingSpec; attackCount?: number | string },
  ctx: FormulaContext,
): number {
  let best = 0
  for (const outcome of action.outcomes || []) {
    if (!FULL_DAMAGE_TRIGGERS.has(String(outcome.trigger || '').trim().toLowerCase())) continue
    let total = 0
    for (const effect of outcome.effects || []) {
      if (effect.kind !== 'damage' || !effect.formula) continue
      const result = evaluateFormula(effect.formula, ctx, { style: 'dice' })
      if (result.ok && Number.isFinite(result.value)) total += Math.max(0, result.value)
    }
    best = Math.max(best, total)
  }
  if (best <= 0) return 0
  if (!hasRollScaling(action.rollScaling)) return best
  const resolved = resolveRollScaling({ formulaContext: ctx }, action.rollScaling, {
    attackCount: action.attackCount,
  })
  const strikes = Math.max(1, resolved.beamCount || resolved.rollCount || 1)
  return best * strikes * Math.max(1, resolved.damageMultiplier || 1)
}
