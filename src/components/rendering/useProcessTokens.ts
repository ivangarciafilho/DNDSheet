import { computeTraitTag } from 'src/core/domain/defense-and-traits-utils'
import { MaybeRef } from '@vueuse/core'
import { useMonsterStore } from 'src/stores/monster-store'
import { unref } from 'vue'
import {
  DndAttack,
  Monster,
  MonsterAction,
  MonsterReaction,
  MonsterTrait,
} from '../models'
import { renderBonus, saveForAction, safeToWords, safeToOrdinal, statModifier } from './mathRendering'
import _ from 'lodash'
import { useI18n } from 'vue-i18n'

import { useClasses } from 'src/data/CLASS'
import { useEditorStore } from 'src/stores/editor-store'
import { processTokens as coreProcessTokens } from 'src/core/usecases/ProcessTokens'

export type MonsterContext =
  | MonsterTrait
  | Monster['spellcasting']
  | DndAttack
  | MonsterAction
  | Monster['multiattacks']
  | Monster['legendaryActions']
  | Monster['mythicActions']
  | MonsterReaction
  | undefined

export type MonsterContextType =
  | 'none'
  | 'trait'
  | 'attack'
  | 'spell'
  | 'action'
  | 'multiattack'
  | 'legendary'
  | 'mythic'
  | 'reaction'

export function listJoin(list: string[], sep: string) {
  if (list.length === 1) return list[0]

  const part1 = list.slice(0, list.length - 1).join(sep)
  return `${part1}, and ${list[list.length - 1]}`
}

