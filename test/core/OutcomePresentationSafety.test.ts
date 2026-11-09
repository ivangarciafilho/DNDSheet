import test from 'node:test'
import assert from 'node:assert/strict'
import { outcomesHtml } from '../../src/core/domain/outcome-rendering.ts'
import { normalizeOutcomeData } from '../../src/core/domain/outcome-data.ts'
import { inferAbility } from '../../src/core/domain/ability-grammar.ts'

const render = (outcomes: unknown) => outcomesHtml({ ...inferAbility({}), outcomes: outcomes as ReturnType<typeof normalizeOutcomeData> })

test('outcome presentation accepts malformed optional legacy fields without mutation or lost later prose', () => {
  const source = [null, { trigger: '', effects: null, diceTable: [null, { roll: 0, effect: '' }] }, {
    trigger: 'Custom result', effects: [null, { kind: 'custom', text: 'Later authored effect' }],
    rider: 7, refs: {}, presentation: 'unknown', layoutSector: 'unknown',
  }]
  const before = JSON.stringify(source)
  const html = render(source)
  assert.equal(JSON.stringify(source), before)
  assert.match(html, /Later authored effect/)
  assert.match(html, /7/)
  assert.equal((html.match(/class="outcome-sector /g) ?? []).length, 3)
  assert.match(html, /<tr><td><\/td><td><\/td><\/tr><tr><td>0<\/td><td><\/td><\/tr>/)
  assert.doesNotMatch(html, /undefined|\[object Object\]/)
})

test('unknown sector and presentation cannot become markup and valid custom prose survives', () => {
  const html = render([{ trigger: '<img src=x onerror="attack()">', effects: [{ text: '<script>attack()</script>' }],
    targetFilter: '<svg/onload=attack()>', presentation: '"><script>attack()</script>', layoutSector: '"><script>attack()</script>',
    diceTable: [{ roll: '<b>1</b>', effect: '<img onerror="attack()">' }],
  }])
  assert.match(html, /outcome-inline" data-sector="all"/)
  assert.match(html, /&lt;script&gt;attack\(\)&lt;\/script&gt;/)
  assert.match(html, /&lt;b&gt;1&lt;\/b&gt;/)
  assert.doesNotMatch(html, /<script|<img|<svg/)
})

test('dice tables expose contextual captions and column headers while preserving valid order', () => {
  const html = render([{ trigger: 'Failure', recipient: 'each creature', presentation: 'vertical', layoutSector: 'row_2',
    effects: [{ text: 'First effect' }, { formula: '2d6', damageType: 'fire' }], rider: 'Then retreat',
    diceTable: [{ roll: '1', effect: '' }, { roll: '', effect: 'Second row' }],
  }])
  assert.match(html, /outcome-vertical" data-sector="row_2"/)
  assert.match(html, /<caption>Failure, each creature — roll effects<\/caption>/)
  assert.match(html, /<th scope="col">Roll<\/th><th scope="col">Effect<\/th>/)
  assert.ok(html.indexOf('First effect') < html.indexOf('2d6 Fire damage'))
  assert.ok(html.indexOf('2d6 Fire damage') < html.indexOf('Then retreat'))
  assert.match(html, /<tr><td>1<\/td><td><\/td><\/tr><tr><td><\/td><td>Second row<\/td><\/tr>/)
})

test('non-array outcomes and optional dice tables render safely', () => {
  assert.equal(render(null), '')
  assert.equal(render({ trigger: 'Hit' }), '')
  assert.match(render([{ trigger: 'Custom', effects: [{ text: 'Authored clause' }], diceTable: { length: 3 } }]), /Authored clause/)
})

test('linked outcome rendering skips null legacy random-table entries without dropping the inline fallback', () => {
  const ability = inferAbility({ outcomes: [{ id: 'linked', trigger: 'hit', randomTableId: 'missing', effects: [{ text: 'Keep this result' }], diceTable: [{ roll: '1', effect: 'Inline fallback' }] }] })
  const html = outcomesHtml(ability, { randomTables: [null] as never })
  assert.match(html, /Keep this result/)
  assert.match(html, /Inline fallback/)
  assert.doesNotMatch(html, /undefined/)
})
