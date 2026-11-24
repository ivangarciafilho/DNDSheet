import test from 'node:test'
import assert from 'node:assert/strict'
import { BASIC_RIDER_TIMINGS, formatBasicRider } from '../../src/core/domain/basic-riders.ts'

// Build 274: Hit Point riders can trigger when the creature regains hit points, beside On Damage.
test('onHeal riders print under an On Regain trigger without repeating the default timing', () => {
  assert.ok(BASIC_RIDER_TIMINGS.includes('When it regains hit points'))
  const text = formatBasicRider({ id: 'a', cadence: 'once_round', timing: 'When it regains hit points', effect: 'It glows.' }, 'onHeal')
  assert.equal(text, 'On Regain: Once per round: It glows.')
  assert.equal(formatBasicRider({ id: 'b', cadence: '', timing: 'As a Reaction', effect: 'X.' }, 'onHeal'), 'On Regain: As a Reaction: X.')
})