export function useProcessTokens() {
  const { t } = useI18n()
  const classes = useClasses()
  const editorStore = useEditorStore()

  const processMonsterTokens = (
    input: string,
    monster: ReturnType<typeof useMonsterStore> | Monster
  ) => {
    if (!input) return ''
    if (!monster) return input
    const state = (monster as any).$state ?? monster
    return coreProcessTokens(input, state as Monster)
  }

  const processTraitTokens = (input: string, context: MonsterTrait) => {
    if (!context) return input;
    // consolidated trait tag
    const tag = computeTraitTag(context)
    const limitedUse = tag
      ? ` (${tag})`
      : context.limitedUse && context.limitedUse.count > 0 && context.limitedUse.rate
      ? ` (${context.limitedUse.count}/${context.limitedUse?.rate ? t(`recharge.${context.limitedUse.rate}`) : ''})`
      : ''
    input = input.replace(
      /{trait.limitedUse}/gi,
      limitedUse
    )

    // localize the rate string
    input = input.replace(
      /{trait.limitedUse.rate}/gi,
      context.limitedUse?.rate ? context.limitedUse?.rate ? t(`recharge.${context.limitedUse.rate}`) : '' : ''
    )

    return input
  }

  const processSpellTokens = (
    input: string,
    context: Monster['spellcasting'],
    monster: ReturnType<typeof useMonsterStore>
  ) => {
    // level but ordinal
    input = input.replace(
      /\{spellcasting.ordinal\}/gi,
      safeToOrdinal(context.level)
    )

    // stat
    input = input.replace(
      /\{spellcasting.stat\}/gi,
      t(`statFull.${context.stat}`)
    )

    // spell save
    input = input.replace(/\{spellcasting.save\}/gi, `DC ${monster.spellSave}`)

    // spell attack
    input = input.replace(
      /\{spellcasting.attack\}/gi,
      renderBonus(monster.spellAttackModifier)
    )

    // ability modifier
    input = input.replace(
      /\{spellcasting.ability\}/gi,
      renderBonus(monster.spellAbilityModifier)
    )

    // class
    if (context.class && context.class in classes.SrdClass.value) {
      input = input.replace(
        /\{spellcasting.class\}/gi,
        t(`class.${context.class}`)
      )
    } else {
      input = input.replace(/\{spellcasting.class\}/gi, context.class ?? '')
    }

    return input
  }

  const processAttackTokens = (
    input: string,
    context: DndAttack,
    monster: ReturnType<typeof useMonsterStore>
  ) => {
    // attack is a... complicated bit of rendering
    // attack distance
    const distance =
      editorStore.style === '2024'
        ? t('editor.attack.distance', [t(`range.${context.distance}`)])
        : t('editor.attack.distance2014', [
            t(`range.${context.distance}`),
            t(`kind.${context.kind}`),
          ])

    input = input.replace(/\{attack.distance\}/gi, `${distance}`)

    // attack modifier
    input = input.replace(
      /\{attack.modifier\}/gi,
      renderBonus(monster.attackModifier(context.id))
    )

    // range
    const meleeRange = t('editor.attack.meleeRange', [context.range.reach])
    const rangeRange = t('editor.attack.rangeRange', [
      context.range.standard,
      context.range.long,
    ])
    const bothRange = t('editor.attack.bothRange', [
      context.range.reach,
      context.range.standard,
      context.range.long,
    ])

    input = input.replace(
      /\{attack.range\}/gi,
      context.distance === 'MELEE'
        ? meleeRange
        : context.distance === 'RANGED'
        ? rangeRange
        : bothRange
    )

    // targets
    if (context.targets > 1 || editorStore.style !== '2024') {
      input = input.replace(
        /\{attack.targets\}/gi,
        `, ${t(
          'editor.attack.targets',
          {
            count: safeToWords(context.targets),
          },
          context.targets
        )}`
      )
    } else {
      input = input.replace(/\{attack.targets\}/gi, '')
    }

    // primary damage
    const damageModifier = monster.attackDamageModifier(context.id)
    const modifier =
      damageModifier < 0 ? `${damageModifier}` : `+${damageModifier}`
    const primary = t('editor.attack.damage', [
      `{${context.damage.count}d${context.damage.dice}${
        damageModifier === 0 ? '' : modifier
      }} ${context.damage.type}`,
    ])
    input = input.replace(/\{attack.damage\}/gi, primary)

    // conditional damage
    const conditionalDamageModifier = monster.conditionalDamageModifier(
      context.id
    )
    const condMod =
      conditionalDamageModifier < 0
        ? `${conditionalDamageModifier}`
        : `+${conditionalDamageModifier}`
    const conditional = t('editor.attack.damage', [
      `{${context.alternateDamage.count}d${context.alternateDamage.dice}${
        conditionalDamageModifier === 0 ? '' : condMod
      }} ${context.alternateDamage.type}`,
    ])
    input = input.replace(
      /\{attack.conditionalDamage\}/gi,
      context.alternateDamage.active
        ? t('editor.attack.conditionalDamage', [
            conditional,
            context.alternateDamage.condition,
          ])
        : ''
    )

    // additional damage
    const additional = context.additionalDamage.map((d) => {
      const damage = `{${d.count}d${d.dice}} ${d.type}`

      if (d.note !== '') {
        return `${t('editor.attack.damage', [damage])} ${d.note}`
      } else {
        return t('editor.attack.damage', [damage])
      }
    })
    input = input.replace(
      /\{attack.additionalDamage\}/gi,
      context.additionalDamage.length > 0
        ? t('editor.attack.additionalDamage', [listJoin(additional, ', ')])
        : ''
    )

    return input
  }

  const processActionTokens = (input: string, context: MonsterAction) => {
    if (!context) return input;
    // format the effects
    // we run this replacement first, because the effects can have other tokens in them
        const effects = Array.isArray(context?.effects)
      ? context.effects
          .map((e) => `<i>${e.case}:</i> ${e.effect}`)
          .join(' ')
      : ''
    input = input.replace(/\{action.effects\}/gi, effects)

    // limitedUse / recharge formatting (no empty Recharge leaks)
    let rechargeVal = (context.recharge || (context as any).limitedUse?.recharge || '').trim()
    if (!rechargeVal && context.rechargeMin) {
      const min = context.rechargeMin
      const max = context.rechargeMax || 6
      rechargeVal = min < max ? `${min}–${max}` : `${min}`
    }
    if (!rechargeVal && context.limitedUse?.rate === 'RECHARGE') {
      rechargeVal = '5–6'
    }
    const hasRecharge = rechargeVal !== ''
    const hasLimitedUse = Boolean(
      context.limitedUse &&
      context.limitedUse.count > 0 &&
      context.limitedUse.rate &&
      context.limitedUse.rate !== 'RECHARGE'
    )

    let limitedUseStr = ''
    if (hasRecharge) {
      limitedUseStr = ` ${t('editor.action.recharge', [rechargeVal])}`
    } else if (hasLimitedUse) {
      const rateLabel = t(`recharge.${context.limitedUse.rate}`)
      const cleanRate = rateLabel.startsWith('recharge.') ? context.limitedUse.rate : rateLabel
      limitedUseStr = ` (${context.limitedUse.count}/${cleanRate})`
    }

    input = input.replace(/\{action.limitedUse\}/gi, limitedUseStr)

    // localize the rate string
    input = input.replace(
      /\{action.limitedUse.rate\}/gi,
      context.limitedUse?.rate ? t(`recharge.${context.limitedUse.rate}`) : ''
    )

    return input
  }

  const processReactionTokens = (input: string, context: MonsterReaction) => {
    if (!context) return input;
    // limitedUse is a special case
    const limitedUse = context.limitedUse && context.limitedUse.rate ? ` (${context.limitedUse.count}/${t(`recharge.${context.limitedUse.rate}`)})` : ''

    input = input.replace(
      /\{reaction.limitedUse\}/gi,
      `${(context.limitedUse && context.limitedUse.count > 0) ? limitedUse : ''}`
    )

    // localize the rate string
    input = input.replace(
      /\{reaction.limitedUse.rate\}/gi,
      context.limitedUse?.rate ? t(`recharge.${context.limitedUse.rate}`) : ''
    )

    return input
  }

  const processMultiattackTokens = (
    input: string,
    context: Monster['multiattacks'],
    monster: ReturnType<typeof useMonsterStore>
  ) => {
    // multiattack is a rather unique renderer at the moment
    // we're going to construct a different data structure while rendering (this might form the basis
    // of the planned revision in 2.1)
    const renderedMa: { attacks: string[]; actions: string[]; full: string }[] =
      []

    for (const ma of context) {
      // map attacks
      const collatedAttacks: Record<string, number> = {}

      ma.attacks.forEach((aId) => {
        if (!(aId in collatedAttacks)) {
          collatedAttacks[aId] = 0
        }

        collatedAttacks[aId] += 1
      })

      // render attacks
      const attacks = Object.entries(collatedAttacks).map(([id, count]) => {
        return t(
          'editor.multiattack.attack',
          { a: `${safeToWords(count)} ${monster.attackName(id)}` },
          count
        )
      })

      // map actions
      const collatedActions: Record<string, number> = {}

      ma.actions.forEach((aId) => {
        if (!(aId in collatedActions)) {
          collatedActions[aId] = 0
        }

        collatedActions[aId] += 1
      })

      // render actions
      const actions = Object.entries(collatedActions).map(([id, count]) => {
        return t(
          'editor.multiattack.action',
          {
            a: monster.actionName(id),
            count: safeToWords(count),
          },
          count
        )
      })

      // the full string
      // TODO: this isn't very i18n friendly
      let multiattackAll = ''
      if (actions.length > 0) {
        multiattackAll = `uses ${listJoin(actions, ', ')}${
          actions.length > 0 ? ` followed by ${listJoin(attacks, ', ')}` : ''
        }`
      } else {
        multiattackAll = `makes ${listJoin(attacks, ', ')}`
      }

      renderedMa.push({
        attacks,
        actions,
        full: multiattackAll,
      })
    }

    // render everything
    const multiattackAll = `{NAME} ${renderedMa
      .map((ma) => ma.full)
      .join(' or ')}`

    // ok so now the renderedMa object is the context
    input = input.replace(/\{multiattack.all\}/gi, multiattackAll)

    input = input.replace(
      /\{multiattack.postscript\}/gi,
      monster.multiattackOptions.postscript
    )

    // context tokens accessible via "rendered"
    const generic = RegExp(/\{(?:multiattack).([\w\d\[\].]+)}/gi)
    input = input.replace(generic, (match, prop) => {
      const value = _.get({ rendered: renderedMa }, prop)

      return value
    })

    return input
  }

  const processLegendaryTokens = (
    input: string,
    context: Monster['legendaryActions']
  ) => {
    input = input.replace(
      /\{legendaryActions.actions\}/gi,
      t('editor.action.plural', context.count)
    )

    return input
  }

  const processContextTokens = (
    input: string,
    context: MonsterContext,
    contextType: MonsterContextType,
    monster: ReturnType<typeof useMonsterStore>
  ) => {
    // context tokens first
    if (contextType === 'trait') {
      input = processTraitTokens(input, context as MonsterTrait)
    } else if (contextType === 'attack') {
      input = processAttackTokens(input, context as DndAttack, monster)
    } else if (contextType === 'action') {
      input = processActionTokens(input, context as MonsterAction)
    } else if (contextType === 'multiattack') {
      input = processMultiattackTokens(
        input,
        context as Monster['multiattacks'],
        monster
      )
    } else if (contextType === 'legendary') {
      input = processLegendaryTokens(
        input,
        context as Monster['legendaryActions']
      )
    } else if (contextType === 'reaction') {
      input = processReactionTokens(input, context as MonsterReaction)
    }

    // spellcasting tokens describe the creature, not the entry, so they resolve
    // anywhere (e.g. "{spellcasting.attack} to hit" inside an action)
    const spellSource = contextType === 'spell' && context != null ? (context as Monster['spellcasting']) : monster?.spellcasting
    if (spellSource && /\{spellcasting\./i.test(input)) {
      input = processSpellTokens(input, spellSource, monster)
    }

    // generic tokens: {action.name}, {spellcasting.level}, ... read from their own object;
    // unknown properties stay as written instead of printing "undefined"
    const generic = RegExp(
      /\{(trait|attack|action|spellcasting|legendaryActions|mythicActions|reaction)\.([\w\d\[\].]+)}/gi
    )
    input = input.replace(generic, (match, family: string, prop: string) => {
      const source =
        family.toLowerCase() === 'spellcasting'
          ? spellSource
          : family.toLowerCase() === 'legendaryactions'
          ? monster?.legendaryActions
          : family.toLowerCase() === 'mythicactions'
          ? monster?.mythicActions
          : context
      if (source == null) return match
      const value = _.get(source, prop)
      return value == null || typeof value === 'object' ? match : String(value)
    })

    return input
  }

  const processTokens = (
    input: string,
    context: MonsterContext,
    monster: ReturnType<typeof useMonsterStore>,
    contextType: MonsterContextType
  ) => {
    // specific parsing
    input = processContextTokens(input, context, contextType, monster)

    // general parsing
    input = processMonsterTokens(input, monster)

    return input
  }

  const buildHeaderPillHtml = (
    monster: ReturnType<typeof useMonsterStore>,
    stagePool: string | undefined,
    name: string,
    extraCells: { text: string; cls?: string }[] = []
  ): string => {
    const pName = monster.paragonConfig?.phaseName?.trim() || 'Phase'

    // Cluster 1: Identity & Tags (Phase, Recharge, Discipline/Tier, Name, Components, Duration)
    const idCells: string[] = []
    if (stagePool && stagePool !== 'all') {
      idCells.push(`<div class="action-cell phase-cell"><span class="cell-phase-text">${pName} ${stagePool}</span></div>`)
    }

    const rechargeCell = extraCells.find((c) => c.cls?.includes('recharge-cell'))
    if (rechargeCell && rechargeCell.text?.trim()) {
      idCells.push(`<div class="action-cell ${rechargeCell.cls || 'recharge-cell'}"><span class="cell-sub-text">${rechargeCell.text.trim()}</span></div>`)
    }

    const schoolCell = extraCells.find((c) => c.cls?.includes('school-cell'))
    if (schoolCell && schoolCell.text?.trim()) {
      idCells.push(`<div class="action-cell ${schoolCell.cls}"><span class="cell-sub-text">${schoolCell.text.trim()}</span></div>`)
    }

    // Name cell in crimson red background
    idCells.push(`<div class="action-cell name-cell"><span class="cell-main-text">${name}</span></div>`)

    const componentCell = extraCells.find((c) => c.cls?.includes('component-cell'))
    if (componentCell && componentCell.text?.trim()) {
      idCells.push(`<div class="action-cell ${componentCell.cls}"><span class="cell-sub-text">${componentCell.text.trim()}</span></div>`)
    }

    const durationCell = extraCells.find((c) => c.cls?.includes('duration-cell'))
    if (durationCell && durationCell.text?.trim()) {
      idCells.push(`<div class="action-cell ${durationCell.cls}"><span class="cell-sub-text">${durationCell.text.trim()}</span></div>`)
    }

    // Cluster 2: Mechanics (Attack Roll or Save DC)
    const mechCells: string[] = []
    const attackCell = extraCells.find((c) => c.cls === 'type-cell' || (c.cls?.includes('type-cell') && !c.cls?.includes('school-cell')))
    if (attackCell && attackCell.text?.trim()) {
      mechCells.push(`<div class="action-cell type-cell mech-cell"><span class="cell-sub-text">${attackCell.text.trim()}</span></div>`)
    }
    const saveCell = extraCells.find((c) => c.cls?.includes('save-cell'))
    if (saveCell && saveCell.text?.trim()) {
      mechCells.push(`<div class="action-cell save-cell mech-cell"><span class="cell-sub-text">${saveCell.text.trim()}</span></div>`)
    }

    // Cluster 3: Scope & Range / Target
    const scopeCells: string[] = []
    const targetCell = extraCells.find((c) => c.cls?.includes('target-cell'))
    if (targetCell && targetCell.text?.trim()) {
      scopeCells.push(`<div class="action-cell target-cell scope-cell"><span class="cell-sub-text">${targetCell.text.trim()}</span></div>`)
    }
    const rangeCell = extraCells.find((c) => c.cls?.includes('range-cell'))
    if (rangeCell && rangeCell.text?.trim()) {
      scopeCells.push(`<div class="action-cell range-cell scope-cell"><span class="cell-sub-text">${rangeCell.text.trim()}</span></div>`)
    }

    // Any other remaining cells go into idCells
    const handledIndices = new Set([
      extraCells.indexOf(rechargeCell as any),
      extraCells.indexOf(schoolCell as any),
      extraCells.indexOf(componentCell as any),
      extraCells.indexOf(durationCell as any),
      extraCells.indexOf(attackCell as any),
      extraCells.indexOf(saveCell as any),
      extraCells.indexOf(targetCell as any),
      extraCells.indexOf(rangeCell as any),
    ])

    for (let i = 0; i < extraCells.length; i++) {
      if (!handledIndices.has(i) && extraCells[i]?.text?.trim()) {
        idCells.push(`<div class="action-cell ${extraCells[i].cls || 'meta-cell'}"><span class="cell-sub-text">${extraCells[i].text.trim()}</span></div>`)
      }
    }

    const pills: string[] = []
    if (idCells.length > 0) {
      pills.push(`<div class="action-composite-pill identity-pill">${idCells.join('<div class="cell-divider"></div>')}</div>`)
    }
    if (mechCells.length > 0) {
      pills.push(`<div class="action-composite-pill mech-pill">${mechCells.join('<div class="cell-divider"></div>')}</div>`)
    }
    if (scopeCells.length > 0) {
      pills.push(`<div class="action-composite-pill scope-pill">${scopeCells.join('<div class="cell-divider"></div>')}</div>`)
    }

    return `<div class="action-composite-header">${pills.join('')}</div>`
  }
  const processTrait = (
    contextRef: MaybeRef<MonsterTrait>,
    monster: ReturnType<typeof useMonsterStore>
  ) => {
    const context = unref(contextRef)
    const pName = monster.paragonConfig?.phaseName?.trim() || 'Phase'
    const poolBadge = context?.stagePool && context.stagePool !== 'all' ? `<span class="dnd-pool-badge">[${pName} ${context.stagePool}]</span> ` : ''
    const isModern = editorStore.visualTemplate === 'modern'

    if (isModern && !context.customPreamble) {
      const tag = computeTraitTag(context)
      const limitedUseCell = tag
        ? tag
        : context.limitedUse && context.limitedUse.count > 0 && context.limitedUse.rate
        ? `${context.limitedUse.count}/${t(`recharge.${context.limitedUse.rate}`)}`
        : ''
      const headerPill = buildHeaderPillHtml(
        monster,
        context?.stagePool,
        context.name,
        limitedUseCell ? [{ text: limitedUseCell, cls: 'recharge-cell' }] : []
      )
      const desc = processTokens(context.description, context, monster, 'trait')
      return `${headerPill}<div class="action-body-text zebra-stripe-text">${desc}</div>`
    }

    if (context.customPreamble) {
      return poolBadge + processTokens(context.description, context, monster, 'trait')
    } else {
      return processTokens(
        `${poolBadge}<b><i>{trait.name}{trait.limitedUse}.</i></b> ${context.description}`,
        context,
        monster,
        'trait'
      )
    }
  }

  const processAction = (
    contextRef: MaybeRef<MonsterAction>,
    monster: ReturnType<typeof useMonsterStore>
  ) => {
    const context = unref(contextRef)
    const pName = monster.paragonConfig?.phaseName?.trim() || 'Phase'
    const poolBadge = context?.stagePool && context.stagePool !== 'all' ? `<span class="dnd-pool-badge">[${pName} ${context.stagePool}]</span> ` : ''

    const isModern = editorStore.visualTemplate === 'modern'

    if (isModern && !context.customPreamble) {
      const extraCells: { text: string; cls?: string }[] = []

      // 1. Compound School & Level (e.g. "2nd Level Abjuration" or "Abjuration")
      const schoolLevelParts: string[] = []
      if (context.spellLevel && context.spellLevel !== 'None') {
        schoolLevelParts.push(context.spellLevel)
      }
      if (context.school && context.school !== 'None') {
        schoolLevelParts.push(context.school)
      }
      if (schoolLevelParts.length > 0) {
        extraCells.push({ text: schoolLevelParts.join(' '), cls: 'type-cell school-cell' })
      }

      // 2. Compound Components (e.g. "V, S" or "V, C")
      if (Array.isArray(context.components) && context.components.length > 0) {
        extraCells.push({ text: context.components.join(', '), cls: 'component-cell' })
      }

      // 3. Compound Duration (e.g. "1 minute")
      if (context.duration && context.duration.trim()) {
        extraCells.push({ text: context.duration.trim(), cls: 'duration-cell' })
      }

      // 4. Target / Range / Area Scope (e.g. "Self (20ft of you) across Material and Ethereal Plane")
      const scopeParts: string[] = []
      if (context.range && context.range.trim()) {
        scopeParts.push(context.range.trim())
      }
      if (context.areaDistance && context.areaDistance.trim()) {
        scopeParts.push(context.areaDistance.trim())
      }
      if (context.areaShape && context.areaShape.trim()) {
        scopeParts.push(context.areaShape.trim())
      }
      if (context.targetsText && context.targetsText.trim()) {
        scopeParts.push(context.targetsText.trim())
      }
      if (scopeParts.length > 0) {
        extraCells.push({ text: scopeParts.join(' '), cls: 'target-cell' })
      }

      if (context.actionType === 'spell_attack' || context.actionType === 'weapon_attack') {
        const label = context.actionType === 'spell_attack' ? 'Spell Attack' : 'Weapon Attack'
        const bonus = context.attackBonus != null ? renderBonus(context.attackBonus) : renderBonus(monster.spellAttackModifier)
        extraCells.push({ text: `${label} ${bonus}`, cls: 'type-cell' })
      }

      if (context.stat && context.stat !== 'none') {
        const dcVal = saveForAction(monster, context.stat, context.save)
        extraCells.push({ text: `${t(`statFull.${context.stat}`)} DC ${dcVal}`, cls: 'save-cell' })
      }

      let rechargeStr = (context.recharge || '').trim()
      if (!rechargeStr && context.rechargeMin) {
        const min = context.rechargeMin
        const max = context.rechargeMax || 6
        rechargeStr = min < max ? `${min}–${max}` : `${min}`
      }
      if (!rechargeStr && (context as any).limitedUse?.recharge) {
        rechargeStr = ((context as any).limitedUse.recharge || '').trim()
      }
      if (!rechargeStr && context.limitedUse?.rate === 'RECHARGE') {
        rechargeStr = '5–6'
      }
      if (rechargeStr) {
        extraCells.push({ text: `Recharge ${rechargeStr}`, cls: 'recharge-cell' })
      } else if (context.limitedUse && context.limitedUse.count > 0 && context.limitedUse.rate) {
        const rateLabel = t(`recharge.${context.limitedUse.rate}`)
        const cleanRate = rateLabel.startsWith('recharge.') ? context.limitedUse.rate : rateLabel
        extraCells.push({ text: `${context.limitedUse.count}/${cleanRate}`, cls: 'recharge-cell' })
      }

      const headerPill = buildHeaderPillHtml(monster, context?.stagePool, context.name, extraCells)
      const effectsStr = Array.isArray(context?.effects) && context.effects.length > 0
        ? context.effects.map((e) => `<i>${e.case}:</i> ${e.effect}`).join(' ') + ' '
        : ''
      let desc = processTokens(`${effectsStr}${context.description || ''}`, context, monster, 'action').trim()

      // Strip redundant leading saving throw or attack preamble if already shown in composite header cells
      if (context.stat && context.stat !== 'none') {
        desc = desc.replace(/^<i>[^<]*Saving Throw:<\/i>\s*DC\s*\d+(?:,\s*[^.]+)?\.\s*/i, '')
      }
      if (context.actionType === 'spell_attack' || context.actionType === 'weapon_attack') {
        desc = desc.replace(/^<i>(?:Melee|Ranged|Melee or Ranged)\s+(?:Weapon|Spell)\s+Attack(?: Roll)?:<\/i>\s*[+-]?\d+\s*to hit,\s*[^.]+\.\s*/i, '')
      }

      return `${headerPill}<div class="action-body-text zebra-stripe-text">${desc}</div>`
    }

    if (context.customPreamble) {
      return poolBadge + processTokens(context.description, context, monster, 'action')
    } else if (context.stat !== 'none') {
      return processTokens(
        `${poolBadge}<b><i>{action.name}{action.limitedUse}.</i></b> <i>${t(
          `statFull.${context.stat}`
        )} Saving Throw:</i> DC ${saveForAction(
          monster,
          context.stat,
          context.save
        )}, {action.range}. {action.effects} ${context.description}`,
        context,
        monster,
        'action'
      )
    } else {
      return processTokens(
        `${poolBadge}<b><i>{action.name}{action.limitedUse}.</i></b> ${context.description}`,
        context,
        monster,
        'action'
      )
    }
  }

  const processReaction = (
    contextRef: MaybeRef<MonsterReaction>,
    monster: ReturnType<typeof useMonsterStore>
  ) => {
    const context = unref(contextRef)
    const isModern = editorStore.visualTemplate === 'modern'

    if (isModern) {
      const extraCells: { text: string; cls?: string }[] = []
      if (context.trigger && context.trigger.trim()) {
        extraCells.push({ text: `Trigger: ${context.trigger.trim()}`, cls: 'range-cell' })
      }
      if (context.limitedUse && context.limitedUse.count > 0 && context.limitedUse.rate) {
        const rateLabel = t(`recharge.${context.limitedUse.rate}`)
        const cleanRate = rateLabel.startsWith('recharge.') ? context.limitedUse.rate : rateLabel
        extraCells.push({ text: `${context.limitedUse.count}/${cleanRate}`, cls: 'recharge-cell' })
      }
      const headerPill = buildHeaderPillHtml(monster, context?.stagePool, context.name, extraCells)
      const desc = processTokens(context.description, context, monster, 'reaction')
      return `${headerPill}<div class="action-body-text zebra-stripe-text">${desc}</div>`
    }

    // case on the presence of a Trigger to choose old style rendering or new
    if (context.trigger === '') {
      return processTokens(
        `<b><i>${context.name}{reaction.limitedUse}.</i></b> ${context.description}`,
        context,
        monster,
        'reaction'
      )
    } else {
      return processTokens(
        `<b><i>${context.name}{reaction.limitedUse}.</i></b> <i>${t(
          'monster.reaction.trigger'
        )}:</i> ${context.trigger} <i>${t('monster.reaction.response')}:</i> ${
          context.description
        }`,
        context,
        monster,
        'reaction'
      )
    }
  }

  const processAttack = (
    contextRef: MaybeRef<DndAttack>,
    monster: ReturnType<typeof useMonsterStore>
  ) => {
    const context = unref(contextRef)
    const pName = monster.paragonConfig?.phaseName?.trim() || 'Phase'
    const poolBadge = context?.stagePool && context.stagePool !== 'all' ? `<span class="dnd-pool-badge">[${pName} ${context.stagePool}]</span> ` : ''

    const isModern = editorStore.visualTemplate === 'modern'

    if (isModern && !context.useCustomRenderer) {
      const extraCells: { text: string; cls?: string }[] = []

      const kindLabel = context.kind === 'SPELL' ? 'Spell' : 'Weapon'
      const distStr =
        context.distance === 'MELEE'
          ? `Melee ${kindLabel} Attack`
          : context.distance === 'RANGED'
          ? `Ranged ${kindLabel} Attack`
          : `Melee/Ranged ${kindLabel} Attack`
      const statMod = statModifier(monster.stats[context.modifier.stat] ?? 10)
      const toHit = context.modifier.override
        ? context.modifier.overrideValue
        : statMod + (context.modifier.proficient ? monster.proficiency : 0)
      extraCells.push({ text: `${distStr} ${renderBonus(toHit)}`, cls: 'type-cell' })

      if (context.distance === 'MELEE' && context.range.reach) {
        extraCells.push({ text: `Reach ${context.range.reach} ft.`, cls: 'range-cell' })
      } else if (context.distance === 'RANGED' && context.range.standard) {
        extraCells.push({ text: `Range ${context.range.standard}/${context.range.long} ft.`, cls: 'range-cell' })
      } else if (context.distance === 'BOTH') {
        extraCells.push({ text: `Reach ${context.range.reach} ft. or Range ${context.range.standard}/${context.range.long} ft.`, cls: 'range-cell' })
      }

      const targetStr = context.targets ? `${context.targets} target${context.targets > 1 ? 's' : ''}` : '1 target'
      extraCells.push({ text: targetStr, cls: 'target-cell' })

      const headerPill = buildHeaderPillHtml(monster, context?.stagePool, context.name, extraCells)

      // Build ONLY the Hit & description portion without repeating the attack/to-hit/reach/targets preamble!
      const damageOnlyTemplate = `<i>Hit:</i> {attack.damage}{attack.conditionalDamage}{attack.additionalDamage}. {attack.description}`
      const body = processTokens(damageOnlyTemplate, context, monster, 'attack').trim()
      return `${headerPill}<div class="action-body-text zebra-stripe-text">${body}</div>`
    }

    if (context.useCustomRenderer) {
      return poolBadge + processTokens(context.customRenderer, context, monster, 'attack')
    } else {
      return poolBadge + processTokens(t('presets.attack'), context, monster, 'attack')
    }
  }

  const processClassSpellcasting = (
    contextRef: MaybeRef<Monster['spellcasting']>,
    monster: ReturnType<typeof useMonsterStore>
  ) => {
    const context = unref(contextRef)

    if (context.useCustomClassPreamble) {
      return processTokens(
        context.customClassPreamble,
        context,
        monster,
        'spell'
      )
    } else {
      return processTokens(
        t('presets.classSpellcasting'),
        context,
        monster,
        'spell'
      )
    }
  }

  const processInnateSpellcasting = (
    contextRef: MaybeRef<Monster['spellcasting']>,
    monster: ReturnType<typeof useMonsterStore>
  ) => {
    const context = unref(contextRef)

    if (context.useCustomInnatePreamble) {
      return processTokens(
        context.customInnatePreamble,
        context,
        monster,
        'spell'
      )
    } else {
      return processTokens(
        editorStore.style === '2014'
          ? t('presets.innateSpellcasting2014')
          : t('presets.innateSpellcasting'),
        context,
        monster,
        'spell'
      )
    }
  }

  const processMultiattack = (
    contextRef: MaybeRef<Monster['multiattacks']>,
    monster: ReturnType<typeof useMonsterStore>
  ) => {
    const context = unref(contextRef)
    const isModern = editorStore.visualTemplate === 'modern'
    if (monster.multiattackOptions.useCustomRenderer) {
      return processTokens(
        monster.multiattackOptions.customMultiattackRenderer,
        context,
        monster,
        'multiattack'
      )
    }
    if (isModern) {
      const headerPill = buildHeaderPillHtml(monster, undefined, t('editor.multiattack.label'), [])
      const body = processTokens(`{multiattack.all}. {multiattack.postscript}`, context, monster, 'multiattack').trim()
      return `${headerPill}<div class="action-body-text zebra-stripe-text">${body}</div>`
    }
    return processTokens(
      `<b><i>${t(
        'editor.multiattack.label'
      )}.</i></b> {multiattack.all}. {multiattack.postscript}`,
      context,
      monster,
      'multiattack'
    )
  }

  const processLegendaryPreamble = (
    contextRef: MaybeRef<Monster['legendaryActions']>,
    monster: ReturnType<typeof useMonsterStore>
  ) => {
    const context = unref(contextRef)

    if (monster.legendaryActions.useCustomPreamble) {
      return processTokens(
        monster.legendaryActions.customPreamble,
        context,
        monster,
        'legendary'
      )
    } else {
      return processTokens(
        t('presets.legendaryActions'),
        context,
        monster,
        'legendary'
      )
    }
  }

  const processLegendaryAction = (
    actionId: string,
    cost: number,
    monster: ReturnType<typeof useMonsterStore>
  ) => {
    const action = monster.legendaryAction(actionId)
    const isModern = editorStore.visualTemplate === 'modern'

    if (action) {
      // process the name
      const count = cost > 1 ? t('editor.legendary.renderedCost', [cost]) : ''
      const costCell = cost > 1 ? `Costs ${cost} Actions` : '1 Action'

      let description = ''
      if (action.type === 'action') {
        if (action.action.legendaryOnly) {
          description = processTokens(
            action.action.description,
            action.action as MonsterAction,
            monster,
            'action'
          )
        } else {
          description = processTokens(
            t('presets.legendaryAction', [action.action.name]),
            undefined,
            monster,
            'none'
          )
        }
      } else if (action.type === 'attack') {
        description = processTokens(
          t('presets.legendaryAttack', [action.action.name]),
          undefined,
          monster,
          'none'
        )
      }

      if (isModern) {
        const headerPill = buildHeaderPillHtml(
          monster,
          (action.action as any)?.stagePool,
          action.action.name,
          [{ text: costCell, cls: 'recharge-cell' }]
        )
        return `${headerPill}<div class="action-body-text zebra-stripe-text">${description}</div>`
      }

      return `<b><i>${action.action.name}${count}.</b></i> ${description}`
    }

    const fallbackName = (actionId || 'Legendary Action').replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    const count = cost > 1 ? t('editor.legendary.renderedCost', [cost]) : ''
    return `<b><i>${fallbackName}${count}.</b></i>`
  }

  const processMythicActionTrait = (
    contextRef: MaybeRef<Monster['mythicActions']>,
    monster: ReturnType<typeof useMonsterStore>
  ) => {
    const context = unref(contextRef)

    const trait = processTokens(
      context.triggerDescription,
      context,
      monster,
      'mythic'
    )

    return `<b><i>${context.triggerName} (${context.triggerRecharge}).</b></i> ${trait}`
  }

  const processMythicActionPreamble = (
    contextRef: MaybeRef<Monster['mythicActions']>,
    monster: ReturnType<typeof useMonsterStore>
  ) => {
    const context = unref(contextRef)

    const preamble = processTokens(context.preamble, context, monster, 'mythic')

    return preamble
  }

  const processLairActionPreamble = (
    monster: ReturnType<typeof useMonsterStore>
  ) => {
    if (monster.useCustomLairActionPreamble) {
      return processTokens(
        monster.lairActionPreamble,
        undefined,
        monster,
        'none'
      )
    } else {
      return processTokens(t('presets.lair'), undefined, monster, 'none')
    }
  }

  const sanitizeWebString = (input: string) => {
    // allowed tags are: bold, italic, underline, br, div, span, svg, path
    input = input.replace(/>/gi, '&gt;')
    input = input.replace(/</gi, '&lt;')

    // allow b/i/u/br/strong
    const allowedTags = /\&lt;(\/?[b|i|u]|br|strong)\&gt;/gi
    input = input.replace(allowedTags, (match, tag) => {
      return '<' + tag + '>'
    })

    const allowedStrongWithAttrs = /\&lt;(\/?strong[^\&]*)\&gt;/gi
    input = input.replace(allowedStrongWithAttrs, (match, tag) => {
      return '<' + tag + '>'
    })

    // linebreak time
    const linebreak = /\&lt;div\&gt;\&lt;br\&gt;\&lt;\/div\&gt;/gi
    input = input.replace(linebreak, () => {
      return '<div><br></div>'
    })

    // div wrapper
    const allowedDiv = /\&lt;(\/?div[^\&]*)\&gt;/gi
    input = input.replace(allowedDiv, (match, tag) => {
      return '<' + tag + '>'
    })

    // allow span with classes, titles, styles
    const allowedSpan = /\&lt;(\/?span[^\&]*)\&gt;/gi
    input = input.replace(allowedSpan, (match, tag) => {
      return '<' + tag + '>'
    })

    // allow inline svg and path
    const allowedSvg = /\&lt;(\/?(?:svg|path)[^\&]*)\&gt;/gi
    input = input.replace(allowedSvg, (match, tag) => {
      return '<' + tag + '>'
    })

    return input
  }

  const stripTags = (input: string) => {
    const allowedTags = /<(\/?[b|i|u])>/gi
    input = input.replace(allowedTags, () => {
      return ''
    })

    // linebreak time
    const linebreak = /<div><br><\/div>/gi
    input = input.replace(linebreak, () => {
      return '\n'
    })

    return input
  }

  const mdFormatter = (input: string) => {
    // three tiers of *s
    // b/i and i/b
    const bi = /<[bi]><[bi]>(.+)<\/[bi]><\/[bi]>/gi
    input = input.replace(bi, (match, content) => {
      return `***${content}***`
    })

    // b
    const b = /<\s*b[^>]*>(.*?)<\s*\/\s*b>/gi
    input = input.replace(b, (match, content) => {
      return `**${content}**`
    })

    // i
    const i = /<\s*i[^>]*>(.*?)<\s*\/\s*i>/gi
    input = input.replace(i, (match, content) => {
      return `*${content}*`
    })

    // brs
    // linebreak time
    const linebreak = /<div><br><\/div>/gi
    input = input.replace(linebreak, () => {
      return '\n'
    })

    // linebreaks
    input = input.replace(/\n/g, '\n> ')

    return input
  }

  const latexFormatter = (input: string) => {
    const biStart = /^<[bi]><[bi]>(.+)<\/[bi]><\/[bi]>/gi
    input = input.replace(biStart, (match, content) => {
      return `\\DndMonsterAction{${content.replace(/\.$/gi, '')}}`
    })

    // three tiers of *s
    // b/i and i/b
    const bi = /<[bi]><[bi]>(.+)<\/[bi]><\/[bi]>/gi
    input = input.replace(bi, (match, content) => {
      return `\\emph{\\textbf{${content}}`
    })

    // b
    const b = /<\s*b[^>]*>(.*?)<\s*\/\s*b>/gi
    input = input.replace(b, (match, content) => {
      return `\\textbf{${content}}`
    })

    // i
    const i = /<\s*i[^>]*>(.*?)<\s*\/\s*i>/gi
    input = input.replace(i, (match, content) => {
      return `\\emph{${content}}`
    })

    // brs
    // linebreak time
    const linebreak = /<div><br><\/div>/gi
    input = input.replace(linebreak, () => {
      return '\n'
    })

    // nonbreaking spaces
    const nbsp = '&nbsp;'
    input = input.replaceAll(nbsp, ' ')

    return input
  }

  return {
    processMonsterTokens,
    processTraitTokens,
    processSpellTokens,
    processAttackTokens,
    processActionTokens,
    processMultiattackTokens,
    processContextTokens,
    processTokens,
    processTrait,
    processAction,
    processReaction,
    processAttack,
    processMultiattack,
    processClassSpellcasting,
    processInnateSpellcasting,
    processLegendaryPreamble,
    processLegendaryAction,
    processMythicActionTrait,
    processMythicActionPreamble,
    processLairActionPreamble,
    sanitizeWebString,
    mdFormatter,
    latexFormatter,
    stripTags,
  }
}
