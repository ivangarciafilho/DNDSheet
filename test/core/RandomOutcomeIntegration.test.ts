import test from 'node:test'
import assert from 'node:assert/strict'
import type { RandomTable } from '../../src/core/domain/random-table.ts'
import {
  formatRandomTableAsHtml,
  diagnoseOutcomeRandomTables,
  resolveTableOutcome,
  tableToProse,
} from '../../src/core/domain/random-table.ts'
import {
  descriptionContainersText,
  descriptionContainersHtml,
  normalizeContainer,
} from '../../src/core/domain/description-containers.ts'
import { outcomesHtml } from '../../src/core/domain/outcome-rendering.ts'
import type { ActionDescriptionContainer } from '../../src/core/domain/types.ts'

const SAMPLE_CONFUSION_TABLE: RandomTable = {
  id: 'rt-confusion',
  title: 'Confusion Behavior',
  dice: '1d10',
  rows: [
    { id: 'r1', min: 1, max: 1, text: 'The creature uses all its movement to move in a random direction.' },
    { id: 'r2', min: 2, max: 6, text: 'The creature doesn’t move or take actions this turn.' },
    { id: 'r3', min: 7, max: 8, text: 'The creature uses its action to make a melee attack against a random creature.' },
    { id: 'r4', min: 9, max: 10, text: 'The creature can act and move normally.' },
  ],
  fallback: 'The creature shakes off the confusion.',
}

test('formatRandomTableAsHtml produces accessible semantic HTML tables with th scope="col"', () => {
  const html = formatRandomTableAsHtml(SAMPLE_CONFUSION_TABLE)
  assert.ok(html.includes('<table class="outcome-dice-table random-table">'))
  assert.ok(html.includes('<th scope="col">1d10</th>'))
  assert.ok(html.includes('<th scope="col">Effect</th>'))
  assert.ok(html.includes('data-table-id="rt-confusion"'))
  assert.ok(html.includes('Confusion Behavior'))
  assert.ok(html.includes('1'))
  assert.ok(html.includes('2–6'))
  assert.ok(html.includes('7–8'))
  assert.ok(html.includes('9–10'))
  assert.ok(html.includes('<em>Otherwise</em>'))
  assert.ok(html.includes('shakes off the confusion'))
})

test('diagnoseOutcomeRandomTables detects missing, orphan, and empty table references', () => {
  const emptyTable: RandomTable = { id: 'rt-empty', dice: '1d6', rows: [] }
  const normalTable: RandomTable = { id: 'rt-normal', dice: '1d6', rows: [{ id: '1', min: 1, max: 6, text: 'Fire' }] }
  const tables = [emptyTable, normalTable]

  // Scenario 1: Reference to non-existent table and empty table
  const diag1 = diagnoseOutcomeRandomTables(tables, ['rt-missing', 'rt-empty', 'rt-normal'])
  assert.deepStrictEqual(diag1.missingTableIds, ['rt-missing'])
  assert.deepStrictEqual(diag1.emptyTableIds, ['rt-empty'])
  assert.deepStrictEqual(diag1.orphanTableIds, [])

  // Scenario 2: Unreferenced tables
  const diag2 = diagnoseOutcomeRandomTables(tables, ['rt-normal'])
  assert.deepStrictEqual(diag2.missingTableIds, [])
  assert.deepStrictEqual(diag2.orphanTableIds, ['rt-empty'])
})

test('resolveTableOutcome provides deterministic roll lookups and explicit fallbacks', () => {
  // Explicit roll match
  const res1 = resolveTableOutcome(SAMPLE_CONFUSION_TABLE, 1)
  assert.strictEqual(res1.isFallback, false)
  assert.ok(res1.resultText.includes('random direction'))

  const res2 = resolveTableOutcome(SAMPLE_CONFUSION_TABLE, 5)
  assert.strictEqual(res2.isFallback, false)
  assert.ok(res2.resultText.includes('doesn’t move'))

  // Explicit roll outside range triggers fallback
  const resFallback = resolveTableOutcome(SAMPLE_CONFUSION_TABLE, 12)
  assert.strictEqual(resFallback.isFallback, true)
  assert.strictEqual(resFallback.resultText, 'The creature shakes off the confusion.')

  // No explicit roll summarizes table as prose
  const resSummary = resolveTableOutcome(SAMPLE_CONFUSION_TABLE)
  assert.strictEqual(resSummary.isFallback, false)
  assert.ok(resSummary.resultText.startsWith('Roll 1d10:'))
})

test('descriptionContainersText converts linked random tables to prose with distance unit normalization', () => {
  const container: ActionDescriptionContainer = {
    id: 'c1',
    kind: 'random_table',
    outcomeTarget: 'On Hit',
    randomTableId: 'rt-confusion',
  }

  const text = descriptionContainersText([container], false, [SAMPLE_CONFUSION_TABLE])
  assert.ok(text.startsWith('On Hit: Roll 1d10:'))
  assert.ok(text.includes('1: The creature uses all its movement'))
  assert.ok(text.includes('otherwise: The creature shakes off the confusion.'))
})

test('descriptionContainersHtml embeds semantic random table into container and sub-regions', () => {
  const container: ActionDescriptionContainer = {
    id: 'c1',
    kind: 'text',
    outcomeTarget: 'On Hit',
    text: 'Speed reduced by 10ft, if 0ft knocked prone.',
    regions: [
      {
        id: 'r1',
        title: 'Random Aftermath',
        kind: 'random_table',
        randomTableId: 'rt-confusion',
        audience: 'target',
      },
    ],
  }

  const html = descriptionContainersHtml([container], [SAMPLE_CONFUSION_TABLE])
  assert.ok(html.includes('<i>On Hit:</i> Speed reduced by 10 ft., if 0 ft. knocked prone.'))
  assert.ok(html.includes('<strong class="region-title">Random Aftermath</strong>'))
  assert.ok(html.includes('<span class="region-audience badge">Audience: target</span>'))
  assert.ok(html.includes('<table class="outcome-dice-table random-table">'))
  assert.ok(html.includes('<th scope="col">1d10</th>'))
})

test('normalizeContainer preserves randomTableId across containers and sub-regions', () => {
  const norm = normalizeContainer({
    id: 'c1',
    kind: 'random_table',
    randomTableId: 'rt-test',
    regions: [
      {
        id: 'reg1',
        kind: 'random_table',
        randomTableId: 'rt-sub',
      },
    ],
  })

  assert.strictEqual(norm.kind, 'random_table')
  assert.strictEqual(norm.randomTableId, 'rt-test')
  assert.strictEqual(norm.regions?.[0].kind, 'random_table')
  assert.strictEqual(norm.regions?.[0].randomTableId, 'rt-sub')
})

test('outcomesHtml renders linked random table into outcome sector', () => {
  const ability: any = {
    outcomes: [
      {
        trigger: 'hit',
        effects: [],
        presentation: 'horizontal',
        layoutSector: 'col_1',
        randomTableId: 'rt-confusion',
      },
    ],
  }

  const html = outcomesHtml(ability, { randomTables: [SAMPLE_CONFUSION_TABLE] } as any)
  assert.ok(html.includes('class="outcome-sector outcome-horizontal"'))
  assert.ok(html.includes('<table class="outcome-dice-table random-table">'))
  assert.ok(html.includes('<th scope="col">1d10</th>'))
})
