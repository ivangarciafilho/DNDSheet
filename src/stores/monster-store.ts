import { characterProficiency } from 'src/core/domain/math-utils'
import { sourceEffectiveSpells } from 'src/core/domain/casting-source-selection'
import { previewRandomTableImport, nextRandomTableRow } from 'src/core/domain/random-table'
import { entryBindingPrefix, withoutEntryBindings } from 'src/core/domain/entry-bindings'
import { validate } from 'jsonschema'
import { sortBy, union } from 'lodash'
import { defineStore } from 'pinia'
import { useQuasar } from 'quasar'
import { validateNumber } from 'src/components/editor/numberInput'
import { useFileLoader } from 'src/components/file/useFileLoader'
import {
  CrActionInfo,
  CrDamageInfo,
  defaultAction,
  defaultAttack,
  defaultCrAnnotation,
  defaultTrait,
  DndAttack,
  DndStat,
  Monster,
  MonsterAction,
  MonsterSkill,
  SwappableField,
} from 'src/components/models'
import {
  avgHP,
  avgRoll,
  bonusForAttack,
  bonusForAttackDamage,
  bonusForConditionalDamage,
  bonusForSkill,
  saveModifier,
  statModifier,
} from 'src/components/rendering/mathRendering'
import { CR } from 'src/data/CR'
import { DICE } from 'src/data/DICE'
import { SCHEMA } from 'src/data/SCHEMA'
import { HD_FOR_SIZE } from 'src/data/SIZE'
import { SKILL } from 'src/data/SKILL'
import { v4 as uuidv4 } from 'uuid'
import { useI18n } from 'vue-i18n'
import { useSpellsStore } from './spells-store'
import { monsterBindingActions } from './binding-runtime'

export const MONSTER_VERSION = 11

