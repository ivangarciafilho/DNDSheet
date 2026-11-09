import test from 'node:test'
import assert from 'node:assert'
import {
  inferAbility,
  mechanicsPhrase,
  outcomePhrase,
  scopePhrase,
  text2024,
} from '../../src/core/domain/ability-grammar.ts'
import { buildFormulaContext } from '../../src/core/domain/formula.ts'
import type { MonsterAction } from '../../src/core/domain/types.ts'

const formulaContext = (proficiency: number) => buildFormulaContext({
  proficiency,
  stats: { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 },
})

function action(overrides: Partial<MonsterAction> = {}): MonsterAction {
  return {
    id: 'ability-test',
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

test('explicit ability fields produce the same mechanics, scope, and outcome phrases without mutating the action', () => {
  const input = action({
    actionType: 'spell_attack',
    attackReach: 'ranged',
    attackSource: 'spell',
    targeting: {
      count: 3,
      countMode: 'up_to',
      kind: 'creatures',
      qualifier: 'which you can see',
      range: { distance: 120, unit: 'ft', relation: 'within', origin: 'you' },
    },
    outcomes: [{
      trigger: 'hit',
      effects: [{ kind: 'damage', formula: '1d10', damageType: 'radiant' }],
      rider: 'If all attacks hit the same creature, it is knocked Prone 20 feet away from you.',
    }],
  })
  const before = structuredClone(input)
  const ability = inferAbility(input)

  assert.deepStrictEqual(mechanicsPhrase(ability, { attackBonus: 7 }), ['Ranged Spell Attack +7'])
  assert.strictEqual(scopePhrase(ability), 'up to 3 creatures which you can see within 120 ft. of you')
  assert.deepStrictEqual(outcomePhrase(ability, { formulaContext: formulaContext(2) }), [
    'On Hit: 5 (1d10) Radiant damage. If all attacks hit the same creature, it is knocked Prone 20 feet away from you.',
  ])
  assert.strictEqual(
    text2024(input, { attackBonus: 7, formulaContext: formulaContext(2) }),
    'Ranged Attack Roll: +7, up to three creatures which you can see within 120 ft. of you. Hit: 5 (1d10) Radiant damage. If all attacks hit the same creature, it is knocked Prone 20 feet away from you.'
  )
  assert.deepStrictEqual(input, before)
})

test('save abilities retain area, origin, and plane qualifiers in screen and 2024 text', () => {
  const input = action({
    actionType: 'save_ability',
    stat: 'CHA',
    save: { override: true, overrideValue: 15 },
    name: 'Veil of Radiance',
    targeting: {
      count: 'all',
      kind: 'creatures',
      range: { distance: 20, unit: 'ft', relation: 'within', origin: 'you' },
      planes: ['Ethereal', 'Material'],
    },
  })
  const ability = inferAbility(input)

  assert.deepStrictEqual(mechanicsPhrase(ability, { saveDc: 15 }), ['Charisma Save 15'])
  assert.strictEqual(scopePhrase(ability), 'all creatures within 20 ft. of you across the Ethereal and Material Planes')
  assert.strictEqual(
    text2024(input, { saveDc: 15 }),
    'Charisma Saving Throw: DC 15, all creatures within 20 ft. of you across the Ethereal and Material Planes.'
  )
})

test('legacy fields are inferred conservatively and left untouched when text is ambiguous', () => {
  const input = action({
    actionType: 'spell_attack',
    range: 'Self (creatures 20ft of you) across Material and Ethereal Plane',
    targetsText: 'up to 3 creatures which you can see',
    effects: [{ case: 'Hit', effect: 'Takes 5 (1d10) radiant damage.' }],
  })
  const before = structuredClone(input)
  const ability = inferAbility(input)

  assert.strictEqual(ability.attackSource, 'spell')
  assert.strictEqual(ability.attackReach, undefined)
  assert.strictEqual(ability.targeting?.raw, 'Self (creatures 20ft of you) across Material and Ethereal Plane')
  assert.strictEqual(scopePhrase(ability), 'up to 3 creatures which you can see; Self (creatures 20ft of you) across Material and Ethereal Plane')
  assert.deepStrictEqual(outcomePhrase(ability), ['On Hit: Takes 5 (1d10) radiant damage.'])
  assert.deepStrictEqual(input, before)
})

test('explicit targeting wins while missing legacy-compatible fields can still be inferred', () => {
  const input = action({
    actionType: 'spell_attack',
    range: 'Ranged',
    targetsText: '1 creature',
    attackReach: 'melee',
    attackSource: 'weapon',
    targeting: { count: 2, kind: 'creatures' },
    effects: [{ case: 'Failure', effect: 'The target is pushed.' }],
    outcomes: [],
  })
  const ability = inferAbility(input)

  assert.strictEqual(ability.attackReach, 'melee')
  assert.strictEqual(ability.attackSource, 'weapon')
  assert.strictEqual(scopePhrase(ability), '2 creatures')
  assert.deepStrictEqual(ability.outcomes, [])
})

test('empty or malformed optional targeting does not discard safe legacy inference', () => {
  const input = action({
    targetsText: 'up to 3 creatures',
    range: 'within 120 ft.',
    targeting: {} as MonsterAction['targeting'],
  })

  assert.strictEqual(scopePhrase(inferAbility(input)), 'up to 3 creatures within 120 ft.')
  assert.strictEqual(scopePhrase(inferAbility({ ...input, targeting: [] as unknown as MonsterAction['targeting'] })), 'up to 3 creatures within 120 ft.')
})

test('formula-backed target counts resolve from the current monster context', () => {
  const input = action({
    targeting: { count: 'PB', countMode: 'up_to', kind: 'creatures' },
  })
  const ability = inferAbility(input)

  assert.strictEqual(scopePhrase(ability, { formulaContext: formulaContext(2) }), 'up to 2 creatures')
  assert.strictEqual(scopePhrase(ability, { formulaContext: formulaContext(3) }), 'up to 3 creatures')
  assert.strictEqual(scopePhrase(ability), 'up to PB creatures')
})

test('unsupported legacy range text remains visible instead of being guessed into structured targeting', () => {
  const ability = inferAbility(action({ range: 'Self (within the visible aura)' }))

  assert.strictEqual(ability.targeting?.raw, 'Self (within the visible aura)')
  assert.strictEqual(scopePhrase(ability), 'Self (within the visible aura)')
})

test('2024 text marks clause labels for HTML surfaces without changing a single word', () => {
  const input = action({
    name: 'Rend',
    actionType: 'weapon_attack',
    attackReach: 'melee',
    attackSource: 'weapon',
    targeting: { count: 1, kind: 'creature', range: { distance: 5, unit: 'ft', relation: 'reach' } },
    outcomes: [{ trigger: 'hit', effects: [{ kind: 'damage', formula: '2d6', damageType: 'slashing' }] }],
    description: 'The target is grappled.',
  })
  const context = { attackBonus: 5, formulaContext: formulaContext(2) }
  const html = text2024(input, context, { markup: 'html' })

  assert.strictEqual(html, '<i>Melee Attack Roll:</i> +5, reach 5 ft., one creature. <i>Hit:</i> 7 (2d6) Slashing damage. The target is grappled.')
  assert.strictEqual(html.replace(/<\/?i>/g, ''), text2024(input, context))
})

test('HTML 2024 text marks the saving throw and every outcome label, including bare ones', () => {
  const input = action({
    actionType: 'save_ability',
    stat: 'CON',
    targeting: { count: 'all', kind: 'creatures', area: { shape: 'radius sphere', distance: 20, unit: 'ft' } },
    outcomes: [
      { trigger: 'failure', effects: [{ kind: 'damage', formula: '4d10', damageType: 'radiant' }] },
      { trigger: 'success', effects: [], rider: 'The creature takes half as much damage.' },
      { trigger: 'Bloodied', effects: [] },
    ],
  })
  const context = { saveDc: 12, formulaContext: formulaContext(2) }
  const html = text2024(input, context, { markup: 'html' })

  assert.strictEqual(
    html,
    '<i>Constitution Saving Throw:</i> DC 12, all creatures in a 20-foot radius sphere. <i>Failure:</i> 22 (4d10) Radiant damage. <i>Success:</i> The creature takes half as much damage. <i>Bloodied:</i>'
  )
  assert.strictEqual(html.replace(/<\/?i>/g, ''), text2024(input, context))
})

test('malformed imported ability fields are ignored without crashing the statblock projection', () => {
  const input = action({
    targeting: { count: 'all', kind: 'creatures', planes: 'Ethereal' } as unknown as MonsterAction['targeting'],
    outcomes: [null, { trigger: 12, effects: 'not an array' }] as unknown as MonsterAction['outcomes'],
  })

  assert.doesNotThrow(() => {
    const ability = inferAbility(input)
    assert.strictEqual(scopePhrase(ability), 'all creatures')
    assert.deepStrictEqual(outcomePhrase(ability), [])
  })
})

test('target nouns agree with their count in screen and 2024 text', () => {
  const scope = (kind: string, count: number | string, countMode?: 'up_to' | 'exact') =>
    scopePhrase(inferAbility(action({ targeting: { count, countMode, kind } as MonsterAction['targeting'] })), { formulaContext: formulaContext(2) })

  assert.strictEqual(scope('creature', 3, 'up_to'), 'up to 3 creatures')
  assert.strictEqual(scope('creatures', 1), '1 creature')
  assert.strictEqual(scope('creature', 1), '1 creature')
  assert.strictEqual(scope('ally', 2), '2 allies')
  assert.strictEqual(scope('enemy', 'all'), 'all enemies')
  assert.strictEqual(scope('target', 'PB'), '2 targets')
  assert.strictEqual(scope('Creature', 2), '2 Creatures')
  assert.strictEqual(scope('willing creature', 2), '2 willing creatures')
  assert.strictEqual(scope('target creature', 2), '2 target creatures')
  assert.strictEqual(scope('creature of your choice', 3), '3 creatures of your choice')
  assert.strictEqual(scope('creatures or objects', 1), '1 creature or object')
  assert.strictEqual(scope('fiend', 2), '2 fiends')
  assert.strictEqual(scope('Undead', 3), '3 Undead')
  assert.strictEqual(scope('Fey', 1), '1 Fey')
  assert.strictEqual(scope('wisps', 1), '1 wisp')
  assert.strictEqual(
    text2024(action({ attackSource: 'spell', attackReach: 'ranged', targeting: { count: 3, countMode: 'up_to', kind: 'creature', qualifier: 'which you can see' } }), { attackBonus: 7 }),
    'Ranged Attack Roll: +7, up to three creatures which you can see.'
  )
  assert.strictEqual(
    scopePhrase(inferAbility(action({ targeting: { count: 1, qualifier: 'which you can see' } as MonsterAction['targeting'] }))),
    '1 target which you can see'
  )
  assert.strictEqual(
    scopePhrase(inferAbility(action({ targeting: { count: 3, qualifier: 'which you can see' } as MonsterAction['targeting'] }))),
    '3 targets which you can see'
  )
})
test('attack granularity: attackCount, roll modifiers and exceptions format accurately in mechanicsPhrase', () => {
  const granAction = action({
    attackSource: 'spell',
    attackReach: 'ranged',
    attackBonus: 7,
    attackCount: 3,
    attackRollModifier: 'advantage',
    attackException: 'Versus Undead',
  })
  const ability = inferAbility(granAction)
  const phrases = mechanicsPhrase(ability, { attackBonus: 7 })
  assert.deepStrictEqual(phrases, ['3 Ranged Spell Attacks of +7 (▲▲ Versus Undead)'])

  const disAction = action({
    attackSource: 'weapon',
    attackReach: 'melee',
    attackBonus: 5,
    attackCount: 2,
    attackRollModifier: 'disadvantage',
    attackException: 'in Dim Light',
  })
  assert.deepStrictEqual(mechanicsPhrase(inferAbility(disAction)), ['2 Melee Weapon Attacks of +5 (▼▼ in Dim Light)'])
})

test('attack bonus formatting preserves explicit 0 or string "0" without sign', () => {
  const zeroAction = action({
    attackSource: 'weapon',
    attackReach: 'melee',
    attackBonus: 0,
  })
  const phrases = mechanicsPhrase(inferAbility(zeroAction), { attackBonus: 0 })
  assert.deepStrictEqual(phrases, ['Melee Weapon Attack 0'])

  const strZeroAction = action({
    attackSource: 'spell',
    attackReach: 'ranged',
    attackBonus: '0' as unknown as number,
  })
  const strPhrases = mechanicsPhrase(inferAbility(strZeroAction), { attackBonus: '0' as unknown as number })
  assert.deepStrictEqual(strPhrases, ['Ranged Spell Attack 0'])
})

test('outcomePhrase strips whitespace before colon in outcome labels', () => {
  const ability = inferAbility(action({
    outcomes: [
      {
        trigger: 'On Success ',
        effects: [{ case: 'success', formula: '13', damageType: 'radiant' }],
      },
    ],
  }))
  const phrases = outcomePhrase(ability, {}, 'screen', 'text')
  assert.ok(phrases[0].startsWith('On Success:'))
  assert.ok(!phrases[0].includes('On Success :'))
})
