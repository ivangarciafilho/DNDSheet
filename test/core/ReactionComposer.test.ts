import test from 'node:test'
import assert from 'node:assert/strict'
import { reactionCellPatch, reactionCellValue, reactionChainView, validateReactionCell } from '../../src/core/domain/reaction-composer.ts'
import type { MonsterReaction } from '../../src/core/domain/types.ts'

const reaction = (overrides: Partial<MonsterReaction> = {}): MonsterReaction => ({
  id: 'reaction-1',
  name: 'Parry',
  description: 'The creature adds 3 to its AC.',
  trigger: 'When a creature hits it with a melee attack',
  limitedUse: { count: 3, rate: 'DAY' },
  ...overrides,
})

test('reaction chain preserves plate order and includes the reaction trigger as its own cell', () => {
  const rows = reactionChainView(reaction(), '3/Day')
  assert.deepStrictEqual(rows.map((row) => row.row), ['head', 'mechanics', 'scope', 'outcomes'])
  assert.ok(['usage','name','trigger','attack','save-ability','target-count','outcomes'].every(id=>rows.flatMap(row=>row.cells).some(cell=>cell.id===id)))
  assert.strictEqual(rows[1].cells[0].text, 'When a creature hits it with a melee attack')
})

test('reaction cell patches update only their owned persisted fields', () => {
  const original = reaction()
  assert.deepStrictEqual(reactionCellPatch(original, 'trigger', 'When it is hit'), { trigger: 'When it is hit' })
  assert.deepStrictEqual(reactionCellPatch(original, 'usage', '2/Long or Short Rest'), {
    limitedUse: { count: 2, rate: 'LONG_OR_SHORT' },
  })
  assert.deepStrictEqual(reactionCellPatch(original, 'usage', ''), {
    limitedUse: { count: 0, rate: 'DAY' },
  })
  assert.strictEqual(original.trigger, 'When a creature hits it with a melee attack')
  assert.strictEqual(reactionCellValue(original, 'usage'), '3/DAY')
})

test('reaction usage rejects ambiguous input and accepts supported free-form rate labels', () => {
  assert.strictEqual(validateReactionCell('usage', 'three/day'), 'Use a number and recharge rate, such as 3/Day')
  assert.strictEqual(validateReactionCell('usage', '3/Day'), '')
  assert.strictEqual(validateReactionCell('name', '  '), 'Name is required')
  assert.deepStrictEqual(reactionCellPatch(reaction(), 'usage', 'three/day'), {})
})
