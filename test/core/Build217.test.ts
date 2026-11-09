import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { lintMonster, autoFixMonster } from '../../src/core/usecases/LintMonster.ts'
import { defaultMonster, defaultCharacterActor } from '../../src/core/domain/types.ts'
import { exportCharacterToJson, exportCharacterToMarkdown, exportCharacterToPlainText } from '../../src/core/usecases/ExportStatblock.ts'
import { processTokens } from '../../src/core/usecases/ProcessTokens.ts'

test('every lint issue marked fixable is actually repaired by autoFixMonster (B2.1)', () => {
  const m = defaultMonster()
  Object.assign(m, { multiattacks: [{ id: 'ma', attacks: ['missing-attack'], actions: ['missing-action'] }, { id: 'empty', attacks: [], actions: [] }] })
  // Also raise the two codes autoFixMonster cannot repair, so the second check is never vacuous.
  m.CR = 20
  Object.assign(m.spellcasting, { class: 'Wizard', level: 5, slots: [0, 0, 0, 0, 0, 0, 0, 0, 0], standard: ['Fire Bolt'], atWill: [] })
  const raisedCodes = lintMonster(m).map((i) => i.code)
  assert.ok(raisedCodes.includes('CR_DRIFT') && raisedCodes.includes('SPELL_SLOTS_EMPTY'), 'fixture raises ' + raisedCodes.join(', '))
  const before = lintMonster(m).filter((i) => i.fixable)
  assert.ok(before.length > 0, 'fixture should raise fixable issues')
  const after = lintMonster(autoFixMonster(m).monster)
  for (const issue of before) assert.ok(!after.some((i) => i.code === issue.code), `${issue.code} is flagged fixable but survives autoFixMonster`)
  for (const code of ['CR_DRIFT', 'SPELL_SLOTS_EMPTY']) {
    const raised = lintMonster(m).concat(after).filter((i) => i.code === code)
    assert.ok(raised.every((i) => i.fixable === false), `${code} must not promise an automatic fix`)
  }
})

const stable = () => Object.assign(defaultCharacterActor(), { id: 'hero-1', name: 'Golden Hero' })
const golden = (file: string, actual: string) => {
  const path = `test/goldens/${file}`
  if (process.env.DNDSHEET_UPDATE_GOLDENS === '1' || !fs.existsSync(path)) fs.writeFileSync(path, actual.replace(/\r\n/g, '\n').trimEnd() + '\n')
  assert.strictEqual(actual.replace(/\r\n/g, '\n').trimEnd() + '\n', fs.readFileSync(path, 'utf8').replace(/\r\n/g, '\n'))
}

test('character Markdown and plain-text exports match their goldens (B4.13)', () => {
  golden('character-markdown.txt', exportCharacterToMarkdown(stable()))
  golden('character-plain-text.txt', exportCharacterToPlainText(stable()))
})

test('character JSON export is lossless (B4.13)', () => {
  const actor = stable()
  assert.deepStrictEqual(JSON.parse(exportCharacterToJson(actor)), JSON.parse(JSON.stringify(actor)))
})

test('macro rendering of a 5 000-character description stays inside its budget (A17.8)', () => {
  const m = defaultMonster()
  m.name = 'Budget Wyrm'
  const unit = 'The {NAME} strikes for {2d6 + STR_MOD} damage against DC {DC:CON}; it gains {PROF} temporary hit points. '
  const text = unit.repeat(Math.ceil(5000 / unit.length)).slice(0, 5000)
  processTokens(text, m) // warm-up: first call compiles regexes and caches
  const runs = 20, start = performance.now()
  let out = ''
  for (let i = 0; i < runs; i++) out = processTokens(text, m)
  const perRun = (performance.now() - start) / runs
  assert.ok(!out.includes('{NAME}'), 'tokens were resolved')
  // Budget: well under one 60 Hz frame on the build machine, so live preview never stalls on long descriptions.
  assert.ok(perRun < 16, `processTokens took ${perRun.toFixed(2)} ms per 5 000 characters`)
  console.log(`# macro budget: ${perRun.toFixed(2)} ms per 5 000-character description`)
})
