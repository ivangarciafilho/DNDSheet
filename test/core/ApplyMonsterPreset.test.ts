import test from 'node:test'
import assert from 'node:assert'
import { defaultMonster } from '../../src/core/domain/types.ts'
import { applyMonsterPreset } from '../../src/core/usecases/ApplyMonsterPreset.ts'

test('preset initiative lands on initiativeConfig, keeping other settings', () => {
  const m = defaultMonster()
  m.initiativeConfig = { ...m.initiativeConfig, proficient: true }
  applyMonsterPreset(m, { initiative: { advantage: false, disadvantage: true, notes: 'can cast Thaumaturgy' } })
  assert.equal(m.initiativeConfig?.disadvantage, true)
  assert.equal(m.initiativeConfig?.advantage, false)
  assert.equal(m.initiativeConfig?.customEffectNote, 'can cast Thaumaturgy')
  assert.equal(m.initiativeConfig?.proficient, true)
  assert.equal('initiative' in m, false)
})

test('preset bonus actions append to actions flagged as bonus actions', () => {
  const m = defaultMonster()
  applyMonsterPreset(m, { actions: [{ id: 'a', name: 'Bind', description: 'x' }], bonusActions: [{ id: 'b', name: 'Exorcise', description: 'y' }] })
  assert.deepEqual(m.actions.map((a) => [a.name, Boolean(a.bonusAction)]), [['Bind', false], ['Exorcise', true]])
  assert.equal('bonusActions' in m, false)
})

test('preset HP notes become one HP basic rider', () => {
  const m = defaultMonster()
  applyMonsterPreset(m, { hpNotes: 'Bloodied (56)' })
  assert.deepEqual(m.basicRiders?.hp?.map((r) => r.effect), ['Bloodied (56)'])
  applyMonsterPreset(m, { hpNotes: 'Bloodied (56)' })
  assert.equal(m.basicRiders?.hp?.length, 1)
  assert.equal('hpNotes' in m, false)
})

test('preset replaces declared core fields, including an empty subtype and the HP modifier override', () => {
  const m = defaultMonster()
  m.subtype = 'demon'
  applyMonsterPreset(m, { subtype: '', proficiency: 4, hpModifierOverride: true, CR: 0 })
  assert.deepEqual([m.subtype, m.proficiency, m.hpModifierOverride, m.CR], ['', 4, true, 0])
})

test('a partial preset spellcasting merges over the current block instead of replacing it', () => {
  const m = defaultMonster()
  const before = Object.keys(m.spellcasting).length
  applyMonsterPreset(m, { spellcasting: { stat: 'CHA', refreshRate: 'short_rest' } })
  assert.equal(m.spellcasting.stat, 'CHA')
  assert.ok(Object.keys(m.spellcasting).length >= before)
})

test('preset traits and defenses merge without duplicates', () => {
  const m = defaultMonster()
  m.resistances = ['fire']
  applyMonsterPreset(m, { resistances: ['fire', 'radiant'], traits: [{ id: 't', name: 'Keen' }, { id: 't2', name: 'keen' }] })
  assert.deepEqual(m.resistances, ['fire', 'radiant'])
  assert.equal(m.traits.filter((t) => t.name.toLowerCase() === 'keen').length, 1)
})
