import type { DndStat } from './types.ts'

export interface VillainAction {
  id: string
  round: 1 | 2 | 3
  name: string
  description: string
  trigger?: string
}

export interface BloodiedAction {
  id: string
  name: string
  triggerType: 'immediate_reaction' | 'while_bloodied'
  trigger?: string
  resetOnHeal?: boolean
  description: string
}

export interface ReactiveAction {
  id: string
  name: string
  trigger: string
  description: string
  usesPerRound?: number
  cost?: number | string
}

export interface ComboAction {
  id: string
  name: string
  leadAction: string
  followUpAction: string
  followup?: string
  condition: string
  /** Legacy name for condition. */
  triggerCondition?: string
  description: string
}

export interface AnatomyPart {
  id: string
  name: string
  part?: string
  hp: number
  ac?: number
  threshold?: number
  breakEffect: string
  severEffect?: string
}

export interface RunehammerTrackEvent {
  id: string
  round: number | string
  name: string
  description: string
  effect?: string
}

export interface RunehammerTrack {
  enabled: boolean
  timerDie?: string
  die?: string
  currentCount?: number
  name?: string
  events: RunehammerTrackEvent[]
}

export interface InvulnerabilityConfig {
  enabled?: boolean
  rule: string
  conditions?: string[]
  nthAttack?: number
  attackRuleMode?: 'only_nth' | 'first_x_miss'
  saveStat?: string
  saveDc?: number
  alignmentFilter?: string
  damageTypesFilter?: string[]
  customRule?: string
  firstXCount?: number
  /** Legacy name for firstXCount. */
  attackCount?: number
  disruption?: string
  /** Legacy name for disruption. */
  disruptedBy?: string
  customDisruption?: string
  displayLocation?: 'ac' | 'hp'
  combiner?: 'and' | 'or'
  customLogic?: string
}

export interface ParagonPhaseConfig {
  id?: string
  name: string
  source: string
  override?: number | null
  hpOverride?: number | null
  diceFormula?: string
  initiativeBonus?: string | number
  isBloodied?: boolean
}

export interface ParagonConfig {
  enabled: boolean
  poolCount: number
  poolHp: number[]
  poolsCount?: number
  actionsPerTurn?: number
  separateHpPools?: boolean
  transitionEffect?: string
  initiativeStep?: string
  enrageNote?: string
  activePoolFilter?: string
  phaseName?: string
  bloodiedPerPhase?: number[]
  phaseConfigs?: ParagonPhaseConfig[]
}

export interface MonsterPortrait {
  url: string
  position: 'none' | 'left' | 'right' | 'top' | 'bottom'
  width?: number
  caption?: string
}

export interface MonsterExtendedHp {
  showBloodied?: boolean
  bloodiedSource?: string
  bloodiedValueSource?: string
  bloodiedOverride?: number | null
  bloodiedDice?: string
  bloodiedAtPhase?: string
  damageThresholdDisruption?: string
  damageReductionDisruption?: string
  invulnerability?: InvulnerabilityConfig
  damageThreshold?: number | null
  damageThresholdSource?: string
  damageThresholdDice?: string
  damageReduction?: number | null
  damageReductionSource?: string
  damageReductionDice?: string
  paragonPools?: number
  paragonPoolHp?: number | number[]
  tempHp?: {
    amount: number
    trigger: string
    damageType?: string
  }
  regeneration?: {
    enabled: boolean
    recoveryType?: string
    valueSource?: string
    amount: number
    timeframe?: string
    frequency?: string
    triggerCondition?: string
    diceFormula?: string
    disruptedByTypes?: string[]
    disruptedByNote?: string
    displayMode?: 'minimalist' | 'detailed' | 'both'
    disruptedBy?: string
    triggeredByDamageType?: string
    providesHpOrTempHp?: 'hp' | 'tempHp'
    conditionModifier?: string
    maxHpReductionUntil?: string
    styleMode?: 'concise' | 'natural'
  }
  deathPrevention?: {
    enabled: boolean
    name?: string
    disruptionMode?: 'return_hp' | 'hide_hp' | 'until_x_crits'
    hideHp?: boolean
    critCount?: number
    critHitsToKill?: number
    critHitThreshold?: number
    returnHpSource?: string
    returnHpAmount?: number
    returnHpValue?: number
    returnHpAbility?: DndStat
    returnHpDice?: string
    requiresSave?: boolean
    saveAbility?: string
    saveStat?: string
    saveDcMode?: 'flat' | '5_plus_damage'
    saveDc?: number
    dcRule?: string
    exceptions?: string[]
    customNote?: string
    displayMode?: 'minimalist' | 'detailed' | 'both'
    returnTimeframe?: 'none' | 'immediate' | 'at_end_of_turn' | 'start_of_next_turn' | string
    triggerCondition?: 'not_reduced_by' | 'death_save_success' | 'save_success' | 'bloodied' | 'upon_death_burst' | 'custom' | string
    uponDeathDealsDamage?: boolean
    deathBurstDamageSource?: string
    deathBurstDamageAmount?: number
    deathBurstDamageDice?: string
    deathBurstDamageType?: string
    deathBurstTargetFilter?: string
    deathBurstRange?: number
  }
}

export interface DetailedDamageModifier {
  id: string
  damageType: string
  category: 'resistance' | 'immunity' | 'vulnerability'
  nonmagicalOnly?: boolean
  silvered?: boolean
  adamantine?: boolean
  regainHp?: boolean
  advantageOnSaves?: boolean
  disadvantageOnSaves?: boolean
  conditionNote?: string
}

export interface ActionOrientedPassives {
  bonusActionSearch?: boolean
  bonusActionStudy?: boolean
  bonusActionHide?: boolean
  bonusActionInfluence?: boolean
  bonusActionTools?: boolean
  /** Explicit checkbox preference; absent preserves legacy placement or defaults to moving. */
  searchMoveToActionGroup?: boolean
  studyMoveToActionGroup?: boolean
  influenceMoveToActionGroup?: boolean
  hideMoveToActionGroup?: boolean
  toolsMoveToActionGroup?: boolean
  searchPlacement?: 'header' | 'action' | 'bonus_action' | 'legendary'
  studyPlacement?: 'header' | 'action' | 'bonus_action' | 'legendary'
  hidePlacement?: 'header' | 'action' | 'bonus_action' | 'legendary'
  influencePlacement?: 'header' | 'action' | 'bonus_action' | 'legendary'
  toolsPlacement?: 'header' | 'action' | 'bonus_action' | 'legendary'
  riders?: Record<string, string>
  conditions?: Record<string, string>
  search?: {
    perception?: boolean
    investigation?: boolean
    survival?: boolean
  }
  study?: {
    arcana?: boolean
    history?: boolean
    nature?: boolean
    religion?: boolean
  }
  hide?: {
    stealth?: boolean
    acrobatics?: boolean
    sleightOfHand?: boolean
  }
  influence?: {
    insight?: boolean
    persuasion?: boolean
    deception?: boolean
    intimidation?: boolean
    animalHandling?: boolean
  }
}
