import assert from 'node:assert/strict'
import { browserProbe } from '../tools/qa/browser-probe.mjs'

// One owned fixture, real editor controls for every edit/removal/addition below.
await browserProbe(async ({ evaluate, send, delay }) => {
 const checks = await evaluate(`(async()=>{
  const wait=ms=>new Promise(r=>setTimeout(r,ms)),until=async(fn,label)=>{for(let i=0;i<100;i++){const v=fn();if(v)return v;await wait(40)}throw Error('Timed out: '+label+' '+document.querySelector('#render')?.textContent)};
  const ok=(value,label)=>{if(!value)throw Error(label);return true};
  const p=document.querySelector('#q-app').__vue_app__.config.globalProperties.$pinia,m=p._s.get('monster'),e=p._s.get('editor');e.activeMode='monster';e.style='2024';m.$reset();await wait(0);
  m.stats.INT=18;m.stats.CHA=16;m.proficiencyOverride=true;m.proficiency=3;
  Object.assign(m.spellcasting,{primarySourceEnabled:true,class:'Wizard',level:5,stat:'INT',standard:['Fire Bolt','Shield'],slots:[4,3,2],resourceType:'slots',refreshRate:'long_rest',levelAmountMap:{1:4},levelCadenceMap:{1:'long_rest'},bonusActionLevelMap:{1:true},spellAmountMap:{Shield:2},spellCadenceMap:{Shield:'short_rest'},spellBonusActionMap:{Shield:false},atWill:[{rate:'AT_WILL',count:0,spells:['Light']}],classes:[{id:'source-warlock',className:'Warlock',subclass:'Fiend',level:3,stat:'CHA',spells:['Burning Hands'],slots:[0,2],resourceType:'pact',refreshRate:'short_rest',levelAmounts:{1:2},levelCadences:{1:'short_rest'},levelBonusAction:{1:false},extension:{retain:true}}]});
  m.name='Casting source lifecycle witness';
  const expand=async node=>{ok(node,'Missing expansion');if(!node.classList.contains('q-expansion-item--expanded'))node.querySelector('.q-item').click();await wait(100)};
  const outer=await until(()=>[...document.querySelectorAll('.q-expansion-item')].find(x=>x.querySelector('.q-item__label')?.textContent.trim()==='Spellcasting'),'outer casting');await expand(outer);
  const panel=await until(()=>document.querySelector('.class-casting-editor-panel'),'casting panel');
  const field=(root,label)=>[...root.querySelectorAll('.q-field')].find(x=>x.querySelector('.q-field__label')?.textContent.trim()===label);
  const select=async(node,label)=>{ok(node,'Missing select '+label);node.querySelector('.q-field__control').click();const option=await until(()=>[...document.querySelectorAll('.q-menu .q-item')].find(x=>x.getClientRects().length&&x.textContent.trim()===label),'option '+label);option.click();await wait(120)};
  const fill=(node,value)=>{ok(node,'Missing input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(node,value);node.dispatchEvent(new Event('input',{bubbles:true}));node.dispatchEvent(new Event('change',{bubbles:true}))};
  const fold=()=>document.querySelector('[data-casting-source-fold="primary"]');await until(fold,'primary fold');await expand(fold());
  const source=()=>document.querySelector('[data-casting-source="primary"]'),row=level=>source().querySelector('[data-source-level="'+level+'"]');
  const plate=()=>document.querySelector('#render .class-spellcasting'),lines=()=>[...plate().querySelectorAll('.spell-level-line')],shield=()=>lines().find(x=>x.textContent.includes('Shield'));
  await until(()=>shield()?.textContent.includes('(2/Short Rest)'),'spell exception render');
  const result={};
  result.independentFolds=ok(panel.querySelectorAll('[data-casting-source-fold]').length===2,'Every source owns a fold');
  fold().querySelector('.q-item').click();await until(()=>!source().getClientRects().length,'source folded');result.foldHidesOwnBody=ok(!source().getClientRects().length,'Fold must hide source body');await expand(fold());
  result.rowOrder=ok(shield().querySelector('.sb-spell-head').textContent.includes('(4/Long Rest), Level 1 (Bonus Action):'),'Amount/cadence/level/action row order');
  result.spellOrder=ok(shield().textContent.indexOf('(2/Short Rest)')>=0&&shield().textContent.indexOf('(2/Short Rest)')<shield().textContent.indexOf('Shield')&&shield().textContent.includes('(Action)'),'Amount/cadence/name/Action exception order');
  result.combinedLevel=ok(plate().textContent.includes('5th Level Spellcaster'),'Combined resource caster level, not summed Pact level');
  result.learningCounts=ok(plate().textContent.includes('7 cantrips')&&plate().textContent.includes('15 known/prepared spells'),'Combined cantrip and learning limits');
  result.distinctModifiers=ok(plate().textContent.includes('+7')&&plate().textContent.includes('+6'),'Distinct source casting modifiers');
  const learning=Array.from(source().querySelectorAll('.q-expansion-item')).find(x=>x.querySelector('.q-item__label')?.textContent.trim()==='Spell-learning calculation');await expand(learning);
  fill(field(learning,'Cantrips multiplier').querySelector('input'),'2');await until(()=>plate().textContent.includes('11 cantrips')&&plate().textContent.includes('15 known/prepared spells'),'independent cantrip multiplier');
  fill(field(learning,'Known/prepared spells divisor').querySelector('input'),'2');await until(()=>plate().textContent.includes('11 cantrips')&&plate().textContent.includes('10 known/prepared spells'),'independent spell divisor');result.learningModifiers=true;
  await expand(row(1));const spellRow=source().querySelector('[data-source-spell="Shield"]');fill(field(spellRow,'Amount').querySelector('input'),'');await until(()=>!shield().textContent.includes('(2/Short Rest)'),'no spell amount hides cadence');
  result.noImplicitSpellBudget=ok(!shield().textContent.includes('Short Rest'),'Divergent cadence must not borrow row amount');
  fill(field(spellRow,'Amount').querySelector('input'),'2');await select(field(spellRow,'Spell recovery'),'Long Rest');await until(()=>shield().textContent.includes('(2), Shield'),'amount-only exception');
  result.independentCadenceDedup=ok(!shield().textContent.includes('(2/Long Rest)'),'Matching cadence hides independently of a differing amount');
  await select(field(spellRow,'Bonus Action'),'Inherit row');await until(()=>!shield().textContent.includes('(Action)'),'inherit row action');result.actionInheritance=true;
  const meta=await until(()=>panel.querySelector('[data-metamagic-toggle]'),'top metamagic toggle');meta.click();await until(()=>m.spellcasting.metamagic?.enabled,'enable metamagic');result.topMetadataToggle=ok(!meta.closest('[data-casting-source]'),'Metamagic toggle is outside individual source panels');
  const extraFold=panel.querySelector('[data-casting-source-fold="source-warlock"]');await expand(extraFold);
  result.sourceIsolation=ok(document.querySelector('[data-casting-source="source-warlock"]').textContent.includes('Burning Hands')&&!source().textContent.includes('Burning Hands'),'Assigned lists stay source-local');
  panel.querySelector('[data-remove-casting-source="primary"]').click();await until(()=>m.spellcasting.class==='Warlock'&&m.spellcasting.classes.length===0,'primary promotion');
  result.primaryPromotion=ok(m.spellcasting.standard.includes('Burning Hands')&&!m.spellcasting.standard.includes('Shield'),'Removing primary promotes its successor');
  result.promotedMaps=ok(m.spellcasting.levelAmountMap[1]===2&&m.spellcasting.levelCadenceMap[1]==='short_rest'&&m.spellcasting.extension.retain,'Promotion keeps local maps and unknown metadata');
  panel.querySelector('[data-remove-casting-source="primary"]').click();await until(()=>m.spellcasting.primarySourceEnabled===false&&!document.querySelector('#render .class-spellcasting'),'remove all class sources');
  result.emptyClassState=ok(!!panel.querySelector('[data-casting-empty]'),'All class sources can be removed');
  result.innatePreserved=ok(document.querySelector('#render .innate-spellcasting')?.textContent.includes('Light')&&m.spellcasting.atWill.length===1,'Removing classes preserves independent innate casting');
  panel.querySelector('[data-add-casting-source]').click();await until(()=>m.spellcasting.primarySourceEnabled!==false&&panel.querySelector('[data-casting-source-fold="primary"]'),'add first source');
  result.addFirstSource=ok(m.spellcasting.classes.length===0&&m.spellcasting.class==='Wizard','Adding from empty creates one primary source');
  await wait(250);return result;
 })()`)
 assert.ok(Object.values(checks).every(Boolean),JSON.stringify(checks))
 const origin=await evaluate('performance.timeOrigin');await send('Page.reload',{ignoreCache:true});await delay(200)
 const reload=await evaluate(`(async()=>{for(let i=0;i<100;i++){const m=document.querySelector('#q-app')?.__vue_app__?.config.globalProperties.$pinia?._s.get('monster');if(performance.timeOrigin!==${JSON.stringify(origin)}&&m?.name==='Casting source lifecycle witness')return m.spellcasting.primarySourceEnabled!==false&&m.spellcasting.class==='Wizard'&&m.spellcasting.classes.length===0&&m.spellcasting.atWill[0].spells.includes('Light');await new Promise(r=>setTimeout(r,40))}return false})()`)
 assert.equal(reload,true,'Final source lifecycle and independent innate casting survive reload')
 console.log('Casting source browser checks:',JSON.stringify({...checks,reload}))
},{port:Number(process.env.DNDSHEET_CASTING_SOURCES_CDP_PORT||9360)})
