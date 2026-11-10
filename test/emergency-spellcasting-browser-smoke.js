import assert from 'node:assert/strict'
import { browserProbe } from '../tools/qa/browser-probe.mjs'

// Runs in an isolated browser profile. Fixture seeding is limited to initial state;
// every asserted setting change below is made through the rendered editor controls.
await browserProbe(async ({ evaluate, send, delay }) => {
  const result = await evaluate(`(async () => {
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    const until = async (fn, label) => { for (let i=0;i<100;i++) { const value=fn(); if(value)return value; await wait(40) } throw Error('Timed out: '+label+' '+JSON.stringify({map:monster.spellcasting.levelCadenceMap,rows:[...document.querySelectorAll('#render .spell-level-line')].map(x=>x.textContent)})) };
    const assert = (condition, label) => { if(!condition)throw Error(label) };
    const pinia=document.querySelector('#q-app').__vue_app__.config.globalProperties.$pinia;
    const monster=pinia._s.get('monster'), editor=pinia._s.get('editor');
    editor.activeMode='monster';editor.style='2024';editor.visualTemplate='modern';editor.visualTheme='wotc';
    monster.$reset();await wait(0);
    Object.assign(monster.spellcasting, {class:'Wizard',level:5,stat:'INT',standard:['Fire Bolt','Magic Missile','Shield'],slots:[4,3,2,0,0,0,0,0,0],resourceType:'slots',refreshRate:'long_rest',splitHighCadence:false,alwaysAvailableOnly:false,levelCadenceMap:{1:'long_rest'},bonusActionLevelMap:{},spellCadenceMap:{'Magic Missile':'long_rest',Shield:'long_rest'},multiclass:{...monster.spellcasting.multiclass,enabled:true},classes:[{id:'emergency-fiend',className:'Warlock',subclass:'Fiend',level:3,stat:'CHA',slots:[0,2,0,0,0,0,0,0,0],spells:['Burning Hands'],resourceType:'pact',refreshRate:'short_rest',levelCadences:{},levelBonusAction:{},spellCadenceMap:{}},{id:'emergency-focus',className:'Iron Kingdoms Focus',level:3,stat:'CHA',spells:['Light'],resourceType:'focus',resourceValue:2,refreshRate:'short_rest'}]});
    monster.name='Emergency spellcasting UI witness';
    const visible = node => node && node.getClientRects().length;
    const expand = async item => { assert(item,'Expansion missing');if(!item.classList.contains('q-expansion-item--expanded'))item.querySelector('.q-item').click();await wait(80) };
    const outer=await until(()=>[...document.querySelectorAll('.q-expansion-item')].find(item=>item.querySelector('.q-item__label')?.textContent.trim()==='Spellcasting'),'spellcasting expansion');await expand(outer);
    const panel=await until(()=>document.querySelector('.class-casting-editor-panel'),'class casting panel');
    const labelField=(root,label)=>[...root.querySelectorAll('.q-field')].find(field=>field.querySelector('.q-field__label')?.textContent.trim()===label);
    const select=async(field,label)=>{assert(field,'Missing field for '+label);field.querySelector('.q-field__control').click();const item=await until(()=>[...document.querySelectorAll('.q-menu .q-item')].find(item=>visible(item)&&item.textContent.trim()===label),'option '+label);item.click();await wait(350)};
    const row = level => [...panel.querySelectorAll('.q-expansion-item')].find(item=>!item.hasAttribute('data-source-level') && [...(item.querySelector('.q-item')?.querySelectorAll('.text-subtitle2')||[])].some(node=>node.textContent.trim()===(level===0?'Cantrips':'Level '+level)));
    const plateRows=()=>[...document.querySelectorAll('#render .class-spellcasting .spell-level-line')];
    const primary=level=>plateRows().find(node=>node.querySelector('.sb-spell-head')?.textContent.trim().includes(level===0?'Cantrips':'Level '+level)&&!node.querySelector('.sb-spell-head')?.textContent.includes('Warlock')&&!node.querySelector('.sb-spell-head')?.textContent.includes('Iron Kingdoms'));
    const cantrips=await until(()=>row(0),'primary cantrip controls');const bonus=[...cantrips.querySelector('.q-item').querySelectorAll('button')].find(button=>button.textContent.trim()==='BA');assert(bonus,'Primary cantrip Bonus Action button');bonus.click();await until(()=>primary(0)?.querySelector('.sb-spell-head')?.textContent.includes('Bonus Action'),'cantrip bonus render');
    const first=await until(()=>row(1),'primary level one controls');await select(first.querySelector('.q-item .q-select'),'Short Rest');await until(()=>primary(1)?.querySelector('.sb-spell-head')?.textContent.includes('Short Rest'),'primary short rest render');
    const divergent=primary(1);assert(divergent.querySelectorAll('.spell-cadence-badge').length===2,'Both explicit Long Rest exceptions must remain visible after row changes');
    await select(first.querySelector('.q-item .q-select'),'Long Rest');await until(()=>primary(1)?.querySelectorAll('.spell-cadence-badge').length===0,'redundant cadence badges disappear');
    await select(first.querySelector('.q-item .q-select'),'Short Rest');await until(()=>primary(1)?.querySelectorAll('.spell-cadence-badge').length===2,'divergent cadence badges return');
    const spell=document.querySelector('#render .class-spellcasting .spell-name'),style=getComputedStyle(spell);assert(style.fontStyle==='italic'&&Number(style.fontWeight)<=400,'Spell names must be italic and normal weight: '+style.fontStyle+'/'+style.fontWeight);
    const source=await until(()=>document.querySelector('[data-casting-source="emergency-fiend"]'),'extra source editor');
    const sourceLevel=source.querySelector('[data-source-level="1"]');await expand(sourceLevel);
    const picker=labelField(sourceLevel,'Spells owned by this source');assert(picker,'Owned spell picker');picker.querySelector('.q-field__control').click();
    const options=await until(()=>{const items=[...document.querySelectorAll('.q-menu .q-item')].filter(visible);return items.length?items:null},'source spell choices');
    assert(options.some(item=>item.textContent.includes('Command')&&item.textContent.includes('subclass')),'Fiend expanded list must offer Command');assert(!options.some(item=>/Magic Missile/.test(item.textContent)),'Warlock source must exclude wizard-only Magic Missile');
    options.find(item=>item.textContent.includes('Command')&&item.textContent.includes('subclass')).click();document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',code:'Escape',bubbles:true}));await wait(80);
    // Clicking the field again closes an open multiple-selection menu without touching state.
    if(document.querySelector('.q-menu')){picker.querySelector('.q-field__control').click();await wait(80)}
    await until(()=>monster.spellcasting.classes.find(s=>s.id==='emergency-fiend').spells.includes('Command'),'source assignment');
    await select(labelField(sourceLevel,'Level recovery'),'Long Rest');
    const sourceBonus=[...sourceLevel.querySelectorAll('.q-checkbox')].find(node=>node.textContent.trim()==='Bonus action');assert(sourceBonus,'Source Bonus action control');sourceBonus.click();
    await until(()=>plateRows().some(node=>/Warlock.*Fiend/.test(node.textContent)&&/Long Rest/.test(node.querySelector('.sb-spell-head')?.textContent||'')&&/Bonus Action/.test(node.textContent)&&/Command/.test(node.textContent)),'owned source settings rendered');
    const focus=await until(()=>document.querySelector('[data-casting-source="emergency-focus"]'),'focus source');const resource=labelField(focus,'Authored resource maximum').querySelector('input');resource.value='6';resource.dispatchEvent(new Event('input',{bubbles:true}));resource.dispatchEvent(new Event('change',{bubbles:true}));await select(labelField(focus,'Source recovery'),'Long Rest');
    await until(()=>document.querySelector('#render').textContent.includes('Iron Kingdoms Focus: 6 Focus Points')&&monster.spellcasting.classes.find(s=>s.id==='emergency-focus').refreshRate==='long_rest','manual focus resource render');
    const saved={cantripBonus:monster.spellcasting.bonusActionLevelMap[0],rowCadence:monster.spellcasting.levelCadenceMap[1],sources:monster.spellcasting.classes};await wait(250);
    return {cantripBonus:true,rowCadence:true,duplicateBadgeSuppression:true,divergentBadges:true,italicNames:true,sourceSubclassFilter:true,sourceIsolation:!monster.spellcasting.standard.includes('Command'),sourceSettings:true,manualFocus:true,saved:JSON.stringify(saved)};
  })()`)
  assert.ok(Object.entries(result).filter(([key])=>key!=='saved').every(([,value])=>value===true), JSON.stringify(result))
  const previousOrigin = await evaluate('performance.timeOrigin')
  await send('Page.reload', { ignoreCache: true })
  const persisted = await evaluate(`(async()=>{for(let i=0;i<100;i++){const p=document.querySelector('#q-app')?.__vue_app__?.config.globalProperties.$pinia,m=p?._s.get('monster');if(performance.timeOrigin!==${JSON.stringify(previousOrigin)}&&m?.name==='Emergency spellcasting UI witness'){await new Promise(r=>setTimeout(r,100));return JSON.stringify({cantripBonus:m.spellcasting.bonusActionLevelMap[0],rowCadence:m.spellcasting.levelCadenceMap[1],sources:m.spellcasting.classes})}await new Promise(r=>setTimeout(r,40))}return null})()`)
  assert.equal(persisted,result.saved,'Source-owned row settings and manual resources must survive reload')
  await delay(50)
  console.log('Emergency spellcasting browser checks:',JSON.stringify({...result,saved:undefined,reload:true}))
}, { port: Number(process.env.DNDSHEET_EMERGENCY_CDP_PORT || 9356) })
