<template>
  <q-expansion-item v-if="entry" dense label="Display and CR settings" v-help="'How this entry prints and whether it counts toward CR.'" icon="tune" class="q-mt-sm" :data-entry-settings="entryId">
    <div class="row q-col-gutter-sm q-pa-sm">
      <template v-if="field === 'actions'">
        <q-select :model-value="action?.stagePool ?? 'all'" :options="phaseOptions" emit-value map-options dense outlined dark label="Phase / pool" v-help="'Paragon stage in which this entry is available.'" data-entry-phase class="col-12 col-sm-6" @update:model-value="value => update('stagePool', value)" />
        <q-checkbox :model-value="Boolean(action?.customPreamble)" dark dense label="Description supplies its own heading" v-help="'Do not print the name; the description already starts with it.'" data-entry-custom-heading class="col-12 col-sm-6" @update:model-value="value => update('customPreamble', value)" />
        <div v-if="action?.customPreamble" class="col-12 text-caption">Your description prints without an automatic name or cadence heading.</div>
      </template>
      <template v-else-if="field === 'reactions' && reaction">
        <q-select :model-value="reaction.availability?.predicate ?? 'always'" :options="predicateOptions" emit-value map-options dense outlined dark label="Availability condition" v-help="'HP or combat state required to use this reaction.'" data-reaction-predicate class="col-12 col-sm-6" @update:model-value="value => updateReactionAvailability({ predicate: value })" />
        <q-input :model-value="reaction.availability?.customCondition ?? ''" dense outlined dark label="Condition qualifier (optional)" placeholder="e.g., while holding its staff" v-help="'Additional qualifier printed alongside the availability state.'" data-reaction-custom-condition class="col-12 col-sm-6" @update:model-value="value => updateReactionAvailability({ customCondition: typeof value === 'string' ? value : '' })" />
        <div class="col-12" data-reaction-stage-pools>
          <div class="text-caption text-grey-4 q-mb-xs">Available in {{ phaseRoot }}s</div>
          <div class="row items-center q-gutter-x-md q-gutter-y-xs">
            <q-checkbox :model-value="selectedPools.length === 0" dark dense label="All" data-reaction-pool-all @update:model-value="checked => { if (checked) updateReactionAvailability({ stagePools: [] }) }" />
            <q-checkbox v-for="poolNum in availablePools" :key="poolNum" :model-value="selectedPools.includes(poolNum)" dark dense :label="`${phaseRoot} ${poolNum}`" :data-reaction-pool="poolNum" @update:model-value="checked => toggleReactionPool(poolNum, checked)" />
          </div>
        </div>
        <q-checkbox :model-value="Boolean(reaction.customPreamble)" dark dense label="Description supplies its own heading" v-help="'Do not print the name; the description already starts with it.'" data-entry-custom-heading class="col-12" @update:model-value="value => update('customPreamble', value)" />
        <div v-if="reaction.customPreamble" class="col-12 text-caption">Your description prints without an automatic name or trigger heading.</div>
      </template>
      <div class="col-12">
        <cr-annotation-card v-if="entry.crAnnotation" :key="`${entryId}:${index}`" :field="field" :index="index" />
        <q-btn v-if="!entry.crAnnotation?.automatic" outline no-caps label="Calculate automatic CR" v-help="'Count this entry in the estimated challenge rating.'" data-entry-auto-cr @click="initializeCr">
          <q-tooltip>Calculate estimates from the description. Inclusion in estimated CR is kept.</q-tooltip>
        </q-btn>
      </div>
    </div>
  </q-expansion-item>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useMonsterStore } from 'src/stores/monster-store'
import {
  entryDisplayPatch,
  entryEffectiveStagePools,
  reactionAvailabilityPatch,
  reactionPredicateOptions,
} from 'src/core/domain/entry-display'
import type { ReactionAvailabilitySet } from 'src/core/domain/types'
import { traitPhaseOptions } from 'src/core/domain/trait-composer'
import CrAnnotationCard from '../CrAnnotationCard.vue'
import { defaultCrAnnotation } from '../../models'
import { useAutoUpdateCr } from '../useAutoUpdateCr'

const props = defineProps<{ entryId: string; field: 'actions' | 'reactions' | 'lairActions' }>()
const monster = useMonsterStore()
const { autoUpdateCr } = useAutoUpdateCr()
const index = computed(() => monster[props.field].findIndex(entry => entry.id === props.entryId))
const entry = computed(() => index.value >= 0 ? monster[props.field][index.value] : undefined)
const action = computed(() => props.field === 'actions' ? monster.actions.find(entry => entry.id === props.entryId) : undefined)
const reaction = computed(() => props.field === 'reactions' ? monster.reactions.find(entry => entry.id === props.entryId) : undefined)
const phaseOptions = computed(() => traitPhaseOptions(monster.paragonConfig?.poolCount || 1, action.value?.stagePool))
const predicateOptions = reactionPredicateOptions()
const phaseRoot = computed(() => monster.paragonConfig?.phaseName?.trim() || 'Phase')
const selectedPools = computed(() => reaction.value ? entryEffectiveStagePools(reaction.value) : [])
const availablePools = computed(() => {
  const maxPool = Math.max(monster.paragonConfig?.poolCount || 1, ...selectedPools.value, 1)
  return Array.from({ length: maxPool }, (_, idx) => idx + 1)
})
const update = (field: string, value: unknown) => {
  const target = action.value ?? reaction.value
  if (target) Object.assign(target, entryDisplayPatch(field, value))
}
const updateReactionAvailability = (next: Partial<ReactionAvailabilitySet>) => {
  if (!reaction.value) return
  const normalizedCurrent: ReactionAvailabilitySet = {
    ...(reaction.value.availability ?? {}),
    stagePools: reaction.value.availability?.stagePools ?? selectedPools.value,
  }
  Object.assign(reaction.value, reactionAvailabilityPatch(normalizedCurrent, next))
}
const toggleReactionPool = (poolNum: number, checked: boolean) => {
  const current = new Set(selectedPools.value)
  if (checked) current.add(poolNum)
  else current.delete(poolNum)
  updateReactionAvailability({ stagePools: [...current] })
}
const initializeCr = () => {
  if (!entry.value) return
  const annotation = { ...defaultCrAnnotation(), ...entry.value.crAnnotation, automatic: true }
  autoUpdateCr(entry.value.description, annotation, (action.value ?? reaction.value) as typeof action.value)
  entry.value.crAnnotation = annotation
}
</script>
