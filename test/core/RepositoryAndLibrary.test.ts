import assert from 'node:assert/strict'
import test from 'node:test'
import { IndexedDbStorageAdapter } from '../../src/core/adapters/IndexedDbStorageAdapter.ts'
import { LocalStorageAdapter, MemoryStorageBackend, type StorageBackend } from '../../src/core/adapters/LocalStorageAdapter.ts'
import {
  BackendKvStore,
  MonsterRepository,
  selectRepositoryBackend,
  type AsyncKvStore,
} from '../../src/core/adapters/RepositoryStorage.ts'
import {
  buildBackupBundle,
  duplicateCreatureDocument,
  parseAndValidateBackupBundle,
  queryCreatureSummaries,
  summarizeMonster,
} from '../../src/core/domain/creature-library.ts'
import { defaultMonster, type MonsterAction } from '../../src/core/domain/types.ts'
import { StorageFailureError } from '../../src/core/ports/StoragePort.ts'

class FailingQuotaBackend extends MemoryStorageBackend {
  failWrites = false

  override setItem(key: string, value: string): void {
    if (this.failWrites) {
      const err = new Error('QuotaExceededError: Storage limit reached')
      err.name = 'QuotaExceededError'
      throw err
    }
    super.setItem(key, value)
  }
}

test('B5.2 / B5.3: IndexedDbStorageAdapter refuses silent fallback and save failure preserves last good state', async () => {
  const idb = new IndexedDbStorageAdapter('test-blocked')
  await assert.rejects(
    () => idb.saveMonster(defaultMonster()),
    (err: unknown) => err instanceof StorageFailureError && err.code === 'storage_blocked',
  )

  const backend = new FailingQuotaBackend()
  const kv = new BackendKvStore(backend)
  const repo = new MonsterRepository('localstorage', kv)

  const initial = { ...defaultMonster(), id: 'c-1', name: 'Ash Dragon' }
  const okSave = await repo.save(initial)
  assert.equal(okSave.ok, true)

  backend.failWrites = true
  const failedSave = await repo.save({ ...initial, name: 'Corrupted Overwrite Attempt' })
  assert.equal(failedSave.ok, false)
  assert.equal(failedSave.preservedLastGood, true)
  assert.equal(failedSave.error?.code, 'quota_exceeded')

  backend.failWrites = false
  const loaded = await repo.load('c-1')
  assert.equal(loaded?.document.name, 'Ash Dragon')
})

test('B5.2: selectRepositoryBackend chooses once at startup with blocked fallback handling', async () => {
  const mem = new MemoryStorageBackend()
  const chosenIdb = await selectRepositoryBackend({
    probeIndexedDb: async () => new BackendKvStore(mem, 'idb:'),
    localStorageBackend: mem,
  })
  assert.equal(chosenIdb.backend, 'indexeddb')

  const chosenFallback = await selectRepositoryBackend({
    probeIndexedDb: async () => {
      throw new Error('IDB blocked in private tab')
    },
    localStorageBackend: mem,
  })
  assert.equal(chosenFallback.backend, 'localstorage')

  const blockedStorage: StorageBackend = {
    getItem: () => null,
    setItem: () => {
      const e = new Error('Storage access denied')
      e.name = 'SecurityError'
      throw e
    },
    removeItem: () => undefined,
    key: () => null,
    length: 0,
  }
  const unavailable = await selectRepositoryBackend({
    probeIndexedDb: async () => {
      throw new Error('IDB blocked')
    },
    localStorageBackend: blockedStorage,
  })
  assert.equal(unavailable.backend, 'unavailable')
  assert.equal(unavailable.error?.code, 'storage_blocked')
})

test('B5.4: migrateLegacySources verifies writes before marking done and preserves legacy records', async () => {
  const legacyBackend = new MemoryStorageBackend()
  const oldAdapter = new LocalStorageAdapter('dndsheet_monster_', legacyBackend)
  await oldAdapter.saveMonster({ ...defaultMonster(), id: 'legacy-1', name: 'Kobold Sapper' })
  legacyBackend.setItem('dndsheet_monster_corrupt', '{bad json')
  legacyBackend.setItem('app.monster', JSON.stringify({ ...defaultMonster(), id: 'pinia-1', name: 'Gloom Stalker' }))

  const repoBackend = new MemoryStorageBackend()
  const repo = new MonsterRepository('localstorage', new BackendKvStore(repoBackend))
  const report1 = await repo.migrateLegacySources(legacyBackend)

  assert.equal(report1.alreadyMigrated, false)
  assert.equal(report1.migratedCount, 2)
  assert.equal(report1.quarantined.length, 1)
  assert.equal(report1.quarantined[0].key, 'dndsheet_monster_corrupt')

  // Legacy data was preserved untouched
  assert.ok(legacyBackend.getItem('dndsheet_monster_legacy-1'))

  // Second run sees verified marker and skips re-import
  const report2 = await repo.migrateLegacySources(legacyBackend)
  assert.equal(report2.alreadyMigrated, true)
  assert.equal(report2.migratedCount, 0)

  const { summaries } = await repo.list()
  assert.equal(summaries.some((s) => s.name === 'Kobold Sapper'), true)
  assert.equal(summaries.some((s) => s.name === 'Gloom Stalker'), true)
})

