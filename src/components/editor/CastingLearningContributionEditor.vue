<template>
  <q-expansion-item dense dense-toggle label="Spell-learning calculation" caption="Cantrips and known/prepared spells can use independent contributions.">
    <div v-for="category in categories" :key="category.key" class="row items-center q-col-gutter-xs q-pa-xs">
      <q-checkbox :model-value="combined(category.key)" :label="'Use combined caster level for ' + category.label" dense dark class="col-12" @update:model-value="value => change(category.key, {mode:value ? 'combined' : 'own'})" />
      <q-input :model-value="setting(category.key).numerator ?? 1" type="number" min="0" dense outlined dark :label="category.label + ' multiplier'" class="col-6" @update:model-value="value => change(category.key, {numerator:Math.max(0,Number(value)||0)})" />
      <q-input :model-value="setting(category.key).denominator ?? 1" type="number" min="1" dense outlined dark :label="category.label + ' divisor'" class="col-6" @update:model-value="value => change(category.key, {denominator:Math.max(1,Number(value)||1)})" />
    </div>
    <p class="text-caption text-grey-4 q-px-sm">The multiplier applies to the calculated capacity, rounded down. It does not unlock higher-level spells for this class. Combined learning is a homebrew rule; choose own class level to use separate class capacities.</p>
  </q-expansion-item>
</template>
<script setup lang="ts">
import type { CastingContribution } from 'src/core/usecases/AutoSyncSpellcasting'
type Learning={mode?:'own'|'combined';numerator?:number;denominator?:number}
const props=defineProps<{modelValue?:CastingContribution;sourceCount:number}>()
const emit=defineEmits<{ 'update:modelValue':[value:CastingContribution] }>()
const categories=[{key:'cantrips' as const,label:'Cantrips'},{key:'spells' as const,label:'Known/prepared spells'}]
function setting(key:'cantrips'|'spells'):Learning {return props.modelValue?.[key] || {}}
function combined(key:'cantrips'|'spells') {return setting(key).mode ? setting(key).mode==='combined' : props.sourceCount>1}
function change(key:'cantrips'|'spells',value:Learning) {emit('update:modelValue',{mode:'rules',target:'slots',numerator:1,denominator:1,...props.modelValue,[key]:{mode:combined(key)?'combined':'own',numerator:1,denominator:1,...setting(key),...value}})}
</script>