const monsterState = {
  state: (): Monster => {
    return {
      name: 'My New Monster',
      bindings: {},
      nickname: '',
      saveVersion: MONSTER_VERSION,
      useArticleInToken: false,
      alphaTraits: true,
      size: 'Medium',
      type: 'humanoid',
      alignment: '',
      languages: '',
      AC: 10,
      ACType: '',
      acConfig: {
        enabled: false,
        baseMode: 'flat',
        abilityBonus: 'none',
        defenseItem: 'none',
        temporary: 'none',
        conditional: 'none',
      },
      CR: 0,
      lairCr: -1,
      lairCrNote: 'in lair',
      useCrDisplayOverride: false,
      crOverride: '',
      proficiency: 2,
      proficiencyOverride: false,
      proficiencyScale: 'monster',
      HP: {
        HD: 1,
        type: DICE.d8,
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
        STR: {
          proficient: false,
          override: false,
          overrideValue: 0,
        },
        DEX: {
          proficient: false,
          override: false,
          overrideValue: 0,
        },
        CON: {
          proficient: false,
          override: false,
          overrideValue: 0,
        },
        INT: {
          proficient: false,
          override: false,
          overrideValue: 0,
        },
        WIS: {
          proficient: false,
          override: false,
          overrideValue: 0,
        },
        CHA: {
          proficient: false,
          override: false,
          overrideValue: 0,
        },
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
      sensesList: [] as MonsterSenseItem[],
      passivePerception: {
        override: false,
        overrideValue: 0,
      },
      traits: [],
      spellcasting: {
        stat: 'INT',
        save: {
          override: false,
          overrideValue: 0,
        },
        modifier: {
          override: false,
          overrideValue: 0,
        },
        attack: {
          override: false,
          overrideValue: 0,
        },
        class: undefined,
        subclass: '',
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
        resourceType: 'slots' as 'slots' | 'points' | 'focus' | 'pact',
        refreshRate: 'long_rest' as 'long_rest' | 'short_rest' | 'downtime',
        displayTitleMode: 'class_names' as 'class_names' | 'caster_source' | 'split_levels',
        bypassSlotLevelFilter: false,
        splitHighCadence: false,
        restrictedCadences: [
          'short rest',
          'long rest',
          'midnight',
          'midday',
          'dusk',
          'dawn',
          'downtime',
          'ritual',
          'weekly',
          'monthly',
          'yearly'
        ] as string[],
        spellCadenceMap: {} as Record<string, string>,
        levelCadenceMap: {} as Record<number, string>,
        bonusActionLevelMap: {} as Record<number, boolean>,
        metamagic: {
          enabled: false,
          sorceryPoints: 0,
          refreshRate: 'Long Rest',
          options: [] as string[],
        },
        cantripSwitch: false,
        cantripSwitchCount: 1,
        cantripSwitchInterval: 'Short Rest',
        preparedCountOverride: undefined as number | undefined,
        preparedInterval: 'Long Rest',
        customRefreshRate: '',
        classes: [] as Array<{
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
        }>,
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
        triggerDescription:
          'If {NAME} would be reduced to 0 hit points, its current hit point total instead resets to {monster.hp} hit points. Additionally, the {NAME} can now use the options in the "Mythic Actions" section for 1 hour. Award a party an additional [x]XP ([x] XP total) for defeating the {NAME} after this trait activates.',
        preamble:
          "If {NAME}'s mythic trait is active, it can use the options below as legendary actions.",
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
        width: 220,
        caption: '',
      },
      extendedHp: {
        showBloodied: false,
        bloodiedSource: 'none',
        bloodiedDice: '2d8',
        damageThresholdSource: 'flat',
        damageThresholdDice: '2d6',
        damageThresholdDisruption: 'none',
        damageReductionSource: 'flat',
        damageReductionDice: '1d6',
        damageReductionDisruption: 'none',
        invulnerability: {
          enabled: false,
          rule: 'none',
          customRule: '',
          firstXCount: 1,
          disruption: 'none',
          customDisruption: '',
          displayLocation: 'ac',
          combiner: 'or',
          customLogic: '',
        },
        bloodiedOverride: null,
        damageThreshold: null,
        damageReduction: null,
        regeneration: {
          enabled: false,
          recoveryType: 'regen',
          valueSource: 'flat',
          amount: 10,
          timeframe: 'turn',
          frequency: 'turn_start',
          diceFormula: '',
          disruptedByTypes: ['acid', 'fire'],
          disruptedByNote: '',
          displayMode: 'minimalist',
          conditionModifier: 'none',
          maxHpReductionUntil: 'short rest',
          styleMode: 'concise',
        },
        deathPrevention: {
          enabled: false,
          name: 'Mortal',
          dcRule: 'dc_5_plus_dmg',
          returnHpSource: '1',
          returnHpValue: 1,
          returnHpDice: '2d8',
          requiresSave: false,
          saveStat: 'CON',
          saveDc: 15,
          hideHp: false,
          critHitsToKill: 3,
          exceptions: ['radiant', 'critical hit'],
          customNote: '',
          displayMode: 'minimalist',
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
      resistancesList: [],
      immunitiesList: [],
      vulnerabilitiesList: [],
      conditionsList: [],
      languagesList: [],
      splitVulnRows: false,
      splitResRows: false,
      splitImmRows: false,
      autoSplitDefenses: false,
      autoSortDefenses: false,
      defenseCategoryOrder: ['vulnerabilities', 'resistances', 'immunities'] as string[],
      splitSpeedRiderRows: false,
      splitHpRiderRows: false,
      hpRiderSubrows: {},
      basicRiders: {},
      defenseSchedules: {},
      splitAcRiderRows: false,
      tools: [],
      initiativeConfig: {
        proficient: false,
        secondaryStat: 'none',
        statMode: 'add',
        advantage: false,
        cantBeSurprised: false,
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
        actionRiders: [] as Array<{
          id: string
          action: string
          actionType?: 'Action' | 'Bonus Action' | 'Reaction' | 'Free'
          rider: string
          trigger?: string
        }>,
      },
      villainActions: [],
      bloodiedActions: [],
      reactiveActions: [],
      comboActions: [],
      anatomyParts: [],
      conditionVulnerabilitiesList: [],
      conditionResistancesList: [],
      specialCommunicationArchetype: 'none',
      runehammerTrack: {
        enabled: false,
        timerDie: 'd4',
        name: 'Escalation Track',
        events: [],
      },
      paragonConfig: {
        enabled: false,
        poolCount: 1,
        poolHp: [],
        initiativeStep: 'Initiative 20 & 10',
        enrageNote: '',
        activePoolFilter: 'all',
        phaseName: 'Phase',
        bloodiedPerPhase: [],
        phaseConfigs: [],
      },
      toolsPlacement: undefined as 'header' | 'action' | 'bonus_action' | 'legendary' | undefined,
      showXp: true,
      compactNameplate: false,
      customVariables: {} as Record<string, string | number>,
      customMacros: {} as Record<string, string>,
    }
  },
}

export const createMonsterState = monsterState.state

export const useMonsterStore = defineStore('monster', {
  ...monsterState,
  getters: {
    statsWithModifiers: (state) => {
      const statKeys = Object.keys(state.stats) as (keyof typeof state.stats)[]

      return statKeys.map((k) => {
        return {
          stat: k,
          score: state.stats[k],
          modifier: statModifier(state.stats[k]),
        }
      })
    },
    avgHp: (state) => {
      return avgHP(state.HP)
    },
    computedPassivePerception: (state) => {
      // first check the override
      if (state.passivePerception?.override) {
        return state.passivePerception.overrideValue
      }

      // non-override, default computation
      // check if perception is in the skills
      const perception = state.skills.find(
        (s) => s.key?.toUpperCase() === 'PERCEPTION'
      )
      let passive = 10

      if (perception) {
        passive += bonusForSkill(state, perception)
        if (perception.advantage) passive += 5
        if (perception.disadvantage) passive -= 5
      } else {
        passive += statModifier(state.stats.WIS)
      }

      return passive
    },
    defaultSaveBonus: (state) => {
      return (stat: keyof typeof state.stats) => {
        const proficient = state.saves[stat].proficient
        return saveModifier(
          state.stats[stat],
          proficient ? state.proficiency : 0
        )
      }
    },
    defaultSkillBonus: (state) => {
      return (skill: MonsterSkill) => {
        const proficient = skill.proficient
        // back compat safety
        const expertise = skill.expertise ? skill.expertise : false

        return saveModifier(
          state.stats[skill.skill.stat],
          expertise ? state.proficiency * 2 : proficient ? state.proficiency : 0
        )
      }
    },
    defaultSpellSave: (state) => {
      return (stat: keyof typeof state.stats) =>
        8 + state.proficiency + statModifier(state.stats[stat])
    },
    defaultSpellAttackModifier: (state) => {
      return (stat: keyof typeof state.stats) => {
        return state.proficiency + statModifier(state.stats[stat])
      }
    },
    defaultSpellModifier: (state) => {
      return (stat: DndStat) => {
        return statModifier(state.stats[stat])
      }
    },
    spellSave(): number {
      if (this.spellcasting?.save?.override) {
        return this.spellcasting.save.overrideValue
      } else {
        return this.defaultSpellSave(this.spellcasting?.stat || 'INT')
      }
    },
    spellAttackModifier(): number {
      if (this.spellcasting?.attack?.override) {
        return this.spellcasting.attack.overrideValue
      } else {
        return this.defaultSpellAttackModifier(this.spellcasting?.stat || 'INT')
      }
    },
    spellAbilityModifier(): number {
      if (this.spellcasting?.modifier?.override) {
        return this.spellcasting.modifier.overrideValue
      } else {
        return this.defaultSpellModifier(this.spellcasting?.stat || 'INT')
      }
    },
    attackModifier: (state) => {
      return (id: string): number => {
        const attack = state.attacks.find((a) => a.id === id)

        if (attack) {
          return bonusForAttack(state, attack)
        }

        return 0
      }
    },
    attackDamageModifier: (state) => {
      return (id: string): number => {
        const attack = state.attacks.find((a) => a.id === id)

        if (attack) {
          return bonusForAttackDamage(state, attack)
        }

        return 0
      }
    },
    conditionalDamageModifier: (state) => {
      return (id: string): number => {
        const attack = state.attacks.find((a) => a.id === id)

        if (attack) {
          return bonusForConditionalDamage(state, attack)
        }

        return 0
      }
    },
    knownSpellsOfLevel() {
      const spells = useSpellsStore()

      return (level: number) => {
        const allSpells = spells.allSpells
        const extraSpells = (
          this.spellcasting?.classes ||
          this.spellcasting?.multiclass?.classes ||
          this.spellcasting?.multiclass?.extraClasses ||
          []
        ).flatMap((c: any) => c.spells || [])
        const allStandard = Array.from(new Set([...(this.spellcasting?.standard || []), ...extraSpells]))

        return allStandard.filter(
          (id) => id in allSpells && allSpells[id].level === level
        )
      }
    },
    spellsBySlot(): {
      level: number
      slots: number
      spells: string[]
    }[] {
      const slots = this.spellcasting?.slots || []
      const ret = []
      for (const idx in slots) {
        if (slots[idx] > 0) {
          const spells = this.knownSpellsOfLevel(parseInt(idx) + 1)
          if (spells.length === 0) continue

          const level = parseInt(idx) + 1

          ret.push({
            level,
            slots: slots[idx],
            spells,
          })
        }
      }

      return ret
    },
    expectedAttackDamage: (state) => {
      return (attack: DndAttack) => {
        const primary =
          avgRoll(attack.damage?.count ?? 0, attack.damage?.dice ?? 'd6') +
          (attack.damage?.modifier?.override
            ? (attack.damage.modifier.overrideValue ?? 0)
            : statModifier(state.stats[attack.damage?.modifier?.stat ?? 'STR']))

        const secondary =
          avgRoll(attack.alternateDamage?.count ?? 0, attack.alternateDamage?.dice ?? 'd6') +
          (attack.alternateDamage?.modifier?.override
            ? (attack.alternateDamage.modifier.overrideValue ?? 0)
            : statModifier(state.stats[attack.alternateDamage?.modifier?.stat ?? 'STR']))

        const base = attack.alternateDamage.active
          ? Math.max(primary, secondary)
          : primary

        const extra = attack.additionalDamage
          .map((a) => avgRoll(a.count, a.dice))
          .reduce((acc, current) => acc + current, 0)

        return (base + extra) * attack.targets
      }
    },
    expectedMultiattackDamage(): (id: string) => number {
      return (id: string) => {
        const multiattack = this.multiattacks.find((ma) => ma.id === id)

        if (multiattack != null) {
          const attackDamage = multiattack.attacks.map((attackId) => {
            const attack = this.attacks.find((a) => a.id === attackId)

            if (attack) {
              return this.expectedAttackDamage(attack)
            }
            return 0
          })

          const actionDamage = multiattack.actions.map((actionId) => {
            const action = this.actions.find((a) => a.id === actionId)

            if (action) {
              return action.crAnnotation?.include
                ? (action.crAnnotation.maxDamage || 0)
                : 0
            }
            return 0
          })

          return [...attackDamage, ...actionDamage].reduce(
            (acc, current) => acc + current,
            0
          )
        }

        return 0
      }
    },
    getLimitedMultiattackVariants(): (id: string) => CrActionInfo[] {
      return (id: string) => {
        const multiattack = this.multiattacks.find((ma) => ma.id === id)
        const crActions = [] as CrActionInfo[]

        if (multiattack != null) {
          // have to classify these as actions due to limited use
          const attackDamage = multiattack.attacks.map((attackId) => {
            const attack = this.attacks.find((a) => a.id === attackId)

            if (attack) {
              return this.expectedAttackDamage(attack)
            }
            return 0
          })

          const attackNames =
            multiattack.attacks.length > 0
              ? multiattack.attacks.map((id) => this.attackName(id))
              : ''

          // this is constant
          const baseAttackDamage = attackDamage.reduce(
            (acc, current) => acc + current,
            0
          )

          // TODO: if I decide to have a variable number of rounds, change this
          const maxTurns = 3

          // find the actions and map to a temp data stucture
          const actions = multiattack.actions.map((actionId) =>
            this.actions.find((a) => a.id === actionId)
          )

          // unlimited power
          const unlimitedActionNames: string[] = []
          let unlimitedActionDamage = 0

          let limitedActions: {
            action: MonsterAction
            uses: number
          }[] = []

          actions.forEach((a) => {
            if (a != null) {
              if ((a.limitedUse?.count ?? 0) === 0 && (a.recharge ?? '') === '') {
                unlimitedActionNames.push(this.actionName(a.id))
                unlimitedActionDamage += a.crAnnotation?.include
                  ? (a.crAnnotation.maxDamage || 0)
                  : 0
              } else if ((a.recharge ?? '') !== '') {
                // treat recharge as single use
                limitedActions.push({
                  action: a,
                  uses: 1,
                })
              } else {
                limitedActions.push({
                  action: a,
                  uses: a.limitedUse.count,
                })
              }
            }
          })

          // split it
          for (let i = 0; i < maxTurns; i++) {
            // first, get the limited action damage
            const limitedActionDamage = limitedActions.map((la) => {
              return la.action.crAnnotation.include
                ? la.action.crAnnotation.maxDamage
                : 0
            })

            // TODO: i18n
            const name = `Multiattack: ${[
              ...attackNames,
              ...unlimitedActionNames,
              ...limitedActions.map((la) => this.actionName(la.action.id)),
            ].join(', ')}`

            const damage =
              baseAttackDamage +
              unlimitedActionDamage +
              limitedActionDamage.reduce((acc, current) => acc + current, 0)

            // construct the action info
            crActions.push({
              name,
              damage,
              toHit: 0,
              save: 0,
              limited: true,
              uses: 1,
              type: 'LimitedMultiattack',
            })

            // decrement the limited action uses and filter
            limitedActions.forEach((la) => (la.uses -= 1))
            limitedActions = limitedActions.filter((la) => la.uses > 0)
          }
        }

        return crActions
      }
    },
    attackName: (state) => {
      return (attackId: string) => {
        if (!attackId) return ''
        const attack = state.attacks.find((a) => a.id === attackId)
        if (attack) return attack.name
        const norm = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '')
        const byName = state.attacks.find((a) => norm(a.name) === norm(attackId))
        if (byName) return byName.name
        return attackId.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
      }
    },
    actionName: (state) => {
      return (actionId: string) => {
        if (!actionId) return ''
        const action = state.actions.find((a) => a.id === actionId)
        if (action) return action.name
        const norm = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '')
        const byName = state.actions.find((a) => norm(a.name) === norm(actionId))
        if (byName) return byName.name
        return actionId.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
      }
    },
    attacksAndActions: (state) => {
      return (t: ReturnType<typeof useI18n>) => {
        // concatenates actions and attacks for use in a list
        const actions = state.actions.map((a) => {
          return {
            name: a.name,
            id: a.id,
            typeInternal: 'action',
            type: t('editor.action.tokenLabel'),
          }
        })

        const attacks = state.attacks.map((a) => {
          return {
            name: a.name,
            id: a.id,
            typeInternal: 'attack',
            type: t('editor.attack.tokenLabel'),
          }
        })

        return sortBy([...actions, ...attacks], 'name')
      }
    },
    legendaryActionName: (state) => {
      return (id: string) => {
        if (!id) return ''
        const norm = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '')
        const targetNorm = norm(id)

        // 1. Exact ID match
        const maybeAction = state.actions.find((a) => a.id === id)
        if (maybeAction) return maybeAction.name

        const maybeAttack = state.attacks.find((a) => a.id === id)
        if (maybeAttack) return maybeAttack.name

        // 2. Case-insensitive or normalized name match
        const actionByName = state.actions.find((a) => a.name.trim().toLowerCase() === id.trim().toLowerCase() || norm(a.name) === targetNorm)
        if (actionByName) return actionByName.name

        const attackByName = state.attacks.find((a) => a.name.trim().toLowerCase() === id.trim().toLowerCase() || norm(a.name) === targetNorm)
        if (attackByName) return attackByName.name

        // 3. Fallback clean name instead of [Invalid Id]
        return id.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
      }
    },
    legendaryAction: (state) => {
      return (id: string) => {
        if (!id) return undefined
        const norm = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '')
        const targetNorm = norm(id)

        // 1. Exact ID match
        const maybeAction = state.actions.find((a) => a.id === id)
        if (maybeAction) return { action: maybeAction, type: 'action' }

        const maybeAttack = state.attacks.find((a) => a.id === id)
        if (maybeAttack) return { action: maybeAttack, type: 'attack' }

        // 2. Name or slug match
        const actionByName = state.actions.find((a) => a.name.trim().toLowerCase() === id.trim().toLowerCase() || norm(a.name) === targetNorm)
        if (actionByName) return { action: actionByName, type: 'action' }

        const attackByName = state.attacks.find((a) => a.name.trim().toLowerCase() === id.trim().toLowerCase() || norm(a.name) === targetNorm)
        if (attackByName) return { action: attackByName, type: 'attack' }

        // 3. Graceful fallback synthesis
        const fallbackName = id.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
        return {
          action: {
            id,
            name: fallbackName,
            description: '',
            recharge: '',
            legendaryOnly: true,
            limitedUse: { count: 0, rate: '' },
            stat: 'none' as any,
            save: { override: false, overrideValue: 0 },
            range: '',
            effects: [],
            customPreamble: false,
            bonusAction: false,
            crAnnotation: { maxDamage: 0, maxSave: 0, maxModifier: 0, multitarget: false, ehpMultiplier: 1, ehpModifier: 0, acModifier: 0, include: false, automatic: true }
          },
          type: 'action'
        }
      }
    },
    attackOrActionFromId(): (
      id: string
    ) => DndAttack | MonsterAction | undefined {
      return (id: string) => {
        const attack = this.attacks.find((a) => a.id === id)
        if (attack != null) return attack

        const action = this.actions.find((a) => a.id === id)
        return action
      }
    },
    isSpellcaster: (state) => {
      return (
        (state.spellcasting.primarySourceEnabled !== false && sourceEffectiveSpells({className:state.spellcasting.class || '',subclass:state.spellcasting.subclass,level:state.spellcasting.level,rulesEdition:state.spellcasting.rulesEdition,spells:state.spellcasting.standard}).length > 0) ||
        (state.spellcasting.classes || []).some(source => sourceEffectiveSpells(source).length > 0) ||
        state.spellcasting.atWill.length > 0
      )
    },
    // here comes a special function
    attackInfo(): CrDamageInfo {
      // returns an object containing all you need to know for calculating CR
      // well... kinda. it's a summary of damage things
      const data: CrDamageInfo = {
        attacks: [],
        actions: [],
        legendary: [],
        traits: [],
        spells: [],
        lairActions: [],
        legendaryCount: this.legendaryActions.count,
      }

      // first, get the attacks and sort them by damage. We assume attacks are always available.
      // this includes multiattacks
      // attacks
      for (const attack of this.attacks) {
        // collect modifiers and DC while we're here
        data.attacks.push({
          name: attack.name,
          damage: this.expectedAttackDamage(attack),
          toHit: this.attackModifier(attack.id),
          save: attack.save,
          type: 'Attack',
        })
      }

      // multi
      // multiattacks with associated limited use actions are added individually
      // with and without the used actions
      // if there is a multiattack with multiple limited use actions i will scream but also
      // it'll have to add a new entry for every possible overlap
      for (const ma of this.multiattacks) {
        // multiattacks have no modifiers
        // get attack/action names
        const attackNames =
          ma.attacks.length > 0
            ? ma.attacks.map((id) => this.attackName(id))
            : ''
        const actionNames =
          ma.actions.length > 0
            ? ma.actions.map((id) => this.actionName(id))
            : ''

        // check if the attack has limited use actions (only the actions need to do this
        // attacks are not allowed to have a limited use field)
        const limitedActions = ma.actions
          .map((id) => this.actions.find((a) => a.id === id))
          .filter((action) => {
            return (
              action != null &&
              (action.limitedUse.count > 0 || action.recharge !== '')
            )
          })

        if (limitedActions.length === 0) {
          data.attacks.push({
            name: `Multiattack: ${[...attackNames, ...actionNames].join(', ')}`,
            damage: this.expectedMultiattackDamage(ma.id),
            save: 0,
            toHit: 0,
            type: 'Multiattack',
          })
        } else {
          // break it on down
          const variants = this.getLimitedMultiattackVariants(ma.id)
          data.actions.push(...variants)
        }
      }

      // sort descending damage
      data.attacks.sort((a, b) => {
        return b.damage - a.damage
      })

      // ok actions next
      for (const action of this.actions) {
        // check if we should even include this action
        // skip legendary only for now
        if (action.crAnnotation?.include && !action.legendaryOnly) {
          // now, actions might be limited use, which we'll need to track
          data.actions.push({
            name: action.name,
            damage:
              (action.crAnnotation.maxDamage || 0) *
              (action.crAnnotation.multitarget ? 2 : 1),
            limited: (action.limitedUse?.count || 0) > 0 || (action.recharge || '') !== '',
            uses: (action.recharge || '') !== '' ? 1 : (action.limitedUse?.count || 0),
            save: action.crAnnotation.maxSave || 0,
            toHit: action.crAnnotation.maxModifier || 0,
            type: 'Action',
          })
        }
      }

      // sort damage descending
      data.actions.sort((a, b) => {
        return b.damage - a.damage
      })

      // traits
      for (const trait of this.traits) {
        // really similar to actions
        if (trait.crAnnotation?.include) {
          data.traits.push({
            name: trait.name,
            damage:
              (trait.crAnnotation.maxDamage || 0) *
              (trait.crAnnotation.multitarget ? 2 : 1),
            limited: (trait.limitedUse?.count || 0) > 0,
            uses: trait.limitedUse?.count || 0,
            save: trait.crAnnotation.maxSave || 0,
            toHit: trait.crAnnotation.maxModifier || 0,
            remove: false,
            type: 'Trait',
          })
        }
      }

      data.traits.sort((a, b) => {
        return b.damage - a.damage
      })

      // lair actions
      // basically traits but they use the action annotation data
      for (const idx in this.lairActions) {
        const lairAction = this.lairActions[idx]

        if (lairAction.crAnnotation?.include) {
          data.lairActions.push({
            name: `Lair Action ${parseInt(idx) + 1}`,
            damage:
              (lairAction.crAnnotation.maxDamage || 0) *
              (lairAction.crAnnotation.multitarget ? 2 : 1),
            save: lairAction.crAnnotation.maxSave || 0,
            toHit: lairAction.crAnnotation.maxModifier || 0,
            type: 'Lair Action',
          })
        }
      }

      data.lairActions.sort((a, b) => {
        return b.damage - a.damage
      })

      // legendary actions
      for (const la of this.legendaryActions.actions) {
        // resolve the action or attack
        const actionOrAttack = this.attackOrActionFromId(la.actionId)

        if (actionOrAttack != null && 'crAnnotation' in actionOrAttack) {
          // that's an actions
          const action = actionOrAttack
          // do the action processing
          if (action.crAnnotation?.include) {
            data.legendary.push({
              name: action.name,
              damage:
                (action.crAnnotation.maxDamage || 0) *
                (action.crAnnotation.multitarget ? 2 : 1),
              limited: (action.limitedUse?.count || 0) > 0 || (action.recharge || '') !== '',
              uses: action.limitedUse?.count || 0,
              save: action.crAnnotation.maxSave || 0,
              toHit: action.crAnnotation.maxModifier || 0,
              cost: la.cost,
              type: 'Legendary',
            })
          }
        } else {
          // no annotation = attack
          const attack = actionOrAttack

          if (attack != null) {
            data.legendary.push({
              name: attack.name,
              damage: this.expectedAttackDamage(attack),
              toHit: this.attackModifier(attack.id),
              save: attack.save,
              cost: la.cost,
              limited: false,
              uses: 1,
              type: 'Legendary',
            })
          }
        }
      }

      // sort
      data.legendary.sort((a, b) => {
        return b.damage - a.damage
      })

      // spells
      // for simplicity, we're going to assume spells can be cast once (disregard concentration)
      // and that spells won't be upcasted (yeah yeah I know about upcasted fireball but you'll just have to
      // figure that out yourself)
      // there's a few spellcasting lists... let's combine them
      const standardList = Array.isArray(this.spellcasting.standard)
        ? (Array.isArray(this.spellcasting.standard[0])
            ? (this.spellcasting.standard as any).flat().map((s: any) => typeof s === 'string' ? s : s?.name).filter(Boolean)
            : this.spellcasting.standard)
        : []
      const atWillLists = (this.spellcasting.atWill || []).map((a) => a.spells || [])
      const spells = union(
        standardList,
        ...atWillLists
      )

      // got all the ids, get the dataaaaa
      const spellStore = useSpellsStore()
      for (const id of spells) {
        const spell = spellStore.allSpells[id]
        if (!spell) continue

        // cantrip scaling based on caster level
        const damage =
          spell.damage *
          (spell.level === 0
            ? Math.max(1, 1 + Math.floor((this.spellcasting.level + 1) / 6))
            : 1)

        data.spells.push({
          name: spell.name,
          damage: spell.multitarget ? damage * 2 : damage,
          save: this.spellSave,
          type: 'Spell',
        })
      }

      data.spells.sort((a, b) => {
        return b.damage - a.damage
      })

      return data
    },
    initiative(): { mod: number; passive: number; advantage?: boolean; disadvantage?: boolean; cantBeSurprised?: boolean } {
      const skillDefined = this.skills.find((s) => s.key === 'INITIATIVE')
      let baseMod = statModifier(this.stats.DEX)

      if (this.initiativeConfig) {
        if (this.initiativeConfig.secondaryStat && this.initiativeConfig.secondaryStat !== 'none') {
          const secMod = statModifier(this.stats[this.initiativeConfig.secondaryStat as DndStat])
          if (this.initiativeConfig.statMode === 'replace') {
            baseMod = secMod
          } else {
            baseMod += secMod
          }
        }
        if (this.initiativeConfig.proficient) {
          baseMod += this.proficiency
        }
      }

      if (skillDefined) {
        const bonus = skillDefined.override
          ? skillDefined.overrideValue
          : this.defaultSkillBonus(skillDefined)
        baseMod = bonus
      }

      const hasAdv = !!this.initiativeConfig?.advantage || !!skillDefined?.advantage
      const hasDisadv = !!this.initiativeConfig?.disadvantage || !!skillDefined?.disadvantage
      const passiveMod = hasAdv && !hasDisadv ? 5 : hasDisadv && !hasAdv ? -5 : 0

      return {
        mod: baseMod,
        passive: 10 + baseMod + passiveMod,
        advantage: hasAdv,
        disadvantage: hasDisadv,
        cantBeSurprised: !!this.initiativeConfig?.cantBeSurprised,
      }
    },
  },
  actions: {
    ...monsterBindingActions,
    setCR(value: number) {
      this.CR = value

      // automatically update proficiency too
      this.syncProficiency()
    },
    setProficiencyScale(scale: 'monster' | 'character') {
      this.$patch(state => {
        state.proficiencyScale = scale
        if (!state.proficiencyOverride) {
          state.proficiency = scale === 'character' ? characterProficiency(state.HP.HD) : CR[state.CR].proficiency
        }
      })
    },
    syncProficiency() {
      if (!this.proficiencyOverride) {
        this.proficiency = this.proficiencyScale === 'character' ? characterProficiency(this.HP.HD) : CR[this.CR].proficiency
      }
    },
    toggleProficiencyOverride() {
      this.proficiencyOverride = !this.proficiencyOverride

      if (!this.proficiencyOverride) {
        this.proficiency = CR[this.CR].proficiency
      }
    },
    setSize(value: string) {
      this.size = value

      if (!this.hpDieTypeOverride && value in HD_FOR_SIZE) {
        // value is in hd for size so value is a key
        this.HP.type = HD_FOR_SIZE[value as keyof typeof HD_FOR_SIZE]
      }
    },
    toggleDieTypeOverride() {
      this.hpDieTypeOverride = !this.hpDieTypeOverride

      this.setSize(this.size)
    },
    setHpModifier(
      hdCount: number | string | null,
      con: number | string | null
    ) {
      this.HP.HD = validateNumber(hdCount, 0)
      this.stats.CON = validateNumber(con, 0)

      if (!this.hpModifierOverride) {
        this.HP.modifier = statModifier(this.stats.CON) * this.HP.HD
      }
    },
    toggleHpModifierOverride() {
      this.hpModifierOverride = !this.hpModifierOverride

      // toggle refresh if needed
      this.setHpModifier(this.HP.HD, this.stats.CON)
    },
    setAcByCr() {
      this.AC = CR[this.CR].ac
    },
    setHdByCr() {
      const crObj = CR[this.CR]
      const hpMax = crObj.hpMax
      const gainPerHd = (this.HP.type + 1) / 2 + statModifier(this.stats.CON)

      const hd = Math.max(Math.floor(hpMax / gainPerHd), 1)
      const modifier = hd * statModifier(this.stats.CON)

      this.HP.HD = hd
      this.HP.modifier = modifier
    },
    addSpeed() {
      this.speeds.push({
        id: uuidv4(),
        type: 'walk',
        speed: 30,
        note: '',
      })
    },
    deleteSpeed(id: string) {
      const index = this.speeds.findIndex((s) => s.id === id)

      if (index !== -1) {
        this.$patch(state => {
          state.bindings = withoutEntryBindings(state.bindings, entryBindingPrefix('speeds', id))
          this.speeds.splice(index, 1)
        })
      }
    },
    addSkill(skillName: keyof typeof SKILL, proficient = true) {
      this.skills.push({
        skill: SKILL[skillName],
        key: skillName,
        proficient: proficient,
        expertise: false,
        override: false,
        overrideValue: 0,
      })
    },
    deleteSkill(skillName: keyof typeof SKILL) {
      const index = this.skills.findIndex((s) => s.key === skillName)

      if (index !== -1) {
        this.$patch(state => {
          state.bindings = withoutEntryBindings(state.bindings, `skills[key=${encodeURIComponent(String(skillName).toUpperCase())}]`)
          this.skills.splice(index, 1)
        })
      }
    },
    addTrait() {
      this.traits.push(defaultTrait())
    },
    deleteTrait(id: string) {
      const index = this.traits.findIndex((t) => t.id === id)

      if (index !== -1) {
        this.$patch(state => {
          state.bindings = withoutEntryBindings(state.bindings, entryBindingPrefix('traits', id))
          this.traits.splice(index, 1)
        })
      }
    },
    updateSpellsAtLevel(level: number, spells: string[]) {
      // first get the list of spells at the current level
      const spellsAtLevel = this.knownSpellsOfLevel(level)

      // if a spell isn't in the given list, remove it
      for (const spell of spellsAtLevel) {
        // if the spell isn't in the incoming list remove it
        if (spells.find((name) => name === spell) == null) {
          this.spellcasting.standard.splice(
            this.spellcasting.standard.indexOf(spell),
            1
          )
        }
      }

      // append new spells
      for (const spell of spells) {
        // if the spell isn't in the current list, add it
        if (spellsAtLevel.find((name) => name === spell) == null) {
          this.spellcasting.standard.push(spell)
        }
      }
    },
    addInnateSpellList() {
      this.spellcasting.atWill.push({
        id: uuidv4(),
        count: 1,
        rate: 'DAY',
        spells: [],
      })
    },
    deleteInnateSpellList(id: string) {
      const index = this.spellcasting.atWill.findIndex((aw) => aw.id === id)

      if (index !== -1) this.$patch(state => {
        state.bindings = withoutEntryBindings(state.bindings, entryBindingPrefix('spellcasting.atWill', id))
        state.spellcasting.atWill.splice(index, 1)
      })
    },
    addNewAttack() {
      this.attacks.push(defaultAttack())
    },
    deleteAttack(id: string) {
      const index = this.attacks.findIndex((a) => a.id === id)

      if (index !== -1) {
        this.$patch(state => {
          state.bindings = withoutEntryBindings(state.bindings, entryBindingPrefix('attacks', id))
          this.attacks.splice(index, 1)
        })

        // filter out legendary actions
        this.deleteLegendaryAction(id)
        this.deleteMythicAction(id)

        // check if it's in a multiattack group
        this.multiattacks.forEach((ma) => {
          ma.attacks = ma.attacks.filter((aId) => aId !== id)
        })
      }
    },
    addAdditionalDamage(id: string) {
      const attack = this.attacks.find((a) => a.id === id)

      if (attack) {
        attack.additionalDamage.push({
          id: uuidv4(),
          dice: DICE.d6,
          count: 1,
          type: '',
          note: '',
        })
      }
    },
    deleteAdditionalDamage(id: string, addId: string) {
      const attack = this.attacks.find((a) => a.id === id)

      if (attack) {
        const index = attack.additionalDamage.findIndex((a) => a.id === addId)

        if (index !== -1) {
          this.$patch(state => {
            state.bindings = withoutEntryBindings(state.bindings, `${entryBindingPrefix('attacks', id)}.${entryBindingPrefix('additionalDamage', addId)}`)
            attack.additionalDamage.splice(index, 1)
          })
        }
      }
    },
    addMultiattack() {
      this.multiattacks.push({
        id: uuidv4(),
        attacks: [],
        actions: [],
      })
    },
    deleteMultiattack(id: string) {
      const idx = this.multiattacks.findIndex((ma) => ma.id === id)

      if (idx !== -1) {
        this.multiattacks.splice(idx, 1)
      }
    },
    addMultiattackAttack(id: string, attackId: string) {
      const ma = this.multiattacks.find((ma) => ma.id === id)

      if (ma) {
        ma.attacks.push(attackId)
      }
    },
    removeMultiattackAttack(id: string, attackId: string) {
      // remove the first instance, it's equivalent
      const ma = this.multiattacks.find((ma) => ma.id === id)

      if (ma) {
        const idx = ma.attacks.findIndex((id) => attackId === id)

        if (idx !== -1) {
          ma.attacks.splice(idx, 1)
        }
      }
    },
    addMultiattackAction(id: string, actionId: string) {
      const ma = this.multiattacks.find((ma) => ma.id === id)

      if (ma) {
        ma.actions.push(actionId)
      }
    },
    removeMultiattackAction(id: string, actionId: string) {
      // remove the first instance, it's equivalent
      const ma = this.multiattacks.find((ma) => ma.id === id)

      if (ma) {
        const idx = ma.actions.findIndex((id) => actionId === id)

        if (idx !== -1) {
          ma.actions.splice(idx, 1)
        }
      }
    },
    addAction() {
      this.actions.push(defaultAction())
    },
    deleteAction(actionId: string) {
      const index = this.actions.findIndex((a) => a.id === actionId)

      if (index !== -1) {
        this.$patch(state => {
          state.bindings = withoutEntryBindings(state.bindings, entryBindingPrefix('actions', actionId))
          this.actions.splice(index, 1)
        })

        // check if it's in a legendary action
        this.deleteLegendaryAction(actionId)
        this.deleteMythicAction(actionId)

        // check if it's in a multiattack group
        this.multiattacks.forEach((ma) => {
          ma.actions = ma.actions.filter((aId) => aId !== actionId)
        })
      }
    },
    addLegendaryAction(actionId: string, cost = 1) {
      if (this.legendaryActions.count === 0) {
        this.legendaryActions.count = 3
      }
      if (
        this.legendaryActions.actions.find((la) => la.actionId === actionId) ==
        null
      ) {
        this.legendaryActions.actions.push({
          actionId,
          cost,
        })
      }
    },
    createStandaloneLegendaryAction(name = 'New Legendary Action', description = '', cost = 1) {
      if (this.legendaryActions.count === 0) {
        this.legendaryActions.count = 3
      }
      const act = defaultAction()
      act.name = name
      act.description = description || '{NAME} makes a Perception check or moves up to half its speed.'
      act.legendaryOnly = true
      act.customPreamble = true
      this.actions.push(act)
      this.legendaryActions.actions.push({
        actionId: act.id,
        cost,
      })
      return act.id
    },
    deleteLegendaryAction(actionId: string) {
      const idx = this.legendaryActions.actions.findIndex(
        (a) => a.actionId === actionId
      )

      if (idx !== -1) {
        this.legendaryActions.actions.splice(idx, 1)
      }
    },
    addMythicAction(actionId: string) {
      if (
        this.mythicActions.actions.find((la) => la.actionId === actionId) ==
        null
      ) {
        this.mythicActions.actions.push({
          actionId,
          cost: 1,
        })
      }
    },
    deleteMythicAction(actionId: string) {
      const idx = this.mythicActions.actions.findIndex(
        (a) => a.actionId === actionId
      )

      if (idx !== -1) {
        this.mythicActions.actions.splice(idx, 1)
      }
    },
    addReaction() {
      this.reactions.push({
        id: uuidv4(),
        name: 'New Reaction',
        description: '',
        limitedUse: {
          count: 0,
          rate: 'DAY',
        },
        trigger: '',
      })
    },
    deleteReaction(reactionId: string) {
      const idx = this.reactions.findIndex((r) => r.id === reactionId)

      if (idx !== -1) {
        this.$patch(state => {
          state.bindings = withoutEntryBindings(state.bindings, entryBindingPrefix('reactions', reactionId))
          this.reactions.splice(idx, 1)
        })
      }
    },
    addLairAction() {
      this.lairActions.push({
        id: uuidv4(),
        description: '',
        crAnnotation: defaultCrAnnotation(),
      })
    },
    deleteLairAction(actionId: string) {
      const idx = this.lairActions.findIndex((la) => la.id === actionId)

      if (idx !== -1) {
        this.$patch(state => {
          state.bindings = withoutEntryBindings(state.bindings, entryBindingPrefix('lairActions', actionId))
          this.lairActions.splice(idx, 1)
        })
      }
    },
    addRandomTable() {
      const id = uuidv4()
      if (!Array.isArray(this.randomTables)) this.randomTables = []
      this.randomTables.push({ id, title: '', dice: '1d6', rows: [{ id: uuidv4(), min: 1, max: 6, text: '' }] })
    },
    replaceRandomTableRows(tableId: string, input: string) {
      const table = (this.randomTables ?? []).find(t => t.id === tableId)
      if (!table) return false
      const reserved = (this.randomTables ?? []).flatMap(t => [t.id, ...t.rows.map(row => row.id)])
      const preview = previewRandomTableImport(table, input, reserved)
      if (!preview.canApply) return false
      table.rows = preview.table.rows
      return true
    },
    deleteRandomTable(tableId: string) {
      const idx = (this.randomTables ?? []).findIndex((t) => t.id === tableId)
      if (idx !== -1) this.randomTables!.splice(idx, 1)
    },
    addRandomTableRow(tableId: string) {
      const table = (this.randomTables ?? []).find((t) => t.id === tableId)
      if (table) table.rows.push(nextRandomTableRow(table, uuidv4()))
    },
    deleteRandomTableRow(tableId: string, rowId: string) {
      const table = (this.randomTables ?? []).find((t) => t.id === tableId)
      if (table) table.rows = table.rows.filter((r) => r.id !== rowId)
    },
    addRegionalEffect() {
      this.regionalEffects.push({
        id: uuidv4(),
        description: '',
      })
    },
    deleteRegionalEffect(effectId: string) {
      const idx = this.regionalEffects.findIndex((re) => re.id === effectId)

      if (idx !== -1) {
        this.regionalEffects.splice(idx, 1)
      }
    },
    validate() {
      const { updateMonster } = useFileLoader()
      const $q = useQuasar()

      updateMonster(this.$state)
      const valid = validate(this.$state, SCHEMA['9'])

      if (!valid.valid) {
        console.error(valid.errors.map((e) => e.toString()))

        $q.notify({
          message:
            'Monster failed to validate after update. Please submit a bug report and include the monster file.',
          color: 'negative',
        })

        $q.notify({
          message: `Errors: ${valid.errors
            .map((e) => e.toString())
            .join('\n')}`,
          color: 'negative',
        })
      }
    },
    addTool(name: string, stat: DndStat = 'DEX') {
      if (!Array.isArray(this.tools)) {
        this.tools = []
      }
      this.tools.push({
        id: uuidv4(),
        name,
        proficient: true,
        expertise: false,
        stat,
        override: false,
        overrideValue: 0,
        advantage: false,
        disadvantage: false,
        condition: '',
      })
    },
    deleteTool(id: string) {
      if (!Array.isArray(this.tools)) return
      const idx = this.tools.findIndex((t) => t.id === id)
      if (idx !== -1) {
        this.$patch(state => {
          state.bindings = withoutEntryBindings(state.bindings, entryBindingPrefix('tools', id))
          this.tools.splice(idx, 1)
        })
      }
    },
    addVillainAction(round: 1 | 2 | 3 = 1) {
      if (!Array.isArray(this.villainActions)) this.villainActions = []
      this.villainActions.push({
        id: uuidv4(),
        round,
        name: `Villain Action (Round ${round})`,
        description: '',
        trigger: "At the end of another creature's turn",
      })
    },
    deleteVillainAction(id: string) {
      if (!Array.isArray(this.villainActions)) return
      const idx = this.villainActions.findIndex((a) => a.id === id)
      if (idx !== -1) this.$patch(state => {
        state.bindings = withoutEntryBindings(state.bindings, entryBindingPrefix('villainActions', id))
        this.villainActions.splice(idx, 1)
      })
    },
    addBloodiedAction() {
      if (!Array.isArray(this.bloodiedActions)) this.bloodiedActions = []
      this.bloodiedActions.push({
        id: uuidv4(),
        name: 'Bloodied Surge',
        triggerType: 'immediate_reaction',
        description: 'When reduced to half hit points or fewer, immediately recharges all abilities and moves up to its speed.',
      })
    },
    deleteBloodiedAction(id: string) {
      if (!Array.isArray(this.bloodiedActions)) return
      const idx = this.bloodiedActions.findIndex((a) => a.id === id)
      if (idx !== -1) this.bloodiedActions.splice(idx, 1)
    },
    addReactiveAction() {
      if (!Array.isArray(this.reactiveActions)) this.reactiveActions = []
      this.reactiveActions.push({
        id: uuidv4(),
        name: 'Reactive Parry',
        trigger: 'When a creature within reach misses with a melee attack',
        description: 'Retaliates with a strike or gains +3 AC.',
        usesPerRound: 1,
      })
    },
    deleteReactiveAction(id: string) {
      if (!Array.isArray(this.reactiveActions)) return
      const idx = this.reactiveActions.findIndex((a) => a.id === id)
      if (idx !== -1) this.$patch(state => {
        state.bindings = withoutEntryBindings(state.bindings, entryBindingPrefix('reactiveActions', id))
        this.reactiveActions.splice(idx, 1)
      })
    },
    addComboAction() {
      if (!Array.isArray(this.comboActions)) this.comboActions = []
      this.comboActions.push({
        id: uuidv4(),
        name: 'Grab and Crush',
        leadAction: 'Bite',
        followUpAction: 'Constrict',
        condition: 'Target is grappled',
        description: 'Immediately follows up with automatic crushing damage.',
      })
    },
    deleteComboAction(id: string) {
      if (!Array.isArray(this.comboActions)) return
      const idx = this.comboActions.findIndex((a) => a.id === id)
      if (idx !== -1) this.comboActions.splice(idx, 1)
    },
    addAnatomyPart(name = 'Wings') {
      if (!Array.isArray(this.anatomyParts)) this.anatomyParts = []
      this.anatomyParts.push({
        id: uuidv4(),
        name,
        hp: 30,
        ac: 14,
        threshold: 10,
        breakEffect: 'Disabled: Loses flying speed when reduced to 0 HP.',
      })
    },
    deleteAnatomyPart(id: string) {
      if (!Array.isArray(this.anatomyParts)) return
      const idx = this.anatomyParts.findIndex((p) => p.id === id)
      if (idx !== -1) this.$patch(state => {
        state.bindings = withoutEntryBindings(state.bindings, entryBindingPrefix('anatomyParts', id))
        this.anatomyParts.splice(idx, 1)
      })
    },
    addTrackEvent(round = 1) {
      if (!this.runehammerTrack) {
        this.runehammerTrack = { enabled: true, timerDie: 'd4', name: 'Escalation Track', events: [] }
      }
      this.runehammerTrack.events.push({
        id: uuidv4(),
        round,
        name: `Escalation Round ${round}`,
        description: '',
      })
    },
    deleteTrackEvent(id: string) {
      if (!this.runehammerTrack?.events) return
      const idx = this.runehammerTrack.events.findIndex((e) => e.id === id)
      if (idx !== -1) this.$patch(state => {
        state.bindings = withoutEntryBindings(state.bindings, entryBindingPrefix('runehammerTrack.events', id))
        this.runehammerTrack.events.splice(idx, 1)
      })
    },
    swapItems(target: SwappableField, source: number, dest: number) {
      const targetArray = this[target] as unknown[] | undefined
      if (!Array.isArray(targetArray)) return
      if (source < 0 || source >= targetArray.length || dest < 0 || dest >= targetArray.length) return

      const tmp = targetArray[dest]
      targetArray[dest] = targetArray[source]
      targetArray[source] = tmp
    },
    moveItemUp(target: SwappableField, source: number) {
      if (source <= 0) return
      this.swapItems(target, source, source - 1)
    },
    moveItemDown(target: SwappableField, source: number) {
      const targetArray = this[target] as unknown[] | undefined
      if (!Array.isArray(targetArray) || source >= targetArray.length - 1) return
      this.swapItems(target, source, source + 1)
    },
  },
  persist: {
    // this should be changed to app.monster after parity reached, as it will then read all of the
    // existing data correctly
    key: 'app.monster',
  },
})
