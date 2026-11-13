import test from 'node:test'
import assert from 'node:assert/strict'
import { catalogFor, catalogGroups, insertMacro, MACRO_CATALOG, openMacroAt, unresolvedMacros } from '../../src/core/domain/macro-catalog.ts'
import { FORMULA_REFS } from '../../src/core/domain/formula.ts'

test('the catalog holds every formula reference once, plus tokens, rolls, context tokens and snippets', () => {
  for (const ref of FORMULA_REFS) assert.equal(MACRO_CATALOG.filter((entry) => entry.insert === `{${ref.id}}`).length, 1, ref.id)
  const inserts = MACRO_CATALOG.map((entry) => entry.insert)
  assert.equal(new Set(inserts).size, inserts.length, 'no duplicate inserts')
  for (const kind of ['reference', 'token', 'roll', 'context', 'snippet']) assert.ok(MACRO_CATALOG.some((entry) => entry.kind === kind), kind)
})

test('scope filters out what a field cannot resolve', () => {
  const mechanic = catalogFor({ scope: 'mechanic' })
  assert.ok(!mechanic.some((entry) => entry.kind === 'context' || entry.kind === 'snippet'))
  assert.ok(mechanic.some((entry) => entry.insert === '{SPELL_DC}'))
  const trait = catalogFor({ scope: 'trait' })
  assert.ok(trait.some((entry) => entry.insert === '{trait.limitedUse}'))
  assert.ok(!trait.some((entry) => entry.insert === '{attack.damage}'))
  assert.ok(catalogFor({ scope: 'attack' }).some((entry) => entry.insert === '{attack.damage}'))
})

test('typing ranks matching inserts first and includes the author variables and macros', () => {
  assert.equal(catalogFor({ scope: 'mechanic', query: 'spell_dc' })[0].insert, '{SPELL_DC}')
  const results = catalogFor({ scope: 'mechanic', query: 'spell_d', customVariables: { SPELL_DUST: 3 } })
  // The author's own entries come first among equal matches.
  assert.equal(results[0].insert, '{SPELL_DUST}')
  assert.equal(results[0].group, 'Your variables')
  assert.ok(results.some((entry) => entry.insert === '{SPELL_DC}'))
  assert.ok(catalogFor({ scope: 'mechanic', query: 'zzzz-nothing' }).length === 0)
  assert.ok(catalogFor({ scope: 'mechanic', query: 'dex', limit: 3 }).length <= 3)
  assert.deepEqual(catalogGroups(catalogFor({ scope: 'mechanic', query: 'dc:' })).map((group) => group.group), ['Saves and attacks'])
})

test('an unclosed brace before the caret opens autocomplete and insertion replaces it', () => {
  assert.deepEqual(openMacroAt('DC {spe', 7), { query: 'spe', start: 3 })
  assert.equal(openMacroAt('DC {SPELL_DC} and', 17), undefined)
  assert.equal(openMacroAt('no brace', 8), undefined)
  assert.deepEqual(insertMacro('DC {spe rest', 3, 7, '{SPELL_DC}'), { text: 'DC {SPELL_DC} rest', caret: 13 })
})

test('unresolved tokens are reported once each', () => {
  assert.deepEqual(unresolvedMacros('DC 15 and {MYSTERY} {MYSTERY} {X}'), ['{MYSTERY}', '{X}'])
  assert.deepEqual(unresolvedMacros('All resolved: 13 (2d8 + 4)'), [])
})
