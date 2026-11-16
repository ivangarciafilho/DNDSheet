import type { BasicRider, BasicRiderScope, HpRiderGroup, DefenseEffect, RiderSchedule } from './basic-riders'
import type { CastingContribution, CastingSpellGrant, CastingRollOverride } from '../usecases/AutoSyncSpellcasting'
import type { SkillPassiveState } from './skill-passive-state.ts'
import type { RandomTable } from './random-table'
import type { ComposableInitiativeRider } from './initiative-composer'
import type { MonsterPreset } from '../usecases/ApplyMonsterPreset.ts'

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
  detectionMode?: 'presence' | 'location' | 'both' | 'identity' | 'all'
  targetCreatureTypes?: string[]
  gatheredInfo?: string[]
  perceivedStats?: string[]
  perceptionPrecision?: 'detailed' | 'comparative'
  observationRequirement?: 'none' | 'immediate' | 'observing' | 'fighting' | 'both'
  observationMinutes?: number
  requiresStudyAction?: boolean
  lightImpairment?: 'none' | 'bright_light' | 'daylight' | 'dim_and_bright'
  senseSentienceMode?: 'none' | 'location_intelligent' | 'presence_intelligent' | 'telepathy_creatures'
  keenTypes?: ('hearing' | 'smell' | 'sight')[]
  sunlightSensitivity?: boolean
  note?: string
}

export * from './ability-types.ts'
import type { DndAtWillSpell, DndAttack, DndSpell, LairAction, LegendaryAction, MonsterAction, MonsterReaction, Multiattack, RollScalingSpec } from './ability-types.ts'
export * from './encounter-types.ts'
import type { ActionOrientedPassives, AnatomyPart, BloodiedAction, ComboAction, DetailedDamageModifier, MonsterExtendedHp, MonsterPortrait, ParagonConfig, ReactiveAction, RunehammerTrack, VillainAction } from './encounter-types.ts'

export * from './monster-defaults.ts'

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
  /** Legacy traversal flag still read by the stat line. */
  bonusActionHide?: boolean
  hideRider?: string
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
  splitRiderRows?: boolean

  // Movement Action Riders
  actionRiders?: Array<{
    id: string
    action: string
    actionType?: 'Action' | 'Bonus Action' | 'Reaction' | 'Free'
    rider: string
    trigger?: string
  }>
}

/** One AC rider (Build 269): cadence -> timing -> trigger (hit or miss) -> effect (preset or custom text). */
export interface AcRider {
  id: string
  trigger: 'hit' | 'miss'
  cadence?: string
  timing?: string
  effect: string
  text?: string
  distance?: number
  damageAmount?: number | string
  damageType?: string
  doubleIfBloodied?: boolean
}

export interface MonsterAcConfig {
  riders?: AcRider[]
  enabled?: boolean
  baseMode?: 'flat' | '10' | 'armor' | 'ability' | string
  baseArmor?: string
  baseAbility?: DndStat
  /** Flat bonus for the `natural` base mode: AC = 10 + DEX + this value (Build 269). */
  naturalBonus?: number
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
  onHitDoubleBloodied?: boolean
  doubleIfBloodied?: boolean
  otherwiseDoubleProne?: boolean
  targetAdvantage?: string
  bloodiedDc?: number
  syntax?: string
  cover?: string
  grappleTarget?: string
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
  bonusAction?: boolean
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
  bonusAction?: boolean
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
  recurringDamage?: number
}

export interface DndLimitedUse {
  count: number
  rate: string
}

export interface ActionDescriptionRegion {
  id: string
  title?: string
  kind: 'text' | 'table' | 'random_table'
  audience?: 'all' | 'target' | 'creatures' | 'caster'
  plane?: string
  text?: string
  randomTableId?: string
  table?: {
    headers: string[]
    rows: string[][]
  }
}

