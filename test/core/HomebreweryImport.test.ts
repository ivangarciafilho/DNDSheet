import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'
import { validate, type Schema } from 'jsonschema'
import { CR } from '../../src/core/domain/cr-tables.ts'
import {
  importHomebreweryMarkdown,
  looksLikeHomebreweryMarkdown,
} from '../../src/core/domain/homebrewery-import.ts'

const schemaV11 = JSON.parse(
  fs.readFileSync(new URL('../../src/data/schema/5emm-v11.json', import.meta.url), 'utf8'),
) as Schema

const hbV3Golden = fs.readFileSync(
  new URL('../goldens/export-markdown-homebrewery-v3.txt', import.meta.url),
  'utf8',
)
const hbLegacyGolden = fs.readFileSync(
  new URL('../goldens/export-markdown-homebrewery-legacy.txt', import.meta.url),
  'utf8',
)

test('F3.2: Homebrewery v3 golden Markdown roundtrips into schema-valid v11 Monster', () => {
  assert.equal(looksLikeHomebreweryMarkdown(hbV3Golden), true)
  const res = importHomebreweryMarkdown(hbV3Golden)
  assert.equal(res.ok, true)
  if (!res.ok) return

  assert.equal(res.source, 'homebrewery')
  assert.equal(res.monster.name, 'Golden Export Fixture')
  assert.equal(res.monster.size, 'Medium')
  assert.equal(res.monster.type, 'humanoid')
  assert.equal(res.monster.AC, 10)
  assert.equal(res.monster.HP.HD, 1)
  assert.equal(res.monster.HP.type, 8)
  assert.equal(res.monster.stats.INT, 18)
  assert.equal(CR[res.monster.CR]?.cr, '9')
  assert.equal(res.monster.proficiency, 4)
  assert.ok(res.monster.traits.some((t) => t.name === 'Arcane Ward'))
  assert.ok(res.monster.actions.some((a) => a.name.includes('Force Lash')))
  assert.ok(res.monster.reactions.some((r) => r.name === 'Counter Glyph' && r.trigger.includes('casts a spell')))

  const validation = validate(res.monster, schemaV11)
  assert.equal(validation.valid, true, validation.errors.map((e) => e.stack).join('; '))
})

test('F3.2: Homebrewery legacy blockquote Markdown roundtrips into schema-valid v11 Monster', () => {
  assert.equal(looksLikeHomebreweryMarkdown(hbLegacyGolden), true)
  const res = importHomebreweryMarkdown(hbLegacyGolden)
  assert.equal(res.ok, true)
  if (!res.ok) return

  assert.equal(res.monster.name, 'Golden Export Fixture')
  assert.equal(res.monster.stats.INT, 18)
  assert.equal(CR[res.monster.CR]?.cr, '9')
  assert.ok(res.monster.traits.some((t) => t.name === 'Arcane Ward'))
  assert.ok(res.monster.reactions.some((r) => r.name === 'Counter Glyph'))
  assert.equal(validate(res.monster, schemaV11).valid, true)
})

test('F3.2: Homebrewery importer extracts saves, skills, legendary actions, and strips XSS', () => {
  const md = `{{monster,frame
## Obsidian <script>alert(1)</script> Warden
*Large construct, lawful neutral*
___
**Armor Class** :: 18 (natural armor)
**Hit Points** :: 114 (12d10 + 48)
**Speed** :: 30 ft., fly 40 ft. (hover)
___
|  STR  |  DEX  |  CON  |  INT  |  WIS  |  CHA  |
|20 (+5)|12 (+1)|18 (+4)|6 (-2)|11 (+0)|5 (-3)|
___
**Saving Throws** :: CON +8, WIS +4
**Skills** :: Athletics +9, Perception +4
**Damage Immunities** :: poison, psychic
**Senses** :: darkvision 60 ft., passive Perception 14
**Languages** :: understands Common
**Challenge** :: 1/2 (100 XP)
___
***Magic Resistance.*** Advantage on saves.
### Actions
***Slam.*** *Melee Weapon Attack:* +9 to hit, reach 5 ft., one target. *Hit:* 14 (2d8 + 5) bludgeoning damage.
### Legendary Actions
***Step (Costs 2 Actions).*** Moves up to half speed.
}}`

  const res = importHomebreweryMarkdown(md)
  assert.equal(res.ok, true)
  if (!res.ok) return

  assert.equal(res.monster.name, 'Obsidian  Warden')
  assert.equal(res.monster.size, 'Large')
  assert.equal(res.monster.AC, 18)
  assert.equal(res.monster.ACType, 'natural armor')
  assert.equal(res.monster.saves.CON.overrideValue, 8)
  assert.equal(res.monster.skills.length, 2)
  assert.equal(res.monster.immunities.length, 2)
  assert.equal(CR[res.monster.CR]?.cr, '1/2')
  assert.equal(res.monster.attacks.length, 1)
  assert.equal(res.monster.legendaryActions.actions.length, 1)
  assert.equal(res.monster.legendaryActions.actions[0]?.cost, 2)
  assert.ok(res.warnings.some((w) => w.includes('Sanitized')))
  assert.equal(validate(res.monster, schemaV11).valid, true)
})

test('F3.2: Homebrewery importer rejects empty or JSON inputs safely', () => {
  assert.equal(looksLikeHomebreweryMarkdown('{"name":"Json"}'), false)
  assert.equal(importHomebreweryMarkdown('').ok, false)
})
