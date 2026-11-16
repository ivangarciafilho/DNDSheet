import type { Monster, CrActionInfo, DndAttack, MonsterAction } from 'src/components/models'
import type { monsterStateGetters } from './monster-state-getters'
import { union } from 'lodash'
import { useSpellsStore } from './spells-store'
import { CrDamageInfo } from 'src/components/models'

type StateGetters = typeof monsterStateGetters
// The slice of the monster store these CR getters read through `this`: state plus the getters they call.
export interface MonsterCrThis extends Monster {
  actionName: ReturnType<StateGetters['actionName']>
  attackName: ReturnType<StateGetters['attackName']>
  attackModifier: ReturnType<StateGetters['attackModifier']>
  expectedAttackDamage: ReturnType<StateGetters['expectedAttackDamage']>
  spellSave: number
  expectedMultiattackDamage: (id: string) => number
  getLimitedMultiattackVariants: (id: string) => CrActionInfo[]
  attackOrActionFromId: (id: string) => DndAttack | MonsterAction | undefined
}

// CR damage getters, spread into the monster store's getters (C1b split).
export const monsterCrGetters = {
  expectedMultiattackDamage(this: MonsterCrThis): (id: string) => number {
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
  getLimitedMultiattackVariants(this: MonsterCrThis): (id: string) => CrActionInfo[] {
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

        // DMG CR method: offense is averaged over the first three rounds of combat.
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

          // English label; localisation is tracked in C5.
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
  attackOrActionFromId(this: MonsterCrThis): (
    id: string
  ) => DndAttack | MonsterAction | undefined {
    return (id: string) => {
      const attack = this.attacks.find((a) => a.id === id)
      if (attack != null) return attack

      const action = this.actions.find((a) => a.id === id)
      return action
    }
  },
  attackInfo(this: MonsterCrThis): CrDamageInfo {
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
          ? (this.spellcasting.standard as unknown as unknown[][]).flat().map((s) => typeof s === 'string' ? s : (s as { name?: string } | null)?.name).filter((s): s is string => Boolean(s))
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
}
