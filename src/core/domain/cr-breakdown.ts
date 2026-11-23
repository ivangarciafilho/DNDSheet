export interface CrBreakdownInput {
  name: string
  finalCr: string
  offensiveCr: string
  defensiveCr: string
  dpr: number
  maxAttack: string
  maxDc: number
  avgHp: number
  ac: number
}

export interface CrBreakdownSummary {
  title: string
  offensiveLine: string
  defensiveLine: string
  markdown: string
}

/**
 * Builds a deterministic single-block CR math provenance summary for clipboard
 * export without altering rendered stat blocks.
 */
export function buildCrBreakdownSummary(input: CrBreakdownInput): CrBreakdownSummary {
  const title = `${input.name || 'Monster'} — CR ${input.finalCr}`
  const offensiveLine = `Offensive CR ${input.offensiveCr}: DPR ${Math.floor(input.dpr)} | Max Attack ${input.maxAttack} | Save DC ${input.maxDc}`
  const defensiveLine = `Defensive CR ${input.defensiveCr}: Avg HP ${Math.floor(input.avgHp)} | AC ${input.ac}`
  return {
    title,
    offensiveLine,
    defensiveLine,
    markdown: `${title}\n- ${offensiveLine}\n- ${defensiveLine}`,
  }
}
