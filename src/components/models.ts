import type { AbilityOutcome, AbilityTargeting, AttackReach, AttackSource } from '../core/domain/types'

export interface MonsterSenseItem {
  id: string
  name: string
  range?: number
  rangeUnit?: 'ft' | 'miles'
  blindBeyond?: boolean
  acrossPlanes?: boolean
  echolocation?: boolean
  devilsSight?: boolean
  webSense?: boolean
  lifeSense?: boolean
  detectionMode?: 'presence' | 'location' | 'identity' | 'all'
  targetCreatureTypes?: string[]
  gatheredInfo?: string[]
  perceptionPrecision?: 'detailed' | 'comparative'
  observationRequirement?: 'immediate' | 'observing' | 'fighting' | 'both'
  observationMinutes?: number
  requiresStudyAction?: boolean
  lightImpairment?: 'none' | 'bright_light' | 'daylight' | 'dim_and_bright'
  senseSentienceMode?: 'none' | 'location_intelligent' | 'presence_intelligent' | 'telepathy_creatures'
  keenTypes?: ('hearing' | 'smell' | 'sight')[]
  sunlightSensitivity?: boolean
  note?: string
}


export type DefenseModifierMode = 'none' | 'advantage' | 'disadvantage' | 'absorbs'

export interface DamageDefenseItem {
  id: string
  type: string
  name?: string
  category?: 'damage' | 'condition'
  nonmagical?: boolean
  mode?: DefenseModifierMode
  absorbs?: boolean
  advantage?: boolean
  disadvantage?: boolean
  saveOutcome?: string
  acquiredCondition?: string
  conditionDuration?: string
  customCondition?: string
  triggeredBenefit?: string
  benefitTrigger?: string
  benefitDuration?: string
  trigger?: string
  duration?: string
  note?: string
}

export interface MonsterLanguageAnimalHandling {
  enabled?: boolean
  dc?: number
  peacefulOutcome?: string
  commandOutcome?: string
  recruitOutcome?: string
  customNotes?: string
}

export interface MonsterSpecialLanguageAnimals {
  understandsOnly?: boolean
  simpleConceptsOnly?: boolean
  beastsOnly?: boolean
  specificSubtype?: string
  note?: string
}

export interface MonsterSpecialLanguagePlants {
  understandsOnly?: boolean
  canQuestionPastDay?: boolean
  difficultTerrainNegotiation?: boolean
  note?: string
}

export interface MonsterSpecialLanguageUndead {
  commandMindless?: boolean
  understandsOnly?: boolean
  telepathicRange?: number
  note?: string
}

export interface MonsterSpecialLanguageDead {
  maxQuestions?: number
  corpseMustHaveMouth?: boolean
  answersCryptic?: boolean
  deadWithinYears?: string
  note?: string
}

export interface MonsterLanguageItem {
  id: string
  name: string
  understandsOnly?: boolean
  telepathy?: boolean
  telepathyRange?: number
  // Mutually exclusive radio options
  languageRequirement?: 'none' | 'must_understand' | 'must_share'
  creatureTarget?: 'all' | 'intelligent_only' | 'non_intelligent_only'
  creatureConcentrationFilter?: 'all' | 'concentrating_only' | 'concentration_check'
  // Split communication flow
  broadcast?: boolean
  noReply?: boolean
  simpleConceptsOnly?: boolean
  acrossPlanes?: boolean
  multiverseWide?: boolean

  // Special Sensory Traits
  sensesSentient?: boolean
  locatesSentient?: boolean
  telepathicEavesdrop?: boolean
  telepathicAwareness?: boolean

  // Probing
  learnDesires?: boolean
  readThoughts?: boolean
  senseEmotions?: boolean
  senseAlignment?: boolean
  senseIntentions?: boolean
  detectSincerity?: boolean
  accessMemories?: boolean

  // Sensory
  shareOwnSenses?: boolean
  probeCreatureSenses?: boolean

