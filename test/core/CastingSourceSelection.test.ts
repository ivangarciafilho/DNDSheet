import test from 'node:test'
import assert from 'node:assert/strict'
import { sourceSpellCeiling, sourceSpellOptions, sourceAssignedAtLevel, replaceSourceLevelSpells } from '../../src/core/domain/casting-source-selection.ts'
const options=[{value:'Ward',label:'Ward',level:1,class:['Wizard']},{value:'Fireball',label:'Fireball',level:3,class:['Wizard']},{value:'Bless',label:'Bless',level:1,class:['Cleric']},{value:'Custom',label:'Custom',level:1,class:[],custom:true},{value:'Command',label:'Command',level:1,class:['Cleric']},{value:'Light',label:'Light',level:0,class:['Wizard']}]
const wizard={className:'Wizard',level:1}
test('a source ceiling follows its own slots, not combined progression',()=>{assert.equal(sourceSpellCeiling(wizard),1);assert.equal(sourceSpellCeiling({...wizard,level:5}),3);assert.deepEqual(sourceSpellOptions(options,wizard,3),[])})
test('class filters never fall back to the unrestricted catalog',()=>{assert.deepEqual(sourceSpellOptions(options,{className:'Ranger',level:2},3),[]);assert.deepEqual(sourceSpellOptions(options,wizard,1).map(s=>s.value),['Custom','Ward'])})
test('subclass extensions and custom spells are scoped without losing alphabetic order',()=>{assert.deepEqual(sourceSpellOptions(options,{className:'Warlock',subclass:'Fiend',level:1},1).map(s=>s.value),['Command','Custom'])})
test('explicit ceiling bypass permits high class spells without disabling class filters',()=>{assert.deepEqual(sourceSpellOptions(options,{...wizard,bypassSlotFilter:true},3).map(s=>s.value),['Fireball'])})
test('third caster subclass starts at its own third caster level',()=>{assert.equal(sourceSpellCeiling({className:'Fighter',subclass:'Eldritch Knight',level:3}),1);assert.equal(sourceSpellCeiling({className:'Rogue',subclass:'Arcane Trickster',level:2}),0)})
test('unknown focus source has no invented standard class capacity',()=>{assert.equal(sourceSpellCeiling({className:'Iron Kingdoms focus',level:8,resourceType:'focus'}),undefined);assert.equal(sourceSpellOptions(options,{className:'Iron Kingdoms focus',level:1},3).length,1)})
test('existing off-list and unknown authored assignments stay visible',()=>{assert.deepEqual(sourceAssignedAtLevel(options,['Bless','Fireball','Authored spell'],1),['Bless']);assert.deepEqual(sourceAssignedAtLevel(options,['Authored spell'],0),['Authored spell'])})
test('level edits preserve other levels, ownership isolation and deduplicate choices',()=>{const original=['Ward','Fireball'];assert.deepEqual(replaceSourceLevelSpells(options,original,1,['Bless','Bless']),['Fireball','Bless']);assert.deepEqual(original,['Ward','Fireball'])})

import { calculateMulticlassSpellcasting, getSpellSlotsForClass, calculateSpellcastingMetrics } from '../../src/core/usecases/AutoSyncSpellcasting.ts'
test('actual multiclass engine never converts a custom focus system into Wizard levels',()=>{
 const base=calculateMulticlassSpellcasting([{className:'Wizard',level:3}],{},2)
 const custom=calculateMulticlassSpellcasting([{className:'Wizard',level:3},{className:'Iron Kingdoms Focus',level:20}],{},2)
 assert.deepEqual(custom.slots,base.slots);assert.equal(custom.combinedCasterLevel,3);assert.equal(custom.totalPreparedSpells,base.totalPreparedSpells);assert.equal(custom.totalCantripsKnown,base.totalCantripsKnown)
 assert.deepEqual(getSpellSlotsForClass('Innate source',20),Array(9).fill(0));assert.equal(calculateSpellcastingMetrics('Focus source',20).casterType,'custom')
})
test('actual engine recognizes subclass-driven third casting without counting all fighter levels',()=>{
 const result=calculateMulticlassSpellcasting([{className:'Fighter',subclass:'Eldritch Knight',level:6},{className:'Wizard',level:1}],{},2)
 assert.equal(result.combinedCasterLevel,3)
})

import { sourceCapacityReference } from '../../src/core/domain/casting-source-selection.ts'
test('reference capacities distinguish known and prepared models using each source ability',()=>{
 const wizard=sourceCapacityReference(options,{className:'Wizard',level:3,spells:['Light','Ward','Authored spell']},3)
 assert.equal(wizard?.preparedSpells,6);assert.equal(wizard?.selectionModel,'prepared');assert.equal(wizard?.selectedCantrips,1);assert.equal(wizard?.selectedSpells,1);assert.equal(wizard?.unknownAssignments,1)
 const sorcerer=sourceCapacityReference(options,{className:'Sorcerer',level:3},5)
 assert.equal(sorcerer?.preparedSpells,4);assert.equal(sorcerer?.selectionModel,'known')
})
test('custom capacities remain unknown and subclass catalog options are not inferred grants',()=>{
 assert.equal(sourceCapacityReference(options,{className:'Iron Kingdoms focus',level:20}),undefined)
 const fiend=sourceCapacityReference(options,{className:'Warlock',subclass:'Fiend',level:3,spells:['Command']},2)
 assert.equal(fiend?.selectedSpells,1);assert.equal(fiend?.preparedSpells,4);assert.equal(fiend?.subclassCatalogSpells.length,10)
})
test('third caster reference uses its known-spell table and subtype cantrips, not Wizard preparation',()=>{
 const knight=calculateSpellcastingMetrics('Fighter',6,5,'Eldritch Knight')
 assert.equal(knight.casterType,'third');assert.equal(knight.preparedSpells,4);assert.equal(knight.cantripsKnown,2);assert.equal(knight.highestSlot,1)
 const trickster=calculateSpellcastingMetrics('Rogue',3,5,'Arcane Trickster')
 assert.equal(trickster.cantripsKnown,3);assert.equal(trickster.preparedSpells,3)
 assert.equal(calculateSpellcastingMetrics('third caster',3,5).casterType,'third')
})
test('base capacity ceilings match actual progression and druid starting cantrips',()=>{
 assert.equal(calculateSpellcastingMetrics('Paladin',1,3).highestSlot,0);assert.equal(calculateSpellcastingMetrics('Paladin',1,3).preparedSpells,0)
 assert.equal(calculateSpellcastingMetrics('Druid',1,3).cantripsKnown,2);assert.equal(calculateSpellcastingMetrics('Cleric',1,3).cantripsKnown,3)
})
