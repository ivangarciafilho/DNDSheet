<template>
  <div class="formula-field" :data-formula-field="path">
    <q-select v-if="!editing" :model-value="source" :display-value="display" :options="options" :label="label" :dense="dense" :outlined="outlined"
      :disable="disabled" use-input input-debounce="0" emit-value map-options options-dense new-value-mode="add-unique"
      :error="!!error" :error-message="error" hide-bottom-space @filter="filterOptions" @update:model-value="select" @new-value="typed">
      <template #prepend>
        <q-btn flat round dense size="xs" :icon="binding ? 'fa-solid fa-link' : 'fa-solid fa-hashtag'" :aria-label="`Calculation for ${label}`" @click.stop>
          <q-menu><div class="q-pa-sm formula-field__help"><strong>{{ binding ? 'Live binding' : 'Typed value' }}</strong><p>{{ resolved.trace }}</p><span>{{ error || 'Changes to referenced values update this field automatically.' }}</span></div></q-menu>
        </q-btn>
        <slot name="prepend" />
      </template>
      <template #append>
        <q-btn v-if="binding" flat dense size="sm" icon="link_off" :aria-label="`Detach ${label} binding`" @click.stop="detach"><q-tooltip>Keep {{ value }} and stop following this source.</q-tooltip></q-btn>
        <slot name="append" />
      </template>
      <template #option="scope">
        <q-item v-bind="scope.itemProps" :class="scope.opt.header ? 'formula-field__group' : ''">
          <q-item-section avatar><q-icon :name="scope.opt.icon" :color="scope.opt.color" size="xs" /></q-item-section>
          <q-item-section><q-item-label>{{ scope.opt.label }}</q-item-label><q-item-label v-if="scope.opt.tip && !scope.opt.header" caption>{{ scope.opt.tip }}</q-item-label></q-item-section>
          <q-item-section v-if="scope.opt.preview !== undefined" side>{{ scope.opt.preview }}</q-item-section>
        </q-item>
      </template>
      <q-tooltip class="formula-field__help"><strong>{{ binding ? 'Live binding' : 'Typed value' }}</strong><br>{{ resolved.trace }}<br>{{ binding ? 'Detach to keep the current value.' : 'Choose a reference to follow it, or type a number and press Enter.' }}</q-tooltip>
    </q-select>
    <div v-else class="formula-field__draft">
      <q-input ref="draftInput" v-model="draft" :label="`${label} — custom formula`" dense outlined autofocus :error="!!error" :error-message="error" :hint="previewText" @update:model-value="checkDraft" @keydown.enter.prevent="commitDraft" @keydown.esc.prevent="cancel" />
      <div class="row justify-end">
        <q-btn flat dense no-caps label="Cancel" @click="cancel" />
        <q-btn flat dense no-caps color="primary" label="Apply" :disable="!!error || !draft.trim()" :aria-label="`Apply formula for ${label}`" @click="commitDraft" />
      </div>
    </div>
    <div v-if="!disable && !inspection?.editable" class="text-caption" role="status">{{ inspection?.blockedRepresentation || 'This value is controlled by its current mode.' }}</div>
  </div>
</template>
<script setup lang="ts">
import { computed, ref, toRef } from 'vue'
import { FORMULA_GROUPS, FORMULA_REFS, resolveNumeric } from 'src/core/domain/formula'
import { isReferenceAllowedForField } from 'src/core/domain/catalogs/field-types'
import { useBindings } from './useBindings'

const props = withDefaults(defineProps<{ path: string; label: string; dense?: boolean; outlined?: boolean; disable?: boolean }>(), { dense: true, outlined: true, disable: false })
const emit = defineEmits<{ (event: 'applied', value: number): void }>()
const { inspection, binding, value, source, context, resolved, error, draftError, toBinding, preview, apply, applyText, detach } = useBindings(toRef(props, 'path'))
const editing = ref(false), draft = ref(''), query = ref(''), previewText = ref('')
const disabled = computed(() => props.disable || !inspection.value?.editable)
const display = computed(() => binding.value ? `${source.value} = ${String(value.value ?? '')}` : String(value.value ?? ''))
interface Option { label: string; value: string; icon: string; color: string; tip?: string; preview?: string; header?: boolean; disable?: boolean }
const options = computed<Option[]>(() => {
  const result: Option[] = [{ label: 'ƒ Custom formula…', value: '__custom__', icon: 'fa-solid fa-calculator', color: 'primary', tip: 'Type a number or combine references with arithmetic.' }]
  for (const group of [...FORMULA_GROUPS].sort((a, b) => a.label.localeCompare(b.label))) {
    const refs = FORMULA_REFS.filter(item => item.group === group.id && isReferenceAllowedForField(props.path, item.id) && (!query.value || `${item.label} ${item.id}`.toLowerCase().includes(query.value.toLowerCase()))).sort((a, b) => a.label.localeCompare(b.label))
    if (!refs.length) continue
    result.push({ label: group.label, value: `__group_${group.id}`, icon: group.icon, color: group.color, header: true, disable: true })
    for (const item of refs) result.push({ label: item.label, value: item.id, icon: group.icon, color: group.color, tip: item.tip, preview: resolveNumeric({ mode: 'ref', ref: item.id }, context.value, { style: inspection.value?.field.style }).text })
  }
  return result
})
const filterOptions = (text: string, update: (fn: () => void) => void) => update(() => { query.value = text })
const applied = () => { if (typeof value.value === 'number') emit('applied', value.value) }
const checkDraft = () => {
  try { const result = preview(toBinding(draft.value)); previewText.value = result?.ok ? result.trace : '' }
  catch (err) { draftError.value = err instanceof Error ? err.message : String(err); previewText.value = '' }
}
const select = (selected: string | null) => {
  if (!selected) return
  if (selected === '__custom__') { draft.value = source.value; editing.value = true; draftError.value = ''; checkDraft(); return }
  if (selected.startsWith('__group_')) return
  if (FORMULA_REFS.some(item => item.id === selected)) { if (apply({ mode: 'ref', ref: selected })) applied() }
  else if (applyText(selected)) applied()
}
const typed = (text: string, done: () => void) => { if (applyText(text)) { applied(); done() } }
const commitDraft = () => { if (applyText(draft.value)) { editing.value = false; applied() } }
const cancel = () => { editing.value = false; draftError.value = ''; previewText.value = '' }
</script>
<style scoped>
.formula-field { min-width: 0; }
.formula-field__group { font-weight: 600; opacity: 1 !important; }
.formula-field__help { max-width: 25rem; line-height: 1.5; }
.formula-field__draft { min-width: 0; }
</style>
