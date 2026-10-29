import test from 'node:test'
import assert from 'node:assert/strict'
import { COMPOSER_ROW_ORDER, ROLE_CHAINS } from '../../src/core/domain/action-composer.ts'

test('every supported role has a non-empty, uniquely keyed composer descriptor chain', () => {
  for (const [role, cells] of Object.entries(ROLE_CHAINS)) {
    assert.ok(cells.length > 0, `${role} should have descriptors`)
    assert.strictEqual(new Set(cells.map((cell) => cell.id)).size, cells.length, `${role} cell ids should be unique`)
    for (const cell of cells) {
      assert.ok(cell.id.trim(), `${role} cell id should be non-empty`)
      assert.ok(cell.label.trim(), `${role}.${cell.id} label should be non-empty`)
      assert.ok(COMPOSER_ROW_ORDER.includes(cell.row), `${role}.${cell.id} row should be in the shared visual order`)
    }
  }
})

test('action roles share the same ordered chain while role-specific entries use their own fields', () => {
  const expected = ROLE_CHAINS.action.map(({ id, row }) => [id, row])
  for (const role of ['bonus_action', 'legendary', 'mythic'] as const) {
    assert.deepStrictEqual(ROLE_CHAINS[role].map(({ id, row }) => [id, row]), expected)
  }

  assert.ok(ROLE_CHAINS.reaction.some((cell) => cell.id === 'trigger' && cell.row === 'mechanics'))
  assert.ok(ROLE_CHAINS.trait.some((cell) => cell.id === 'description' && cell.row === 'prose'))
  assert.ok(ROLE_CHAINS.lair.some((cell) => cell.id === 'role-label' && cell.editable === false))
})

test('action head and mechanics cells follow the plate head and mechanics order', () => {
  for (const role of ['action', 'bonus_action', 'legendary', 'mythic'] as const) {
    assert.deepStrictEqual(
      ROLE_CHAINS[role].filter((cell) => cell.row === 'head').map((cell) => cell.id),
      ['usage', 'discipline', 'tier', 'name', 'components', 'duration']
    )
    assert.deepStrictEqual(
      ROLE_CHAINS[role].filter((cell) => cell.row === 'mechanics').map((cell) => cell.id),
      ['attack', 'attack-bonus', 'save-ability', 'save-dc']
    )
  }
})

test('action descriptor groups follow statblock plate order and include legacy and structured data', () => {
  const cells = ROLE_CHAINS.action
  const rowIndex = (id: string) => {
    const cell = cells.find((candidate) => candidate.id === id)
    assert.ok(cell, `chain should contain ${id}`)
    return COMPOSER_ROW_ORDER.indexOf(cell.row)
  }
  assert.deepStrictEqual(
    ['name', 'attack', 'target-count', 'outcomes', 'description'].map(rowIndex),
    [0, 1, 2, 3, 4]
  )
  for (const id of ['targeting.range', 'targeting.planes', 'outcomes', 'effects', 'range', 'areaDistance']) {
    assert.ok(cells.some((cell) => cell.field === id), `chain should represent ${id}`)
  }
})
