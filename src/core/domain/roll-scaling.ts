import { evaluateFormula, type FormulaContext } from './formula.ts'
import type {
  AttackRollMode,
  RollScalingSource,
  RollScalingSpec,
  RollScalingTier,
} from './types.ts'

export interface RollScalingSourceContext {
  cr?: number
  crNumeric?: number
  hd?: number
  casterLevel?: number
  customValue?: number
  formulaContext?: FormulaContext
}

export interface ResolvedRollScaling {
  configured: boolean
  rollCount: number
  beamCount: number
  targetCount: number | string | undefined
  damageMultiplier: number
  source: RollScalingSource
  driverValue: number | undefined
  provenanceLabel: string
  tierUsed?: RollScalingTier
  rollMode: AttackRollMode
  rollCondition: string
  saveMode: AttackRollMode
  saveCondition: string
}

const isFinitePositiveInt = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 1

const resolveCountValue = (
  value: number | string | undefined,
  ctx?: FormulaContext,
): number | undefined => {
  if (isFinitePositiveInt(value)) return Math.floor(value)
  if (typeof value === 'string' && value.trim()) {
    const trimmed = value.trim()
    if (/^\d+$/.test(trimmed)) return Math.max(1, Number(trimmed))
    if (ctx) {
      const evalResult = evaluateFormula(trimmed, ctx)
      if (evalResult.ok && Number.isFinite(evalResult.value) && evalResult.value >= 1) {
        return Math.floor(evalResult.value)
      }
    }
  }
  return undefined
}

const normalizeMode = (mode: unknown): AttackRollMode =>
  mode === 'advantage' || mode === 'disadvantage' ? mode : 'normal'

export function hasRollScaling(spec?: RollScalingSpec | null): boolean {
  if (!spec || typeof spec !== 'object') return false
  return Boolean(
    spec.rollCount !== undefined ||
      spec.beamCount !== undefined ||
      spec.damageMultiplier !== undefined ||
      (spec.source && spec.source !== 'manual') ||
      (typeof spec.sourceLabel === 'string' && spec.sourceLabel.trim()) ||
      (Array.isArray(spec.tiers) && spec.tiers.length > 0) ||
      (spec.rollMode && spec.rollMode !== 'normal') ||
      (typeof spec.rollCondition === 'string' && spec.rollCondition.trim()) ||
      (spec.saveMode && spec.saveMode !== 'normal') ||
      (typeof spec.saveCondition === 'string' && spec.saveCondition.trim()),
  )
}

export function normalizeRollScaling(spec?: RollScalingSpec | null): RollScalingSpec | undefined {
  if (!hasRollScaling(spec)) return undefined
  const s = spec as RollScalingSpec
  const out: RollScalingSpec = {}

  const normNumOrStr = (val: unknown): number | string | undefined => {
    if (typeof val === 'number' && Number.isFinite(val) && val >= 1) return Math.floor(val)
    if (typeof val === 'string' && val.trim()) {
      const t = val.trim()
      return /^\d+$/.test(t) ? Math.max(1, Number(t)) : t
    }
    return undefined
  }

  const rollCount = normNumOrStr(s.rollCount)
  if (rollCount !== undefined) out.rollCount = rollCount

  const beamCount = normNumOrStr(s.beamCount)
  if (beamCount !== undefined) out.beamCount = beamCount

  const damageMultiplier = normNumOrStr(s.damageMultiplier)
  if (damageMultiplier !== undefined) out.damageMultiplier = damageMultiplier

  if (s.source && ['manual', 'cr', 'hd', 'level', 'custom'].includes(s.source)) {
    out.source = s.source
  }
  if (typeof s.sourceLabel === 'string' && s.sourceLabel.trim()) {
    out.sourceLabel = s.sourceLabel.trim()
  }
  if (Array.isArray(s.tiers) && s.tiers.length > 0) {
    const cleanTiers = s.tiers
      .filter((t) => t && typeof t === 'object' && typeof t.minTier === 'number' && Number.isFinite(t.minTier))
      .map((t) => {
        const tier: RollScalingTier = { minTier: Math.max(0, t.minTier) }
        if (isFinitePositiveInt(t.rollCount)) tier.rollCount = Math.floor(t.rollCount)
        if (isFinitePositiveInt(t.beamCount)) tier.beamCount = Math.floor(t.beamCount)
        if (isFinitePositiveInt(t.damageMultiplier)) tier.damageMultiplier = Math.floor(t.damageMultiplier)
        return tier
      })
      .sort((a, b) => a.minTier - b.minTier)
    if (cleanTiers.length > 0) out.tiers = cleanTiers
  }
  if (s.rollMode && s.rollMode !== 'normal') out.rollMode = normalizeMode(s.rollMode)
  if (typeof s.rollCondition === 'string' && s.rollCondition.trim()) out.rollCondition = s.rollCondition.trim()
  if (s.saveMode && s.saveMode !== 'normal') out.saveMode = normalizeMode(s.saveMode)
  if (typeof s.saveCondition === 'string' && s.saveCondition.trim()) out.saveCondition = s.saveCondition.trim()

  return hasRollScaling(out) ? out : undefined
}

