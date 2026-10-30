import test from 'node:test'
import assert from 'node:assert/strict'
import { CADENCES, cadenceOptions, cadenceDefinition, formatLimitedUses } from '../../src/core/domain/cadence.ts'
test('one rest use prints a compact label while multiple uses retain the quantity',()=>{
 assert.equal(formatLimitedUses(1,'SHORT_REST'),'Short Rest')
 assert.equal(formatLimitedUses(3,'SHORT_REST'),'3/Short Rest')
 assert.equal(formatLimitedUses(1,'DAY'),'1/Day')
 assert.equal(formatLimitedUses(0,'SHORT_REST'),'')
})
test('canonical cadence covers requested intervals, solar events, rests and bloodied',()=>{
 for(const id of ['DAWN','DUSK','MIDDAY','MIDNIGHT','BLOODIED','DOWNTIME','WEEKLY','MONTHLY','HOUR','TEN_MINUTES','MINUTE']) assert.ok(cadenceDefinition(id),id)
 assert.equal(cadenceDefinition('BLOODIED')?.kind,'event')
 assert.equal(cadenceDefinition('TEN_MINUTES')?.kind,'interval')
 assert.equal(new Set(CADENCES.map(item=>item.id)).size,CADENCES.length)
})
test('saved aliases and unknown cadence values stay selectable without normalization',()=>{
 assert.equal(cadenceDefinition('SHORT_OR_LONG_REST')?.id,'LONG_OR_SHORT')
 assert.equal(formatLimitedUses(1,'SHORT'),'Short Rest')
 assert.ok(cadenceOptions('moonrise').some(option=>option.value==='moonrise'))
 assert.equal(formatLimitedUses(2,'moonrise'),'2/moonrise')
 assert.ok(cadenceOptions('REST').some(option=>option.value==='REST'))
})
test('cadence groups and options are sorted within their semantic scope',()=>{
 const options=cadenceOptions('')
 for(const group of new Set(options.map(option=>option.category))){const labels=options.filter(option=>option.category===group).map(option=>option.label);assert.deepEqual(labels,[...labels].sort((a,b)=>a.localeCompare(b,'en')))}
 assert.ok(options.every(option=>option.help.length>0))
 assert.ok(!options.some(option=>option.value==='RECHARGE'||option.value==='AT_WILL'))
})

import { computeTraitTag } from '../../src/core/domain/defense-and-traits-utils.ts'
import type { MonsterTrait } from '../../src/core/domain/types.ts'
import { processTokens } from '../../src/core/usecases/ProcessTokens.ts'
test('trait cadence shares the compact formatter while keeping conditional text and manual overrides',()=>{
 const trait={limitedUse:{count:1,rate:'SHORT_REST'},conditionalTrigger:'Bloodied only'} as MonsterTrait
 assert.equal(computeTraitTag(trait),'Short Rest; Bloodied only')
 assert.equal(computeTraitTag({...trait,rechargeTagOverride:'Authored recovery'}),'Authored recovery')
 assert.equal(computeTraitTag({...trait,rechargeTiming:'DAWN',conditionalTrigger:''}),'Recharges at Dawn')
})
test('trait interval and unknown rates keep quantity and authored identity',()=>{
 const trait={limitedUse:{count:2,rate:'MONTHLY'}} as MonsterTrait
 assert.equal(computeTraitTag(trait),'2/Month')
 assert.equal(computeTraitTag({...trait,limitedUse:{count:2,rate:'moonrise'}}),'2/moonrise')
 assert.equal(computeTraitTag({...trait,rechargeTiming:'TEN_MINUTES'}),'2/10 Minutes')
})
test('core token projections share compact rest labels without changing stored quantities',()=>{
 const context={name:'Ward',limitedUse:{count:1,rate:'SHORT_REST'}}
 const monster={name:'Witness'} as Parameters<typeof processTokens>[1]
 assert.equal(processTokens('{action.limitedUse}',monster,{context}),' (Short Rest)')
 assert.equal(context.limitedUse.count,1)
})
