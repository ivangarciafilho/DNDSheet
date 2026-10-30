<template>
  <div class="action-usage">
    <label>Usage type
      <select ref="modeField" :value="modelValue.mode" data-usage-mode @change="update('mode', ($event.target as HTMLSelectElement).value)">
        <option value="none">No usage limit</option>
        <option value="recharge">Recharge roll</option>
        <option value="limited">Limited uses</option>
        <option value="custom">Custom recharge text</option>
      </select>
    </label>
    <div v-if="modelValue.mode === 'recharge'" class="row q-col-gutter-xs">
      <q-input class="col-6" :model-value="modelValue.min" type="number" min="1" max="100" dark outlined dense label="First result" data-usage-min @update:model-value="value => update('min', value ?? '')" />
      <q-input class="col-6" :model-value="modelValue.max" type="number" min="1" max="100" dark outlined dense label="Last result" data-usage-max @update:model-value="value => update('max', value ?? '')" />
    </div>
    <template v-else-if="modelValue.mode === 'limited'">
      <q-input :model-value="modelValue.count" type="number" min="1" max="999" dark outlined dense label="Uses" data-usage-count @update:model-value="value => update('count', value ?? '')" />
      <label>Refresh rate
        <select :value="modelValue.rate" data-usage-rate @change="update('rate', ($event.target as HTMLSelectElement).value)">
          <option v-for="rate in rates" :key="rate.value" :value="rate.value">{{ rate.label }}</option>
        </select>
      </label>
    </template>
    <q-input v-else-if="modelValue.mode === 'custom'" :model-value="modelValue.custom" dark outlined dense label="Custom recharge text" data-usage-custom @update:model-value="value => update('custom', value ?? '')" />
    <p class="text-caption q-mb-none">Apply replaces recharge and limited-use settings. Other entry data is kept.</p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ActionUsageDraft } from 'src/core/domain/action-usage'
const props = defineProps<{ modelValue: ActionUsageDraft }>()
const emit = defineEmits<{ (event: 'update:modelValue', value: ActionUsageDraft): void }>()
const modeField = ref<HTMLSelectElement>()
defineExpose({ focus: () => modeField.value?.focus() })
const rates = computed(() => {
  const options = [{ value: 'DAY', label: 'Per day' }, { value: 'SHORT_REST', label: 'Per short rest' }, { value: 'LONG_REST', label: 'Per long rest' }, { value: 'LONG_OR_SHORT', label: 'Per short or long rest' }]
  return options.some(option => option.value === props.modelValue.rate) ? options : [...options, { value: props.modelValue.rate, label: `${props.modelValue.rate} (saved)` }]
})
const update = (field: keyof ActionUsageDraft, value: string | number) => emit('update:modelValue', { ...props.modelValue, [field]: value })
</script>

<style scoped>
.action-usage { display: grid; gap: 10px; min-width: 0; }
.action-usage label { display: block; font-size: 0.8rem; }
.action-usage select { display: block; width: 100%; min-height: 40px; margin-top: 4px; padding: 6px; color: #fff; background: #212121; border: 1px solid #777; border-radius: 4px; font: inherit; }
.action-usage select:focus-visible { outline: 2px solid #ffca28; }
</style>
