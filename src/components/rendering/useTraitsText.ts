import type { useProcessTokens as UseProcessTokens } from './useProcessTokens'
import { type DefenseEffect } from 'src/core/domain/basic-riders'
import { entryMatchesStagePool } from 'src/core/domain/entry-display'
import { normalizeDeathPrevention, regenTimingPhrase, resolveDynamicNumericSource, DynamicValueContext } from 'src/core/domain/defense-and-traits-utils'
import { computed } from 'vue'
import type { ComputedRef } from 'vue'
import _ from 'lodash'
import { defaultCrAnnotation } from '../models'
import type { useMonsterStore as UseMonsterStore } from 'src/stores/monster-store'

/** Traits: processed list, stage-pool filter, ordering and conditional/recharge grouping. Extracted verbatim from useTextRenderer (C1b). */
export function useTraitsText(monster: ReturnType<typeof UseMonsterStore>, { processTrait, dynCtx, scheduleDefense }: { processTrait: ReturnType<typeof UseProcessTokens>['processTrait']; dynCtx: ComputedRef<DynamicValueContext>; scheduleDefense: (effect: DefenseEffect, text: string) => string }) {
  const processedTraitsList = computed(() => {
    const list = [...(monster.traits ?? [])]

    // Regeneration & Temporary Hit Points Detailed Trait
    const regen = monster.extendedHp?.regeneration
    const regenAmtStr = regen
      ? resolveDynamicNumericSource(regen.valueSource, regen.amount ?? 10, regen.diceFormula, dynCtx.value)
      : '0'
    if (
      regen?.enabled &&
      regenAmtStr &&
      regenAmtStr !== '0' &&
      (regen.displayMode === 'detailed' || regen.displayMode === 'both')
    ) {
      const amt = regenAmtStr
      const recoveryType = regen.recoveryType || 'regen'
      const isTempHp = recoveryType === 'temp_hp' || recoveryType === 'absorb_temp_hp'
      const traitName = isTempHp
        ? (recoveryType === 'absorb_temp_hp' ? 'Absorbing Vigor' : 'Temporary Hit Points')
        : (recoveryType === 'absorb_hp' ? 'Damage Absorption' : 'Regeneration')

      const disTypes = Array.isArray(regen.disruptedByTypes) && regen.disruptedByTypes.length > 0
        ? regen.disruptedByTypes.join(' or ')
        : (regen.disruptedBy?.trim() || '')
      const note = regen.disruptedByNote ? regen.disruptedByNote.trim() : ''
      const dis = [disTypes, note].filter(Boolean).join(', ')

      const when = regenTimingPhrase(regen)
      let desc = ''
      if (recoveryType === 'absorb_temp_hp') {
        const absorbType = regen.triggeredByDamageType || 'lightning'
        desc = `Whenever the ${monster.name.toLowerCase()} is subjected to ${absorbType} damage, it takes no damage and instead gains a number of temporary hit points equal to ${amt}.`
      } else if (recoveryType === 'absorb_hp') {
        const absorbType = regen.triggeredByDamageType || 'necrotic'
        desc = `Whenever the ${monster.name.toLowerCase()} is subjected to ${absorbType} damage, it takes no damage and instead regains a number of hit points equal to ${amt}.`
      } else if (isTempHp) {
        // Pure temporary hit points gain
        desc = dis
          ? `The ${monster.name.toLowerCase()} gains ${amt} temporary hit points ${when}. If the ${monster.name.toLowerCase()} takes ${dis} damage, this trait doesn't function on its next occasion.`
          : `The ${monster.name.toLowerCase()} gains ${amt} temporary hit points ${when}.`
      } else {
        // Pure healing / regeneration
        desc = dis
          ? `The ${monster.name.toLowerCase()} regains ${amt} hit points ${when}. If the ${monster.name.toLowerCase()} takes ${dis} damage, this trait doesn't function on its next occasion. The ${monster.name.toLowerCase()} dies only if it starts its turn with 0 hit points and doesn't regenerate.`
          : `The ${monster.name.toLowerCase()} regains ${amt} hit points ${when} if it has at least 1 hit point.`
      }

      if (!list.some((t) => t.name?.trim().toLowerCase() === traitName.toLowerCase())) {
        list.push({
          id: 'auto-regeneration',
          name: traitName,
          description: scheduleDefense('regeneration', desc),
          limitedUse: { count: 0, rate: '' },
          customPreamble: false,
          crAnnotation: {
            ...defaultCrAnnotation(),
            include: false,
          },
        })
      }
    }

    // Death Prevention Detailed Trait (Immortal / Undead Fortitude)
    const dp = normalizeDeathPrevention(monster.extendedHp?.deathPrevention)
    if (
      dp?.enabled &&
      (dp.displayMode === 'detailed' || dp.displayMode === 'both')
    ) {
      const traitName = dp.name?.trim() || 'Immortal'
      const ex = Array.isArray(dp.exceptions) && dp.exceptions.length > 0
        ? dp.exceptions.join(' or ')
        : ''
      const note = dp.customNote ? dp.customNote.trim() : ''
      const exceptionsStr = [ex, note].filter(Boolean).join(', ')
      const returnHpVal = resolveDynamicNumericSource(
        dp.returnHpSource || 'flat',
        dp.returnHpValue ?? dp.returnHpAmount ?? 1,
        dp.returnHpDice,
        dynCtx.value
      ) || '1'
      const hpUnit = returnHpVal === '1' ? '1 hit point' : `${returnHpVal} hit points`

      const statNames: Record<string, string> = { STR: 'Strength', DEX: 'Dexterity', CON: 'Constitution', INT: 'Intelligence', WIS: 'Wisdom', CHA: 'Charisma' }
      const saveStat = statNames[String(dp.saveStat || 'CON').toUpperCase()] ?? String(dp.saveStat)
      let desc = ''
      if (dp.dcRule === 'dc_5_plus_dmg' || (traitName.toLowerCase() === 'undead fortitude' && !dp.requiresSave)) {
        const disPart = exceptionsStr ? `unless the damage is ${exceptionsStr}` : 'unless the damage is radiant or from a critical hit'
        desc = `If damage reduces the ${monster.name.toLowerCase()} to 0 hit points, it must make a Constitution saving throw with a DC of 5 + the damage taken, ${disPart}. On a success, the ${monster.name.toLowerCase()} drops to ${hpUnit} instead.`
      } else if (dp.requiresSave || dp.dcRule === 'custom_save') {
        const disPart = exceptionsStr ? `, unless the damage is ${exceptionsStr}` : ''
        desc = `If damage reduces the ${monster.name.toLowerCase()} to 0 hit points, it must make a DC ${dp.saveDc ?? 15} ${saveStat} saving throw${disPart}. On a success, the ${monster.name.toLowerCase()} drops to ${hpUnit} instead.`
      } else {
        const disPart = exceptionsStr ? `unless the damage is ${exceptionsStr}` : ''
        desc = `If damage reduces the ${monster.name.toLowerCase()} to 0 hit points${disPart ? ` (${disPart})` : ''}, it drops to ${hpUnit} instead.`
      }

      if (!list.some((t) => t.name?.trim().toLowerCase() === traitName.toLowerCase())) {
        list.push({
          id: 'auto-death-prevention',
          name: traitName,
          description: scheduleDefense('deathPrevention', desc),
          limitedUse: { count: 0, rate: '' },
          customPreamble: false,
          crAnnotation: {
            ...defaultCrAnnotation(),
            include: false,
          },
        })
      }
    }

    return list
  })

  const filterByStagePool = <T extends { stagePool?: string | number; availability?: import('src/core/domain/types').ReactionAvailabilitySet }>(items: T[]): T[] => {
    const isParagon = Boolean(monster.paragonConfig?.enabled || (monster.paragonConfig?.poolCount && monster.paragonConfig.poolCount > 1))
    if (!isParagon) return items
    const active = monster.paragonConfig?.activePoolFilter
    if (!active || active === 'all') return items
    return items.filter((item) => entryMatchesStagePool(item, active))
  }

  const traits = computed(() => {
    const list = filterByStagePool(processedTraitsList.value)
    if (monster.alphaTraits) {
      return _.sortBy(list, 'name').map((trait) => processTrait(trait, monster))
    } else {
      return list.map((trait) => processTrait(trait, monster))
    }
  })

  const groupedTraits = computed(() => {
    const standard: string[] = []
    const condMap = new Map<string, string[]>()
    const rechMap = new Map<string, string[]>()

    const sortedList = monster.alphaTraits
      ? _.sortBy(processedTraitsList.value, 'name')
      : processedTraitsList.value

    for (const trait of sortedList) {
      const processed = processTrait(trait, monster)

      if (trait.isConditional && trait.conditionalTrigger?.trim()) {
        const trigger = trait.conditionalTrigger.trim()
        if (!condMap.has(trigger)) {
          condMap.set(trigger, [])
        }
        condMap.get(trigger)!.push(processed)
      } else if (trait.renderInRechargeSection && trait.rechargeSection?.trim()) {
        const sec = trait.rechargeSection.trim()
        if (!rechMap.has(sec)) {
          rechMap.set(sec, [])
        }
        rechMap.get(sec)!.push(processed)
      } else {
        standard.push(processed)
      }
    }

    const conditionals = Array.from(condMap.entries()).map(([trigger, items]) => ({
      trigger,
      traits: items,
    }))

    const rechargeSections = Array.from(rechMap.entries()).map(([section, items]) => ({
      section,
      traits: items,
    }))

    return {
      standard,
      conditionals,
      rechargeSections,
    }
  })

  return { processedTraitsList, filterByStagePool, traits, groupedTraits }
}
