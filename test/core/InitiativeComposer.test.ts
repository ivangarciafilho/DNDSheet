import test from 'node:test'
import assert from 'node:assert/strict'
import {
  formatInitiativeRider,
  formatInitiativeRiders,
  type ComposableInitiativeRider,
} from '../../src/core/domain/initiative-composer.ts'

test('Initiative Composer: formats target creature type riders with advantage or disadvantage', () => {
  const rider1: ComposableInitiativeRider = {
    targetCreatureTypes: ['Fiends', 'Undead'],
    targetRollEffect: 'disadvantage',
  }
  assert.equal(formatInitiativeRider(rider1), 'Fiends and Undead have Disadvantage on Initiative Roll')

  const rider2: ComposableInitiativeRider = {
    targetCreatureTypes: ['Celestials'],
    targetRollEffect: 'advantage',
  }
  assert.equal(formatInitiativeRider(rider2), 'Celestials have Advantage on Initiative Roll')
})

test('Initiative Composer: formats roll pre-condition combined with actions', () => {
  // <<At> <Disadvantage>>, <Cast> <Spell>
  const castSpellRider: ComposableInitiativeRider = {
    advMode: 'at_disadvantage',
    actionType: 'cast_spell',
    spellName: 'Thaumaturgy',
  }
  assert.equal(formatInitiativeRider(castSpellRider), 'At Disadvantage, Cast Thaumaturgy')

  // <<At> <Disadvantage>>, <Hide>
  const hideRider: ComposableInitiativeRider = {
    advMode: 'at_disadvantage',
    actionType: 'hide',
  }
  assert.equal(formatInitiativeRider(hideRider), 'At Disadvantage, Hide')

  // <<At> <Disadvantage>>, <Influence>
  const influenceRider: ComposableInitiativeRider = {
    advMode: 'at_disadvantage',
    actionType: 'influence',
  }
  assert.equal(formatInitiativeRider(influenceRider), 'At Disadvantage, Influence')

  // <<Choose> <Disadvantage>>
  const chooseDisadvRider: ComposableInitiativeRider = {
    advMode: 'choose_disadvantage',
  }
  assert.equal(formatInitiativeRider(chooseDisadvRider), 'Choose Disadvantage')

  // <<At> <Advantage>>
  const atAdvRider: ComposableInitiativeRider = {
    advMode: 'at_advantage',
    actionType: 'gain_temp_hp',
    hpAmount: 20,
  }
  assert.equal(formatInitiativeRider(atAdvRider), 'At Advantage, Gains 20 Temporary Hit Points')
})

test('Initiative Composer: formats HP and Temporary HP riders cleanly distinct', () => {
  // <Regains> <<X> <Hit Points>>
  const regainHpRider: ComposableInitiativeRider = {
    actionType: 'regain_hp',
    hpAmount: 15,
  }
  assert.equal(formatInitiativeRider(regainHpRider), 'Regains 15 Hit Points')

  // <Gains> <<X> <Temporary Hit Points>>
  const tempHpRider: ComposableInitiativeRider = {
    actionType: 'gain_temp_hp',
    hpAmount: 20,
  }
  assert.equal(formatInitiativeRider(tempHpRider), 'Gains 20 Temporary Hit Points')
})

test('Initiative Composer: formats movement riders', () => {
  // <Move> <up to> <your speed>
  const speedRider: ComposableInitiativeRider = {
    actionType: 'move_speed',
  }
  assert.equal(formatInitiativeRider(speedRider), 'Move up to your speed')

  // <Move> <10ft>
  const distRider: ComposableInitiativeRider = {
    actionType: 'move_distance',
    moveDistance: '10ft',
  }
  assert.equal(formatInitiativeRider(distRider), 'Move 10ft')
})

test('Initiative Composer: formatInitiativeRiders batches and filters empty clauses', () => {
  const riders: ComposableInitiativeRider[] = [
    { targetCreatureTypes: ['Fiends', 'Undead'], targetRollEffect: 'disadvantage' },
    { advMode: 'at_disadvantage', actionType: 'cast_spell', spellName: 'Sanctuary' },
    { actionType: 'gain_temp_hp', hpAmount: 10 },
  ]
  const formatted = formatInitiativeRiders(riders)
  assert.deepEqual(formatted, [
    'Fiends and Undead have Disadvantage on Initiative Roll',
    'At Disadvantage, Cast Sanctuary',
    'Gains 10 Temporary Hit Points',
  ])
})
