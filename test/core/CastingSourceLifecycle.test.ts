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
import {scaleCastingCapacity} from '../../src/core/usecases/AutoSyncSpellcasting.ts'
import {migrateMonsterSchema} from '../../src/core/usecases/MigrateMonsterSchema.ts'
import {setMonsterBinding} from '../../src/core/domain/monster-bindings.ts'
import {defaultMonster} from '../../src/core/domain/types.ts'
test('highest-slot mode scales a class level independently from spendable slots and learning',()=>{
 const caster={className:'Wizard',level:3,contribution:{mode:'rules' as const,target:'slots' as const,numerator:1,denominator:1,highestSlot:{mode:'combined' as const,numerator:1,denominator:1,multiplier:0.5}}}
 assert.equal(sourceSpellCeiling(caster,10,2),3);assert.equal(sourceSpellCeiling({...caster,contribution:undefined},10,2),2)
 assert.equal(sourceLearningMetrics(caster,2,10,2).preparedSpells,12)
 assert.equal(calculateMulticlassSpellcasting([caster],{},2).standardSlots[2],0)
})
test('decimal multiplier precedes a legacy fraction and stays bounded for invalid inputs',()=>{
 assert.equal(scaleCastingCapacity(100,{multiplier:0.29,numerator:1,denominator:2}),29)
 assert.equal(scaleCastingCapacity(7,{numerator:1,denominator:2}),3)
 assert.equal(scaleCastingCapacity(7,{multiplier:0,numerator:1,denominator:1}),0)
 assert.equal(scaleCastingCapacity(7,{multiplier:Infinity}),0)
 assert.equal(scaleCastingCapacity(7,{numerator:-1,denominator:-1}),0)
 const wizard={className:'Wizard',level:7,contribution:{mode:'custom' as const,target:'slots' as const,numerator:1,denominator:1,multiplier:0.5}}
 assert.equal(calculateMulticlassSpellcasting([wizard],{},2).combinedCasterLevel,3)
})
test('grant progression uses its own basis and toggle without writing authored spells',()=>{
 const source={className:'Warlock',subclass:'Fiend',rulesEdition:'2024' as const,level:3,spells:['Hex'],spellGrants:[{spell:'Light',minLevel:5,origin:'species' as const},{spell:'Command',minLevel:1,origin:'class' as const}],contribution:{mode:'rules' as const,target:'pact' as const,numerator:1,denominator:1,grants:{mode:'combined' as const,numerator:1,denominator:1,multiplier:0.5}}}
 assert.deepEqual(sourceGrantedSpells(source,4,2),['Command'])
 const grants=sourceGrantedSpells(source,10,2);assert.ok(grants.includes('Light'));assert.ok(grants.includes('Fireball'));assert.equal(grants.filter(name=>name==='Command').length,1)
 assert.deepEqual(sourceEffectiveSpells({...source,automaticGrants:false},10,2),['Hex']);assert.deepEqual(source.spells,['Hex'])
})
test('migration retains 0 preparation, grant toggles, and decimal progression without reviving a removed source',()=>{
 const monster=defaultMonster();Object.assign(monster.spellcasting,{primarySourceEnabled:false,multiclass:{enabled:true},automaticGrants:false,spellGrants:[{spell:' Light ',minLevel:1,origin:'species'},{spell:'Invalid',minLevel:0,origin:'other'}],contribution:{mode:'custom',target:'slots',numerator:1,denominator:2,multiplier:0.4},preparedCountOverride:0})
 const result=migrateMonsterSchema(JSON.parse(JSON.stringify(monster))).spellcasting
 assert.equal(hasCastingSources(result),false);assert.equal(result.automaticGrants,false);assert.equal(result.preparedCountOverride,0);assert.equal(result.contribution?.multiplier,0.4);assert.deepEqual(result.spellGrants,[{spell:'Light',minLevel:1,origin:'species'}])
})
test('extra roll and preparation bindings retain source identity and explicit zero capacity',()=>{
 const monster=defaultMonster();monster.spellcasting.class='Wizard';monster.spellcasting.level=3;monster.spellcasting.classes=[{id:'pact',className:'Warlock',level:2,stat:'CHA',preparedCountOverride:0,preparedInterval:'short_rest',save:{override:true,overrideValue:15},attack:{override:true,overrideValue:4}}]
 const sc=setMonsterBinding(monster,'spellcasting.classes[id=pact].save.overrideValue',{mode:'formula',expr:'PB+14'}).model.spellcasting
 const learning=castingLearningSummary(sc,{},2)
 assert.equal(learning.perClass[1]?.id,'pact');assert.equal(learning.perClass[1]?.saveDc,16);assert.equal(learning.perClass[1]?.spellAttack,4);assert.equal(learning.perClass[1]?.preparedSpells,0);assert.equal(learning.perClass[1]?.preparedInterval,'short_rest');assert.equal(learning.spells,learning.perClass[0]?.preparedSpells)
 const promoted=removeCastingSource(sc,'primary').source;assert.equal(promoted.preparedCountOverride,0);assert.equal(promoted.preparedInterval,'short_rest');assert.equal(promoted.save.overrideValue,16)
})

