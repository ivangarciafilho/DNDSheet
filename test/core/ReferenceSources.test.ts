import assert from 'node:assert/strict'
import test from 'node:test'
import { FORMULA_REFS, dependencyOrder } from '../../src/core/domain/formula.ts'
import { referenceSourcesForMonster } from '../../src/core/domain/catalogs/reference-sources.ts'
import type { Monster } from '../../src/core/domain/types.ts'

const creature = () => ({ stats: {}, proficiency: 2, HP: {}, saves: {}, skills: [], speeds: [], spellcasting: { stat: 'INT', save: {}, attack: {} } } as unknown as Monster)

test('disabled override values cannot create false dependency cycles', () => {
  const m = creature()
  for (const [path, ref] of [
    ['saves.STR.overrideValue', 'SAVE_STR'],
    ['spellcasting.save.overrideValue', 'SPELL_DC'],
    ['spellcasting.attack.overrideValue', 'SPELL_ATK'],
    ['passivePerception.overrideValue', 'PASSIVE'],
  ]) {
    assert.deepEqual(dependencyOrder({ [path]: { mode: 'ref', ref } }, referenceSourcesForMonster(m)), [path])
  }
})

test('raw spell attack and save selectors remain distinct from normalized spell modifier selectors', () => {
  const m = creature()
  Object.assign(m.spellcasting, { stat: 'wis' })
  const sources = referenceSourcesForMonster(m)
  assert.ok(sources('SPELL_DC', '').includes('stats.wis'))
  assert.ok(!sources('SPELL_DC', '').includes('stats.WIS'))
  assert.ok(sources('SPELL_MOD', '').includes('stats.WIS'))
  assert.deepEqual(dependencyOrder({ 'stats.WIS': { mode: 'ref', ref: 'SPELL_DC' } }, sources), ['stats.WIS'])
})

test('every canonical reference and alias has an explicit source policy', () => {
  const sources = referenceSourcesForMonster(creature())
  for (const ref of FORMULA_REFS) {
    const paths = sources(ref.id, '')
    assert.ok(paths.length > 0 || ref.id === 'SPEED', ref.id)
    for (const alias of ref.aliases ?? []) assert.deepEqual(sources(alias, ''), paths)
  }
  assert.throws(() => sources('NOT_A_REFERENCE', ''), /Unknown/)
})

test('default context reads stored PB and HP values, without store getter injection', () => {
  const sources = referenceSourcesForMonster(creature())
  assert.deepEqual(sources('PB', ''), ['proficiency'])
  assert.deepEqual(sources('HP', ''), ['HP.HD', 'HP.type', 'HP.modifier'])
  assert.deepEqual(sources('CASTER_LEVEL', ''), ['spellcasting.level'])
  assert.deepEqual(sources('SPELL_MOD', ''), ['spellcasting.stat', 'stats.INT'])
})

test('save and spell overrides gate numeric dependencies and invalid overrides fall through', () => {
  const m = creature()
  m.saves.STR = { override: true, overrideValue: 5, proficient: true }
  m.spellcasting.save = { override: true, overrideValue: 17 }
  let sources = referenceSourcesForMonster(m)
  assert.deepEqual(sources('SAVE_STR', ''), ['saves.STR.override', 'saves.STR.overrideValue'])
  assert.deepEqual(sources('SPELL_DC', ''), ['spellcasting.save.override', 'spellcasting.save.overrideValue'])
  m.saves.STR.overrideValue = NaN
  sources = referenceSourcesForMonster(m)
  assert.ok(sources('SAVE_STR', '').includes('proficiency'))
  assert.ok(sources('SAVE_STR', '').includes('stats.STR'))
})

test('perception uses semantic keys and speed uses encoded stable IDs', () => {
  const m = creature()
  m.skills = [{ key: 'perception', skill: { stat: 'CHA', label: '' }, override: true, overrideValue: 7, proficient: false, expertise: false }]
  m.speeds = [{ id: 'walk / ]', type: 'walk', speed: 30, note: '' }]
  const sources = referenceSourcesForMonster(m)
  assert.ok(sources('PASSIVE', '').includes('skills[key=PERCEPTION].overrideValue'))
  assert.ok(!sources('PASSIVE', '').includes('stats.CHA'))
  assert.deepEqual(sources('SPEED', ''), ['speeds[id=walk%20%2F%20%5D].speed'])
  m.speeds[0].id = ''
  assert.throws(() => referenceSourcesForMonster(m)('SPEED', ''), /identity/i)
})

test('duplicate active identities are rejected', () => {
  const m = creature()
  m.speeds = [{ id: 'a', speed: 30, note: '' }, { id: 'a', speed: 40, note: '' }]
  assert.throws(() => referenceSourcesForMonster(m)('SPEED', ''), /identity/i)
  m.skills = ['PERCEPTION', 'perception'].map(key => ({ key, skill: { stat: 'WIS' as const, label: '' }, override: false, overrideValue: 0, proficient: false, expertise: false }))
  assert.throws(() => referenceSourcesForMonster(m)('PASSIVE', ''), /identity/i)
})

test('transitive reference dependencies expose cross-field cycles', () => {
  assert.throws(() => dependencyOrder({
    'stats.INT': { mode: 'ref', ref: 'SPELL_DC' },
  }, referenceSourcesForMonster(creature())), /cycl/i)
  assert.throws(() => dependencyOrder({
    'HP.HD': { mode: 'ref', ref: 'HP' },
  }, referenceSourcesForMonster(creature())), /cycl/i)
})
