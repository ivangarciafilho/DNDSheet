import assert from 'node:assert/strict'
import test from 'node:test'
import { structuredOutcomeDamage } from '../../src/core/domain/cr-structured-damage.ts'
import { formulaContextForMonster } from '../../src/core/domain/formula-context.ts'
import { buildAttackInfo } from '../../src/core/usecases/CalculateCr.ts'
import { migrateMonsterSchema } from '../../src/core/usecases/MigrateMonsterSchema.ts'

const ctx = formulaContextForMonster({ stats: { STR: 18, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 }, proficiency: 3 } as never)
const damage = (formula: string, trigger = 'hit') => ({ trigger, effects: [{ kind: 'damage' as const, formula, damageType: 'fire' }] })

test('the damaging outcome sums its damage clauses at their average', () => {
  assert.equal(structuredOutcomeDamage({ outcomes: [{ trigger: 'hit', effects: [{ kind: 'damage', formula: '2d6 + 4' }, { kind: 'damage', formula: '1d8' }] }] }, ctx), 15)
})

test('the strongest outcome counts once; text clauses and success halves do not add', () => {
  assert.equal(structuredOutcomeDamage({ outcomes: [damage('4d10', 'failure'), damage('2d10', 'success'), { trigger: 'hit', effects: [{ kind: 'text', text: 'prone' }] }] }, ctx), 22)
})

test('formula references resolve from the monster, invalid formulas count as zero', () => {
  assert.equal(structuredOutcomeDamage({ outcomes: [damage('1d6 + PB')] }, ctx), 6)
  assert.equal(structuredOutcomeDamage({ outcomes: [damage('banana')] }, ctx), 0)
  assert.equal(structuredOutcomeDamage({}, ctx), 0)
})

test('A9.12: an action with damage only in its structured outcome reaches the CR estimate', () => {
  const monster = migrateMonsterSchema({}) as never as Parameters<typeof buildAttackInfo>[0]
  monster.actions = [{ ...(monster.actions?.[0] || {}), id: 'breath', name: 'Searing Breath', description: 'The creature exhales.', recharge: '', legendaryOnly: false, limitedUse: { count: 0, rate: '' }, outcomes: [damage('6d6', 'failure')] } as never]
  const info = buildAttackInfo(monster)
  const entry = info.actions.find((a) => a.name === 'Searing Breath')
  assert.ok(entry, 'structured action should be listed')
  assert.equal(entry.damage, 21)
})
