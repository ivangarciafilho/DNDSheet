import test from 'node:test'
import assert from 'node:assert/strict'
import { characterFormulaMonster, resolveCharacterFields, resolveCharacterText, resolveMonsterText, resolveText, resolvingMonsterView } from '../../src/core/usecases/ResolveMonsterText.ts'
import { exportCharacterToMarkdown, exportToMarkdown } from '../../src/core/usecases/ExportStatblock.ts'
import { catalogFor } from '../../src/core/domain/macro-catalog.ts'
import { defaultCharacterActor, defaultMonster } from '../../src/core/domain/types.ts'
import type { Monster } from '../../src/core/domain/types.ts'

const monster = (): Monster => ({ ...defaultMonster(), name: 'Ghoul', stats: { STR: 13, DEX: 15, CON: 10, INT: 7, WIS: 10, CHA: 6 }, proficiency: 2 } as Monster)

test('authored values resolve formulas, tokens and the author variables, and keep context tokens', () => {
  const m = { ...monster(), customVariables: { AURA: 15 } } as Monster
  assert.equal(resolveText('DC {DC:DEX}, aura {AURA} ft.', m), 'DC 12, aura 15 ft.')
  assert.equal(resolveText('{attack.damage} on hit', m), '{attack.damage} on hit')
  assert.equal(resolveText('plain text', m), 'plain text')
})

test('a resolved copy prints formulas but keeps definitions and leaves the source untouched', () => {
  const m = { ...monster(), ACType: 'natural armor, DC {SPELL_DC}', customVariables: { X: '{PB}' } } as Monster
  const copy = resolveMonsterText(m)
  // Spellcasting defaults to INT (7, -2): 8 + 2 - 2.
  assert.equal(copy.ACType, 'natural armor, DC 8')
  assert.equal(m.ACType, 'natural armor, DC {SPELL_DC}')
  assert.deepEqual(copy.customVariables, { X: '{PB}' })
})

test('the live view resolves reads, refuses writes and keeps raw definitions', () => {
  const m = { ...monster(), ACType: '{DEX_MOD} shield', traits: [{ name: 'Aura', description: 'DC {DC:CON} or {trait.limitedUse}' }], customVariables: { Y: '{PB}' } } as unknown as Monster
  const view = resolvingMonsterView(m)
  assert.equal(view.ACType, '+2 shield')
  assert.equal(view.traits[0].description, 'DC 10 or {trait.limitedUse}')
  assert.deepEqual({ ...view.customVariables }, { Y: '{PB}' })
  assert.throws(() => { 'use strict'; (view as { ACType: string }).ACType = 'x' })
  assert.equal(m.ACType, '{DEX_MOD} shield')
})

test('markdown export prints authored stat-line formulas resolved', () => {
  const md = exportToMarkdown({ ...monster(), ACType: 'natural armor {DC:STR}' } as Monster)
  assert.match(md, /natural armor DC 11/)
  assert.doesNotMatch(md, /\{DC:STR\}/)
})

test('character text resolves against the character scores and proficiency', () => {
  const char = { ...defaultCharacterActor(), name: 'Ilse', stats: { STR: 8, DEX: 14, CON: 12, INT: 18, WIS: 10, CHA: 10 }, proficiency: 3, spellcasting: { ability: 'INT' as const } }
  assert.equal(characterFormulaMonster(char).proficiency, 3)
  assert.equal(resolveCharacterText('Save DC {SPELL_DC}, {INT_MOD}', char), 'Save DC 15, +4')
  const resolved = resolveCharacterFields({ ...char, features: [{ name: 'Arcane Ward', source: 'Wizard', description: 'Ward absorbs {2 * INT_MOD} damage.' }] } as typeof char)
  assert.match(JSON.stringify(resolved), /Ward absorbs 8 damage\./)
  assert.match(exportCharacterToMarkdown({ ...char, features: [{ name: 'Ward', source: '', description: 'DC {DC:INT}' }] } as typeof char), /DC 15/)
})

test('the character scope offers only what a character can resolve', () => {
  const entries = catalogFor({ scope: 'character' }).map(entry => entry.insert)
  assert.ok(entries.includes('{SPELL_DC}') && entries.includes('{DC:WIS}') && entries.includes('{INT_MOD}'))
  assert.ok(!entries.includes('{CR}') && !entries.includes('{XP:monster}') && !entries.includes('{trait.limitedUse}'))
})
