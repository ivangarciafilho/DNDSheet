import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeContainer, descriptionContainersText } from '../../src/core/domain/description-containers.ts'
import { normalizeRandomTables, diagnoseOutcomeRandomTables, resolveTableOutcome } from '../../src/core/domain/random-table.ts'
import type { ActionDescriptionContainer } from '../../src/core/domain/types.ts'

test('A11.9 migration: pre-224 saved containers without randomTableId load unchanged', () => {
  const legacy = JSON.parse(JSON.stringify({ id: 'c1', kind: 'text', text: 'Old prose.' })) as ActionDescriptionContainer
  const out = normalizeContainer(legacy)
  assert.equal(out.kind, 'text')
  assert.equal(out.text, 'Old prose.')
  assert.equal(out.randomTableId, undefined)
})

test('A11.9 migration: normalized containers survive a JSON save/load round trip', () => {
  const once = normalizeContainer({ id: 'c2', kind: 'random_table', randomTableId: 'rt-1' } as ActionDescriptionContainer)
  const twice = normalizeContainer(JSON.parse(JSON.stringify(once)) as ActionDescriptionContainer)
  assert.deepStrictEqual(twice, once)
})

test('A11.9 migration: unresolved table links degrade without throwing', () => {
  const container = { id: 'c3', kind: 'random_table', randomTableId: 'missing' } as ActionDescriptionContainer
  assert.doesNotThrow(() => descriptionContainersText([container], {}, []))
  assert.deepStrictEqual(diagnoseOutcomeRandomTables([], ['missing']).missingTableIds, ['missing'])
})

test('A11.9 migration: absent or malformed random table lists normalize to empty', () => {
  assert.deepStrictEqual(normalizeRandomTables(undefined), [])
  assert.deepStrictEqual(normalizeRandomTables('junk'), [])
})

test('A11.9 resolve: explicit roll uses fallback only when no row matches', () => {
  const table = { id: 't', dice: '1d4', rows: [{ id: 'a', min: 1, max: 2, text: 'Low' }], fallback: 'Else' }
  assert.equal(resolveTableOutcome(table, 2).resultText, 'Low')
  assert.equal(resolveTableOutcome(table, 4).resultText, 'Else')
  assert.equal(resolveTableOutcome(table, 4).isFallback, true)
})

test('A11.9 explicitRollOnly: round-trips through normalizeRandomTables and prompts when roll is omitted', async () => {
  const { normalizeRandomTables } = await import('../../src/core/domain/random-table.ts')
  const normalized = normalizeRandomTables([
    {
      id: 'wild',
      title: 'Wild Surge',
      dice: '1d8',
      rows: [{ id: 'r1', min: 1, max: 4, text: 'Spark' }],
      fallback: 'Flicker',
      explicitRollOnly: true,
    },
    {
      id: 'plain',
      dice: '1d4',
      rows: [{ id: 'p1', min: 1, max: 4, text: 'Calm' }],
    },
  ])
  assert.equal(normalized[0].explicitRollOnly, true)
  assert.equal(normalized[1].explicitRollOnly, undefined)
  assert.deepEqual(resolveTableOutcome(normalized[0]), {
    title: 'Wild Surge',
    dice: '1d8',
    resultText: 'Roll 1d8 on Wild Surge (explicit roll required)',
    isFallback: false,
  })
  assert.equal(resolveTableOutcome(normalized[0], 3).resultText, 'Spark')
  assert.equal(resolveTableOutcome(normalized[0], 7).resultText, 'Flicker')
  assert.equal(resolveTableOutcome(normalized[0], 7).isFallback, true)
})

test('A11.9 exports: formatRandomTableAsHtml, tableToMarkdown, and tableToProse match golden outputs', async () => {
  const { formatRandomTableAsHtml, tableToMarkdown, tableToProse } = await import('../../src/core/domain/random-table.ts')
  const table = {
    id: 'frost-table',
    title: 'Frost Effects',
    dice: '1d6',
    rows: [{ id: 'r1', min: 1, max: 3, text: 'Frost' }],
    fallback: 'Chill',
    explicitRollOnly: true,
  }
  const html = formatRandomTableAsHtml(table)
  assert.match(html, /data-print-table="true"/)
  assert.match(html, /data-explicit-roll-only="true"/)
  assert.match(html, /<th scope="col">1d6<\/th>/)
  assert.match(html, /<tr><td>1–3<\/td><td>Frost<\/td><\/tr>/)
  assert.match(html, /<tr><td><em>Otherwise<\/em><\/td><td>Chill<\/td><\/tr>/)
  assert.equal(
    tableToMarkdown(table),
    '| 1d6 | Result |\n|---|---|\n| 1–3 | Frost |'
  )
  assert.equal(tableToProse(table), 'Roll 1d6: 1–3: Frost; otherwise: Chill.')
})

test('A11.5 goldens: outcomePhrase, text2024, and outcomesHtml match clause, formula, and presentation contracts', async () => {
  const { inferAbility, outcomePhrase, text2024 } = await import('../../src/core/domain/ability-grammar.ts')
  const { outcomesHtml } = await import('../../src/core/domain/outcome-rendering.ts')
  const { buildFormulaContext } = await import('../../src/core/domain/formula.ts')
  const { normalizeRandomTables } = await import('../../src/core/domain/random-table.ts')

  const randomTables = normalizeRandomTables([
    { id: 'chill-tbl', title: 'Chill Surge', dice: '1d4', rows: [{ id: 'c1', min: 1, max: 4, text: 'Freeze' }] },
  ])
  const formulaContext = buildFormulaContext({
    proficiency: 3,
    stats: { STR: 10, DEX: 10, CON: 10, INT: 16, WIS: 10, CHA: 10 },
  })
  const action = {
    id: 'frost-ray',
    name: 'Frost Ray',
    outcomes: [
      {
        id: 'o1',
        trigger: 'hit',
        effects: [{ kind: 'damage' as const, formula: '1d8 + PB', damageType: 'cold' }],
        layoutSector: 'top_right' as const,
        presentation: 'vertical' as const,
        randomTableId: 'chill-tbl',
      },
    ],
  }
  const phrases = outcomePhrase(inferAbility(action), { formulaContext }, 'text2024', 'text')
  assert.deepEqual(phrases, ['Hit: 7 (1d8 + 3) Cold damage.'])
  const rendered2024 = text2024(action, { formulaContext, attackBonus: 6 }, { markup: 'text' })
  assert.ok(rendered2024.includes('7 (1d8 + 3) Cold damage'))
  const html = outcomesHtml(inferAbility(action), { formulaContext, randomTables } as Record<string, unknown>)
  assert.match(html, /class="outcome-sector outcome-vertical"/)
  assert.match(html, /data-sector="top_right"/)
  assert.match(html, /data-print-table="true"/)
  assert.match(html, /Freeze/)
})
