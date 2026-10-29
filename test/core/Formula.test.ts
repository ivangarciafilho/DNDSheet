import test from 'node:test'
import assert from 'node:assert'
import {
  FORMULA_GROUPS,
  FORMULA_REFS,
  buildFormulaContext,
  evaluateFormula,
  formatDiceValue,
  getFormulaRef,
  normalizeLegacyFormula,
  parseFormula,
  renderFormulaMacros,
  resolveNumeric,
  suggestFormulaRefs,
} from '../../src/core/domain/formula.ts'

// CR 4-ish caster: CHA 20 (+5), PB +2, 15d8+45 hit dice, WIS 16
const ctx = buildFormulaContext({
  stats: { STR: 18, DEX: 12, CON: 16, INT: 12, WIS: 16, CHA: 20 },
  proficiency: 2,
  HP: { HD: 15, type: 8, modifier: 45 },
  AC: 15,
  CR: 0.5,
  spellcasting: { level: 15, stat: 'CHA' },
  legendaryActions: { count: 3 },
  speeds: [{ type: 'walk', speed: 30 }, { type: 'fly', speed: 60 }],
  saves: { DEX: { proficient: true }, CON: { override: true, overrideValue: 9 } },
})

const value = (src: string) => {
  const r = evaluateFormula(src, ctx)
  assert.ok(r.ok, `${src}: ${r.ok ? '' : r.error}`)
  return r
}

test('context derives the stat block numbers', () => {
  assert.strictEqual(ctx.hp, 112)
  assert.strictEqual(ctx.spellSaveDc, 15)
  assert.strictEqual(ctx.spellAttack, 7)
  assert.strictEqual(ctx.saves.DEX, 3)
  assert.strictEqual(ctx.saves.CON, 9)
  assert.strictEqual(ctx.saves.STR, 4)
  assert.strictEqual(ctx.passivePerception, 13)
  assert.strictEqual(ctx.speed, 30)
})

test('derived values from the store override computed defaults', () => {
  const c = buildFormulaContext({ stats: { CHA: 20 }, proficiency: 2 }, { spellSaveDc: 17, hp: 140, ac: undefined })
  assert.strictEqual(c.spellSaveDc, 17)
  assert.strictEqual(c.hp, 140)
  assert.strictEqual(c.ac, 10)
})

test('arithmetic follows precedence and rounds down at the end', () => {
  assert.strictEqual(value('2 + 3 * 4').value, 14)
  assert.strictEqual(value('(2 + 3) * 4').value, 20)
  assert.strictEqual(value('-3 + 5').value, 2)
  assert.strictEqual(value('7 / 2').value, 3)
  assert.strictEqual(value('ceil(7 / 2)').value, 4)
  assert.strictEqual(value('10 - 4 - 3').value, 3)
  assert.strictEqual(value('24 / 4 / 2').value, 3)
})

test('references resolve and keep their natural style', () => {
  assert.strictEqual(value('8 + PB + CHA_MOD').text, '15')
  assert.strictEqual(value('PB').text, '+2')
  assert.strictEqual(value('CHA_MOD').text, '+5')
  assert.strictEqual(value('CHA').text, '20')
  assert.strictEqual(value('SPELL_DC').text, '15')
  assert.strictEqual(value('SPELL_ATK').text, '+7')
  assert.strictEqual(value('CR').text, '1/2')
  assert.strictEqual(value('BLOODIED').text, '56')
  assert.strictEqual(value('CANTRIP_DICE').text, '3')
  assert.strictEqual(value('LEGENDARY').text, '3')
})

test('aliases and legacy token spellings resolve', () => {
  assert.strictEqual(value('PROF').text, '+2')
  assert.strictEqual(value('DC:CHA').text, '15')
  assert.strictEqual(value('A:STR').text, '+6')
  assert.strictEqual(value('cha_mod').text, '+5')
  assert.strictEqual(value('{PB} + 2').value, 4)
  assert.strictEqual(value('CANTRIP_TIER').value, 3)
})

