import test from 'node:test'
import assert from 'node:assert/strict'
import {
  entryDisplayPatch,
  entryEffectiveStagePools,
  entryMatchesStagePool,
  formatReactionAvailability,
  reactionAvailabilityPatch,
  reactionPredicateOptions,
} from '../../src/core/domain/entry-display.ts'

test('entry policy patches own phase and heading only, without mutating mechanics',()=>{
  assert.deepEqual(entryDisplayPatch('stagePool','3'),{stagePool:3})
  assert.deepEqual(entryDisplayPatch('stagePool','all'),{stagePool:'all'})
  assert.deepEqual(entryDisplayPatch('customPreamble',true),{customPreamble:true})
  for(const value of [-1,0,1.5,Infinity,'oops',{},true])assert.deepEqual(entryDisplayPatch('stagePool',value),{})
  assert.deepEqual(entryDisplayPatch('customPreamble','true'),{})
  assert.deepEqual(entryDisplayPatch('attackBonus',99),{})
})

test('A11.6: reaction availability predicates, stagePool sets, and formatting preserve single and multi-pool contracts', () => {
  const predicates = reactionPredicateOptions().map((o) => o.value)
  assert.deepEqual(predicates, ['always', 'while_bloodied', 'when_bloodied', 'while_not_bloodied', 'at_0_hp', 'at_1_hp'])

  const multiPatch = reactionAvailabilityPatch(undefined, {
    stagePools: [3, 1, 1, -1],
    predicate: 'while_bloodied',
    customCondition: '  while holding orb ',
  })
  assert.deepEqual(multiPatch, {
    availability: {
      stagePools: [1, 3],
      predicate: 'while_bloodied',
      customCondition: 'while holding orb',
    },
    stagePool: 'all',
  })

  const singlePatch = reactionAvailabilityPatch(multiPatch.availability, { stagePools: [2] })
  assert.deepEqual(singlePatch, {
    availability: {
      stagePools: [2],
      predicate: 'while_bloodied',
      customCondition: 'while holding orb',
    },
    stagePool: 2,
  })

  assert.deepEqual(entryEffectiveStagePools({ stagePool: 3 }), [3])
  assert.equal(entryMatchesStagePool({ availability: multiPatch.availability }, 1), true)
  assert.equal(entryMatchesStagePool({ availability: multiPatch.availability }, 2), false)
  assert.equal(entryMatchesStagePool({ availability: multiPatch.availability }, 3), true)
  assert.equal(entryMatchesStagePool({ stagePool: 2 }, 2), true)
  assert.equal(entryMatchesStagePool({ stagePool: 2 }, 1), false)

  assert.deepEqual(formatReactionAvailability({ availability: multiPatch.availability }, 'Form'), {
    poolsLabel: 'Form 1, 3',
    conditionLabel: 'While Bloodied — while holding orb',
  })

  assert.deepEqual(entryDisplayPatch('availability', { stagePools: [2, 1], predicate: 'at_1_hp' }), {
    availability: { stagePools: [1, 2], predicate: 'at_1_hp' },
    stagePool: 'all',
  })
})
