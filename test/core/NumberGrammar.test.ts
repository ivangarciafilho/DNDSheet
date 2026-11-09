import test from 'node:test'
import assert from 'node:assert/strict'
import {
  cleanPunctuation,
  formatSignedModifier,
  formatDiceFormula,
  formatInitiativeHeadline,
  formatOrdinal,
  formatDistanceUnit,
  formatMetricDistance,
  sanitizeProsePunctuation,
} from '../../src/core/domain/number-grammar.ts'

test('number grammar: cleanPunctuation removes composite punctuation collisions', () => {
  assert.equal(cleanPunctuation('casting., 1 SP to Twinned Spell'), 'casting, 1 SP to Twinned Spell')
  assert.equal(cleanPunctuation('Action;, Bonus Action'), 'Action; Bonus Action')
  assert.equal(cleanPunctuation('14, (19 if It Has Temporary Hit Points)'), '14 (19 if It Has Temporary Hit Points)')
  assert.equal(cleanPunctuation('14. (19 if It Has Temporary Hit Points)'), '14 (19 if It Has Temporary Hit Points)')
  assert.equal(cleanPunctuation('<strong>14.</strong> (19 if It Has Temporary Hit Points)'), '<strong>14</strong> (19 if It Has Temporary Hit Points)')
  assert.equal(cleanPunctuation('Hide (14/+4. (16/+6, Acrobatics))'), 'Hide (14/+4 (16/+6, Acrobatics))')
  assert.equal(cleanPunctuation('Gain 10 Temporary Hit Points., Dodge: 5 ft.'), 'Gain 10 Temporary Hit Points, Dodge: 5 ft.')
  assert.equal(cleanPunctuation('((1/Day)), Level 3:'), '(1/Day), Level 3:')
  assert.equal(cleanPunctuation('On Success : takes 13 (3d8) Radiant'), 'On Success: takes 13 (3d8) Radiant')
  assert.equal(cleanPunctuation('(10ft, )'), '(10ft)')
  assert.equal(cleanPunctuation('trailing comma,'), 'trailing comma')
})

test('number grammar: formatSignedModifier formats numbers with optional Unicode minus', () => {
  assert.equal(formatSignedModifier(4), '+4')
  assert.equal(formatSignedModifier(-2), '-2')
  assert.equal(formatSignedModifier(-2, true), '−2')
  assert.equal(formatSignedModifier(0), '+0')
  assert.equal(formatSignedModifier(null), '+0')
})

test('number grammar: formatDiceFormula formats standardized expressions with spaces', () => {
  assert.equal(formatDiceFormula(13, 10, 39), '13d10 + 39')
  assert.equal(formatDiceFormula(1, 8, -2), '1d8 - 2')
  assert.equal(formatDiceFormula(2, 6, 0), '2d6')
  assert.equal(formatDiceFormula(0, 8, 4), '0')
})

test('number grammar: formatInitiativeHeadline formats Title Case headline with capitalized riders', () => {
  const result = formatInitiativeHeadline(4, ['at disadvantage', 'gains 20 temporary hit points'])
  assert.equal(result, '14/+4 Initiative, At disadvantage, Gains 20 temporary hit points')
})

test('number grammar: formatOrdinal formats English ordinal numbers safely', () => {
  assert.equal(formatOrdinal(1), '1st')
  assert.equal(formatOrdinal(2), '2nd')
  assert.equal(formatOrdinal(3), '3rd')
  assert.equal(formatOrdinal(4), '4th')
  assert.equal(formatOrdinal(11), '11th')
  assert.equal(formatOrdinal(21), '21st')
})

test('number grammar: formatDistanceUnit normalizes distance notations', () => {
  assert.equal(formatDistanceUnit('darkvision (60ft)'), 'darkvision (60 ft.)')
  assert.equal(formatDistanceUnit('all creatures 10ft of it'), 'all creatures 10 ft. of it')
  assert.equal(formatDistanceUnit('if 0ft at End Of Turn'), 'if 0 ft. at End Of Turn')
  assert.equal(formatDistanceUnit('reach 5 ft., one target'), 'reach 5 ft., one target')
  assert.equal(formatDistanceUnit('speed reduced by 10 ft.'), 'speed reduced by 10 ft.')
  assert.equal(formatDistanceUnit('30 ft. (40ft, if it has Temporary Hit Points)'), '30 ft. (40 ft., if it has Temporary Hit Points)')
})

test('number grammar: formatMetricDistance converts feet to standard 5e metric', () => {
  assert.equal(formatMetricDistance(60), '60 ft. (18 m)')
  assert.equal(formatMetricDistance(30), '30 ft. (9 m)')
  assert.equal(formatMetricDistance(120), '120 ft. (36 m)')
  assert.equal(formatMetricDistance(0), '0 ft. (0 m)')
})

test('number grammar: sanitizeProsePunctuation combines distance and punctuation cleanup', () => {
  assert.equal(
    sanitizeProsePunctuation('On Success : takes 10ft of distance., then stops'),
    'On Success: takes 10 ft. of distance, then stops'
  )
})
