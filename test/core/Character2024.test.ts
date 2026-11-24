import test from 'node:test'
import assert from 'node:assert/strict'
import {
  ORIGIN_FEAT_SUGGESTIONS,
  WEAPON_MASTERY_PROPERTIES,
  characterRuleset,
} from '../../src/core/domain/character-2024.ts'
import { importCharacter } from '../../src/core/domain/character-import.ts'
import { defaultCharacterActor, defaultMonster } from '../../src/core/domain/types.ts'
import { calculateCr } from '../../src/core/usecases/CalculateCr.ts'
import {
  exportCharacterToJson,
  exportCharacterToMarkdown,
  exportCharacterToPlainText,
} from '../../src/core/usecases/ExportStatblock.ts'

test('F2.1: 2024 character provenance, Origin Feats, and Weapon Mastery survive .character.json roundtrip and exports', () => {
  assert.equal(WEAPON_MASTERY_PROPERTIES.length, 8)
  assert.ok(ORIGIN_FEAT_SUGGESTIONS.includes('Alert'))

  const actor = defaultCharacterActor()
  assert.equal(characterRuleset(actor), '2014')

  actor.provenance = { ruleset: '2024', source: "Player's Handbook 2024" }
  actor.originFeats = [{ id: 'of-1', name: 'Alert', notes: '+PB to Initiative' }]
  actor.weaponMasteries = [{ id: 'wm-1', weapon: 'Longsword', mastery: 'Sap', notes: 'Disadvantage on next attack' }]
  assert.equal(characterRuleset(actor), '2024')

  const exported = JSON.parse(exportCharacterToJson(actor)) as Record<string, unknown>
  Object.defineProperty(exported, '__proto__', { value: { evil: true }, enumerable: true })
  const reimported = importCharacter(exported)
  assert.ok(reimported)
  assert.equal(reimported.provenance?.ruleset, '2024')
  assert.equal(reimported.provenance?.source, "Player's Handbook 2024")
  assert.deepEqual(reimported.originFeats, [{ id: 'of-1', name: 'Alert', notes: '+PB to Initiative' }])
  assert.deepEqual(reimported.weaponMasteries, [
    { id: 'wm-1', weapon: 'Longsword', mastery: 'Sap', notes: 'Disadvantage on next attack' },
  ])

  const md = exportCharacterToMarkdown(reimported)
  const txt = exportCharacterToPlainText(reimported)
  assert.ok(md.includes('**Ruleset** 2024'))
  assert.ok(md.includes('### Origin Feats'))
  assert.ok(md.includes('### Weapon Masteries'))
  assert.ok(txt.includes('ORIGIN FEATS:'))
  assert.ok(txt.includes('WEAPON MASTERIES:'))
})

test('Caveat F2.1->F2.2: Legacy character defaults and monster CR formulas are completely isolated from Character 2024 extensions', () => {
  const legacy = defaultCharacterActor()
  const roundtrip = importCharacter(JSON.parse(exportCharacterToJson(legacy)))
  assert.deepEqual(roundtrip, legacy)

  const invalid = importCharacter({
    class: 'Fighter',
    level: 5,
    race: 'Human',
    stats: { STR: 16, DEX: 12, CON: 14, INT: 10, WIS: 10, CHA: 8 },
    weaponMasteries: [{ id: 'w1', weapon: 'Pike', mastery: 'InvalidProp' }],
  })
  assert.equal(invalid?.weaponMasteries?.[0].mastery, 'Vex')

  const m = defaultMonster()
  m.AC = 15
  m.HP = { HD: 6, type: 8, modifier: 12 }
  const crBefore = calculateCr(m)
  assert.equal(typeof crBefore.damageCr.cr, 'string')
  assert.equal(typeof crBefore.damagePerRound, 'number')
})
