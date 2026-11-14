import test from 'node:test'
import assert from 'node:assert/strict'
import { lintMonster, autoFixMonster } from '../../src/core/usecases/LintMonster.ts'
import {
  LINT_TARGET_REGISTRY,
  applyCheckSessionRepairs,
  createCheckSession,
  evaluateExportPolicy,
  markCheckSessionStale,
  resolveLintTarget,
} from '../../src/core/domain/check-session.ts'
import {
  applyAutoTuneSession,
  createAutoTuneSession,
  generateAutoTunePlan,
  markAutoTuneSessionStale,
} from '../../src/core/usecases/AutoTuneCr.ts'
import { StaleDocumentRevisionError } from '../../src/core/domain/document-envelope.ts'
import { defaultMonster } from '../../src/core/domain/types.ts'

test('Track A lint families catch broken bindings, over-limit prepared spells, unresolved macros, and dangling random tables (B2.1)', () => {
  const m = defaultMonster()
  m.stats.INT = 12 // +1 mod
  m.bindings = {
    AC: { mode: 'formula', expr: '10 + DEX_MOD + UNKNOWN_REF' },
  }
  m.randomTables = [{ id: 'tbl-valid', title: 'Valid Table', dice: '1d4', rows: [] }]
  m.description = 'Unlocks {TOTALLY_UNKNOWN_MACRO}.'
  m.spellcasting = {
    ...m.spellcasting,
    enabled: true,
    class: 'Wizard',
    level: 2, // prepared budget = 2 + 1 = 3 (+ 3 cantrips = 6 when no catalog)
    slots: [3, 0, 0, 0, 0, 0, 0, 0, 0],
    standard: ['Shield', 'Magic Missile', 'Mage Armor', 'Grease', 'Identify', 'Detect Magic', 'Sleep'],
    atWill: [],
  }
  m.actions.push({
    id: 'act-1',
    name: 'Chaos Burst',
    description: 'Roll once.',
    outcomes: [
      {
        id: 'out-1',
        label: 'Hit',
        containers: [
          {
            id: 'cnt-1',
            kind: 'random_table',
            randomTableId: 'tbl-missing',
            outcomeTarget: 'Target',
            text: 'Fallback chaos text',
          },
        ],
      },
    ],
  })

  const issues = lintMonster(m)
  const codes = new Set(issues.map((i) => i.code))
  assert.ok(codes.has('BROKEN_BINDING'), 'detects BROKEN_BINDING')
  assert.ok(codes.has('PREPARED_OVER_LIMIT'), 'detects PREPARED_OVER_LIMIT')
  assert.ok(codes.has('UNKNOWN_MACRO'), 'detects UNKNOWN_MACRO')
  assert.ok(codes.has('DANGLING_RANDOM_TABLE_REF'), 'detects DANGLING_RANDOM_TABLE_REF')

  // Safe autoFix repairs dangling random table refs while preserving prose fallback
  const fixed = autoFixMonster(m)
  assert.ok(fixed.fixedCount >= 1)
  const after = lintMonster(fixed.monster)
  assert.ok(!after.some((i) => i.code === 'DANGLING_RANDOM_TABLE_REF'))
  assert.strictEqual(fixed.monster.actions[fixed.monster.actions.length - 1]?.outcomes?.[0]?.containers?.[0]?.kind, 'text')
  assert.strictEqual(fixed.monster.actions[fixed.monster.actions.length - 1]?.outcomes?.[0]?.containers?.[0]?.text, 'Fallback chaos text')
})

test('LINT_TARGET_REGISTRY resolves paths to editor sections and CheckSession enforces stale revision guards & export gate (B2.2-B2.5)', () => {
  assert.ok(LINT_TARGET_REGISTRY.length >= 10)
  const m = defaultMonster()
  m.multiattacks = [{ id: 'ma-bad', attacks: ['ghost-atk'], actions: [] }]
  const session = createCheckSession(m, {}, 4)
  assert.strictEqual(session.status, 'current')
  assert.ok(session.blockingErrors.length >= 1)
  assert.ok((session.repairPlan?.fixedCount || 0) >= 1)

  const target = resolveLintTarget(session.blockingErrors[0])
  assert.strictEqual(target.sectionKey, 'actions')
  assert.strictEqual(target.sectionSelector, '[data-editor-section="actions"]')

  const policyBlocked = evaluateExportPolicy(m, {}, { allowBlockingIssues: false })
  assert.strictEqual(policyBlocked.allowed, false)
  assert.strictEqual(policyBlocked.requiresOverride, true)
  const policyAllowed = evaluateExportPolicy(m, {}, { allowBlockingIssues: true })
  assert.strictEqual(policyAllowed.allowed, true)

  const stale = markCheckSessionStale(session, 5)
  assert.strictEqual(stale.status, 'stale')
  assert.throws(() => applyCheckSessionRepairs(session, 5, () => 6), StaleDocumentRevisionError)

  const repairedRes = applyCheckSessionRepairs(session, 4, (repaired) => {
    const nextSession = createCheckSession(repaired, {}, 5, { lastRepairedRevision: 5 })
    assert.strictEqual(nextSession.status, 'repaired')
    const partialSession = createCheckSession(
      { ...repaired, traits: [{ id: 'tr-u', name: 'Bad', description: '{{UNKNOWN_UNIT_MACRO}}' }] },
      {},
      5,
      { lastRepairedRevision: 5 }
    )
    assert.strictEqual(partialSession.status, 'repaired')
    assert.ok(partialSession.issues.some((i) => i.code === 'UNKNOWN_MACRO'))
    return 5
  })
  assert.strictEqual(repairedRes.nextRevision, 5)
})

test('AutoTuneCr performs source-first binding-aware tuning, supports partial selection, and rejects stale revisions (B3.2-B3.5)', () => {
  const m = defaultMonster()
  m.AC = 12
  m.stats.DEX = 14 // +2
  m.stats.STR = 12 // +1
  m.bindings = {
    AC: { mode: 'formula', expr: '10 + DEX_MOD' },
  }
  m.attacks = [
    {
      id: 'atk-1',
      name: 'Claw',
      distance: 'Melee',
      kind: 'Weapon',
      modifier: { override: false, overrideValue: 0, stat: 'STR', proficient: true },
      range: { standard: 0, long: 0, reach: 5 },
      targets: 1,
      damage: { dice: 6, count: 1, modifier: { override: false, overrideValue: 0, stat: 'STR' }, type: 'slashing' },
      additionalDamage: [],
      save: 0,
      description: '',
      legendaryOnly: false,
    },
  ]

  const session = createAutoTuneSession(m, '5', 7)
  // Because AC is formula-bound to DEX_MOD, source-first proposes stats.DEX rather than directly overwriting AC
  const dexRec = session.plan.recommendations.find((r) => r.id === 'stats.DEX')
  assert.ok(dexRec, 'proposes stats.DEX to drive bound AC')
  assert.strictEqual(dexRec?.sourceBacked, true)
  assert.strictEqual(dexRec?.boundPath, 'AC')

  // Partial selection: only tune HP.HD, leave STR and AC untouched
  const partial = generateAutoTunePlan(m, '5', { selectedIds: ['HP.HD'] })
  assert.ok(partial.tunedMonster.HP.HD !== m.HP.HD)
  assert.strictEqual(partial.tunedMonster.stats.STR, m.stats.STR)

  const stale = markAutoTuneSessionStale(session, 8)
  assert.strictEqual(stale.stale, true)
  assert.throws(() => applyAutoTuneSession(session, 8, () => 9), StaleDocumentRevisionError)
})
