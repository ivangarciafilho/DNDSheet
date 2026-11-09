/**
 * DNDSheet - Modular Hit Points & Defense Survival Compositor Engine
 *
 * Implements 28 permutable clause chaining patterns for Hit Points:
 * - 0 HP revival triggers (at end of turn, by non-radiant/necrotic or non-critical)
 * - Save triggers (Make a Constitution Save DC 5 + damage taken, On Success / On Failure)
 * - Death Throes / Explosions (Creatures Xft takes damage, Allies Xft regains HP)
 * - Multi-target death explosions (Allies regain, Enemies take damage)
 * - While Bloodied auras (Enemies within Xft takes damage)
 * - Start-of-turn Temp HP with on-break retaliation (Knocks prone, force damage)
 * - Ally healing/temp HP sharing (Once per round, regains damage taken / 1d8 / half)
 * - Revival after days, rounds to stabilize
 * - Healing multipliers (Regains double the hit points)
 * - Damage Threshold (DT) disruptions (Stunned / Paralyzed on damage / specific damage type)
 * - Telepathic & Grappled damage sharing / feedback
 */

export type HpTriggerEvent =
  | 'when_reduced_to_0'
  | 'when_destroyed'
  | 'at_end_of_turn_0hp'
  | 'while_bloodied'
  | 'start_of_turn'
  | 'when_stabilized'

export interface HpSurvivalRule {
  type:
    | 'revival'
    | 'save_revival'
    | 'death_burst'
    | 'multi_death_burst'
    | 'bloodied_aura'
    | 'temp_hp_retaliation'
    | 'ally_damage_sharing'
    | 'stabilization'
    | 'healing_multiplier'
    | 'damage_threshold'
    | 'telepathic_damage'
    | 'grappled_damage'
    | 'custom'
  // Revival / 0 HP parameters
  trigger?: HpTriggerEvent
  exceptions?: string[] // e.g. ['non radiant', 'non Critical Hit']
  returnHp?: number | string
  timeframe?: string // e.g. 'within 1d4 days', 'at end of turn'
  // Save parameters
  saveStat?: string // e.g. 'Constitution'
  saveDcFormula?: string // e.g. '5 + damage taken'
  onSuccessReturnHp?: number | string
  onFailureBurst?: {
    range: number
    target: string
    damage: string
    damageType: string
  }
  // Burst parameters
  burstRange?: number
  burstTarget?: string
  burstDamage?: string
  burstDamageType?: string
  burstHealAllies?: string
  burstEnemiesDamage?: string
  burstEnemiesType?: string
  // Bloodied Aura
  auraRange?: number
  auraTarget?: string
  auraDamage?: string
  auraDamageType?: string
  // Temp HP retaliation
  tempHpAmount?: number
  tempHpBreakDamage?: string
  tempHpBreakType?: string
  tempHpBreakRange?: number
  tempHpBreakProne?: boolean
  // Ally damage sharing
  allyRange?: number
  allyBenefit?: string // e.g. 'regains damage taken', 'regains 1d8', 'regains half of the damage taken', 'gains half of the damage taken as temporary hit points', 'gains 1d8 of temporary hit points'
  allyCadence?: string // e.g. 'Once per round'
  // Stabilization
  stabilizeHp?: number
  stabilizeRounds?: string
  // Damage Threshold
  dtAmount?: number
  dtCondition?: string // 'Stunned', 'Paralyzed'
  dtDamageType?: string // 'Lightning', 'Psychic'
  // Telepathic / Grappled
  telepathicTarget?: string // 'creatures', 'enemies'
  telepathicDamage?: string // 'Psychic taken', '1d8 Psychic'
  grappleRelation?: 'grappled_by_you' | 'grappled_or_grappling'
  grappledDamageFraction?: string // 'Half of damage taken'
  customText?: string
}

/**
 * Format an HP survival/defense rule into standard statblock syntax.
 */
