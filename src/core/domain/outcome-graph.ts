import type { AbilityOutcome } from './types'

export interface OutcomeIssue {
  kind:
    | 'empty'
    | 'missing-ref'
    | 'self-ref'
    | 'cycle'
    | 'duplicate-id'
    | 'missing-id'
    | 'ambiguous-id'
    | 'malformed'
  outcomeId: string
  message: string
  index?: number
  occurrenceKey?: string
}
const KNOWN: Record<string, string> = {
  hit: 'On a hit',
  miss: 'On a miss',
  success: 'On a successful save',
  failure: 'On a failed save',
  'failed save': 'On a failed save',
  'successful save': 'On a successful save',
}
const record = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
const string = (value: unknown) => (typeof value === 'string' ? value : '')
const idOf = (value: unknown) => string(record(value).id)
const refsOf = (value: unknown): string[] =>
  Array.isArray(record(value).refs)
    ? (record(value).refs as unknown[]).filter(
        (ref): ref is string => typeof ref === 'string'
      )
    : []
export const triggerLead = (trigger: unknown) => {
  const text = string(trigger).trim()
  return (
    KNOWN[text.toLowerCase()] ??
    (text ? text.replace(/^./, (c) => c.toUpperCase()) : 'Effect')
  )
}
let seq = 0
export const newOutcomeId = () =>
  `oc-${Date.now().toString(36)}${(seq++).toString(36)}`

