import test from 'node:test'
import assert from 'node:assert/strict'
import { defaultMonster } from '../../src/core/domain/types.ts'
import { ROLE_HEADERS, lairChainView, roleHeaderDraft, roleHeaderPatch, validateRoleHeader } from '../../src/core/domain/role-headers.ts'
import { processTokens } from '../../src/core/usecases/ProcessTokens.ts'

test('section header catalog covers each persisted role context without introducing entry names', () => {
  assert.deepEqual(Object.keys(ROLE_HEADERS), ['legendary', 'mythic', 'lair'])
  assert.deepEqual(ROLE_HEADERS.lair.map(field => field.id), ['initiative', 'custom', 'preamble'])
  assert.deepEqual(lairChainView()[0].cells.map(cell => cell.id), ['role-label'])
})

test('legendary header updates preserve action membership and unrelated fields without mutating the input', () => {
  const monster = defaultMonster()
  monster.legendaryActions.customPreamble = 'Existing text '
  const draft = roleHeaderDraft(monster, 'legendary')
  draft.count = '5'; draft.custom = true; draft.preamble = 'Five actions '
  const patch = roleHeaderPatch(monster, 'legendary', draft)
  assert.equal(patch.legendaryActions?.count, 5)
  assert.equal(patch.legendaryActions?.actions, monster.legendaryActions.actions)
  assert.equal(patch.legendaryActions?.customPreamble, 'Five actions ')
  assert.equal(monster.legendaryActions.customPreamble, 'Existing text ')
  assert.equal(Object.keys(patch).length, 1)
})

test('mythic header changes preserve membership and authored whitespace', () => {
  const monster = defaultMonster()
  const draft = roleHeaderDraft(monster, 'mythic')
  draft.triggerName = 'Second dawn '; draft.triggerDescription = 'At 0 HP '; draft.preamble = 'While awakened '
  const patch = roleHeaderPatch(monster, 'mythic', draft)
  assert.equal(patch.mythicActions?.actions, monster.mythicActions.actions)
  assert.equal(patch.mythicActions?.triggerName, 'Second dawn ')
  assert.equal(patch.mythicActions?.triggerDescription, 'At 0 HP ')
})

test('lair header patch preserves initiative tuning, stored custom prose, and entry collections', () => {
  const monster = defaultMonster()
  monster.initiativeConfig = { proficient: true, advantage: true }
  const draft = roleHeaderDraft(monster, 'lair')
  assert.equal(draft.initiative, 20)
  draft.initiative = 15; draft.preamble = 'Authored preamble '; draft.custom = false
  const patch = roleHeaderPatch(monster, 'lair', draft)
  assert.deepEqual(patch.initiativeConfig, { proficient: true, advantage: true, lairInitiative: 15 })
  assert.equal(patch.lairActionPreamble, 'Authored preamble ')
  assert.equal('lairActions' in patch, false)
})

test('header counts reject blank, fractional, out-of-range and non-numeric values without any patch', () => {
  const monster = defaultMonster()
  for (const count of ['', ' ', -1, 1.5, 100, Infinity]) {
    const draft = { ...roleHeaderDraft(monster, 'legendary'), count }
    assert.ok(validateRoleHeader('legendary', draft))
    assert.deepEqual(roleHeaderPatch(monster, 'legendary', draft), {})
  }
  assert.ok(validateRoleHeader('lair', { ...roleHeaderDraft(monster, 'lair'), initiative: 41 }))
  assert.equal(validateRoleHeader('lair', { ...roleHeaderDraft(monster, 'lair'), initiative: 0 }), '')
})

test('lair initiative macro follows the current context and defaults to twenty for older saves', () => {
  const monster = defaultMonster()
  assert.equal(processTokens('Initiative {LAIR_INITIATIVE}', monster), 'Initiative 20')
  monster.initiativeConfig = { lairInitiative: 15 }
  assert.equal(processTokens('Initiative {LAIR_INITIATIVE}', monster), 'Initiative 15')
  monster.initiativeConfig.lairInitiative = 0
  assert.equal(processTokens('{LAIR_INITIATIVE}', monster), '0')
})
