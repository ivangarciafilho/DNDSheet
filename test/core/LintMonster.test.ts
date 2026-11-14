import test from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { lintMonster, autoFixMonster } from '../../src/core/usecases/LintMonster.ts'
import { migrateMonsterSchema } from '../../src/core/usecases/MigrateMonsterSchema.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '../..')
const templatesDir = path.join(projectRoot, 'src/data/templates/monsters')

test('LintMonster - Detect orphan multiattacks and missing damage types', () => {
  const malformedMonster = migrateMonsterSchema({
    name: 'Glitch Chimera',
    saveVersion: 11,
    CR: 5, // CR 2
    AC: 14,
    proficiency: 2,
    HP: { HD: 8, type: 8, modifier: 16 },
    attacks: [
      {
        id: 'atk-real-1',
        name: 'Claw',
        damage: { count: 2, dice: 6, type: '' }, // Missing damage type
      },
    ],
    multiattacks: [
      {
        id: 'ma-1',
        attacks: ['atk-real-1', 'atk-ghost-999'], // Orphan attack
        actions: ['act-ghost-888'], // Orphan action
      },
    ],
  })

  const issues = lintMonster(malformedMonster)

  const orphanAtk = issues.find((i) => i.code === 'MULTIATTACK_ORPHAN_ATTACK')
  assert.ok(orphanAtk != null, 'Should detect orphan attack ID in multiattack')
  assert.strictEqual(orphanAtk?.targetId, 'atk-ghost-999')

  const orphanAct = issues.find((i) => i.code === 'MULTIATTACK_ORPHAN_ACTION')
  assert.ok(orphanAct != null, 'Should detect orphan action ID in multiattack')

  const missingType = issues.find((i) => i.code === 'MISSING_DAMAGE_TYPE')
  assert.ok(missingType != null, 'Should detect missing damage type on Claw')

  // Run autoFix
  const fixResult = autoFixMonster(malformedMonster)
  assert.ok(fixResult.fixedCount >= 2, 'Should fix at least 2 orphan references')

  const postFixIssues = lintMonster(fixResult.monster)
  assert.strictEqual(postFixIssues.filter((i) => i.code.startsWith('MULTIATTACK_ORPHAN')).length, 0)
})

test('LintMonster - Clean SRD monster passes with zero errors', () => {
  const raw = JSON.parse(fs.readFileSync(path.join(templatesDir, 'Knight.5emm.json'), 'utf8'))
  const knight = migrateMonsterSchema(raw)

  const issues = lintMonster(knight)
  const errors = issues.filter((i) => i.severity === 'ERROR')
  assert.strictEqual(errors.length, 0, 'Standard Knight should have zero lint errors')
})

test('LintMonster & CalculateCr evaluate spellcasting DPR when spells map is passed', async () => {
  const { calculateCr } = await import('../../src/core/usecases/CalculateCr.ts')
  const spells = JSON.parse(fs.readFileSync(path.join(projectRoot, 'src/data/spells.json'), 'utf8'))
  const caster = migrateMonsterSchema({
    name: 'Pyromancer',
    saveVersion: 11,
    CR: 1, // CR 1/4, far below Fireball output
    AC: 12,
    HP: { HD: 6, type: 8, modifier: 0 },
    stats: { STR: 10, DEX: 12, CON: 10, INT: 18, WIS: 12, CHA: 10 },
    spellcasting: {
      class: 'Wizard',
      level: 5,
      stat: 'INT',
      slots: [4, 3, 2, 0, 0, 0, 0, 0, 0],
      standard: ['Fireball'],
      atWill: [],
    },
  })

  const withSpells = calculateCr(caster, spells)
  const withoutSpells = calculateCr(caster, {})
  assert.ok(
    withSpells.damagePerRound > withoutSpells.damagePerRound,
    `Expected spell DPR (${withSpells.damagePerRound}) > no-spells DPR (${withoutSpells.damagePerRound})`
  )

  const issuesWithSpells = lintMonster(caster, spells)
  const crDrift = issuesWithSpells.find((i) => i.code === 'CR_DRIFT')
  assert.ok(crDrift != null, 'Expected CR_DRIFT when Fireball pushes calculated CR above CR 1/4')
})
