import test from 'node:test'
import assert from 'node:assert/strict'
import { composeAcAndDefenses, acTriggerEffectText } from '../../src/core/domain/ac-and-defenses.ts'
import { text2024 } from '../../src/core/domain/ability-grammar.ts'
import { descriptionContainersHtml, descriptionContainersText } from '../../src/core/domain/description-containers.ts'
import { inspectMonsterPayload, stripDangerousKeys } from '../../src/core/domain/file-payload-guard.ts'
import { supportsNumericPresentation } from '../../src/core/domain/numeric-presentation.ts'

test('D3.3: file payload guard rejects primitives, strips prototype pollution keys, and handles numeric saveVersion', () => {
  assert.deepEqual(inspectMonsterPayload(null, ['11']), { ok: false, reason: 'not_object' })
  assert.deepEqual(inspectMonsterPayload([1, 2], ['11']), { ok: false, reason: 'not_object' })
  assert.deepEqual(inspectMonsterPayload({ name: 'NoVer' }, ['11']), { ok: false, reason: 'missing_version' })
  assert.deepEqual(inspectMonsterPayload({ saveVersion: 99 }, ['10', '11']), {
    ok: false,
    reason: 'unknown_version',
    saveVersion: '99',
  })

  const poisoned = JSON.parse('{"saveVersion":11,"name":"Guarded","__proto__":{"polluted":true},"constructor":{"bad":1},"prototype":{"bad":2}}')
  const inspected = inspectMonsterPayload(poisoned, ['10', '11'])
  assert.equal(inspected.ok, true)
  if (!inspected.ok) throw new Error('expected valid payload')
  assert.equal(inspected.saveVersion, '11')
  assert.equal(inspected.warnings.length, 1)
  assert.equal(Object.hasOwn(inspected.record, '__proto__'), false)
  assert.equal(Object.hasOwn(inspected.record, 'constructor'), false)
  assert.equal(Object.hasOwn(inspected.record, 'prototype'), false)
  assert.equal(stripDangerousKeys('not-an-object'), null)
})

test('D3.2: Build 269/270 AC natural base, AC riders, and longDistance presentation hold invariants', () => {
  assert.equal(supportsNumericPresentation('actions[id=a1].targeting.range.longDistance'), true)

  const composed = composeAcAndDefenses({
    AC: 10,
    stats: { STR: 10, DEX: 16, CON: 14, INT: 10, WIS: 12, CHA: 8 },
    acConfig: {
      baseMode: 'natural',
      naturalBonus: 4,
      riders: [
        { id: 'r1', trigger: 'hit', cadence: 'turn', timing: 'reaction', effect: 'retaliate_melee' },
        { id: 'r2', trigger: 'miss', cadence: 'round', effect: 'custom', text: 'shifts 5 ft.' },
      ],
    },
  })
  assert.equal(composed.totalAc, 17, '10 + DEX (+3) + naturalBonus (4)')
  assert.match(composed.fullText, /natural armor/i)
  assert.match(composed.fullText, /Melee Attack/i)
  assert.match(composed.fullText, /On Miss: shifts 5 ft\./i)
  assert.equal(acTriggerEffectText('hit', 'custom', { text: 'gains +2 AC' }), 'On Hit: gains +2 AC')
})

test('D3.1/C12.R4: structured abilities place outcome clauses before containers and trailing prose safely', () => {
  const prose = text2024({
    name: 'Spark Bolt',
    stat: 'DEX',
    description: 'Trailing prose.',
    outcomes: [{ id: 'f', trigger: 'fail', effects: [{ kind: 'damage', formula: '2d6', damageType: 'lightning' }] }],
    descriptionContainers: [{ id: 'c', kind: 'text', outcomeTarget: 'Surge', text: 'Arc jumps.' }],
  })
  assert.ok(prose.indexOf('2d6') < prose.indexOf('Arc jumps.'))
  assert.ok(prose.indexOf('Arc jumps.') < prose.indexOf('Trailing prose.'))
  assert.match(descriptionContainersHtml([{ id: 'c', kind: 'text', outcomeTarget: 'Surge', text: '<b>Arc</b> <x>' }]), /<b>Arc<\/b> &lt;x&gt;/)
  assert.match(descriptionContainersText([{ id: 'c', kind: 'text', outcomeTarget: 'Surge', text: 'Arc.' }]), /Surge: Arc\./)
})