test('dice stay symbolic and print average with the roll', () => {
  assert.strictEqual(value('2d6 + STR_MOD').text, '11 (2d6 + 4)')
  assert.strictEqual(value('d20').text, '10 (1d20)')
  assert.strictEqual(value('HD d HD_DIE').text, '67 (15d8)')
  assert.strictEqual(value('HDdHD_DIE').text, '67 (15d8)')
  assert.strictEqual(value('HIT_DIE').text, '4 (1d8)')
  assert.strictEqual(value('HIT_DICE + HP_BONUS').text, '112 (15d8 + 45)')
  assert.strictEqual(value('(PB + 1)d6').text, '10 (3d6)')
  assert.strictEqual(value('PBd6').text, '7 (2d6)')
  assert.strictEqual(value('2 * 1d6').text, '7 (2d6)')
  assert.strictEqual(value('1d6 * 2').text, '7 (2d6)')
  assert.strictEqual(value('2d6 - 1d4').text, '4 (2d6 - 1d4)')
  assert.strictEqual(value('1d10 + 1d10').text, '11 (2d10)')
  assert.strictEqual(value('1d4 - 3').text, '-1 (1d4 - 3)')
  assert.strictEqual(value('CANTRIP_DICE d10').text, '16 (3d10)')
})

test('dice collapse to their average when divided', () => {
  assert.strictEqual(value('1d10 / 2').text, '2')
  assert.strictEqual(value('avg(2d6)').text, '7')
})

test('functions', () => {
  assert.strictEqual(value('max(1, CON_MOD - 5)').value, 1)
  assert.strictEqual(value('min(5, PB)').value, 2)
  assert.strictEqual(value('half(HP)').value, 56)
  assert.strictEqual(value('mod(18)').value, 4)
  assert.strictEqual(value('abs(-4)').value, 4)
  assert.strictEqual(value('round(2.5)').value, 3)
  assert.strictEqual(value('floor(HP / 3)').value, 37)
})

test('a leading + asks for bonus style', () => {
  assert.strictEqual(value('+PB * 2').text, '+4')
  assert.strictEqual(value('+STR_MOD - 6').text, '-2')
})

test('explicit style wins', () => {
  const r = evaluateFormula('PB + CHA_MOD', ctx, { style: 'bonus' })
  assert.ok(r.ok)
  assert.strictEqual(r.text, '+7')
  const n = evaluateFormula('CR', ctx, { style: 'number' })
  assert.ok(n.ok)
  assert.strictEqual(n.text, '0')
})

test('trace substitutes every reference for tooltips', () => {
  assert.strictEqual(value('8 + PB + CHA_MOD').trace, '8 + PB[+2] + CHA_MOD[+5] = 15')
  assert.strictEqual(value('(PB + 1)d6').trace, '(PB[+2] + 1)d6 = 10 (3d6)')
  assert.strictEqual(value('10 - (4 - 3)').trace, '10 - (4 - 3) = 9')
  assert.deepStrictEqual(value('HD d HD_DIE + CON_MOD').refs.sort(), ['CON_MOD', 'HD', 'HD_DIE'])
})

test('errors carry a position and suggestions', () => {
  const unknown = evaluateFormula('8 + CHA_MDO', ctx)
  assert.ok(!unknown.ok)
  assert.match(unknown.error, /Unknown reference "CHA_MDO"/)
  assert.strictEqual(unknown.at, 4)
  assert.ok(unknown.suggestions.includes('CHA_MOD'))

  for (const bad of ['8 +', '(8', '8 )', 'max()', '1 / 0', '2 $ 3', '1d0']) {
    const r = evaluateFormula(bad, ctx)
    assert.ok(!r.ok, `${bad} should fail`)
  }
  assert.ok(!parseFormula('').ok)
})

