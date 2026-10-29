import test from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { calculateCr } from '../../src/core/usecases/CalculateCr.ts'
import { migrateMonsterSchema } from '../../src/core/usecases/MigrateMonsterSchema.ts'
import type { DndSpell } from '../../src/core/domain/types.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const projectRoot = path.resolve(__dirname, '../..')
const spellsPath = path.join(projectRoot, 'src/data/spells.json')
const spells: Record<string, DndSpell> = JSON.parse(fs.readFileSync(spellsPath, 'utf8'))

const templatesDir = path.join(projectRoot, 'src/data/templates/monsters')

test('DMG CR Solver - Golden SRD Monsters Validation', async (t) => {
  const monsterFiles = fs.readdirSync(templatesDir).filter((f) => f.endsWith('.5emm.json'))
  assert.ok(monsterFiles.length > 0, 'Must find monster templates')

  for (const filename of monsterFiles) {
    const filePath = path.join(templatesDir, filename)
    const rawData = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    const monster = migrateMonsterSchema(rawData)

    await t.test(`Calculate CR for ${monster.name} (${filename})`, () => {
      const evaluation = calculateCr(monster, spells)

      assert.ok(evaluation.damagePerRound >= 0, 'DPR must be non-negative')
      assert.ok(evaluation.ehp > 0, 'EHP must be positive')
      assert.ok(evaluation.eac >= 10, 'EAC must be >= 10')
      assert.ok(evaluation.estimatedCr != null, 'Estimated CR must be resolved')
      assert.ok(evaluation.offensiveCr != null, 'Offensive CR must be resolved')
      assert.ok(evaluation.defensiveCr != null, 'Defensive CR must be resolved')

      // Exact calculated DMG CR assertions for all SRD templates
      const expectedCalculatedCr: Record<string, string> = {
        'Aboleth': '10',
        'Acolyte': '1/8',
        'Adult Black Dragon': '17',
        'Adult Blue Dragon': '19',
        'Adult Frost Dragon': '18',
        'Air Elemental': '9',
        'Ancient Green Dragon': '24',
        'Archmage': '4',
        'Azer': '3',
        'Basilisk': '2',
        'Knight': '3',
        'Kobold': '1/4',
      }

      if (expectedCalculatedCr[monster.name]) {
        assert.strictEqual(
          evaluation.estimatedCr.cr,
          expectedCalculatedCr[monster.name],
          `Calculated CR for ${monster.name} must match exact DMG algorithm result`
        )
      }
    })
  }
})
