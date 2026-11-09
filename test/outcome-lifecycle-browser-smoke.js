import assert from 'node:assert/strict'
import { browserProbe } from '../tools/qa/browser-probe.mjs'

await browserProbe(async ({ evaluate, send, delay }) => {
  const checks = await evaluate(`async () => {
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const until = async (fn, label) => { for(let i=0;i<80;i++){ const value=fn(); if(value)return value; await wait(40) } throw Error('Timed out: '+label) };
    const p=document.querySelector('#q-app').__vue_app__.config.globalProperties.$pinia,m=p._s.get('monster'),e=p._s.get('editor');
    e.activeMode='monster';e.style='2024';e.visualTemplate='modern'; await wait(100); m.$reset(); await wait(0); m.addAction();
    const source=()=>m.actions.find(x=>x.id==='outcome-life')||m.actions.at(-1); Object.assign(source(),{id:'outcome-life',name:'Outcome lifecycle witness',description:'Authored description remains.',outcomes:[{id:'a',trigger:'hit',effects:[{kind:'text',text:'First payload'}],extension:{value:'retain'},diceTable:[{roll:'1',effect:'Table witness'}]},{id:'b',trigger:'success',refs:['a'],effects:[{kind:'text',text:'Second payload'}]},{id:'c',trigger:'failure',effects:[{kind:'text',text:'Third payload'}]}]});
    const studio=await until(()=>[...document.querySelectorAll('.q-expansion-item')].find(x=>x.querySelector('.q-item__label')?.textContent.trim()==='Actions & Traits Studio'),'studio'); if(!studio.classList.contains('q-expansion-item--expanded'))studio.querySelector('.q-item').click();
    const chip=()=>document.querySelector('[data-composer-chain="outcome-life"] [data-chain-cell="outcomes"]');
    const menu=()=>document.querySelector('.chain-editor-menu .chain-outcomes')?.closest('.chain-editor');
    const click=async(label,root=menu())=>{const button=[...root.querySelectorAll('button')].find(x=>x.getAttribute('aria-label')===label||x.textContent.trim()===label);if(!button)throw Error('Missing button '+label);button.click();await wait(80)};
    const open=async()=>{const c=await until(chip,'outcome chip');c.scrollIntoView({block:'center'});c.click();return until(menu,'outcome menu')};
    const ids=()=>[...menu().querySelectorAll('fieldset[data-outcome-id]')].map(x=>x.dataset.outcomeId);
    const saved=JSON.stringify(source().outcomes), checks={};
    await open(); await click('Move outcome 1 down'); checks.reorder=JSON.stringify(ids())==='["b","a","c"]';checks.draftIsolation=JSON.stringify(source().outcomes)===saved;await click('Cancel');await until(()=>!menu(),'cancel');checks.cancel=JSON.stringify(source().outcomes)===saved;
    await open();await click('Duplicate outcome 1');const duplicate=ids()[1];checks.uniqueDuplicate=!!duplicate&&!['a','b','c'].includes(duplicate)&&ids().length===4;await click('Apply');await until(()=>!menu(),'apply duplicate');if(!source().outcomes[1]?.extension)throw Error('Duplicate witness '+JSON.stringify({checks,duplicate,saved:source().outcomes}));checks.semanticCaption=!!document.querySelector('#render table.outcome-dice-table caption')&&!document.querySelector('#render').textContent.includes('<caption>');checks.copyMetadata=source().outcomes[1].extension.value==='retain'&&source().outcomes[1].extension!==source().outcomes[0].extension&&source().outcomes[2].refs[0]==='a';
    await open();await click('Remove outcome 1');checks.deleteConfirmation=menu().textContent.includes('Remove and keep references')&&ids().includes('a');await click('Keep outcome');checks.keepOutcome=ids().includes('a');await click('Remove outcome 1');await click('Remove and keep references');checks.noCascade=ids().includes('b')&&!ids().includes('a')&&menu().textContent.toLowerCase().includes('missing');await click('Apply');await until(()=>!menu(),'apply removal');checks.referencesRetained=source().outcomes.find(x=>x.id==='b').refs[0]==='a'&&source().outcomes.length===3;
    source().outcomes=[{id:'same',trigger:'hit',effects:[]},{id:'same',trigger:'miss',refs:['same'],effects:[]},null];await wait(100);const malformed=JSON.stringify(source().outcomes);await open();checks.rawRecordsVisible=ids().length===3&&menu().textContent.includes('shared ID');await click('Assign new clause ID to outcome 2');await click('Assign ID and keep references');checks.identityRepair=ids()[1]!=='same'&&ids()[0]==='same';await click('Cancel');await until(()=>!menu(),'cancel repair');checks.repairCancel=JSON.stringify(source().outcomes)===malformed;
    source().outcomes='raw legacy data';await wait(80);await open();checks.outerRecovery=menu().textContent.includes('invalid format');await click('Replace with empty outcome list');await click('Confirm empty outcome list');checks.replacementDraft=ids().length===0&&source().outcomes==='raw legacy data';await click('Cancel');await until(()=>!menu(),'cancel replacement');checks.outerCancel=source().outcomes==='raw legacy data';
    source().outcomes=[{trigger:'hit',effects:[{kind:'text',text:'Legacy result'}]},{id:'stable',trigger:'miss',effects:[]}];await wait(80);await open();checks.legacyDraftId=!!ids()[0]&&ids()[1]==='stable'&&!source().outcomes[0].id;await click('Apply');await until(()=>!menu(),'apply legacy');checks.appliedIdentity=!!source().outcomes[0].id&&source().outcomes[1].id==='stable';
    window.__outcomeLifecycleSaved=JSON.stringify(source().outcomes);return checks;
  }`.replace('async () => {','(async () => {') + ')()')
  assert.ok(Object.values(checks).every(Boolean), JSON.stringify(checks))
  const expected = await evaluate('window.__outcomeLifecycleSaved')
  await send('Page.reload'); await delay(500)
  const reload = await evaluate(`(async()=>{for(let i=0;i<80;i++){const m=document.querySelector('#q-app')?.__vue_app__?.config.globalProperties.$pinia?._s.get('monster');const action=m?.actions.find(x=>x.id==='outcome-life');if(action)return JSON.stringify(action.outcomes);await new Promise(r=>setTimeout(r,40))}return null})()`)
  assert.equal(reload, expected, 'Applied outcome identities must survive reload')
  console.log('Outcome lifecycle browser checks:', JSON.stringify({ ...checks, reload: true }))
})
