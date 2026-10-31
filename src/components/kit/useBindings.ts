import { computed, ref } from 'vue'
import type { Ref } from 'vue'
import { useMonsterStore } from 'src/stores/monster-store'
import { bindingRuntimeFor } from 'src/stores/binding-runtime'
import { inspectNumericField } from 'src/core/domain/catalogs/field-inspection'
import { setMonsterBinding } from 'src/core/domain/monster-bindings'
import { bindingSource, resolveNumeric } from 'src/core/domain/formula'
import type { NumericBinding } from 'src/core/domain/formula'
import { formulaContextForMonster } from 'src/core/domain/formula-context'
import type { Monster } from 'src/core/domain/types'

export function useBindings(path: Ref<string>) {
  const monster = useMonsterStore()
  const draftError = ref('')
  const inspection = computed(() => {
    // Pure descriptor reads intentionally avoid proxy getters. The store's
    // nonpersisted revision supplies their explicit reactive invalidation.
    void bindingRuntimeFor(monster).revision
    try { return inspectNumericField(monster.$state, path.value) } catch { return undefined }
  })
  const binding = computed(() => monster.bindings?.[path.value])
  const value = computed(() => inspection.value?.value)
  const source = computed(() => binding.value ? bindingSource(binding.value) : String(value.value ?? ''))
  const context = computed(() => formulaContextForMonster(monster.$state as unknown as Monster))
  const resolved = computed(() => resolveNumeric(binding.value ?? (typeof value.value === 'number' ? value.value : 0), context.value, { style: inspection.value?.field.style }))
  const error = computed(() => draftError.value || bindingRuntimeFor(monster).errors[path.value] || '')
  const toBinding = (text: string): NumericBinding => {
    const trimmed = text.trim()
    if (!trimmed) throw new Error('Enter a number or formula.')
    return Number.isFinite(Number(trimmed)) ? { mode: 'literal', value: Number(trimmed) } : { mode: 'formula', expr: trimmed }
  }
  const preview = (candidate: NumericBinding) => {
    try {
      setMonsterBinding(monster.$state, path.value, candidate)
      draftError.value = ''
      return resolveNumeric(candidate, context.value, { style: inspection.value?.field.style, integerScalar: true })
    } catch (err) { draftError.value = err instanceof Error ? err.message : String(err); return undefined }
  }
  const apply = (candidate: NumericBinding): boolean => {
    try { monster.setBinding(path.value, candidate); draftError.value = ''; return true }
    catch (err) { draftError.value = err instanceof Error ? err.message : String(err); return false }
  }
  const applyText = (text: string) => {
    try { return apply(toBinding(text)) }
    catch (err) { draftError.value = err instanceof Error ? err.message : String(err); return false }
  }
  const detach = () => { monster.clearBinding(path.value); draftError.value = '' }
  return { monster, inspection, binding, value, source, context, resolved, error, draftError, toBinding, preview, apply, applyText, detach }
}
