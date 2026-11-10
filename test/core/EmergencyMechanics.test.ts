import test from 'node:test'
import assert from 'node:assert/strict'
import { mechanicRichHtml,mechanicPlainText } from '../../src/core/domain/mechanic-rich-text.ts'
import { inferAbility,outcomePhrase } from '../../src/core/domain/ability-grammar.ts'
import {outcomesHtml} from '../../src/core/domain/outcome-rendering.ts'
import {descriptionContainersHtml,descriptionContainersText} from '../../src/core/domain/description-containers.ts'
import {formatRandomTableAsHtml,tableToProse} from '../../src/core/domain/random-table.ts'
import {traitChainView,traitCellPatch,traitCellValue} from '../../src/core/domain/trait-composer.ts'
import {reactionChainView,reactionCellPatch} from '../../src/core/domain/reaction-composer.ts'
import {defaultTrait,defaultAction,defaultMonster} from '../../src/core/domain/types.ts'
import {roleTransition} from '../../src/core/domain/role-transition.ts'

test('mechanic rich text retains supported formatting but strips tag attributes and escapes unsupported markup',()=>{
 const html=mechanicRichHtml('<b onclick="bad()">Bold</b> <em>Italic</em><u>Underlined</u><s>Strike</s><sub>2</sub><sup>3</sup><script>bad()</script>')
 assert.match(html,/<b>Bold<\/b> <em>Italic<\/em>/);assert.doesNotMatch(html,/<script|onclick/);assert.match(html,/&lt;script&gt;/);assert.equal(mechanicPlainText('<b>Bold</b> <i>Italic</i> &amp; <scope>'),'Bold Italic & <scope>');assert.equal(mechanicRichHtml('&lt;b&gt;literal&lt;/b&gt;'),'&lt;b&gt;literal&lt;/b&gt;')
})
test('formatted mechanics survive outcome HTML, containers, table results and readable plain exports',()=>{
 const ability=inferAbility({outcomes:[{id:'result',trigger:'hit',effects:[{kind:'text',text:'<b>Push</b> the <i>target</i>.'}],rider:'<u>Until dawn</u>',diceTable:[{roll:'1',effect:'<em>Recover</em>'}]}]});const html=outcomesHtml(ability);assert.match(html,/<b>Push<\/b>/);assert.match(html,/<u>Until dawn<\/u>/);assert.match(html,/<em>Recover<\/em>/);assert.doesNotMatch(outcomePhrase(ability).join(' '),/<\/?(?:b|i|u|em)>/)
 const containers=[{id:'c',kind:'text' as const,text:'<b>Retain</b> <scope>'}];assert.match(descriptionContainersHtml(containers),/<b>Retain<\/b> &lt;scope&gt;/);assert.equal(descriptionContainersText(containers),'Retain <scope>')
 const table={id:'t',dice:'1d2',rows:[{id:'r',min:1,max:2,text:'<i>Recover</i>'}],fallback:'<b>Wait</b>'};assert.match(formatRandomTableAsHtml(table),/<i>Recover<\/i>/);assert.doesNotMatch(tableToProse(table),/<\/?[bi]>/)
})
test('trait and reaction roles expose the shared mechanics, targeting and outcome fields',()=>{
 const trait=defaultTrait('trait');const ids=traitChainView(trait).flatMap(row=>row.cells.map(cell=>cell.id));for(const id of ['attack','save-ability','target-count','outcomes'])assert.ok(ids.includes(id));const outcome=[{id:'effect',trigger:'hit',effects:[{text:'Keep'}]}];assert.deepEqual(traitCellPatch(trait,'outcomes',outcome).outcomes,outcome)
 const reaction={id:'r',name:'Answer',trigger:'When hit',description:'',limitedUse:{count:0,rate:'DAY'}};const reactionIds=reactionChainView(reaction,'').flatMap(row=>row.cells.map(cell=>cell.id));for(const id of ['attack','save-ability','target-count','outcomes','trigger'])assert.ok(reactionIds.includes(id));assert.equal(reactionCellPatch(reaction,'usage',{mode:'limited',count:2,rate:'SHORT_REST'}).limitedUse?.rate,'SHORT_REST')
})
test('reviewed role conversion retains shared mechanics, outcomes and unknown extension data',()=>{
 const monster=defaultMonster(),action={...defaultAction('source'),attackSource:'spell' as const,attackReach:'ranged' as const,outcomes:[{id:'result',trigger:'hit',effects:[{text:'<i>Keep</i>'}]}],extension:{keep:true}};monster.actions=[action];const result=roleTransition(monster,'source','action','trait','copy');const copy=result.patch?.traits?.at(-1) as unknown as typeof action;assert.deepEqual(copy.outcomes,action.outcomes);assert.deepEqual(copy.extension,{keep:true});assert.notEqual(copy.outcomes,action.outcomes);assert.equal(copy.attackSource,'spell');assert.equal(monster.actions[0].id,'source')
})

