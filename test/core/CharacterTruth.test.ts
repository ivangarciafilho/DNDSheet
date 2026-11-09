import test from 'node:test'
import assert from 'node:assert/strict'
import { defaultCharacterActor } from '../../src/core/domain/types.ts'
import { characterVitals } from '../../src/core/domain/character-truth.ts'
import {
  exportCharacterToJson,
  exportCharacterToMarkdown,
  exportCharacterToPlainText,
} from '../../src/core/usecases/ExportStatblock.ts'
import { importCharacter } from '../../src/core/domain/character-import.ts'

test('character default AC and speed are explicitly estimates, not identity-derived rules', () => {
  const actor = defaultCharacterActor()
  actor.stats.DEX = 18
  actor.race = 'Fast species'
  actor.class = 'Armored class'
  const before = JSON.stringify(actor),
    v = characterVitals(actor)
  assert.equal(v.armorClass.value, 14)
  assert.equal(v.speed.value, 30)
  assert.equal(v.armorClass.kind, 'estimate')
  assert.match(v.speed.provenance, /placeholder/)
  assert.equal(JSON.stringify(actor), before)
  for (const exportText of [
    exportCharacterToMarkdown,
    exportCharacterToPlainText,
  ]) {
    const text = exportText(actor)
    assert.match(text, /estimate/i)
    assert.match(text, /armor, shields and features are not applied/)
    assert.match(text, /species, class and equipment are not applied/)
  }
})
test('recorded vitals and provenance survive character JSON import and prose exports', () => {
  const actor = defaultCharacterActor()
  actor.combatVitals = {
    armorClass: 19,
    speed: 0,
    armorClassSource: 'Plate and shield',
    speedSource: 'Immobile form',
  }
  const imported = importCharacter(JSON.parse(exportCharacterToJson(actor)))
  assert.ok(imported)
  assert.deepEqual(imported.combatVitals, actor.combatVitals)
  const v = characterVitals(imported)
  assert.equal(v.speed.value, 0)
  assert.equal(v.armorClass.kind, 'recorded')
  for (const output of [
    exportCharacterToMarkdown(imported),
    exportCharacterToPlainText(imported),
  ]) {
    assert.match(output, /19.*recorded value/i)
    assert.match(output, /Plate and shield/)
    assert.match(output, /Immobile form/)
  }
})
test('malformed vitals cannot become trusted totals or crash provenance', () => {
  const actor = defaultCharacterActor()
  Object.assign(actor, {
    combatVitals: { armorClass: -1, speed: NaN, armorClassSource: 3 },
  })
  let v = characterVitals(actor)
  assert.equal(v.armorClass.kind, 'estimate')
  assert.equal(v.speed.kind, 'estimate')
  Object.assign(actor, {
    combatVitals: {
      armorClass: 0,
      speed: 40,
      armorClassSource: 7,
      speedSource: [],
    },
  })
  v = characterVitals(actor)
  assert.equal(v.armorClass.value, 0)
  assert.match(v.armorClass.provenance, /User supplied/)
  assert.match(v.speed.provenance, /not verified/)
})
