import { cadenceLabel } from './catalogs/cadence.ts'
import type { MonsterAction, MonsterReaction, ReactionAvailabilityPredicate, ReactionAvailabilitySet } from './types.ts'

export const REACTION_AVAILABILITY_PREDICATES: readonly ReactionAvailabilityPredicate[] = [
  'always',
  'while_bloodied',
  'when_bloodied',
  'while_not_bloodied',
  'at_0_hp',
  'at_1_hp',
]

export function reactionPredicateLabel(predicate?: ReactionAvailabilityPredicate): string {
  if (!predicate || predicate === 'always') return 'Always Available'
  return cadenceLabel(predicate) || predicate
}

export function reactionPredicateOptions(): { label: string; value: ReactionAvailabilityPredicate }[] {
  return REACTION_AVAILABILITY_PREDICATES.map((value) => ({
    label: reactionPredicateLabel(value),
    value,
  }))
}

export function normalizeStagePools(pools: unknown): number[] | undefined {
  if (!Array.isArray(pools)) return undefined
  const normalized = [...new Set(
    pools
      .map((item) => Number(item))
      .filter((num) => Number.isSafeInteger(num) && num > 0)
  )].sort((a, b) => a - b)
  return normalized.length > 0 ? normalized : undefined
}

export function sanitizeReactionAvailability(raw: unknown): ReactionAvailabilitySet | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined
  const record = raw as Record<string, unknown>
  const out: ReactionAvailabilitySet = {}
  const stagePools = normalizeStagePools(record.stagePools)
  if (stagePools) out.stagePools = stagePools
  if (typeof record.predicate === 'string' && REACTION_AVAILABILITY_PREDICATES.includes(record.predicate as ReactionAvailabilityPredicate)) {
    out.predicate = record.predicate as ReactionAvailabilityPredicate
  } else if (record.predicate !== undefined) {
    out.predicate = 'always'
  }
  if (typeof record.customCondition === 'string') {
    const trimmed = record.customCondition.trim()
    if (trimmed) out.customCondition = trimmed
  }
  return Object.keys(out).length > 0 ? out : undefined
}

export function entryEffectiveStagePools(entry: {
  stagePool?: number | string | 'all'
  availability?: ReactionAvailabilitySet
}): number[] {
  const fromSet = normalizeStagePools(entry?.availability?.stagePools)
  if (fromSet) return fromSet
  const raw = entry?.stagePool
  if (raw !== undefined && raw !== null && raw !== '' && raw !== 'all') {
    const num = Number(raw)
    if (Number.isSafeInteger(num) && num > 0) return [num]
  }
  return []
}

export function entryMatchesStagePool(
  entry: { stagePool?: number | string | 'all'; availability?: ReactionAvailabilitySet },
  activePool: string | number | undefined
): boolean {
  if (activePool === undefined || activePool === null || activePool === '' || activePool === 'all') return true
  const pools = entryEffectiveStagePools(entry)
  if (pools.length === 0) return true
  const target = Number(activePool)
  if (Number.isSafeInteger(target) && target > 0) return pools.includes(target)
  return `${entry.stagePool}` === `${activePool}`
}

export function formatReactionAvailability(
  entry: { stagePool?: number | string | 'all'; availability?: ReactionAvailabilitySet },
  phaseName = 'Phase'
): { poolsLabel: string; conditionLabel: string } {
  const pools = entryEffectiveStagePools(entry)
  const labelRoot = (phaseName || 'Phase').trim()
  const poolsLabel = pools.length > 0
    ? `${labelRoot} ${pools.join(', ')}`
    : entry.stagePool && entry.stagePool !== 'all'
      ? `${labelRoot} ${String(entry.stagePool).trim()}`
      : ''
  const pred = entry.availability?.predicate && entry.availability.predicate !== 'always'
    ? reactionPredicateLabel(entry.availability.predicate)
    : ''
  const custom = (entry.availability?.customCondition ?? '').trim()
  const conditionLabel = [pred, custom].filter(Boolean).join(' — ')
  return { poolsLabel, conditionLabel }
}

export function reactionAvailabilityPatch(
  current: ReactionAvailabilitySet | undefined,
  next: Partial<ReactionAvailabilitySet>
): Partial<Pick<MonsterReaction, 'availability' | 'stagePool'>> {
  const merged: ReactionAvailabilitySet = { ...(current ?? {}) }
  if ('stagePools' in next) {
    const stagePools = normalizeStagePools(next.stagePools)
    if (stagePools) merged.stagePools = stagePools
    else delete merged.stagePools
  }
  if ('predicate' in next) {
    merged.predicate = next.predicate && REACTION_AVAILABILITY_PREDICATES.includes(next.predicate)
      ? next.predicate
      : 'always'
  }
  if ('customCondition' in next) {
    const trimmed = typeof next.customCondition === 'string' ? next.customCondition.trim() : ''
    if (trimmed) merged.customCondition = trimmed
    else delete merged.customCondition
  }
  const cleanAvailability = sanitizeReactionAvailability(merged) ?? { predicate: 'always' as ReactionAvailabilityPredicate }
  const pools = normalizeStagePools(cleanAvailability.stagePools)
  return {
    availability: cleanAvailability,
    stagePool: pools?.length === 1 ? pools[0] : 'all',
  }
}

/** Display settings never replace the entry, mechanics, associations or CR annotation. */
export function entryDisplayPatch(
  field: string,
  value: unknown
): Partial<Pick<MonsterAction, 'stagePool' | 'customPreamble'> & Pick<MonsterReaction, 'availability'>> {
  if (field === 'customPreamble') return typeof value === 'boolean' ? { customPreamble: value } : {}
  if (field === 'availability') {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return reactionAvailabilityPatch(undefined, value as Partial<ReactionAvailabilitySet>)
    }
    return {}
  }
  if (field !== 'stagePool') return {}
  if (value === 'all') return { stagePool: 'all' }
  if ((typeof value === 'number' || typeof value === 'string') && Number.isSafeInteger(Number(value)) && Number(value) > 0) return { stagePool: Number(value) }
  return {}
}
