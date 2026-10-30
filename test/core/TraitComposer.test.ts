import test from 'node:test'
import assert from 'node:assert/strict'
import { traitCellPatch, traitCellValue, traitChainView, traitPolicyPatch, traitPhaseOptions, validateTraitCell } from '../../src/core/domain/trait-composer.ts'
import type { MonsterTrait } from '../../src/core/domain/types.ts'

const trait = (): MonsterTrait => ({
  id: 'regeneration', name: 'Regeneration', description: 'Regains hit points.',
  limitedUse: { count: 2, rate: 'DAY' }, customPreamble: false,
  crAnnotation: { marker: 'preserve' } as unknown as MonsterTrait['crAnnotation'],
  rechargeTiming: 'DAWN', rechargeCount: 2, rechargeTagOverride: '',
  stagePool: 2, conditionalTrigger: 'While submerged', isConditional: true,
})

test('trait chain shows the renderer cadence before the name and preserves conditional text', () => {
  const rows = traitChainView(trait())
  assert.deepEqual(rows.map((row) => row.row), ['head'])
  assert.deepEqual(rows[0].cells.map((cell) => cell.id), ['trait-usage', 'name'])
  assert.equal(rows[0].cells[0].text, 'Recharges at Dawn; While submerged')
})

test('trait cadence editing preserves identity, grouping, description and CR without aliasing', () => {
  const original = trait()
  const draft = traitCellValue(original, 'trait-usage') as Record<string, unknown>
  const limitedUse = draft.limitedUse as { count: number; rate: string }
  limitedUse.count = 3
  draft.rechargeTiming = 'SHORT_REST'
  draft.rechargeCount = 3
  const patch = traitCellPatch(original, 'trait-usage', draft)
  assert.equal(original.limitedUse.count, 2)
  assert.equal(patch.limitedUse?.count, 3)
  const updated = { ...original, ...patch }
  assert.equal(updated.id, original.id)
  assert.equal(updated.crAnnotation, original.crAnnotation)
  assert.equal(updated.conditionalTrigger, original.conditionalTrigger)
  assert.equal(updated.stagePool, 2)
  limitedUse.count = 9
  assert.equal(patch.limitedUse?.count, 3)
})

test('clearing trait cadence removes its overrides without clearing conditional policy', () => {
  const original = trait()
  const updated = { ...original, ...traitCellPatch(original, 'trait-usage', '') }
  assert.equal(updated.limitedUse.count, 0)
  assert.equal(updated.rechargeTiming, '')
  assert.equal(updated.rechargeCount, undefined)
  assert.equal(updated.rechargeTagOverride, '')
  assert.equal(updated.conditionalTrigger, 'While submerged')
  assert.deepEqual(traitCellPatch(original, 'unsupported', 'x'), {})
})

test('trait cadence rejects invalid counts and malformed drafts before applying', () => {
  assert.match(validateTraitCell('trait-usage', { limitedUse: { count: -1, rate: 'DAY' } }), /count/i)
  assert.match(validateTraitCell('trait-usage', { limitedUse: { count: 1.5, rate: 'DAY' } }), /count/i)
  assert.match(validateTraitCell('trait-usage', {}), /count/i)
  assert.match(validateTraitCell('trait-usage', { limitedUse: { count: '   ', rate: 'DAY' } }), /count/i)
  assert.equal(validateTraitCell('name', '  '), 'Name is required')
  assert.deepEqual(traitCellPatch(trait(), 'trait-usage', {}), {})
})

test('trait grouping defaults are explicit and existing custom headings survive toggles', () => {
  const original = trait()
  assert.deepEqual(traitPolicyPatch(original, 'renderInRechargeSection', true), {
    renderInRechargeSection: true, rechargeSection: 'At Dawn',
  })
  assert.deepEqual(traitPolicyPatch({ ...original, rechargeSection: 'My heading' }, 'renderInRechargeSection', true), {
    renderInRechargeSection: true,
  })
  assert.deepEqual(traitPolicyPatch({ ...original, conditionalTrigger: '' }, 'isConditional', true), {
    isConditional: true, conditionalTrigger: 'Bloodied (bloodied hit points)',
  })
  assert.deepEqual(traitPolicyPatch(original, 'stagePool', -1), {})
  assert.deepEqual(traitPolicyPatch(original, 'stagePool', 'all'), { stagePool: 'all' })
  assert.equal(original.rechargeSection, undefined)
  assert.deepEqual(traitPolicyPatch(original, 'rechargeSection', 'Twilight powers '), { rechargeSection: 'Twilight powers ' })
  assert.deepEqual(traitPolicyPatch(original, 'conditionalTrigger', 'While submerged '), { conditionalTrigger: 'While submerged ' })
})

test('cadence changes update generated headings and retain authored headings', () => {
  const original = { ...trait(), renderInRechargeSection: true, rechargeSection: 'At Dawn' }
  const draft = traitCellValue(original, 'trait-usage') as Record<string, unknown>
  draft.rechargeTiming = 'DUSK'
  assert.equal(traitCellPatch(original, 'trait-usage', draft).rechargeSection, 'At Dusk')
  assert.equal(traitCellPatch({ ...original, rechargeSection: 'Twilight powers' }, 'trait-usage', draft).rechargeSection, undefined)
})

test('phase choices bound imported counts and retain a saved out-of-range phase without a huge list', () => {
  const options = traitPhaseOptions(1000000, 1000000)
  assert.equal(options.length, 12)
  assert.equal(options[0].value, 'all')
  assert.equal(options[11].value, 1000000)
  assert.equal(traitPhaseOptions(Infinity, 'all').length, 2)
})