test('B5.5 / B5.6: backup bundle quarantines bad items and restore rolls back atomically on mid-write failure', async () => {
  const kv = new BackendKvStore(new MemoryStorageBackend())
  const repo = new MonsterRepository('localstorage', kv)
  await repo.save({ ...defaultMonster(), id: 'orig-1', name: 'Original Guard' })

  const bundle = buildBackupBundle([
    {
      summary: summarizeMonster({ ...defaultMonster(), id: 'new-1', name: 'Restored Sphinx' }),
      document: { ...defaultMonster(), id: 'new-1', name: 'Restored Sphinx' },
    },
  ])
  // Inject a malformed entry into bundle payload
  const rawWithCorrupt = JSON.stringify({
    ...bundle,
    items: [...bundle.items, { summary: { id: 'bad', name: 'Broken' }, document: 'not-an-object' }],
  })

  const validated = parseAndValidateBackupBundle(rawWithCorrupt)
  assert.equal(validated.valid, true)
  assert.equal(validated.entries.length, 1)
  assert.equal(validated.quarantined.length, 1)

  // Mid-restore write error rolls back cleanly to Original Guard
  let docWrites = 0
  const failingKv: AsyncKvStore = {
    get: (k) => kv.get(k),
    keys: () => kv.keys(),
    remove: (k) => kv.remove(k),
    set: async (k, v) => {
      if (k === '__index__' && docWrites > 0) {
        const e = new Error('Simulated crash writing index')
        e.name = 'QuotaExceededError'
        throw e
      }
      if (k.startsWith('doc:')) docWrites++
      return kv.set(k, v)
    },
  }
  const rollbackRepo = new MonsterRepository('localstorage', failingKv)
  const res = await rollbackRepo.restoreBackup(rawWithCorrupt)
  assert.equal(res.ok, false)
  assert.equal(res.rolledBack, true)

  const afterList = await repo.list()
  assert.equal(afterList.summaries.length, 1)
  assert.equal(afterList.summaries[0].name, 'Original Guard')
})

test('B6.1-B6.4: duplication remaps nested IDs/bindings without aliasing and 250+ library queries filter accurately', () => {
  const sourceAction: MonsterAction = {
    id: 'act-claw',
    name: 'Rend',
    description: 'Slashes target',
    recharge: '',
    legendaryOnly: false,
    limitedUse: { count: 0, rate: '' },
    stat: 'STR',
    save: { override: false, overrideValue: 10 },
    range: '5 ft',
    effects: [],
    customPreamble: false,
    bonusAction: false,
  }
  const source = {
    ...defaultMonster(),
    id: 'src-id',
    name: 'Shadow Wyrm',
    actions: [sourceAction],
    legendaryActions: [{ actionId: 'act-claw', cost: 2 }],
    bindings: {
      'actions[id=act-claw].save.overrideValue': { formula: '10 + pb' },
    },
  }

  const dup = duplicateCreatureDocument(source, ['Shadow Wyrm'])
  assert.notEqual(dup.document.id, source.id)
  assert.equal(dup.document.name, 'Shadow Wyrm (Copy)')
  const dupActionId = dup.document.actions[0].id
  assert.notEqual(dupActionId, 'act-claw')
  assert.equal(dup.document.legendaryActions[0].actionId, dupActionId)
  assert.ok(dup.document.bindings?.[`actions[id=${dupActionId}].save.overrideValue`])
  assert.equal(dup.document.bindings?.['actions[id=act-claw].save.overrideValue'], undefined)

  // Fast query over 250 creatures + Archive / Trash isolation
  const summaries = Array.from({ length: 250 }, (_, i) =>
    summarizeMonster(
      { ...defaultMonster(), id: `id-${i}`, name: `Creature ${i}`, CR: (i % 10) + 1 },
      undefined,
      {
        folder: i % 2 === 0 ? 'Campaign' : 'OneShot',
        tags: i % 5 === 0 ? ['boss'] : ['minion'],
        archived: i >= 220 && i < 235,
        trashed: i >= 235,
      },
      `2026-11-${String((i % 28) + 1).padStart(2, '0')}T10:00:00Z`,
    ),
  )

  const active = queryCreatureSummaries(summaries, { view: 'active' })
  assert.equal(active.length, 220)
  const archived = queryCreatureSummaries(summaries, { view: 'archived' })
  assert.equal(archived.length, 15)
  const trash = queryCreatureSummaries(summaries, { view: 'trash' })
  assert.equal(trash.length, 15)
  const bossCampaign = queryCreatureSummaries(summaries, { view: 'active', folder: 'Campaign', tag: 'boss', sortBy: 'cr' })
  assert.ok(bossCampaign.length > 0 && bossCampaign.every((s) => s.folder === 'Campaign' && s.tags.includes('boss')))
})
