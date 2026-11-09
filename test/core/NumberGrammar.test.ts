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
    cleanPunctuation('AC: 14. (19 if It Has Temporary Hit Points)'),
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

test('number grammar: formatDistanceUnit standardizes distances with clean space and period', () => {
  assert.equal(formatDistanceUnit('darkvision 60ft, blindsight 30ft'), 'darkvision 60 ft., blindsight 30 ft.')
  assert.equal(formatDistanceUnit('Speed reduced by 10ft, if 0ft at End Of Turn'), 'Speed reduced by 10 ft., if 0 ft. at End Of Turn')
  assert.equal(formatDistanceUnit('all creatures 10ft of it'), 'all creatures 10 ft. of it')
  assert.equal(formatDistanceUnit('reach 5 ft.'), 'reach 5 ft.')
})

test('number grammar: formatMetricDistance calculates meters with or without imperial base', () => {
  assert.equal(formatMetricDistance(60), '60 ft. (18 m)')
  assert.equal(formatMetricDistance(30), '30 ft. (9 m)')
  assert.equal(formatMetricDistance(10), '10 ft. (3 m)')
  assert.equal(formatMetricDistance(5), '5 ft. (1.5 m)')
  assert.equal(formatMetricDistance(0), '0 ft. (0 m)')
  assert.equal(formatMetricDistance(60, false), '18 m')
  assert.equal(formatMetricDistance(5, false), '1.5 m')
})

test('number grammar: sanitizeProsePunctuation cleans complex prose with distance and punctuation normalization', () => {
  const dirty = 'On Success : takes 13 (3d8) Radiant, all creatures 10ft of it. '
  const sanitized = sanitizeProsePunctuation(dirty)
  assert.equal(sanitized, 'On Success: takes 13 (3d8) Radiant, all creatures 10 ft. of it.')

  const acText = 'AC: 14. (19 if It Has Temporary Hit Points)'
  assert.equal(sanitizeProsePunctuation(acText), 'AC: 14 (19 if It Has Temporary Hit Points)')
})

test('number grammar: formatDistanceUnit handles mixed reaches, ranges, and multi-unit strings', () => {
  const complex = 'Melee Weapon Attack: reach 5ft., one target. Ranged Weapon Attack: range 30/120ft., speed 40ft'
  const standardized = formatDistanceUnit(complex)
  assert.equal(
    standardized,
    'Melee Weapon Attack: reach 5 ft., one target. Ranged Weapon Attack: range 30/120 ft., speed 40 ft.'
  )
})

test('number grammar: cleanPunctuation safely handles empty, whitespace, and clean strings', () => {
  assert.equal(cleanPunctuation(''), '')
  assert.equal(cleanPunctuation('   '), '')
  assert.equal(cleanPunctuation('Normal sentence.'), 'Normal sentence.')
  assert.equal(cleanPunctuation('AC: 16 (scale mail), 18 (shield)'), 'AC: 16 (scale mail), 18 (shield)')
})
