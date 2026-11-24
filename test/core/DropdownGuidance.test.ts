import test from 'node:test'
import assert from 'node:assert/strict'
import { BASIC_RIDER_CADENCES, BASIC_RIDER_CADENCE_ENTRIES, BASIC_RIDER_TIMINGS, BASIC_RIDER_TIMING_ENTRIES } from '../../src/core/domain/basic-riders.ts'
import { buildCatalogOptions } from '../../src/core/domain/catalogs/catalog-select-model.ts'

// Build 274: rider dropdowns explain themselves: grouped by scope, then alphabetical,
// every option with an icon, a group color and a guiding tooltip.
test('cadence and timing entries cover every value with icon, color, group and tooltip', () => {
  assert.deepEqual(BASIC_RIDER_CADENCE_ENTRIES.map(e => e.value).sort(), BASIC_RIDER_CADENCES.map(c => c.value).sort())
  assert.deepEqual(BASIC_RIDER_TIMING_ENTRIES.map(e => e.value).sort(), [...BASIC_RIDER_TIMINGS].sort())
  for (const entry of [...BASIC_RIDER_CADENCE_ENTRIES, ...BASIC_RIDER_TIMING_ENTRIES]) {
    assert.ok(entry.group && entry.icon && entry.color && entry.tooltip && entry.tooltip.length > 20, entry.value)
  }
  assert.ok(new Set(BASIC_RIDER_CADENCE_ENTRIES.map(e => e.group)).size >= 5)
})

test('options are grouped first, then alphabetical inside each group', () => {
  const options = buildCatalogOptions({ entries: BASIC_RIDER_CADENCE_ENTRIES })
  const groups = options.map(o => o.group).filter((g, i, all) => all.indexOf(g) === i)
  for (const group of groups) {
    const labels = options.filter(o => o.group === group).map(o => o.label)
    assert.deepEqual(labels, [...labels].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' })), group)
  }
})

test('an option without its own color inherits a stable color from its group', () => {
  const entries = [{ value: 'a', label: 'A', group: 'Alpha' }, { value: 'b', label: 'B', group: 'Alpha' }, { value: 'c', label: 'C', group: 'Beta' }]
  const [a, b, c] = buildCatalogOptions({ entries })
  assert.ok(a.color && a.color === b.color)
  assert.notEqual(a.color, c.color)
  assert.equal(buildCatalogOptions({ entries: [{ value: 'x', label: 'X', group: 'G', color: 'red-5' }] })[0].color, 'red-5')
})
