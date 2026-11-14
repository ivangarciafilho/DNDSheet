import { CR, getCrByNumber, getCrByString, type CrTier } from '../domain/cr-tables.ts'
import { assertRevisionFresh, isStaleRevision } from '../domain/document-envelope.ts'
import { bindingSource } from '../domain/formula.ts'
import { characterProficiency, renderBonus, statModifier } from '../domain/math-utils.ts'
import { resolveMonsterBindings } from '../domain/monster-bindings.ts'
import type { DndStat, Monster } from '../domain/types.ts'
import { calculateCr, type CrEvaluationResult } from './CalculateCr.ts'

export interface AutoTuneRecommendation {
  id: string
  category: 'DEFENSE' | 'OFFENSE' | 'PROFICIENCY' | 'STATS'
  field: string
  fieldPath?: string
  currentValue: string | number
  recommendedValue: string | number
  explanation: string
  sourceBacked?: boolean
  boundPath?: string
  advisoryOnly?: boolean
}

export interface AutoTunePlan {
  sourceRevision?: number
  originalCr: string
  targetCr: string
  projectedCr: string
  currentEvaluation: CrEvaluationResult
  projectedEvaluation: CrEvaluationResult
  targetTier: CrTier
  recommendations: AutoTuneRecommendation[]
  selectedIds: string[]
  bindingWarnings: string[]
  tunedMonster: Monster
}

export interface AutoTuneOptions {
  preserveAbilityScores?: boolean
  scaleAttacksProportionally?: boolean
  selectedIds?: string[]
  sourceRevision?: number
}

export interface AutoTuneSession {
  sourceRevision: number
  currentRevision: number
  stale: boolean
  plan: AutoTunePlan
}

const STAT_KEYS: readonly DndStat[] = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA']

function resolveTargetTier(targetCrInput: string | number): CrTier {
  let targetTier: CrTier | undefined
  if (typeof targetCrInput === 'number') {
    targetTier = CR[targetCrInput] || getCrByNumber(targetCrInput)
  } else {
    targetTier = getCrByString(targetCrInput)
  }
  return targetTier || CR[0]
}

function referencedFormulaStats(formula: string): DndStat[] {
  const found: DndStat[] = []
  for (const stat of STAT_KEYS) {
    const pattern = new RegExp(`\\b${stat}(?:_MOD)?\\b`, 'i')
    if (pattern.test(formula)) found.push(stat)
  }
  return found
}

function clampStat(score: number): number {
  return Math.max(1, Math.min(30, Math.round(score)))
}