export function formatHpSurvivalRule(rule: HpSurvivalRule): string {
  switch (rule.type) {
    case 'revival': {
      if (rule.trigger === 'at_end_of_turn_0hp') {
        const ret = rule.returnHp ?? 1
        return `At end of turn with 0 hit points, return to ${ret}`
      }
      if (rule.trigger === 'when_destroyed') {
        const tf = rule.timeframe || 'within 1d4 days'
        return `When destroyed, Returns to life ${tf}`
      }
      const exStr = rule.exceptions && rule.exceptions.length > 0
        ? ` by ${rule.exceptions.join(', or ')}`
        : ''
      const ret = rule.returnHp ?? 1
      return `When reduced to 0 hit points${exStr}, return to ${ret}`
    }

    case 'save_revival': {
      const exStr = rule.exceptions && rule.exceptions.length > 0
        ? ` by ${rule.exceptions.join(', or ')}`
        : ''
      const stat = rule.saveStat || 'Constitution'
      const dc = rule.saveDcFormula || '5 + damage taken'
      const ret = rule.onSuccessReturnHp ?? 1
      let base = `When reduced to 0 hit points${exStr}, Make a ${stat} Save DC ${dc}, On Success Return to ${ret}`
      if (rule.onFailureBurst) {
        const fb = rule.onFailureBurst
        base += `, On Failure ${fb.target} ${fb.range}ft of you takes ${fb.damage} of ${fb.damageType}`
      }
      return base
    }

    case 'death_burst': {
      const trig = rule.trigger === 'when_destroyed' ? 'When destroyed' : 'When reduced to 0 hit points'
      const target = rule.burstTarget || 'Creatures'
      const range = rule.burstRange || 20
      if (rule.burstHealAllies) {
        return `${trig}, ${target} ${range}ft of you Regains ${rule.burstHealAllies}`
      }
      const dmg = rule.burstDamage || '3d8'
      const type = rule.burstDamageType || 'Necrotic'
      return `${trig}, ${target} ${range}ft of you takes ${dmg} of ${type}`
    }

    case 'multi_death_burst': {
      const trig = rule.trigger === 'when_destroyed' ? 'When destroyed' : 'When reduced to 0 hit points'
      const allyRange = rule.burstRange || 5
      const heal = rule.burstHealAllies || '2d8'
      const enemyDmg = rule.burstEnemiesDamage || '3d8'
      const enemyType = rule.burstEnemiesType || 'Necrotic'
      return `${trig}, Allies ${allyRange}ft of you Regains ${heal}, enemies 20ft of you takes ${enemyDmg} of ${enemyType}`
    }

    case 'bloodied_aura': {
      const target = rule.auraTarget || 'Enemies'
      const range = rule.auraRange || 10
      const dmg = rule.auraDamage || '5'
      const type = rule.auraDamageType || 'Psychic'
      return `While Bloodied, ${target} ${range}ft of you Takes ${dmg} of ${type}`
    }

    case 'temp_hp_retaliation': {
      const amt = rule.tempHpAmount ?? 20
      const range = rule.tempHpBreakRange ?? 10
      const dmg = rule.tempHpBreakDamage ?? '1d10'
      const type = rule.tempHpBreakType ?? 'Force'
      let clause = `${amt} Temporary Hit Points At start of turn, When Temporary Hit Points Reduced to 0, Creatures ${range}ft of you takes ${dmg} of ${type}`
      if (rule.tempHpBreakProne) {
        clause += ', and knocks Prone.'
      } else {
        clause += '.'
      }
      return clause
    }

    case 'ally_damage_sharing': {
      const cadence = rule.allyCadence ? `${rule.allyCadence} ` : ''
      const range = rule.allyRange ?? 10
      const benefit = rule.allyBenefit || 'regains damage taken'
      return `${cadence}Ally ${range}ft of you ${benefit}.`
    }

    case 'stabilization': {
      const hp = rule.stabilizeHp ?? 1
      const rounds = rule.stabilizeRounds || '1d4'
      return `When stabilized regains ${hp} hit point in ${rounds} of rounds.`
    }

    case 'healing_multiplier': {
      return 'Regains double the hit points.'
    }

    case 'damage_threshold': {
      const dt = rule.dtAmount ?? 10
      const cond = rule.dtCondition || 'Stunned'
      const typePrefix = rule.dtDamageType ? `${rule.dtDamageType} ` : ''
      return `${dt} of DT, ${cond} when ${typePrefix}damage higher than DT.`
    }

    case 'telepathic_damage': {
      const target = rule.telepathicTarget || 'creatures'
      const dmg = rule.telepathicDamage || 'Psychic taken'
      return `${target} which it communicates Telepathically takes ${dmg}.`
    }

    case 'grappled_damage': {
      const rel = rule.grappleRelation === 'grappled_or_grappling'
        ? 'Creatures Grappled by you or Grappling you'
        : 'Creatures Grappled by you'
      const frac = rule.grappledDamageFraction || 'Half of damage taken'
      return `${rel} takes ${frac}.`
    }

    case 'custom':
      return rule.customText?.trim() || ''

    default:
      return ''
  }
}

/**
 * Compose HP statblock string combining base HP and survival rules.
 * Example:
 * HP 112 (15d8+45), At end of turn with 0 hit points, return to 1
 */
export function composeHpSurvivalString(
  baseHpText: string,
  survivalRules: HpSurvivalRule[]
): string {
  if (!survivalRules || survivalRules.length === 0) return baseHpText
  const clauses = survivalRules.map(formatHpSurvivalRule).filter(Boolean)
  if (clauses.length === 0) return baseHpText
  return `${baseHpText}, ${clauses.join(', ')}`
}
