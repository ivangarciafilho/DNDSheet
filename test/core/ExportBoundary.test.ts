import test from 'node:test'
import assert from 'node:assert'
import { escapeLatexText } from '../../src/core/domain/export-markup.ts'
import { defaultMonster } from '../../src/core/domain/types.ts'
import { CURRENT_MONSTER_VERSION, migrateMonsterSchema } from '../../src/core/usecases/MigrateMonsterSchema.ts'

test('escapeLatexText makes raw strings safe inside LaTeX macro arguments (B4.9)', () => {
  assert.strictEqual(escapeLatexText('Ogre & Son {50% off} #1 $2 ~ ^ \\ <x>'), 'Ogre \\& Son \\{50\\% off\\} \\#1 \\$2 \\textasciitilde{} \\textasciicircum{} \\textbackslash{} \\textless{}x\\textgreater{}')
  assert.strictEqual(escapeLatexText('Fire_Drake'), 'Fire\\_Drake')
  assert.strictEqual(escapeLatexText(undefined as unknown as string), '')
})

test('a current .5emm.json save round-trips unchanged (B4.6)', () => {
  const monster = defaultMonster()
  Object.assign(monster, {
    name: 'Round Trip & Co.', saveVersion: CURRENT_MONSTER_VERSION,
    randomTables: [{ id: 't', title: 'Wild', dice: '1d4', rows: [{ id: 'r', min: 1, max: 4, text: 'boom' }] }],
  })
  // A file the app writes is already migrated: load it, save it, load it again — nothing may move.
  const saved = JSON.stringify(migrateMonsterSchema(JSON.parse(JSON.stringify(monster))))
  const reloaded = JSON.stringify(migrateMonsterSchema(JSON.parse(saved)))
  assert.deepStrictEqual(JSON.parse(reloaded), JSON.parse(saved))
  const back = JSON.parse(reloaded)
  assert.strictEqual(back.name, 'Round Trip & Co.')
  assert.strictEqual(back.saveVersion, CURRENT_MONSTER_VERSION)
  assert.deepStrictEqual(back.randomTables, monster.randomTables)
})
