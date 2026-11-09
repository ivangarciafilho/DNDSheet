import test from 'node:test'
import assert from 'node:assert/strict'
import { ATTACK_KINDS, cellPatch, chainView, parseAbilityNumber, validateCell } from '../../src/core/domain/composer-chain.ts'
import type { ChainCellView, ChainRowView } from '../../src/core/domain/composer-chain.ts'
import { ROLE_CHAINS } from '../../src/core/domain/action-composer.ts'
import { inferAbility, scopePhrase } from '../../src/core/domain/ability-grammar.ts'
import type { MonsterAction } from '../../src/core/domain/types.ts'

function action(overrides: Partial<MonsterAction> = {}): MonsterAction {
  return {
    id: 'chain-test',
    name: 'Soul Barrage',
    description: '',
    recharge: '',
    legendaryOnly: false,
    limitedUse: { count: 0, rate: '' },
    stat: 'none',
    save: { override: false, overrideValue: 0 },
    range: '',
    effects: [],
    customPreamble: false,
    bonusAction: false,
    crAnnotation: { maxDamage: 0, maxSave: 0, maxModifier: 0, multitarget: false, ehpMultiplier: 1, ehpModifier: 0, acModifier: 0, include: true },
    ...overrides,
  }
}

const soulBarrage = () => action({
  school: 'Evocation',
  spellLevel: 'Cantrip',
  components: ['V', 'S'],
  actionType: 'spell_attack',
  attackReach: 'ranged',
  attackSource: 'spell',
  targeting: {
    count: 3,
    countMode: 'up_to',
    kind: 'creatures',
    qualifier: 'which you can see',
    range: { distance: 120, unit: 'ft', relation: 'within', origin: 'you' },
    planes: ['Ethereal', 'Material'],
  },
  outcomes: [{ trigger: 'hit', effects: [{ kind: 'damage', formula: '1d10', damageType: 'radiant' }], rider: 'The target sheds light.' }],
})

const flat = (rows: ChainRowView[]): Record<string, ChainCellView> =>
  Object.fromEntries(rows.flatMap((row) => row.cells).map((cell) => [cell.id, cell]))

test('chain rows follow the plate: head, mechanics, scope, outcomes, prose', () => {
  const rows = chainView('action', soulBarrage(), { usage: 'Recharge 5–6', attackBonus: 7 })
  assert.deepStrictEqual(rows.map((row) => row.row), ['head', 'mechanics', 'scope', 'outcomes', 'prose'])
  assert.deepStrictEqual(rows[0].cells.map((cell) => cell.id), ['usage', 'name', 'components', 'discipline', 'tier', 'duration'])
  assert.deepStrictEqual(rows[1].cells.map((cell) => cell.id), ['attack', 'attack-bonus', 'save-ability'])
  assert.deepStrictEqual(rows[2].cells.map((cell) => cell.id), ['target-count', 'target-kind', 'target-qualifier', 'target-range', 'target-area', 'target-planes'])
  assert.deepStrictEqual(rows[3].cells.map((cell) => cell.id), ['outcomes'])
})

test('head chips keep the plate word order: a spell level leads its school, a cantrip follows it', () => {
  const head = (spellLevel: string) => chainView('action', action({ school: 'Evocation', spellLevel }))[0].cells.map((cell) => cell.id)
  assert.deepStrictEqual(head('2nd Level'), ['usage', 'name', 'components', 'tier', 'discipline', 'duration'])
  assert.deepStrictEqual(head('Cantrip'), ['usage', 'name', 'components', 'discipline', 'tier', 'duration'])
  assert.deepStrictEqual(head(''), ['usage', 'name', 'components', 'discipline', 'tier', 'duration'])
})

