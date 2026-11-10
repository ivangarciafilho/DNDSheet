import { setMonsterBinding, clearMonsterBinding, resolveMonsterBindings, applyResolvedNumericValues } from '../core/domain/monster-bindings.ts'
import type { BindingModel } from '../core/domain/monster-bindings.ts'
import type { NumericBinding } from '../core/domain/formula.ts'
import { normalizeNumericPresentation } from '../core/domain/numeric-presentation.ts'
import { reactive } from 'vue'
import type { PiniaPluginContext } from 'pinia'

const runtimes = new WeakMap<object, { errors: Record<string, string>; historySilent: boolean; resolving: boolean; revision: number }>()
// Safe path inspection returns raw own-property values. Rewrap the validated
// parent at the adapter boundary so Vue's nested computed dependencies fire.
const publishScalar = (parent: object, key: string, value: number) => Reflect.set(reactive(parent), key, value)
export function bindingRuntimeFor(store: object) {
  let runtime = runtimes.get(store)
  if (!runtime) {
    runtime = reactive({ errors: {} as Record<string, string>, historySilent: false, resolving: false, revision: 0 })
    runtimes.set(store, runtime)
  }
  return runtime
}

/** After hydration and every authored mutation, materialize bindings once. */
export function installMonsterBindings({ store }: PiniaPluginContext) {
  if (store.$id !== 'monster') return
  const runtime = bindingRuntimeFor(store)
  const resolve = () => {
    if (runtime.resolving) return
    store.resolveBindings()
    runtime.revision++
  }
  resolve()
  store.$subscribe(resolve, { detached: true, flush: 'sync' })
}

interface BindingStore {
  $state: object & BindingModel
  $patch(patch: (state: object & BindingModel) => void): void
}

/** Shared production actions, exercised through a real Pinia store in tests. */
export const monsterBindingActions = {
    setBinding(this: BindingStore, path: string, binding: NumericBinding) {
      let result = setMonsterBinding(this.$state, path, binding)
      if (binding.mode === 'literal' && Object.keys(normalizeNumericPresentation(binding.presentation)).length === 0) {
        const detached = clearMonsterBinding(result.model, path)
        result = { ...result, model: detached.model, changed: result.changed || detached.changed }
      }
      result = { ...result, changed: JSON.stringify(result.model) !== JSON.stringify(this.$state) }
      if (result.changed) this.$patch(state => { applyResolvedNumericValues(state, result, publishScalar); state.bindings = result.model.bindings ?? {} })
      return result
    },
    clearBinding(this: BindingStore, path: string) {
      const result = clearMonsterBinding(this.$state, path)
      if (result.changed) this.$patch(state => { state.bindings = result.model.bindings ?? {} })
      return result
    },
    resolveBindings(this: BindingStore) {
      const runtime = bindingRuntimeFor(this)
      if (runtime.resolving) return
      runtime.resolving = true
      try {
        const result = resolveMonsterBindings(this.$state)
        for (const key of Object.keys(runtime.errors)) if (!(key in result.errors)) delete runtime.errors[key]
        Object.assign(runtime.errors, result.errors)
        if (result.changed) {
          runtime.historySilent = true
          try { this.$patch(state => applyResolvedNumericValues(state, result, publishScalar)) } finally { runtime.historySilent = false }
        }
        return result
      } finally { runtime.resolving = false }
    },
}
