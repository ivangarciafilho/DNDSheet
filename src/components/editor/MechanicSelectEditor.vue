<template>
  <div class="mechanic-select-editor" :class="$attrs.class" :style="$attrs.style as StyleValue" data-enter-local>
    <q-select v-bind="$attrs" :model-value="modelValue" :display-value="displayText" :label="label" @update:model-value="emitValue">
      <template v-for="(_, name) in forwardedSlots" #[name]="scope"><slot :name="name" v-bind="scope || {}" /></template>
      <template #append>
        <slot name="append" />
        <q-btn type="button" flat dense size="sm" icon="format_bold" label="Format" :disable="disabled" :aria-label="`Format ${label}`" @click.stop="formatting = !formatting"><q-tooltip>Format the selected or custom mechanic text</q-tooltip></q-btn>
      </template>
    </q-select>
    <mechanic-text-editor v-if="formatting" :model-value="modelValue ?? ''" :label="label" :disable="disabled" force-rich class="q-mt-xs" @update:model-value="emitValue" />
  </div>
</template>
<script setup lang="ts">
import { computed, ref, useAttrs, useSlots } from 'vue'
import type { StyleValue } from 'vue'
import MechanicTextEditor from './MechanicTextEditor.vue'
import { mechanicPlainText } from 'src/core/domain/mechanic-rich-text'
defineOptions({ inheritAttrs: false })
const props = withDefaults(defineProps<{ modelValue?: string | null; label?: string }>(), { modelValue: '', label: 'Mechanic text' })
const emit = defineEmits<{ (event: 'update:modelValue', value: string): void }>()
const attrs = useAttrs(), slots = useSlots(), formatting = ref(false)
const forwardedSlots = Object.fromEntries(Object.entries(slots).filter(([name]) => name !== 'append'))
const disabled = computed(() => Boolean(attrs.disable || attrs.readonly))
const displayText = computed(() => mechanicPlainText(props.modelValue))
const emitValue = (value: unknown) => emit('update:modelValue', String(value ?? ''))
</script>
<style scoped>
.mechanic-select-editor { min-width: 0; width: 100%; }
</style>