  // Dual Saving Throws: Probing vs Sensory
  probeRequiresSave?: boolean
  probeSaveType?: 'WIS' | 'INT' | 'CHA'
  probeSaveDc?: number
  probeSaveAwareness?: 'always_unaware' | 'unaware_on_fail' | 'aware'

  sensoryRequiresSave?: boolean
  sensorySaveType?: 'WIS' | 'INT' | 'CHA'
  sensorySaveDc?: number
  syncSaves?: boolean

  // Legacy Save fields
  requiresSave?: boolean
  saveType?: 'WIS' | 'INT' | 'CHA'
  saveDc?: number
  saveAwareness?: 'always_unaware' | 'unaware_on_fail'

  // Disruption & Initiation
  disruptedByPsychicDamage?: boolean
  triggerCondition?: string
  interceptMessages?: boolean
  senseTelepathicPresence?: boolean
  creatureMustSensePresence?: boolean
  concentration?: 'none' | 'monster_only' | 'creature_only' | 'both'
  concentrationMode?: 'none' | 'concentration_negates' | 'forced_concentration' | 'requires_concentration'

  // Special Languages Modules
  animalHandling?: MonsterLanguageAnimalHandling
  animalsConfig?: MonsterSpecialLanguageAnimals
  plantsConfig?: MonsterSpecialLanguagePlants
  undeadConfig?: MonsterSpecialLanguageUndead
  deadConfig?: MonsterSpecialLanguageDead

  // Backward compatibility legacy fields
  mustUnderstandAtLeastOne?: boolean
  mustShareLanguage?: boolean
  intelligentOnly?: boolean
  nonIntelligentOnly?: boolean
  broadcastNoReply?: boolean

  note?: string
}

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
  description: string
}

export interface ReactiveAction {
  id: string
  name: string
  trigger: string
  description: string
  usesPerRound?: number
}

export interface ComboAction {
  id: string
  name: string
  leadAction: string
  followUpAction: string
  condition: string
  description: string
}

export interface AnatomyPart {
  id: string
  name: string
  hp: number
  ac?: number
  threshold?: number
  breakEffect: string
}

export interface RunehammerTrackEvent {
  id: string
  round: number | string
  name: string
  description: string
}

export interface RunehammerTrack {
  enabled: boolean
  timerDie?: string
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
  disruption?: string
  customDisruption?: string
  displayLocation?: 'ac' | 'hp'
  combiner?: 'and' | 'or'
  customLogic?: string
}

export interface ParagonPhaseConfig {
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
  position: 'none' | 'left' | 'right'
  width?: number
  caption?: string
}

export interface MonsterExtendedHp {
  showBloodied?: boolean
  bloodiedSource?: string
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
    enabled?: boolean
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
    enabled?: boolean
    name?: string
    disruptionMode?: 'return_hp' | 'hide_hp' | 'until_x_crits'
    hideHp?: boolean
    critCount?: number
    critHitsToKill?: number
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
  }
}

import { DICE } from 'src/data/DICE'
import { SKILL } from 'src/data/SKILL'
import { v4 } from 'uuid'

export type DndStat = 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA'

// subtypes used in various parts of the monster
export interface DndDice {
  HD: number
  type: number
  modifier: number
}

export interface MonsterSave {
  proficient: boolean
  override: boolean
  overrideValue: number
  advantage?: boolean
  disadvantage?: boolean
  condition?: string
}

export interface MonsterSpeed {
  id: string
  type?: string // type can be nulled in the picker text entry
  speed: number
  note: string
  hover?: boolean
}

export interface MonsterSpeedTraversal {
  ignoresDifficultTerrain?: boolean
  bonusActionDash?: boolean
  bonusActionDodge?: boolean
  bonusActionDisengage?: boolean
  bonusActionSpeed?: number
  trackingSpeed?: number
  stealthSpeed?: number
  note?: string