test('set chips read like the plate they become', () => {
  const view = flat(chainView('action', soulBarrage(), { usage: 'Recharge 5–6', attackBonus: 7 }))
  assert.strictEqual(view.usage.text, 'Recharge 5–6')
  assert.strictEqual(view.discipline.text, 'Evocation')
  assert.strictEqual(view.tier.text, 'Cantrip')
  assert.strictEqual(view.name.text, 'Soul Barrage')
  assert.strictEqual(view.components.text, 'V, S')
  assert.deepStrictEqual([view.duration.state, view.duration.text], ['empty', 'Duration'])
  assert.strictEqual(view.attack.text, 'Ranged Spell Attack')
  assert.deepStrictEqual([view['attack-bonus'].text, view['attack-bonus'].auto], ['+7', true])
  assert.strictEqual(view['save-ability'].state, 'empty')
  assert.strictEqual(view['target-count'].text, 'up to 3')
  assert.strictEqual(view['target-range'].text, 'within 120 ft. of you')
  assert.strictEqual(view['target-planes'].text, 'across the Ethereal and Material Planes')
  assert.deepStrictEqual(view.outcomes.items, ['On Hit: 1d10 Radiant damage. The target sheds light.'])

  const scope = ['target-count', 'target-kind', 'target-qualifier', 'target-range', 'target-planes'].map((id) => view[id].text).join(' ')
  assert.strictEqual(scope, scopePhrase(inferAbility(soulBarrage())))
})

test('save chips appear with the save and show the resolved DC', () => {
  const mechanics = chainView('action', action({ stat: 'CON' }), { saveDc: 13 })[1].cells
  assert.deepStrictEqual(mechanics.map((cell) => cell.id), ['attack', 'save-ability', 'save-dc'])
  assert.strictEqual(mechanics[1].text, 'Constitution Save')
  assert.deepStrictEqual([mechanics[2].text, mechanics[2].auto], ['DC 13', true])
  const fixed = chainView('action', action({ stat: 'CON', save: { override: true, overrideValue: 17 } }), { saveDc: 17 })[1].cells
  assert.deepStrictEqual([fixed[2].text, fixed[2].auto], ['DC 17', false])
})

test('legacy values stay visible and are flagged when structured data hides them from the plate', () => {
  const legacyOnly = action({ range: 'Self (within the visible aura)', effects: [{ case: 'Failure', effect: 'Pushed 10 feet.' }] })
  const plain = flat(chainView('action', legacyOnly))
  assert.strictEqual(plain['legacy-range'].text, 'Self (within the visible aura)')
  assert.strictEqual(plain['legacy-range'].shadowed, false)
  assert.deepStrictEqual(plain['legacy-effects'].items, ['Failure: Pushed 10 feet.'])
  assert.strictEqual(plain['legacy-effects'].shadowed, false)

  const mixed = flat(chainView('action', { ...legacyOnly, targeting: { count: 2, kind: 'creatures' }, outcomes: [{ trigger: 'hit', effects: [] }] }))
  assert.strictEqual(mixed['legacy-range'].shadowed, true)
  assert.strictEqual(mixed['legacy-effects'].shadowed, true)

  const parsed = flat(chainView('action', { ...legacyOnly, range: 'within 120 ft.', targeting: { count: 2, kind: 'creatures' } }))
  assert.strictEqual(parsed['legacy-range'].shadowed, false, 'a parseable legacy range still reaches the plate')
})

test('legacy text that only repeats what the plate already prints is not shown twice', () => {
  const templated = action({
    range: 'all creatures in a 20-foot-radius sphere',
    stat: 'CON',
    targeting: { count: 'all', kind: 'creatures', area: { shape: 'radius sphere', distance: 20, unit: 'ft' } },
  })
  assert.strictEqual(flat(chainView('action', templated))['legacy-range'], undefined)
  const conflicting = flat(chainView('action', { ...templated, range: 'Self (20-foot aura)' }))
  assert.deepStrictEqual([conflicting['legacy-range'].text, conflicting['legacy-range'].shadowed], ['Self (20-foot aura)', true])
})

