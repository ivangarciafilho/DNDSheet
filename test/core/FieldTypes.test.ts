import assert from 'node:assert/strict'
import test from 'node:test'
import { lookupNumericField, validateNumericFieldValue, validateNumericFieldDiceValue, isReferenceAllowedForField } from '../../src/core/domain/catalogs/field-types.ts'

test('registry exposes only canonical checkpoint paths', () => {
  for (const ability of ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA']) {
    assert.equal(lookupNumericField(`stats.${ability}`)?.type, 'integer')
    assert.equal(lookupNumericField(`saves.${ability}.overrideValue`)?.style, 'bonus')
  }
  for (const path of ['proficiency', 'AC', 'HP.HD', 'HP.type', 'HP.modifier', 'spellcasting.level', 'spellcasting.save.overrideValue', 'spellcasting.attack.overrideValue', 'passivePerception.overrideValue']) assert.ok(lookupNumericField(path), path)
  for (const path of ['CR', 'stats.str', 'stats.__proto__', 'constructor', 'HP', 'AC.x']) assert.equal(lookupNumericField(path), undefined)
})

test('stable collection families and nested identities are covered', () => {
  for (const path of ['speeds[id=walk].speed', 'skills[key=PERCEPTION].overrideValue', 'tools[id=a].overrideValue', 'sensesList[id=s].observationMinutes', 'languagesList[id=l].probeSaveDc', 'attacks[id=a].additionalDamage[id=x%2Fy].count', 'attacks[id=a].alternateDamage.modifier.overrideValue', 'actions[id=a].targeting.area.distance', 'traits[id=t].rechargeCount', 'reactions[id=r].limitedUse.count', 'lairActions[id=l].crAnnotation.maxSave', 'spellcasting.classes[id=c].level', 'spellcasting.atWill[id=s].count', 'anatomyParts[id=p].hp', 'reactiveActions[id=r].usesPerRound', 'villainActions[id=v].round', 'runehammerTrack.events[id=e].round']) assert.ok(lookupNumericField(path), path)
  for (const path of ['speeds[0].speed', 'speeds[id=].speed', 'speeds[id=%61].speed', 'actions[id=a].outcomes[id=x].effects[id=y].formula', 'legendaryActions.actions[id=a].cost', 'paragonConfig.phaseConfigs[id=p].override', 'actions[id=a].stagePool', 'portrait.width', 'runehammerTrack.currentCount', 'CR', 'lairCr', 'traits[id=t].crAnnotation.ehpMultiplier']) assert.equal(lookupNumericField(path), undefined, path)
})

test('descriptors carry instantiated gates, units and literal table policy', () => {
  assert.deepEqual(lookupNumericField('attacks[id=a].modifier.overrideValue')?.editableWhen, [{ path: 'attacks[id=a].modifier.override', equals: true }])
  assert.equal(lookupNumericField('attacks[id=a].range.long')?.unit, 'ft')
  assert.equal(lookupNumericField('sensesList[id=s].range')?.unit, 'record.rangeUnit')
  assert.equal(lookupNumericField('spellcasting.slots[level=1]')?.bindingPolicy, 'literal-table')
  assert.equal(isReferenceAllowedForField('spellcasting.slots[level=1]', 'PB'), false)
  assert.equal(isReferenceAllowedForField('stats.INT', 'SPELL_DC'), false)
  assert.throws(() => validateNumericFieldValue('HP.HD', Number.MAX_SAFE_INTEGER + 1))
  assert.throws(() => validateNumericFieldDiceValue('HP.HD', { flat: 0, dice: [{ count: 1, die: 6 }] }))
  assert.doesNotThrow(() => validateNumericFieldDiceValue('HP.HD', { flat: 5, dice: [] }))
})

test('editor constraints are enforced without invented bonus caps', () => {
  for (const [path, value] of [['stats.STR', 1], ['stats.STR', 30], ['proficiency', 0], ['AC', 0], ['HP.HD', 1], ['spellcasting.level', 1], ['spellcasting.level', 20], ['HP.modifier', -999], ['saves.STR.overrideValue', -99], ['spellcasting.attack.overrideValue', -8], ['spellcasting.save.overrideValue', -1], ['passivePerception.overrideValue', -1]] as const) assert.doesNotThrow(() => validateNumericFieldValue(path, value))
  for (const [path, value] of [['stats.STR', 0], ['stats.STR', 31], ['proficiency', -1], ['AC', -1], ['HP.HD', 0], ['spellcasting.level', 0], ['spellcasting.level', 21]] as const) assert.throws(() => validateNumericFieldValue(path, value))
  assert.doesNotThrow(() => validateNumericFieldValue('HP.HD', 100000))
})

test('all scalar fields reject nonfinite, fractional and nonnumeric inputs', () => {
  for (const value of [NaN, Infinity, -Infinity, 1.5, '2', null, undefined]) assert.throws(() => validateNumericFieldValue('HP.modifier', value))
  assert.throws(() => validateNumericFieldValue('CR', 0.125), /Unsupported/)
})

test('die type follows the actual editor catalog', () => {
  assert.deepEqual(lookupNumericField('HP.type')?.catalog, [1, 4, 6, 8, 10, 12, 20])
  for (const value of [1, 4, 6, 8, 10, 12, 20]) assert.doesNotThrow(() => validateNumericFieldValue('HP.type', value))
  for (const value of [0, 2, 3, 9, 100]) assert.throws(() => validateNumericFieldValue('HP.type', value))
})

test('reference eligibility uses known scalar references and field groups', () => {
  assert.equal(isReferenceAllowedForField('AC', 'DEX_MOD'), true)
  assert.equal(isReferenceAllowedForField('HP.HD', 'HD_COUNT'), true)
  assert.equal(isReferenceAllowedForField('AC', 'HIT_DICE'), false)
  assert.equal(isReferenceAllowedForField('AC', 'HIT_DIE'), false)
  assert.equal(isReferenceAllowedForField('AC', 'UNKNOWN'), false)
  assert.equal(isReferenceAllowedForField('CR', 'PB'), false)
})
