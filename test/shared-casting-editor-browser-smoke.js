import assert from 'node:assert/strict'
import { browserProbe } from '../tools/qa/browser-probe.mjs'

await browserProbe(async ({ evaluate, send, delay }) => {
 const results=await evaluate(String.raw`(async()=>{
  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  const until=async(fn,label)=>{for(let i=0;i<100;i++){const value=fn();if(value)return value;await wait(40)}throw Error('Timed out: '+label+' '+document.querySelector('#render .class-spellcasting')?.textContent)};
  const check=(condition,label)=>{if(!condition)throw Error(label);return true};
  const pinia=document.querySelector('#q-app').__vue_app__.config.globalProperties.$pinia;
  const monster=pinia._s.get('monster'),editor=pinia._s.get('editor');monster.$reset();await wait(0);editor.activeMode='monster';editor.style='2024';editor.visualTemplate='modern';
  monster.name='Shared casting grant witness';monster.stats.WIS=18;
  Object.assign(monster.spellcasting,{class:'Cleric',subclass:'Life Domain',rulesEdition:'2024',automaticGrants:true,spellGrants:[{spell:'Guidance',origin:'species',kind:'known',minLevel:2},{spell:'Light',origin:'class',kind:'prepared',minLevel:2}],level:3,stat:'WIS',standard:['Cure Wounds'],slots:[4,2],resourceType:'slots',refreshRate:'long_rest',levelAmountMap:{1:2},levelCadenceMap:{1:'long_rest'},preparedCountOverride:5,preparedInterval:'Long Rest',classes:[{id:'grant-extra',className:'Wizard',level:3,stat:'WIS',spells:['Magic Missile'],slots:[4,2],resourceType:'slots',refreshRate:'long_rest',levelAmounts:{1:2},levelCadences:{1:'long_rest'}}]});
  const expand=async(el)=>{check(el,'Missing fold');if(!el.classList.contains('q-expansion-item--expanded'))el.querySelector('.q-item').click();await wait(170)};
  const outer=await until(()=>[...document.querySelectorAll('.q-expansion-item')].find(x=>x.querySelector('.q-item__label')?.textContent.trim()==='Spellcasting'),'Spellcasting panel');await expand(outer);
  const panel=await until(()=>document.querySelector('.class-casting-editor-panel'),'shared class editor');
  const source=id=>panel.querySelector('[data-casting-source="'+id+'"]');
  const fold=id=>panel.querySelector('[data-casting-source-fold="'+id+'"]');
  await expand(fold('primary'));await expand(fold('grant-extra'));
  const field=(root,label)=>[...root.querySelectorAll('.q-field')].find(x=>x.querySelector('.q-field__label')?.textContent.trim()===label);
  const marked=(root,selector)=>{const node=root.querySelector(selector);return node?.matches('.q-field')?node:node?.closest('.q-field')};
  const select=async(node,label)=>{check(node,'Missing picker for '+label);node.querySelector('.q-field__control').click();const item=await until(()=>[...document.querySelectorAll('.q-menu .q-item')].find(x=>x.getClientRects().length&&x.textContent.trim()===label),'option '+label);item.click();await wait(110)};
  const plate=()=>document.querySelector('#render .class-spellcasting');const lines=()=>[...(plate()?.querySelectorAll('.spell-level-line')||[])];
  const facts={};
  const sharedLabels=['Class','Subclass','Level','Casting stat'];
  facts.matchingIdentityControls=check(sharedLabels.every(label=>field(source('primary'),label)&&field(source('grant-extra'),label)),'First and later sources must expose the same class, subclass, level and casting-stat controls');
  const learning=id=>source(id).querySelector('[data-source-learning]');await expand(learning('primary'));await expand(learning('grant-extra'));
  const has=(id,selector)=>Boolean(learning(id).querySelector(selector));
  facts.matchingLearningControls=check(['[data-source-slot-ceiling]','[data-source-grant-level]','[data-source-prepared-count]','[data-source-prepared-cadence]'].every(selector=>has('primary',selector)&&has('grant-extra',selector)),'Shared learning fold must contain the same slot ceiling, grant level, preparation count and cadence');
  facts.resourcesInsideLearning=check(['Source resource','Source recovery'].every(label=>field(learning('primary'),label)&&field(learning('grant-extra'),label)),'Resource and recovery controls belong inside both learning folds');
  const grantsToggle=await until(()=>source('primary').querySelector('[data-source-grants-toggle]'),'automatic grants setting');
  facts.topGrantSettings=check(!learning('primary').contains(grantsToggle)&&['primary','grant-extra'].every(id=>source(id).querySelector('[data-source-rules]')&&source(id).querySelector('[data-source-grants-toggle]')),'Grant controls must be near the top of both source panels, outside their learning folds');
  await expand(source('primary').querySelector('[data-source-level="1"]'));
  await until(()=>source('primary').querySelector('[data-source-grants="1"]')?.textContent.includes('Bless'),'verified level-one grant guidance');
  facts.grantsSeparateFromAssignments=check(source('primary').querySelector('[data-source-grants="1"]').textContent.includes('Always prepared')&&!monster.spellcasting.standard.includes('Bless'),'Automatic grants must remain separate from manual assignment');
  const merged=await until(()=>lines().find(row=>row.textContent.includes('Bless')&&row.textContent.includes('Magic Missile')&&row.textContent.includes('Cure Wounds')),'merged compatible spell row');
  facts.compatibleRowsMerge=check(lines().filter(row=>row.querySelector('.sb-spell-head')?.textContent.includes('Level 1')).length===1&&merged.querySelector('.sb-spell-head').textContent.includes('(2), Level 1:'),'Compatible rows merge and inherit the shared recovery');
  facts.noSourceAttribution=check(!/Cleric|Wizard|Life Domain/i.test(plate().textContent),'The statblock must omit source names');
  const original=JSON.stringify(monster.spellcasting.standard);
  const savedSlots=JSON.stringify(monster.spellcasting.slots);
  const setMultiplier=(key,value)=>{const input=marked(learning('primary'),'[data-source-learning-multiplier="'+key+'"]').querySelector('input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,value);input.dispatchEvent(new Event('input',{bubbles:true}));};
  const hasSpell=name=>[...plate().querySelectorAll('.spell-name')].some(node=>node.textContent===name);
  facts.modeledGrants=check(hasSpell('Guidance')&&hasSpell('Light')&&!plate().textContent.includes('Species'),'Modeled feature grants enter casting without attribution');
  setMultiplier('highestSlot','0.5');await until(()=>!hasSpell('Aid')&&hasSpell('Bless'),'fractional slot ceiling');facts.slotCeilingIndependent=check(JSON.stringify(monster.spellcasting.slots)===savedSlots,'Slot eligibility must not rewrite saved budgets');
  setMultiplier('highestSlot','1');await until(()=>hasSpell('Aid'),'restore slot ceiling');
  setMultiplier('grants','0.5');await until(()=>!hasSpell('Guidance')&&!hasSpell('Bless'),'fractional grant progression');
  facts.grantProgressionIndependent=check(hasSpell('Cure Wounds')&&JSON.stringify(monster.spellcasting.slots)===savedSlots,'Grant progression keeps manual spells and slots');
  setMultiplier('grants','1');await until(()=>hasSpell('Guidance')&&hasSpell('Bless'),'restore grant progression');
  grantsToggle.click();await until(()=>!hasSpell('Bless')&&!hasSpell('Guidance')&&!hasSpell('Light'),'automatic grant disabled');
  facts.authoredSpellsPreserved=check(JSON.stringify(monster.spellcasting.standard)===original&&plate().textContent.includes('Cure Wounds')&&plate().textContent.includes('Magic Missile'),'Disabling automatic grants must retain authored spells and their display');
  grantsToggle.click();await until(()=>plate().textContent.includes('Bless'),'automatic grant restored');
  facts.grantsRestored=check(JSON.stringify(monster.spellcasting.standard)===original,'Re-enabling grants must not append automatic spells into saved assignments');
  await select(marked(learning('primary'),'[data-source-prepared-cadence]'),'Downtime');
  await until(()=>plate().textContent.includes('Can prepare 5 spells during downtime'),'live downtime preparation cadence');
  facts.preparationUpdatesLive=check(!/Cleric|Wizard|Life Domain/i.test(plate().textContent),'Preparation sentence follows settings without source attribution');
  await wait(250);return facts;
 })()`)
 assert.ok(Object.values(results).every(Boolean),JSON.stringify(results))
 const origin=await evaluate('performance.timeOrigin');await send('Page.reload',{ignoreCache:false});await delay(200)
 let reload
 for(let i=0;i<180;i++){
  reload=await evaluate(`(()=>{const m=document.querySelector('#q-app')?.__vue_app__?.config.globalProperties.$pinia?._s.get('monster');const text=document.querySelector('#render .class-spellcasting')?.textContent||'';return {reloaded:performance.timeOrigin!==${JSON.stringify(origin)},name:m?.name,assigned:m ? Array.from(m.spellcasting.standard) : undefined,preparation:text.includes('Can prepare 5 spells during downtime'),grants:text.includes('Bless'),extra:text.includes('Magic Missile')}})()`)
  if(reload.reloaded&&reload.name==='Shared casting grant witness'&&reload.preparation&&reload.grants&&reload.extra)break
  await delay(150)
 }
 assert.deepEqual(reload,{reloaded:true,name:'Shared casting grant witness',assigned:['Cure Wounds'],preparation:true,grants:true,extra:true})
 const fiendChecks=await evaluate(`(async()=>{
  const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  const until=async(fn,label)=>{for(let i=0;i<100;i++){const v=fn();if(v)return v;await wait(40)}throw Error('Timed out: '+label)};
  const pinia=document.querySelector('#q-app').__vue_app__.config.globalProperties.$pinia;
  const monster=pinia._s.get('monster');
  Object.assign(monster.spellcasting,{primarySourceEnabled:true,class:'Warlock',subclass:'Fiend Patron',rulesEdition:'2014',automaticGrants:true,level:3,stat:'CHA',standard:['Light','Mage Hand','Minor Illusion','Misty Step','Hold Person','Darkness','Mirror Image','Invisibility'],spellGrants:[],classes:[]});
  await wait(80);
  const expand=async item=>{if(item&&!item.classList.contains('q-expansion-item--expanded')){item.querySelector('.q-item').click();await wait(80)}};
  await expand([...document.querySelectorAll('.q-expansion-item')].find(item=>item.querySelector('.q-item__label')?.textContent.trim()==='Spellcasting'));
  await expand(await until(()=>document.querySelector('[data-casting-source-fold="primary"]'),'fiend fold'));
  const src=await until(()=>document.querySelector('[data-casting-source="primary"]'),'fiend primary source');
  const over=await until(()=>src.querySelector('[data-source-over-limit]'),'over-limit warning');
  const plan=await until(()=>src.querySelector('[data-subclass-expanded-plan]'),'fiend expanded plan');
  const apply=src.querySelector('[data-apply-expanded-spells]');
  if(!over.textContent.includes('Over limit')||!plan.textContent.includes('Warlock:Fiend')||!apply)throw Error('Unexpected plan/over-limit state: '+over.textContent+' | '+plan.textContent);
  apply.click();
  await until(()=>monster.spellcasting.spellGrants?.some(g=>g.spell==='Burning Hands'&&g.origin==='subclass'&&g.kind==='prepared'),'fiend expanded grants applied');
  await until(()=>document.querySelector('#render .class-spellcasting')?.textContent.includes('Scorching Ray'),'fiend expanded spell projected');
  return {overLimit:over.textContent,grantCount:monster.spellcasting.spellGrants.length};
 })()`)
 const origin2=await evaluate('performance.timeOrigin');await send('Page.reload',{ignoreCache:false});await delay(200)
 let fiendReload
 for(let i=0;i<180;i++){
  fiendReload=await evaluate(`(()=>{const m=document.querySelector('#q-app')?.__vue_app__?.config.globalProperties.$pinia?._s.get('monster');return {reloaded:performance.timeOrigin!==${JSON.stringify(origin2)},subclass:m?.spellcasting?.subclass,grants:(m?.spellcasting?.spellGrants||[]).map(g=>g.spell)}})()`)
  if(fiendReload.reloaded&&fiendReload.subclass==='Fiend Patron'&&fiendReload.grants.includes('Scorching Ray'))break
  await delay(150)
 }
 assert.equal(fiendReload.subclass,'Fiend Patron')
 assert.ok(fiendReload.grants.includes('Burning Hands')&&fiendReload.grants.includes('Scorching Ray'))
 const afterRemoveAndError=await evaluate(`(async()=>{
  const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  const until=async(fn,label)=>{for(let i=0;i<100;i++){const v=fn();if(v)return v;await wait(40)}throw Error('Timed out: '+label)};
  const pinia=document.querySelector('#q-app').__vue_app__.config.globalProperties.$pinia;
  const monster=pinia._s.get('monster');
  const expand=async item=>{if(item&&!item.classList.contains('q-expansion-item--expanded')){item.querySelector('.q-item').click();await wait(80)}};
  await expand([...document.querySelectorAll('.q-expansion-item')].find(item=>item.querySelector('.q-item__label')?.textContent.trim()==='Spellcasting'));
  await expand(document.querySelector('[data-casting-source-fold="primary"]'));
  const src=await until(()=>document.querySelector('[data-casting-source="primary"]'),'fiend panel after reload');
  src.querySelector('[data-remove-expanded-spells]').click();
  await until(()=>!(monster.spellcasting.spellGrants||[]).some(g=>g.origin==='subclass'),'fiend expanded grants removed');
  monster.proficiency=-1;
  const err=await until(()=>src.querySelector('[data-source-metrics-error]'),'metrics error banner');
  const inputs=[...src.querySelectorAll('input[readonly]')].map(i=>i.value);
  monster.proficiency=2;
  return {removed:true,errText:err.textContent,autoDash:inputs.includes('—')};
 })()`)
 assert.ok(afterRemoveAndError.removed&&afterRemoveAndError.autoDash&&/Invalid proficiency/i.test(afterRemoveAndError.errText),JSON.stringify(afterRemoveAndError))
 console.log('Shared casting editor checks:',JSON.stringify({...results,reload,fiendChecks,afterRemoveAndError}))
},{port:Number(process.env.DNDSHEET_SHARED_CASTING_CDP_PORT||9365)})
