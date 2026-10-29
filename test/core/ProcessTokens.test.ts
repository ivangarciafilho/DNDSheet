import test from 'node:test'
import assert from 'node:assert'
import { processTokens } from '../../src/core/usecases/ProcessTokens.ts'
import { migrateMonsterSchema } from '../../src/core/usecases/MigrateMonsterSchema.ts'
import type { Monster } from '../../src/core/domain/types.ts'

function createSampleMonster(): Monster {
  return migrateMonsterSchema({
    name: 'Red Dragon Wyrmling',
    nickname: '',
    saveVersion: 11,
    useArticleInToken: true,
    AC: 17,
    proficiency: 2,
    CR: 7, // Index 7 is CR 4 (1,100 XP)
    HP: { HD: 10, type: 8, modifier: 30 },
    stats: { STR: 19, DEX: 10, CON: 17, INT: 12, WIS: 11, CHA: 15 },
    saves: {
      DEX: { proficient: true, override: false, overrideValue: 0 },
      CON: { proficient: true, override: false, overrideValue: 0 },
      WIS: { proficient: true, override: false, overrideValue: 0 },
      CHA: { proficient: true, override: false, overrideValue: 0 },
      STR: { proficient: false, override: false, overrideValue: 0 },
      INT: { proficient: false, override: false, overrideValue: 0 },
    },
    skills: [],
    resistances: [],
    immunities: ['fire'],
    vulnerabilities: [],
    conditions: [],
    attacks: [],
    traits: [
      {
        name: 'Fire Breath',
        limitedUse: { count: 1, rate: 'DAY' },
      },
    ],
    actions: [],
  })
}

test('ProcessTokens - Dice arithmetic and HP token', () => {
  const monster = createSampleMonster()

  // HP token expands to dice, then calculates average
  const hpText = processTokens('Max HP is {monster.hp}.', monster)
  // 10d8+30 => 10 * 4.5 = 45 + 30 = 75 (10d8 + 30)
  assert.strictEqual(hpText, 'Max HP is 75 (10d8 + 30).')

  // Arbitrary dice token {2d6+4}
  const diceText = processTokens('Deals {2d6+4} slashing damage.', monster)
  // 2 * 3.5 = 7 + 4 = 11 (2d6 + 4)
  assert.strictEqual(diceText, 'Deals 11 (2d6 + 4) slashing damage.')

  // Dice without modifier {3d8}
  const noModText = processTokens('Damage: {3d8}.', monster)
  // 3 * 4.5 = 13 (3d8)
  assert.strictEqual(noModText, 'Damage: 13 (3d8).')
})

test('ProcessTokens - Save DC and Attack Modifier tokens', () => {
  const monster = createSampleMonster()

  // DC:CON = 8 + proficiency (2) + CON mod (+3) = DC 13
  const dcText = processTokens('Target must succeed on a {DC:CON} saving throw.', monster)
  assert.strictEqual(dcText, 'Target must succeed on a DC 13 saving throw.')

  // A:STR = proficiency (2) + STR mod (+4) = +6
  const atkText = processTokens('Melee Weapon Attack: {A:STR} to hit.', monster)
  assert.strictEqual(atkText, 'Melee Weapon Attack: +6 to hit.')
})

test('ProcessTokens - Name token and capitalization', () => {
  const monster = createSampleMonster()

  // With article at start of sentence -> Capitalized 'The Red Dragon Wyrmling'
  const nameStart = processTokens('{NAME} breathes fire.', monster)
  assert.strictEqual(nameStart, 'The Red Dragon Wyrmling breathes fire.')

  // With article mid-sentence -> lowercase 'the Red Dragon Wyrmling'
  const nameMid = processTokens('All fear {NAME} greatly.', monster)
  assert.strictEqual(nameMid, 'All fear the Red Dragon Wyrmling greatly.')

  // After sentence period
  const afterPeriod = processTokens('A roar echoes. {NAME} appears!', monster)
  assert.strictEqual(afterPeriod, 'A roar echoes. The Red Dragon Wyrmling appears!')
})

test('ProcessTokens - XP token calculations', () => {
  const monster = createSampleMonster()

  // Explicit CR lookup: CR 1/4 = 50 XP, CR 1 = 200 XP, CR 4 = 1,100 XP
  const xpDirect = processTokens('Awards {XP:1/4} on defeat.', monster)
  assert.strictEqual(xpDirect, 'Awards 50 XP on defeat.')

  // Monster CR lookup (monster has CR index 8 = CR 4 = 1,100 XP)
  const xpMonster = processTokens('Awards {XP:monster}.', monster)
  assert.strictEqual(xpMonster, 'Awards 1,100 XP.')

  // Additive XP {XP:1/4+} => 50 + 1100 = 1,150 XP
  const xpAdditive = processTokens('Total: {XP:1/4+}.', monster)
  assert.strictEqual(xpAdditive, 'Total: 1,150 XP.')
})

test('ProcessTokens - Generic monster properties and trait context', () => {
  const monster = createSampleMonster()

  const propText = processTokens('AC is {monster.AC} and PB is +{monster.proficiency}.', monster)
  assert.strictEqual(propText, 'AC is 17 and PB is +2.')

  const trait = monster.traits[0]
  const contextText = processTokens(
    '{NAME} uses Fire Breath{trait.limitedUse}.',
    monster,
    { context: trait }
  )
  assert.strictEqual(contextText, 'The Red Dragon Wyrmling uses Fire Breath (1/DAY).')
})

test('ProcessTokens - Advanced Macros (Cantrip Tier, Dynamic Dice with Stat Mods, Shorthands)', () => {
  const monster = createSampleMonster()
  // monster has CHA 15 (+2), STR 19 (+4), HD 10 (Tier 2), AC 17, HP 75

  // 1. Shorthand macros
  assert.strictEqual(processTokens('CHA mod: {CHA_MOD}', monster), 'CHA mod: +2')
  assert.strictEqual(processTokens('STR mod: {STR_MOD}', monster), 'STR mod: +4')
  assert.strictEqual(processTokens('AC: {AC}, HP: {HP}, PB: {PROF}', monster), 'AC: 17, HP: 75, PB: +2')
  assert.strictEqual(processTokens('Cantrip tier: {CANTRIP_TIER}', monster), 'Cantrip tier: 2')

  // 2. Dynamic formula inside dice token {1d10 + CHA_MOD}
  // 1d10 avg is 5.5 + 2 = 7.5 -> 7
  const dynText = processTokens('Takes {1d10 + CHA_MOD} radiant damage.', monster)
  assert.strictEqual(dynText, 'Takes 7 (1d10 + 2) radiant damage.')

  // 3. Dynamic formula with STR_MOD {2d6 + STR_MOD}
  // 2d6 avg is 7 + 4 = 11
  const strDice = processTokens('Deals {2d6 + STR_MOD} slashing damage.', monster)
  assert.strictEqual(strDice, 'Deals 11 (2d6 + 4) slashing damage.')

  // 4. Bare stat mod replacement
  const bareMod = processTokens('Damage bonus is CHA_MOD.', monster)
  assert.strictEqual(bareMod, 'Damage bonus is +2.')
})