test('the attack chip sets reach, source and the legacy action type together, and clears them together', () => {
  const legacy = action({ actionType: 'spell_attack' })
  assert.strictEqual(flat(chainView('action', legacy)).attack.text, 'Spell Attack')

  const set = cellPatch(legacy, 'attack', 'melee-weapon')
  assert.deepStrictEqual(set, { attackReach: 'melee', attackSource: 'weapon', actionType: 'weapon_attack' })
  const cleared = cellPatch({ ...legacy, ...set }, 'attack', '')
  assert.deepStrictEqual(cleared, { attackReach: undefined, attackSource: undefined, actionType: undefined })
  assert.strictEqual(inferAbility({ ...legacy, ...set, ...cleared }).attackSource, undefined)
  assert.deepStrictEqual(
    cellPatch(action({ actionType: 'save_ability' }), 'attack', ''),
    { attackReach: undefined, attackSource: undefined, actionType: 'save_ability' }
  )
  assert.deepStrictEqual(ATTACK_KINDS.map((kind) => kind.label), [
    'Melee Weapon Attack', 'Ranged Weapon Attack', 'Melee or Ranged Weapon Attack',
    'Melee Spell Attack', 'Ranged Spell Attack', 'Melee or Ranged Spell Attack',
  ])
})

test('scope patches merge into targeting, never mutate the action, and drop empty targeting', () => {
  const input = soulBarrage()
  const before = structuredClone(input)

  const count = cellPatch(input, 'target-count', { count: 2, mode: 'exact' })
  assert.deepStrictEqual([count.targeting?.count, count.targeting?.countMode, count.targeting?.kind], [2, 'exact', 'creatures'])
  assert.ok(!('range' in (cellPatch(input, 'target-range', '').targeting ?? {})))
  assert.ok(!('planes' in (cellPatch(input, 'target-planes', []).targeting ?? {})))
  assert.deepStrictEqual(cellPatch(action({ targeting: { kind: 'creatures' } }), 'target-kind', ''), { targeting: undefined })
  assert.deepStrictEqual(
    cellPatch(input, 'target-area', { shape: 'cone', distance: 15, unit: 'ft' }).targeting?.area,
    { shape: 'cone', distance: 15, unit: 'ft' }
  )
  assert.deepStrictEqual(input, before)
})

test('outcome, save, component and legacy patches keep the stored shapes the renderer reads', () => {
  const input = soulBarrage()
  assert.deepStrictEqual(cellPatch(input, 'outcomes', []), { outcomes: undefined })
  const outcomes = [{ trigger: 'failure', effects: [{ kind: 'damage' as const, formula: '2d6', damageType: 'fire' }] }]
  const next = cellPatch(input, 'outcomes', outcomes)
  assert.deepStrictEqual(next.outcomes, outcomes)
  assert.notStrictEqual(next.outcomes, outcomes, 'outcomes are copied, not shared with the editor draft')
  assert.deepStrictEqual(cellPatch(input, 'save-dc', 15), { save: { override: true, overrideValue: 15 } })
  assert.deepStrictEqual(cellPatch(input, 'save-dc', ''), { save: { override: false, overrideValue: 0 } })
  assert.deepStrictEqual(cellPatch(input, 'save-ability', ''), { stat: 'none' })
  assert.deepStrictEqual(cellPatch(input, 'attack-bonus', ''), { attackBonus: undefined })
  assert.deepStrictEqual(cellPatch(input, 'components', ['S', 'V', 'C']), { components: ['V', 'S', 'C'] })
  assert.deepStrictEqual(cellPatch(input, 'discipline', ''), { school: undefined })
  assert.deepStrictEqual(cellPatch(input, 'legacy-range', ''), { range: '' })
  assert.deepStrictEqual(cellPatch(input, 'unknown-cell', 'x'), {})
})

test('numbers accept plain values, formulas and nothing; anything else is invalid', () => {
  assert.deepStrictEqual(parseAbilityNumber('3'), { ok: true, value: 3 })
  assert.deepStrictEqual(parseAbilityNumber(' PB '), { ok: true, value: 'PB' })
  assert.deepStrictEqual(parseAbilityNumber(''), { ok: true, value: undefined })
  assert.strictEqual(parseAbilityNumber('2 +').ok, false)
})

