import test from 'node:test'
import assert from 'node:assert/strict'
import { inspectNumericField } from '../../src/core/domain/catalogs/field-inspection.ts'

test('inspection respects enabled overrides without changing saved values', () => {
  const model = { saves: { STR: { override: false, overrideValue: 4 } } }
  const before = JSON.stringify(model)
  assert.equal(inspectNumericField(model, 'saves.STR.overrideValue').editable, false)
  model.saves.STR.override = true
  assert.equal(inspectNumericField(model, 'saves.STR.overrideValue').editable, true)
  model.saves.STR.override = false
  assert.equal(JSON.stringify(model), before)
})

test('inspection fails closed for unsupported or ambiguous targets', () => {
  assert.throws(() => inspectNumericField({}, 'CR'), /unsupported/i)
  assert.throws(() => inspectNumericField({ speeds: [{ id: 'x', speed: 10 }, { id: 'x', speed: 20 }] }, 'speeds[id=x].speed'), /ambiguous/i)
})

test('optional numeric leaves require an existing owner and never invoke accessors', () => {
  const model = { speeds: [{ id: 'x', speed: 30 }] }
  assert.equal(inspectNumericField(model, 'speeds[id=x].speed').value, 30)
  assert.throws(() => inspectNumericField({ speeds: [] }, 'speeds[id=x].speed'), /missing/i)
  const hostile = Object.defineProperty({}, 'AC', { get() { throw new Error('Invoked accessor') } })
  assert.throws(() => inspectNumericField(hostile, 'AC'), /accessor/i)
})

test('literal fallback modes and pool enabling controls remain editable', () => {
  for (const source of [undefined, 'none', 'flat']) {
    const model = { extendedHp: { damageThreshold: 2, damageThresholdSource: source, damageReduction: 3, damageReductionSource: source } }
    assert.equal(inspectNumericField(model, 'extendedHp.damageThreshold').editable, true)
    assert.equal(inspectNumericField(model, 'extendedHp.damageReduction').editable, true)
  }
  assert.equal(inspectNumericField({ extendedHp: { regeneration: { enabled: true, amount: 2 } } }, 'extendedHp.regeneration.amount').editable, true)
  assert.equal(inspectNumericField({ paragonConfig: { enabled: false, poolCount: 1 } }, 'paragonConfig.poolCount').editable, true)
})

test('symbolic authorship requires explicit migration rather than scalar overwrite', () => {
  for (const count of ['all', 'PB + 1']) {
    const result = inspectNumericField({ actions: [{ id: 'a', targeting: { count } }] }, 'actions[id=a].targeting.count')
    assert.equal(result.editable, false)
    assert.match(result.blockedRepresentation ?? '', /symbolic/i)
  }
  assert.equal(inspectNumericField({ acConfig: { saveDc: 'SPELL_DC' } }, 'acConfig.saveDc').editable, false)
})

test('AC modes admit only the currently authored scalar owner', () => {
  const check = (config: Record<string, unknown>, leaf: string) => inspectNumericField({ acConfig: config }, `acConfig.${leaf}`).editable
  assert.equal(check({ conditionMode: 'attacker_save', saveDcSource: 'custom', saveDc: 15 }, 'saveDc'), true)
  assert.equal(check({ conditionMode: 'attacker_save', saveDcSource: 'spell_save_dc', saveDc: 15 }, 'saveDc'), false)
  assert.equal(check({ conditionMode: 'attacker_save', saveDcSource: 'custom', saveDcCustom: 18, saveDc: 15 }, 'saveDc'), false)
  assert.equal(check({ conditional: 'first_y_attacks', conditionalCount: 2 }, 'conditionalCount'), true)
  assert.equal(check({ conditional: 'none', conditionalCount: 2 }, 'conditionalCount'), false)
  assert.equal(check({ conditionMode: 'while_bloodied', secondaryAc: 12 }, 'secondaryAc'), true)
  assert.equal(check({ conditionMode: 'none', secondaryAc: 12 }, 'secondaryAc'), false)
  assert.equal(check({ conditionMode: 'attacker_save', onSaveSuccess: 'takes_damage', onSaveSuccessDamageAmount: 5 }, 'onSaveSuccessDamageAmount'), true)
  assert.equal(check({ conditionMode: 'none', onSaveSuccess: 'takes_damage', onSaveSuccessDamageAmount: 5 }, 'onSaveSuccessDamageAmount'), false)
})

test('death prevention preserves OR branches and parent visibility defaults', () => {
  const check = (config: Record<string, unknown>, leaf: string) => inspectNumericField({ extendedHp: { deathPrevention: config } }, `extendedHp.deathPrevention.${leaf}`).editable
  const base = { enabled: true, name: 'Immortal', saveDc: 15, deathBurstRange: 30, returnHpValue: 1, returnHpSource: 'flat' }
  assert.equal(check({ ...base, dcRule: 'custom_save' }, 'saveDc'), true)
  assert.equal(check({ ...base, requiresSave: true }, 'saveDc'), true)
  assert.equal(check({ ...base, requiresSave: false }, 'saveDc'), false)
  assert.equal(check({ ...base, requiresSave: true, hideHp: true }, 'saveDc'), false)
  assert.equal(check({ ...base, requiresSave: true, dcRule: 'until_x_crits' }, 'saveDc'), false)
  assert.equal(check({ ...base, dcRule: 'upon_death_burst' }, 'deathBurstRange'), true)
  assert.equal(check({ ...base, uponDeathDealsDamage: true }, 'deathBurstRange'), true)
  assert.equal(check({ ...base, name: 'Mortal', uponDeathDealsDamage: true }, 'deathBurstRange'), false)
  assert.equal(check(base, 'returnHpValue'), true)
  assert.equal(check({ ...base, hideHp: true }, 'returnHpValue'), false)
})
