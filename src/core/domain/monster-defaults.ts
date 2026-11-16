import { v4 as uuidv4 } from 'uuid'
import type { DndAttack, DndStat, Monster, MonsterAction, MonsterCrAnnotation, MonsterPortrait, MonsterReaction, MonsterTrait } from './types.ts'

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

export function defaultReaction(id = uuidv4()): MonsterReaction {
  return {
    name: 'New Reaction',
    id,
    description: '',
    trigger: '',
    triggerPlacement: 'start',
    limitedUse: {
      count: 0,
      rate: 'DAY',
    },
    recharge: '',
    stat: 'none',
    save: {
      override: false,
      overrideValue: 0,
    },
    range: '',
    effects: [],
    customPreamble: false,
    stagePool: 'all',
    availability: {
      predicate: 'always',
    },
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
  /** User-recorded totals; absent values retain explicitly labelled estimates. */
  combatVitals?: { armorClass?: number | null; speed?: number | null; armorClassSource?: string; speedSource?: string }
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
  portrait?: MonsterPortrait
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
    passives: undefined,
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
