import type { useI18n } from 'vue-i18n'
import type { useClasses } from 'src/data/CLASS'
import type { useEditorStore } from 'src/stores/editor-store'
import { resolveCastingAbility } from 'src/core/domain/casting-ability'
import { formatNumericPresentation } from 'src/core/domain/numeric-presentation'
import { formatLimitedUses } from 'src/core/domain/cadence'
import { countMultiattackReferences } from 'src/core/domain/multiattack-composer'
import { actionRecharge } from 'src/core/domain/action-usage'
import { computeTraitTag } from 'src/core/domain/defense-and-traits-utils'
import { useMonsterStore } from 'src/stores/monster-store'
import { DndAttack, Monster, MonsterAction, MonsterReaction, MonsterTrait } from '../models'
import { renderBonus, safeToWords, safeToOrdinal } from './mathRendering'
import _ from 'lodash'
import { processTokens as coreProcessTokens } from 'src/core/usecases/ProcessTokens'
import type { Monster as DomainMonster } from 'src/core/domain/types'
import { listJoin } from './list-join'

// Per-entry {token} substitution (traits, spells, attacks, actions, reactions, multiattack, legendary), split from useProcessTokens.
export interface CreateEntryTokenProcessorsDeps {
  t: ReturnType<typeof useI18n>['t']
  classes: ReturnType<typeof useClasses>
  editorStore: ReturnType<typeof useEditorStore>
  webProjection: boolean
}

export function createEntryTokenProcessors({ t, classes, editorStore, webProjection }: CreateEntryTokenProcessorsDeps) {
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

  const formatActionOrReactionUsage = (context: { recharge?: string; rechargeMin?: number; rechargeMax?: number; limitedUse?: { count: number; rate: string; recharge?: string } }): string => {
    const rechargeVal = actionRecharge(context).replace(/^Recharge\s+/i, '')
    if (rechargeVal) return ` ${t('editor.action.recharge', [rechargeVal])}`
    if (context.limitedUse && context.limitedUse.count > 0 && context.limitedUse.rate && context.limitedUse.rate !== 'RECHARGE') {
      return ` (${formatLimitedUses(context.limitedUse.count, context.limitedUse.rate)})`
    }
    return ''
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

    const limitedUseStr = formatActionOrReactionUsage(context)
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
    const limitedUse = formatActionOrReactionUsage(context)

    input = input.replace(
      /\{reaction.limitedUse\}/gi,
      limitedUse
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
      // English multiattack phrasing; localisation is tracked in C5.
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

  return { processTraitTokens, processSpellTokens, processAttackTokens, formatActionOrReactionUsage, processActionTokens, processReactionTokens, processMultiattackTokens, processLegendaryTokens }
}
