import { defaultMonster } from '../../src/core/domain/types.ts'
import test from 'node:test'
import assert from 'node:assert/strict'
import { setMonsterBinding, clearMonsterBinding, resolveMonsterBindings } from '../../src/core/domain/monster-bindings.ts'

const creature = () => ({ stats: { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 }, HP: { HD: 2, type: 8, modifier: 0 }, proficiency: 2, proficiencyOverride: true, hpModifierOverride: true, AC: 10 })
test('bindings resolve source first and keep immutable authored overlay', () => {
  const original = creature()
  let result = setMonsterBinding(original, 'HP.HD', { mode: 'formula', expr: 'PB + 1' })
  result = setMonsterBinding(result.model, 'HP.modifier', { mode: 'formula', expr: 'HD * 2' })
  assert.equal(result.model.HP.HD, 3)
  assert.equal(result.model.HP.modifier, 6)
  result.model.proficiency = 4
  const next = resolveMonsterBindings(result.model)
  assert.equal(next.model.HP.HD, 5)
  assert.equal(next.model.HP.modifier, 10)
  assert.equal(original.HP.HD, 2)
  assert.deepEqual(next.errors, {})
  assert.equal(resolveMonsterBindings(next.model).changed, false)
})
test('invalid candidates reject atomically and cycles retain committed values', () => {
  let model = setMonsterBinding(creature(), 'HP.HD', { mode: 'formula', expr: 'PB' }).model
  const before = JSON.stringify(model)
  assert.throws(() => setMonsterBinding(model, 'proficiency', { mode: 'formula', expr: 'HD' }), /cycl/i)
  assert.equal(JSON.stringify(model), before)
  assert.throws(() => setMonsterBinding(model, 'HP.HD', { mode: 'formula', expr: '1 / 2' }), /integer/i)
  assert.throws(() => setMonsterBinding(model, 'HP.HD', { mode: 'formula', expr: '1d6' }), /dice/i)
  assert.throws(() => setMonsterBinding(model, 'HP.HD', { mode: 'ref', ref: 'PB + 1' }), /reference/i)
  model = { ...model, bindings: { 'HP.HD': { mode: 'formula', expr: 'HD + 1' } } }
  const failed = resolveMonsterBindings(model)
  assert.equal(failed.model.HP.HD, 2)
  assert.match(Object.values(failed.errors).join(' '), /cycl/i)
})
test('detaching retains materialized value, stable IDs survive reorder and deletion is diagnosed', () => {
  const model = { ...creature(), speeds: [{ id: 'a.b', speed: 30 }, { id: 'other', speed: 20 }] }
  const path = 'speeds[id=a.b].speed'
  const bound = setMonsterBinding(model, path, { mode: 'literal', value: 45 }).model
  bound.speeds.reverse()
  assert.equal(resolveMonsterBindings(bound).model.speeds[1].speed, 45)
  const detached = clearMonsterBinding(bound, path)
  assert.equal(detached.model.speeds[1].speed, 45)
  assert.equal(detached.model.bindings?.[path], undefined)
  bound.speeds.splice(1, 1)
  assert.match(Object.values(resolveMonsterBindings(bound).errors).join(' '), /missing/i)
})
test('inactive bindings suspend without destroying expressions or symbolic authorship', () => {
  const bound = setMonsterBinding(creature(), 'HP.modifier', { mode: 'formula', expr: 'PB' }).model
  bound.hpModifierOverride = false
  bound.proficiency = 4
  const result = resolveMonsterBindings(bound)
  assert.equal(result.model.HP.modifier, 2)
  assert.match(result.errors['HP.modifier'], /inactive/i)
  bound.hpModifierOverride = true
  assert.equal(resolveMonsterBindings(bound).model.HP.modifier, 4)
  assert.throws(() => setMonsterBinding({ ...creature(), actions: [{ id: 'a', targeting: { count: 'all' } }] }, 'actions[id=a].targeting.count', { mode: 'literal', value: 3 }), /symbolic/i)
})

test('automatic CON hit-point bonus is synchronized before HP-dependent bindings', () => {
  const source = { ...creature(), hpModifierOverride: false, speeds: [{ id: 'x', speed: 30 }] }
  let result = setMonsterBinding(source, 'HP.HD', { mode: 'formula', expr: 'PB + 1' })
  result.model.stats.CON = 18
  result = setMonsterBinding(result.model, 'speeds[id=x].speed', { mode: 'formula', expr: 'HP' })
  assert.equal(result.model.HP.modifier, 12)
  assert.equal(result.model.speeds[0].speed, 25)
})

test('character proficiency follows resolved Hit Dice and participates in PB dependencies', () => {
  const monster = defaultMonster()
  monster.proficiencyScale = 'character'
  const linked = setMonsterBinding(monster, 'AC', { mode: 'formula', expr: '10 + PB' }).model
  const leveled = setMonsterBinding(linked, 'HP.HD', { mode: 'formula', expr: '9' }).model
  assert.equal(leveled.proficiency, 4)
  assert.equal(leveled.AC, 14)
  assert.throws(() => setMonsterBinding(leveled, 'HP.HD', { mode: 'formula', expr: 'PB + 5' }), /cycl/i)
  leveled.proficiencyOverride = true
  leveled.proficiency = 7
  assert.equal(resolveMonsterBindings(leveled).model.proficiency, 7)
})
