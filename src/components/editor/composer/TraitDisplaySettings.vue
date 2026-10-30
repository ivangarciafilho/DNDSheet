<template>
  <q-expansion-item v-if="trait" dense label="Trait display settings" icon="tune" class="q-mt-sm" :data-trait-settings="trait.id">
    <div class="row q-col-gutter-sm q-pa-sm">
      <q-select :model-value="trait.stagePool ?? 'all'" :options="phaseOptions" emit-value map-options dense outlined dark label="Phase / pool" class="col-12 col-sm-6" @update:model-value="(value) => update('stagePool', value)" />
      <q-checkbox :model-value="trait.customPreamble" dark dense label="Description supplies its own heading" class="col-12 col-sm-6" @update:model-value="(value) => update('customPreamble', value)" />
      <div v-if="trait.customPreamble" class="col-12 text-caption">The preview prints your description without an automatic name or cadence heading.</div>
      <q-checkbox :model-value="!!trait.renderInRechargeSection" dark dense label="Group under a recharge heading" class="col-12 col-sm-6" @update:model-value="(value) => update('renderInRechargeSection', value)" />
      <q-input v-if="trait.renderInRechargeSection" :model-value="trait.rechargeSection" dense outlined dark label="Recharge heading" class="col-12 col-sm-6" @update:model-value="(value) => update('rechargeSection', value)" />
      <q-checkbox :model-value="!!trait.isConditional" dark dense label="Group under a conditional heading" class="col-12 col-sm-6" @update:model-value="(value) => update('isConditional', value)" />
      <q-input :model-value="trait.conditionalTrigger" dense outlined dark label="Condition / trigger" hint="Also included in the generated tag; clear to remove it" class="col-12 col-sm-6" @update:model-value="(value) => update('conditionalTrigger', value)" />
      <div v-if="trait.isConditional && trait.renderInRechargeSection" class="col-12 text-caption">Conditional grouping takes precedence over the recharge heading on the sheet.</div>
      <div class="col-12">
        <cr-annotation-card v-if="trait.crAnnotation" field="traits" :index="index" />
        <q-btn v-if="!trait.crAnnotation?.automatic" outline no-caps label="Calculate automatic CR" @click="initializeCr">
          <q-tooltip>Replace manual estimates with values parsed from the description. Inclusion in estimated CR is kept.</q-tooltip>
        </q-btn>
      </div>
    </div>
  </q-expansion-item>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useMonsterStore } from 'src/stores/monster-store'
import { traitPhaseOptions, traitPolicyPatch } from 'src/core/domain/trait-composer'
import CrAnnotationCard from '../CrAnnotationCard.vue'
import { defaultCrAnnotation } from '../../models'
import { useAutoUpdateCr } from '../useAutoUpdateCr'

const props = defineProps<{ traitId: string }>()
const monster = useMonsterStore()
const { autoUpdateCr } = useAutoUpdateCr()
const index = computed(() => monster.traits.findIndex((entry) => entry.id === props.traitId))
const trait = computed(() => index.value >= 0 ? monster.traits[index.value] : undefined)
const phaseOptions = computed(() => traitPhaseOptions(monster.paragonConfig?.poolCount || 1, trait.value?.stagePool))
const initializeCr = () => {
  if (!trait.value) return
  const annotation = { ...defaultCrAnnotation(), ...trait.value.crAnnotation, automatic: true }
  autoUpdateCr(trait.value.description, annotation)
  trait.value.crAnnotation = annotation
}
const update = (field: string, value: unknown) => {
  if (trait.value) Object.assign(trait.value, traitPolicyPatch(trait.value, field, value))
}
</script>
