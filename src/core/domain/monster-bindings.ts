import { abilityModifier, dependencyOrder, isNumericBinding, resolveNumeric } from './formula.ts'
import type { BindingMap, NumericBinding } from './formula.ts'
import { formulaContextForMonster } from './formula-context.ts'
import { referenceSourcesForMonster } from './catalogs/reference-sources.ts'
import { inspectNumericField } from './catalogs/field-inspection.ts'
import { isReferenceAllowedForField, validateNumericFieldDiceValue, validateNumericFieldValue } from './catalogs/field-types.ts'
import { parseNumericFieldPath, readNumericFieldPath } from './catalogs/field-path.ts'
import type { Monster } from './types.ts'

export interface BindingModel { bindings?: Record<string, NumericBinding> }
export interface MonsterBindingResolution<T> {
  readonly model: T & BindingModel
  readonly errors: Record<string, string>
  readonly changed: boolean
  readonly changedPaths: readonly string[]
}
const message = (error: unknown): string => error instanceof Error ? error.message : String(error)
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value))

/** Publish validated scalar results without replacing live collection records.
 * Normal assignment is intentional here so Vue's reactive setter runs. Pure
 * evaluation above/below only ever writes its detached JSON candidate.
 */
export function applyResolvedNumericValues(target: object, result: MonsterBindingResolution<object>, publish: (parent: object, key: string, value: number) => boolean = Reflect.set): void {
  for (const path of result.changedPaths) {
    const value = readNumericFieldPath(result.model, path)
    validateNumericFieldValue(path, value)
    const parts = parseNumericFieldPath(path), leaf = parts[parts.length - 1]
    if (leaf.selector) throw new Error('Cannot materialize a table binding')
    const parentPath = parts.slice(0, -1).map(part => part.name + (part.selector ? `[${part.selector.kind}=${encodeURIComponent(part.selector.value)}]` : '')).join('.')
    const parent = (parentPath ? readNumericFieldPath(target, parentPath) : target) as object
    const own = Object.getOwnPropertyDescriptor(parent, leaf.name)
    if (own && !('value' in own)) throw new Error('Accessor numeric targets are not supported')
    if (!own) Object.defineProperty(parent, leaf.name, { value: undefined, enumerable: true, configurable: true, writable: true })
    if (!publish(parent, leaf.name, value as number)) throw new Error(`Numeric target is not writable: ${path}`)
  }
}

/** Write only a whitelisted, inspected leaf. Selection uses stable record identity. */
export function writeBoundNumericField(model: unknown, path: string, value: number): void {
  const inspection = inspectNumericField(model, path)
  if (!inspection.editable || inspection.field.bindingPolicy !== 'binding') throw new Error(`Inactive numeric field: ${path}`)
  const parts = parseNumericFieldPath(path)
  const leaf = parts[parts.length - 1]
  if (leaf.selector) throw new Error('Numeric table selectors cannot hold bindings')
  const parentPath = parts.slice(0, -1).map(part => part.name + (part.selector ? `[${part.selector.kind}=${encodeURIComponent(part.selector.value)}]` : '')).join('.')
  const parent = parentPath ? readNumericFieldPath(model, parentPath) : model
  // Inspection already guarantees an own data property, or an allowed missing leaf.
  Object.defineProperty(parent, leaf.name, { value, writable: true, enumerable: true, configurable: true })
}

/** Resolve against the default stored-creature formula context only.
 * No getter injection: the dependency provider and evaluator must share a policy.
 * Failed evaluation commits no numeric changes. Inactive/deleted targets retain
 * their overlay and last value, so switching modes never discards authorship.
 */
