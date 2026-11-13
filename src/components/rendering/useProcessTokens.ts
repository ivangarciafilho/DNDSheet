import { innateCastingContext, resolveCastingAbility } from 'src/core/domain/casting-ability'
import { formatNumericPresentation } from 'src/core/domain/numeric-presentation'
import { sanitizeProsePunctuation } from 'src/core/domain/number-grammar'
import { outcomesHtml } from 'src/core/domain/outcome-rendering'
import { descriptionContainersHtml } from 'src/core/domain/description-containers'
import { structuredAttackBonus } from 'src/core/domain/structured-attack'
import { formatLimitedUses } from 'src/core/domain/cadence'
import { countMultiattackReferences } from 'src/core/domain/multiattack-composer'
import { actionRecharge } from 'src/core/domain/action-usage'
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
import { renderBonus, saveForAction, safeToWords, safeToOrdinal } from './mathRendering'
import _ from 'lodash'
import { useI18n } from 'vue-i18n'

import { useClasses } from 'src/data/CLASS'
import { useEditorStore } from 'src/stores/editor-store'
import { processTokens as coreProcessTokens } from 'src/core/usecases/ProcessTokens'
import { boldNumbers, phaseLabel, plateHtml } from './plate'
import type { PlateCell } from './plate'
import { statblockUsageHelpKey } from './statblock-help'
import { formulaContextForMonster } from 'src/core/domain/formula-context'
import { abilityHeader, abilityIdentity, hasStructuredAbility, inferAbility, mechanicsPhrase, scopePhrase, text2024 } from 'src/core/domain/ability-grammar'
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
      ? ` (${formatLimitedUses(context.limitedUse.count, context.limitedUse.rate)})`
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
    const ability = resolveCastingAbility(context, monster.stats, monster.proficiency)
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
    input = input.replace(/\{spellcasting.save\}/gi, `DC ${ability.save}`)

    // spell attack
    input = input.replace(
      /\{spellcasting.attack\}/gi,
      renderBonus(ability.attack)
    )

    // ability modifier
    input = input.replace(
      /\{spellcasting.ability\}/gi,
      renderBonus(ability.modifier)
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
    const prefix = `attacks[id=${encodeURIComponent(context.id)}]`
    const formatted = (field: string, text: string | number): string => {
      const presentation = webProjection ? monster.bindings?.[`${prefix}.${field}`]?.presentation : undefined
      return presentation ? formatNumericPresentation(text, presentation) : String(text)
    }
    // Resolve a dice expression first, then format its semantic components. HTML never enters the parser.
    const diceDisplay = (field: string, count: number, die: number, modifier = 0): string => {
      const raw = `{${count}d${die}${modifier === 0 ? '' : renderBonus(modifier)}}`
      const style = webProjection && ['count','dice','modifier.overrideValue'].some(key => monster.bindings?.[`${prefix}.${field}.${key}`]?.presentation)
      if (!style) return raw
      const resolved = coreProcessTokens(raw, ((monster as unknown as { $state?: DomainMonster }).$state ?? monster) as unknown as DomainMonster)
      const parts = /^(.*?) \((\d+)d(\d+)(.*?)\)$/.exec(resolved)
      if (!parts) return formatted(field + '.count', resolved)
      return `${parts[1]} (${formatted(field + '.count', parts[2])}d${formatted(field + '.dice', parts[3])}${parts[4] ? formatted(field + '.modifier.overrideValue', parts[4]) : ''})`
    }
    input = input.replace(/\{attack.save\}/gi, formatted('save', context.save ?? ''))
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
      formatted('modifier.overrideValue', renderBonus(monster.attackModifier(context.id)))
    )

    // range
    const meleeRange = t('editor.attack.meleeRange', [formatted('range.reach', context.range.reach)])
    const rangeRange = t('editor.attack.rangeRange', [
      formatted('range.standard', context.range.standard),
      formatted('range.long', context.range.long),
    ])
    const bothRange = t('editor.attack.bothRange', [
      formatted('range.reach', context.range.reach),
      formatted('range.standard', context.range.standard),
      formatted('range.long', context.range.long),
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
            count: formatted('targets', safeToWords(context.targets)),
          },
          context.targets
        )}`
      )
    } else {
      input = input.replace(/\{attack.targets\}/gi, '')
    }

    // primary damage
    const damageModifier = monster.attackDamageModifier(context.id)
    const primary = t('editor.attack.damage', [
      `${diceDisplay('damage', context.damage.count, context.damage.dice, damageModifier)} ${context.damage.type}`,
    ])
    input = input.replace(/\{attack.damage\}/gi, primary)

    // conditional damage
    const conditionalDamageModifier = monster.conditionalDamageModifier(
      context.id
    )
    const conditional = t('editor.attack.damage', [
      `${diceDisplay('alternateDamage', context.alternateDamage.count, context.alternateDamage.dice, conditionalDamageModifier)} ${context.alternateDamage.type}`,
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
      const damage = `${diceDisplay(`additionalDamage[id=${encodeURIComponent(d.id)}]`, d.count, d.dice)} ${d.type}`

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
    const rechargeVal = actionRecharge(context).replace(/^Recharge\s+/i, '')
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
      limitedUseStr = ` (${formatLimitedUses(context.limitedUse.count, context.limitedUse.rate)})`
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
    const limitedUse = context.limitedUse && context.limitedUse.rate ? ` (${formatLimitedUses(context.limitedUse.count, context.limitedUse.rate)})` : ''

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
      // render attacks
      const attacks = countMultiattackReferences(ma.attacks).map(([id, count]) => {
        return t(
          'editor.multiattack.attack',
          { a: `${safeToWords(count)} ${monster.attackName(id)}` },
          count
        )
      })

      // map actions
      // render actions
      const actions = countMultiattackReferences(ma.actions).map(([id, count]) => {
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
    if ((monster as any).customVariables) {
      for (const [varKey, varVal] of Object.entries((monster as any).customVariables)) {
        if (!varKey) continue;
        input = input.replace(new RegExp(`\\{${varKey}\\}`, 'gi'), String(varVal));
      }
    }
    if ((monster as any).customMacros) {
      for (const [macroKey, macroVal] of Object.entries((monster as any).customMacros)) {
        if (!macroKey) continue;
        input = input.replace(new RegExp(`\\{${macroKey}\\}`, 'gi'), String(macroVal));
      }
    }

    return input
  }

  interface PlateEntrySpec {
    stagePool?: string | number
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
    // Authored tags ("Recharges after {PB} rounds") resolve like any other mechanic text.
    const printedUsage = spec.usage?.includes('{') ? processMonsterTokens(spec.usage, monster) : spec.usage
    if (printedUsage?.trim()) {
      const helpKey = statblockUsageHelpKey(printedUsage)
      const helpAttrs = helpKey ? ` data-help="${helpKey}" tabindex="0"` : ''
      quals.push(`<span class="sb-qual recharge-cell"${helpAttrs}>${printedUsage.trim()}</span>`)
    }
    const classification = spec.discipline?.trim()
    const comps = Array.isArray(spec.components) && spec.components.length > 0
      ? spec.components.join(', ')
      : ''
    const spellMetaParts: string[] = []
    if (classification) {
      spellMetaParts.push(`<span class="sb-qual school-cell" data-help="spell-school-level" tabindex="0">${classification}</span>`)
    }
    if (comps) {
      spellMetaParts.push(`<span class="sb-qual sb-comp component-cell dnd-spell-comp" data-help="spell-components" tabindex="0">(${comps})</span>`)
    }
    const spellMetaSuffix = spellMetaParts.length > 0 ? `, ${spellMetaParts.join(' ')}` : ''
    const nameHtml = `${quals.join(' ')}${quals.length ? ' ' : ''}<span class="sb-name cell-main-text">${spec.name}${spellMetaSuffix}</span>`
    const headerCells: PlateCell[] = [
      { html: nameHtml, head: true, cls: 'action-composite-pill name-cell' }
    ]

    if (spec.scores?.trim()) {
      headerCells.push({
        html: `<span class="sb-scores scores-cell">${spec.scores.trim()}</span>`,
        cls: 'scores-cell'
      })
    }

    const duration = spec.duration?.trim() && !/^instantaneous$/i.test(spec.duration.trim())
      ? spec.duration.trim()
      : ''
    if (duration) {
      headerCells.push({
        html: `<span class="sb-qual duration-cell">${duration}</span>`,
        cls: 'duration-cell'
      })
    }

    const mechItems = (spec.mechanics ?? [])
      .filter((m) => m?.trim())
      .map((m) => m.replace(/\b(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma|STR|DEX|CON|INT|WIS|CHA)\s+Save\s+(?!(?:DC\b))(<span[^>]*>\d+<\/span>|\d+)/i, '$1 Save DC $2'))
    const scopeItems = (spec.scope ?? []).filter((s) => s?.trim())
    const rows: PlateRow[] = [
      { cells: headerCells, cls: 'action-composite-header' }
    ]

    const isSpellLike = Boolean(classification || comps || duration)

    if (isSpellLike) {
      for (const m of mechItems) {
        headerCells.push({ html: m, cls: 'mech-cell' })
      }
      const row2Cells: PlateCell[] = []
      for (const s of scopeItems) {
        row2Cells.push({ html: s, cls: 'scope-cell target-cell', help: 'scope' })
      }
      for (const e of spec.extra ?? []) {
        if (e?.trim()) row2Cells.push({ html: e, cls: 'meta-cell' })
      }
      if (row2Cells.length > 0) {
        rows.push({ cells: row2Cells, cls: 'action-composite-details' })
      }
    } else {
      const row2Cells: PlateCell[] = []
      for (const s of scopeItems) {
        row2Cells.push({ html: s, cls: 'scope-cell target-cell', help: 'scope' })
      }
      for (const m of mechItems) {
        row2Cells.push({ html: m, cls: 'mech-cell' })
      }
      for (const e of spec.extra ?? []) {
        if (e?.trim()) row2Cells.push({ html: e, cls: 'meta-cell' })
      }

      if (row2Cells.length > 0) {
        if (!spec.scores && headerCells.length === 1) {
          // Simple/physical attacks like Slam: combine name and reach/targeting on Row 1
          rows[0].cells = [...headerCells, ...row2Cells]
        } else {
          rows.push({ cells: row2Cells, cls: 'action-composite-details' })
        }
      }
    }

    if (spec.streamline && rows.length === 1 && rows[0].cells.length === 1 && !classification && !comps && !duration && !spec.scores && body.trim()) {
      const plainBody = body.replace(/<[^>]+>/g, '').trim()
      const singleLineCls = plainBody.length <= 55 ? ' sb-single-line' : ''
      headerCells.push({
        html: boldNumbers(body),
        cls: 'sb-body sb-grow action-body-text'
      })
      return plateHtml({ rows, body: '', cls: `sb-trait-streamlined${singleLineCls}` })
    }

    // An entry whose only content is one text cell beside the name (mechanics or scope prose merged
    // into row 1, or a skill group's scores) must wrap under the name, not drop into its own column.
    const merged = rows[0].cells
    if (rows.length === 1 && !body.trim() && merged.length === 2 && merged[0].head && !classification && !comps && !duration) {
      const text = merged[1]
      const plainText = String(text.html ?? '').replace(/<[^>]+>/g, '').trim()
      if (plainText) {
        rows[0].cells = [merged[0], { ...text, cls: `sb-body sb-grow action-body-text ${text.cls ?? ''}`.trim() }]
        const singleLineCls = plainText.length <= 55 ? ' sb-single-line' : ''
        return plateHtml({ rows, body: '', cls: `sb-trait-streamlined${singleLineCls}` })
      }
    }

    return plateHtml({ rows, body })
  }

  const usageText = (context: { recharge?: string; rechargeMin?: number; rechargeMax?: number; limitedUse?: { count: number; rate: string; recharge?: string } }): string => {
    const recharge = actionRecharge(context)
    if (recharge) return /^recharge/i.test(recharge) ? recharge : `Recharge ${recharge}`
    if (context.limitedUse && context.limitedUse.count > 0 && context.limitedUse.rate) {
      return formatLimitedUses(context.limitedUse.count, context.limitedUse.rate)
    }
    return ''
  }

  // Structured (A6) abilities carry their mechanics in fields, not prose, so every template and
  // section must render them through the shared grammar or they collapse to a bare name.
  const structuredRenderContext = (context: MonsterAction, monster: ReturnType<typeof useMonsterStore>) => {
    const ability = inferAbility(context)
    const formulaContext = formulaContextForMonster(monster as unknown as DomainMonster)
    const attackBonus = structuredAttackBonus(context, monster as unknown as DomainMonster)
    const saveDc = context.stat && context.stat !== 'none'
      ? saveForAction(monster, context.stat, context.save)
      : undefined
    const collection = (['actions','traits','reactions'] as const).find(key => monster[key]?.some(entry => entry.id === context.id))
    const prefix = collection && context.id ? `${collection}[id=${encodeURIComponent(context.id)}]` : undefined
    const formatValue = webProjection && prefix ? (field: string, text: string) => {
      const presentation = monster.bindings?.[`${prefix}.${field}`]?.presentation
      return presentation ? formatNumericPresentation(text, presentation) : text
    } : undefined
    return { ability, renderContext: { attackBonus, saveDc, formulaContext, randomTables: monster.randomTables, formatValue, compactScope: webProjection } }
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
    const effectsStr = outcomesHtml(ability, renderContext)
    const containersStr = formatDescriptionContainers(context.descriptionContainers, monster.randomTables)
    let desc = sanitizeProsePunctuation(processTokens(`${effectsStr}${containersStr ? containersStr + ' ' : ''}${context.description || ''}`, context, monster, 'action').trim())

    if (context.stat && context.stat !== 'none') {
      desc = desc.replace(/^<i>[^<]*Saving Throw:<\/i>\s*DC\s*\d+(?:,\s*[^.]+)?\.\s*/i, '')
    }
    if (ability.attackSource) {
      desc = desc.replace(/^<i>(?:Melee|Ranged|Melee or Ranged)\s+(?:Weapon|Spell)\s+Attack(?: Roll)?:<\/i>\s*[+-]?\d+\s*to hit,\s*[^.]+\.\s*/i, '')
    }

    const { discipline, components, duration } = abilityHeader(context)
    const canStreamline = !discipline && !components?.length && !duration && scope.length === 0 && mechanics.length === 0 && !effectsStr.includes('action-outcomes-grid')
    return buildPlateEntry(
      monster,
      {
        stagePool: context.stagePool,
        name: context.name,
        usage,
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

  /** Classic WotC line: the bold-italic lead, then the 2024 rules text with italic clause labels. */
  const structuredActionLine = (
    context: MonsterAction,
    monster: ReturnType<typeof useMonsterStore>,
    lead: string
  ): string => {
    const { renderContext } = structuredRenderContext(context, monster)
    return processTokens(`${lead} ${text2024(context, renderContext, { markup: 'html', componentsInLead: true })}`, context, monster, 'action')
  }

  const processTrait = (
    contextRef: MaybeRef<MonsterTrait>,
    monster: ReturnType<typeof useMonsterStore>
  ) => {
    const context = unref(contextRef)
    const pName = monster.paragonConfig?.phaseName?.trim() || 'Phase'
    const poolBadge = context?.stagePool && context.stagePool !== 'all' ? `<span class="dnd-pool-badge">[${pName} ${context.stagePool}]</span> ` : ''
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
    const pName = monster.paragonConfig?.phaseName?.trim() || 'Phase'
    const poolBadge = context?.stagePool && context.stagePool !== 'all' ? `<span class="dnd-pool-badge">[${pName} ${context.stagePool}]</span> ` : ''

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
      let desc = sanitizeProsePunctuation(processTokens(`${effectsStr}${context.description || ''}`, context, monster, 'action').trim())

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
    const isModern = webProjection && editorStore.visualTemplate === 'modern'

    if (isModern) {
      const isStructured = hasStructuredAbility(context as any) || !!context.school || !!context.spellLevel || (!!context.stat && context.stat !== 'none') || !!context.attackSource
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

      if (isStructured) {
        const { ability, renderContext } = structuredRenderContext(context as unknown as MonsterAction, monster)
        const mechanics = mechanicsPhrase(ability, renderContext).map(boldNumbers)
        const scopeText = scopePhrase(ability, renderContext)
        const scope = scopeText ? [boldNumbers(scopeText)] : []
        const effectsStr = outcomesHtml(ability, renderContext)
        let desc = processTokens(`${effectsStr}${formatDescriptionContainers((context as unknown as Partial<MonsterAction>).descriptionContainers, monster.randomTables)} ${context.description || ''}`, context, monster, 'reaction').trim()
        if (context.stat && context.stat !== 'none') {
          desc = desc.replace(/^<i>[^<]*Saving Throw:<\/i>\s*DC\s*\d+(?:,\s*[^.]+)?\.\s*/i, '')
        }
        if (ability.attackSource) {
          desc = desc.replace(/^<i>(?:Melee|Ranged|Melee or Ranged)\s+(?:Weapon|Spell)\s+Attack(?: Roll)?:<\/i>\s*[+-]?\d+\s*to hit,\s*[^.]+\.\s*/i, '')
        }
        const { discipline, components, duration } = abilityHeader(context as unknown as MonsterAction)
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
          },
          withTrigger(desc)
        )
      }

      const desc = processTokens(`${context.description} ${formatDescriptionContainers((context as unknown as Partial<MonsterAction>).descriptionContainers, monster.randomTables)}`, context, monster, 'reaction')
      return buildPlateEntry(
        monster,
        { stagePool: context?.stagePool, name: context.name, usage: usageText(context) },
        withTrigger(desc)
      )
    }

    if (hasStructuredAbility(context as Partial<MonsterAction>)) {
      const { renderContext } = structuredRenderContext(context as unknown as MonsterAction, monster)
      const trigger = context.trigger?.trim() ? `<i>${t('monster.reaction.trigger')}:</i> ${context.trigger.trim()}` : ''
      const prose = text2024(context as unknown as MonsterAction, renderContext, { markup: 'html', componentsInLead: true })
      const body = !trigger ? prose : context.triggerPlacement === 'end' ? `${prose} ${trigger}` : `${trigger} ${prose}`
      return processTokens(`<b><i>${context.name}{reaction.limitedUse}.</i></b> ${body}`, context, monster, 'reaction')
    }

    // case on the presence of a Trigger to choose old style rendering or new
    if (context.trigger === '') {
      return processTokens(
        `<b><i>${context.name}{reaction.limitedUse}.</i></b> ${context.description} ${formatDescriptionContainers((context as unknown as Partial<MonsterAction>).descriptionContainers, monster.randomTables)}`,
        context,
        monster,
        'reaction'
      )
    } else if (context.triggerPlacement === 'end') {
      return processTokens(
        `<b><i>${context.name}{reaction.limitedUse}.</i></b> ${context.description} ${formatDescriptionContainers((context as unknown as Partial<MonsterAction>).descriptionContainers, monster.randomTables)} <i>${t('monster.reaction.trigger')}:</i> ${context.trigger}`,
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
    const pName = monster.paragonConfig?.phaseName?.trim() || 'Phase'
    const poolBadge = context?.stagePool && context.stagePool !== 'all' ? `<span class="dnd-pool-badge">[${pName} ${context.stagePool}]</span> ` : ''

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
    const allowedTags = /\&lt;(\/?[b|i|u]|br|strong)\&gt;/gi
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
