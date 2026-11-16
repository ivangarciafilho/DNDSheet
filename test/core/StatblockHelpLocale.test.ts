import test from 'node:test'
import assert from 'node:assert/strict'
import { STATBLOCK_HELP, statblockHelpText } from '../../src/components/rendering/statblock-help.ts'
import { STATBLOCK_HELP_PT_BR } from '../../src/components/rendering/statblock-help.pt-BR.ts'

test('C5: stat block help tips have a pt-BR text for every key and switch with the locale', () => {
  assert.deepEqual(Object.keys(STATBLOCK_HELP_PT_BR).sort(), Object.keys(STATBLOCK_HELP).sort())
  assert.match(statblockHelpText('armor-class', 'pt-BR'), /Classe de Armadura/)
  assert.match(statblockHelpText('armor-class'), /Armor Class/)
  assert.equal(statblockHelpText('not-a-key', 'pt-BR'), '')
})
