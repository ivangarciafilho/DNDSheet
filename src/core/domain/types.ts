import type { RandomTable } from './random-table'
import type { ComposableInitiativeRider } from './initiative-composer'

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

import { v4 as uuidv4 } from 'uuid'

export type DndStat = 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA'

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
  type?: string
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

  // Compoundable Cunning Action & Traversal Riders
  dashRider?: string
  dodgeRider?: string
  disengageRider?: string
  moveThroughCreaturesRider?: string

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
  riders?: ComposableInitiativeRider[]
}

export interface MonsterSkill {
  key: string
  skill: {
    stat: DndStat
    label: string
  }
  proficient: boolean
  expertise: boolean
  override: boolean
  overrideValue: number
  conditional?: string
  condition?: string
  advantage?: boolean
  disadvantage?: boolean
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
  stagePool?: number | string | 'all'
  descriptionContainers?: ActionDescriptionContainer[]
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
  sensesSentient?: boolean // Intellect Devourer pattern: senses presence of sentient creatures
  locatesSentient?: boolean // Intellect Devourer pattern: locates exact location of sentient creatures
  telepathicEavesdrop?: boolean // Flumph pattern: aware of content of telepathic conversations within range
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

export interface ActionEffect {
  case: string
  effect: string
}

export type AttackReach = 'melee' | 'ranged' | 'melee_or_ranged'
export type AttackSource = 'weapon' | 'spell'
export type AbilityNumber = number | string

export interface RangeSpec {
  distance: AbilityNumber
  unit: 'ft' | 'mi'
  relation?: 'within' | 'reach' | 'range'
  origin?: string
}

export interface AbilityArea {
  shape: string
  distance?: AbilityNumber
  unit?: 'ft' | 'mi'
  origin?: string
}

export interface AbilityTargeting {
  count?: AbilityNumber | 'all'
  countMode?: 'exact' | 'up_to'
  kind?: string
  qualifier?: string
  range?: RangeSpec
  area?: AbilityArea
  planes?: string[]
  /** Literal legacy scope retained when safe structured inference is not possible. */
  raw?: string
}

export interface EffectClause {
  kind?: 'damage' | 'text'
  text?: string
  /** A safe expression in the existing formula grammar, such as `1d10 + PB`. */
  formula?: string
  damageType?: string
}

export interface OutcomeDiceTableRow {
  roll: string
  effect: string
}

export interface AbilityOutcome {
  /** A11.5 stable clause id so other clauses can reference this result. */
  id?: string
  /** Who the clause applies to, e.g. 'the target', 'each creature in the area', 'the creature that failed by 5 or more'. */
  recipient?: string
  /** Ids of earlier clauses whose result this clause builds on (e.g. 'half as much on a success'). */
  refs?: string[]
  /** Presentation only; never changes mechanics. */
  presentation?: 'inline' | 'vertical' | 'horizontal'
  /** Stable known triggers use hit/failure/success; unknown labels are preserved verbatim. */
  trigger: string
  effects: EffectClause[]
  rider?: string
  targetFilter?: string
  layoutSector?: 'all' | 'top_left' | 'top_right' | 'bottom_left' | 'bottom_right' | 'row_1' | 'row_2' | 'col_1' | 'col_2' | string
  diceTable?: OutcomeDiceTableRow[]
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
  school?: string
  spellLevel?: string
  components?: string[]
  duration?: string
  deliveryType?: 'Attack' | 'Save' | 'Aura' | 'Utility' | string
  attackReach?: AttackReach
  attackSource?: AttackSource
  weaponAttackAbility?: DndStat | 'auto' | 'finesse' | 'thrown' | 'finesse_thrown'
  attackBonus?: number
  stat?: DndStat | 'none'
  save?: {
    override: boolean
    overrideValue: number
  }
  range?: string
  targeting?: AbilityTargeting
  outcomes?: AbilityOutcome[]
  outcomeLayout?: 'linear' | 'grid_1x2' | 'grid_2x1' | 'grid_2x2' | 'table'
  effects?: ActionEffect[]
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

export interface Monster {
  bindings?: Record<string, import('./formula').NumericBinding>
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
  /** A11.9 declarative random-outcome tables. Optional so older saves and fixtures stay valid. */
  randomTables?: RandomTable[]
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

export interface TemplateMetadata<T> {
  type: T
  icon: string
  templateName: string
}

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

export function defaultTrait(id = uuidv4()): MonsterTrait {
  return {
    name: 'New Trait',
    id,
    description: '',
    limitedUse: {
      count: 0,
      rate: 'DAY',
    },
    customPreamble: false,
    crAnnotation: defaultCrAnnotation(),
  }
}

export function defaultAction(id = uuidv4()): MonsterAction {
  return {
    name: 'New Action',
    id,
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
    id: uuidv4(),
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
      dice: 6,
      count: 1,
      modifier: {
        override: false,
        overrideValue: 0,
        stat: 'STR',
      },
      type: 'slashing',
    },
    alternateDamage: {
      dice: 6,
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

export interface CharacterActor {
  id: string
  name: string
  class: string
  subclass?: string
  level: number
  race: string
  background: string
  alignment: string
  stats: Record<DndStat, number>
  proficiency: number
  hp: {
    current: number
    max: number
    temp: number
  }
  hitDice: {
    total: number
    spent: number
    die: number
  }
  deathSaves: {
    successes: number
    failures: number
  }
  spellSlots: {
    current: number[]
    max: number[]
  }
  portrait?: {
    url: string
    position: 'none' | 'left' | 'right'
    caption?: string
  }
  savingThrows?: Partial<Record<DndStat, boolean>>
  skills?: Record<string, { proficient: boolean; expertise?: boolean }>
  spellcasting?: {
    ability: DndStat
  }
  spells?: Array<{
    id: string
    name: string
    level: number
    prepared?: boolean
    notes?: string
  }>
  inventory: Array<{
    id: string
    name: string
    quantity: number
    weight: number
    equipped?: boolean
  }>
  features: Array<{
    id: string
    name: string
    source: string
    description: string
  }>
}

export const DND_SKILLS: Array<{ name: string; stat: DndStat }> = [
  { name: 'Acrobatics', stat: 'DEX' },
  { name: 'Animal Handling', stat: 'WIS' },
  { name: 'Arcana', stat: 'INT' },
  { name: 'Athletics', stat: 'STR' },
  { name: 'Deception', stat: 'CHA' },
  { name: 'History', stat: 'INT' },
  { name: 'Insight', stat: 'WIS' },
  { name: 'Intimidation', stat: 'CHA' },
  { name: 'Investigation', stat: 'INT' },
  { name: 'Medicine', stat: 'WIS' },
  { name: 'Nature', stat: 'INT' },
  { name: 'Perception', stat: 'WIS' },
  { name: 'Performance', stat: 'CHA' },
  { name: 'Persuasion', stat: 'CHA' },
  { name: 'Religion', stat: 'INT' },
  { name: 'Sleight of Hand', stat: 'DEX' },
  { name: 'Stealth', stat: 'DEX' },
  { name: 'Survival', stat: 'WIS' },
]

export function defaultCharacterActor(): CharacterActor {
  return {
    id: uuidv4(),
    name: 'New Adventurer',
    class: 'Fighter',
    subclass: 'Champion',
    level: 1,
    race: 'Human',
    background: 'Soldier',
    alignment: 'Neutral Good',
    stats: {
      STR: 15,
      DEX: 14,
      CON: 13,
      INT: 10,
      WIS: 12,
      CHA: 8,
    },
    proficiency: 2,
    hp: {
      current: 12,
      max: 12,
      temp: 0,
    },
    hitDice: {
      total: 1,
      spent: 0,
      die: 10,
    },
    deathSaves: {
      successes: 0,
      failures: 0,
    },
    spellSlots: {
      current: [0, 0, 0, 0, 0, 0, 0, 0, 0],
      max: [0, 0, 0, 0, 0, 0, 0, 0, 0],
    },
    portrait: {
      url: '',
      position: 'none',
      caption: '',
    },
    savingThrows: {
      STR: true,
      CON: true,
    },
    skills: {
      Athletics: { proficient: true, expertise: false },
      Perception: { proficient: true, expertise: false },
    },
    spellcasting: {
      ability: 'INT',
    },
    spells: [],
    inventory: [],
    features: [],
  }
}

export function defaultMonster(): Monster {
  return {
    name: 'My New Monster',
    nickname: '',
    saveVersion: 11,
    useArticleInToken: false,
    alphaTraits: true,
    size: 'Medium',
    type: 'humanoid',
    alignment: '',
    languages: '',
    AC: 10,
    ACType: '',
    CR: 0,
    lairCr: -1,
    lairCrNote: 'in lair',
    useCrDisplayOverride: false,
    crOverride: '',
    proficiency: 2,
    proficiencyOverride: false,
    HP: {
      HD: 1,
      type: 8,
      modifier: 0,
    },
    hpModifierOverride: false,
    hpDieTypeOverride: false,
    stats: {
      STR: 10,
      DEX: 10,
      CON: 10,
      INT: 10,
      WIS: 10,
      CHA: 10,
    },
    saves: {
      STR: { proficient: false, override: false, overrideValue: 0 },
      DEX: { proficient: false, override: false, overrideValue: 0 },
      CON: { proficient: false, override: false, overrideValue: 0 },
      INT: { proficient: false, override: false, overrideValue: 0 },
      WIS: { proficient: false, override: false, overrideValue: 0 },
      CHA: { proficient: false, override: false, overrideValue: 0 },
    },
    speeds: [
      {
        id: uuidv4(),
        type: 'walk',
        speed: 30,
        note: '',
      },
    ],
    skills: [],
    resistances: [],
    immunities: [],
    vulnerabilities: [],
    conditions: [],
    senses: {
      blindsight: 0,
      darkvision: 0,
      tremorsense: 0,
      truesight: 0,
    },
    sensesNotes: '',
    passivePerception: {
      override: false,
      overrideValue: 0,
    },
    traits: [],
    spellcasting: {
      stat: 'INT',
      save: { override: false, overrideValue: 0 },
      modifier: { override: false, overrideValue: 0 },
      attack: { override: false, overrideValue: 0 },
      class: undefined,
      level: 1,
      slots: [0, 0, 0, 0, 0, 0, 0, 0, 0],
      atWill: [],
      standard: [],
      notes: '',
      atWillNotes: '',
      useCustomClassPreamble: false,
      customClassPreamble: '',
      useCustomInnatePreamble: false,
      customInnatePreamble: '',
    },
    attacks: [],
    actions: [],
    multiattacks: [],
    multiattackOptions: {
      useCustomRenderer: false,
      customMultiattackRenderer: '',
      postscript: '',
    },
    legendaryActions: {
      count: 0,
      actions: [],
      useCustomPreamble: false,
      customPreamble: '',
    },
    mythicActions: {
      triggerName: '',
      triggerRecharge: 'Recharges after a Short or Long Rest',
      triggerDescription: '',
      preamble: '',
      actions: [],
    },
    reactions: [],
    useCustomLairActionPreamble: false,
    lairActionPreamble: '',
    lairActions: [],
    regionalEffects: [],
    regionalEffectDescription: '',
    randomTables: [],
    inventory: '',
    autoEstimateDefenseCr: true,
    portrait: {
      url: '',
      position: 'none',
    },
    extendedHp: {
      showBloodied: false,
      bloodiedOverride: null,
      damageThreshold: null,
      damageReduction: null,
      regeneration: {
        amount: 10,
        disruptedBy: 'acid or fire',
        enabled: false,
      },
    },
    detailedDamageModifiers: [],
    actionOrientedPassives: {
      bonusActionSearch: false,
      bonusActionStudy: false,
      bonusActionHide: false,
      bonusActionInfluence: false,
      search: { perception: false, investigation: false, survival: false },
      study: { arcana: false, history: false, nature: false, religion: false },
      hide: { stealth: false, acrobatics: false, sleightOfHand: false },
      influence: { insight: false, persuasion: false, deception: false, intimidation: false },
    },
    tools: [],
    initiativeConfig: {
      proficient: false,
      secondaryStat: 'none',
      statMode: 'add',
      advantage: false,
      disadvantage: false,
      cantBeSurprised: false,
      riders: [],
    },
    speedTraversal: {
      ignoresDifficultTerrain: false,
      bonusActionDash: false,
      bonusActionDodge: false,
      bonusActionDisengage: false,
      bonusActionSpeed: 0,
      trackingSpeed: 0,
      stealthSpeed: 0,
      note: '',
    },
  }
}