const SOURCE_LABELS: Readonly<Record<RollScalingSource, string>> = {
  manual: 'Fixed count',
  cr: 'Challenge Rating (CR)',
  hd: 'Hit Dice (HD)',
  level: 'Caster / Character Level',
  custom: 'Custom source',
}

export function resolveRollScaling(
  context: RollScalingSourceContext = {},
  spec?: RollScalingSpec | null,
  legacy?: {
    attackCount?: number | string
    attackRollModifier?: 'advantage' | 'disadvantage' | 'none'
    attackException?: string
    targetCount?: number | string
  },
): ResolvedRollScaling {
  const configured = hasRollScaling(spec)
  const source: RollScalingSource = spec?.source || 'manual'
  const driverValue =
    source === 'cr'
      ? (context.crNumeric ?? context.cr)
      : source === 'hd'
      ? context.hd
      : source === 'level'
      ? context.casterLevel
      : source === 'custom'
      ? context.customValue
      : undefined

  let tierUsed: RollScalingTier | undefined
  if (Array.isArray(spec?.tiers) && spec.tiers.length > 0 && typeof driverValue === 'number' && Number.isFinite(driverValue)) {
    const sorted = [...spec.tiers].sort((a, b) => a.minTier - b.minTier)
    for (const tier of sorted) {
      if (driverValue >= tier.minTier) tierUsed = tier
    }
  }

  const explicitRoll = tierUsed?.rollCount ?? resolveCountValue(spec?.rollCount, context.formulaContext)
  const legacyRoll = resolveCountValue(legacy?.attackCount, context.formulaContext)
  const rollCount = explicitRoll ?? legacyRoll ?? 1

  const beamCount = tierUsed?.beamCount ?? resolveCountValue(spec?.beamCount, context.formulaContext) ?? 0
  const damageMultiplier = tierUsed?.damageMultiplier ?? resolveCountValue(spec?.damageMultiplier, context.formulaContext) ?? 1

  const rollMode = spec?.rollMode ? normalizeMode(spec.rollMode) : normalizeMode(legacy?.attackRollModifier)
  const rollCondition = (spec?.rollCondition ?? legacy?.attackException ?? '').trim()
  const saveMode = normalizeMode(spec?.saveMode)
  const saveCondition = (spec?.saveCondition ?? '').trim()

  const baseSourceLabel = SOURCE_LABELS[source]
  const provenanceLabel = spec?.sourceLabel?.trim()
    ? `${baseSourceLabel}: ${spec.sourceLabel.trim()}`
    : driverValue !== undefined
    ? `${baseSourceLabel} (${driverValue})`
    : baseSourceLabel

  return {
    configured,
    rollCount,
    beamCount,
    targetCount: legacy?.targetCount,
    damageMultiplier,
    source,
    driverValue,
    provenanceLabel,
    ...(tierUsed ? { tierUsed } : {}),
    rollMode,
    rollCondition,
    saveMode,
    saveCondition,
  }
}

export interface RollScalingPhrases {
  beamPhrase?: string
  multiplierPhrase?: string
  rollAdvantagePhrase?: string
  saveAdvantagePhrase?: string
  provenanceNote?: string
}

export function formatRollScalingPhrases(
  resolved: ResolvedRollScaling,
): RollScalingPhrases {
  if (!resolved.configured) return {}
  const out: RollScalingPhrases = {}
  if (resolved.beamCount > 1) {
    out.beamPhrase = `${resolved.beamCount} beams`
  } else if (resolved.beamCount === 1) {
    out.beamPhrase = '1 beam'
  }
  if (resolved.damageMultiplier > 1) {
    out.multiplierPhrase = `×${resolved.damageMultiplier} damage`
  }
  if (resolved.rollMode !== 'normal') {
    const cond = resolved.rollCondition ? ` (${resolved.rollCondition})` : ''
    out.rollAdvantagePhrase = `attack rolls have ${resolved.rollMode}${cond}`
  }
  if (resolved.saveMode !== 'normal') {
    const cond = resolved.saveCondition ? ` (${resolved.saveCondition})` : ''
    out.saveAdvantagePhrase = `saving throws have ${resolved.saveMode}${cond}`
  }
  if (resolved.source !== 'manual') {
    out.provenanceNote = `scaled by ${resolved.provenanceLabel}`
  }
  return out
}

export function rollScalingChipText(spec?: RollScalingSpec | null): string {
  if (!hasRollScaling(spec)) return ''
  const r = resolveRollScaling({}, spec)
  const parts: string[] = []
  if (spec?.rollCount !== undefined) parts.push(`${r.rollCount} roll${r.rollCount === 1 ? '' : 's'}`)
  if (r.beamCount > 0) parts.push(`${r.beamCount} beam${r.beamCount === 1 ? '' : 's'}`)
  if (r.damageMultiplier > 1) parts.push(`×${r.damageMultiplier} dmg`)
  if (r.source !== 'manual') parts.push(r.source.toUpperCase())
  if (r.rollMode !== 'normal') parts.push(`Roll ${r.rollMode === 'advantage' ? 'Adv' : 'Disadv'}`)
  if (r.saveMode !== 'normal') parts.push(`Save ${r.saveMode === 'advantage' ? 'Adv' : 'Disadv'}`)
  return parts.join(' · ')
}
