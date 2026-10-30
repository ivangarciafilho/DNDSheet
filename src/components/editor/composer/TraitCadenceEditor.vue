<template>
  <div class="trait-cadence column q-gutter-y-sm">
    <div class="row q-col-gutter-sm">
      <q-input :model-value="modelValue.limitedUse.count" type="number" min="0" max="999" dense outlined dark autofocus label="Limited uses" class="col-5" @update:model-value="(value) => updateUses('count', value ?? '')" />
      <label class="col-7 trait-cadence__label">Recovery rate
        <select :value="modelValue.limitedUse.rate" class="trait-cadence__select" @change="updateUses('rate', ($event.target as HTMLSelectElement).value)">
          <option v-for="option in rateOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
        </select>
      </label>
    </div>
    <label class="trait-cadence__label">Specific recharge timing
      <select :value="modelValue.rechargeTiming" class="trait-cadence__select" @change="update('rechargeTiming', ($event.target as HTMLSelectElement).value)">
        <option value="">Use the limited-use rate</option>
        <option v-for="option in timingOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
      </select>
    </label>
    <q-input :model-value="modelValue.rechargeCount" type="number" min="0" max="999" dense outlined dark label="Recharge count override" hint="Leave blank to use the limited-use count" @update:model-value="(value) => update('rechargeCount', value ?? '')" />
    <q-input :model-value="modelValue.rechargeTagOverride" dense outlined dark label="Printed tag override" hint="Replaces the generated tag, including any conditional text" @update:model-value="(value) => update('rechargeTagOverride', String(value ?? ''))" />
    <p class="text-caption q-ma-none">Clear removes uses and cadence overrides. Conditional grouping stays in Trait display settings.</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRechargeTimes } from 'src/data/RECHARGE_TIME'
import { TRAIT_RECHARGE_OPTIONS } from 'src/core/domain/defense-and-traits-utils'
import type { TraitCadenceDraft } from 'src/core/domain/trait-composer'

const props = defineProps<{ modelValue: TraitCadenceDraft }>()
const emit = defineEmits<{ (event: 'update:modelValue', value: TraitCadenceDraft): void }>()
const { rechargeTimeOptions } = useRechargeTimes()
// Retain imported/custom values as visible choices rather than silently normalizing saved content.
const rateOptions = computed(() => {
  const options = rechargeTimeOptions.value
  const current = props.modelValue.limitedUse.rate
  return current && !options.some((option) => option.value === current) ? [...options, { label: current, value: current }] : options
})
const timingOptions = computed(() => {
  const options = TRAIT_RECHARGE_OPTIONS.filter((option) => option.value)
  const current = props.modelValue.rechargeTiming
  return current && !options.some((option) => option.value === current) ? [...options, { label: current, value: current }] : options
})
const update = (field: 'rechargeTiming' | 'rechargeCount' | 'rechargeTagOverride', value: string | number) => emit('update:modelValue', { ...props.modelValue, [field]: value })
const updateUses = (field: 'count' | 'rate', value: string | number) => emit('update:modelValue', { ...props.modelValue, limitedUse: { ...props.modelValue.limitedUse, [field]: value } })
</script>

<style scoped>
.trait-cadence__label { display: block; font-size: 0.75rem; color: #dedede; }
.trait-cadence__select { display: block; width: 100%; min-height: 40px; margin-top: 4px; padding: 6px 8px; border: 1px solid #777; border-radius: 4px; color: #fff; background: #212121; font: inherit; }
.trait-cadence__select:focus-visible { outline: 2px solid #ffca28; outline-offset: 2px; }
</style>
