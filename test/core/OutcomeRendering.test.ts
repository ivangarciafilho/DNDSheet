import test from 'node:test'
import assert from 'node:assert/strict'
import { inferAbility, outcomePhrase, text2024 } from '../../src/core/domain/ability-grammar.ts'
import { outcomesHtml } from '../../src/core/domain/outcome-rendering.ts'
import { descriptionContainersHtml, descriptionContainersText } from '../../src/core/domain/description-containers.ts'
import { buildFormulaContext } from '../../src/core/domain/formula.ts'
import type { MonsterAction } from '../../src/core/domain/types.ts'

const realFormulaContext = { formulaContext: buildFormulaContext({ proficiency: 4, stats: { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 } }) }
const fixture = (): Partial<MonsterAction> => ({ name: 'Flame', description: 'Trailing prose.', outcomes: [{ id: 'hit', trigger: 'hit', effects: [{ kind: 'damage', formula: '1d6 + PB', damageType: 'fire' }], targetFilter: 'hostile', layoutSector: 'top_left', presentation: 'horizontal', diceTable: [{ roll: '1', effect: 'Burn' }] }], descriptionContainers: [{ id: 'note', kind: 'text', outcomeTarget: 'Afterward', text: 'Visible note.' }, { id: 'table', kind: 'table', table: { headers: ['Roll', 'Effect'], rows: [['1', 'Spark']] } }] })

test('normalization preserves and clones compositor data through serialization', () => {
  const input = fixture()
  const normalized = inferAbility(JSON.parse(JSON.stringify(input)))
  assert.equal(normalized.outcomes[0].targetFilter, 'hostile')
  assert.equal(normalized.outcomes[0].layoutSector, 'top_left')
  assert.deepEqual(normalized.outcomes[0].diceTable, input.outcomes![0].diceTable)
  const direct = inferAbility(input)
  direct.outcomes[0].diceTable![0].effect = 'Changed'
  assert.equal(input.outcomes![0].diceTable![0].effect, 'Burn')
})

test('sector rendering resolves formulas and includes each effect and table once', () => {
  const html = outcomesHtml(inferAbility(fixture()), realFormulaContext)
  assert.match(html, /7 \(1d6 \+ 4\) Fire damage/)
  assert.doesNotMatch(html, /PB/)
  assert.equal(html.split('Burn').length - 1, 1)
  assert.equal(html.split('Fire damage').length - 1, 1)
  assert.match(html, /data-sector="top_left"/)
})

test('sector and inline rendering escape every authored clause value', () => {
  const input = fixture()
  const outcome = input.outcomes![0]
  outcome.trigger = '<img>'
  outcome.targetFilter = '<filter>'
  outcome.layoutSector = '" onmouseover="bad'
  outcome.effects = [{ text: '<effect>' }]
  outcome.rider = '<rider>'
  outcome.diceTable = [{ roll: '<roll>', effect: '<table>' }]
  const html = outcomesHtml(inferAbility(input), realFormulaContext)
  for (const tag of ['img', 'filter', 'effect', 'rider', 'roll', 'table']) assert.ok(html.includes(`&lt;${tag}&gt;`))
  assert.doesNotMatch(html, /onmouseover/)
  assert.match(html, /data-sector="all"/)
  assert.ok(outcomePhrase(inferAbility(input), realFormulaContext, 'screen', 'html')[0].includes('&lt;effect&gt;'))
})

test('containers retain target labels and table contents in escaped html and export prose', () => {
  const input = fixture()
  input.descriptionContainers![0].text = '<script>note</script>'
  const html = descriptionContainersHtml(input.descriptionContainers)
  assert.match(html, /&lt;script&gt;note/)
  assert.match(html, /<th scope="col">Roll<\/th>/)
  assert.match(descriptionContainersText(input.descriptionContainers), /Roll \| Effect; 1 \| Spark/)
  const prose = text2024(input, realFormulaContext)
  assert.match(prose, /Afterward: <script>note<\/script>/)
  assert.match(prose, /Spark.*Trailing prose/)
  assert.match(text2024(input, realFormulaContext, { markup: 'html' }), /&lt;script&gt;note/)
})


test('inline outcomes separate following containers and authored prose', () => {
  const ability = inferAbility({ outcomes: [{ trigger: 'hit', effects: [{ text: '5 Fire damage.' }] }] })
  const inline = outcomesHtml(ability)
  assert.match(`${inline}Trailing prose.`, /damage\. Trailing prose/)
  assert.match(`${inline}${descriptionContainersHtml([{ id: 'after', kind: 'text', outcomeTarget: 'Afterward', text: 'Recover.' }])}`, /damage\. <i>Afterward/)
  assert.equal(outcomesHtml(inferAbility({})), '')
})


test('incomplete legacy table containers remain safe through web and prose projection', () => {
  const containers = [{ id: 'legacy', kind: 'table', table: {} }] as unknown as NonNullable<MonsterAction['descriptionContainers']>
  assert.doesNotThrow(() => descriptionContainersHtml(containers))
  assert.doesNotThrow(() => descriptionContainersText(containers))
  assert.match(descriptionContainersHtml(containers), /<tbody><\/tbody>/)
})
