import test from 'node:test'
import assert from 'node:assert'
import { defaultMonster } from '../../src/core/domain/types.ts'
import {
  assertRevisionFresh,
  createDocumentSessionTracker,
  deriveDocumentProvenance,
  MONSTER_STORE_COPY_INVENTORY,
  resolveRulesPolicy,
  StaleDocumentRevisionError,
} from '../../src/core/domain/document-envelope.ts'
import { HistoryLedger } from '../../src/core/usecases/HistoryLedger.ts'

test('B1.5: same-name monsters receive distinct documentIds & stale revision proposal rejects', () => {
  const goblinA = { ...defaultMonster(), name: 'Goblin' }
  const goblinB = { ...defaultMonster(), name: 'Goblin' }

  const trackerA = createDocumentSessionTracker(goblinA)
  const trackerB = createDocumentSessionTracker(goblinB)

  assert.notStrictEqual(trackerA.getDocumentId(), trackerB.getDocumentId())
  assert.strictEqual(trackerA.getRevision(), 1)

  // Forking identity guarantees distinct id for duplicated copies
  const prevId = trackerA.getDocumentId()
  const forkedId = trackerA.forkIdentity()
  assert.notStrictEqual(forkedId, prevId)

  // Resolver/presentation patches and no-op writes never increment contentRevision
  assert.strictEqual(trackerA.recordMutation(goblinA, { resolverPatch: true }), false)
  assert.strictEqual(trackerA.recordMutation(goblinA, { presentationOnly: true }), false)
  assert.strictEqual(trackerA.recordMutation({ ...goblinA }), false)
  assert.strictEqual(trackerA.getRevision(), 1)

  // Real edit advances revision monotonically
  const edited = { ...goblinA, AC: 16 }
  assert.strictEqual(trackerA.recordMutation(edited), true)
  assert.strictEqual(trackerA.getRevision(), 2)
  assert.strictEqual(trackerA.isStale(1), true)
  assert.strictEqual(trackerA.isStale(2), false)

  // Undo/redo history transition advances revision monotonically
  assert.strictEqual(trackerA.recordMutation(goblinA, { historyTransition: true }), true)
  assert.strictEqual(trackerA.getRevision(), 3)

  assert.throws(
    () => assertRevisionFresh(1, trackerA.getRevision(), 'Auto-Tune'),
    (err: unknown) => err instanceof StaleDocumentRevisionError && err.code === 'STALE_REVISION',
  )
})

test('B1.2/B1.3/B8.1/B8.2: inventory, HistoryLedger deduplication, provenance unknown-by-default & policy resolution', () => {
  assert.ok(MONSTER_STORE_COPY_INVENTORY.some((entry) => entry.storeId === 'monster' && entry.copyMode === 'canonical'))
  assert.ok(MONSTER_STORE_COPY_INVENTORY.some((entry) => entry.storeId === 'combat' && entry.copyMode === 'encounter_snapshot'))
  assert.ok(MONSTER_STORE_COPY_INVENTORY.some((entry) => entry.storeId === 'editor' && entry.copyMode === 'presentation_only'))

  // Deduplicated consecutive snapshots (B1.3)
  const ledger = new HistoryLedger<{ ac: number }>(10)
  ledger.pushSnapshot({ ac: 14 }, 'Initial')
  ledger.pushSnapshot({ ac: 14 }, 'Duplicate')
  assert.strictEqual(ledger.getUndoCount(), 1)
  ledger.pushSnapshot({ ac: 16 }, 'Upgrade AC')
  assert.strictEqual(ledger.getUndoCount(), 2)

  // Legacy default monster without explicit rulesEdition/provenance reports 'unknown' provenance (B8.1)
  const legacy = defaultMonster()
  delete legacy.spellcasting.rulesEdition
  assert.strictEqual(deriveDocumentProvenance(legacy).ruleset, 'unknown')

  const legacyPolicy = resolveRulesPolicy(legacy, '2024')
  assert.strictEqual(legacyPolicy.provenance.ruleset, 'unknown')
  assert.strictEqual(legacyPolicy.activeRuleset, '2024')
  assert.strictEqual(legacyPolicy.metamagicOptions.find((m) => m.name === 'Twinned Spell')?.activeCost, '1')

  // Explicit 2014 vs 2024 ruleset feeds catalog costs cleanly (B8.2)
  const explicit2014 = defaultMonster()
  explicit2014.spellcasting.rulesEdition = '2014'
  const policy2014 = resolveRulesPolicy(explicit2014, '2024')
  assert.strictEqual(policy2014.provenance.ruleset, '2014')
  assert.strictEqual(policy2014.activeRuleset, '2014')
  assert.strictEqual(policy2014.metamagicOptions.find((m) => m.name === 'Twinned Spell')?.activeCost, 'Spell level')
  assert.strictEqual(policy2014.metamagicOptions.find((m) => m.name === 'Heightened Spell')?.activeCost, '3')
})
