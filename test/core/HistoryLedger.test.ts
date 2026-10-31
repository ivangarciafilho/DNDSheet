import test from 'node:test'
import assert from 'node:assert'
import { HistoryLedger } from '../../src/core/usecases/HistoryLedger.ts'

test('silent materialization and identical current snapshots do not consume undo steps', () => {
  const ledger = new HistoryLedger<{ value: number }>()
  ledger.pushSnapshot({ value: 1 }, 'Initial')
  ledger.pushSnapshot({ value: 2 }, 'Derived', { historySilent: true })
  assert.equal(ledger.getUndoCount(), 1)
  ledger.pushSnapshot({ value: 3 }, 'Authored change')
  assert.equal(ledger.undo({ value: 3 })?.snapshot.value, 1)
  assert.equal(ledger.redo({ value: 1 })?.snapshot.value, 3)
})

test('HistoryLedger - Undo and Redo lifecycle with branch invalidation', () => {
  const ledger = new HistoryLedger<{ count: number }>(5)

  let state = { count: 0 }
  assert.strictEqual(ledger.canUndo(), false)
  assert.strictEqual(ledger.canRedo(), false)

  // 1. First modification
  ledger.pushSnapshot(state, 'Initial state')
  state = { count: 1 }

  // 2. Second modification
  ledger.pushSnapshot(state, 'Increment to 1')
  state = { count: 2 }

  assert.strictEqual(ledger.canUndo(), true)
  assert.strictEqual(ledger.canRedo(), false)
  assert.strictEqual(ledger.getUndoCount(), 2)

  // 3. Undo to 1
  const undo1 = ledger.undo(state)
  assert.ok(undo1)
  assert.strictEqual(undo1.snapshot.count, 1)
  assert.strictEqual(undo1.description, 'Increment to 1')
  state = undo1.snapshot

  assert.strictEqual(ledger.canRedo(), true)
  assert.strictEqual(ledger.getRedoCount(), 1)

  // 4. Redo back to 2
  const redo1 = ledger.redo(state)
  assert.ok(redo1)
  assert.strictEqual(redo1.snapshot.count, 2)
  state = redo1.snapshot

  // 5. New branch action invalidates redo
  ledger.pushSnapshot(state, 'Branching action')
  state = { count: 100 }
  assert.strictEqual(ledger.canRedo(), false)
  assert.strictEqual(ledger.getRedoCount(), 0)
})

test('HistoryLedger - Bounded capacity eviction', () => {
  const depth = 3
  const ledger = new HistoryLedger<{ step: number }>(depth)

  for (let i = 1; i <= 5; i++) {
    ledger.pushSnapshot({ step: i }, `Step ${i}`)
  }

  // Capacity should be capped at 3
  assert.strictEqual(ledger.getUndoCount(), 3)

  // Oldest steps 1 and 2 should have been evicted.
  // Undoing should yield Step 5, then Step 4, then Step 3, then null.
  let current = { step: 6 }
  const u1 = ledger.undo(current)
  assert.strictEqual(u1?.snapshot.step, 5)
  current = u1.snapshot

  const u2 = ledger.undo(current)
  assert.strictEqual(u2?.snapshot.step, 4)
  current = u2.snapshot

  const u3 = ledger.undo(current)
  assert.strictEqual(u3?.snapshot.step, 3)
  current = u3.snapshot

  const u4 = ledger.undo(current)
  assert.strictEqual(u4, null)
})

test('HistoryLedger - Deep snapshot mutation isolation', () => {
  const ledger = new HistoryLedger<{ nested: { name: string; tags: string[] } }>(10)
  const original = { nested: { name: 'Dragon', tags: ['fire', 'flying'] } }

  ledger.pushSnapshot(original, 'Created dragon')

  // Mutate original directly
  original.nested.name = 'Hydra'
  original.nested.tags.push('poison')

  const undone = ledger.undo(original)
  assert.ok(undone)
  // Snapshot in ledger must remain intact
  assert.strictEqual(undone.snapshot.nested.name, 'Dragon')
  assert.deepStrictEqual(undone.snapshot.nested.tags, ['fire', 'flying'])
})

test('HistoryLedger - Empty state and clear behavior', () => {
  const ledger = new HistoryLedger<{ val: string }>(10)
  assert.strictEqual(ledger.undo({ val: 'x' }), null)
  assert.strictEqual(ledger.redo({ val: 'x' }), null)

  ledger.pushSnapshot({ val: 'a' }, 'Action A')
  ledger.pushSnapshot({ val: 'b' }, 'Action B')
  assert.strictEqual(ledger.canUndo(), true)

  ledger.clear()
  assert.strictEqual(ledger.canUndo(), false)
  assert.strictEqual(ledger.canRedo(), false)
  assert.strictEqual(ledger.getUndoCount(), 0)
  assert.strictEqual(ledger.getRedoCount(), 0)
})
