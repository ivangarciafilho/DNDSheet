import test from 'node:test'
import assert from 'node:assert/strict'
import { createOverflowStorage } from '../../src/core/domain/overflow-storage.ts'

const key = 'app.monster'
const otherKey = 'app.editor'
const nextTurn = () => new Promise(resolve => setImmediate(resolve))

test('artwork snapshots survive quota exhaustion and hydrate before Pinia reads', async () => {
  const local = new Map([[key, 'previous']])
  const durable = new Map<string, string>()
  const primary = () => ({
    getItem: (id: string) => local.get(id) ?? null,
    setItem: (id: string, value: string) => {
      if (value.length > 10) throw new DOMException('full', 'QuotaExceededError')
      local.set(id, value)
    },
  })
  const overflow = {
    read: async (id: string) => durable.get(id) ?? null,
    write: async (id: string, value: string) => { durable.set(id, value) },
  }
  const report = () => assert.fail('quota was recovered')
  const save = await createOverflowStorage(primary, overflow, [key, otherKey], report)
  save.setItem(otherKey, 'small')
  save.setItem(key, 'an oversized portrait')
  await nextTurn()
  assert.equal(local.get(otherKey), 'small')
  assert.equal(local.get(key), 'previous')
  const reload = await createOverflowStorage(primary, overflow, [key, otherKey], report)
  assert.equal(reload.getItem(key), 'an oversized portrait')
  reload.setItem(key, 'smaller')
  await nextTurn()
  assert.equal(durable.get(key), 'smaller')
})

test('rapid overflow writes queue the latest whole snapshot', async () => {
  let resolveFirst: () => void = () => assert.fail('missing first write')
  const writes: string[] = []
  const save = await createOverflowStorage(() => undefined, {
    read: async () => null,
    write: async (_id, value) => {
      writes.push(value)
      if (writes.length === 1) await new Promise<void>(resolve => { resolveFirst = resolve })
    },
  }, [key], () => assert.fail('save succeeded'))
  save.setItem(key, 'first')
  save.setItem(key, 'second')
  save.setItem(key, 'final')
  assert.deepEqual(writes, ['first'])
  resolveFirst()
  await nextTurn()
  assert.deepEqual(writes, ['first', 'final'])
  assert.equal(save.getItem(key), 'final')
})

test('failed overflow leaves the last saved data intact and reports the affected store', async () => {
  const error = new DOMException('blocked', 'SecurityError')
  const failures: Array<[unknown, string]> = []
  const save = await createOverflowStorage(() => undefined, {
    read: async () => 'last good snapshot',
    write: async () => { throw error },
  }, [key], (cause, store) => failures.push([cause, store]))
  save.setItem(key, 'unsaved')
  save.setItem(key, 'latest unsaved')
  await nextTurn()
  assert.equal(save.getItem(key), 'last good snapshot')
  assert.deepEqual(failures, [[error, key]])
})

test('blocked overflow reads leave localStorage hydration and writes working', async () => {
  const local = new Map([[key, 'existing local save']])
  const storage = await createOverflowStorage(() => ({
    getItem: id => local.get(id) ?? null,
    setItem: (id, value) => { local.set(id, value) },
  }), {
    read: async () => { throw new DOMException('blocked', 'SecurityError') },
    write: async () => assert.fail('successful local writes should stay synchronous'),
  }, [key], () => assert.fail('local storage succeeded'))
  assert.equal(storage.getItem(key), 'existing local save')
  storage.setItem(key, 'new local save')
  assert.equal(local.get(key), 'new local save')
})
