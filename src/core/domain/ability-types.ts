import type { ActionDescriptionContainer, DndLimitedUse, DndStat, MonsterCrAnnotation } from './types.ts'

export interface ActionEffect {
  case: string
  effect: string
}

export type AttackReach = 'melee' | 'ranged' | 'melee_or_ranged'
export type AttackSource = 'weapon' | 'spell'
export type AbilityNumber = number | string

export interface RangeSpec {
  distance: AbilityNumber
  longDistance?: AbilityNumber
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
  randomTableId?: string
}

export type RollScalingSource = 'manual' | 'cr' | 'hd' | 'level' | 'custom'
export type AttackRollMode = 'normal' | 'advantage' | 'disadvantage'

export interface RollScalingTier {
  minTier: number
  rollCount?: number
  beamCount?: number
  damageMultiplier?: number
}

export interface RollScalingSpec {
  rollCount?: number | string
  beamCount?: number | string
  damageMultiplier?: number | string
  source?: RollScalingSource
  sourceLabel?: string
  tiers?: RollScalingTier[]
  rollMode?: AttackRollMode
  rollCondition?: string
  saveMode?: AttackRollMode
  saveCondition?: string
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
  saveDc?: number
  saveStat?: string
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
  rollScaling?: RollScalingSpec
  outcomeLayout?: 'linear' | 'grid_1x2' | 'grid_2x1' | 'grid_2x2' | 'table'
  descriptionContainers?: ActionDescriptionContainer[]
}

export interface LairAction {
  descriptionContainers?: ActionDescriptionContainer[]
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
  stagePool?: number | string | 'all'
  useCustomRenderer: boolean
  customRenderer: string
  attackCount?: number | string
  attackRollModifier?: 'advantage' | 'disadvantage' | 'none'
  attackException?: string
  rollScaling?: RollScalingSpec
}

export interface LegendaryAction {
  actionId: string
  cost: number
}

export type ReactionAvailabilityPredicate =
  | 'always'
  | 'while_bloodied'
  | 'when_bloodied'
  | 'while_not_bloodied'
  | 'at_0_hp'
  | 'at_1_hp'

export interface ReactionAvailabilitySet {
  /** Phase/pool numbers (1-based) where this reaction is active; empty/omitted means all pools unless legacy stagePool narrows it. */
  stagePools?: number[]
  /** Availability state predicate (separate from recovery cadence and activation trigger). */
  predicate?: ReactionAvailabilityPredicate
  /** Optional custom state note preserved verbatim. */
  customCondition?: string
}

export interface MonsterReaction {
  descriptionContainers?: ActionDescriptionContainer[]
  name: string
  id: string
  description: string
  recharge?: string
  actionType?: string
  targetsText?: string
  areaShape?: string
  areaDistance?: string
  limitedUse: DndLimitedUse
  trigger: string
  /** Where the trigger sits in the printed text: before (default) or after the response. */
  triggerPlacement?: 'start' | 'end'
  stagePool?: number | string | 'all'
  availability?: ReactionAvailabilitySet
  customPreamble?: boolean
  crAnnotation?: MonsterCrAnnotation
  school?: string
  spellLevel?: string
  components?: string[]
  duration?: string
  deliveryType?: 'Attack' | 'Save' | 'Aura' | 'Utility' | string
  attackReach?: AttackReach
  attackSource?: AttackSource
  weaponAttackAbility?: DndStat | 'auto' | 'finesse' | 'thrown' | 'finesse_thrown'
  attackBonus?: number
  attackCount?: number | string
  attackRollModifier?: 'advantage' | 'disadvantage' | 'none'
  attackException?: string
  stat?: DndStat | 'none'
  save?: {
    override: boolean
    overrideValue: number
  }
  saveDc?: number
  saveStat?: string
  range?: string
  targeting?: AbilityTargeting
  outcomes?: AbilityOutcome[]
  rollScaling?: RollScalingSpec
  outcomeLayout?: 'linear' | 'grid_1x2' | 'grid_2x1' | 'grid_2x2' | 'table'
  effects?: ActionEffect[]
}
