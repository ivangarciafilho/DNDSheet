import test from 'node:test'
import assert from 'node:assert/strict'
import { importCharacter, looksLikeCharacter } from '../../src/core/domain/character-import.ts'
import { createGuardedStorage } from '../../src/core/domain/guarded-storage.ts'
import { defaultCharacterActor } from '../../src/core/domain/types.ts'
import { exportCharacterToJson } from '../../src/core/usecases/ExportStatblock.ts'

test('a character export imports back unchanged (B4.17)', () => {
  const actor = Object.assign(defaultCharacterActor(), { id: 'hero-7', name: 'Round Trip Hero', level: 7 })
  assert.deepStrictEqual(importCharacter(JSON.parse(exportCharacterToJson(actor))), JSON.parse(JSON.stringify(actor)))
})

test('monster files, junk and partial characters are told apart (B4.17)', () => {
  assert.strictEqual(looksLikeCharacter({ saveVersion: 11, class: 'Fighter', level: 1, race: 'Human', stats: { STR: 1, DEX: 1, CON: 1, INT: 1, WIS: 1, CHA: 1 } }), false)
  assert.strictEqual(importCharacter(null), null)
  assert.strictEqual(importCharacter([1, 2]), null)
  assert.strictEqual(importCharacter({ class: 'Fighter', level: 1, race: 'Human', stats: { STR: 10 } }), null)
  const partial = importCharacter({ class: 'Wizard', level: 99, race: 'Elf', stats: { STR: 0, DEX: 40, CON: 10.6, INT: 18, WIS: 12, CHA: 8 }, homebrewNote: 'kept' })!
  assert.strictEqual(partial.level, 20)
  assert.deepStrictEqual([partial.stats.STR, partial.stats.DEX, partial.stats.CON], [1, 30, 11])
  assert.ok(partial.name && partial.id, 'missing fields come from the default character')
  assert.strictEqual((partial as unknown as { homebrewNote: string }).homebrewNote, 'kept')
})

test('guarded storage reports failed writes, at most once per quiet period (B5.8)', () => {
  let clock = 0
  const failures: string[] = []
  const quota = { getItem: () => 'x', setItem: () => { throw new DOMException('full', 'QuotaExceededError') } }
  const storage = createGuardedStorage(() => quota, (_e, key) => failures.push(key), 1000, () => clock)
  storage.setItem('app.monster', '{}'); storage.setItem('app.monster', '{}')
  assert.deepStrictEqual(failures, ['app.monster'])
  clock = 1500; storage.setItem('app.editor', '{}')
  assert.deepStrictEqual(failures, ['app.monster', 'app.editor'])
  assert.strictEqual(storage.getItem('k'), 'x')
})

test('guarded storage survives a blocked or missing backend (B5.8)', () => {
  const failures: unknown[] = []
  const blocked = createGuardedStorage(() => { throw new Error('SecurityError') }, (e) => failures.push(e))
  assert.strictEqual(blocked.getItem('app.monster'), null)
  blocked.setItem('app.monster', '{}')
  assert.strictEqual(failures.length, 1)
  const missing = createGuardedStorage(() => undefined, (e) => failures.push(e))
  assert.strictEqual(missing.getItem('k'), null)
  missing.setItem('k', 'v')
  assert.strictEqual(failures.length, 2)
  const map = new Map<string, string>()
  const ok = createGuardedStorage(() => ({ getItem: (k) => map.get(k) ?? null, setItem: (k, v) => void map.set(k, v) }), () => assert.fail('no failure expected'))
  ok.setItem('a', '1'); assert.strictEqual(ok.getItem('a'), '1')
})
