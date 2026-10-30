import test from 'node:test'
import assert from 'node:assert/strict'
import { defaultMonster, defaultAction, defaultTrait, defaultCrAnnotation } from '../../src/core/domain/types.ts'
import { migrateMonsterSchema } from '../../src/core/usecases/MigrateMonsterSchema.ts'
import { chainView, cellPatch } from '../../src/core/domain/composer-chain.ts'
import { reactionChainView, reactionCellPatch } from '../../src/core/domain/reaction-composer.ts'
import { traitChainView, traitCellPatch } from '../../src/core/domain/trait-composer.ts'
import { lairChainView } from '../../src/core/domain/role-headers.ts'
import { COMPOSER_ROW_ORDER } from '../../src/core/domain/action-composer.ts'

for (const version of [8,9,10,11]) test(`v${version} migration preserves complete composer records, memberships and edit round trips`,()=>{
  const raw=defaultMonster();raw.saveVersion=version
  raw.actions=[{...defaultAction('action'),name:'Authored action',description:'Kept prose',stat:'CHA',save:{override:true,overrideValue:19},
    effects:[{case:'Failure',effect:'Blinded'}],range:'60 ft.',attackSource:'spell',attackReach:'ranged',attackBonus:7,
    targeting:{count:3,kind:'creatures',range:{distance:60,unit:'ft'},planes:['Ethereal']},outcomes:[{trigger:'failure',effects:[{formula:'2d6',damageType:'radiant'}],rider:'Until next turn'}],
    school:'Abjuration',spellLevel:'Cantrip',components:['V','S'],duration:'1 minute',areaShape:'sphere',areaDistance:'20',deliveryType:'Save',
    limitedUse:{count:3,rate:'DAY'},recharge:'5-6',rechargeMin:5,rechargeMax:6,stagePool:'all',customPreamble:true,bonusAction:true,
    crAnnotation:{...defaultCrAnnotation(),include:false,automatic:false,maxDamage:42}}]
  raw.traits=[{...defaultTrait('trait'),name:'Authored trait',description:'Trait prose',customPreamble:true,rechargeTiming:'DAY',rechargeCount:3,rechargeTagOverride:'At Dawn',stagePool:'all',isConditional:true,conditionalTrigger:'While bloodied',renderInRechargeSection:true,rechargeSection:'Dawn'}]
  raw.reactions=[{id:'reaction',name:'Rebuke',description:'Reaction prose',trigger:'When struck',limitedUse:{count:4,rate:'DAY'}}]
  raw.lairActions=[{id:'lair',description:'Lair prose',crAnnotation:{...defaultCrAnnotation(),include:false}}]
  raw.legendaryActions.actions=[{actionId:'action',cost:2}];raw.mythicActions.actions=[{actionId:'action',cost:3}]
  raw.multiattacks=[{id:'combo',attacks:[],actions:['action']}]
  Object.assign(raw.actions[0],{unknownLegacy:{nested:['retained']}})
  const snapshot=JSON.stringify(raw),normalized=migrateMonsterSchema(raw)
  assert.equal(JSON.stringify(raw),snapshot)
  for(const key of ['actions','traits','reactions','lairActions','legendaryActions','mythicActions','multiattacks'] as const) assert.deepEqual(normalized[key],raw[key],key)
  assert.deepEqual(migrateMonsterSchema(normalized),normalized,'migration is idempotent')
  Object.assign(normalized.actions[0],cellPatch(normalized.actions[0],'name','Renamed action'))
  Object.assign(normalized.traits[0],traitCellPatch(normalized.traits[0],'name','Renamed trait'))
  Object.assign(normalized.reactions[0],reactionCellPatch(normalized.reactions[0],'trigger','When approached'))
  const reloaded=migrateMonsterSchema(JSON.parse(JSON.stringify(normalized)))
  assert.deepEqual(reloaded,normalized,'edits survive JSON save/load without unrelated field drift')
})

test('all seven model projections follow shared plate row precedence without mutating source',()=>{
  const action=defaultAction('a'),trait=defaultTrait('t'),reaction={id:'r',name:'Rebuke',description:'Prose',trigger:'When struck',limitedUse:{count:1,rate:'DAY'}}
  const views=[...(['action','bonus_action','legendary','mythic'] as const).map(role=>chainView(role,action)),traitChainView(trait),reactionChainView(reaction,'1/Day'),lairChainView()]
  for(const rows of views){
    const order=rows.map(row=>COMPOSER_ROW_ORDER.indexOf(row.row))
    assert.deepEqual(order,[...order].sort((a,b)=>a-b))
    for(const row of rows)for(const cell of row.cells)assert.equal(cell.row,row.row)
  }
})

test('shared import migration preserves optional spellcasting policies and legacy language names',()=>{
  const raw=defaultMonster()
  Object.assign(raw.spellcasting,{resourceType:'pact',refreshRate:'short_rest',displayTitleMode:'split_levels',bypassSlotLevelFilter:true,spellCadenceMap:{light:'DAY'},classes:[{id:'warlock',level:5}],futurePolicy:{keep:true}})
  delete raw.languagesList
  raw.languages="Gith, understands Celestial but can't speak it"
  const normalized=migrateMonsterSchema(raw)
  for(const key of ['resourceType','refreshRate','displayTitleMode','bypassSlotLevelFilter','spellCadenceMap','classes','futurePolicy'])assert.deepEqual(normalized.spellcasting[key],raw.spellcasting[key],key)
  assert.deepEqual(normalized.languagesList?.map(item=>item.name),['Gith','Celestial'])
  assert.equal(normalized.languagesList?.[1].understandsOnly,true)
})
