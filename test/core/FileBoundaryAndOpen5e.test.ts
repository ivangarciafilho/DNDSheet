import test from 'node:test'
import assert from 'node:assert/strict'
import { composeAcAndDefenses, acTriggerEffectText } from '../../src/core/domain/ac-and-defenses.ts'
import { text2024 } from '../../src/core/domain/ability-grammar.ts'
import { buildCrBreakdownSummary } from '../../src/core/domain/cr-breakdown.ts'
import { descriptionContainersHtml, descriptionContainersText } from '../../src/core/domain/description-containers.ts'
import { verifyBuild269DefenseParity } from '../../src/core/domain/export-contract.ts'
import { inspectMonsterPayload, stripDangerousKeys } from '../../src/core/domain/file-payload-guard.ts'
import { extractMacroTokenPills } from '../../src/core/domain/macro-pill-preview.ts'
import { supportsNumericPresentation } from '../../src/core/domain/numeric-presentation.ts'
import {
  parseOpen5eActionHeader,
  parseOpen5eAttackDamage,
  parseOpen5eAttackHeader,
  parseOpen5eLegendaryCost,
} from '../../src/core/domain/open5e-parse.ts'

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
  assert.equal(inspected.warnings.length, 2)
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

test('D3.4: open5e-parse handles melee/ranged paired attacks, plus damage, recharge, and legendary cost', () => {
  const atk = parseOpen5eAttackHeader(
    'Melee or Ranged Weapon Attack: +8 to hit, reach 5 ft. or range 20/60 ft., one target.',
  )
  assert.ok(atk)
  assert.equal(atk.distance, 'BOTH')
  assert.equal(atk.kind, 'WEAPON')
  assert.equal(atk.toHit, 8)
  assert.equal(atk.reach, 5)
  assert.equal(atk.standard, 20)
  assert.equal(atk.long, 60)
  assert.equal(atk.targetWord, 'one')

  const dmg = parseOpen5eAttackDamage(
    'Hit: 12 (2d6 + 5) slashing damage plus 7 (2d6) radiant damage, and target shines.',
  )
  assert.ok(dmg)
  assert.equal(dmg.count, 2)
  assert.equal(dmg.dice, 6)
  assert.equal(dmg.modifier, 5)
  assert.equal(dmg.type, 'slashing')
  assert.equal(dmg.additionalDamage.length, 1)
  assert.equal(dmg.additionalDamage[0].type, 'radiant')

  const leg = parseOpen5eLegendaryCost('Wing Attack (Costs 2 Actions)')
  assert.deepEqual(leg, { baseName: 'Wing Attack', cost: 2 })

  const hdr = parseOpen5eActionHeader('Frost Breath (Recharge 5-6)', 'As a bonus action, exhales frost.')
  assert.equal(hdr.name, 'Frost Breath')
  assert.equal(hdr.recharge, '5-6')
  assert.equal(hdr.bonusAction, true)
})

test('D3.4b/D3.5/E1.3/E1.4: payload warnings, Build 269 parity, macro pills, and CR breakdown summary', () => {
  const poisoned = JSON.parse('{"saveVersion":11,"__proto__":{"x":1},"acConfig":{"onMiss":"knocks_prone"}}')
  const inspected = inspectMonsterPayload(poisoned, ['11'])
  assert.equal(inspected.ok, true)
  if (!inspected.ok) throw new Error('expected inspected payload')
  assert.equal(inspected.warnings.length, 3)

  const parity = verifyBuild269DefenseParity({
    AC: 10,
    stats: { STR: 12, DEX: 14, CON: 12, INT: 10, WIS: 10, CHA: 10 },
    lairCr: 15,
    proficiency: 5,
    portrait: { url: '', position: 'left', width: 200, caption: '', frameless: true },
    acConfig: { baseMode: 'natural', naturalBonus: 3, riders: [{ id: 'r1', trigger: 'hit', cadence: 'turn', timing: 'reaction', effect: 'custom', text: '+2 AC' }] },
  })
  assert.equal(parity.totalAc, 15)
  assert.equal(parity.framelessPortrait, true)
  assert.equal(parity.lairCr, 15)
  assert.ok(parity.exportTargetsCount >= 9)

  assert.deepEqual(extractMacroTokenPills('Uses {SPELL_DC} and {BAD_TOK} twice {SPELL_DC}.', ['{BAD_TOK}']), [
    { token: '{SPELL_DC}', valid: true },
    { token: '{BAD_TOK}', valid: false },
  ])

  const summary = buildCrBreakdownSummary({
    name: 'Test Drake',
    finalCr: '7',
    offensiveCr: '8',
    defensiveCr: '6',
    dpr: 52.8,
    maxAttack: '+8',
    maxDc: 16,
    avgHp: 136.4,
    ac: 16,
  })
  assert.match(summary.markdown, /Test Drake — CR 7/)
  assert.match(summary.markdown, /Offensive CR 8: DPR 52 \| Max Attack \+8 \| Save DC 16/)
  assert.match(summary.markdown, /Defensive CR 6: Avg HP 136 \| AC 16/)
})
