import type { AbilityTargeting } from './types.ts'

/**
 * DMG CR rule: an effect that can hit more than one target counts its damage twice.
 * Structured targeting decides it: a numeric count above one, "all", or any area of effect.
 * A formula count (e.g. `{PB}`) is not resolved here and stays single-target.
 */
export function isMultitarget(action: { targeting?: AbilityTargeting } | undefined): boolean {
  const targeting = action?.targeting
  if (!targeting) return false
  if (targeting.area) return true
  if (targeting.count === 'all') return true
  return typeof targeting.count === 'number' && targeting.count > 1
}
