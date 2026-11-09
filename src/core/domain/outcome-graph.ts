// A11.5 outcome clause graph: stable ids, reference validation, cycle detection, prose.
import type { AbilityOutcome } from './types'

export interface OutcomeIssue { kind: 'empty' | 'missing-ref' | 'self-ref' | 'cycle' | 'duplicate-id'; outcomeId: string; message: string }

const KNOWN: Record<string, string> = { hit: 'On a hit', miss: 'On a miss', success: 'On a successful save', failure: 'On a failed save', 'failed save': 'On a failed save', 'successful save': 'On a successful save' }

export const triggerLead = (trigger: string) => KNOWN[trigger.trim().toLowerCase()] ?? (trigger.trim() ? trigger.trim().replace(/^./, (c) => c.toUpperCase()) : 'Effect')

let seq = 0
export const newOutcomeId = () => `oc-${Date.now().toString(36)}${(seq++).toString(36)}`

/** Gives every clause a stable id without touching clauses that already have one. */
export function withStableIds(outcomes: AbilityOutcome[]): AbilityOutcome[] {
  return outcomes.map((o) => (o.id ? o : { ...o, id: newOutcomeId() }))
}

export function validateOutcomes(outcomes: AbilityOutcome[]): OutcomeIssue[] {
  const issues: OutcomeIssue[] = []
  const ids = new Map<string, AbilityOutcome>()
  for (const o of outcomes) {
    const id = o.id ?? ''
    if (id && ids.has(id)) issues.push({ kind: 'duplicate-id', outcomeId: id, message: `Two clauses share the id ${id}.` })
    if (id) ids.set(id, o)
    const hasEffect = o.effects?.some((e) => (e.formula ?? '').trim() || (e.text ?? '').trim()) || (o.rider ?? '').trim() || (o.diceTable?.length ?? 0) > 0
    if (!hasEffect) issues.push({ kind: 'empty', outcomeId: id, message: `${triggerLead(o.trigger)} has no effect yet.` })
  }
  for (const o of outcomes) {
    for (const r of o.refs ?? []) {
      if (r === o.id) issues.push({ kind: 'self-ref', outcomeId: o.id ?? '', message: `${triggerLead(o.trigger)} refers to itself.` })
      else if (!ids.has(r)) issues.push({ kind: 'missing-ref', outcomeId: o.id ?? '', message: `${triggerLead(o.trigger)} refers to a clause that no longer exists.` })
    }
  }
  // cycle detection (DFS, white/grey/black)
  const state = new Map<string, 0 | 1 | 2>()
  const visit = (id: string, path: string[]): void => {
    state.set(id, 1)
    for (const r of ids.get(id)?.refs ?? []) {
      if (!ids.has(r) || r === id) continue
      const s = state.get(r) ?? 0
      if (s === 1) issues.push({ kind: 'cycle', outcomeId: id, message: `Clauses refer to each other in a loop (${[...path, id, r].map((x) => triggerLead(ids.get(x)!.trigger)).join(' → ')}).` })
      else if (s === 0) visit(r, [...path, id])
    }
    state.set(id, 2)
  }
  for (const id of ids.keys()) if (!state.get(id)) visit(id, [])
  return issues
}