export function generateAutoTunePlan(
  monster: Monster,
  targetCrInput: string | number,
  options: AutoTuneOptions = {}
): AutoTunePlan {
  const targetTier = resolveTargetTier(targetCrInput)
  const currentEval = calculateCr(monster)
  const recommendations: AutoTuneRecommendation[] = []
  const bindingWarnings: string[] = []
  const bindings = monster.bindings || {}
  const allowSelection = (id: string) => !options.selectedIds || options.selectedIds.includes(id)

  const tuned: Monster = JSON.parse(JSON.stringify(monster))
  tuned.CR = targetTier.index

  // 1. Proficiency Bonus Tuning (source-first: skip when character HD or binding owns proficiency)
  const profBinding = bindings['proficiency']
  if (profBinding) {
    bindingWarnings.push(
      `proficiency is formula-bound (${bindingSource(profBinding)}); preserved binding instead of overwriting.`
    )
  } else if (monster.proficiencyScale !== 'character' && monster.proficiency !== targetTier.proficiency) {
    recommendations.push({
      id: 'proficiency',
      category: 'PROFICIENCY',
      field: 'proficiency',
      fieldPath: 'proficiency',
      currentValue: monster.proficiency,
      recommendedValue: targetTier.proficiency,
      explanation: `Set Proficiency Bonus to +${targetTier.proficiency} for CR ${targetTier.cr}.`,
    })
    if (allowSelection('proficiency')) {
      tuned.proficiency = targetTier.proficiency
    }
  }

  // 2. Armor Class (AC) Tuning (source-first if AC has a formula binding referencing an unbound stat)
  const targetAc = targetTier.ac
  const acBinding = bindings['AC']
  const acFormula = bindingSource(acBinding)
  const mutatedStats = new Set<DndStat>()
  if (acBinding) {
    const refs = referencedFormulaStats(acFormula)
    const unboundStat = refs.find((stat) => !bindings[`stats.${stat}`])
    const currentAcDelta = targetAc - monster.AC
    if (currentAcDelta !== 0 && unboundStat && !options.preserveAbilityScores) {
      const currentScore = monster.stats[unboundStat] ?? 10
      const desiredScore = clampStat(currentScore + currentAcDelta * 2)
      if (desiredScore !== currentScore) {
        const id = `stats.${unboundStat}`
        recommendations.push({
          id,
          category: 'STATS',
          field: id,
          fieldPath: id,
          sourceBacked: true,
          boundPath: 'AC',
          currentValue: `${currentScore} (bound AC ${monster.AC})`,
          recommendedValue: `${desiredScore} (drives AC -> ${targetAc})`,
          explanation: `AC is formula-bound (${acFormula}). Tune source stats.${unboundStat} instead of overwriting AC.`,
        })
        if (allowSelection(id)) {
          tuned.stats[unboundStat] = desiredScore
          mutatedStats.add(unboundStat)
        }
      }
    } else if (monster.AC !== targetAc) {
      bindingWarnings.push(
        `AC is formula-bound (${acFormula}); preserved binding without directly overwriting AC.`
      )
      recommendations.push({
        id: 'AC.bound',
        category: 'DEFENSE',
        field: 'AC',
        fieldPath: 'AC',
        boundPath: 'AC',
        advisoryOnly: true,
        currentValue: monster.AC,
        recommendedValue: targetAc,
        explanation: `AC is driven by binding (${acFormula}). Adjust the formula or unbind AC to set ${targetAc} directly.`,
      })
    }
  } else if (monster.AC !== targetAc) {
    recommendations.push({
      id: 'AC',
      category: 'DEFENSE',
      field: 'AC',
      fieldPath: 'AC',
      currentValue: monster.AC,
      recommendedValue: targetAc,
      explanation: `Adjust AC from ${monster.AC} to ${targetAc} to align with target defensive CR.`,
    })
    if (allowSelection('AC')) {
      tuned.AC = targetAc
    }
  }

  // 3. Hit Points & Hit Dice Tuning
  const hdBinding = bindings['HP.HD']
  const targetMidHp = Math.round((targetTier.hpMin + targetTier.hpMax) / 2)
  const conMod = statModifier(tuned.stats.CON)
  const dieSize = monster.HP.type || 8
  const avgPerDie = (dieSize + 1) / 2
  const effectivePerDie = Math.max(0.5, avgPerDie + conMod)
  const recommendedHd = Math.max(1, Math.round(targetMidHp / effectivePerDie))

  if (hdBinding) {
    bindingWarnings.push(
      `HP.HD is formula-bound (${bindingSource(hdBinding)}); preserved Hit Dice binding.`
    )
  } else if (monster.HP.HD !== recommendedHd) {
    recommendations.push({
      id: 'HP.HD',
      category: 'DEFENSE',
      field: 'HP.HD',
      fieldPath: 'HP.HD',
      sourceBacked: !monster.hpModifierOverride && !bindings['HP.modifier'],
      currentValue: monster.HP.HD,
      recommendedValue: recommendedHd,
      explanation: `Scale Hit Dice from ${monster.HP.HD}d${dieSize} to ${recommendedHd}d${dieSize} (approx. ${Math.round(recommendedHd * effectivePerDie)} HP) to match target CR HP range (${targetTier.hpMin}–${targetTier.hpMax}).`,
    })
    if (allowSelection('HP.HD')) {
      tuned.HP.HD = recommendedHd
      if (!monster.hpModifierOverride && !bindings['HP.modifier']) {
        tuned.HP.modifier = recommendedHd * conMod
      }
    }
  }

  if (tuned.proficiencyScale === 'character' && !tuned.proficiencyOverride && !profBinding) {
    tuned.proficiency = characterProficiency(tuned.HP.HD)
  }

  // 4. Offensive Tuning: Damage Per Round (DPR) Scaling (respecting attack damage count bindings)
  const targetMidDpr = Math.max(1, (targetTier.dprMin + targetTier.dprMax) / 2)
  const currentDpr = Math.max(1, currentEval.damagePerRound)
  const dprRatio = targetMidDpr / currentDpr

  if (Math.abs(dprRatio - 1) > 0.15 && tuned.attacks && tuned.attacks.length > 0) {
    const unboundAttacks = tuned.attacks.filter(
      (atk) => !bindings[`attacks[id=${encodeURIComponent(atk.id)}].damage.count`]
    )
    if (unboundAttacks.length === 0) {
      bindingWarnings.push('Attack damage dice counts are formula-bound; skipped direct attack dice overwrite.')
    } else {
      recommendations.push({
        id: 'attacks.damage',
        category: 'OFFENSE',
        field: 'attacks.damage',
        fieldPath: 'attacks',
        currentValue: `${Math.round(currentDpr)} DPR`,
        recommendedValue: `${Math.round(targetMidDpr)} DPR`,
        explanation: `Scale primary attack damage by ~${dprRatio.toFixed(2)}x to target CR ${targetTier.cr} DPR range (${targetTier.dprMin}–${targetTier.dprMax}).`,
      })

      if (options.scaleAttacksProportionally !== false && allowSelection('attacks.damage')) {
        for (const atk of unboundAttacks) {
          if (atk.damage && atk.damage.count > 0) {
            atk.damage.count = Math.max(1, Math.round(atk.damage.count * dprRatio))
          }
        }
      }
    }
  }

  // 5. Source-First Attack Bonus Alignment via Underlying Ability Score
  const targetAttack = targetTier.attack
  if (tuned.attacks && tuned.attacks.length > 0 && !options.preserveAbilityScores) {
    const primaryAtk = tuned.attacks[0]
    const overrideBinding = bindings[`attacks[id=${encodeURIComponent(primaryAtk.id)}].modifier.overrideValue`]
    if (primaryAtk.modifier?.override && overrideBinding) {
      bindingWarnings.push(
        `${primaryAtk.name} attack override is formula-bound (${bindingSource(overrideBinding)}); skipped direct override.`
      )
    } else if (!primaryAtk.modifier?.override) {
      const statKey = primaryAtk.modifier?.stat || 'STR'
      const statPath = `stats.${statKey}`
      const profBonus = primaryAtk.modifier?.proficient ? tuned.proficiency : 0
      const currentAtkMod = statModifier(tuned.stats[statKey]) + profBonus

      if (currentAtkMod !== targetAttack && !bindings[statPath] && !mutatedStats.has(statKey)) {
        const desiredStatMod = targetAttack - profBonus
        const targetStatScore = clampStat(10 + desiredStatMod * 2)
        const resultingAtkMod = statModifier(targetStatScore) + profBonus
        if (tuned.stats[statKey] !== targetStatScore) {
          recommendations.push({
            id: statPath,
            category: 'STATS',
            field: statPath,
            fieldPath: statPath,
            sourceBacked: true,
            currentValue: `${tuned.stats[statKey]} (${renderBonus(currentAtkMod)} to hit)`,
            recommendedValue: `${targetStatScore} (${renderBonus(resultingAtkMod)} to hit)`,
            explanation: `Adjust ${statKey} (${tuned.stats[statKey]} -> ${targetStatScore}) so ${primaryAtk.name} aligns with CR ${targetTier.cr} expected attack bonus (${renderBonus(targetAttack)}).`,
          })
          if (allowSelection(statPath)) {
            tuned.stats[statKey] = targetStatScore
            if (statKey === 'CON' && !tuned.hpModifierOverride && !bindings['HP.modifier']) {
              tuned.HP.modifier = tuned.HP.HD * statModifier(targetStatScore)
            }
          }
        }
      }
    }
  }

  // Re-evaluate bindings cleanly on the previewed monster so bound values stay consistent.
  const bindingRes = resolveMonsterBindings(tuned)
  const finalizedMonster = bindingRes.changed ? bindingRes.model : tuned
  const projectedEvaluation = calculateCr(finalizedMonster)
  const effectiveSelected = recommendations
    .filter((rec) => !rec.advisoryOnly && allowSelection(rec.id))
    .map((rec) => rec.id)

  return {
    sourceRevision: options.sourceRevision,
    originalCr: currentEval.estimatedCr.cr,
    targetCr: targetTier.cr,
    projectedCr: projectedEvaluation.estimatedCr.cr,
    currentEvaluation: currentEval,
    projectedEvaluation,
    targetTier,
    recommendations,
    selectedIds: effectiveSelected,
    bindingWarnings,
    tunedMonster: finalizedMonster,
  }
}

export function createAutoTuneSession(
  monster: Monster,
  targetCrInput: string | number,
  sourceRevision: number,
  options: AutoTuneOptions = {}
): AutoTuneSession {
  const plan = generateAutoTunePlan(monster, targetCrInput, {
    ...options,
    sourceRevision,
  })
  return {
    sourceRevision,
    currentRevision: sourceRevision,
    stale: false,
    plan,
  }
}

export function markAutoTuneSessionStale(
  session: AutoTuneSession,
  nextRevision: number
): AutoTuneSession {
  const stale = isStaleRevision(session.sourceRevision, nextRevision)
  if (!stale) return session
  return {
    ...session,
    currentRevision: nextRevision,
    stale: true,
  }
}

export function applyAutoTuneSession(
  session: AutoTuneSession,
  currentRevision: number,
  commitFn: (tunedMonster: Monster) => number
): { nextRevision: number; appliedCount: number } {
  assertRevisionFresh(session.sourceRevision, currentRevision, 'auto-tune')
  const appliedCount = session.plan.selectedIds.length
  const nextRevision = commitFn(session.plan.tunedMonster)
  return { nextRevision, appliedCount }
}
