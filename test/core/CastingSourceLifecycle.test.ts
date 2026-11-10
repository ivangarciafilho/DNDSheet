import test from 'node:test'
import assert from 'node:assert/strict'
import {calculateMulticlassSpellcasting,sourceLearningMetrics,castingLearningSummary,allCastingSourceEntries,hasCastingSources} from '../../src/core/usecases/AutoSyncSpellcasting.ts'
import {removeCastingSource} from '../../src/core/domain/casting-source-list.ts'
import {sourceCapacityReference,sourceSpellOptions,sourceSpellCeiling} from '../../src/core/domain/casting-source-selection.ts'
import {subclassSpellGrants} from '../../src/core/domain/catalogs/subclass-spells.ts'

test('stacked source learning follows combined caster level by default, while own-level override remains available',()=>{
 const native=calculateMulticlassSpellcasting([{className:'Wizard',level:2},{className:'Sorcerer',level:3}],{INT:16,CHA:16},2)
 assert.equal(native.combinedCasterLevel,5);assert.equal(native.classes?.[0].preparedSpells,8);assert.equal(native.classes?.[1].preparedSpells,6)
 const own=sourceLearningMetrics({className:'Wizard',level:2,contribution:{mode:'rules',target:'slots',numerator:1,denominator:1,spells:{mode:'own',numerator:1,denominator:1}}},3,5,2)
 assert.equal(own.preparedSpells,5);assert.equal(own.spellCapacityLevel,2);assert.equal(sourceSpellCeiling({className:'Wizard',level:2}),1)
})
test('cantrip and known/prepared ratios scale independent counts after choosing own or combined basis',()=>{
 const result=sourceLearningMetrics({className:'Wizard',level:2,contribution:{mode:'rules',target:'slots',numerator:1,denominator:1,cantrips:{mode:'combined',numerator:2,denominator:1},spells:{mode:'own',numerator:1,denominator:2}}},3,5,2)
 assert.equal(result.cantripsKnown,8);assert.equal(result.preparedSpells,2);assert.equal(result.cantripCapacityLevel,5);assert.equal(result.spellCapacityLevel,2)
})
test('single source preserves native capacities and invalid ratios cannot invent learning budgets',()=>{
 const result=sourceLearningMetrics({className:'Wizard',level:2},3,10,1);assert.equal(result.preparedSpells,5);assert.equal(result.cantripsKnown,3)
 const invalid=sourceLearningMetrics({className:'Wizard',level:2,contribution:{mode:'rules',target:'slots',numerator:1,denominator:1,spells:{mode:'combined',numerator:1,denominator:0}}},3,10,2);assert.equal(invalid.preparedSpells,0)
})
test('contribution changes update combined learning totals without expanding source-owned selection ceilings',()=>{
 const half=calculateMulticlassSpellcasting([{className:'Wizard',level:5},{className:'Warlock',level:6,contribution:{mode:'custom',target:'slots',numerator:1,denominator:2}}],{INT:14,CHA:14},2)
 assert.equal(half.combinedCasterLevel,8);assert.equal(half.classes?.[0].preparedSpells,10);assert.equal(half.classes?.[1].preparedSpells,9);assert.equal(sourceSpellCeiling({className:'Wizard',level:5}),3)
 const pact=castingLearningSummary({class:'Warlock',level:6}, {CHA:16},2);assert.equal(pact.casterLevel,6);assert.equal(pact.spells,7)
})
test('empty source authority produces no phantom Wizard, including legacy secondary settings',()=>{
 const sc={primarySourceEnabled:false,class:'Wizard',level:10,classes:[],multiclass:{enabled:true,secondaryClass:'Cleric',secondaryLevel:5}}
 assert.equal(hasCastingSources(sc),false);assert.deepEqual(allCastingSourceEntries(sc),[]);assert.deepEqual(castingLearningSummary(sc),{casterLevel:0,cantrips:0,spells:0,perClass:[]})
 const empty=calculateMulticlassSpellcasting([],{},2);assert.equal(empty.combinedCasterLevel,0);assert.equal(empty.totalPreparedSpells,0);assert.deepEqual(empty.slots,Array(9).fill(0))
})
test('source promotion retains local maps, resources, contribution, extensions and innate ability',()=>{
 const sc={class:'Wizard',level:2,stat:'INT',save:{override:true,overrideValue:18},attack:{override:true,overrideValue:10},modifier:{override:true,overrideValue:6},standard:['Magic Missile'],atWill:[{name:'Innate Light'}],spellCadenceMap:{'Magic Missile':'DAY'},levelAmountMap:{1:2},classes:[{id:'pact / 1',className:'Warlock',subclass:'Fiend',level:6,stat:'CHA',spells:['Command'],slots:[0,0,2],levelCadences:{1:'SHORT_REST'},levelAmounts:{1:0},spellAmounts:{Command:1},spellBonusAction:{Command:true},resourceType:'pact',contribution:{mode:'rules',target:'pact',numerator:1,denominator:1},extension:{retain:true}}]}
 const {source,promotedId,bindingRemaps}=removeCastingSource(sc,'primary');assert.equal(promotedId,'pact / 1');assert.equal(source.class,'Warlock');assert.equal(source.stat,'CHA');assert.deepEqual((source as unknown as {innateSave:object}).innateSave,{override:true,overrideValue:18});assert.deepEqual((source as unknown as {innateAttack:object}).innateAttack,{override:true,overrideValue:10});assert.deepEqual((source as unknown as {innateModifier:object}).innateModifier,{override:true,overrideValue:6});assert.equal((source as unknown as {innateStat:string}).innateStat,'INT');assert.deepEqual(source.standard,['Command']);assert.deepEqual(source.levelAmountMap,{1:0});assert.deepEqual((source as unknown as {spellBonusActionMap:object}).spellBonusActionMap,{Command:true});assert.deepEqual(source.atWill,sc.atWill);assert.equal(source.classes.length,0);assert.ok(bindingRemaps.some(row=>row.from==='spellcasting.classes[id=pact%20%2F%201].level'&&row.to==='spellcasting.level'));assert.equal(sc.class,'Wizard')
})
test('removing the final primary source preserves innate blocks and marks the class list explicitly empty',()=>{
 const sc={class:'Wizard',level:2,stat:'INT',standard:['Magic Missile'],atWill:[{name:'Innate Light'}],classes:[],notes:'Keep global notes'}
 const result=removeCastingSource(sc,'primary').source;assert.equal((result as unknown as {primarySourceEnabled:boolean}).primarySourceEnabled,false);assert.equal(hasCastingSources(result),false);assert.deepEqual(result.atWill,sc.atWill);assert.equal(result.notes,'Keep global notes');assert.equal(result.standard.length,0)
})
test('removing an extra source isolates all unrelated sources and returns its exact binding prefix',()=>{
 const sc={class:'Wizard',classes:[{id:'a',className:'Cleric',level:2},{id:'b',className:'Bard',level:3}]};const result=removeCastingSource(sc,'a');assert.deepEqual(result.source.classes,[sc.classes[1]]);assert.deepEqual(result.bindingRemaps,[{from:'spellcasting.classes[id=a]'}]);assert.equal(removeCastingSource(sc,'missing').source,sc)
})
test('verified 2024 subclass grants unlock at class thresholds and never cross class or edition boundaries',()=>{
 assert.equal(subclassSpellGrants('Warlock','Fiend',2).length,0);assert.equal(subclassSpellGrants('Warlock','Fiend',3).length,4);assert.equal(subclassSpellGrants('Paladin','Oath of Devotion',9).length,6);assert.deepEqual(subclassSpellGrants('Wizard','Life Domain',20),[]);assert.deepEqual(subclassSpellGrants('Warlock','Hexblade',20),[])
 const options=[{value:'Command',label:'Command',level:1,class:['Cleric']},{value:'Fireball',label:'Fireball',level:3,class:['Wizard']}]
 assert.equal(sourceSpellOptions(options,{className:'Warlock',subclass:'Fiend',level:2,rulesEdition:'2024'},1).length,0)
 const granted=sourceCapacityReference(options,{className:'Warlock',subclass:'Fiend',level:3,rulesEdition:'2024',spells:['Command']},2);assert.equal(granted?.selectedGrantedSpells.length,1);assert.equal(granted?.selectedBudgetSpells,0)
 const legacy=sourceCapacityReference(options,{className:'Warlock',subclass:'Fiend',level:3,spells:['Command']},2);assert.deepEqual(legacy?.grantedSpells,[]);assert.equal(legacy?.selectedBudgetSpells,1)
})
import {sourceGrantedSpells,sourceEffectiveSpells} from '../../src/core/domain/casting-source-selection.ts'
test('derived subclass grants merge without mutating authored ownership or consuming prepared budgets twice',()=>{
 const source={className:'Warlock',subclass:'Fiend',level:3,rulesEdition:'2024' as const,spells:['Command','Authored spell']};const original=JSON.stringify(source)
 assert.equal(sourceGrantedSpells(source).length,4);assert.equal(sourceEffectiveSpells(source).length,5);assert.equal(sourceEffectiveSpells(source).filter(id=>id==='Command').length,1);assert.equal(JSON.stringify(source),original)
 const emptyCatalog=sourceCapacityReference([],source,2);assert.equal(emptyCatalog?.selectedBudgetSpells,0);assert.equal(emptyCatalog?.unknownAssignments,2)
})
test('Divine Soul selection includes Cleric base spells and cantrips but never infers affinity grants',()=>{
 const options=[{value:'Bless',label:'Bless',level:1,class:['Cleric']},{value:'Light',label:'Light',level:0,class:['Cleric']},{value:'Magic Missile',label:'Magic Missile',level:1,class:['Sorcerer']},{value:'Find Familiar',label:'Find Familiar',level:1,class:['Wizard']}]
 const source={className:'Sorcerer',subclass:'Divine Soul',level:1}
 assert.deepEqual(sourceSpellOptions(options,source,1).map(option=>option.value),['Bless','Magic Missile']);assert.deepEqual(sourceSpellOptions(options,source,0).map(option=>option.value),['Light']);assert.deepEqual(sourceGrantedSpells(source),[])
 assert.deepEqual(sourceSpellOptions(options,{...source,subclass:'Draconic Bloodline'},1).map(option=>option.value),['Magic Missile']);assert.deepEqual(sourceSpellOptions(options,{...source,className:'Wizard'},1).map(option=>option.value),['Find Familiar'])
})
test('legacy Fiend expanded choices never borrow the 2024 always-prepared catalog',()=>{
 const options=[{value:'Suggestion',label:'Suggestion',level:2,class:[]},{value:'Blindness/Deafness',label:'Blindness/Deafness',level:2,class:[]}]
 assert.deepEqual(sourceSpellOptions(options,{className:'Warlock',subclass:'Fiend',level:3},2).map(option=>option.value),['Blindness/Deafness'])
 assert.deepEqual(sourceSpellOptions(options,{className:'Warlock',subclass:'Fiend',level:3,rulesEdition:'2024'},2).map(option=>option.value),['Suggestion'])
})
test('manual resource and point contribution learning has a level basis without inventing slot budgets',()=>{
 const result=calculateMulticlassSpellcasting([{className:'Wizard',level:3,resourceType:'focus'},{className:'Sorcerer',level:4,resourceType:'points'}],{INT:16,CHA:16},2)
 assert.equal(result.combinedCasterLevel,4);assert.equal(result.totalPreparedSpells,12);assert.deepEqual(result.standardSlots,Array(9).fill(0));assert.equal(result.customFocus,0);assert.equal(result.customPoints,0)
})