  // Amorphous movement options
  amorphous1Inch?: boolean
  amorphousCannotEnterLiquids?: boolean
  moveThroughCreaturesDifficultTerrain?: boolean
  moveThroughCreaturesShunt?: boolean
  moveThroughCreaturesShuntDamage?: string
  shuntDestination?: 'nearest_unoccupied' | 'ethereal_plane'
  shuntDamageChoice?: string
  etherealJaunt?: 'none' | 'bonus_action' | 'action' | 'at_will'
  moveThroughCreaturesTwoSizesDifferent?: boolean

  // Aquatic / Breathing options
  aquaticBreathing?: 'none' | 'underwater' | 'amphibious' | 'water_only' | 'hold_breath'
  holdBreathDuration?: string

  // Movement Action Riders
  actionRiders?: Array<{
    id: string
    action: string
    actionType?: 'Action' | 'Bonus Action' | 'Reaction' | 'Free'
    rider: string
    trigger?: string
  }>
}

export interface MonsterAcConfig {
  enabled?: boolean
  baseMode?: 'flat' | '10' | 'armor' | 'ability' | string
  baseArmor?: string
  baseAbility?: DndStat
  abilityBonus?: 'none' | DndStat | 'level' | 'cr' | 'pb' | 'hd'
  defenseItem?: 'none' | 'shield' | 'animated_shield' | 'cloak_of_protection' | 'ring_of_protection' | 'defender' | 'bracers_of_defense' | 'custom'
  defenseItemCustomBonus?: number
  defenseItemCustomName?: string
  temporary?: 'none' | 'spell_shield' | 'spell_shield_of_faith' | 'parry_pb' | 'parry_custom'
  temporaryCustomBonus?: number
  conditional?: 'none' | 'all_attacks_beyond_first' | 'first_y_attacks'
  conditionalBonus?: number
  conditionalCount?: number
  conditionalTimeframe?: string
  customFormula?: string
  // Enhanced Defensive Mechanics & Permutable Invulnerability Integration (37 Mechanics)
  secondaryAc?: number
  conditionMode?: string
  conditionSecondaryBonus?: number
  customCondition?: string
  conditionDamageTypes?: string[]
  conditionCreatureTypes?: string[]
  conditionAttackTypes?: string[]
  saveStat?: string
  saveVerb?: 'must_succeed' | 'makes' | 'must_succeed_to_hit' | string
  saveDcSource?: 'spell_save_dc' | 'custom' | 'special_save_dc' | string
  saveDc?: number
  saveDcCustom?: number
  onSaveFailure?: string
  onSaveFailureDamageAmount?: number
  onSaveFailureDamageSource?: string
  onSaveFailureDamageDice?: string
  onSaveFailureDamageType?: string
  onSaveSuccess?: string
  onSaveSuccessDamageAmount?: number
  onSaveSuccessDamageSource?: string
  onSaveSuccessDamageDice?: string
  onSaveSuccessDamageType?: string
  reflectionMode?: 'none' | 'hit_another_target' | 'reflect_back_attacker'
  parryCount?: number
  movedDistance?: number
  // Decoupled On Miss & When Hit Logic
  onMiss?: 'none' | 'hits_attacker' | 'hits_target_range' | 'hits_target_feet' | 'damage_attacker' | 'knocks_prone'
  onMissDistance?: number
  onMissDamageAmount?: number
  onMissDamageType?: string
  onHit?: 'none' | 'damage_attacker' | 'knocks_prone' | 'retaliate_melee'
  onHitDamageAmount?: number
  onHitDamageType?: string
  // Dynamic Timeframes & Light Levels
  tookDamageType?: string
  tookDamageTimeframe?: string
  lightLevel?: string
}

export interface MonsterInitiativeConfig {
  proficient?: boolean
  secondaryStat?: DndStat | 'none'
  statMode?: 'add' | 'replace'
  advantage?: boolean
  disadvantage?: boolean
  cantBeSurprised?: boolean
  useLairInitiative?: boolean
  lairInitiative?: number
  specialTrigger?: string
  specialTriggerSpell?: string
  customEffectNote?: string
}

