<template>
  <div class="q-pa-xs q-mb-xs">
    <q-checkbox :model-value="modelValue?.mode === 'custom'" label="Custom contribution to shared resources" dense dark @update:model-value="toggle" />
    <div v-if="modelValue?.mode === 'custom'" class="row q-col-gutter-xs">
      <q-select :model-value="modelValue.target" :options="targets" emit-value map-options dense outlined dark label="Contribute to" class="col-12 col-sm-4" @update:model-value="value => patch({ target: value })" />
      <q-input :model-value="modelValue.numerator" type="number" min="0" dense outlined dark label="Level multiplier" class="col-6 col-sm-4" @update:model-value="value => patch({ numerator: Number(value) })" />
      <q-input :model-value="modelValue.denominator" type="number" min="1" dense outlined dark label="Level divisor" class="col-6 col-sm-4" @update:model-value="value => patch({ denominator: Number(value) })" />
      <q-input v-if="modelValue.target === 'focus'" :model-value="modelValue.focusPerLevel ?? 1" type="number" min="0" dense outlined dark label="Authored focus per effective level" class="col-12" @update:model-value="value => patch({ focusPerLevel: Number(value) })" />
      <div class="col-12 text-caption text-amber-3">Custom rule: floor(class level × multiplier ÷ divisor). Replaces this source’s normal resource contribution. Known/prepared spell and cantrip capacities remain based on its own class. Focus uses your authored rate; points use the existing spell-points table. Recovery remains on the receiving pool.</div>
    </div>
    <div v-else class="text-caption text-grey-4">Standard class progression; Pact Magic remains separate. Manual point, focus and at-will systems do not also grant spell slots. Saved source slot overrides are retained. Shared resources do not grant higher-level spell selections.</div>
  </div>
</template>
<script setup lang="ts">
import type { CastingContribution } from 'src/core/usecases/AutoSyncSpellcasting'
const props = defineProps<{ modelValue?: CastingContribution }>()
const emit = defineEmits<{ 'update:modelValue': [value: CastingContribution] }>()
const targets = [{label:'Focus (authored rate)',value:'focus'},{label:'Pact Magic slots',value:'pact'},{label:'Spell points',value:'points'},{label:'Spellcasting slots',value:'slots'}]
function patch(value: Partial<CastingContribution>) { emit('update:modelValue', {...props.modelValue!, ...value}) }
function toggle(enabled: boolean) { emit('update:modelValue', enabled ? {...props.modelValue, mode:'custom',target:props.modelValue?.target || 'slots',numerator:props.modelValue?.numerator ?? 1,denominator:props.modelValue?.denominator ?? 2,focusPerLevel:props.modelValue?.focusPerLevel ?? 1} : {...props.modelValue!,mode:'rules'}) }
</script>
