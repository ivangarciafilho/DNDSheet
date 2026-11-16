import test from 'node:test'
import assert from 'node:assert/strict'
import { composeAcAndDefenses } from '../../src/core/domain/ac-and-defenses.ts'

const base = { AC: 15, stats: { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 } }

test('Build 269: a legacy On Miss pick and the same AC rider print the same AC line', () => {
  const legacy = composeAcAndDefenses({ ...base, acConfig: { onMiss: 'knocks_prone' } } as never)
  const rider = composeAcAndDefenses({ ...base, acConfig: { riders: [{ id: 'r', trigger: 'miss', effect: 'knocks_prone' }] } } as never)
  assert.equal(rider.fullText, legacy.fullText)
})

test('Build 269: several AC riders compose with their own cadence and timing, custom text included', () => {
  const result = composeAcAndDefenses({
    ...base,
    acConfig: {
      riders: [
        { id: 'a', trigger: 'hit', effect: 'damage_attacker', damageAmount: '7 (2d6)', damageType: 'Cold', cadence: 'once_per_turn' },
        { id: 'b', trigger: 'miss', effect: 'custom', text: 'the attacker is Blinded until the end of its turn', timing: 'As a Reaction' },
      ],
    },
  } as never)
  assert.match(result.fullText, /On Hit: Attacker takes 7 \(2d6\) of Cold/)
  assert.match(result.fullText, /As a Reaction: On Miss: the attacker is Blinded/)
})

test('Build 269: a rider with no effect prints nothing', () => {
  const result = composeAcAndDefenses({ ...base, acConfig: { riders: [{ id: 'x', trigger: 'hit', effect: 'custom', text: '  ' }] } } as never)
  assert.equal(result.fullText, '15')
})
