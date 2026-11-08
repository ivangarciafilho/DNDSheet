import type { NumericBinding } from './formula.ts'
import { lookupNumericField } from './catalogs/field-types.ts'

export type EntryBindingMap = Record<string, NumericBinding>
export const entryBindingPrefix = (collection: string, id: string): string => `${collection}[id=${encodeURIComponent(id)}]`

/** Explicit user deletion discards only the deleted record's overlay. Import and
 * mode suspension retain orphaned expressions for diagnostics and recovery. */
export function withoutEntryBindings(bindings: EntryBindingMap | undefined, prefix: string, fields?: readonly string[]): EntryBindingMap {
  return Object.fromEntries(Object.entries(bindings ?? {}).filter(([path]) => {
    if (!path.startsWith(`${prefix}.`)) return true
    return fields ? !fields.includes(path.slice(prefix.length + 1).split('.')[0]) : false
  }))
}

/** Copy only fields whose values the role conversion actually copies. The
 * source expressions remain unchanged; no implicit rewrite of formula tokens. */
export function copyEntryBindings(bindings: EntryBindingMap | undefined, source: string, target: string, fields: readonly string[]): EntryBindingMap {
  const result = { ...bindings }
  for (const [path, binding] of Object.entries(bindings ?? {})) {
    if (!path.startsWith(`${source}.`)) continue
    const suffix = path.slice(source.length + 1)
    const destination = `${target}.${suffix}`
    if (fields.includes(suffix.split('.')[0]) && lookupNumericField(destination)) result[destination] = { ...binding }
  }
  return result
}