export interface MonsterToolProficiency {
  id: string
  name: string
  proficient: boolean
  expertise: boolean
  stat: DndStat
  override: boolean
  overrideValue: number
  advantage?: boolean
  disadvantage?: boolean
  condition?: string
  bonusAction?: boolean
}

export interface MonsterSkill {
  key: keyof typeof SKILL
  skill: {
    stat: DndStat
    label: string
  }
  proficient: boolean
  expertise: boolean
  override: boolean
  overrideValue: number
  /**
   * Conditional string value to display after the stat modifier. New in 2024.
   */
  conditional?: string
  condition?: string
  advantage?: boolean
  disadvantage?: boolean
  bonusAction?: boolean
}

export interface MonsterCrAnnotation {
  maxDamage: number
  maxSave: number
  maxModifier: number
  multitarget: boolean
  ehpMultiplier: number
  ehpModifier: number
  acModifier: number
  include: boolean
  automatic: boolean
}

export interface DndLimitedUse {
  count: number
  rate: string
}

export interface ActionDescriptionContainer {
  id: string
  kind: 'text' | 'table'
  outcomeTarget?: string
  text?: string
  table?: {
    headers: string[]
    rows: string[][]
  }
}

export interface MonsterTrait {
  name: string
  id: string
  description: string
  limitedUse: DndLimitedUse
  customPreamble: boolean
  crAnnotation: MonsterCrAnnotation
  rechargeSection?: string
  renderInRechargeSection?: boolean
  conditionalTrigger?: string
  isConditional?: boolean
  rechargeTiming?: string
  rechargeCount?: number
  rechargeTagOverride?: string
  stagePool?: number | 'all'
  descriptionContainers?: ActionDescriptionContainer[]
}

export interface ActionEffect {
  case: string
  effect: string
}

export interface MonsterAction {
  name: string
  id: string
  description: string
  recharge: string
  rechargeMin?: number
  rechargeMax?: number
  actionType?: string
  /** Weapon ability provenance; omitted/auto follows reach. Thrown denotes a thrown melee weapon. */
  weaponAttackAbility?: DndStat | 'auto' | 'finesse' | 'thrown' | 'finesse_thrown'
  attackBonus?: number
  targetsText?: string
  legendaryOnly: boolean
  limitedUse: DndLimitedUse
  stat: DndStat | 'none'
  save: {
    override: boolean
    overrideValue: number
  }
  range: string
  effects: ActionEffect[]
  customPreamble: boolean
  bonusAction: boolean
  stagePool?: number | string | 'all'
  crAnnotation: MonsterCrAnnotation
  // Compoundable Actions Architecture
  school?: string
  spellLevel?: string
  components?: string[]
  duration?: string
  areaShape?: string
  areaDistance?: string
  deliveryType?: 'Attack' | 'Save' | 'Aura' | 'Utility' | string
  /** Optional structured authoring; omitted legacy records retain their current output. */
  attackReach?: AttackReach
  attackSource?: AttackSource
  attackCount?: number | string
  attackRollModifier?: 'advantage' | 'disadvantage' | 'none'
  attackException?: string
  targeting?: AbilityTargeting
  outcomes?: AbilityOutcome[]
  outcomeLayout?: 'linear' | 'grid_1x2' | 'grid_2x1' | 'grid_2x2' | 'table'
  descriptionContainers?: ActionDescriptionContainer[]
}

export interface LairAction {
  id: string
  description: string
  crAnnotation: MonsterCrAnnotation
}

export interface DndSpell {
  name: string
  damage: number
  multitarget: boolean
  class: string[]
  level: number
  srd: boolean
  custom: boolean
}

export interface DndAtWillSpell {
  id: string
  count: number
  rate: string
  spells: string[]
}

export interface AdditionalAttackDamage {
  id: string
  dice: number
  count: number
  type: string
  note: string
}

export interface Multiattack {
  id: string
  attacks: string[]
  actions: string[]
}

