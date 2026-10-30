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
import { renderBonus, saveForAction, safeToWords, safeToOrdinal, statModifier } from './mathRendering'
import _ from 'lodash'
import { useI18n } from 'vue-i18n'

import { useClasses } from 'src/data/CLASS'
import { useEditorStore } from 'src/stores/editor-store'
import { processTokens as coreProcessTokens } from 'src/core/usecases/ProcessTokens'
import { boldNumbers, phaseLabel, plateHtml } from './plate'
import type { PlateCell } from './plate'
import { statblockUsageHelpKey } from './statblock-help'
import { formulaContextForMonster } from 'src/core/domain/formula-context'
import { hasStructuredAbility, inferAbility, mechanicsPhrase, outcomePhrase, scopePhrase, text2024 } from 'src/core/domain/ability-grammar'
import type { Monster as DomainMonster } from 'src/core/domain/types'
import type { LairAction } from 'src/core/domain/types'
import { listJoin } from './list-join'

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
          attacks.length > 0 ? ` followed by ${listJoin(attacks, ', ')}` : ''
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

  interface PlateEntrySpec {
    stagePool?: string | number
    name: string
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
  }

  /**
   * Header cell = | Phase · Usage · Discipline · NAME (components) duration |
   * then | mechanics | scope | extra | data cells, then the body.
   */
  const buildPlateEntry = (
    monster: ReturnType<typeof useMonsterStore>,
    spec: PlateEntrySpec,
    body: string
  ): string => {
    const quals: string[] = []
    const phase = phaseLabel(monster.paragonConfig?.phaseName, spec.stagePool)
    if (phase) quals.push(`<span class="sb-qual phase-cell" data-help="phase" tabindex="0">${phase}</span>`)
    if (spec.usage?.trim()) {
      const helpKey = statblockUsageHelpKey(spec.usage)
      const helpAttrs = helpKey ? ` data-help="${helpKey}" tabindex="0"` : ''
      quals.push(`<span class="sb-qual recharge-cell"${helpAttrs}>${spec.usage.trim()}</span>`)
    }
    if (spec.discipline?.trim()) quals.push(`<span class="sb-qual school-cell" data-help="spell-school-level" tabindex="0">${spec.discipline.trim()}</span>`)
    const comps = Array.isArray(spec.components) && spec.components.length > 0
      ? ` <span class="sb-qual sb-comp component-cell">(${spec.components.join(', ')})</span>`
      : ''
    const duration = spec.duration?.trim() && !/^instantaneous$/i.test(spec.duration.trim())
      ? ` <span class="sb-qual duration-cell">${spec.duration.trim()}</span>`
      : ''
    const head = `${quals.join(' ')}${quals.length ? ' ' : ''}<span class="sb-name cell-main-text">${spec.name}</span>${comps}${duration}`

    const cells: PlateCell[] = [{ html: head, head: true, cls: 'action-composite-pill name-cell' }]
    for (const m of spec.mechanics ?? []) if (m?.trim()) cells.push({ html: m, cls: 'mech-cell' })
    for (const s of spec.scope ?? []) if (s?.trim()) cells.push({ html: s, cls: 'scope-cell target-cell', help: 'scope' })
    for (const e of spec.extra ?? []) if (e?.trim()) cells.push({ html: e, cls: 'meta-cell' })
    return plateHtml({ rows: [{ cells, cls: 'action-composite-header' }], body })
  }

  const usageText = (context: { recharge?: string; rechargeMin?: number; rechargeMax?: number; limitedUse?: { count: number; rate: string; recharge?: string } }): string => {
    let recharge = (context.recharge || '').trim()
    if (!recharge && context.rechargeMin) {
      const max = context.rechargeMax || 6
      recharge = context.rechargeMin < max ? `${context.rechargeMin}–${max}` : `${context.rechargeMin}`
    }
    if (!recharge && context.limitedUse?.recharge) recharge = context.limitedUse.recharge.trim()
    if (!recharge && context.limitedUse?.rate === 'RECHARGE') recharge = '5–6'
    if (recharge) return /^recharge/i.test(recharge) ? recharge : `Recharge ${recharge}`
    if (context.limitedUse && context.limitedUse.count > 0 && context.limitedUse.rate) {
      const rateLabel = t(`recharge.${context.limitedUse.rate}`)
      const cleanRate = rateLabel.startsWith('recharge.') ? context.limitedUse.rate : rateLabel
      return `${context.limitedUse.count}/${cleanRate}`
    }
    return ''
  }

  // Structured (A6) abilities carry their mechanics in fields, not prose, so every template and
  // section must render them through the shared grammar or they collapse to a bare name.
  const structuredRenderContext = (context: MonsterAction, monster: ReturnType<typeof useMonsterStore>) => {
    const ability = inferAbility(context)
    const formulaContext = formulaContextForMonster(monster as unknown as DomainMonster)
    const attackBonus = context.attackBonus != null
      ? context.attackBonus
      : ability.attackSource === 'spell'
      ? monster.spellAttackModifier
      : ability.attackSource === 'weapon'
      ? monster.proficiency + statModifier(monster.stats?.STR ?? 10)
      : undefined
    const saveDc = context.stat && context.stat !== 'none'
      ? saveForAction(monster, context.stat, context.save)
      : undefined
    return { ability, renderContext: { attackBonus, saveDc, formulaContext } }
  }

  /** Modern Modular plate; `usage` is the recharge/uses chip, or the legendary cost. */
  const structuredActionPlate = (
    context: MonsterAction,
    monster: ReturnType<typeof useMonsterStore>,
    usage: string
  ): string => {
    const { ability, renderContext } = structuredRenderContext(context, monster)
    const mechanics = mechanicsPhrase(ability, renderContext).map(boldNumbers)
    const scopeText = scopePhrase(ability, renderContext)
    const scope = scopeText ? [boldNumbers(scopeText)] : []
    const outcomeHtml = outcomePhrase(ability, renderContext)
      .map((line) => line.replace(/^([^:]+):/, '<i>$1:</i>'))
    const effectsStr = outcomeHtml.length ? `${outcomeHtml.join(' ')} ` : ''
    let desc = processTokens(`${effectsStr}${context.description || ''}`, context, monster, 'action').trim()

    if (context.stat && context.stat !== 'none') {
      desc = desc.replace(/^<i>[^<]*Saving Throw:<\/i>\s*DC\s*\d+(?:,\s*[^.]+)?\.\s*/i, '')
    }
    if (ability.attackSource) {
      desc = desc.replace(/^<i>(?:Melee|Ranged|Melee or Ranged)\s+(?:Weapon|Spell)\s+Attack(?: Roll)?:<\/i>\s*[+-]?\d+\s*to hit,\s*[^.]+\.\s*/i, '')
    }

    const tier = context.spellLevel && context.spellLevel !== 'None' ? context.spellLevel : ''
    const school = context.school && context.school !== 'None' ? context.school : ''
    const discipline = /^cantrip$/i.test(tier) ? [school, tier].filter(Boolean).join(' ') : [tier, school].filter(Boolean).join(' ')
    return buildPlateEntry(
      monster,
      {
        stagePool: context.stagePool,
        name: context.name,
        usage,
        discipline,
        components: context.components,
        duration: context.duration,
        mechanics,
        scope,
      },
      desc
    )
  }

  /** Classic WotC line: the bold-italic lead, then the 2024 rules text with italic clause labels. */
  const structuredActionLine = (
    context: MonsterAction,
    monster: ReturnType<typeof useMonsterStore>,
    lead: string
  ): string => {
    const { renderContext } = structuredRenderContext(context, monster)
    return processTokens(`${lead} ${text2024(context, renderContext, { markup: 'html' })}`, context, monster, 'action')
  }

  const processTrait = (
    contextRef: MaybeRef<MonsterTrait>,
    monster: ReturnType<typeof useMonsterStore>
  ) => {
    const context = unref(contextRef)
    const pName = monster.paragonConfig?.phaseName?.trim() || 'Phase'
    const poolBadge = context?.stagePool && context.stagePool !== 'all' ? `<span class="dnd-pool-badge">[${pName} ${context.stagePool}]</span> ` : ''
    const isModern = webProjection && editorStore.visualTemplate === 'modern'

    if (isModern && !context.customPreamble) {
      const tag = computeTraitTag(context)
      const usage = tag
        ? tag
        : context.limitedUse && context.limitedUse.count > 0 && context.limitedUse.rate
        ? `${context.limitedUse.count}/${t(`recharge.${context.limitedUse.rate}`)}`
        : ''
      const desc = processTokens(context.description, context, monster, 'trait')
      return buildPlateEntry(monster, { stagePool: context?.stagePool, name: context.name, usage }, desc)
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

    const isModern = webProjection && editorStore.visualTemplate === 'modern'

    if (isModern && !context.customPreamble) {
      if (hasStructuredAbility(context)) return structuredActionPlate(context, monster, usageText(context))

      // Discipline: "Evocation Cantrip" for cantrips, "3rd Level Evocation" otherwise (PHB 2024 order)
      const tier = context.spellLevel && context.spellLevel !== 'None' ? context.spellLevel : ''
      const school = context.school && context.school !== 'None' ? context.school : ''
      const discipline = /^cantrip$/i.test(tier) ? [school, tier].filter(Boolean).join(' ') : [tier, school].filter(Boolean).join(' ')

      // Targets / range / area, numbers in bold
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
      const scope = scopeParts.length > 0 ? [boldNumbers(scopeParts.join(' '))] : []

      // Mechanics: | Ranged Spell Attack +7 |, | Charisma Save 15 |
      const mechanics: string[] = []
      if (context.actionType === 'spell_attack' || context.actionType === 'weapon_attack') {
        const isSpell = context.actionType === 'spell_attack'
        const bonus = context.attackBonus != null
          ? context.attackBonus
          : isSpell
          ? monster.spellAttackModifier
          : monster.proficiency + statModifier(monster.stats?.STR ?? 10)
        mechanics.push(`${isSpell ? 'Spell Attack' : 'Weapon Attack'} <strong class="dnd-num">${renderBonus(bonus)}</strong>`)
      }
      if (context.stat && context.stat !== 'none') {
        const dcVal = saveForAction(monster, context.stat, context.save)
        mechanics.push(`${t(`statFull.${context.stat}`)} Save <strong class="dnd-num">${dcVal}</strong>`)
      }

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

      return buildPlateEntry(
        monster,
        {
          stagePool: context?.stagePool,
          name: context.name,
          usage: usageText(context),
          discipline,
          components: context.components,
          duration: context.duration,
          mechanics,
          scope,
        },
        desc
      )
    }

    if (context.customPreamble) {
      return poolBadge + processTokens(context.description, context, monster, 'action')
    } else if (hasStructuredAbility(context)) {
      return structuredActionLine(context, monster, `${poolBadge}<b><i>{action.name}{action.limitedUse}.</i></b>`)
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
    const isModern = webProjection && editorStore.visualTemplate === 'modern'

    if (isModern) {
      const trigger = context.trigger?.trim()
        ? `<i>${t('monster.reaction.trigger')}:</i> ${processTokens(context.trigger.trim(), context, monster, 'reaction')}`
        : ''
      const desc = processTokens(context.description, context, monster, 'reaction')
      return buildPlateEntry(
        monster,
        { stagePool: context?.stagePool, name: context.name, usage: usageText(context), extra: trigger ? [trigger] : [] },
        desc
      )
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

    const isModern = webProjection && editorStore.visualTemplate === 'modern'

    if (isModern && !context.useCustomRenderer) {
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
          ? `Reach ${context.range.reach} ft.`
          : context.distance === 'RANGED'
          ? `Range ${context.range.standard}/${context.range.long} ft.`
          : `Reach ${context.range.reach} ft. or Range ${context.range.standard}/${context.range.long} ft.`
      const targets = context.targets && context.targets > 1 ? `${context.targets} targets` : '1 target'

      // Build ONLY the Hit & description portion without repeating the attack/to-hit/reach/targets preamble
      const damageOnlyTemplate = '<i>Hit:</i> {attack.damage}{attack.conditionalDamage}{attack.additionalDamage}. {attack.description}'
      const body = processTokens(damageOnlyTemplate, context, monster, 'attack').trim()
      return buildPlateEntry(
        monster,
        {
          stagePool: context?.stagePool,
          name: context.name,
          mechanics: [`${distStr} <strong class="dnd-num">${renderBonus(toHit)}</strong>`],
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
      return buildPlateEntry(monster, { name: t('editor.multiattack.label') }, body)
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
          : structuredActionLine(structured, monster, `<b><i>${structured.name}${count}.</i></b>`)
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
    const description = processTokens(context.description, undefined, monster, 'none')
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
    sanitizeWebString,
    mdFormatter,
    latexFormatter,
    stripTags,
  }
}
