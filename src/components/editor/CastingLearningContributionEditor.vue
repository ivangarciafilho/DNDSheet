<template>
  <q-expansion-item dense dense-toggle label="Spell-learning calculation" caption="Set resource, learning and grant progression independently." data-source-learning>
    <div v-for="category in categories" :key="category.key" class="row items-center q-col-gutter-xs q-pa-xs">
      <q-checkbox :model-value="combined(category.key)" :label="'Use combined caster level for ' + category.label" :data-source-learning-mode="category.key" dense dark class="col-12" @update:model-value="value => change(category.key, {mode:value ? 'combined' : 'own'})" />
      <q-input :model-value="multiplier(category.key)" type="number" min="0" step="any" dense outlined dark :label="category.label + ' multiplier'" :data-source-learning-multiplier="category.key" class="col-6" @update:model-value="value => setMultiplier(category.key,value)" />
      <span v-if="category.key === 'highestSlot'" data-source-slot-ceiling class="col">Highest spell slot: {{ highestSlot ?? 'Manual' }}</span>
      <span v-if="category.key === 'grants'" data-source-grant-level class="col">Feature grant level: {{ grantLevel ?? 'Manual' }}</span>
    </div>
    <p class="text-caption text-grey-4 q-px-sm">Cantrip and spell multipliers scale their capacities. Slot and grant multipliers scale the level used for those lookups. Combined progression is a homebrew option.</p>
    <casting-contribution-editor :model-value="modelValue" @update:model-value="value => emit('update:modelValue',value)" />
    <slot />
  </q-expansion-item>
</template>
<script setup lang="ts">
import CastingContributionEditor from './CastingContributionEditor.vue'
import type { CastingContribution } from 'src/core/usecases/AutoSyncSpellcasting'
type Learning={mode?:'own'|'combined';numerator?:number;denominator?:number;multiplier?:number}
type Category='cantrips'|'spells'|'highestSlot'|'grants'
const props=defineProps<{modelValue?:CastingContribution;sourceCount:number;highestSlot?:number;grantLevel?:number}>()
const emit=defineEmits<{ 'update:modelValue':[value:CastingContribution] }>()
const categories=[{key:'cantrips' as const,label:'Cantrips'},{key:'spells' as const,label:'Known/prepared spells'},{key:'highestSlot' as const,label:'Highest spell slot'},{key:'grants' as const,label:'Feature grants'}]
function setting(key:Category):Learning {return props.modelValue?.[key] || {}}
function combined(key:Category) {return setting(key).mode ? setting(key).mode==='combined' : props.sourceCount>1 && (key==='cantrips'||key==='spells')}
function change(key:Category,value:Learning) {emit('update:modelValue',{mode:'rules',target:'slots',numerator:1,denominator:1,...props.modelValue,[key]:{mode:combined(key)?'combined':'own',numerator:1,denominator:1,...setting(key),...value}})}
function multiplier(key:Category){const config=setting(key);return config.multiplier??((config.numerator??1)/(config.denominator||1))}
function setMultiplier(key:Category,input:unknown){if(input===null||input==='')return;const value=Number(input);if(Number.isFinite(value)&&value>=0)change(key,{multiplier:value,numerator:value,denominator:1})}
</script>