test('bindings resolve from refs, formulas, legacy numbers and empty values', () => {
  assert.strictEqual(resolveNumeric({ mode: 'ref', ref: 'SPELL_DC' }, ctx).value, 15)
  assert.strictEqual(resolveNumeric({ mode: 'formula', expr: '8 + PB + CON_MOD' }, ctx).value, 13)
  assert.strictEqual(resolveNumeric(15, ctx).text, '15')
  assert.strictEqual(resolveNumeric('DC 17', ctx).value, 17)
  assert.strictEqual(resolveNumeric(undefined, ctx, { fallback: 12 }).value, 12)
  const broken = resolveNumeric('8 + NOPE', ctx, { fallback: 10 })
  assert.strictEqual(broken.ok, false)
  assert.strictEqual(broken.value, 10)
  assert.match(broken.error ?? '', /NOPE/)
  assert.strictEqual(resolveNumeric({ mode: 'ref', ref: 'PB' }, ctx, { style: 'number' }).text, '2')
})

test('suggestions rank exact, prefix and label matches', () => {
  assert.strictEqual(suggestFormulaRefs('PB')[0].id, 'PB')
  assert.strictEqual(suggestFormulaRefs('cha')[0].id, 'CHA')
  assert.ok(suggestFormulaRefs('cha').some((r) => r.id === 'CHA_MOD'))
  assert.strictEqual(suggestFormulaRefs('spell d')[0]?.id, 'SPELL_DC')
  assert.strictEqual(suggestFormulaRefs('SPELL_D')[0].id, 'SPELL_DC')
  assert.strictEqual(suggestFormulaRefs('hit')[0].group, 'hit_points')
  assert.ok(suggestFormulaRefs('').length > 0)
})

test('catalog: groups and references are alphabetical, ids and aliases unique', () => {
  const groupLabels = FORMULA_GROUPS.map((g) => g.label)
  assert.deepStrictEqual(groupLabels, [...groupLabels].sort((a, b) => a.localeCompare(b)))
  for (const group of FORMULA_GROUPS) {
    const labels = FORMULA_REFS.filter((r) => r.group === group.id).map((r) => r.label)
    assert.ok(labels.length > 0, `${group.id} is empty`)
    assert.deepStrictEqual(labels, [...labels].sort((a, b) => a.localeCompare(b)), `${group.id} not sorted`)
  }
  const keys = FORMULA_REFS.flatMap((r) => [r.id, ...(r.aliases ?? [])].map((k) => k.toUpperCase()))
  assert.strictEqual(new Set(keys).size, keys.length)
  for (const ref of FORMULA_REFS) {
    assert.ok(ref.tip.length > 10, `${ref.id} needs a tooltip`)
    assert.strictEqual(getFormulaRef(ref.id), ref)
  }
})

test('legacy free-text spellings normalize to references', () => {
  const legacy = (src: string) => evaluateFormula(normalizeLegacyFormula(src), ctx)
  const a = legacy('8 + PROFICIENCY BONUS + CHA MOD')
  assert.ok(a.ok && a.value === 15)
  const b = legacy('2X PB + STR SCORE')
  assert.ok(b.ok && b.value === 22)
  const c = legacy('HIT DICE * 2')
  assert.ok(c.ok && c.value === 30)
  const d = legacy('MAX(STR_MOD, DEX_MOD)')
  assert.ok(d.ok && d.value === 4)
})

test('dice formatting helpers', () => {
  assert.strictEqual(formatDiceValue({ flat: 3, dice: [{ die: 4, count: 1 }] }, 'bonus'), '+3 + 1d4')
  assert.strictEqual(formatDiceValue({ flat: 0, dice: [{ die: 4, count: 1 }] }, 'bonus'), '+1d4')
  assert.strictEqual(formatDiceValue({ flat: -2, dice: [] }, 'bonus'), '-2')
})

test('macros inside rich text: formulas render, context tokens and junk stay', () => {
  const html = 'Hit: {2d6 + STR_MOD} slashing. DC {SPELL_DC}. {action.name} {NOT_A_REF} {HD d HD_DIE}'
  assert.strictEqual(
    renderFormulaMacros(html, ctx),
    'Hit: 11 (2d6 + 4) slashing. DC 15. {action.name} {NOT_A_REF} 67 (15d8)'
  )
  assert.strictEqual(renderFormulaMacros('no braces', ctx), 'no braces')
})
