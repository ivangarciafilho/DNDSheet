import assert from 'node:assert/strict';import test from 'node:test';import{spellRowRecovery,spellCadenceDiffers,buildSpellPlate}from'../../src/core/domain/spell-plate.ts';import{aggregateSpellcastingSources}from'../../src/core/usecases/AutoSyncSpellcasting.ts';import{castingResourceView,castingResourceSummary}from'../../src/core/domain/casting-resource-view.ts';
test('row controls and rendered defaults share pact recovery; explicit row recovery wins',()=>{assert.equal(spellRowRecovery(2,undefined,{className:'Warlock'}),'short_rest');assert.equal(spellRowRecovery(0,undefined,{refreshRate:'long_rest'}),'at_will');assert.equal(spellRowRecovery(2,'long_rest',{refreshRate:'short_rest'}),'long_rest');assert.equal(spellCadenceDiffers('Long Rest',spellRowRecovery(2,'long_rest',{refreshRate:'short_rest'})),false);const plate=buildSpellPlate({title:'Pact',level:8,className:'Warlock',stat:'CHA',save:15,attack:7,slots:[0,0,0,2],spellLevels:[{level:2,spells:[{name:'Hold Person',cadence:'long_rest'}],cadence:'long_rest'}]});assert.equal(plate.levels[0].effectiveCadence,'Long Rest');assert.equal(plate.levels[0].heading,'(Long Rest), Level 2:')});
test('custom Warlock contributions render the receiving pool instead of inferring pact from class name',()=>{const source={class:'Warlock',level:8,stat:'CHA' as const,contribution:{mode:'custom' as const,target:'slots' as const,numerator:1,denominator:2}};const result=aggregateSpellcastingSources(source);const pool=castingResourceView(source,result);assert.equal(pool.pactPool,false);assert.equal(pool.slots?.[1],3);const plate=buildSpellPlate({title:'Casting',level:8,className:'Warlock',stat:'CHA',save:15,attack:7,...pool,spellLevels:[{level:1,spells:[{name:'Command'}]}]});assert.equal(plate.isPact,false);assert.match(castingResourceSummary(source,{},2)!,/Shared Spell Slots/)});
test('native pact and shared slots remain distinct pools when sources combine',()=>{const source={class:'Wizard',level:5,stat:'INT' as const,classes:[{className:'Warlock',level:3,stat:'CHA' as const}]};const result=aggregateSpellcastingSources(source)!;assert.equal(castingResourceView(source,result).slots?.[2],2);assert.equal(castingResourceView(source.classes[0],result).slots?.[1],2);assert.match(castingResourceSummary(source,{},2)!,/Pact Magic: 2 2nd-level slots/)});

test('pact-only sources never report a duplicate shared Spellcasting pool',()=>{
 for(const source of [
  {class:'Warlock',level:5,classes:[{className:'Warlock',level:3}]},
  {class:'Wizard',level:8,contribution:{mode:'custom' as const,target:'pact' as const,numerator:1,denominator:2}},
 ]) {
  const result=aggregateSpellcastingSources(source)!
  assert.ok(result.standardSlots.every(value=>value===0))
  assert.ok(result.slots.some(value=>value>0),'Legacy API still exposes pact slots')
  const summary=castingResourceSummary(source,{},2)!
  assert.match(summary,/Pact Magic/)
  assert.doesNotMatch(summary,/Shared Spell Slots/)
 }
});
test('zero general contribution cannot borrow the separate pact pool',()=>{
 const source={class:'Wizard',level:5,contribution:{mode:'custom' as const,target:'slots' as const,numerator:0,denominator:1},classes:[{className:'Warlock',level:3}]}
 const result=aggregateSpellcastingSources(source)!
 assert.ok(castingResourceView(source,result).slots!.every(value=>value===0))
 assert.ok(castingResourceView(source.classes[0],result).slots!.some(value=>value>0))
});
test('authored manual point and focus resources remain unchanged by native multiclass pools',()=>{
 const combined=aggregateSpellcastingSources({class:'Wizard',level:5,classes:[{className:'Warlock',level:3}]})
 for(const resourceType of ['points','focus']) {
  const source={className:'Sorcerer',resourceType,resourceValue:37,slots:[1,0,0,0,0,0,0,0,0]}
  const view=castingResourceView(source,combined)
  assert.strictEqual(view.resourceValue,37)
  assert.deepStrictEqual(view.slots,source.slots)
 }
});

test('manual native point, focus and at-will systems do not also grant standard slots',()=>{
 for(const resourceType of ['points','focus','at_will']) {
  const result=aggregateSpellcastingSources({class:'Wizard',level:5,classes:[{className:'Sorcerer',level:5,resourceType}]})!
  assert.equal(result.combinedCasterLevel,5)
  assert.equal(result.standardSlots[2],2)
  const custom=aggregateSpellcastingSources({class:'Wizard',level:5,classes:[{className:'Sorcerer',level:5,resourceType,contribution:{mode:'custom',target:'slots',numerator:1,denominator:1}}]})!
  assert.equal(custom.combinedCasterLevel,10)
 }
});
test('authored native slot counts survive projection without a contradictory shared total',()=>{
 const source={class:'Wizard',level:5,slots:[7,3,2,0,0,0,0,0,0],classes:[{className:'Warlock',level:3,slots:[0,4,0,0,0,0,0,0,0]}]}
 const result=aggregateSpellcastingSources(source)!
 assert.deepEqual(castingResourceView(source,result).slots,source.slots)
 assert.deepEqual(castingResourceView(source.classes[0],result).slots,source.classes[0].slots)
 const summary=castingResourceSummary(source,{},2)!
 assert.match(summary,/Wizard: 12 Spell Slots through 3rd level/)
 assert.match(summary,/Warlock: 4 2nd-level Pact Magic slots/)
 assert.doesNotMatch(summary,/Shared Spell Slots|Authored|overrides|retained|\uFFFD/)
 const custom={...source.classes[0],contribution:{mode:'custom' as const,target:'slots' as const,numerator:1,denominator:2}}
 assert.deepEqual(castingResourceView(custom,result).slots,result.standardSlots,'Explicit custom route overrides saved source slots')
});
test('custom Warlock receiving-pool cadence matches editor and renderer defaults',()=>{
 const source={className:'Warlock',contribution:{mode:'custom' as const,target:'slots' as const,numerator:1,denominator:2}}
 assert.equal(spellRowRecovery(1,undefined,source),'long_rest')
 assert.equal(spellRowRecovery(1,undefined,{...source,pactPool:false}),'long_rest')
 assert.equal(spellRowRecovery(1,undefined,{...source,contribution:{...source.contribution,target:'pact'}}),'short_rest')
 assert.equal(spellRowRecovery(1,undefined,{...source,refreshRate:'short_rest'}),'short_rest','Authored cadence wins')
});