import { buildCastingProjection } from '../../src/core/domain/casting-projection.ts'

test('the statblock shows the selected preparation list and separates encounter spells from restricted spells', () => {
  const { spellcasting } = defaultMonster()
  Object.assign(spellcasting, {
    class: 'Wizard', level: 5, preparedCountOverride: 5, preparedSpellList: 'Cleric',
    preparedInterval: 'short_rest',
    standard: ['Mending', 'Magic Missile', 'Unseen Servant', 'Shield'],
    spellCastingTimeMap: { Shield: '2 actions' },
    spellCadenceMap: { Shield: 'short_rest' },
  })
  const plate = buildCastingProjection(spellcasting, {
    stats: { INT: 16 }, proficiency: 3, save: 14, attack: 6,
    spellLevel: name => name === 'Mending' ? 0 : 1,
  })
  assert.equal(plate.prepared, 'Can prepare 5 Cleric spells per Short Rest')
  const spells = plate.levels.flatMap(row => row.spells)
  assert.deepEqual(spells.filter(spell => spell.restricted).map(spell => spell.name).sort(), ['Mending', 'Shield', 'Unseen Servant'])
  assert.equal(spells.find(spell => spell.name === 'Mending')?.castingTime, '1 minute')
})

test('shared Pact sources announce common recovery once and retain a different row cadence', () => {
  const { spellcasting } = defaultMonster()
  Object.assign(spellcasting, {
    class: 'Warlock', level: 9, stat: 'CHA', resourceType: 'pact', refreshRate: 'short_rest',
    slots: [0, 0, 0, 0, 3], standard: ['Hold Monster'],
    classes: [{
      id: 'wizard', className: 'Wizard', level: 9, stat: 'INT', resourceType: 'pact', refreshRate: 'Short Rest',
      slots: [0, 0, 0, 0, 3], spells: ['Telekinesis', 'Shield'], levelCadences: { 1: 'long_rest' },
    }],
  })
  const plate = buildCastingProjection(spellcasting, {
    stats: { CHA: 18, INT: 14 }, proficiency: 4, save: 16, attack: 8,
    spellLevel: name => name === 'Shield' ? 1 : 5,
  })
  assert.match(plate.resource, /3 spell slots.*Short Rests/)
  assert.equal(plate.levels.filter(row => row.level === 5).length, 2)
  assert.ok(plate.levels.filter(row => row.level === 5).every(row => !row.heading.includes('Short Rest')))
  assert.match(plate.levels[0].heading, /Long Rest/)
})

test('matching spell recovery and preparation share one sentence with an explicit capacity', () => {
  const { spellcasting } = defaultMonster()
  Object.assign(spellcasting, {
    class: 'Warlock', level: 9, stat: 'CHA', resourceType: 'pact', refreshRate: 'short_rest',
    slots: [0, 0, 0, 0, 3], standard: ['Hold Monster'],
    preparedCountOverride: 5, preparedSpellList: 'Cleric', preparedInterval: 'Short Rest',
  })
  const options = {
    stats: { CHA: 18 }, proficiency: 4, save: 16, attack: 8,
    spellLevel: () => 5,
  }
  const same = buildCastingProjection(spellcasting, options)
  assert.equal(same.resource, 'You have 3 spell slots of 5th level. On a Short Rest, regains all expended spell slots and can prepare 5 Cleric spells')
  assert.equal(same.prepared, '')

  const different = buildCastingProjection({ ...spellcasting, preparedInterval: 'long_rest' }, options)
  assert.equal(different.resource, 'You have 3 spell slots of 5th level, regained on Short Rests')
  assert.equal(different.prepared, 'Can prepare 5 Cleric spells per Long Rest')
})
