import test from 'node:test'
import assert from 'node:assert/strict'
import { catalogFor, MACRO_CATALOG, openMacroAt } from '../../src/core/domain/macro-catalog.ts'
import { FORMULA_REFS, parseFormula } from '../../src/core/domain/formula.ts'

// Build 274: suggestions keep flowing while a braced formula is being composed.
test('inside a braced formula the identifier at the caret is the query', () => {
  const text = 'deals {1d8 + STR'
  assert.deepEqual(openMacroAt(text, text.length), { query: 'STR', start: text.length - 3, compose: true })
  const after = '{2d6 + '
  assert.deepEqual(openMacroAt(after, after.length), { query: '', start: after.length, compose: true })
  assert.deepEqual(openMacroAt('{PB * (', 7), { query: '', start: 7, compose: true })
  assert.equal(openMacroAt('{PB} + STR', 10), undefined)
})

test('compose suggestions are bare references and variables, never braced snippets', () => {
  const list = catalogFor({ scope: 'action', query: 'STR', compose: true, customVariables: { STR_BONUS: 2 } })
  assert.ok(list.length > 0)
  assert.ok(list.every(entry => !entry.insert.includes('{') && (entry.kind === 'reference' || entry.kind === 'custom')))
  assert.ok(list.some(entry => entry.insert === 'STR_MOD'))
  assert.ok(list.some(entry => entry.insert === 'STR_BONUS'))
  assert.ok(catalogFor({ scope: 'action', query: '', compose: true, limit: 8 }).length === 8)
})

test('the catalog is broad and every braced insert resolves', () => {
  assert.ok(MACRO_CATALOG.length >= 180, `catalog has ${MACRO_CATALOG.length}`)
  assert.ok(MACRO_CATALOG.filter(e => e.kind === 'snippet').length >= 40)
  assert.ok(MACRO_CATALOG.filter(e => e.kind === 'roll').length >= 20)
  const ids = new Set(FORMULA_REFS.map(ref => ref.id))
  const known = /^(NAME|monster\.(AC|hp)|XP:monster|(DC|A):(STR|DEX|CON|INT|WIS|CHA)|(trait|action|attack|spellcasting|legendaryActions|multiattack)\.[\w.]+)$/
  for (const entry of MACRO_CATALOG) {
    for (const [, body] of entry.insert.matchAll(/\{([^{}]+)\}/g)) {
      assert.ok(ids.has(body) || known.test(body) || parseFormula(body).ok, `${entry.label}: {${body}}`)
    }
  }
})
