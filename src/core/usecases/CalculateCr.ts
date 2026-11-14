import {
  CR,
  type CrTier,
  getCrByAc,
  getCrByAttack,
  getCrByDamage,
  getCrByDc,
  getCrByHp,
  getCrByNumber,
} from '../domain/cr-tables.ts'
import {
  avgHP,
  avgRoll,
  renderBonus,
  statModifier,
} from '../domain/math-utils.ts'
import type {
  CrActionInfo,
  CrAttackInfo,
  CrDamageInfo,
  CrLegendaryInfo,
  CrSpellInfo,
  CrTraitInfo,
  DndAttack,
  DndSpell,
  Monster,
  MonsterAction,
} from '../domain/types.ts'
import { structuredOutcomeDamage } from '../domain/cr-structured-damage.ts'
import { formulaContextForMonster } from '../domain/formula-context.ts'
import { structuredAttackBonus } from '../domain/structured-attack.ts'

/** Damage an action contributes to a CR round: an explicit CR annotation wins, else its structured outcomes (A9.12). */
function actionCrDamage(monster: Monster, action: MonsterAction): number {
  if (action.crAnnotation?.include) return action.crAnnotation.maxDamage || 0
  return structuredOutcomeDamage(action, formulaContextForMonster(monster as never))
}

export type CrInfo =
  | CrAttackInfo
  | CrActionInfo
  | CrSpellInfo
  | CrTraitInfo
  | CrLegendaryInfo

export type CrActionSequence = CrInfo[]

export interface CrModifierEntry {
  title: string
  subtitle: string
  type: string
  value: string
}

export interface CrRoundSimulation {
  totalDamage: number
  actions: CrActionSequence
}

export interface FilteredToHitAction {
  name: string
  type: string
  toHit: number
  toHitRender: string
}

export interface FilteredDcAction {
  name: string
  type: string
  save: number
}

export interface CrEvaluationResult {
  actionSequence: CrRoundSimulation[]
  damagePerRound: number
  damageCr: CrTier
  maxDc: number
  maxAttack: number
  maxAttackRender: string
  attackCr: CrTier
  dcCr: CrTier
  attackCrDelta: string
  dcStepDelta: number
  attackStepDelta: number
  useDc: boolean
  offensiveCr: CrTier
  filteredToHitActions: FilteredToHitAction[]
  actionsBelowThreshold: number
  filteredDcActions: FilteredDcAction[]
  dcsBelowThreshold: number
  ehp: number
  hpCr: CrTier
  ehpModifierList: CrModifierEntry[]
  eac: number
  acCr: CrTier
  acCrDelta: string
  eacModifierList: CrModifierEntry[]
  defensiveCr: CrTier
  estimatedCr: CrTier
  attackInfo: CrDamageInfo
}

export function expectedAttackDamage(
  monster: Monster,
  attack: DndAttack
): number {
  if (!attack || !attack.damage) return 0

  const statKey = attack.damage.modifier?.stat || 'STR'
  const statVal = monster.stats?.[statKey] ?? 10

  const primary =
    avgRoll(attack.damage.count || 0, attack.damage.dice || 0) +
    (attack.damage.modifier?.override
      ? attack.damage.modifier.overrideValue || 0
      : statModifier(statVal))

  let secondary = 0
  if (attack.alternateDamage) {
    const altStatKey = attack.alternateDamage.modifier?.stat || 'STR'
    const altStatVal = monster.stats?.[altStatKey] ?? 10
    secondary =
      avgRoll(attack.alternateDamage.count || 0, attack.alternateDamage.dice || 0) +
      (attack.alternateDamage.modifier?.override
        ? attack.alternateDamage.modifier.overrideValue || 0
        : statModifier(altStatVal))
  }

  const base = attack.alternateDamage?.active
    ? Math.max(primary, secondary)
    : primary

  const extra = (attack.additionalDamage || [])
    .map((a) => avgRoll(a.count || 0, a.dice || 0))
    .reduce((acc, current) => acc + current, 0)

  const targets = attack.targets != null ? attack.targets : 1
  return (base + extra) * targets
}

