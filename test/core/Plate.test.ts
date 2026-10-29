import test from 'node:test'
import assert from 'node:assert'
import {
  STRIPE_THRESHOLD,
  boldNumbers,
  phaseLabel,
  plainTextLength,
  plateHtml,
  plateRowHtml,
  shouldStripe,
} from '../../src/components/rendering/plate.ts'

test('plate: head cell first, data cells after, body last', () => {
  const html = plateHtml({
    rows: [
      {
        cls: 'action-composite-header',
        cells: [
          { html: '<span class="sb-name">Soul Barrage</span>', head: true, cls: 'name-cell' },
          { html: 'Ranged Spell Attack <strong class="dnd-num">+7</strong>', cls: 'mech-cell' },
        ],
      },
    ],
    body: '<i>On Hit:</i> 5 (1d10) Radiant damage.',
  })
  assert.match(html, /^<div class="sb-plate"><div class="sb-row action-composite-header">/)
  assert.ok(html.indexOf('sb-head') < html.indexOf('mech-cell'))
  assert.ok(html.indexOf('mech-cell') < html.indexOf('sb-body'))
  assert.ok(!html.includes('sb-striped'), 'short bodies are not striped')
})

test('plate: empty cells and empty rows are dropped', () => {
  assert.strictEqual(plateRowHtml({ cells: [{ html: ' ' }, { html: '' }] }), '')
  assert.strictEqual(plateHtml({ rows: [] }), '<div class="sb-plate"></div>')
})

// sanitizeWebString escapes every tag and restores only tags whose text holds no '&',
// so attribute values must never contain characters that need HTML entities.
test('plate: tooltips and help keys stay entity-free so the web sanitizer keeps the tag', () => {
  const row = plateRowHtml({ cells: [{ html: 'x', tip: 'say "hi" <b> & co', help: 'Recharge Die!' }, { html: '  ' }] })
  assert.strictEqual(row, '<div class="sb-row"><div class="sb-cell" title="say \'hi\' b and co" data-help="recharge-die" tabindex="0">x</div></div>')
  const html = plateHtml({
    rows: [{ cells: [{ html: 'a', head: true, tip: '<script>&amp;"' }, { html: 'b', tip: 'Tom & Jerry' }] }],
    body: 'body',
  })
  for (const tag of html.match(/<[^>]*>/g) ?? []) assert.ok(!tag.includes('&'), `entity inside tag: ${tag}`)
  assert.match(plateHtml({ rows: [{ cells: [{ html: 'name', head: true }] }] }), /data-help="entry-name" tabindex="0"/)
})

test('plate: long bodies get reading stripes, measured on visible text', () => {
  const long = 'word '.repeat(40)
  assert.ok(plainTextLength(long) > STRIPE_THRESHOLD)
  assert.ok(shouldStripe(long))
  assert.ok(plateHtml({ rows: [], body: long }).includes('sb-body action-body-text sb-striped zebra-stripe-text'))
  const tagsOnly = `<span class="${'x'.repeat(200)}">short</span>`
  assert.ok(!shouldStripe(tagsOnly), 'markup does not count toward length')
})

test('boldNumbers: numbers with units bold, words and markup untouched', () => {
  assert.strictEqual(
    boldNumbers('3 creatures within 120ft of you'),
    '<strong class="dnd-num">3</strong> creatures within <strong class="dnd-num">120ft</strong> of you'
  )
  assert.strictEqual(boldNumbers('Range 30/120 ft.'), 'Range <strong class="dnd-num">30/120 ft.</strong>')
  assert.strictEqual(boldNumbers('Self'), 'Self')
  assert.strictEqual(boldNumbers('2nd'), '2nd')
  assert.strictEqual(boldNumbers('&#160;'), '&#160;')
})

test('phaseLabel: stage names follow the configured phase word', () => {
  assert.strictEqual(phaseLabel('Phase', 'Final'), 'Phase Final')
  assert.strictEqual(phaseLabel('', 2), 'Phase 2')
  assert.strictEqual(phaseLabel('Form', 'II'), 'Form II')
  assert.strictEqual(phaseLabel('Phase', 'all'), '')
  assert.strictEqual(phaseLabel('Phase', undefined), '')
})
