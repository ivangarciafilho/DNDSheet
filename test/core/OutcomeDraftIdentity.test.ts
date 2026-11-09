import test from 'node:test'
import assert from 'node:assert/strict'
import {stabilizeOutcomeIds} from '../../src/core/domain/outcome-identities.ts'
import {migrateMonsterSchema} from '../../src/core/usecases/MigrateMonsterSchema.ts'
import {defaultMonster} from '../../src/core/domain/types.ts'
import {inferAbility,outcomePhrase} from '../../src/core/domain/ability-grammar.ts'

test('legacy identities reserve future IDs, preserve extensions and normalize deterministically',()=>{
 const input=[{trigger:'hit',effects:[],extra:{retained:true}},{id:'oc-owner-1',trigger:'miss',effects:[]},{id:'same',effects:[]},{id:'same',refs:['same'],effects:[]},null,{id:7}];const before=JSON.stringify(input),result=stabilizeOutcomeIds(input,'owner');assert.equal(JSON.stringify(input),before);assert.equal(result[0]?.id,'oc-owner-1-1');assert.deepEqual(stabilizeOutcomeIds(result,'owner'),result);assert.equal(result[2]?.id,result[3]?.id);assert.deepEqual(result[3]?.refs,['same']);assert.equal(result[4],null);assert.equal(result[5]?.id,7);assert.deepEqual(result[0]?.extra,{retained:true})
})
test('load remains lossless while draft preparation adds IDs without mutating saved records',()=>{
 const monster=defaultMonster();for(const family of ['traits','actions','reactions','attacks'])Object.assign(monster,{[family]:[{id:family+'-source',outcomes:[{trigger:'hit',effects:[],refs:['missing'],extension:'keep'}]}]});const before=JSON.stringify(monster);const output=migrateMonsterSchema(monster);assert.equal(JSON.stringify(monster),before);for(const family of ['traits','actions','reactions','attacks']){const original=(monster as unknown as Record<string,Array<{outcomes:unknown}>>)[family][0].outcomes;const saved=(output as unknown as Record<string,Array<{outcomes:unknown}>>)[family][0].outcomes;assert.deepEqual(saved,original);const draft=stabilizeOutcomeIds(saved,family);assert.ok((draft as Array<{id:string}>)[0].id);assert.deepEqual(saved,original)}assert.deepEqual(migrateMonsterSchema(output),output);assert.equal(stabilizeOutcomeIds('legacy text','x'),'legacy text')
})
test('shared prose preserves empty and numeric legacy clauses without shifting later effects',()=>{
 const ability=inferAbility({outcomes:[{trigger:'',effects:[{formula:0,damageType:'radiant'}]},{trigger:'hit',effects:[{text:'Later effect'}]}] as never});const lines=outcomePhrase(ability);assert.equal(lines.length,2);assert.match(lines[0],/^Effect: 0 Radiant damage/);assert.match(lines[1],/On Hit: Later effect/)
})
test('ambiguous reference targets never acquire a guessed trigger in prose',()=>{
 const ability=inferAbility({outcomes:[{id:'same',trigger:'hit',effects:[]},{id:'same',trigger:'miss',effects:[]},{id:'other',trigger:'success',refs:['same'],effects:[{text:'Keep this effect'}]}]});assert.doesNotMatch(outcomePhrase(ability).at(-1)!,/builds on/);assert.match(outcomePhrase(ability)[2],/Keep this effect/)
})

test('numeric legacy IDs never become valid string reference targets in prose',()=>{
 const ability=inferAbility({outcomes:[{id:7,trigger:'hit',effects:[]},{id:'other',trigger:'success',refs:['7'],effects:[{text:'Keep the authored result'}]}] as never});assert.doesNotMatch(outcomePhrase(ability).at(-1)!,/builds on/)
})
