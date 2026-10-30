import type { Multiattack } from './types.ts'

export type ReferenceKind = 'attacks' | 'actions'
export interface ReferenceTarget { id: string; name: string }
export interface MultiattackReference extends ReferenceTarget { index: number; missing: boolean }
export type ReferenceEdit = { kind: ReferenceKind; operation: 'add'; targetId: string } |
  { kind: ReferenceKind; operation: 'remove' | 'up' | 'down'; index: number; expectedId: string } |
  { kind: ReferenceKind; operation: 'replace'; index: number; expectedId: string; targetId: string }

/** Resolve IDs, never labels: a renamed or missing source must not silently change a reference. */
export function multiattackReferences(group: Multiattack, kind: ReferenceKind, library: readonly ReferenceTarget[]): MultiattackReference[] {
  const names = new Map(library.map(target => [target.id, target.name]))
  return group[kind].map((id, index) => ({ id, index, name: names.get(id) || (names.has(id) ? 'Unnamed entry' : `Missing ${kind === 'attacks' ? 'attack' : 'action'}: ${id}`), missing: !names.has(id) }))
}

/** Own only one list. Occurrence index + expected ID guards stale controls and repeated references. */
export function multiattackReferencePatch(group: Multiattack, edit: ReferenceEdit, library: readonly ReferenceTarget[]): Partial<Multiattack> {
  const current = group[edit.kind]
  if (!current) return {}
  if ('targetId' in edit && !library.some(target => target.id === edit.targetId)) return {}
  const next = [...current]
  if (edit.operation === 'add') next.push(edit.targetId)
  else {
    if (!Number.isInteger(edit.index) || edit.index < 0 || edit.index >= current.length || current[edit.index] !== edit.expectedId) return {}
    if (edit.operation === 'remove') next.splice(edit.index, 1)
    else if (edit.operation === 'replace') next[edit.index] = edit.targetId
    else {
      const destination = edit.index + (edit.operation === 'up' ? -1 : 1)
      if (destination < 0 || destination >= current.length) return {}
      ;[next[edit.index], next[destination]] = [next[destination], next[edit.index]]
    }
  }
  return { [edit.kind]: next }
}

/** Renderer totals retain first-seen order, including numeric and prototype-like imported IDs. */
export function countMultiattackReferences(ids: readonly string[]): [string, number][] {
  const counts = new Map<string, number>()
  for (const id of ids) counts.set(id, (counts.get(id) ?? 0) + 1)
  return [...counts]
}
