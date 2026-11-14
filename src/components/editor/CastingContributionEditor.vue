<template>
  <div class="q-pa-xs q-mb-xs">
    <q-checkbox v-help="'Contribute a custom fraction or multiple of this source level to a shared spellcasting pool.'" :model-value="modelValue?.mode === 'custom'" label="Custom contribution to shared resources" dense dark @update:model-value="toggle" />
    <div v-if="modelValue?.mode === 'custom'" class="row q-col-gutter-xs">
      <q-select v-help="'Shared resource pool that receives effective caster levels from this source.'" :model-value="modelValue.target" :options="targets" emit-value map-options dense outlined dark label="Contribute to" class="col-12 col-sm-4" @update:model-value="value => patch({ target: value })" />
      <q-input v-help="'Multiplier applied to class level before rounding down (e.g. 0.5 for half-caster).'" :model-value="multiplier" type="number" min="0" step="any" dense outlined dark label="Level multiplier" class="col-6 col-sm-4" @update:model-value="setMultiplier" />
      <q-input v-if="modelValue.target === 'focus'" v-help="'Focus points added per effective caster level contributed.'" :model-value="modelValue.focusPerLevel ?? 1" type="number" min="0" dense outlined dark label="Authored focus per effective level" class="col-12" @update:model-value="value => patch({ focusPerLevel: Number(value) })" />
      <div class="col-12 text-caption text-amber-3">Multiply the class level, then round down. For example, 0.5 contributes half the level to the selected resource.</div>
    </div>
    <div v-else class="text-caption text-grey-4">Standard class progression; Pact Magic remains separate. Manual point, focus and at-will systems do not also grant spell slots. Saved source slot overrides are retained. Shared resources do not grant higher-level spell selections.</div>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import type { CastingContribution } from 'src/core/usecases/AutoSyncSpellcasting'
const props = defineProps<{ modelValue?: CastingContribution }>()
const emit = defineEmits<{ 'update:modelValue': [value: CastingContribution] }>()
const targets = [{label:'Focus (authored rate)',value:'focus'},{label:'Pact Magic slots',value:'pact'},{label:'Spell points',value:'points'},{label:'Spellcasting slots',value:'slots'}]
const multiplier=computed(()=>props.modelValue?.multiplier??((props.modelValue?.numerator??1)/(props.modelValue?.denominator||1)))
function setMultiplier(input:unknown){if(input===null||input==='')return;const value=Number(input);if(Number.isFinite(value)&&value>=0)patch({multiplier:value,numerator:value,denominator:1})}
function patch(value: Partial<CastingContribution>) { emit('update:modelValue', {...props.modelValue!, ...value}) }
function toggle(enabled: boolean) { emit('update:modelValue', enabled ? {...props.modelValue, mode:'custom',target:props.modelValue?.target || 'slots',numerator:props.modelValue?.numerator ?? 1,denominator:props.modelValue?.denominator ?? 2,focusPerLevel:props.modelValue?.focusPerLevel ?? 1} : {...props.modelValue!,mode:'rules'}) }
</script>
