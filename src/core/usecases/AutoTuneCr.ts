import { CR, getCrByNumber, getCrByString, type CrTier } from '../domain/cr-tables.ts'
import { characterProficiency, renderBonus, statModifier } from '../domain/math-utils.ts'
import type { Monster } from '../domain/types.ts'
import { calculateCr } from './CalculateCr.ts'

export interface AutoTuneRecommendation {
  category: 'DEFENSE' | 'OFFENSE' | 'PROFICIENCY' | 'STATS'
  field: string
  currentValue: string | number
  recommendedValue: string | number
  explanation: string
}

export interface AutoTunePlan {
  originalCr: string
  targetCr: string
  targetTier: CrTier
  recommendations: AutoTuneRecommendation[]
  tunedMonster: Monster
}

export interface AutoTuneOptions {
  preserveAbilityScores?: boolean
  scaleAttacksProportionally?: boolean
}

export function generateAutoTunePlan(
  monster: Monster,
  targetCrInput: string | number,
  options: AutoTuneOptions = {}
): AutoTunePlan {
  // 1. Resolve target CR tier
  let targetTier: CrTier | undefined
  if (typeof targetCrInput === 'number') {
    targetTier = CR[targetCrInput] || getCrByNumber(targetCrInput)
  } else {
    targetTier = getCrByString(targetCrInput)
  }

  if (!targetTier) {
    targetTier = CR[0]
  }

  const currentEval = calculateCr(monster)
  const recommendations: AutoTuneRecommendation[] = []

  // Deep clone monster for tuning
  const tuned: Monster = JSON.parse(JSON.stringify(monster))
  tuned.CR = targetTier.index

  // 2. Proficiency Bonus Tuning
  if (monster.proficiencyScale !== 'character' && monster.proficiency !== targetTier.proficiency) {
    recommendations.push({
      category: 'PROFICIENCY',
      field: 'proficiency',
      currentValue: monster.proficiency,
      recommendedValue: targetTier.proficiency,
      explanation: `Set Proficiency Bonus to +${targetTier.proficiency} for CR ${targetTier.cr}.`,
    })
    tuned.proficiency = targetTier.proficiency
  }

  // 3. Armor Class (AC) Tuning
  const targetAc = targetTier.ac
  if (monster.AC !== targetAc) {
    recommendations.push({
      category: 'DEFENSE',
      field: 'AC',
      currentValue: monster.AC,
      recommendedValue: targetAc,
      explanation: `Adjust AC from ${monster.AC} to ${targetAc} to align with target defensive CR.`,
    })
    tuned.AC = targetAc
  }

  // 4. Hit Points & Hit Dice Tuning
  const targetMidHp = Math.round((targetTier.hpMin + targetTier.hpMax) / 2)
  const conMod = statModifier(monster.stats.CON)
  const dieSize = monster.HP.type || 8
  const avgPerDie = (dieSize + 1) / 2

  // Formula: targetHP = HD * avgPerDie + (HD * conMod) = HD * (avgPerDie + conMod)
  // Therefore: HD = targetHP / max(1, avgPerDie + conMod)
  const effectivePerDie = Math.max(0.5, avgPerDie + conMod)
  const recommendedHd = Math.max(1, Math.round(targetMidHp / effectivePerDie))
  const newHpModifier = recommendedHd * conMod

  if (monster.HP.HD !== recommendedHd) {
    recommendations.push({
      category: 'DEFENSE',
      field: 'HP.HD',
      currentValue: monster.HP.HD,
      recommendedValue: recommendedHd,
      explanation: `Scale Hit Dice from ${monster.HP.HD}d${dieSize} to ${recommendedHd}d${dieSize} (approx. ${Math.round(recommendedHd * effectivePerDie)} HP) to match target CR HP range (${targetTier.hpMin}–${targetTier.hpMax}).`,
    })
    tuned.HP.HD = recommendedHd
    tuned.HP.modifier = newHpModifier
  }

  if (tuned.proficiencyScale === 'character' && !tuned.proficiencyOverride) tuned.proficiency = characterProficiency(tuned.HP.HD)

  // 5. Offensive Tuning: Damage Per Round (DPR) Scaling
  const targetMidDpr = Math.max(1, (targetTier.dprMin + targetTier.dprMax) / 2)
  const currentDpr = Math.max(1, currentEval.damagePerRound)
  const dprRatio = targetMidDpr / currentDpr

  if (Math.abs(dprRatio - 1) > 0.15 && tuned.attacks && tuned.attacks.length > 0) {
    recommendations.push({
      category: 'OFFENSE',
      field: 'attacks.damage',
      currentValue: `${Math.round(currentDpr)} DPR`,
      recommendedValue: `${Math.round(targetMidDpr)} DPR`,
      explanation: `Scale primary attack damage by ~${dprRatio.toFixed(2)}x to target CR ${targetTier.cr} DPR range (${targetTier.dprMin}–${targetTier.dprMax}).`,
    })

    if (options.scaleAttacksProportionally !== false) {
      for (const atk of tuned.attacks) {
        if (atk.damage && atk.damage.count > 0) {
          const newCount = Math.max(1, Math.round(atk.damage.count * dprRatio))
          atk.damage.count = newCount
        }
      }
    }
  }

  // 6. Attack Bonus Alignment
  const targetAttack = targetTier.attack
  if (tuned.attacks && tuned.attacks.length > 0) {
    const primaryAtk = tuned.attacks[0]
    const currentAtkMod =
      statModifier(tuned.stats[primaryAtk.modifier.stat]) +
      (primaryAtk.modifier.proficient ? tuned.proficiency : 0)

    if (currentAtkMod !== targetAttack && !options.preserveAbilityScores) {
      recommendations.push({
        category: 'OFFENSE',
        field: 'attacks.toHit',
        currentValue: renderBonus(currentAtkMod),
        recommendedValue: renderBonus(targetAttack),
        explanation: `Expected attack bonus for CR ${targetTier.cr} is ${renderBonus(targetAttack)} (current is ${renderBonus(currentAtkMod)}).`,
      })
    }
  }


  return {
    originalCr: currentEval.estimatedCr.cr,
    targetCr: targetTier.cr,
    targetTier,
    recommendations,
    tunedMonster: tuned,
  }
}
