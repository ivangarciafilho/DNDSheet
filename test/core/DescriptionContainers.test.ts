import test from 'node:test'
import assert from 'node:assert/strict'
import {
  MAX_REGIONS_PER_CONTAINER,
  parseDiceRange,
  diagnoseDiceTable,
  filterContainerRegions,
  normalizeContainer,
  addRegionToContainer,
  descriptionContainersText,
  descriptionContainersHtml,
} from '../../src/core/domain/description-containers.ts'
import type { ActionDescriptionContainer, ActionDescriptionRegion } from '../../src/core/domain/types.ts'

test('description containers: parseDiceRange handles single numbers, ranges, and die notation', () => {
  assert.deepEqual(parseDiceRange('4'), { min: 4, max: 4 })
  assert.deepEqual(parseDiceRange('1-4'), { min: 1, max: 4 })
  assert.deepEqual(parseDiceRange('1–6'), { min: 1, max: 6 })
  assert.deepEqual(parseDiceRange('7 to 10'), { min: 7, max: 10 })
  assert.deepEqual(parseDiceRange('d8'), { min: 1, max: 8 })
  assert.deepEqual(parseDiceRange('1d12'), { min: 1, max: 12 })
  assert.deepEqual(parseDiceRange('01-20'), { min: 1, max: 20 })
  assert.equal(parseDiceRange(''), null)
  assert.equal(parseDiceRange('not-a-number'), null)
})

test('description containers: diagnoseDiceTable identifies continuous tables, gaps, and overlaps', () => {
  // Continuous table 1-6 on d6
  const continuousTable = {
    headers: ['d6', 'Effect'],
    rows: [
      ['1-2', 'Fire burst'],
      ['3-4', 'Cold ray'],
      ['5-6', 'Lightning arc'],
    ],
  }
  const diag1 = diagnoseDiceTable(continuousTable)
  assert.equal(diag1.valid, true)
  assert.equal(diag1.continuous, true)
  assert.equal(diag1.hasGaps, false)
  assert.equal(diag1.hasOverlaps, false)

  // Table with gap between 2 and 4
  const gapTable = {
    headers: ['d6', 'Effect'],
    rows: [
      ['1-2', 'Fire burst'],
      ['4-6', 'Lightning arc'],
    ],
  }
  const diag2 = diagnoseDiceTable(gapTable)
  assert.equal(diag2.valid, false)
  assert.equal(diag2.hasGaps, true)
  assert.equal(diag2.hasOverlaps, false)
  assert.equal(diag2.gaps.length, 1)
  assert.match(diag2.gaps[0], /Gap of 1 between "1-2"/)

  // Table with overlap between 1-3 and 3-6
  const overlapTable = {
    headers: ['d6', 'Effect'],
    rows: [
      ['1-3', 'Fire burst'],
      ['3-6', 'Lightning arc'],
    ],
  }
  const diag3 = diagnoseDiceTable(overlapTable)
  assert.equal(diag3.valid, false)
  assert.equal(diag3.hasOverlaps, true)
  assert.equal(diag3.overlaps.length, 1)
  assert.match(diag3.overlaps[0], /overlap/)
})

test('description containers: hard cap of 4 regions per container is enforced', () => {
  assert.equal(MAX_REGIONS_PER_CONTAINER, 4)

  const container: ActionDescriptionContainer = {
    id: 'c1',
    kind: 'text',
    text: 'Main text',
    regions: [
      { id: 'r1', kind: 'text', text: 'Region 1' },
      { id: 'r2', kind: 'text', text: 'Region 2' },
      { id: 'r3', kind: 'text', text: 'Region 3' },
    ],
  }

  // Adding 4th region succeeds
  const r4: ActionDescriptionRegion = { id: 'r4', kind: 'text', text: 'Region 4' }
  const res4 = addRegionToContainer(container, r4)
  assert.equal(res4.success, true)
  assert.equal(res4.container.regions?.length, 4)

  // Adding 5th region fails and returns error
  const r5: ActionDescriptionRegion = { id: 'r5', kind: 'text', text: 'Region 5' }
  const res5 = addRegionToContainer(res4.container, r5)
  assert.equal(res5.success, false)
  assert.match(res5.error || '', /Maximum 4 regions per container reached/)
  assert.equal(res5.container.regions?.length, 4)

  // normalizeContainer truncates any region array exceeding 4
  const oversized: ActionDescriptionContainer = {
    id: 'over',
    kind: 'text',
    regions: [
      { id: '1', kind: 'text' },
      { id: '2', kind: 'text' },
      { id: '3', kind: 'text' },
      { id: '4', kind: 'text' },
      { id: '5', kind: 'text' },
      { id: '6', kind: 'text' },
    ],
  }
  const normalized = normalizeContainer(oversized)
  assert.equal(normalized.regions?.length, 4)
})

test('description containers: filterContainerRegions filters by audience and plane accurately', () => {
  const regions: ActionDescriptionRegion[] = [
    { id: 'r1', kind: 'text', audience: 'all', plane: 'Material', text: 'Public Material' },
    { id: 'r2', kind: 'text', audience: 'caster', plane: 'Material', text: 'Caster only' },
    { id: 'r3', kind: 'text', audience: 'target', plane: 'Ethereal', text: 'Target Ethereal' },
  ]

  const casterRegions = filterContainerRegions(regions, { audience: 'caster' })
  assert.equal(casterRegions.length, 2) // 'all' and 'caster'
  assert.ok(casterRegions.some((r) => r.id === 'r1'))
  assert.ok(casterRegions.some((r) => r.id === 'r2'))

  const etherealRegions = filterContainerRegions(regions, { plane: 'Ethereal' })
  assert.equal(etherealRegions.length, 1)
  assert.equal(etherealRegions[0].id, 'r3')
})

test('description containers: descriptionContainersText and descriptionContainersHtml render regions safely', () => {
  const container: ActionDescriptionContainer = {
    id: 'c1',
    kind: 'text',
    outcomeTarget: 'On Hit',
    text: 'Deals 10 force damage.',
    regions: [
      {
        id: 'r1',
        title: 'Secondary Shockwave',
        kind: 'text',
        audience: 'creatures',
        plane: 'Material',
        text: 'All nearby creatures take 5 thunder damage.',
      },
    ],
  }

  // Prose text export
  const prose = descriptionContainersText([container])
  assert.match(prose, /On Hit: Deals 10 force damage\./)
  assert.match(prose, /\[Secondary Shockwave\]/)
  assert.match(prose, /\(creatures\)/)
  assert.match(prose, /\[Material Plane\]/)
  assert.match(prose, /All nearby creatures take 5 thunder damage\./)

  // HTML rendering
  const html = descriptionContainersHtml([container])
  assert.match(html, /<i>On Hit:<\/i> Deals 10 force damage\./)
  assert.match(html, /class="description-region"/)
  assert.match(html, /Secondary Shockwave/)
  assert.match(html, /Audience: creatures/)
})
