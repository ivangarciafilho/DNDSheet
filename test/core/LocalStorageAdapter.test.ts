import test from 'node:test'
import assert from 'node:assert'
import {
  LocalStorageAdapter,
  MemoryStorageBackend,
} from '../../src/core/adapters/LocalStorageAdapter.ts'
import { migrateMonsterSchema } from '../../src/core/usecases/MigrateMonsterSchema.ts'

test('LocalStorageAdapter - CRUD operations', async () => {
  const backend = new MemoryStorageBackend()
  const adapter = new LocalStorageAdapter('test_monster_', backend)

  const monster1 = migrateMonsterSchema({
    id: 'm-1',
    name: 'Goblin Sneak',
    saveVersion: 11,
    CR: 1, // CR 1/8
    size: 'Small',
    type: 'humanoid (goblinoid)',
    alignment: 'neutral evil',
  })

  const monster2 = migrateMonsterSchema({
    id: 'm-2',
    name: 'Bugbear Stalker',
    saveVersion: 11,
    CR: 4, // CR 1
    size: 'Medium',
    type: 'humanoid (goblinoid)',
    alignment: 'chaotic evil',
  })

  // Save monsters
  await adapter.saveMonster(monster1)
  await adapter.saveMonster(monster2)

  // List summaries
  const summaries = await adapter.listMonsters()
  assert.strictEqual(summaries.length, 2)
  assert.strictEqual(summaries.some((s) => s.id === 'm-1' && s.name === 'Goblin Sneak'), true)
  assert.strictEqual(summaries.some((s) => s.id === 'm-2' && s.name === 'Bugbear Stalker'), true)

  // Retrieve single monster
  const retrieved = await adapter.getMonster('m-1')
  assert.ok(retrieved != null)
  assert.strictEqual(retrieved?.name, 'Goblin Sneak')
  assert.strictEqual(retrieved?.saveVersion, 11)

  // Delete a monster
  await adapter.deleteMonster('m-1')
  const afterDelete = await adapter.getMonster('m-1')
  assert.strictEqual(afterDelete, null)

  const updatedSummaries = await adapter.listMonsters()
  assert.strictEqual(updatedSummaries.length, 1)
  assert.strictEqual(updatedSummaries[0].id, 'm-2')
})

test('LocalStorageAdapter - Bulk Export and Import', async () => {
  const backend = new MemoryStorageBackend()
  const adapter = new LocalStorageAdapter('test_monster_', backend)

  const initialList = [
    migrateMonsterSchema({ id: 'exp-1', name: 'Alpha Wolf', saveVersion: 11, CR: 2 }),
    migrateMonsterSchema({ id: 'exp-2', name: 'Dire Bear', saveVersion: 11, CR: 5 }),
  ]

  for (const m of initialList) {
    await adapter.saveMonster(m)
  }

  // Export all
  const exportedJson = await adapter.exportAll()
  assert.ok(exportedJson.length > 50)
  const parsed = JSON.parse(exportedJson)
  assert.strictEqual(parsed.length, 2)

  // Create another adapter instance and import
  const backend2 = new MemoryStorageBackend()
  const adapter2 = new LocalStorageAdapter('test_monster_', backend2)

  const importedCount = await adapter2.importAll(exportedJson)
  assert.strictEqual(importedCount, 2)

  const importedSummaries = await adapter2.listMonsters()
  assert.strictEqual(importedSummaries.length, 2)

  // Clear all
  await adapter2.clearAll()
  const clearedSummaries = await adapter2.listMonsters()
  assert.strictEqual(clearedSummaries.length, 0)
})
