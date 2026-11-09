import test from 'node:test'
import assert from 'node:assert'
import { inferAbility, outcomePhrase } from '../../src/core/domain/ability-grammar.ts'
import { validateOutcomes, withStableIds } from '../../src/core/domain/outcome-graph.ts'
import type { AbilityOutcome, MonsterAction } from '../../src/core/domain/types.ts'

const action = (outcomes: AbilityOutcome[]): Partial<MonsterAction> => ({
  name: 'Fire Breath', id: 'a1', description: '', deliveryType: 'Save', outcomes,
})

test('recipient folds into the trigger lead, never a second colon', () => {
  const lines = outcomePhrase(inferAbility(action([
    { id: 'f', trigger: 'failure', recipient: 'each creature in the area', effects: [{ kind: 'text', text: 'It takes fire damage' }] },
  ])))
  assert.strictEqual(lines.length, 1)
  assert.match(lines[0], /^On Failure, each creature in the area: It takes fire damage\.$/)
  assert.doesNotMatch(lines[0], /::|:\s*:/)
})

test('references name the referenced trigger in plain text', () => {
  const lines = outcomePhrase(inferAbility(action([
    { id: 'f', trigger: 'failure', effects: [{ kind: 'text', text: 'It takes fire damage' }] },
    { id: 's', trigger: 'success', refs: ['f'], effects: [{ kind: 'text', text: 'Half as much damage' }] },
  ])))
  assert.match(lines[1], /\(builds on the failure result\)\.$/)
  assert.doesNotMatch(lines[1], /builds on the {2}result/)
})

test('a self or missing reference is dropped from prose', () => {
  const lines = outcomePhrase(inferAbility(action([
    { id: 'h', trigger: 'hit', refs: ['h', 'gone'], effects: [{ kind: 'text', text: 'Pushed back' }] },
  ])))
  assert.doesNotMatch(lines[0], /builds on/)
})

test('html markup escapes author text in the lead', () => {
  const lines = outcomePhrase(inferAbility(action([
    { id: 'h', trigger: 'hit', recipient: '<script>x</script>', effects: [{ kind: 'text', text: 'Ouch' }] },
  ])), {}, 'screen', 'html')
  assert.ok(!lines[0].includes('<script>'))
  assert.ok(lines[0].includes('&lt;script&gt;'))
})

test('validateOutcomes reports self, missing, duplicate and cycles', () => {
  const issues = validateOutcomes([
    { id: 'a', trigger: 'hit', refs: ['b'], effects: [{ kind: 'text', text: 'x' }] },
    { id: 'b', trigger: 'miss', refs: ['a', 'zz'], effects: [{ kind: 'text', text: 'y' }] },
    { id: 'c', trigger: 'success', refs: ['c'], effects: [{ kind: 'text', text: 'z' }] },
    { id: 'c', trigger: 'failure', effects: [] },
  ])
  const kinds = issues.map((i) => i.kind).sort()
  for (const k of ['cycle', 'duplicate-id', 'empty', 'missing-ref', 'self-ref']) assert.ok(kinds.includes(k as never), k)
})

test('withStableIds keeps existing ids and fills missing ones uniquely', () => {
  const out = withStableIds([{ id: 'keep', trigger: 'hit', effects: [] }, { trigger: 'miss', effects: [] }, { trigger: 'miss', effects: [] }])
  assert.strictEqual(out[0].id, 'keep')
  assert.ok(out[1].id && out[2].id && out[1].id !== out[2].id)
})
