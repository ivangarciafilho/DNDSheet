import test from 'node:test'
import assert from 'node:assert/strict'
import { evaluateGradientCurve, formatCurvedGradientCss } from '../../src/core/domain/gradient-curve.ts'
import { scopePhrase, inferAbility } from '../../src/core/domain/ability-grammar.ts'
import { composeAcAndDefenses } from '../../src/core/domain/defense-and-traits-utils.ts'

test('gradient-curve: evaluateGradientCurve respects boundary values and monotonic curves', () => {
  for (const curve of ['linear', 'ease_in', 'ease_out', 'smoothstep'] as const) {
    assert.strictEqual(evaluateGradientCurve(0, curve, 0), 0)
    assert.strictEqual(evaluateGradientCurve(1, curve, 0), 1)
  }
  assert.ok(evaluateGradientCurve(0.5, 'ease_in', 0) < 0.5)
  assert.ok(evaluateGradientCurve(0.5, 'ease_out', 0) > 0.5)
  assert.ok(Math.abs(evaluateGradientCurve(0.5, 'smoothstep', 0) - 0.5) < 1e-6)
  // Custom tension adjusts midpoint weight (curve === 'custom' maps t=0.5 to curveTension)
  assert.ok(evaluateGradientCurve(0.5, 'custom', 0.7) > 0.5)
  assert.ok(evaluateGradientCurve(0.5, 'custom', 0.3) < 0.5)
})

test('gradient-curve: formatCurvedGradientCss formats all directions and interpolates curved stops', () => {
  assert.strictEqual(formatCurvedGradientCss(undefined), 'none')
  assert.strictEqual(formatCurvedGradientCss({ enabled: false } as any), 'none')

  const linearCss = formatCurvedGradientCss({
    enabled: true,
    direction: 'left_to_right',
    blendMode: 'normal',
    opacity: 100,
    startColor: 'rgba(0,0,0,0.8)',
    endColor: 'rgba(255,255,255,0)',
    curve: 'linear',
    stops: [
      { color: 'rgba(0,0,0,0.8)', offset: 0 },
      { color: 'rgba(255,255,255,0)', offset: 100 },
    ],
  })
  assert.ok(linearCss.startsWith('linear-gradient(to right,'))
  assert.ok(linearCss.includes('0%'))
  assert.ok(linearCss.includes('100%'))

  const smoothCss = formatCurvedGradientCss({
    enabled: true,
    direction: 'vignette',
    blendMode: 'multiply',
    opacity: 90,
    startColor: '#000000',
    endColor: '#ffffff',
    curve: 'smoothstep',
    curveTension: 0.35,
    stops: [
      { color: '#000000', offset: 0 },
      { color: '#ffffff', offset: 100 },
    ],
  })
  assert.ok(smoothCss.startsWith('radial-gradient(ellipse at center,'))
  // Should include intermediate sub-sampled stops from the falloff curve
  assert.ok((smoothCss.split('%').length || 0) >= 6)
})

test('ability-grammar: scopePhrase renders target count with default target/targets noun when kind is omitted', () => {
  const single = scopePhrase({ targeting: { count: 1, qualifier: 'which you can see', range: { distance: 10, unit: 'ft' } } })
  assert.strictEqual(single, '1 target which you can see 10 ft.')

  const plural = scopePhrase({ targeting: { count: 3, qualifier: 'which you can see', range: { distance: 60, unit: 'ft' } } })
  assert.strictEqual(plural, '3 targets which you can see 60 ft.')

  const inferred = inferAbility({
    id: 'slam-1',
    name: 'Slam',
    description: '',
    recharge: '',
    legendaryOnly: false,
    limitedUse: { count: 0, rate: '' },
    stat: 'none',
    save: { override: false, overrideValue: 0 },
    range: '10 ft.',
    targetsText: '1 target which you can see',
    effects: [],
    customPreamble: false,
    bonusAction: false,
    crAnnotation: { maxDamage: 0, maxSave: 0, maxModifier: 0, multitarget: false, ehpMultiplier: 1, ehpModifier: 0, acModifier: 0, include: true },
    targeting: { count: 2, kind: '' as any, qualifier: '' },
  })
  assert.strictEqual(inferred.targeting?.count, 2)
  assert.strictEqual(inferred.targeting?.kind, 'target')
  assert.strictEqual(inferred.targeting?.qualifier, 'which you can see')
})

test('defense-and-traits-utils: composeAcAndDefenses splits each AC rider into its own badge when splitAcRiderRows is true', () => {
  const acResult = composeAcAndDefenses({
    AC: 14,
    ACType: 'natural armor',
    splitAcRiderRows: true,
    acConfig: {
      baseMode: 'flat',
      flatAc: 14,
      temporary: 'spell_shield',
      conditionMode: 'has_temp_hp',
      secondaryAc: 19,
      onMiss: 'knocks_prone',
      onHit: 'damage_attacker',
      onHitDamageAmount: 5,
      onHitDamageType: 'Fire',
    },
  } as any)
  // Base AC badge + 4 separate rider badges = 5 badges
  assert.strictEqual(acResult.badges.length, 5)
  assert.ok(acResult.badges[0].includes('14'))
  assert.ok(acResult.badges.some((b) => b.includes('19 with Shield spell as a Reaction')))
  assert.ok(acResult.badges.some((b) => b.includes('19 if It Has Temporary Hit Points')))
  assert.ok(acResult.badges.some((b) => b.includes('On Miss Knocks Prone')))
  assert.ok(acResult.badges.some((b) => b.includes('On Hit: Attacker takes 5 of Fire')))
})
