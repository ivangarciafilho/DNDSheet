import test from 'node:test'
import assert from 'node:assert/strict'
import { defaultAction } from '../../src/core/domain/types.ts'
import { actionUsageDraft, actionUsagePatch, validateActionUsage } from '../../src/core/domain/action-usage.ts'

test('usage draft reads the actual limited-use economy without mutating it',()=>{
  const action=defaultAction('a');action.limitedUse={count:3,rate:'DAY'}
  const draft=actionUsageDraft(action);assert.equal(draft.mode,'limited');assert.equal(draft.count,3);assert.equal(draft.rate,'DAY')
  draft.count=9;assert.equal(action.limitedUse.count,3)
})
test('recharge draft honors renderer precedence including bounds and imported legacy fields',()=>{
  const action=defaultAction('a');action.recharge='6-12';action.rechargeMin=5;action.rechargeMax=6
  assert.deepEqual([actionUsageDraft(action).mode,actionUsageDraft(action).min,actionUsageDraft(action).max],['recharge',6,12])
  action.recharge='';assert.equal(actionUsageDraft(action).min,5)
  action.rechargeMin=undefined;action.limitedUse.rate='RECHARGE';assert.equal(actionUsageDraft(action).min,5)
  action.recharge='After the eclipse';assert.equal(actionUsageDraft(action).mode,'custom');assert.equal(actionUsageDraft(action).custom,'After the eclipse')
})
test('applying limited uses clears competing cadence fields and preserves unrelated data',()=>{
  const action=defaultAction('a');action.recharge='5-6';action.rechargeMin=5;action.rechargeMax=6
  Object.assign(action.limitedUse,{recharge:'6',saved:'keep'})
  const draft={...actionUsageDraft(action),mode:'limited' as const,count:'4',rate:'LONG_OR_SHORT'}
  const before=JSON.stringify(action);const patch=actionUsagePatch(action,draft)
  assert.equal(patch.recharge,'');assert.equal(patch.rechargeMin,undefined);assert.equal(patch.rechargeMax,undefined)
  assert.deepEqual(patch.limitedUse,{count:4,rate:'LONG_OR_SHORT',saved:'keep'})
  assert.equal(JSON.stringify(action),before)
})
test('recharge, custom and clear produce one unambiguous cadence and survive JSON serialization',()=>{
  const action=defaultAction('a');action.limitedUse={count:3,rate:'DAY'}
  for(const mode of ['recharge','custom','none'] as const){
    const draft={...actionUsageDraft(action),mode,min:'5',max:'6',custom:'After a Short Rest'}
    const next={...action,...actionUsagePatch(action,draft)}
    assert.equal(next.limitedUse.count,0)
    assert.equal(next.recharge,mode==='recharge'?'5–6':mode==='custom'?'After a Short Rest':'')
    assert.equal(actionUsageDraft(JSON.parse(JSON.stringify(next))).mode,mode)
  }
})
test('invalid drafts cannot apply while saved custom rates remain supported',()=>{
  const action=defaultAction('a');const draft={...actionUsageDraft(action),mode:'limited' as const,count:2,rate:'AT_DAWN'}
  assert.equal(validateActionUsage(draft),'')
  for(const count of ['',0,-1,1.5,Infinity,1000])assert.ok(validateActionUsage({...draft,count}))
  assert.ok(validateActionUsage({...draft,mode:'recharge',min:6,max:5}))
  assert.deepEqual(actionUsagePatch(action,{...draft,count:-1}),{})
  assert.deepEqual(actionUsagePatch(action,{...draft,mode:'bogus'} as never),{})
})