import {setMonsterBinding,resolveMonsterBindings} from '../../src/core/domain/monster-bindings.ts'
import {migrateMonsterSchema} from '../../src/core/usecases/MigrateMonsterSchema.ts'
test('role conversion preserves live shared formula bindings through dependency changes and JSON reload',()=>{
 let monster=defaultMonster();monster.proficiencyOverride=true;monster.proficiency=2;monster.actions=[defaultAction('bound')];monster=setMonsterBinding(monster,'actions[id=bound].attackBonus',{mode:'formula',expr:'PB+1'}).model;const decision=roleTransition(monster,'bound','action','trait','bound-copy');Object.assign(monster,decision.patch);monster.proficiency=5;const resolved=resolveMonsterBindings(monster);assert.deepEqual(resolved.errors,{});const copied=resolved.model.traits.find(item=>item.id==='bound-copy') as unknown as {attackBonus:number};assert.equal(copied.attackBonus,6);const reloaded=migrateMonsterSchema(JSON.parse(JSON.stringify(resolved.model)));assert.equal(reloaded.bindings?.['traits[id=bound-copy].attackBonus']?.mode,'formula')
})
test('passive skill overrides are canonical saved state, preserved by JSON migration',()=>{
 const monster=defaultMonster();monster.passives={medicine:{override:true,overrideValue:23,advantage:true,disadvantage:false,condition:'Stabilizing a creature'},searchMoveToActionGroup:false,searchActionType:'Bonus Action',riders:{search:'<i>Keep this rider</i>'}};const result=migrateMonsterSchema(JSON.parse(JSON.stringify(monster)));assert.deepEqual(result.passives,monster.passives)
})

import {computeTraitTag} from '../../src/core/domain/defense-and-traits-utils.ts'
test('copied Action recharge stays visible and editable through the shared Trait usage adapter',()=>{
 const monster=defaultMonster();monster.actions=[{...defaultAction('recharging'),recharge:'4-12'}];const copy=roleTransition(monster,'recharging','action','trait','trait-recharging').patch!.traits!.at(-1)!;
 assert.equal(computeTraitTag(copy),'Recharge 4-12');assert.match(traitChainView(copy)[0].cells.find(cell=>cell.id==='trait-usage')!.text,/Recharge 4-12/);
 const draft=traitCellValue(copy,'trait-usage') as {mode:string;min:number;max:number};assert.equal(draft.mode,'recharge');assert.equal(draft.max,12);
 const edited={...copy,...traitCellPatch(copy,'trait-usage',{mode:'limited',count:2,rate:'SHORT_REST'})};assert.equal(computeTraitTag(edited),'2/Short Rest');assert.equal((edited as unknown as {recharge:string}).recharge,'');assert.equal(monster.actions[0].recharge,'4-12');
 const legacy={...copy,rechargeTiming:'DAWN'};assert.equal(computeTraitTag(legacy),'Recharges at Dawn');assert.equal((traitCellValue(legacy,'trait-usage') as {rechargeTiming:string}).rechargeTiming,'DAWN');assert.equal(computeTraitTag({...legacy,...traitCellPatch(legacy,'trait-usage','')}),'');
})
test('copying a shared entry to Reaction preserves its authored trigger',()=>{
 const monster=defaultMonster();monster.actions=[{...defaultAction('triggered'),trigger:'<i>When hit</i>'}];const copy=roleTransition(monster,'triggered','action','reaction','reaction-copy').patch!.reactions!.at(-1)!;assert.equal(copy.trigger,'<i>When hit</i>');
})