export function attackModifier(monster: Monster, attack: DndAttack): number {
  if (!attack || !attack.modifier) return 0
  if (attack.modifier.override) {
    return attack.modifier.overrideValue || 0
  }
  const prof = attack.modifier.proficient ? monster.proficiency || 0 : 0
  const statKey = attack.modifier.stat || 'STR'
  const statVal = monster.stats?.[statKey] ?? 10
  return statModifier(statVal) + prof
}

export function spellSave(monster: Monster): number {
  if (!monster.spellcasting) return 10
  if (monster.spellcasting.save?.override) {
    return monster.spellcasting.save.overrideValue || 10
  }
  const statKey = monster.spellcasting.stat || 'INT'
  const statVal = monster.stats?.[statKey] ?? 10
  const prof = monster.proficiency || 2
  return 8 + prof + statModifier(statVal)
}

export function spellAttackModifier(monster: Monster): number {
  if (!monster.spellcasting) return 2
  if (monster.spellcasting.attack?.override) {
    return monster.spellcasting.attack.overrideValue || 2
  }
  const statKey = monster.spellcasting.stat || 'INT'
  const statVal = monster.stats?.[statKey] ?? 10
  const prof = monster.proficiency || 2
  return prof + statModifier(statVal)
}

export function buildAttackInfo(
  monster: Monster,
  spells: Record<string, DndSpell> = {}
): CrDamageInfo {
  const data: CrDamageInfo = {
    attacks: [],
    actions: [],
    legendary: [],
    traits: [],
    spells: [],
    lairActions: [],
    legendaryCount: monster.legendaryActions?.count || 0,
  }

  // Attacks
  for (const attack of monster.attacks || []) {
    data.attacks.push({
      name: attack.name,
      damage: expectedAttackDamage(monster, attack),
      toHit: attackModifier(monster, attack),
      save: attack.save,
      type: 'Attack',
    })
  }

  // Multiattacks
  const allAttacks = monster.attacks || []
  const allActions = monster.actions || []

  for (const ma of monster.multiattacks || []) {
    const attackNames = (ma.attacks || []).map((id) => {
      const a = allAttacks.find((atk) => atk.id === id)
      return a ? a.name : ''
    }).filter(Boolean)

    const actionNames = (ma.actions || []).map((id) => {
      const a = allActions.find((act) => act.id === id)
      return a ? a.name : ''
    }).filter(Boolean)

    const limitedActions = (ma.actions || [])
      .map((id) => allActions.find((a) => a.id === id))
      .filter((action): action is MonsterAction => {
        return (
          action != null &&
          (action.limitedUse?.count > 0 || action.recharge !== '')
        )
      })

    if (limitedActions.length === 0) {
      const attackDmg = (ma.attacks || []).reduce((acc, id) => {
        const a = allAttacks.find((atk) => atk.id === id)
        return acc + (a ? expectedAttackDamage(monster, a) : 0)
      }, 0)

      const actionDmg = (ma.actions || []).reduce((acc, id) => {
        const a = allActions.find((act) => act.id === id)
        return (
          acc +
          (a ? actionCrDamage(monster, a) : 0)
        )
      }, 0)

      data.attacks.push({
        name: `Multiattack: ${[...attackNames, ...actionNames].join(', ')}`,
        damage: attackDmg + actionDmg,
        save: 0,
        toHit: 0,
        type: 'Multiattack',
      })
    } else {
      // Limited multiattack variants across up to 3 turns
      const baseAttackDmg = (ma.attacks || []).reduce((acc, id) => {
        const a = allAttacks.find((atk) => atk.id === id)
        return acc + (a ? expectedAttackDamage(monster, a) : 0)
      }, 0)

      const unlimitedActions = (ma.actions || [])
        .map((id) => allActions.find((a) => a.id === id))
        .filter((a): a is MonsterAction => a != null && (a.limitedUse?.count === 0 || !a.limitedUse) && a.recharge === '')

      const unlimitedDmg = unlimitedActions.reduce(
        (acc, a) => acc + actionCrDamage(monster, a),
        0
      )
      const unlimitedNames = unlimitedActions.map((a) => a.name)

      let limList = limitedActions.map((a) => ({
        action: a,
        uses: a.recharge !== '' ? 1 : (a.limitedUse?.count || 1),
      }))

      for (let i = 0; i < 3; i++) {
        const currentLimDmg = limList.reduce(
          (acc, la) =>
            acc + actionCrDamage(monster, la.action),
          0
        )
        const name = `Multiattack: ${[
          ...attackNames,
          ...unlimitedNames,
          ...limList.map((la) => la.action.name),
        ].join(', ')}`

        data.actions.push({
          name,
          damage: baseAttackDmg + unlimitedDmg + currentLimDmg,
          toHit: 0,
          save: 0,
          limited: true,
          uses: 1,
          type: 'LimitedMultiattack',
        })

        limList.forEach((la) => (la.uses -= 1))
        limList = limList.filter((la) => la.uses > 0)
      }
    }
  }

  data.attacks.sort((a, b) => b.damage - a.damage)

  // Actions
  for (const action of monster.actions || []) {
    if (action.crAnnotation?.include && !action.legendaryOnly) {
      data.actions.push({
        name: action.name,
        damage:
          (action.crAnnotation.maxDamage || 0) *
          (action.crAnnotation.multitarget ? 2 : 1),
        limited: (action.limitedUse?.count || 0) > 0 || action.recharge !== '',
        uses: action.recharge !== '' ? 1 : (action.limitedUse?.count || 0),
        save: action.crAnnotation.maxSave || 0,
        toHit: action.crAnnotation.maxModifier || 0,
        type: 'Action',
      })
    } else if (!action.crAnnotation?.include && !action.legendaryOnly) {
      // A9.12: unannotated actions still count when their structured outcomes carry damage.
      const damage = structuredOutcomeDamage(action, formulaContextForMonster(monster as never))
      if (damage > 0) {
        data.actions.push({
          name: action.name,
          damage,
          limited: (action.limitedUse?.count || 0) > 0 || action.recharge !== '',
          uses: action.recharge !== '' ? 1 : (action.limitedUse?.count || 0),
          save: 0,
          toHit: structuredAttackBonus(action, monster as never) ?? 0,
          type: 'Action',
        })
      }
    }
  }
  data.actions.sort((a, b) => b.damage - a.damage)

  // Traits
  for (const trait of monster.traits || []) {
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
  data.traits.sort((a, b) => b.damage - a.damage)

  // Opted-in Reactions (never alters CR unless reaction.crAnnotation.include is true)
  for (const reaction of monster.reactions || []) {
    if (reaction.crAnnotation?.include) {
      data.actions.push({
        name: reaction.name,
        damage:
          (reaction.crAnnotation.maxDamage || 0) *
          (reaction.crAnnotation.multitarget ? 2 : 1),
        limited: (reaction.limitedUse?.count || 0) > 0 || (reaction.recharge ?? '') !== '',
        uses: reaction.limitedUse?.count || 0,
        save: reaction.crAnnotation.maxSave || 0,
        toHit: reaction.crAnnotation.maxModifier || 0,
        type: 'Action',
      })
    }
  }
  data.actions.sort((a, b) => b.damage - a.damage)

  // Lair Actions
  for (let idx = 0; idx < (monster.lairActions || []).length; idx++) {
    const la = monster.lairActions[idx]
    if (la.crAnnotation?.include) {
      data.lairActions.push({
        name: `Lair Action ${idx + 1}`,
        damage:
          (la.crAnnotation.maxDamage || 0) * (la.crAnnotation.multitarget ? 2 : 1),
        save: la.crAnnotation.maxSave || 0,
        toHit: la.crAnnotation.maxModifier || 0,
        type: 'Lair Action',
      })
    }
  }
  data.lairActions.sort((a, b) => b.damage - a.damage)

  // Legendary Actions
  for (const la of monster.legendaryActions?.actions || []) {
    const maybeAction = monster.actions.find((a) => a.id === la.actionId)
    if (maybeAction != null) {
      if (maybeAction.crAnnotation?.include) {
        data.legendary.push({
          name: maybeAction.name,
          damage:
            (maybeAction.crAnnotation.maxDamage || 0) *
            (maybeAction.crAnnotation.multitarget ? 2 : 1),
          limited:
            (maybeAction.limitedUse?.count || 0) > 0 || maybeAction.recharge !== '',
          uses: maybeAction.limitedUse?.count || 0,
          save: maybeAction.crAnnotation.maxSave || 0,
          toHit: maybeAction.crAnnotation.maxModifier || 0,
          cost: la.cost,
          type: 'Legendary',
        })
      }
    } else {
      const maybeAttack = monster.attacks.find((a) => a.id === la.actionId)
      if (maybeAttack != null) {
        data.legendary.push({
          name: maybeAttack.name,
          damage: expectedAttackDamage(monster, maybeAttack),
          toHit: attackModifier(monster, maybeAttack),
          save: maybeAttack.save,
          cost: la.cost,
          limited: false,
          uses: 1,
          type: 'Legendary',
        })
      }
    }
  }
  data.legendary.sort((a, b) => b.damage - a.damage)

  // Spells
  const allSpellIds = Array.from(
    new Set([
      ...(monster.spellcasting?.standard || []),
      ...(monster.spellcasting?.atWill || []).flatMap((a) => a.spells || []),
    ])
  )

  const sSave = spellSave(monster)
  for (const id of allSpellIds) {
    const spell = spells[id]
    if (spell) {
      const casterLvl = monster.spellcasting?.level || 1
      const cantripMultiplier =
        spell.level === 0 ? Math.max(1, 1 + Math.floor((casterLvl + 1) / 6)) : 1
      const dmg = spell.damage * cantripMultiplier

      data.spells.push({
        name: spell.name,
        damage: spell.multitarget ? dmg * 2 : dmg,
        save: sSave,
        type: 'Spell',
      })
    }
  }
  data.spells.sort((a, b) => b.damage - a.damage)

  return data
}

export function legendaryCombo(
  la: CrLegendaryInfo[],
  count: number
): { totalDamage: number; actions: CrLegendaryInfo[] } {
  const returnData: { totalDamage: number; actions: CrLegendaryInfo[] } = {
    totalDamage: 0,
    actions: [],
  }

  if (la.length === 0 || count <= 0) return returnData

  let currentActions = Array.from(la)
  while (count > 0 && currentActions.length > 0) {
    let highestCost = 1
    let highestCostDamage = 0

    for (const action of currentActions) {
      const safeCost = Math.max(1, action.cost)
      if (safeCost >= highestCost) {
        highestCost = safeCost
        if (action.damage > highestCostDamage) {
          highestCostDamage = action.damage
        }
      }
    }

    const adjustedDamageActions = currentActions.map((a) => {
      const safeCost = Math.max(a.cost, 1)
      const multiplier = Math.floor(highestCost / safeCost)
      return {
        adjustedDamage: a.damage * multiplier,
        addCount: multiplier,
        ...a,
        cost: safeCost,
      }
    })

    adjustedDamageActions.sort((a, b) => b.adjustedDamage - a.adjustedDamage)

    const top = adjustedDamageActions[0]
    for (let i = 0; i < top.addCount && count >= top.cost; i++) {
      returnData.totalDamage += top.damage
      returnData.actions.push(top)
      count -= top.cost
    }

    currentActions = currentActions.filter((a) => a.cost <= count)
  }

  return returnData
}

export function resMultiplier(cr: number, monster: Monster): number {
  if (!monster.resistances || monster.resistances.length === 0) return 1
  if (cr <= 4) return 2
  if (cr <= 10) return 1.5
  if (cr <= 16) return 1.25
  return 1
}

export function immuneMultiplier(cr: number, monster: Monster): number {
  if (!monster.immunities || monster.immunities.length === 0) return 1
  if (cr <= 10) return 2
  if (cr <= 16) return 1.5
  return 1.25
}

export function vulnMultiplier(monster: Monster): number {
  if (monster.vulnerabilities && monster.vulnerabilities.length > 0) {
    return 0.5
  }
  return 1
}

export function calculateCr(
  monster: Monster,
  spells: Record<string, DndSpell> = {}
): CrEvaluationResult {
  const attackInfo = buildAttackInfo(monster, spells)
  const data = JSON.parse(JSON.stringify(attackInfo)) as CrDamageInfo
  const legendaryRound = legendaryCombo(data.legendary, data.legendaryCount)

  const actionSequence: CrRoundSimulation[] = []
  let heldLairAction: CrAttackInfo | null = null

  for (let i = 0; i < 3; i++) {
    const round: CrRoundSimulation = {
      totalDamage: 0,
      actions: [],
    }

    const allActions = ([] as (CrAttackInfo | CrActionInfo | CrSpellInfo)[]).concat(
      data.attacks,
      data.actions,
      data.spells
    )
    allActions.sort((a, b) => b.damage - a.damage)

    const action = allActions.length > 0 ? allActions[0] : null
    if (action) {
      round.actions.push(action)
      round.totalDamage += action.damage

      if ('limited' in action && action.limited) {
        action.uses -= 1
        if (action.uses <= 0) {
          const actIdx = data.actions.findIndex((a) => a.name === action.name)
          if (actIdx !== -1) data.actions.splice(actIdx, 1)
        }
      } else if (action.type === 'Spell') {
        const spellEntry = spells[action.name]
        if (spellEntry && spellEntry.level > 0) {
          const spIdx = data.spells.findIndex((s) => s.name === action.name)
          if (spIdx !== -1) data.spells.splice(spIdx, 1)
        }
      }
    }

    // Trait damage
    for (const trait of data.traits) {
      if (trait.damage > 0) {
        round.actions.push(trait)
        round.totalDamage += trait.damage
        if (trait.limited && trait.uses > 0) {
          trait.uses -= 1
          trait.remove = trait.uses <= 0
        }
      }
    }
    data.traits = data.traits.filter((t) => !t.remove)

    // Lair action
    if (data.lairActions.length > 0) {
      const la = data.lairActions[0]
      if (la.damage > 0) {
        round.actions.push(la)
        round.totalDamage += la.damage
      }
      if (heldLairAction) {
        data.lairActions.push(heldLairAction)
      }
      heldLairAction = la
      data.lairActions = data.lairActions.slice(1)
      data.lairActions.sort((a, b) => b.damage - a.damage)
    }

    // Legendary actions
    round.totalDamage += legendaryRound.totalDamage
    round.actions = round.actions.concat(legendaryRound.actions)

    actionSequence.push(round)
  }

  const damagePerRound =
    actionSequence.length >= 3
      ? (actionSequence[0].totalDamage +
          actionSequence[1].totalDamage +
          actionSequence[2].totalDamage) /
        3
      : 0

  const damageCr = getCrByDamage(damagePerRound)

  // Max DC & To-Hit
  const allActionsForDc: CrActionSequence = ([] as CrActionSequence).concat(
    attackInfo.attacks,
    attackInfo.actions,
    attackInfo.traits,
    attackInfo.legendary,
    attackInfo.lairActions
  )

  const isSpellcaster =
    (monster.spellcasting?.standard || []).length > 0 ||
    (monster.spellcasting?.atWill || []).length > 0

  if (isSpellcaster) {
    allActionsForDc.push({
      name: 'Spell Save DC',
      type: 'Spell',
      damage: 0,
      save: spellSave(monster),
    })
  }
  allActionsForDc.sort((a, b) => (b.save ?? 0) - (a.save ?? 0))
  const maxDc = allActionsForDc.length > 0 ? (allActionsForDc[0].save ?? 0) : 0

  const allActionsForToHit = allActionsForDc.filter((a) => a.type !== 'Spell') as (
    | CrAttackInfo
    | CrActionInfo
    | CrTraitInfo
    | CrLegendaryInfo
  )[]

  if (isSpellcaster) {
    allActionsForToHit.push({
      name: 'Spell Attack Modifier',
      type: 'Attack',
      damage: 0,
      save: 0,
      toHit: spellAttackModifier(monster),
    })
  }
  allActionsForToHit.sort((a, b) => (b.toHit ?? 0) - (a.toHit ?? 0))
  const maxAttack = allActionsForToHit.length > 0 ? (allActionsForToHit[0].toHit ?? 0) : 0
  const maxAttackRender = renderBonus(maxAttack)

  const dcStepDelta = maxDc - damageCr.saveDc
  const attackStepDelta = maxAttack - damageCr.attack

  const dcCr = getCrByDc(maxDc)
  const attackCr = getCrByAttack(maxAttack)
  const useDc = dcCr.numeric >= attackCr.numeric

  const filteredDcActions: FilteredDcAction[] = allActionsForDc
    .filter((a) => (a.save ?? 0) > 0)
    .map((a) => ({
      name: a.name,
      type: a.type,
      save: a.save ?? 0,
    }))
  const dcsBelowThreshold = allActionsForDc.length - filteredDcActions.length

  const filteredToHitActions: FilteredToHitAction[] = allActionsForToHit
    .map((a) => ({
      name: a.name,
      type: a.type,
      toHit: a.toHit ?? 0,
      toHitRender: renderBonus(a.toHit ?? 0),
    }))
    .filter((a) => a.toHit > 0)
  const actionsBelowThreshold = allActionsForToHit.length - filteredToHitActions.length

  const offensiveDelta = (useDc ? dcStepDelta : attackStepDelta) / 2
  const offensiveStep =
    damageCr.index +
    (offensiveDelta < 0 ? Math.ceil(offensiveDelta) : Math.floor(offensiveDelta))
  const offensiveCr = Number.isFinite(offensiveStep)
    ? CR[Math.max(0, Math.min(CR.length - 1, offensiveStep))]
    : damageCr
  const attackCrDelta = renderBonus(offensiveCr.numeric - damageCr.numeric)

  // Defensive CR calculation
  const estCr = monster.autoEstimateDefenseCr ? offensiveCr : CR[monster.CR] || offensiveCr
  const resMult = resMultiplier(estCr.numeric, monster)
  const immMult = immuneMultiplier(estCr.numeric, monster)
  const vulnMult = vulnMultiplier(monster)

  const ehpModifierList: CrModifierEntry[] = []
  if (resMult > 1) {
    ehpModifierList.push({
      title: 'Resistances',
      subtitle: `at CR ${estCr.cr}`,
      type: 'HP',
      value: `x${resMult}`,
    })
  }
  if (immMult > 1) {
    ehpModifierList.push({
      title: 'Immunities',
      subtitle: `at CR ${estCr.cr}`,
      type: 'HP',
      value: `x${immMult}`,
    })
  }
  if (vulnMult < 1) {
    ehpModifierList.push({
      title: 'Vulnerabilities',
      subtitle: `at CR ${estCr.cr}`,
      type: 'HP',
      value: `x${vulnMult}`,
    })
  }

  // Trait, action, and reaction multipliers
  for (const [label, entries] of [
    ['Action', monster.actions || []],
    ['Reaction', monster.reactions || []],
    ['Trait', monster.traits || []],
  ] as const) {
    for (const entry of entries) {
      const ann = entry.crAnnotation
      if (ann?.include && typeof ann.ehpMultiplier === 'number' && Number.isFinite(ann.ehpMultiplier) && ann.ehpMultiplier !== 1) {
        ehpModifierList.push({
          title: entry.name,
          subtitle: label,
          type: label,
          value: `x${ann.ehpMultiplier.toFixed(1)}`,
        })
      }
    }
  }

  // Trait, action, and reaction additions
  for (const [label, entries] of [
    ['Action', monster.actions || []],
    ['Reaction', monster.reactions || []],
    ['Trait', monster.traits || []],
  ] as const) {
    for (const entry of entries) {
      const ann = entry.crAnnotation
      if (ann?.include && typeof ann.ehpModifier === 'number' && Number.isFinite(ann.ehpModifier) && ann.ehpModifier !== 0) {
        ehpModifierList.push({
          title: entry.name,
          subtitle: label,
          type: label,
          value: renderBonus(ann.ehpModifier),
        })
      }
    }
  }

  // Calculate EHP
  const rawBaseHp = avgHP(monster.HP)
  const baseHp = Number.isFinite(rawBaseHp) ? rawBaseHp : 1
  let ehpVal = baseHp * resMult * immMult * vulnMult

  for (const entries of [monster.actions || [], monster.reactions || [], monster.lairActions || [], monster.traits || []]) {
    for (const entry of entries) {
      if (entry.crAnnotation?.include && typeof entry.crAnnotation.ehpMultiplier === 'number' && Number.isFinite(entry.crAnnotation.ehpMultiplier)) {
        ehpVal *= entry.crAnnotation.ehpMultiplier
      }
    }
  }

  for (const entries of [monster.actions || [], monster.reactions || [], monster.lairActions || [], monster.traits || []]) {
    for (const entry of entries) {
      if (entry.crAnnotation?.include && typeof entry.crAnnotation.ehpModifier === 'number' && Number.isFinite(entry.crAnnotation.ehpModifier)) {
        ehpVal += entry.crAnnotation.ehpModifier
      }
    }
  }

  if (!Number.isFinite(ehpVal) || ehpVal <= 0) ehpVal = 1

  // Calculate EAC
  const saveCount = Object.values(monster.saves || {}).filter(
    (s) => s.proficient || (s.override && s.overrideValue > 0)
  ).length

  const saveAcBonus = saveCount < 3 ? 0 : saveCount < 5 ? 2 : 4
  const eacModifierList: CrModifierEntry[] = []

  if (saveAcBonus > 0) {
    eacModifierList.push({
      title: 'Saving Throws',
      subtitle: `${saveCount} Saves`,
      type: 'HP',
      value: `+${saveAcBonus}`,
    })
  }

  const rawAc = Number.isFinite(monster.AC) ? monster.AC : (parseInt(String(monster.AC), 10) || 10)
  let eacVal = rawAc + saveAcBonus
  for (const [label, entries] of [
    ['Action', monster.actions || []],
    ['Reaction', monster.reactions || []],
    ['Trait', monster.traits || []],
  ] as const) {
    for (const entry of entries) {
      if (entry.crAnnotation?.include && typeof entry.crAnnotation.acModifier === 'number' && Number.isFinite(entry.crAnnotation.acModifier) && entry.crAnnotation.acModifier !== 0) {
        eacModifierList.push({
          title: entry.name,
          subtitle: label,
          type: label,
          value: renderBonus(entry.crAnnotation.acModifier),
        })
        eacVal += entry.crAnnotation.acModifier
      }
    }
  }

  if (!Number.isFinite(eacVal)) eacVal = 10
  const finalEac = Math.max(12, eacVal)
  const hpCr = getCrByHp(ehpVal) || CR[0]
  const acCr = getCrByAc(finalEac) || CR[0]

  const acDelta = (finalEac - hpCr.ac) / 2
  const defensiveStep = Number.isFinite(acDelta)
    ? hpCr.index + (acDelta < 0 ? Math.ceil(acDelta) : Math.floor(acDelta))
    : hpCr.index
  const safeDefensiveIndex = Math.max(
    0,
    Math.min(CR.length - 1, Number.isFinite(defensiveStep) ? defensiveStep : 0)
  )
  const defensiveCr = CR[safeDefensiveIndex] || CR[0]
  const acCrDelta = renderBonus(defensiveCr.numeric - hpCr.numeric)

  const avgCr = Number.isFinite(offensiveCr.numeric + defensiveCr.numeric)
    ? (offensiveCr.numeric + defensiveCr.numeric) / 2
    : 0
  const estimatedCr = getCrByNumber(avgCr) || CR[0]

  return {
    actionSequence,
    damagePerRound,
    damageCr,
    maxDc,
    maxAttack,
    maxAttackRender,
    attackCr,
    dcCr,
    attackCrDelta,
    dcStepDelta,
    attackStepDelta,
    useDc,
    offensiveCr,
    filteredToHitActions,
    actionsBelowThreshold,
    filteredDcActions,
    dcsBelowThreshold,
    ehp: ehpVal,
    hpCr,
    ehpModifierList,
    eac: finalEac,
    acCr,
    acCrDelta,
    eacModifierList,
    defensiveCr,
    estimatedCr,
    attackInfo,
  }
}
