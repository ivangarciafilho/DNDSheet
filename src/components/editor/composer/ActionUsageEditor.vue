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
      <q-input class="col-6" :model-value="modelValue.min" type="number" min="1" max="100" dark outlined dense label="First result" v-help="'Lowest d6 roll that recharges the ability (Recharge 5–6 starts at 5).'" data-usage-min @update:model-value="value => update('min', value ?? '')" />
      <q-input class="col-6" :model-value="modelValue.max" type="number" min="1" max="100" dark outlined dense label="Last result" v-help="'Highest d6 roll that recharges the ability (usually 6).'" data-usage-max @update:model-value="value => update('max', value ?? '')" />
    </div>
    <template v-else-if="modelValue.mode === 'limited'">
      <q-input :model-value="modelValue.count" type="number" min="1" max="999" dark outlined dense label="Uses" v-help="'How many times it can be used before it needs to recover.'" data-usage-count @update:model-value="value => update('count', value ?? '')" />
      <label>Refresh rate
        <select :value="modelValue.rate" data-usage-rate @change="update('rate', ($event.target as HTMLSelectElement).value)">
          <optgroup v-for="group in rateGroups" :key="group.label" :label="group.label"><option v-for="rate in group.options" :key="rate.value" :value="rate.value" :title="rate.help">{{ rate.label }}</option></optgroup>
        </select>
      </label>
      <p class="text-caption q-mb-none">{{ selectedHelp }}</p>
    </template>
    <mechanic-text-editor v-else-if="modelValue.mode === 'custom'" :model-value="modelValue.custom" dark outlined dense label="Custom recharge text" v-help="'Wording printed instead of the standard recharge tag.'" data-usage-custom @update:model-value="(value: string) => update('custom', value ?? '')" />
    <p class="text-caption q-mb-none">Apply replaces recharge and limited-use settings. Other entry data is kept.</p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { cadenceOptions } from 'src/core/domain/cadence'
import type { ActionUsageDraft } from 'src/core/domain/action-usage'
const props = defineProps<{ modelValue: ActionUsageDraft }>()
const emit = defineEmits<{ (event: 'update:modelValue', value: ActionUsageDraft): void }>()
const modeField = ref<HTMLSelectElement>()
defineExpose({ focus: () => modeField.value?.focus() })
const rates = computed(() => cadenceOptions(props.modelValue.rate))
const rateGroups = computed(() => [...new Set(rates.value.map(rate => rate.category))].map(label => ({ label, options: rates.value.filter(rate => rate.category === label) })))
const selectedHelp = computed(() => rates.value.find(rate => rate.value === props.modelValue.rate)?.help || '')
const update = (field: keyof ActionUsageDraft, value: string | number) => emit('update:modelValue', { ...props.modelValue, [field]: value })
</script>

<style scoped>
.action-usage { display: grid; gap: 10px; min-width: 0; }
.action-usage label { display: block; font-size: 0.8rem; }
.action-usage select { display: block; width: 100%; min-height: 40px; margin-top: 4px; padding: 6px; color: #fff; background: #212121; border: 1px solid #777; border-radius: 4px; font: inherit; }
.action-usage select:focus-visible { outline: 2px solid #ffca28; }
</style>
