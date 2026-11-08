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

export function useBindings(path: Ref<string>, draftModel?: Ref<object | undefined>) {
  const monster = useMonsterStore()
  const draftError = ref('')
  const draftRevision = ref(0)
  const model = computed(() => draftModel?.value ?? monster.$state)
  const inspection = computed(() => {
    // Pure descriptor reads intentionally avoid proxy getters. The store's
    // nonpersisted revision supplies their explicit reactive invalidation.
    void bindingRuntimeFor(monster).revision
    void draftRevision.value
    try { return inspectNumericField(model.value, path.value) } catch { return undefined }
  })
  const binding = computed(() => (model.value as { bindings?: Record<string, NumericBinding> }).bindings?.[path.value])
  const value = computed(() => inspection.value?.value)
  const source = computed(() => binding.value ? bindingSource(binding.value) : String(value.value ?? ''))
  const context = computed(() => formulaContextForMonster(model.value as Monster))
  const resolved = computed(() => resolveNumeric(binding.value ?? (typeof value.value === 'number' ? value.value : 0), context.value, { style: inspection.value?.field.style }))
  const error = computed(() => draftError.value || (!draftModel?.value ? bindingRuntimeFor(monster).errors[path.value] : '') || '')
  const toBinding = (text: string): NumericBinding => {
    const trimmed = text.trim()
    if (!trimmed) throw new Error('Enter a number or formula.')
    return Number.isFinite(Number(trimmed)) ? { mode: 'literal', value: Number(trimmed) } : { mode: 'formula', expr: trimmed }
  }
  const preview = (candidate: NumericBinding) => {
    try {
      setMonsterBinding(model.value, path.value, candidate)
      draftError.value = ''
      return resolveNumeric(candidate, context.value, { style: inspection.value?.field.style, integerScalar: true })
    } catch (err) { draftError.value = err instanceof Error ? err.message : String(err); return undefined }
  }
  const apply = (candidate: NumericBinding): boolean => {
    try {
      if (draftModel?.value) {
        const result = setMonsterBinding(draftModel.value, path.value, candidate)
        Object.assign(draftModel.value, result.model)
        draftRevision.value++
      } else monster.setBinding(path.value, candidate)
      draftError.value = ''; return true
    }
    catch (err) { draftError.value = err instanceof Error ? err.message : String(err); return false }
  }
  const applyText = (text: string) => {
    try { return apply(toBinding(text)) }
    catch (err) { draftError.value = err instanceof Error ? err.message : String(err); return false }
  }
  const detach = () => {
    if (draftModel?.value) {
      const current = draftModel.value as { bindings?: Record<string, NumericBinding> }
      const next = { ...current.bindings }; delete next[path.value]; current.bindings = next
      draftRevision.value++
    } else monster.clearBinding(path.value)
    draftError.value = ''
  }
  return { monster, inspection, binding, value, source, context, resolved, error, draftError, toBinding, preview, apply, applyText, detach }
}