test('editors refuse values the plate cannot print', () => {
  assert.strictEqual(validateCell('name', '  '), 'Name is required')
  assert.strictEqual(validateCell('name', 'Rend'), '')
  assert.strictEqual(validateCell('save-dc', 0), 'Use a whole number from 1 to 40')
  assert.strictEqual(validateCell('save-dc', ''), '')
  assert.strictEqual(validateCell('attack-bonus', 2.5), 'Use a whole number')
  assert.strictEqual(validateCell('attack-bonus', -1), '')
  assert.strictEqual(validateCell('target-count', { count: 'all' }), '')
  assert.strictEqual(validateCell('target-count', { count: 'PB', mode: 'up_to' }), '')
  assert.strictEqual(validateCell('target-count', { count: 0 }), 'Use a count of at least 1, all, or a formula')
  assert.strictEqual(validateCell('target-range', { distance: 'PB *', unit: 'ft' }), 'Distance must be a number or a formula')
  assert.strictEqual(validateCell('target-range', { distance: 120, unit: 'ft', relation: 'within', origin: 'you' }), '')
  assert.strictEqual(validateCell('target-area', { shape: '', distance: 20, unit: 'ft' }), 'Choose a shape')
  assert.strictEqual(
    validateCell('outcomes', [{ trigger: 'hit', effects: [{ kind: 'damage', formula: '2d6 +' }] }]),
    'Damage needs a formula such as 2d6 + STR_MOD'
  )
  assert.strictEqual(validateCell('outcomes', [{ trigger: ' ', effects: [] }]), 'Every outcome needs a trigger')
  assert.strictEqual(validateCell('outcomes', [{ trigger: 'hit', effects: [{ kind: 'damage', formula: '2d6 + STR_MOD', damageType: 'slashing' }] }]), '')
})

test('a blank name is flagged instead of silently rendering an empty head', () => {
  assert.strictEqual(flat(chainView('action', action({ name: '  ' }))).name.invalid, 'Name is required')
  assert.strictEqual(flat(chainView('action', soulBarrage())).name.invalid, undefined)
})

test('legendary and mythic entries edit their action-point cost in the usage slot', () => {
  for (const role of ['legendary', 'mythic'] as const) {
    const usage = chainView(role, soulBarrage(), { usage: 'Costs 2 Actions' })[0].cells[0]
    assert.deepStrictEqual([usage.id, usage.label, usage.text, usage.state], ['usage', 'Cost', 'Costs 2 Actions', 'set'])
    assert.strictEqual(ROLE_CHAINS[role].find((cell) => cell.id === 'usage')?.field, 'cost')
  }
})


test('weapon provenance is an authored catalog cell with validated non-destructive patches', () => {
  const input = action({ attackSource: 'weapon', attackReach: 'ranged', attackBonus: 11 })
  const label = 'Finesse thrown melee weapon (better of STR and DEX)'
  assert.equal(validateCell('weapon-ability', label), '')
  assert.ok(validateCell('weapon-ability', 'guess from name'))
  const patch = cellPatch(input, 'weapon-ability', label)
  assert.deepEqual(patch, { weaponAttackAbility: 'finesse_thrown' })
  const rows = chainView('action', { ...input, ...patch })
  assert.equal(rows.flatMap(row => row.cells).find(cell => cell.id === 'weapon-ability')?.text, label)
  assert.equal(input.weaponAttackAbility, undefined)
  assert.equal(input.attackBonus, 11)
  assert.deepEqual(cellPatch(input, 'weapon-ability', ''), { weaponAttackAbility: undefined })
  assert.ok(!chainView('action', action({ attackSource: 'spell' })).flatMap(row => row.cells).some(cell => cell.id === 'weapon-ability'))
})