export function resolveMonsterBindings<T extends object>(input: T): MonsterBindingResolution<T> {
  const original = input as T & BindingModel
  if (original.bindings === undefined) return { model: original, errors: {}, changed: false, changedPaths: [] }
  const errors: Record<string, string> = {}
  const raw = original.bindings
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { model: original, errors: { bindings: 'Invalid binding map' }, changed: false, changedPaths: [] }
  const active: Record<string, NumericBinding> = Object.create(null)
  for (const path of Object.keys(raw)) {
    try {
      if (!isNumericBinding(raw[path])) throw new Error('Invalid numeric binding')
      const target = inspectNumericField(original, path)
      if (target.field.bindingPolicy !== 'binding') throw new Error('Literal table fields cannot hold bindings')
      if (!target.editable) throw new Error(target.blockedRepresentation ?? `Inactive numeric field: ${target.inactiveGates.join(', ')}`)
      active[path] = raw[path]
    } catch (error) { errors[path] = message(error) }
  }
  let order: readonly string[]
  const storedSources = referenceSourcesForMonster(original as unknown as Monster)
  const sources = (ref: string, target: string) => {
    const paths = storedSources(ref, target)
    return !(original as unknown as Monster).hpModifierOverride && paths.includes('HP.modifier')
      ? [...paths, 'stats.CON', 'HP.HD'] : paths
  }
  try { order = dependencyOrder(active as BindingMap, sources) }
  catch (error) { for (const path of Object.keys(active)) errors[path] = message(error); return { model: original, errors, changed: false, changedPaths: [] } }
  const model = clone(original)
  const changedPaths: string[] = []
  const syncAutomaticHp = () => {
    const m = model as unknown as Monster
    if (order.length && !m.hpModifierOverride && m.HP && m.stats) {
      const bonus = abilityModifier(m.stats.CON) * m.HP.HD
      if (Number.isSafeInteger(bonus) && m.HP.modifier !== bonus) {
        m.HP.modifier = bonus
        if (!changedPaths.includes('HP.modifier')) changedPaths.push('HP.modifier')
      }
    }
  }
  syncAutomaticHp()
  for (const path of order) {
    try {
      const inspection = inspectNumericField(model, path)
      const result = resolveNumeric(active[path], formulaContextForMonster(model as unknown as Monster), { style: inspection.field.style, integerScalar: true })
      if (!result.ok) throw new Error(result.error)
      if (active[path].mode === 'ref') for (const ref of result.refs) if (!isReferenceAllowedForField(path, ref)) throw new Error(`Reference ${ref} is not allowed for ${path}`)
      validateNumericFieldDiceValue(path, result)
      if (inspection.value !== result.flat) { writeBoundNumericField(model, path, result.flat); changedPaths.push(path) }
      syncAutomaticHp()
    } catch (error) {
      errors[path] = message(error)
      return { model: original, errors, changed: false, changedPaths: [] }
    }
  }
  return { model: changedPaths.length ? model : original, errors, changed: !!changedPaths.length, changedPaths }
}

/** Validate the entire candidate before publishing either expression or values. */
export function setMonsterBinding<T extends object>(input: T, path: string, binding: NumericBinding): MonsterBindingResolution<T> {
  const inspection = inspectNumericField(input, path)
  if (!inspection.editable) throw new Error(inspection.blockedRepresentation ?? `Inactive numeric field: ${path}`)
  if (inspection.field.bindingPolicy !== 'binding') throw new Error('Literal table fields cannot hold bindings')
  if (!isNumericBinding(binding)) throw new Error('Invalid numeric binding')
  const candidate = clone(input) as T & BindingModel
  candidate.bindings = { ...(candidate.bindings ?? {}), [path]: clone(binding) }
  const result = resolveMonsterBindings(candidate)
  // Existing suspended bindings do not prevent editing an unrelated valid field.
  if (result.errors[path]) throw new Error(result.errors[path])
  const failedActive = Object.entries(result.errors).find(([target]) => {
    try { return inspectNumericField(candidate, target).editable } catch { return false }
  })
  if (failedActive) throw new Error(failedActive[1])
  const changed = JSON.stringify((input as BindingModel).bindings ?? {}) !== JSON.stringify(candidate.bindings) || result.changed
  return { ...result, changed, model: changed ? result.model : input as T & BindingModel }
}

/** Detach without rewriting the last valid materialized scalar. */
export function clearMonsterBinding<T extends object>(input: T, path: string): MonsterBindingResolution<T> {
  const original = input as T & BindingModel
  if (!original.bindings || !Object.prototype.hasOwnProperty.call(original.bindings, path)) return { model: original, errors: {}, changed: false, changedPaths: [] }
  const model = clone(original)
  delete model.bindings?.[path]
  return { model, errors: {}, changed: true, changedPaths: [] }
}
