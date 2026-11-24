import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'
import { validate, type Schema } from 'jsonschema'
import { CR } from '../../src/core/domain/cr-tables.ts'
import { importImprovedInit, looksLikeImprovedInit } from '../../src/core/domain/improved-init-import.ts'

const schemaV11 = JSON.parse(
  fs.readFileSync(new URL('../../src/data/schema/5emm-v11.json', import.meta.url), 'utf8'),
) as Schema

const iiGolden = JSON.parse(
  fs.readFileSync(new URL('../goldens/export-json-improved-initiative-format.txt', import.meta.url), 'utf8'),
) as unknown

test('F3.3: Improved Initiative golden bundle roundtrips into schema-valid v11 Monster', () => {
  assert.equal(looksLikeImprovedInit(iiGolden), true)
  const res = importImprovedInit(iiGolden)
  assert.equal(res.ok, true)
  if (!res.ok) return

  assert.equal(res.source, 'improved-initiative')
  assert.equal(res.monster.name, 'Golden Export Fixture')
  assert.equal(res.monster.size, 'Medium')
  assert.equal(res.monster.type, 'humanoid')
  assert.equal(res.monster.stats.INT, 18)
  assert.equal(res.monster.AC, 10)
  assert.equal(res.monster.HP.HD, 1)
  assert.equal(res.monster.HP.type, 8)
  assert.equal(CR[res.monster.CR]?.cr, '9')
  assert.equal(res.monster.proficiency, 4)
  assert.ok(res.monster.traits.some((t) => t.name === 'Arcane Ward'))
  assert.ok(res.monster.actions.some((a) => a.name.includes('Force Lash')))
  assert.ok(res.monster.reactions.some((r) => r.name === 'Counter Glyph'))

  const validation = validate(res.monster, schemaV11)
  assert.equal(validation.valid, true, validation.errors.map((e) => e.stack).join('; '))
})

test('F3.3: Improved Initiative single-creature payload parses saves, skills, attacks, initiative advantage, and strips XSS', () => {
  const payload: Record<string, unknown> = {
    Name: 'Vortex <b>Scout</b><script>xss()</script>',
    Type: 'Small fey, chaotic good',
    Abilities: { Str: 8, Dex: 18, Con: 12, Int: 11, Wis: 14, Cha: 15 },
    AC: { Value: 15, Notes: '(leather armor)' },
    HP: { Value: 27, Notes: '(5d6 + 10)' },
    InitiativeAdvantage: true,
    Speed: ['30 ft.', 'fly 40 ft. (hover)'],
    Senses: ['darkvision 60 ft.', 'passive Perception 14'],
    Languages: ['Common', 'Sylvan'],
    Challenge: '1/4',
    Saves: [{ Name: 'Dex', Modifier: 6 }],
    Skills: [{ Name: 'Perception', Modifier: 4 }],
    DamageVulnerabilities: ['iron'],
    DamageResistances: ['cold'],
    DamageImmunities: [],
    ConditionImmunities: ['charmed'],
    Traits: [],
    Actions: [
      {
        Name: 'Star Bow',
        Content: 'Ranged Weapon Attack: +6 to hit, range 80/320 ft., one target. Hit: 8 (1d8 + 4) radiant damage.',
      },
    ],
    Reactions: [],
    LegendaryActions: [{ Name: 'Blink (Costs 2 Actions)', Content: 'Teleports 30 ft.' }],
  }
  Object.defineProperty(payload, 'constructor', { value: { injected: true }, enumerable: true, configurable: true })

  assert.equal(looksLikeImprovedInit(payload), true)
  const res = importImprovedInit(payload)
  assert.equal(res.ok, true)
  if (!res.ok) return

  assert.equal(res.monster.name, 'Vortex Scout')
  assert.equal(res.monster.size, 'Small')
  assert.equal(res.monster.initiativeConfig?.advantage, true)
  assert.equal(res.monster.speeds.length, 2)
  assert.equal(res.monster.speeds[1]?.hover, true)
  assert.equal(CR[res.monster.CR]?.cr, '1/4')
  assert.equal(res.monster.saves.DEX.overrideValue, 6)
  assert.equal(res.monster.skills[0]?.key, 'PERCEPTION')
  assert.equal(res.monster.attacks.length, 1)
  assert.equal(res.monster.legendaryActions.actions[0]?.cost, 2)
  assert.ok(res.warnings.some((w) => w.includes('constructor')))
  assert.equal(validate(res.monster, schemaV11).valid, true)
})

test('F3.3: Improved Initiative importer rejects unrelated JSON cleanly', () => {
  assert.equal(looksLikeImprovedInit({ name: '5emm' }), false)
  const bad = importImprovedInit({ foo: 'bar' })
  assert.equal(bad.ok, false)
})
