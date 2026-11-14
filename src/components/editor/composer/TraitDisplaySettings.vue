<template>
  <q-expansion-item v-if="trait" dense label="Trait display settings" icon="tune" class="q-mt-sm" :data-trait-settings="trait.id">
    <div class="row q-col-gutter-sm q-pa-sm">
      <catalog-select v-help="'Paragon stage in which this trait is active.'" :model-value="trait.stagePool ?? 'all'" :entries="phaseOptions" preserve-order :searchable="false" dark label="Phase / pool" class="col-12 col-sm-6" @update:model-value="(value) => update('stagePool', value)" />
      <q-checkbox v-help="'Omit the automatic trait title so your prose supplies its own heading.'" :model-value="trait.customPreamble" dark dense label="Description supplies its own heading" class="col-12 col-sm-6" @update:model-value="(value) => update('customPreamble', value)" />
      <div v-if="trait.customPreamble" class="col-12 text-caption">The preview prints your description without an automatic name or cadence heading.</div>
      <q-checkbox v-help="'Group this trait under a recharge subheading inside the stat block.'" :model-value="!!trait.renderInRechargeSection" dark dense label="Group under a recharge heading" class="col-12 col-sm-6" @update:model-value="(value) => update('renderInRechargeSection', value)" />
      <mechanic-text-editor v-if="trait.renderInRechargeSection" :model-value="trait.rechargeSection" dense outlined dark label="Recharge heading" class="col-12 col-sm-6" @update:model-value="(value: string) => update('rechargeSection', value)" />
      <q-checkbox v-help="'File this trait under a situational condition subheading.'" :model-value="!!trait.isConditional" dark dense label="Group under a conditional heading" class="col-12 col-sm-6" @update:model-value="(value) => update('isConditional', value)" />
      <mechanic-text-editor :model-value="trait.conditionalTrigger" dense outlined dark label="Condition / trigger" hint="Also included in the generated tag; clear to remove it" class="col-12 col-sm-6" @update:model-value="(value: string) => update('conditionalTrigger', value)" />
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
import CatalogSelect from 'src/components/kit/CatalogSelect.vue'
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
