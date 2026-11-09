<template>
  <q-expansion-item v-if="entry" dense label="Display and CR settings" v-help="'How this entry prints and whether it counts toward CR.'" icon="tune" class="q-mt-sm" :data-entry-settings="entryId">
    <div class="row q-col-gutter-sm q-pa-sm">
      <template v-if="field === 'actions'">
        <q-select :model-value="action?.stagePool ?? 'all'" :options="phaseOptions" emit-value map-options dense outlined dark label="Phase / pool" v-help="'Paragon stage in which this entry is available.'" data-entry-phase class="col-12 col-sm-6" @update:model-value="value => update('stagePool', value)" />
        <q-checkbox :model-value="action?.customPreamble" dark dense label="Description supplies its own heading" v-help="'Do not print the name; the description already starts with it.'" data-entry-custom-heading class="col-12 col-sm-6" @update:model-value="value => update('customPreamble', value)" />
        <div v-if="action?.customPreamble" class="col-12 text-caption">Your description prints without an automatic name or cadence heading.</div>
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
import { entryDisplayPatch } from 'src/core/domain/entry-display'
import { traitPhaseOptions } from 'src/core/domain/trait-composer'
import CrAnnotationCard from '../CrAnnotationCard.vue'
import { defaultCrAnnotation } from '../../models'
import { useAutoUpdateCr } from '../useAutoUpdateCr'

const props = defineProps<{ entryId: string; field: 'actions' | 'lairActions' }>()
const monster = useMonsterStore()
const { autoUpdateCr } = useAutoUpdateCr()
const index = computed(() => monster[props.field].findIndex(entry => entry.id === props.entryId))
const entry = computed(() => index.value >= 0 ? monster[props.field][index.value] : undefined)
const action = computed(() => props.field === 'actions' ? monster.actions.find(entry => entry.id === props.entryId) : undefined)
const phaseOptions = computed(() => traitPhaseOptions(monster.paragonConfig?.poolCount || 1, action.value?.stagePool))
const update = (field: string, value: unknown) => {
  if (action.value) Object.assign(action.value, entryDisplayPatch(field, value))
}
const initializeCr = () => {
  if (!entry.value) return
  const annotation = { ...defaultCrAnnotation(), ...entry.value.crAnnotation, automatic: true }
  autoUpdateCr(entry.value.description, annotation, action.value)
  entry.value.crAnnotation = annotation
}
</script>
