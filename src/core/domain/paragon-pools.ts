/**
 * Paragon pool HP as the HP line shows it when no per-phase rows exist.
 * The editor stores `poolHp` as one entry per pool (number[]); older data may hold a single number.
 */
export type PoolDescription =
  | { kind: 'uniform'; count: number; hp: number }
  | { kind: 'list'; pools: { hp: number; label: string }[] }

export function describePools(poolCount: number, poolHp: unknown): PoolDescription | null {
  const raw: unknown[] = Array.isArray(poolHp)
    ? poolHp
    : typeof poolHp === 'number' && poolCount > 0 ? Array<number>(poolCount).fill(poolHp) : []
  // Labels keep the stored position, so dropping an invalid entry never renumbers the others.
  const pools = raw
    .map((hp, idx) => ({ hp: Number(hp), label: `Pool ${idx + 1}` }))
    .filter((p) => Number.isFinite(p.hp) && p.hp > 0)
  if (pools.length === 0) return null
  const first = pools[0].hp
  if (pools.length === raw.length && pools.every((p) => p.hp === first)) {
    return { kind: 'uniform', count: pools.length, hp: first }
  }
  return { kind: 'list', pools }
}
