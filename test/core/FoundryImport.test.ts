import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'
import { validate, type Schema } from 'jsonschema'
import { CR } from '../../src/core/domain/cr-tables.ts'
import { importFoundryActor, looksLikeFoundryActor } from '../../src/core/domain/foundry-import.ts'

const schemaV11 = JSON.parse(
  fs.readFileSync(new URL('../../src/data/schema/5emm-v11.json', import.meta.url), 'utf8'),
) as Schema

const foundryGolden = JSON.parse(
  fs.readFileSync(new URL('../goldens/export-foundry-vtt-actor5e-json.txt', import.meta.url), 'utf8'),
) as unknown

test('F3.1: Foundry golden Actor5e JSON roundtrips into schema-valid v11 Monster', () => {
  assert.equal(looksLikeFoundryActor(foundryGolden), true)
  const res = importFoundryActor(foundryGolden)
  assert.equal(res.ok, true)
  if (!res.ok) return

  assert.equal(res.source, 'foundry')
  assert.equal(res.monster.name, 'Golden Export Fixture')
  assert.equal(res.monster.size, 'Medium')
  assert.equal(res.monster.type, 'humanoid')
  assert.equal(res.monster.stats.INT, 18)
  assert.equal(res.monster.AC, 10)
  assert.equal(res.monster.HP.HD, 1)
  assert.equal(res.monster.HP.type, 8)
  assert.equal(CR[res.monster.CR]?.cr, '9')
  assert.equal(res.monster.proficiency, 4)
  assert.ok(res.monster.traits.some((tr) => tr.name === 'Arcane Ward'))

  const validation = validate(res.monster, schemaV11)
  assert.equal(validation.valid, true, validation.errors.map((e) => e.stack).join('; '))
})

test('F3.1: Foundry importer handles fractional CR, senses, skills, attacks, and strips XSS + prototype pollution', () => {
  const malicious = JSON.parse(
    JSON.stringify({
      name: 'Shadow <script>alert(1)</script> Drake',
      type: 'npc',
      system: {
        abilities: { str: { value: 14 }, dex: { value: 16 }, con: { value: 12 }, int: { value: 8 }, wis: { value: 12 }, cha: { value: 10 } },
        attributes: { ac: { value: 14, calc: 'natural armor' }, hp: { max: 22, formula: '4d8 + 4' }, movement: { walk: 30, fly: 60, hover: true } },
        details: { cr: 0.25, alignment: 'neutral evil', type: { value: 'dragon' } },
        traits: { size: 'sm', dr: { value: ['cold'] }, senses: { darkvision: 60 } },
        skills: { ste: { value: 2, total: 7 } },
      },
      items: [
        {
          name: 'Shadow Bite',
          type: 'weapon',
          system: {
            activation: { type: 'action' },
            description: { value: '<p><em>Melee Weapon Attack:</em> +5 to hit, reach 5 ft., one target. <em>Hit:</em> 7 (1d8 + 3) piercing damage.</p><script>evil()</script>' },
          },
        },
        {
          name: 'Wing Buffer (Costs 2 Actions)',
          type: 'feat',
          system: { activation: { type: 'legendary' }, description: { value: 'Beats wings.' } },
        },
      ],
    }),
  ) as Record<string, unknown>
  Object.defineProperty(malicious, '__proto__', { value: { polluted: true }, enumerable: true, configurable: true })

  const res = importFoundryActor(malicious)
  assert.equal(res.ok, true)
  if (!res.ok) return

  assert.equal(res.monster.name, 'Shadow  Drake')
  assert.equal(CR[res.monster.CR]?.cr, '1/4')
  assert.equal(res.monster.size, 'Small')
  assert.equal(res.monster.senses.darkvision, 60)
  assert.equal(res.monster.skills[0]?.key, 'STEALTH')
  assert.equal(res.monster.skills[0]?.expertise, true)
  assert.equal(res.monster.attacks.length, 1)
  assert.equal(res.monster.attacks[0]?.damage.dice, 8)
  assert.ok(!res.monster.attacks[0]?.description.includes('<script>'))
  assert.equal(res.monster.legendaryActions.actions.length, 1)
  assert.equal(res.monster.legendaryActions.actions[0]?.cost, 2)
  assert.ok(res.warnings.some((w) => w.includes('__proto__')))
  assert.equal(Object.prototype.hasOwnProperty.call(res.monster, 'polluted'), false)

  const validation = validate(res.monster, schemaV11)
  assert.equal(validation.valid, true, validation.errors.map((e) => e.stack).join('; '))
})

test('F3.1: Foundry importer rejects non-NPC or malformed objects cleanly', () => {
  assert.equal(looksLikeFoundryActor(null), false)
  assert.equal(looksLikeFoundryActor({ type: 'character', system: {} }), false)
  const bad = importFoundryActor({ type: 'character', system: {} })
  assert.equal(bad.ok, false)

  const minimal = importFoundryActor({ type: 'npc', system: {} })
  assert.equal(minimal.ok, true)
  if (minimal.ok) {
    assert.equal(validate(minimal.monster, schemaV11).valid, true)
  }
})
