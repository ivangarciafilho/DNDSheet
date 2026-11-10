import test from 'node:test'
import assert from 'node:assert/strict'
import { formatNumericPresentation, normalizeNumericPresentation } from '../../src/core/domain/numeric-presentation.ts'
import { bindingSource, resolveNumeric } from '../../src/core/domain/formula.ts'
import { defaultMonster } from '../../src/core/domain/types.ts'
import { setMonsterBinding, resolveMonsterBindings } from '../../src/core/domain/monster-bindings.ts'
import { formulaContextForMonster } from '../../src/core/domain/formula-context.ts'
import { migrateMonsterSchema } from '../../src/core/usecases/MigrateMonsterSchema.ts'

test('numeric presentation is safe, attribute-free and independent of the formula grammar', () => {
  assert.deepEqual(normalizeNumericPresentation({bold:true,italic:'true',underline:false,strike:true,onclick:'bad'}),{bold:true,strike:true})
  assert.equal(formatNumericPresentation('<img onerror=bad>',{bold:true,italic:true,underline:true,strike:true}),'<strong><em><u><s>&lt;img onerror=bad&gt;</s></u></em></strong>')
  const monster=defaultMonster(), binding={mode:'formula' as const,expr:'PB+1',presentation:{italic:true}}
  const result=resolveNumeric(binding,formulaContextForMonster(monster))
  assert.equal(result.ok,true);assert.equal(bindingSource(binding),'PB+1')
  assert.equal(resolveNumeric({mode:'formula',expr:'<i>PB+1</i>'},formulaContextForMonster(monster)).ok,false)
})
test('formatted scalar bindings persist, still update dynamically and survive JSON migration', () => {
  let monster=defaultMonster();monster.proficiencyOverride=true;monster.proficiency=2
  monster=setMonsterBinding(monster,'HP.HD',{mode:'formula',expr:'PB+1',presentation:{bold:true,underline:true}}).model
  monster.proficiency=4;monster=resolveMonsterBindings(monster).model
  assert.equal(monster.HP.HD,5)
  const loaded=migrateMonsterSchema(JSON.parse(JSON.stringify(monster)))
  assert.deepEqual(loaded.bindings?.['HP.HD']?.presentation,{bold:true,underline:true})
  assert.equal(bindingSource(loaded.bindings?.['HP.HD']),'PB+1')
})

import { inferAbility, mechanicsPhrase, scopePhrase } from '../../src/core/domain/ability-grammar.ts'
test('structured ability numeric presentation follows semantic fields without changing plain prose', () => {
 const action={attackSource:'spell' as const,attackReach:'ranged' as const,attackBonus:7,stat:'CHA' as const,save:{override:true,overrideValue:15},targeting:{count:3,kind:'creature',range:{distance:30,unit:'ft' as const}}}
 const ability=inferAbility(action)
 const context={formatValue:(field:string,text:string)=>formatNumericPresentation(text,field==='attackBonus'?{italic:true}:field==='targeting.count'?{underline:true}:{})}
 assert.match(mechanicsPhrase(ability,context).join(' '),/<em>\+7<\/em>/)
 assert.match(scopePhrase(ability,context),/<u>3<\/u>/)
 assert.doesNotMatch(mechanicsPhrase(ability).join(' '),/<\/?(?:em|u)>/)
 assert.match(scopePhrase(ability),/3 creatures/)
})
import { supportsNumericPresentation } from '../../src/core/domain/numeric-presentation.ts'
import { formatLanguageItem, formatMinimalistRegen } from '../../src/core/domain/defense-and-traits-utils.ts'
test('format controls are limited to semantic numeric outputs with adapters', () => {
 for(const path of ['HP.HD','stats.STR','actions[id=a].attackBonus','traits[id=t].targeting.count','attacks[id=a].damage.count','extendedHp.damageThreshold','sensesList[id=s].range','languagesList[id=l].telepathyRange']) assert.equal(supportsNumericPresentation(path),true,path)
 for(const path of ['actions[id=a].crAnnotation.maxDamage','spellcasting.slots[level=1]','extendedHp.deathPrevention.saveDc','__proto__.value','ACType','actions[id=a].limitedUse.count','traits[id=a].rechargeMin','reactions[id=a].rechargeMax','attacks[id=a].save']) assert.equal(supportsNumericPresentation(path),false,path)
})
test('AC formatting is offered only when the renderer shows the authored scalar', () => {
 assert.equal(supportsNumericPresentation('AC', {acConfig:{enabled:false,baseMode:'flat',abilityBonus:'none'}}),true)
 for(const acConfig of [{enabled:true},{enabled:false,baseMode:'natural_armor'},{enabled:false,temporary:'shield'},{enabled:false,conditionMode:'custom'}]) assert.equal(supportsNumericPresentation('AC',{acConfig}),false)
})
test('language and regeneration scalar display hooks preserve mechanics and default prose', () => {
 const fmt=(field:string,value:string|number)=>formatNumericPresentation(value,{italic:field==='telepathyRange'||field==='amount'})
 assert.equal(formatLanguageItem({id:'t',name:'Telepathy',telepathy:true,telepathyRange:120},fmt),'telepathy <em>120</em> ft.')
 assert.equal(formatLanguageItem({id:'t',name:'Telepathy',telepathy:true,telepathyRange:120}),'telepathy 120 ft.')
 assert.match(formatMinimalistRegen({enabled:true,amount:10,valueSource:'flat'},undefined,fmt),/<em>10<\/em>/)
})
