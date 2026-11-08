import test from 'node:test'
import assert from 'node:assert/strict'
import { exportMarkup, splitEntryLead } from '../../src/core/domain/export-markup.ts'

// A modern plate as the web sheet renders it; exports must never carry this markup.
const plate =
  '<div class="sb-plate"><div class="sb-row"><span class="sb-name">Solar Strike</span><span>Recharge 5–6</span>' +
  '<span><strong class="dnd-num">+7</strong> to hit</span></div>' +
  '<div class="sb-body"><i>On Hit:</i> 12 radiant damage.<div>Second paragraph &amp; rider.</div></div></div>'

test('export markup: Markdown keeps card text and paragraph boundaries without web markup', () => {
  const text = exportMarkup(plate, 'markdown')
  for (const value of ['Solar Strike', 'Recharge 5–6', '+7 to hit', '*On Hit:* 12 radiant damage.', '\nSecond paragraph & rider.']) {
    assert.ok(text.includes(value), value)
  }
  assert.doesNotMatch(text, /<\/?(?:div|span|strong)|sb-plate|data-help/)
})

test('export markup: classed emphasis is web chrome, authored emphasis stays', () => {
  const hp = '<strong class="dnd-num">52</strong> <span class="dnd-hp-hd">(7d10 + 14)</span>'
  assert.equal(exportMarkup(hp, 'markdown'), '52 (7d10 + 14)')
  assert.equal(exportMarkup(hp, 'latex'), '52 (7d10 + 14)')
  assert.equal(exportMarkup('<strong>Bold</strong> and <b>bolder</b>', 'markdown'), '**Bold** and **bolder**')
  assert.equal(exportMarkup('<strong>Bold</strong>', 'latex'), '\\textbf{Bold}')
})

test('export markup: adjacent cells are separated once, never before punctuation', () => {
  assert.equal(exportMarkup('<span>Uses</span><span>3/Day</span>  <span>Name</span>', 'markdown'), 'Uses 3/Day Name')
  assert.equal(exportMarkup('<span class="adv">Perception +4</span>, Stealth +6', 'markdown'), 'Perception +4, Stealth +6')
})

test('export markup: comparison signs in prose stay text', () => {
  assert.equal(exportMarkup('HP < 10 and AC > 5', 'markdown'), 'HP \\< 10 and AC \\> 5')
  assert.equal(exportMarkup('HP < 10 and AC > 5', 'latex'), 'HP \\textless{} 10 and AC \\textgreater{} 5')
})

test('export markup: LaTeX produces balanced commands and escapes authored special characters', () => {
  const text = exportMarkup('<b><i>Veil.</i></b> <b>Bright <i>light</i></b>: 50% & $5_ {x} #1 \\ path', 'latex')
  assert.ok(text.startsWith('\\DndMonsterAction{Veil}'))
  assert.ok(text.includes('\\textbf{Bright \\emph{light}}'))
  assert.ok(text.includes('50\\% \\& \\$5\\_ \\{x\\} \\#1 \\textbackslash{} path'))
})

test('export markup: LaTeX strips card chrome while keeping every field and line', () => {
  const text = exportMarkup(plate, 'latex')
  for (const value of ['Solar Strike', 'Recharge 5–6', '+7 to hit', '\\emph{On Hit:}', '12 radiant damage.', 'Second paragraph \\& rider.']) {
    assert.ok(text.includes(value), value)
  }
  assert.doesNotMatch(text, /<\/?(?:div|span)|sb-plate/)
})

test('export markup: breaks, entities and embedded scripts are normalised without leaking tags', () => {
  const text = exportMarkup('<p>A&nbsp;B<br>C &#x26; D &#39;E&#39;</p><script>bad()</script><style>bad{}</style><u>Note</u>', 'markdown')
  assert.equal(text, "A B\nC & D 'E'\nNote")
})

test('export markup: an entry lead splits into its title and the body after it', () => {
  const entry = '<b><i>Wing Attack (Costs 2 Actions).</i></b> <i>Strength Saving Throw:</i> DC 19.'
  assert.deepEqual(splitEntryLead(entry), { title: 'Wing Attack (Costs 2 Actions)', body: '<i>Strength Saving Throw:</i> DC 19.' })
  assert.deepEqual(splitEntryLead('Plain prose.'), { title: '', body: 'Plain prose.' })
})

test('export markup: a misnested lead still exports as the entry name', () => {
  const trait = '<b><i>Awakening (Recharges after a Long Rest).</b></i> At zero HP.'
  assert.deepEqual(splitEntryLead(trait), { title: 'Awakening (Recharges after a Long Rest)', body: 'At zero HP.' })
  assert.equal(exportMarkup(trait, 'latex'), '\\DndMonsterAction{Awakening (Recharges after a Long Rest)} At zero HP.')
  assert.equal(exportMarkup(trait, 'markdown'), '***Awakening (Recharges after a Long Rest).*** At zero HP.')
})
