import test from 'node:test'
import assert from 'node:assert/strict'
import {
  cloneOutcomeList,
  duplicateOutcomeById,
  moveOutcomeById,
  outcomeOccurrences,
  removeOutcomeById,
  repairOutcomeIdAt,
  validateOutcomes,
  withStableIds,
} from '../../src/core/domain/outcome-graph.ts'
const clause = (id: string, refs: string[] = []) => ({
  id,
  trigger: 'hit',
  effects: [{ kind: 'text', text: 'Damage' }],
  refs,
})
test('malformed imports diagnose safely without mutation', () => {
  const data = [
    null,
    { id: 'a', trigger: 5, effects: [null], refs: {} },
    { id: 'a', effects: [] },
  ]
  const before = JSON.stringify(data)
  assert.ok(validateOutcomes(data).some((issue) => issue.kind === 'malformed'))
  assert.equal(JSON.stringify(data), before)
  assert.equal(
    new Set(outcomeOccurrences(data).map((row) => row.occurrenceKey)).size,
    3
  )
  assert.ok(validateOutcomes(null).length)
})
test('duplicate identities stay explicit and cannot be targeted ambiguously', () => {
  const data = [clause('a'), clause('a'), clause('b', ['a'])]
  assert.equal(withStableIds(data)[1].id, 'a')
  assert.equal(removeOutcomeById(data, 'a').changed, false)
  assert.ok(
    validateOutcomes(data).some((issue) => issue.kind === 'ambiguous-id')
  )
  const repair = repairOutcomeIdAt(data, 1)
  assert.notEqual(repair.outcomes[1].id, 'a')
  assert.deepEqual(repair.outcomes[2].refs, ['a'])
  assert.equal(data[1].id, 'a')
})
test('move and remove preserve references and report dangling dependents', () => {
  const data = [clause('a'), clause('b', ['a'])]
  assert.deepEqual(
    moveOutcomeById(data, 'a', 1).outcomes.map((o) => o.id),
    ['b', 'a']
  )
  const removed = removeOutcomeById(data, 'a')
  assert.deepEqual(removed.dependentIds, ['b'])
  assert.deepEqual(removed.outcomes[0].refs, ['a'])
  assert.ok(removed.issues.some((issue) => issue.kind === 'missing-ref'))
  assert.equal(data.length, 2)
})
test('single copy retains authored references; explicit list copy remaps internal targets', () => {
  const data = [clause('a', ['a', 'outside']), clause('b', ['a'])]
  const duplicate = duplicateOutcomeById(data, 'a')
  assert.deepEqual(duplicate.outcomes[1].refs, ['a', 'outside'])
  const cloned = cloneOutcomeList(data)
  assert.equal(cloned.outcomes[0].refs?.[0], cloned.outcomes[0].id)
  assert.equal(cloned.outcomes[0].refs?.[1], 'outside')
  assert.equal(cloned.outcomes[1].refs?.[0], cloned.outcomes[0].id)
})
test('long graphs validate iteratively and detect a closing cycle', () => {
  const data = Array.from({ length: 20000 }, (_, index) =>
    clause(`a${index}`, index ? [`a${index - 1}`] : ['a19999'])
  )
  assert.ok(validateOutcomes(data).some((issue) => issue.kind === 'cycle'))
})

test('reactive proxy copies preserve unknown fields and detach nested arrays', () => {
  const extension = {
    nested: [{ value: 'original', optional: undefined }],
    optional: undefined,
  }
  const raw = { ...clause('a', ['a', 'outside']), extension }
  const wrapped = new Proxy({ ...raw, extension: new Proxy(extension, {}) }, {})
  const source = new Proxy([wrapped], {})
  const duplicate = duplicateOutcomeById(source, 'a')
  const copy = duplicate.outcomes[1] as typeof raw
  assert.notEqual(copy.extension, extension)
  assert.equal(Object.hasOwn(copy.extension, 'optional'), true)
  assert.equal(Object.hasOwn(copy.extension.nested[0], 'optional'), true)
  copy.extension.nested[0].value = 'changed'
  assert.equal(extension.nested[0].value, 'original')
  const list = cloneOutcomeList(source)
  assert.equal(list.changed, true)
  assert.equal(list.outcomes[0].refs?.[0], list.outcomes[0].id)
  assert.equal(source[0].id, 'a')
  assert.deepEqual(source[0].refs, ['a', 'outside'])
})
test('large duplicated identity lists diagnose every occurrence', () => {
  const data = Array.from({ length: 20000 }, () => clause('duplicate'))
  assert.equal(
    validateOutcomes(data).filter((issue) => issue.kind === 'duplicate-id')
      .length,
    20000
  )
})
