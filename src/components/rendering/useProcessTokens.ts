import { innateCastingContext } from 'src/core/domain/casting-ability'
import { formatReactionAvailability } from 'src/core/domain/entry-display'
import { formatNumericPresentation } from 'src/core/domain/numeric-presentation'
import { sanitizeProsePunctuation } from 'src/core/domain/number-grammar'
import { outcomesHtml } from 'src/core/domain/outcome-rendering'
import { descriptionContainersHtml } from 'src/core/domain/description-containers'
import { structuredAttackBonus } from 'src/core/domain/structured-attack'
import { exportMarkup } from 'src/core/domain/export-markup'
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
import { renderBonus, saveForAction } from './mathRendering'
import _ from 'lodash'
import { useI18n } from 'vue-i18n'

import { useClasses } from 'src/data/CLASS'
import { useEditorStore } from 'src/stores/editor-store'
import { processTokens as coreProcessTokens } from 'src/core/usecases/ProcessTokens'
import { boldNumbers } from './plate'
import { abilityHeader, abilityIdentity, hasStructuredAbility, mechanicsPhrase, scopePhrase, text2024 } from 'src/core/domain/ability-grammar'
import type { Monster as DomainMonster } from 'src/core/domain/types'
import type { LairAction } from 'src/core/domain/types'
import { listJoin } from './list-join'
import { createEntryTokenProcessors } from './useEntryTokens'
import { createPlateEntryHelpers } from './usePlateEntries'

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

export { listJoin }

export interface PlateEntrySpec {
  stagePool?: string | number
  phaseText?: string
  availability?: string
  name: string
  scores?: string
  /** Recharge / uses / cost, e.g. "Recharge 4–12", "3/Day", "Costs 2 Actions". */
  usage?: string
  /** School and tier, e.g. "Evocation Cantrip". */
  discipline?: string
  components?: string[]
  /** Shown only when it is not Instantaneous. */
  duration?: string
  /** Attack roll or saving throw cells. */
  mechanics?: string[]
  /** Targets, range and area cells. */
  scope?: string[]
  extra?: string[]
  streamline?: boolean
}

/**
 * `web: false` is the text projection used by exports: entries render as prose in every visual
 * template, because Modern Modular plates are web markup that no text format can carry.
 */
