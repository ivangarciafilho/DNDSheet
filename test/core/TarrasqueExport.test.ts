import test from 'node:test'
import assert from 'node:assert/strict'
import { tarrasqueDamageDice, tarrasqueEntry, tarrasqueText } from '../../src/core/domain/tarrasque-export.ts'

test('Tarrasque: shared prose lead becomes name once, mechanics remain in desc', () => {
  assert.deepEqual(tarrasqueEntry('<b><i>Pulse (2/Day).</i></b> <i>Attack Roll:</i> +7. Hit: 5 radiant damage.', '', 7), {
    name: 'Pulse (2/Day)', desc: 'Attack Roll: +7. Hit: 5 radiant damage.', attack_bonus: 7,
  })
})

test('Tarrasque: duplicate printed names retain independently supplied bonuses', () => {
  const prose = '<b><i>Claw.</i></b> Authored result.'
  assert.deepEqual([tarrasqueEntry(prose, '', 3), tarrasqueEntry(prose, '', 9)].map((entry) => entry.attack_bonus), [3, 9])
})

test('Tarrasque: an explicit zero bonus is retained', () => {
  assert.equal(tarrasqueEntry('<b><i>Touch.</i></b> Attack Roll: 0.', '', 0).attack_bonus, 0)
})

test('Tarrasque: custom prose without a lead retains its full body and source name', () => {
  assert.deepEqual(tarrasqueEntry('<b>Custom preamble</b><br>Full effect.', 'Source name'), {
    name: 'Source name', desc: 'Custom preamble\nFull effect.', attack_bonus: 0,
  })
})

test('Tarrasque: old misnested legendary leads retain cost and full outcome', () => {
  assert.deepEqual(tarrasqueEntry('<b><i>Sunburst (Costs 2 Actions).</b></i> Failure: 7 fire damage.'), {
    name: 'Sunburst (Costs 2 Actions)', desc: 'Failure: 7 fire damage.', attack_bonus: 0,
  })
})

test('Tarrasque: reaction trigger and response retain line separation', () => {
  assert.equal(tarrasqueEntry('<b><i>Retort.</i></b> <i>Trigger:</i> When hit.<br><i>Response:</i> Takes 5 damage.').desc,
    'Trigger: When hit.\nResponse: Takes 5 damage.')
})

test('Tarrasque: header number pills, help hooks and advantage chrome become plain text', () => {
  assert.equal(tarrasqueText('<span class="dnd-num" data-help="sense">60</span> ft. <strong class="dnd-adv">Perception +4 ▲▲</strong>'), '60 ft. Perception +4 ▲▲')
})

test('Tarrasque: table rows and cells remain readable without HTML', () => {
  assert.equal(tarrasqueText('<table class="outcome-dice-table"><thead><tr><th scope="col">Roll</th><th>Effect</th></tr></thead><tbody><tr><td>1–2</td><td>Burn</td></tr><tr><td>3</td><td>Frost</td></tr></tbody></table>'), 'Roll | Effect\n1–2 | Burn\n3 | Frost')
})

test('Tarrasque: encoded author angle brackets remain literal after markup removal', () => {
  assert.equal(tarrasqueText('Each &lt;recipient&gt;; &lt;table&gt;not markup&lt;/table&gt; &amp; allies.'), 'Each <recipient>; <table>not markup</table> & allies.')
})

test('Tarrasque: script/style payloads and actual markup never leak into fields', () => {
  assert.equal(tarrasqueText('<script>alert(1)</script><style>bad{}</style><div><img src=x onerror=bad>Safe &quot;text&quot;</div>'), 'Safe "text"')
})

test('Tarrasque: numeric entities decode safely while invalid code points remain authored text', () => {
  assert.equal(tarrasqueText('&#65; &#x1f525; &#0; &#xD800;'), 'A 🔥 &#0; &#xD800;')
})

test('Tarrasque: comparison signs, apostrophes and blank headers survive', () => {
  assert.equal(tarrasqueText('HP < 10 and AC > 5; it&apos;s safe.'), "HP < 10 and AC > 5; it's safe.")
  assert.equal(tarrasqueText(''), '')
})

test('Tarrasque: physical damage dice preserve base and each extra die independently', () => {
  const attack = { damage: { count: 2, dice: 6 }, additionalDamage: [{ count: 1, dice: 8 }, { count: 3, dice: 4 }] }
  const before = JSON.stringify(attack)
  assert.equal(tarrasqueDamageDice(attack), '2d6+1d8+3d4')
  assert.equal(JSON.stringify(attack), before)
})

test('Tarrasque: single physical damage and negative modifier metadata keep their meaning', () => {
  assert.equal(tarrasqueDamageDice({ damage: { count: 1, dice: 10 }, additionalDamage: [] }), '1d10')
  assert.equal(tarrasqueEntry('<b><i>Weak strike.</i></b> Hit: 1 damage.', '', -2).attack_bonus, -2)
})


test('phase prefixes preserve cadence in the title without duplicating the lead', () => {
  const entry = tarrasqueEntry('<span class="dnd-pool-badge">[Phase 2]</span> <b><i>Pulse (2/Day).</i></b> Hit: 7 fire damage.', 'Pulse', 7)
  assert.equal(entry.name, 'Pulse (2/Day)')
  assert.equal(entry.desc, '[Phase 2] Hit: 7 fire damage.')
})
