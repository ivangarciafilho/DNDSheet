import test from 'node:test'
import assert from 'node:assert/strict'
import { STATBLOCK_HELP, statblockHelpText, statblockUsageHelpKey } from '../../src/components/rendering/statblock-help.ts'

test('statblock help: every published key has non-empty plain-language copy', () => {
  assert.ok(Object.keys(STATBLOCK_HELP).length >= 25)
  for (const [key, description] of Object.entries(STATBLOCK_HELP)) {
    assert.ok(description.trim().length > 12, `${key} needs useful help text`)
    assert.doesNotMatch(description, /<[^>]+>/, `${key} help must remain plain text`)
  }
})

test('statblock help: unknown and missing keys safely produce no tooltip', () => {
  assert.equal(statblockHelpText('unknown-key'), '')
  assert.equal(statblockHelpText(undefined), '')
  assert.equal(statblockHelpText(null), '')
})

test('statblock help: lookup returns the authored description by stable key', () => {
  assert.equal(statblockHelpText('armor-class'), STATBLOCK_HELP['armor-class'])
  assert.match(statblockHelpText('recharge-d6'), /1d6/)
  assert.match(statblockHelpText('recharge-d12'), /1d12/)
  assert.match(statblockHelpText('recharge'), /recharge die/i)
  assert.doesNotMatch(statblockHelpText('recharge'), /1d6/)
})

test('statblock help: usage copy selects the die from the displayed recharge range', () => {
  assert.equal(statblockUsageHelpKey('Recharge 4–6'), 'recharge-d6')
  assert.equal(statblockUsageHelpKey('Recharge 6-12'), 'recharge-d12')
  assert.equal(statblockUsageHelpKey('Recharge 4-20'), 'recharge')
  assert.equal(statblockUsageHelpKey('3/Day'), 'uses-per-day')
  assert.equal(statblockUsageHelpKey(''), '')
})

test('statblock help: 2024 revision glossary entries are present and explain rules clearly', () => {
  assert.ok(statblockHelpText('bloodied').includes('half its Hit Point maximum'))
  assert.ok(statblockHelpText('temporary-hit-points').includes('buffer against damage'))
  assert.ok(statblockHelpText('disengage').includes('Opportunity Attacks'))
  assert.ok(statblockHelpText('dodge').includes('Disadvantage'))
  assert.ok(statblockHelpText('cover').includes('Half Cover'))
  assert.ok(statblockHelpText('grappled').includes('Speed is 0'))
  assert.ok(statblockHelpText('prone').includes('crawl or spend movement'))
  assert.ok(statblockHelpText('incapacitated').includes('Actions or Reactions'))
  assert.ok(statblockHelpText('restrained').includes('Dexterity saving throws'))
  assert.ok(statblockHelpText('invisible').includes('impossible to see'))
})