export function useProcessTokens(options: { web?: boolean } = {}) {
  const webProjection = options.web ?? true
  const { t } = useI18n()
  const classes = useClasses()
  const editorStore = useEditorStore()

  const processMonsterTokens = (
    input: string,
    monster: ReturnType<typeof useMonsterStore> | Monster
  ) => {
    if (!input) return ''
    if (!monster) return input
    const state = '$state' in monster ? monster.$state : monster
    return coreProcessTokens(input, state as Monster)
  }
  const { processTraitTokens, processSpellTokens, processAttackTokens, processActionTokens, processReactionTokens, processMultiattackTokens, processLegendaryTokens } = createEntryTokenProcessors({ t, classes, editorStore, webProjection })

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

  const formatDescriptionContainers = descriptionContainersHtml

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

    // Custom user variables and macros
    if (monster.customVariables) {
      for (const [varKey, varVal] of Object.entries(monster.customVariables)) {
        if (!varKey) continue;
        input = input.replace(new RegExp(`\\{${varKey}\\}`, 'gi'), String(varVal));
      }
    }
    if (monster.customMacros) {
      for (const [macroKey, macroVal] of Object.entries(monster.customMacros)) {
        if (!macroKey) continue;
        input = input.replace(new RegExp(`\\{${macroKey}\\}`, 'gi'), String(macroVal));
      }
    }

    return input
  }
  const { buildPlateEntry, usageText, structuredRenderContext, structuredActionPlate, structuredActionLine, entryBadge } = createPlateEntryHelpers({ webProjection, processMonsterTokens, processTokens, formatDescriptionContainers })

  const processTrait = (
    contextRef: MaybeRef<MonsterTrait>,
    monster: ReturnType<typeof useMonsterStore>
  ) => {
    const context = unref(contextRef)
    const poolBadge = entryBadge(context, monster)
    const isModern = webProjection && editorStore.visualTemplate === 'modern'

    if (isModern && !context.customPreamble && hasStructuredAbility(context as Partial<MonsterAction>)) {
      return structuredActionPlate(context as unknown as MonsterAction, monster, computeTraitTag(context))
    }

    if (isModern && !context.customPreamble) {
      const tag = computeTraitTag(context)
      const usage = tag
        ? tag
        : context.limitedUse && context.limitedUse.count > 0 && context.limitedUse.rate
        ? `${context.limitedUse.count}/${t(`recharge.${context.limitedUse.rate}`)}`
        : ''
      const desc = processTokens(context.description, context, monster, 'trait')
      const containersStr = formatDescriptionContainers(context.descriptionContainers, monster.randomTables)
      const fullDesc = containersStr ? (desc ? `${desc} ${containersStr}` : containersStr) : desc
      return buildPlateEntry(
        monster,
        {
          stagePool: context?.stagePool,
          name: context.name,
          usage,
          streamline: !containersStr
        },
        fullDesc
      )
    }

    // Trait cadence remains owned by the trait token adapter; only mechanics and
    // outcomes use the shared ability prose. Custom preambles retain their override.
    if (!context.customPreamble && hasStructuredAbility(context as Partial<MonsterAction>)) {
      const { renderContext } = structuredRenderContext(context as unknown as MonsterAction, monster)
      const prose = text2024(context as unknown as MonsterAction, renderContext, { markup: 'html' })
      return processTokens(`${poolBadge}<b><i>{trait.name}{trait.limitedUse}.</i></b> ${prose}`, context, monster, 'trait')
    }

    const containersStr = formatDescriptionContainers(context.descriptionContainers, monster.randomTables)
    if (context.customPreamble) {
      const desc = processTokens(context.description, context, monster, 'trait')
      return poolBadge + (containersStr ? `${desc} ${containersStr}` : desc)
    } else {
      return processTokens(
        `${poolBadge}<b><i>{trait.name}{trait.limitedUse}.</i></b> ${context.description}${containersStr ? ` ${containersStr}` : ''}`,
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
    const poolBadge = entryBadge(context, monster)

    const isModern = webProjection && editorStore.visualTemplate === 'modern'

    if (isModern && !context.customPreamble) {
      if (hasStructuredAbility(context)) return structuredActionPlate(context, monster, usageText(context))

      // Discipline: "Evocation Cantrip" for cantrips, "3rd Level Evocation" otherwise (PHB 2024 order)
      const { discipline, components, duration } = abilityHeader(context)

      // Targets / range / area, numbers in bold (via shared ability grammar so counts & nouns always agree)
      const { ability: inferredAbility, renderContext: legacyRenderCtx } = structuredRenderContext(context, monster)
      const inferredScope = scopePhrase(inferredAbility, legacyRenderCtx)
      const scopeParts: string[] = []
      if (inferredScope) {
        scopeParts.push(inferredScope)
      } else {
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
      }
      const scope = scopeParts.length > 0 ? [boldNumbers(scopeParts.join(' '))] : []

      // Mechanics: | Ranged Spell Attack +7 |, | Charisma Save 15 |
      const mechanics: string[] = []
      const inferredMechanics = mechanicsPhrase(inferredAbility, legacyRenderCtx).map(boldNumbers)
      if (inferredMechanics.length > 0) {
        mechanics.push(...inferredMechanics)
      } else {
        if (context.actionType === 'spell_attack' || context.actionType === 'weapon_attack') {
          const isSpell = context.actionType === 'spell_attack'
          const bonus = structuredAttackBonus(context, monster as unknown as DomainMonster) ?? 0
          mechanics.push(`${isSpell ? 'Spell Attack' : 'Weapon Attack'} <strong class="dnd-num">${renderBonus(bonus)}</strong>`)
        }
        if (context.stat && context.stat !== 'none') {
          const dcVal = saveForAction(monster, context.stat, context.save)
          mechanics.push(`${t(`statFull.${context.stat}`)} Save <strong class="dnd-num">${dcVal}</strong>`)
        }
      }

      const effectsStr = Array.isArray(context?.effects) && context.effects.length > 0
        ? context.effects.map((e) => `<i>${e.case}:</i> ${e.effect}`).join(' ') + ' '
        : ''
      // Text blocks and dice tables follow the description, as in every other projection (owner report, Build 269).
      let desc = sanitizeProsePunctuation(processTokens(`${effectsStr}${context.description || ''} ${formatDescriptionContainers(context.descriptionContainers, monster.randomTables)}`, context, monster, 'action').trim())

      // Strip redundant leading saving throw or attack preamble if already shown in composite header cells
      if (context.stat && context.stat !== 'none') {
        desc = desc.replace(/^<i>[^<]*Saving Throw:<\/i>\s*DC\s*\d+(?:,\s*[^.]+)?\.\s*/i, '')
      }
      if (context.actionType === 'spell_attack' || context.actionType === 'weapon_attack') {
        desc = desc.replace(/^<i>(?:Melee|Ranged|Melee or Ranged)\s+(?:Weapon|Spell)\s+Attack(?: Roll)?:<\/i>\s*[+-]?\d+\s*to hit,\s*[^.]+\.\s*/i, '')
      }

      const canStreamline = !discipline && !components?.length && !duration && scope.length === 0 && mechanics.length === 0
      return buildPlateEntry(
        monster,
        {
          stagePool: context?.stagePool,
          name: context.name,
          usage: usageText(context),
          discipline,
          components,
          duration,
          mechanics,
          scope,
          streamline: canStreamline,
        },
        desc
      )
    }

    if (context.customPreamble) {
      return poolBadge + processTokens(`${context.description} ${formatDescriptionContainers(context.descriptionContainers, monster.randomTables)}`, context, monster, 'action')
    } else if (hasStructuredAbility(context)) {
      return structuredActionLine(context, monster, `${poolBadge}<b><i>${[usageText(context), abilityIdentity(context, 'html')].filter(Boolean).join(' · ')}.</i></b>`)
    } else if (context.stat !== 'none') {
      return processTokens(
        `${poolBadge}<b><i>{action.name}{action.limitedUse}.</i></b> <i>${t(
          `statFull.${context.stat}`
        )} Saving Throw:</i> DC ${saveForAction(
          monster,
          context.stat,
          context.save
        )}, {action.range}. {action.effects} ${context.description} ${formatDescriptionContainers(context.descriptionContainers, monster.randomTables)}`,
        context,
        monster,
        'action'
      )
    } else {
      return processTokens(
        `${poolBadge}<b><i>{action.name}{action.limitedUse}.</i></b> ${context.description} ${formatDescriptionContainers(context.descriptionContainers, monster.randomTables)}`,
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
    const poolBadge = entryBadge(context, monster)
    const { poolsLabel, conditionLabel } = formatReactionAvailability(context, monster.paragonConfig?.phaseName)
    const isModern = webProjection && editorStore.visualTemplate === 'modern'
    const trigger = context.trigger?.trim()
      ? `<i>${t('monster.reaction.trigger')}:</i> ${processTokens(context.trigger.trim(), context, monster, 'reaction')}`
      : ''
    // The trigger leads the printed text by default; authors may move it after the response.
    const withTrigger = (text: string): string => {
      if (!trigger) return text
      const lead = /[.!?]$/.test(trigger.replace(/<[^>]+>/g, '').trim()) ? trigger : `${trigger}.`
      if (!text.trim()) return lead
      return context.triggerPlacement === 'end' ? `${text} ${lead}` : `${lead} ${text}`
    }

    if (isModern && !context.customPreamble) {
      const asAction = context as unknown as MonsterAction
      const isStructured = hasStructuredAbility(context)
      if (isStructured) {
        const { ability, renderContext } = structuredRenderContext(asAction, monster)
        const mechanics = mechanicsPhrase(ability, renderContext).map(boldNumbers)
        const scopeText = scopePhrase(ability, renderContext)
        const scope = scopeText ? [boldNumbers(scopeText)] : []
        const effectsStr = outcomesHtml(ability, renderContext)
        const containersStr = formatDescriptionContainers(asAction.descriptionContainers, monster.randomTables)
        let desc = processTokens(`${effectsStr}${containersStr ? containersStr + ' ' : ''}${context.description || ''}`, context, monster, 'reaction').trim()
        if (context.stat && context.stat !== 'none') {
          desc = desc.replace(/^<i>[^<]*Saving Throw:<\/i>\s*DC\s*\d+(?:,\s*[^.]+)?\.\s*/i, '')
        }
        if (ability.attackSource) {
          desc = desc.replace(/^<i>(?:Melee|Ranged|Melee or Ranged)\s+(?:Weapon|Spell)\s+Attack(?: Roll)?:<\/i>\s*[+-]?\d+\s*to hit,\s*[^.]+\.\s*/i, '')
        }
        const { discipline, components, duration } = abilityHeader(asAction)
        return buildPlateEntry(
          monster,
          {
            stagePool: context?.stagePool,
            phaseText: poolsLabel,
            availability: conditionLabel,
            name: context.name,
            usage: usageText(context),
            discipline,
            components,
            duration,
            mechanics,
            scope,
            // A reaction whose header holds only its name puts the trigger beside the name.
            streamline: !discipline && !components?.length && !duration && scope.length === 0 && mechanics.length === 0 && !effectsStr.includes('action-outcomes-grid'),
          },
          withTrigger(desc)
        )
      }

      const { discipline, components, duration } = abilityHeader(asAction)
      const scopeParts: string[] = []
      if (asAction.range && asAction.range.trim()) scopeParts.push(asAction.range.trim())
      if (context.areaDistance && context.areaDistance.trim()) scopeParts.push(context.areaDistance.trim())
      if (context.areaShape && context.areaShape.trim()) scopeParts.push(context.areaShape.trim())
      if (context.targetsText && context.targetsText.trim()) scopeParts.push(context.targetsText.trim())
      const scope = scopeParts.length > 0 ? [boldNumbers(scopeParts.join(' '))] : []
      const mechanics: string[] = []
      if (context.actionType === 'spell_attack' || context.actionType === 'weapon_attack') {
        const isSpell = context.actionType === 'spell_attack'
        const bonus = structuredAttackBonus(asAction, monster as unknown as DomainMonster) ?? 0
        mechanics.push(`${isSpell ? 'Spell Attack' : 'Weapon Attack'} <strong class="dnd-num">${renderBonus(bonus)}</strong>`)
      }
      if (context.stat && context.stat !== 'none') {
        const dcVal = saveForAction(monster, context.stat, context.save)
        mechanics.push(`${t(`statFull.${context.stat}`)} Save <strong class="dnd-num">${dcVal}</strong>`)
      }
      const effectsStr = Array.isArray(asAction.effects) && asAction.effects.length > 0
        ? asAction.effects.map((e) => `<i>${e.case}:</i> ${e.effect}`).join(' ') + ' '
        : ''
      let desc = processTokens(`${effectsStr}${context.description || ''} ${formatDescriptionContainers(asAction.descriptionContainers, monster.randomTables)}`, context, monster, 'reaction').trim()
      if (context.stat && context.stat !== 'none') {
        desc = desc.replace(/^<i>[^<]*Saving Throw:<\/i>\s*DC\s*\d+(?:,\s*[^.]+)?\.\s*/i, '')
      }
      if (context.actionType === 'spell_attack' || context.actionType === 'weapon_attack') {
        desc = desc.replace(/^<i>(?:Melee|Ranged|Melee or Ranged)\s+(?:Weapon|Spell)\s+Attack(?: Roll)?:<\/i>\s*[+-]?\d+\s*to hit,\s*[^.]+\.\s*/i, '')
      }
      return buildPlateEntry(
        monster,
        {
          stagePool: context?.stagePool,
          phaseText: poolsLabel,
          availability: conditionLabel,
          name: context.name,
          usage: usageText(context),
          discipline,
          components,
          duration,
          mechanics,
          scope,
          // A reaction whose header holds only its name puts the trigger beside the name.
          streamline: !discipline && !components?.length && !duration && scope.length === 0 && mechanics.length === 0,
        },
        withTrigger(desc)
      )
    }

    if (context.customPreamble) {
      return poolBadge + processTokens(`${context.description} ${formatDescriptionContainers((context as unknown as Partial<MonsterAction>).descriptionContainers, monster.randomTables)}`, context, monster, 'reaction')
    }

    if (hasStructuredAbility(context as Partial<MonsterAction>)) {
      const { renderContext } = structuredRenderContext(context as unknown as MonsterAction, monster)
      const rawTrigger = context.trigger?.trim() ? `<i>${t('monster.reaction.trigger')}:</i> ${context.trigger.trim()}` : ''
      const prose = text2024(context as unknown as MonsterAction, renderContext, { markup: 'html', componentsInLead: true })
      const body = !rawTrigger ? prose : context.triggerPlacement === 'end' ? `${prose} ${rawTrigger}` : `${rawTrigger} ${prose}`
      return processTokens(`${poolBadge}<b><i>${abilityIdentity(context as Partial<MonsterAction>, 'html')}{reaction.limitedUse}.</i></b> ${body}`, context, monster, 'reaction')
    }

    const effectsStr = Array.isArray((context as unknown as MonsterAction).effects) && (context as unknown as MonsterAction).effects.length > 0
      ? `${(context as unknown as MonsterAction).effects.map((e) => `<i>${e.case}:</i> ${e.effect}`).join(' ')} `
      : ''
    const saveLead = context.stat && context.stat !== 'none'
      ? `<i>${t(`statFull.${context.stat}`)} Saving Throw:</i> DC ${saveForAction(monster, context.stat, context.save)}${(context as unknown as MonsterAction).range ? `, ${(context as unknown as MonsterAction).range}` : ''}. `
      : ''

    // case on the presence of a Trigger to choose old style rendering or new
    if (context.trigger === '') {
      return processTokens(
        `${poolBadge}<b><i>${context.name}{reaction.limitedUse}.</i></b> ${saveLead}${effectsStr}${context.description} ${formatDescriptionContainers((context as unknown as Partial<MonsterAction>).descriptionContainers, monster.randomTables)}`,
        context,
        monster,
        'reaction'
      )
    } else if (context.triggerPlacement === 'end') {
      return processTokens(
        `${poolBadge}<b><i>${context.name}{reaction.limitedUse}.</i></b> ${saveLead}${effectsStr}${context.description} ${formatDescriptionContainers((context as unknown as Partial<MonsterAction>).descriptionContainers, monster.randomTables)} <i>${t('monster.reaction.trigger')}:</i> ${context.trigger}`,
        context,
        monster,
        'reaction'
      )
    } else {
      return processTokens(
        `${poolBadge}<b><i>${context.name}{reaction.limitedUse}.</i></b> ${saveLead}<i>${t(
          'monster.reaction.trigger'
        )}:</i> ${context.trigger} <i>${t('monster.reaction.response')}:</i> ${effectsStr}${
          context.description
        } ${formatDescriptionContainers((context as unknown as Partial<MonsterAction>).descriptionContainers, monster.randomTables)}`,
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
    const poolBadge = entryBadge(context, monster)

    const isModern = webProjection && editorStore.visualTemplate === 'modern'

    if (isModern && !context.useCustomRenderer) {
      const prefix = `attacks[id=${encodeURIComponent(context.id)}]`
      const formatted = (field: string, text: string | number) => {
        const presentation = monster.bindings?.[`${prefix}.${field}`]?.presentation
        return presentation ? formatNumericPresentation(text, presentation) : String(text)
      }
      const kindLabel = context.kind === 'SPELL' ? 'Spell' : 'Weapon'
      const distStr =
        context.distance === 'MELEE'
          ? `Melee ${kindLabel} Attack`
          : context.distance === 'RANGED'
          ? `Ranged ${kindLabel} Attack`
          : `Melee or Ranged ${kindLabel} Attack`
      const toHit = monster.attackModifier(context.id)

      const reach =
        context.distance === 'MELEE'
          ? `Reach ${formatted('range.reach', context.range.reach)} ft.`
          : context.distance === 'RANGED'
          ? `Range ${formatted('range.standard', context.range.standard)}/${formatted('range.long', context.range.long)} ft.`
          : `Reach ${formatted('range.reach', context.range.reach)} ft. or Range ${formatted('range.standard', context.range.standard)}/${formatted('range.long', context.range.long)} ft.`
      const targets = `${formatted('targets', context.targets || 1)} ${context.targets > 1 ? 'targets' : 'target'}`

      // Build ONLY the Hit & description portion without repeating the attack/to-hit/reach/targets preamble
      const damageOnlyTemplate = '<i>Hit:</i> {attack.damage}{attack.conditionalDamage}{attack.additionalDamage}. {attack.description}'
      const body = processTokens(damageOnlyTemplate, context, monster, 'attack').trim()
      return buildPlateEntry(
        monster,
        {
          stagePool: context?.stagePool,
          name: context.name,
          mechanics: [`${distStr} <strong class="dnd-num">${formatted('modifier.overrideValue', renderBonus(toHit))}</strong>`],
          scope: [boldNumbers(`${reach}, ${targets}`)],
        },
        body
      )
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
    const context = innateCastingContext(unref(contextRef))

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
    const isModern = webProjection && editorStore.visualTemplate === 'modern'
    if (monster.multiattackOptions.useCustomRenderer) {
      return processTokens(
        monster.multiattackOptions.customMultiattackRenderer,
        context,
        monster,
        'multiattack'
      )
    }
    if (isModern) {
      const body = processTokens('{multiattack.all}. {multiattack.postscript}', context, monster, 'multiattack').trim()
      return buildPlateEntry(monster, { name: t('editor.multiattack.label'), streamline: true }, body)
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
    const isModern = webProjection && editorStore.visualTemplate === 'modern'

    if (action) {
      // process the name
      const count = cost > 1 ? t('editor.legendary.renderedCost', [cost]) : ''
      const costCell = cost > 1 ? `Costs ${cost} Actions` : '1 Action'

      // Legendary-only structured abilities read the action grammar; the cost replaces the usage chip.
      const structured = action.type === 'action' ? (action.action as MonsterAction) : undefined
      if (structured?.legendaryOnly && !structured.customPreamble && hasStructuredAbility(structured)) {
        return isModern
          ? structuredActionPlate(structured, monster, cost > 1 ? costCell : '')
          : structuredActionLine(structured, monster, `<b><i>${[cost > 1 ? costCell : '', abilityIdentity(structured, 'html')].filter(Boolean).join(' · ')}.</i></b>`)
      }

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
        return buildPlateEntry(
          monster,
          { stagePool: (action.action as { stagePool?: string }).stagePool, name: action.action.name, usage: cost > 1 ? costCell : '' },
          description
        )
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

    return `<b><i>${context.triggerName} (${context.triggerRecharge}).</i></b> ${trait}`
  }

  const processMythicActionPreamble = (
    contextRef: MaybeRef<Monster['mythicActions']>,
    monster: ReturnType<typeof useMonsterStore>
  ) => {
    const context = unref(contextRef)

    const preamble = processTokens(context.preamble, context, monster, 'mythic')

    return preamble
  }

  const processLairAction = (context: LairAction, monster: ReturnType<typeof useMonsterStore>, web = false): string => {
    const description = processTokens(`${context.description || ''} ${formatDescriptionContainers(context.descriptionContainers, monster.randomTables)}`, undefined, monster, 'none')
    return web && editorStore.visualTemplate === 'modern'
      ? buildPlateEntry(monster, { name: 'Lair Action' }, description)
      : description
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
    // Preserve actual generated table tags before escaping. Already escaped author text
    // must not be promoted into structural markup by the legacy tag restoration below.
    const tableTags: string[] = []
    let tableMarker = 'DNDSHEET_OUTCOME_TABLE_'
    while (input.includes(tableMarker)) tableMarker += '_'
    input = input.replace(/<(table class="outcome-dice-table"|\/?(?:table|caption|thead|tbody|tr|th|td|b|strong|i|em|u|s|strike|del|sub|sup|code|br|p|ul|ol|li)|th scope="col")>/gi, (tag) => `${tableMarker}${tableTags.push(tag) - 1};`)
    // allowed tags are: bold, italic, underline, br, div, span, svg, path
    input = input.replace(/>/gi, '&gt;')
    input = input.replace(/</gi, '&lt;')

    // allow b/i/u/br/strong
    const allowedTags = /\&lt;(\/?(?:b|strong|i|em|u|s|strike|del|sub|sup|code|br|p|ul|ol|li))\&gt;/gi
    input = input.replace(allowedTags, (match, tag) => {
      return '<' + tag + '>'
    })

    // Skill and tool names: a fixed, attribute-literal tag (italic, normal weight).
    input = input.replace(/&lt;em class="dnd-skill-name"&gt;/g, '<em class="dnd-skill-name">')

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

    return input.replace(new RegExp(`${tableMarker}(\\d+);`, 'g'), (_match, index) => tableTags[Number(index)])
  }

  // Structured plain-text exports share the semantic tag/entity boundary with Markdown and LaTeX.
  const stripTags = (input: string) => exportMarkup(input, 'plain')

  const mdFormatter = (input: string, blockquote = true) => {
    const text = exportMarkup(input, 'markdown')
    return blockquote ? text.replace(/\n/g, '\n> ') : text
  }

  const latexFormatter = (input: string) => exportMarkup(input, 'latex')
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
    structuredRenderContext,
    usageText,
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
    processLairAction,
    buildPlateEntry,
    sanitizeWebString,
    mdFormatter,
    latexFormatter,
    stripTags,
  }
}
