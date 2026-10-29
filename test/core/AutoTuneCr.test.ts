import test from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { generateAutoTunePlan } from '../../src/core/usecases/AutoTuneCr.ts'
import { calculateCr } from '../../src/core/usecases/CalculateCr.ts'
import { migrateMonsterSchema } from '../../src/core/usecases/MigrateMonsterSchema.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '../..')
const templatesDir = path.join(projectRoot, 'src/data/templates/monsters')

test('AutoTuneCr - Scale Kobold up to CR 3', () => {
  const raw = JSON.parse(fs.readFileSync(path.join(templatesDir, 'Kobold.5emm.json'), 'utf8'))
  const kobold = migrateMonsterSchema(raw)

  const plan = generateAutoTunePlan(kobold, '3')

  assert.strictEqual(plan.targetCr, '3')
  assert.ok(plan.recommendations.length > 0)

  // AC should be tuned to CR 3 benchmark (13)
  assert.strictEqual(plan.tunedMonster.AC, 13)

  // Hit dice should be significantly scaled up from 2d6
  assert.ok(plan.tunedMonster.HP.HD > kobold.HP.HD)

  // Tuned monster should pass CR solver
  const tunedEval = calculateCr(plan.tunedMonster)
  assert.ok(tunedEval.estimatedCr != null)
  assert.ok(tunedEval.damagePerRound > 0)
  assert.ok(tunedEval.ehp > 50)
})

test('AutoTuneCr - Scale Adult Black Dragon down to CR 5', () => {
  const raw = JSON.parse(
    fs.readFileSync(path.join(templatesDir, 'Adult Black Dragon.5emm.json'), 'utf8')
  )
  const dragon = migrateMonsterSchema(raw)

  const plan = generateAutoTunePlan(dragon, '5')

  assert.strictEqual(plan.targetCr, '5')
  assert.strictEqual(plan.tunedMonster.proficiency, 3) // CR 5 PB is +3
  assert.strictEqual(plan.tunedMonster.AC, 15) // CR 5 AC is 15

  // HD should scale down from 17d12
  assert.ok(plan.tunedMonster.HP.HD < dragon.HP.HD)

  // Damage dice counts should scale down
  const tunedEval = calculateCr(plan.tunedMonster)
  assert.ok(tunedEval.damagePerRound < calculateCr(dragon).damagePerRound)
})