export interface DndAttack {
  id: string
  name: string
  distance: 'MELEE' | 'RANGED' | 'BOTH'
  kind: 'WEAPON' | 'SPELL'
  modifier: {
    override: boolean
    overrideValue: number
    stat: DndStat
    proficient: boolean
  }
  range: {
    standard: number
    long: number
    reach: number
  }
  targets: number
  damage: {
    dice: number
    count: number
    modifier: {
      override: boolean
      overrideValue: number
      stat: DndStat
    }
    type: string
  }
  alternateDamage: {
    dice: number
    count: number
    modifier: {
      override: boolean
      overrideValue: number
      stat: DndStat
    }
    type: string
    condition: string
    active: boolean
  }
  additionalDamage: AdditionalAttackDamage[]
  save: number | undefined
  description: string
  legendaryOnly: boolean
  useCustomRenderer: boolean
  customRenderer: string
  stagePool?: string
}

export interface LegendaryAction {
  actionId: string
  cost: number
}

export interface MonsterReaction {
  name: string
  id: string
  description: string
  limitedUse: DndLimitedUse
  trigger: string
  stagePool?: number | string | 'all'
}

export interface CrAttackInfo {
  name: string
  damage: number
  toHit: number
  save: number | undefined
  type: 'Attack' | 'Multiattack' | 'Lair Action'
}

export interface CrActionInfo {
  name: string
  damage: number
  toHit: number
  save: number | undefined
  limited: boolean
  uses: number
  type: 'Action' | 'LimitedMultiattack'
}

export interface CrTraitInfo {
  name: string
  damage: number
  limited: boolean
  uses: number
  save: number
  toHit: number
  remove: boolean
  type: 'Trait'
}

export interface CrLegendaryInfo {
  name: string
  damage: number
  limited: boolean
  uses: number
  save: number | undefined
  toHit: number
  cost: number
  type: 'Legendary'
}

export interface CrSpellInfo {
  name: string
  damage: number
  save: number
  type: 'Spell'
}

export interface CrDamageInfo {
  attacks: CrAttackInfo[]
  actions: CrActionInfo[]
  legendary: CrLegendaryInfo[]
  traits: CrTraitInfo[]
  spells: CrSpellInfo[]
  lairActions: CrAttackInfo[]
  legendaryCount: number
}

// these arrays can be swapped with the SwapButtons component
export type SwappableField =
  | 'actions'
  | 'traits'
  | 'attacks'
  | 'reactions'
  | 'lairActions'
  | 'regionalEffects'
  | 'speeds'
  | 'skills'
  | 'tools'
  | 'languagesList'
  | 'resistancesList'
  | 'immunitiesList'
  | 'vulnerabilitiesList'
  | 'conditionsList'
  | 'villainActions'
  | 'bloodiedActions'
  | 'reactiveActions'
  | 'comboActions'
  | 'anatomyParts'

