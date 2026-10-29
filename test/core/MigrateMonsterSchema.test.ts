import test from 'node:test'
import assert from 'node:assert'
import {
  migrateMonsterSchema,
  CURRENT_MONSTER_VERSION,
} from '../../src/core/usecases/MigrateMonsterSchema.ts'

test('MigrateMonsterSchema - Legacy v1 to current v11 schema migration', () => {
  const legacyV1 = {
    name: 'Goblin Scout',
    saveVersion: 1,
    skills: [
      {
        skill: { stat: 'DEX', key: 'Stealth' },
        proficient: true,
      },
    ],
    traits: [
      {
        name: 'Nimble Escape',
        limitedUse: { count: '', rate: 'long or short rest' },
        crAnnotation: { maxDamage: 0 },
      },
    ],
    attacks: [
      {
        name: 'Scimitar',
        kind: 'weapon',
        distance: 'melee',
        save: null,
      },
    ],
    actions: [
      {
        id: 'legacy-structured-action',
        name: 'Soul Barrage',
        description: 'A legacy prose block.',
        recharge: '',
        limitedUse: { count: 0, rate: '' },
        stat: 'none',
        save: { override: false, overrideValue: 0 },
        range: '',
        effects: [],
        customPreamble: false,
        bonusAction: false,
        crAnnotation: { include: true, ehpMultiplier: 1, ehpModifier: 0, acModifier: 0 },
        attackReach: 'ranged',
        attackSource: 'spell',
        targeting: { count: 3, countMode: 'up_to', kind: 'creatures' },
        outcomes: [{ trigger: 'hit', effects: [{ kind: 'damage', formula: '1d10', damageType: 'radiant' }] }],
      },
    ],
  }

  const migrated = migrateMonsterSchema(legacyV1)

  // Version bump
  assert.strictEqual(migrated.saveVersion, CURRENT_MONSTER_VERSION)

  // v1 -> v2: expertise added to skills
  assert.strictEqual(migrated.skills[0].expertise, false)

  // v2 -> v3: lair actions and regional effects
  assert.deepStrictEqual(migrated.lairActions, [])
  assert.deepStrictEqual(migrated.regionalEffects, [])
  assert.strictEqual(migrated.regionalEffectDescription, '')

  // v3 -> v4: mythic actions
  assert.ok(migrated.mythicActions != null)
  assert.strictEqual(migrated.mythicActions.triggerRecharge, 'Recharges after a Long or Short Rest')

  // v4 -> v5: app v1 -> v2 overhaul
  assert.strictEqual(migrated.skills[0].key, 'STEALTH')
  assert.strictEqual(migrated.traits[0].limitedUse.rate, 'LONG_OR_SHORT')
  assert.strictEqual(migrated.traits[0].crAnnotation.automatic, false)
  assert.strictEqual(migrated.attacks[0].kind, 'WEAPON')
  assert.strictEqual(migrated.attacks[0].distance, 'MELEE')
  assert.strictEqual(migrated.autoEstimateDefenseCr, true)

  // v5 -> v6: visual cr override & alpha traits
  assert.strictEqual(migrated.alphaTraits, false)
  assert.strictEqual(migrated.useCrDisplayOverride, false)

  // v6 -> v7: senses notes
  assert.strictEqual(migrated.sensesNotes, '')

  // v7 -> v8: inventory
  assert.strictEqual(migrated.inventory, '')

  // v8 -> v9: 2024 monster format
  assert.strictEqual(migrated.format, '2014')
  assert.deepStrictEqual(migrated.actions[0].targeting, { count: 3, countMode: 'up_to', kind: 'creatures' }, 'New optional authoring data survives old schema migrations')
  assert.deepStrictEqual(migrated.actions[0].outcomes, [{ trigger: 'hit', effects: [{ kind: 'damage', formula: '1d10', damageType: 'radiant' }] }])

  // v9 -> v10: lairCr & nickname
  assert.strictEqual(migrated.lairCr, -1)
  assert.strictEqual(migrated.lairCrNote, 'in lair')
  assert.strictEqual(migrated.nickname, '')

  // Post-migration sanitization
  assert.strictEqual(migrated.attacks[0].save, 0, 'Null attack save must sanitize to 0')
  assert.strictEqual(migrated.traits[0].limitedUse.count, 0, 'Empty string count must sanitize to 0')
})

test('MigrateMonsterSchema - Idempotence on already current v11 schema', () => {
  const currentMonster = {
    name: 'Modern Dragon',
    saveVersion: 11,
    format: '2024',
    nickname: 'Ignis',
    lairCr: 20,
    inventory: '10,000 gp',
    skills: [],
    traits: [],
    attacks: [],
    actions: [],
  }

  const result = migrateMonsterSchema(currentMonster)

  assert.strictEqual(result.saveVersion, 11)
  assert.strictEqual(result.format, '2024', 'Should preserve existing 2024 format')
  assert.strictEqual(result.nickname, 'Ignis')
  assert.strictEqual(result.lairCr, 20)
  assert.strictEqual(result.inventory, '10,000 gp')
})
