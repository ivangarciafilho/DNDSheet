import test from 'node:test'
import assert from 'node:assert/strict'
import {
  cleanPunctuation,
  formatSignedModifier,
  formatDiceFormula,
  formatInitiativeHeadline,
  formatOrdinal,
} from '../../src/core/domain/number-grammar.ts'

test('number grammar: cleanPunctuation cleans double commas, ., combinations, and orphan punctuation', () => {
  assert.equal(
    cleanPunctuation('for this casting., 1 SP to Twinned Spell'),
    'for this casting, 1 SP to Twinned Spell'
  )
  assert.equal(
    cleanPunctuation('((1/Day)), Level 3:'),
    '(1/Day), Level 3:'
  )
  assert.equal(
    cleanPunctuation('14/+4 Initiative, '),
    '14/+4 Initiative'
  )
  assert.equal(
    cleanPunctuation('darkvision (60ft, ), blindsight (30ft)'),
    'darkvision (60ft), blindsight (30ft)'
  )
  assert.equal(
    cleanPunctuation('option 1;; option 2,, option 3.'),
    'option 1; option 2, option 3.'
  )
  assert.equal(
    cleanPunctuation('AC: 14, (19 if It Has Temporary Hit Points)'),
    'AC: 14 (19 if It Has Temporary Hit Points)'
  )
  assert.equal(
    cleanPunctuation('On Success : takes 13 (3d8) Radiant'),
    'On Success: takes 13 (3d8) Radiant'
  )
  assert.equal(
    cleanPunctuation('Search (8/-2, (10/+0, Perception))'),
    'Search (8/-2 (10/+0, Perception))'
  )
})

test('number grammar: formatSignedModifier formats positive and negative modifiers with standard or unicode minus', () => {
  assert.equal(formatSignedModifier(4), '+4')
  assert.equal(formatSignedModifier(0), '+0')
  assert.equal(formatSignedModifier(-2), '-2')
  assert.equal(formatSignedModifier(-2, true), '−2')
})

test('number grammar: formatDiceFormula formats standard hit dice and damage expressions', () => {
  assert.equal(formatDiceFormula(13, 10, 39), '13d10 + 39')
  assert.equal(formatDiceFormula(1, 'd8', -2), '1d8 - 2')
  assert.equal(formatDiceFormula(4, '6'), '4d6')
})

test('number grammar: formatInitiativeHeadline builds title-case initiative string with capitalized riders', () => {
  const headline = formatInitiativeHeadline(4, [
    'at Disadvantage',
    'gains 20 Temporary Hit Points',
  ])
  assert.equal(
    headline,
    '14/+4 Initiative, At Disadvantage, Gains 20 Temporary Hit Points'
  )

  const negativeHeadline = formatInitiativeHeadline(-2, ['acts at end of every turn'])
  assert.equal(
    negativeHeadline,
    '8/-2 Initiative, Acts at end of every turn'
  )

  const plainHeadline = formatInitiativeHeadline(0)
  assert.equal(plainHeadline, '10/+0 Initiative')
})

test('number grammar: formatOrdinal produces proper English ordinal suffixes', () => {
  assert.equal(formatOrdinal(1), '1st')
  assert.equal(formatOrdinal(2), '2nd')
  assert.equal(formatOrdinal(3), '3rd')
  assert.equal(formatOrdinal(4), '4th')
  assert.equal(formatOrdinal(11), '11th')
  assert.equal(formatOrdinal(12), '12th')
  assert.equal(formatOrdinal(13), '13th')
  assert.equal(formatOrdinal(21), '21st')
  assert.equal(formatOrdinal(22), '22nd')
  assert.equal(formatOrdinal(23), '23rd')
})
