import { computed } from 'vue'
import { useMonsterStore } from 'src/stores/monster-store'
import { useSpellsStore } from 'src/stores/spells-store'
import { useI18n } from 'vue-i18n'
import { calculateCr } from 'src/core/usecases/CalculateCr'
import type { Monster } from 'src/core/domain/types'
import { renderBonus } from '../rendering/mathRendering'

export const ACTION_COLOR: Record<string, string> = {
  HP: 'green-8',
  Attack: 'red-10',
  Multiattack: 'red-10',
  LimitedMultiattack: 'red-10',
  Action: 'amber-10',
  Trait: 'teal-10',
  Legendary: 'cyan-8',
  Spell: 'purple-10',
  'Lair Action': 'blue-10',
}

export const useCr = () => {
  const monster = useMonsterStore()
  const spells = useSpellsStore()
  const { t } = useI18n()

  const crResult = computed(() => {
    return calculateCr(monster.$state as unknown as Monster, spells.spells)
  })

  const actionTypeColor = (type: string) => {
    return ACTION_COLOR[type] ?? 'dark'
  }

  const actionSequence = computed(() => crResult.value.actionSequence)
  const damagePerRound = computed(() => crResult.value.damagePerRound)
  const damageCr = computed(() => crResult.value.damageCr)
  const maxDc = computed(() => crResult.value.maxDc)
  const maxAttackRender = computed(() => crResult.value.maxAttackRender)
  const attackCrDelta = computed(() => crResult.value.attackCrDelta)
  const attackChipColor = computed(() => (!crResult.value.useDc ? 'red-10' : 'dark'))
  const filteredToHitActions = computed(() => crResult.value.filteredToHitActions)
  const actionsBelowThreshold = computed(() => crResult.value.actionsBelowThreshold)

  const dcChipColor = computed(() => (crResult.value.useDc ? 'red-10' : 'dark'))
  const filteredDcActions = computed(() => crResult.value.filteredDcActions)
  const dcsBelowThreshold = computed(() => crResult.value.dcsBelowThreshold)

  const offensiveCr = computed(() => crResult.value.offensiveCr)
  const ehp = computed(() => crResult.value.ehp)
  const hpCr = computed(() => crResult.value.hpCr)
  const ehpModifierList = computed(() => crResult.value.ehpModifierList)
  const eac = computed(() => crResult.value.eac)
  const acCrDelta = computed(() => crResult.value.acCrDelta)
  const eacModifierList = computed(() => crResult.value.eacModifierList)
  const defensiveCr = computed(() => crResult.value.defensiveCr)
  const estimatedCr = computed(() => crResult.value.estimatedCr)

  const attackCrExplain = computed(() => {
    if (!crResult.value) return ''
    if (crResult.value.useDc) return t('editor.cr.attackCrInactive')
    return t('editor.cr.attackCrExplain', [
      crResult.value.attackCrDelta ?? '',
      renderBonus(crResult.value.attackStepDelta ?? 0),
    ])
  })

  const dcCrExplain = computed(() => {
    if (!crResult.value) return ''
    if (!crResult.value.useDc) return t('editor.cr.dcCrInactive')
    return t('editor.cr.dcCrExplain', [
      crResult.value.attackCrDelta ?? '',
      renderBonus(crResult.value.dcStepDelta ?? 0),
    ])
  })

  const acCrExplain = computed(() => {
    if (!crResult.value?.acCr || !crResult.value?.defensiveCr) return ''
    const acCrAc = crResult.value.acCr.ac ?? 10
    const defCrAc = crResult.value.defensiveCr.ac ?? 10
    return t('editor.cr.acExplain', [
      crResult.value.acCrDelta ?? '',
      renderBonus(acCrAc - defCrAc),
    ])
  })

  return {
    actionSequence,
    actionTypeColor,
    attackCrExplain,
    damagePerRound,
    damageCr,
    maxDc,
    maxAttackRender,
    attackCrDelta,
    attackChipColor,
    actionsBelowThreshold,
    filteredToHitActions,
    filteredDcActions,
    dcChipColor,
    dcCrExplain,
    dcsBelowThreshold,
    offensiveCr,
    ehp,
    hpCr,
    ehpModifierList,
    eac,
    acCrDelta,
    acCrExplain,
    eacModifierList,
    defensiveCr,
    estimatedCr,
  }
}