export interface ActionDescriptionContainer {
  id: string
  kind: 'text' | 'table' | 'random_table'
  outcomeTarget?: string
  text?: string
  randomTableId?: string
  table?: {
    headers: string[]
    rows: string[][]
  }
  regions?: ActionDescriptionRegion[]
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
  rollScaling?: RollScalingSpec
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
  | 'conditionVulnerabilitiesList'
  | 'conditionResistancesList'
  | 'conditionsList'
  | 'villainActions'
  | 'bloodiedActions'
  | 'reactiveActions'
  | 'comboActions'
  | 'anatomyParts'

export interface SpellcastingClassEntry {
  automaticGrants?: boolean
  spellGrants?: CastingSpellGrant[]
  preparedCountOverride?: number
  preparedInterval?: string
  preparedSpellList?: string
  spellCastingTimeMap?: Record<string, string>
  save?: CastingRollOverride
  attack?: CastingRollOverride
  modifier?: CastingRollOverride
  rulesEdition?: '2014' | '2024'
  sorceryPoints?: number
  metamagic?: { enabled: boolean; sorceryPoints: number; refreshRate?: string; options?: string[] }
  levelAmounts?: Record<string | number, number | null>
  spellAmounts?: Record<string, number | null>
  spellBonusAction?: Record<string, boolean>
  contribution?: CastingContribution
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
  resourceValue?: number
  refreshRate?: string
  resourceType?: 'slots' | 'pact' | 'points' | 'focus' | 'at_will'
}

export type DocumentRulesetProvenance = '2014' | '2024' | 'unknown'

export interface DocumentProvenance {
  ruleset: DocumentRulesetProvenance
  editionLabel: string
  sourceKind: 'authored' | 'legacy_fixture' | 'imported' | 'migrated'
  updatedAt?: string
}

export interface Monster {
  id?: string
  provenance?: DocumentProvenance
  bindings?: Record<string, import('./formula').NumericBinding>
  name: string
  nickname: string
  saveVersion: number
  useArticleInToken: boolean
  alphaTraits: boolean
  size: string
  type?: string
  subtype?: string
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
  proficiencyScale?: 'monster' | 'character'
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
  sensesList?: MonsterSenseItem[]
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
      secondarySubclass?: string
      secondaryLevel: number
      secondaryStat: DndStat
      secondarySaveDc?: number
      secondarySpellAttack?: number
      classes?: SpellcastingClassEntry[]
      extraClasses?: SpellcastingClassEntry[]
    }
    resourceType?: 'slots' | 'points' | 'focus' | 'pact' | 'at_will'
    refreshRate?: 'long_rest' | 'short_rest' | 'downtime'
    displayTitleMode?: 'class_names' | 'caster_source' | 'split_levels'
    bypassSlotLevelFilter?: boolean
    splitHighCadence?: boolean
    restrictedCadences?: string[]
    spellCadenceMap?: Record<string, string>
    rulesEdition?: '2014' | '2024'
    alwaysAvailableOnly?: boolean
    customRefreshRate?: string
    preparedCountOverride?: number
    preparedInterval?: string
    preparedSpellList?: string
    spellCastingTimeMap?: Record<string, string>
    sorceryPoints?: number
    metamagic?: { enabled: boolean; sorceryPoints: number; points?: number; refreshRate: string; options: string[] }
    cantripSwitch?: boolean
    cantripSwitchCount?: number
    cantripSwitchInterval?: string
    automaticGrants?: boolean
    spellGrants?: CastingSpellGrant[]
    primarySourceEnabled?: boolean
    innateStat?: DndStat
    innateSave?: { override: boolean; overrideValue: number }
    innateAttack?: { override: boolean; overrideValue: number }
    innateModifier?: { override: boolean; overrideValue: number }
    resourceValue?: number
    levelCadenceMap?: Record<number, string>
    bonusActionLevelMap?: Record<number, boolean>
    levelAmountMap?: Record<string | number, number | null>
    spellAmountMap?: Record<string, number | null>
    spellBonusActionMap?: Record<string, boolean>
    contribution?: CastingContribution
    classes?: SpellcastingClassEntry[]
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
  /** Canonical saved skill overrides; formerly an unpersisted editor property. */
  passives?:SkillPassiveState
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
  basicRiders?: Partial<Record<BasicRiderScope, BasicRider[]>>
  hpRiderSubrows?: Partial<Record<HpRiderGroup, boolean>>
  defenseSchedules?: Partial<Record<DefenseEffect, RiderSchedule>>
  customMacros?: Record<string, string>
  splitVulnRows?: boolean
  splitResRows?: boolean
  splitImmRows?: boolean
  autoSplitDefenses?: boolean
  autoSortDefenses?: boolean
  defenseCategoryOrder?: string[]
  splitSpeedRiderRows?: boolean
  splitHpRiderRows?: boolean
  splitAcRiderRows?: boolean
  /** Legacy per-category split flags; superseded by splitVulnRows/splitResRows/splitImmRows. */
  splitDefenseRows?: { vulnerabilities?: boolean; resistances?: boolean; immunities?: boolean }
  /** Legacy tools action placement; superseded by passives.toolsActionType. */
  toolsActionType?: 'Action' | 'Bonus Action'
  customDatabase?: { presets?: MonsterPreset[]; [key: string]: unknown }
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