/** Non-mutating occurrence keys distinguish malformed or duplicated imported identities. */
export function outcomeOccurrences(outcomes: unknown) {
  const counts = new Map<string, number>()
  return (Array.isArray(outcomes) ? outcomes : []).map(
    (outcome: unknown, index: number) => {
      const id = idOf(outcome)
      const occurrence = counts.get(id) ?? 0
      counts.set(id, occurrence + 1)
      return {
        outcome,
        index,
        id,
        occurrenceKey: JSON.stringify([id, occurrence]),
      }
    }
  )
}
/** Assign missing identities only. Duplicate identities require an explicit author decision. */
export function withStableIds(outcomes: AbilityOutcome[]): AbilityOutcome[] {
  const used = new Set(outcomes.map(idOf).filter(Boolean))
  return outcomes.map((outcome) => {
    if (idOf(outcome)) return outcome
    let id: string
    do {
      id = newOutcomeId()
    } while (used.has(id))
    used.add(id)
    return { ...outcome, id }
  })
}
export function validateOutcomes(outcomes: unknown): OutcomeIssue[] {
  if (!Array.isArray(outcomes))
    return [
      {
        kind: 'malformed',
        outcomeId: '',
        message: 'Outcome clauses must be a list.',
      },
    ]
  const issues: OutcomeIssue[] = []
  const occurrences = outcomeOccurrences(outcomes)
  const ids = new Map<string, number[]>()
  for (const row of occurrences) {
    if (!row.id) continue
    const indexes = ids.get(row.id)
    if (indexes) indexes.push(row.index)
    else ids.set(row.id, [row.index])
  }
  const add = (index: number, kind: OutcomeIssue['kind'], message: string) => {
    const row = occurrences[index]
    issues.push({
      kind,
      outcomeId: row.id,
      index,
      occurrenceKey: row.occurrenceKey,
      message,
    })
  }
  for (const { outcome, index, id } of occurrences) {
    const o = record(outcome)
    if (
      Object.keys(o).length === 0 ||
      typeof o.trigger !== 'string' ||
      !Array.isArray(o.effects) ||
      (o.refs !== undefined &&
        (!Array.isArray(o.refs) ||
          o.refs.some((ref: unknown) => typeof ref !== 'string')))
    )
      add(index, 'malformed', 'This clause contains malformed fields.')
    if (!id) add(index, 'missing-id', 'This clause has no stable identity.')
    if ((ids.get(id)?.length ?? 0) > 1)
      add(index, 'duplicate-id', `Multiple clauses share the id ${id}.`)
    const effect =
      Array.isArray(o.effects) &&
      o.effects.some((value: unknown) => {
        const e = record(value)
        return string(e.formula).trim() || string(e.text).trim()
      })
    if (
      !effect &&
      !string(o.rider).trim() &&
      !(Array.isArray(o.diceTable) && o.diceTable.length)
    )
      add(index, 'empty', `${triggerLead(o.trigger)} has no effect yet.`)
    for (const ref of refsOf(o)) {
      if (ref === id)
        add(index, 'self-ref', `${triggerLead(o.trigger)} refers to itself.`)
      else if (!ids.has(ref))
        add(
          index,
          'missing-ref',
          `${triggerLead(o.trigger)} refers to a clause that no longer exists.`
        )
      else if ((ids.get(ref)?.length ?? 0) > 1)
        add(
          index,
          'ambiguous-id',
          `Reference ${ref} identifies multiple clauses.`
        )
    }
  }
  // Iterative DFS avoids call-stack overflow. Ambiguous identities cannot define edges.
  const state = new Map<string, number>()
  for (const [start, indexes] of ids) {
    if (indexes.length !== 1 || state.has(start)) continue
    const stack = [{ id: start, refs: refsOf(outcomes[indexes[0]]), next: 0 }]
    state.set(start, 1)
    while (stack.length) {
      const frame = stack[stack.length - 1]
      if (frame.next >= frame.refs.length) {
        state.set(frame.id, 2)
        stack.pop()
        continue
      }
      const ref = frame.refs[frame.next++]
      if (ref === frame.id || ids.get(ref)?.length !== 1) continue
      if (state.get(ref) === 1)
        add(
          (ids.get(frame.id) ?? [])[0],
          'cycle',
          `Clauses refer to each other in a loop (${frame.id} → ${ref}).`
        )
      else if (!state.has(ref)) {
        state.set(ref, 1)
        stack.push({
          id: ref,
          refs: refsOf(outcomes[(ids.get(ref) ?? [])[0]]),
          next: 0,
        })
      }
    }
  }
  return issues
}
export interface OutcomeCommandResult {
  outcomes: AbilityOutcome[]
  issues: OutcomeIssue[]
  changed: boolean
  dependentIds: string[]
  createdId?: string
}
function commandTarget(outcomes: AbilityOutcome[], id: string): number {
  const matches = outcomes.flatMap((outcome, index) =>
    idOf(outcome) === id ? [index] : []
  )
  return id && matches.length === 1 ? matches[0] : -1
}
function result(
  outcomes: AbilityOutcome[],
  changed = false,
  dependentIds: string[] = [],
  createdId?: string
): OutcomeCommandResult {
  return {
    outcomes,
    issues: validateOutcomes(outcomes),
    changed,
    dependentIds,
    ...(createdId ? { createdId } : {}),
  }
}
export function moveOutcomeById(
  outcomes: AbilityOutcome[],
  id: string,
  offset: number
): OutcomeCommandResult {
  const index = commandTarget(outcomes, id)
  const target = index + offset
  if (
    index < 0 ||
    !Number.isInteger(offset) ||
    target < 0 ||
    target >= outcomes.length ||
    target === index
  )
    return result(outcomes)
  const next = [...outcomes]
  const [moved] = next.splice(index, 1)
  next.splice(target, 0, moved)
  return result(next, true)
}
export function removeOutcomeById(
  outcomes: AbilityOutcome[],
  id: string
): OutcomeCommandResult {
  const index = commandTarget(outcomes, id)
  if (index < 0) return result(outcomes)
  const dependentIds = outcomes
    .filter((outcome, i) => i !== index && refsOf(outcome).includes(id))
    .map(idOf)
  return result(
    outcomes.filter((_, i) => i !== index),
    true,
    dependentIds
  )
}
/** Clone authored JSON-like records through reactive proxies without losing undefined fields. */
function cloneAuthoredValue<T>(
  value: T,
  seen = new WeakMap<object, object>()
): T {
  if (value === null || typeof value !== 'object') return value
  const existing = seen.get(value)
  if (existing) return existing as T
  const copy = Array.isArray(value) ? new Array(value.length) : {}
  seen.set(value, copy)
  for (const key of Object.keys(value)) {
    Object.defineProperty(copy, key, {
      value: cloneAuthoredValue((value as Record<string, unknown>)[key], seen),
      enumerable: true,
      writable: true,
      configurable: true,
    })
  }
  return copy as T
}
export function duplicateOutcomeById(
  outcomes: AbilityOutcome[],
  id: string
): OutcomeCommandResult {
  const index = commandTarget(outcomes, id)
  if (index < 0) return result(outcomes)
  const used = new Set(outcomes.map(idOf))
  let createdId: string
  do {
    createdId = newOutcomeId()
  } while (used.has(createdId))
  const copy = cloneAuthoredValue(outcomes[index])
  copy.id = createdId
  const next = [...outcomes]
  next.splice(index + 1, 0, copy)
  return result(next, true, [], createdId)
}
/** Explicit list copying remaps only references whose unique targets are inside the copied list. */
export function cloneOutcomeList(
  outcomes: AbilityOutcome[]
): OutcomeCommandResult {
  if (
    validateOutcomes(outcomes).some(
      (issue) =>
        issue.kind === 'duplicate-id' ||
        issue.kind === 'missing-id' ||
        issue.kind === 'malformed'
    )
  )
    return result(outcomes)
  const used = new Set(outcomes.map(idOf))
  const mapping = new Map<string, string>()
  for (const outcome of outcomes) {
    let id: string
    do {
      id = newOutcomeId()
    } while (used.has(id))
    used.add(id)
    mapping.set(idOf(outcome), id)
  }
  const copies = cloneAuthoredValue(outcomes).map((outcome) => ({
    ...outcome,
    id: mapping.get(idOf(outcome)) ?? idOf(outcome),
    ...(Array.isArray(outcome.refs)
      ? { refs: outcome.refs.map((ref) => mapping.get(ref) ?? ref) }
      : {}),
  }))
  return result(copies, true)
}
/** Repair a selected occurrence explicitly; authored references retain their original targets. */
export function repairOutcomeIdAt(
  outcomes: AbilityOutcome[],
  index: number
): OutcomeCommandResult {
  if (!Number.isInteger(index) || index < 0 || index >= outcomes.length)
    return result(outcomes)
  const used = new Set(outcomes.map(idOf))
  let createdId: string
  do {
    createdId = newOutcomeId()
  } while (used.has(createdId))
  const next = [...outcomes]
  next[index] = { ...outcomes[index], id: createdId }
  return result(
    next,
    true,
    outcomes
      .filter((outcome) => refsOf(outcome).includes(idOf(outcomes[index])))
      .map(idOf),
    createdId
  )
}
