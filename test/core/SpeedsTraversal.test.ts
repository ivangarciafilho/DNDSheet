import test from 'node:test'
import assert from 'node:assert'
import {
  SPEED_ACTION_RIDER_PRESETS,
  formatSpeedActionRider,
  composeSpeedWithRiders,
  type SpeedActionRider,
} from '../../src/core/domain/speeds-traversal.ts'

test('SpeedsTraversal - Formats Dash can Shove as a Bonus Action', () => {
  const rider: SpeedActionRider = {
    id: '1',
    action: 'Dash',
    actionType: 'Bonus Action',
    rider: 'can Shove as a Bonus Action',
  }
  const formatted = formatSpeedActionRider(rider)
  assert.strictEqual(formatted, 'Dash can Shove as a Bonus Action')
  assert.strictEqual(composeSpeedWithRiders('30 ft.', [rider]), '30 ft., Dash can Shove as a Bonus Action')
})

test('SpeedsTraversal - Formats Dash or Disengage Teleport rider', () => {
  const rider: SpeedActionRider = {
    id: '2',
    action: 'Dash or Disengage',
    actionType: 'Bonus Action',
    rider: 'Teleport as a Bonus Action up to 10ft of a point you can see / familiar to you',
  }
  const formatted = formatSpeedActionRider(rider)
  assert.strictEqual(
    formatted,
    'Dash or Disengage: Teleport as a Bonus Action up to 10ft of a point you can see / familiar to you'
  )
  assert.strictEqual(
    composeSpeedWithRiders('10 ft.', [rider]),
    '10 ft., Dash or Disengage: Teleport as a Bonus Action up to 10ft of a point you can see / familiar to you'
  )
})

test('SpeedsTraversal - Formats 5ft Damage Aura (1d8 Fire)', () => {
  const rider: SpeedActionRider = {
    id: '3',
    action: 'Dash or Disengage',
    rider: 'Creatures 5ft of you take 1d8 fire damage',
  }
  const formatted = formatSpeedActionRider(rider)
  assert.strictEqual(formatted, 'Dash or Disengage: Creatures 5ft of you take 1d8 fire damage')
  assert.strictEqual(
    composeSpeedWithRiders('10 ft.', [rider]),
    '10 ft., Dash or Disengage: Creatures 5ft of you take 1d8 fire damage'
  )
})

test('SpeedsTraversal - Formats Once per round creature entering/leaving triggers', () => {
  const enterRider: SpeedActionRider = {
    id: '4',
    action: 'Once per round',
    rider: 'when a creature enters 5ft of you, it takes 1d10 fire damage',
  }
  assert.strictEqual(
    formatSpeedActionRider(enterRider),
    'Once per round: when a creature enters 5ft of you, it takes 1d10 fire damage'
  )

  const leaveRider: SpeedActionRider = {
    id: '5',
    action: 'Once per round per creature',
    rider: 'when a creature leaves 5ft of you, it takes 1d10 fire damage',
  }
  assert.strictEqual(
    formatSpeedActionRider(leaveRider),
    'Once per round per creature: when a creature leaves 5ft of you, it takes 1d10 fire damage'
  )
})

test('SpeedsTraversal - Formats Teleport to visited point and Ethereal shift', () => {
  const teleportRider: SpeedActionRider = {
    id: '6',
    action: 'General',
    rider: 'Teleport to a point visited this turn',
  }
  assert.strictEqual(formatSpeedActionRider(teleportRider), 'Teleport to a point visited this turn')

  const etherealRider: SpeedActionRider = {
    id: '7',
    action: 'Disengage',
    rider: 'shift to the Ethereal Plane',
  }
  assert.strictEqual(formatSpeedActionRider(etherealRider), 'Disengage, shift to the Ethereal Plane')

  const hideRider: SpeedActionRider = {
    id: '8',
    action: 'Dodge or Disengage',
    rider: 'can Hide as a Bonus Action',
  }
  assert.strictEqual(formatSpeedActionRider(hideRider), 'Dodge or Disengage, can Hide as a Bonus Action')
})

test('SpeedsTraversal - Formats New Movement Action Riders (Temp HP, Obscured, Adv Saves, Teleports)', () => {
  const tempHpRider: SpeedActionRider = {
    id: 'thp',
    action: 'Disengage',
    rider: 'Gain 10 of Temporary Hit Points',
  }
  assert.strictEqual(formatSpeedActionRider(tempHpRider), 'Disengage: Gain 10 of Temporary Hit Points')

  const obscuredRider: SpeedActionRider = {
    id: 'obs',
    action: 'Dodge',
    rider: 'Creatures 5ft of you are lightly obscured',
  }
  assert.strictEqual(formatSpeedActionRider(obscuredRider), 'Dodge: Creatures 5ft of you are lightly obscured')

  const advSavesRider: SpeedActionRider = {
    id: 'adv',
    action: 'Dash',
    rider: 'Until End Of Turn: Advantage on Strength, and Dexterity Saving Throws',
  }
  assert.strictEqual(
    formatSpeedActionRider(advSavesRider),
    'Dash: Until End Of Turn: Advantage on Strength, and Dexterity Saving Throws'
  )

  const teleportVisitedRider: SpeedActionRider = {
    id: 'tpv',
    action: 'Dash, Disengage',
    rider: 'At end of turn: Teleports to unoccupied space visited this turn',
  }
  assert.strictEqual(
    formatSpeedActionRider(teleportVisitedRider),
    'Dash, Disengage: At end of turn: Teleports to unoccupied space visited this turn'
  )
})

test('SpeedsTraversal - All 15 Presets are Defined and Non-Empty', () => {
  assert.strictEqual(SPEED_ACTION_RIDER_PRESETS.length >= 15, true)
  for (const preset of SPEED_ACTION_RIDER_PRESETS) {
    assert.ok(preset.id)
    assert.ok(preset.action)
    assert.ok(preset.rider)
    const formatted = formatSpeedActionRider(preset)
    assert.ok(formatted.length > 0)
  }
})