// the big one is the monster definition
export interface Monster {
  bindings?: Record<string, import('../core/domain/formula').NumericBinding>
  name: string
  nickname: string
  saveVersion: number
  useArticleInToken: boolean
  alphaTraits: boolean
  size: string
  type?: string
  alignment?: string
  languages: string
  AC: number
  ACType: string
  CR: number
  lairCr: number
  lairCrNote: string
  useCrDisplayOverride: boolean
  crOverride: string
  proficiency: number
  proficiencyOverride: boolean
  HP: DndDice
  hpModifierOverride: boolean
  hpDieTypeOverride: boolean
  stats: {
    STR: number
    DEX: number
    CON: number
    INT: number
    WIS: number
    CHA: number
  }
  saves: {
    STR: MonsterSave
    DEX: MonsterSave
    CON: MonsterSave
    INT: MonsterSave
    WIS: MonsterSave
    CHA: MonsterSave
  }
  speeds: MonsterSpeed[]
  skills: MonsterSkill[]
  resistances: string[]
  immunities: string[]
  vulnerabilities: string[]
  conditions: string[]
  senses: {
    blindsight: number
    darkvision: number
    tremorsense: number
    truesight: number
  }
  sensesNotes: string
  /** A11.9 declarative random-outcome tables. */
  randomTables?: import('src/core/domain/random-table').RandomTable[]
  passivePerception: {
    override: boolean
    overrideValue: number | null
  }
  traits: MonsterTrait[]
  spellcasting: {
    stat: DndStat
    save: {
      override: boolean
      overrideValue: number
    }
    modifier: {
      override: boolean
      overrideValue: number
    }
    attack: {
      override: boolean
      overrideValue: number
    }
    class: string | undefined
    subclass?: string
    level: number
    slots: number[]
    atWill: DndAtWillSpell[]
    standard: string[]
    notes: string
    atWillNotes: string
    useCustomClassPreamble: boolean
    customClassPreamble: string
    useCustomInnatePreamble: boolean
    customInnatePreamble: string
    multiclass?: {
      enabled: boolean
      secondaryClass: string
      secondaryLevel: number
      secondaryStat: DndStat
      secondarySaveDc?: number
      secondarySpellAttack?: number
    }
    resourceType?: 'slots' | 'points' | 'focus' | 'pact'
    refreshRate?: 'long_rest' | 'short_rest' | 'downtime'
    displayTitleMode?: 'class_names' | 'caster_source' | 'split_levels'
    bypassSlotLevelFilter?: boolean
    splitHighCadence?: boolean
    restrictedCadences?: string[]
    spellCadenceMap?: Record<string, string>
    levelCadenceMap?: Record<number, string>
    bonusActionLevelMap?: Record<number, boolean>
    metamagic?: {
      enabled: boolean
      sorceryPoints: number
      refreshRate: string
      options: string[]
    }
    cantripSwitch?: boolean
    cantripSwitchCount?: number
    cantripSwitchInterval?: string
    preparedCountOverride?: number
    preparedInterval?: string
    customRefreshRate?: string
    classes?: Array<{
      id: string
      className: string
      subclass?: string
      level: number
      stat: DndStat
      slots?: number[]
      bypassSlotFilter?: boolean
      spells?: string[]
      levelCadences?: Record<number, string>
      levelBonusAction?: Record<number, boolean>
      spellCadenceMap?: Record<string, string>
      actionType?: 'Action' | 'Bonus Action'
      resourceType?: 'slots' | 'pact' | 'points' | 'focus' | 'at_will'
    }>
  }
  attacks: DndAttack[]
  actions: MonsterAction[]
  multiattacks: Multiattack[]
  multiattackOptions: {
    useCustomRenderer: boolean
    customMultiattackRenderer: string
    postscript: string
  }
  legendaryActions: {
    count: number
    actions: LegendaryAction[]
    useCustomPreamble: boolean
    customPreamble: string
  }
  mythicActions: {
    triggerName: string
    triggerRecharge: string
    triggerDescription: string
    preamble: string
    actions: LegendaryAction[]
  }
  reactions: MonsterReaction[]
  useCustomLairActionPreamble: boolean
  lairActionPreamble: string
  lairActions: LairAction[]
  regionalEffects: { id: string; description: string }[]
  regionalEffectDescription: string
  inventory: string
  autoEstimateDefenseCr: boolean
  acConfig?: MonsterAcConfig
  portrait?: MonsterPortrait
  extendedHp?: MonsterExtendedHp
  detailedDamageModifiers?: DetailedDamageModifier[]
  actionOrientedPassives?: ActionOrientedPassives
  vulnerabilitiesList?: DamageDefenseItem[]
  conditionVulnerabilitiesList?: DamageDefenseItem[]
  resistancesList?: DamageDefenseItem[]
  conditionResistancesList?: DamageDefenseItem[]
  immunitiesList?: DamageDefenseItem[]
  conditionsList?: DamageDefenseItem[]
  languagesList?: MonsterLanguageItem[]
  specialCommunicationArchetype?: 'none' | 'firbolg' | 'monk'
  tools?: MonsterToolProficiency[]
  initiativeConfig?: MonsterInitiativeConfig
  speedTraversal?: MonsterSpeedTraversal
  villainActions?: VillainAction[]
  bloodiedActions?: BloodiedAction[]
  reactiveActions?: ReactiveAction[]
  comboActions?: ComboAction[]
  anatomyParts?: AnatomyPart[]
  runehammerTrack?: RunehammerTrack
  paragonConfig?: ParagonConfig
  toolsPlacement?: 'header' | 'action' | 'bonus_action' | 'legendary'
  showXp?: boolean
  compactNameplate?: boolean
  customVariables?: Record<string, string | number>
  customMacros?: Record<string, string>
}

