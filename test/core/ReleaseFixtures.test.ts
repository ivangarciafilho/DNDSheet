import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'
import { validate } from 'jsonschema'
import {
  migrateMonsterSchema,
  CURRENT_MONSTER_VERSION,
} from '../../src/core/usecases/MigrateMonsterSchema.ts'

const directory = new URL('../fixtures/monsters/', import.meta.url)
const ids = ['seraph', 'pact', 'full', 'innate', 'legacy-actions']
const schema = (version: number) =>
  JSON.parse(
    fs.readFileSync(
      new URL(`../../src/data/schema/5emm-v${version}.json`, import.meta.url),
      'utf8'
    )
  )
const load = (id: string) =>
  JSON.parse(fs.readFileSync(new URL(`${id}.json`, directory), 'utf8'))

test('release fixtures contain exactly the five canonical reusable documents', () => {
  assert.deepEqual(
    fs
      .readdirSync(directory)
      .filter((name) => name.endsWith('.json'))
      .sort(),
    ids.map((id) => `${id}.json`).sort()
  )
})
for (const id of ids) {
  test(`release fixture ${id}: import schema, migration, and stable authoring content`, () => {
    const raw = load(id)
    const before = JSON.stringify(raw)
    assert.equal(
      validate(raw, schema(raw.saveVersion)).valid,
      true,
      `${id}: invalid saved document`
    )
    const migrated = migrateMonsterSchema(raw)
    assert.equal(
      JSON.stringify(raw),
      before,
      'migration must not mutate the reusable fixture'
    )
    assert.equal(migrated.saveVersion, CURRENT_MONSTER_VERSION)
    for (const version of [9, CURRENT_MONSTER_VERSION]) {
      const result = validate(migrated, schema(version))
      assert.equal(result.valid, true, result.errors.map(String).join('\n'))
    }
    assert.deepEqual(
      migrateMonsterSchema(migrated),
      migrated,
      'migration must be idempotent'
    )
    for (const key of [
      'stats',
      'saves',
      'HP',
      'spellcasting',
      'legendaryActions',
      'mythicActions',
      'extendedHp',
    ])
      assert.ok(migrated[key], `${id}: missing ${key}`)
    for (const key of [
      'traits',
      'actions',
      'attacks',
      'reactions',
      'speeds',
      'randomTables',
    ])
      assert.ok(Array.isArray(migrated[key]), `${id}: missing ${key}`)
    assert.deepEqual(
      migrated.actions,
      raw.actions,
      'action prose and optional structured outcomes must survive import'
    )
  })
}
test('release fixtures exercise distinct source contracts', () => {
  const seraph = load('seraph')
  assert.equal(seraph.name, 'Seraph')
  assert.ok(seraph.traits.length && seraph.actions[0].outcomes.length)
  const pact = load('pact').spellcasting
  assert.equal(pact.resourceType, 'pact')
  assert.equal(pact.refreshRate, 'short_rest')
  assert.deepEqual(pact.slots, [0, 0, 2, 0, 0, 0, 0, 0, 0])
  const full = load('full').spellcasting
  assert.equal(full.class, 'Wizard')
  assert.equal(
    full.slots.reduce((sum: number, value: number) => sum + value, 0),
    14
  )
  const innate = load('innate').spellcasting
  assert.equal(innate.standard.length, 0)
  assert.deepEqual(
    innate.atWill.map((row: { rate: string }) => row.rate),
    ['AT_WILL', 'DAY']
  )
  const legacy = load('legacy-actions')
  assert.equal(legacy.saveVersion, 8)
  assert.ok(
    legacy.actions.some(
      (action: { bonusAction: boolean }) => action.bonusAction
    )
  )
  assert.ok(
    legacy.legendaryActions.actions.length &&
      legacy.mythicActions.actions.length &&
      legacy.reactions.length
  )
})
