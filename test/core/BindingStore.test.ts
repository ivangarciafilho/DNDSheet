import test from 'node:test'
import assert from 'node:assert/strict'
import { computed, createApp } from 'vue'
import { createPinia, defineStore } from 'pinia'
import { monsterBindingActions, installMonsterBindings } from '../../src/stores/binding-runtime.ts'

function fixture(bindings = {}) {
  const pinia = createPinia()
  pinia.use(installMonsterBindings)
  createApp({}).use(pinia)
  const useStore = defineStore('monster', {
    state: () => ({ stats: { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 20 }, proficiency: 2,
      HP: { HD: 2, type: 8, modifier: 0 }, hpModifierOverride: true, bindings,
      speeds: [{ id: 'walk', speed: 30 }],
      spellcasting: { stat: 'CHA', save: { override: true, overrideValue: 10 }, attack: {} } }),
    actions: monsterBindingActions,
  })
  return useStore(pinia)
}

test('production Pinia actions follow sources, detach and skip identical literal patches', () => {
  const store = fixture()
  store.setBinding('spellcasting.save.overrideValue', { mode: 'formula', expr: '8+PB+CHA_MOD' })
  const renderedDc = computed(() => store.spellcasting.save.overrideValue)
  assert.equal(renderedDc.value, 15)
  assert.equal(store.spellcasting.save.overrideValue, 15)
  store.stats.CHA = 22
  assert.equal(renderedDc.value, 16)
  assert.equal(store.spellcasting.save.overrideValue, 16)
  store.clearBinding('spellcasting.save.overrideValue')
  assert.equal(Object.keys(store.bindings).length, 0)
  store.stats.CHA = 24
  assert.equal(store.spellcasting.save.overrideValue, 16)
  let patches = 0
  store.$subscribe(() => patches++, { flush: 'sync' })
  store.setBinding('stats.CHA', { mode: 'literal', value: 24 })
  assert.equal(patches, 0)
  store.$dispose()
})

test('hydrated expressions resolve and invalid drafts preserve the store', () => {
  const store = fixture({ 'spellcasting.save.overrideValue': { mode: 'formula', expr: '8+PB+CHA_MOD' } })
  assert.equal(store.spellcasting.save.overrideValue, 15)
  const before = JSON.stringify(store.$state)
  assert.throws(() => store.setBinding('HP.HD', { mode: 'formula', expr: '1/2' }), /integer/i)
  assert.equal(JSON.stringify(store.$state), before)
  store.$dispose()
})

test('literal presentation survives production storage and hydration without changing arithmetic', () => {
  const store = fixture()
  store.setBinding('HP.HD', { mode: 'literal', value: 4, presentation: { italic: true } })
  assert.equal(store.HP.HD, 4)
  assert.deepEqual(store.bindings['HP.HD'], { mode: 'literal', value: 4, presentation: { italic: true } })
  const reloaded = fixture(JSON.parse(JSON.stringify(store.bindings)))
  assert.equal(reloaded.HP.HD, 4)
  assert.equal(reloaded.bindings['HP.HD'].presentation.italic, true)
  store.setBinding('HP.HD', { mode: 'literal', value: 4, presentation: { italic: false } })
  assert.equal(store.bindings['HP.HD'], undefined)
  store.$dispose(); reloaded.$dispose()
})

test('materialization preserves live collection record identity', () => {
  const store = fixture(), speed = store.speeds[0]
  store.setBinding('speeds[id=walk].speed', { mode: 'formula', expr: 'PB * 10' })
  assert.equal(store.speeds[0], speed)
  assert.equal(speed.speed, 20)
  store.$dispose()
})