// uhhhhhh
// how do i template
// templates are ... augmented regular things so let's see...
export interface TemplateMetadata<T> {
  type: T
  icon: string
  templateName: string
}

// templates have no id because they're not instantiated
export type RemoveId<T> = {
  [Property in keyof T as Exclude<Property, 'id'>]: T[Property]
}

export interface AttackTemplate
  extends RemoveId<DndAttack>,
    TemplateMetadata<'Attack'> {}

export interface ActionTemplate
  extends RemoveId<MonsterAction>,
    TemplateMetadata<'Action'> {}

export interface TraitTemplate
  extends RemoveId<MonsterTrait>,
    TemplateMetadata<'Trait'> {}

export interface ReactionTemplate
  extends RemoveId<MonsterReaction>,
    TemplateMetadata<'Reaction'> {}

// extend this as needed for other action types
export type DndTemplate =
  | AttackTemplate
  | ActionTemplate
  | TraitTemplate
  | ReactionTemplate

export interface Templates {
  customTemplates: Record<string, DndTemplate>
}

export interface Spells {
  customSpells: Record<string, DndSpell>
}

export function defaultCrAnnotation(): MonsterCrAnnotation {
  return {
    maxDamage: 0,
    maxSave: 0,
    maxModifier: 0,
    multitarget: false,
    ehpMultiplier: 1,
    ehpModifier: 0,
    acModifier: 0,
    include: true,
    automatic: true,
  }
}

export function defaultTrait(): MonsterTrait {
  return {
    name: 'New Trait',
    id: v4(),
    description: '',
    limitedUse: {
      count: 0,
      rate: 'DAY',
    },
    customPreamble: false,
    crAnnotation: defaultCrAnnotation(),
  }
}

export function defaultAction(): MonsterAction {
  return {
    name: 'New Action',
    id: v4(),
    description: '',
    recharge: '',
    limitedUse: {
      count: 0,
      rate: 'DAY',
    },
    save: {
      override: false,
      overrideValue: 0,
    },
    range: '',
    stat: 'none',
    effects: [],
    legendaryOnly: false,
    customPreamble: false,
    bonusAction: false,
    crAnnotation: defaultCrAnnotation(),
  }
}

export function defaultAttack(): DndAttack {
  return {
    id: v4(),
    name: 'New Attack',
    distance: 'MELEE',
    kind: 'WEAPON',
    modifier: {
      override: false,
      overrideValue: 0,
      stat: 'STR',
      proficient: true,
    },
    range: {
      standard: 20,
      long: 60,
      reach: 5,
    },
    targets: 1,
    damage: {
      dice: DICE.d6,
      count: 1,
      modifier: {
        override: false,
        overrideValue: 0,
        stat: 'STR',
      },
      type: 'slashing',
    },
    alternateDamage: {
      dice: DICE.d6,
      count: 1,
      modifier: {
        override: false,
        overrideValue: 0,
        stat: 'STR',
      },
      type: 'slashing',
      condition: '',
      active: false,
    },
    additionalDamage: [],
    save: 0,
    description: '',
    legendaryOnly: false,
    useCustomRenderer: false,
    customRenderer: '',
  }
}
