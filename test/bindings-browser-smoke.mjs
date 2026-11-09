import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'dnd-bindings-'))
const port = 9229
const url = process.env.DNDSHEET_E2E_URL || 'http://localhost:9124/candidate162/index.html#/'
const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [`--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--headless=new', '--disable-gpu', '--no-sandbox', url])
const wait = ms => new Promise(resolve => setTimeout(resolve, ms))
let ws
try {
  let target
  for (let attempt = 0; attempt < 40 && !target; attempt++) {
    await wait(250)
    try { target = (await (await fetch(`http://localhost:${port}/json`)).json()).find(item => item.type === 'page') } catch {}
  }
  if (!target) throw new Error('Browser did not start')
  ws = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise(resolve => ws.addEventListener('open', resolve, { once: true }))
  let id = 0
  const pending = new Map(), errors = []
  ws.addEventListener('message', event => {
    const message = JSON.parse(event.data)
    if (message.id) { const resolve = pending.get(message.id); pending.delete(message.id); resolve?.(message) }
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails)
  })
  const send = (method, params = {}) => new Promise(resolve => { const key = ++id; pending.set(key, resolve); ws.send(JSON.stringify({ id: key, method, params })) })
  await send('Runtime.enable')
  // Simulate a stalled optional font provider. App boot must not wait for it.
  await send('Fetch.enable', { patterns: [{ urlPattern: '*use.typekit.net*', requestStage: 'Request' }] })
  await send('Page.reload')
  const evaluate = async expression => {
    const response = await send('Runtime.evaluate', { expression: `(${expression})()`, awaitPromise: true, returnByValue: true })
    if (response.result?.exceptionDetails) throw new Error(JSON.stringify(response.result.exceptionDetails))
    return response.result?.result?.value
  }
  let ready = false
  for (let attempt = 0; attempt < 50 && !ready; attempt++) {
    ready = await evaluate('()=>!!document.querySelector(\'#q-app\')?.__vue_app__?.config.globalProperties.$pinia?._s.get(\'monster\')')
    if (!ready) await wait(200)
  }
  if (!ready) throw new Error('App did not mount: '+JSON.stringify({errors, page:await evaluate('()=>({url:location.href,body:document.body?.innerText,html:document.documentElement.outerHTML.slice(-700)})')}))
  const result = await evaluate(`async()=>{
    const wait=ms=>new Promise(r=>setTimeout(r,ms)),pinia=document.querySelector('#q-app').__vue_app__.config.globalProperties.$pinia;
    const m=pinia._s.get('monster'),check=(condition,label)=>{if(!condition)throw new Error(label)};
    check(typeof m.setBinding==='function','store API');
    m.$patch({bindings:{},stats:{CHA:20},spellcasting:{save:{override:true,overrideValue:10}},hpModifierOverride:true});await wait(100);
    m.setBinding('spellcasting.save.overrideValue',{mode:'formula',expr:'8 + PB + CHA_MOD'});
    check(m.spellcasting.save.overrideValue===8+m.proficiency+5,'initial DC');
    m.stats.CHA=22;check(m.spellcasting.save.overrideValue===8+m.proficiency+6,'live propagation');
    const before=JSON.stringify(m.$state);let rejected=0;
    for(const expr of ['1/2','1d6','HD+1']){try{m.setBinding('HP.HD',{mode:'formula',expr})}catch{rejected++}}
    check(rejected===3&&JSON.stringify(m.$state)===before,'atomic invalid drafts');
    for(let i=0;i<50&&!document.querySelector('[data-formula-field="stats.CHA"]');i++)await wait(100);
    check(!!document.querySelector('[data-formula-field="stats.CHA"]'),'ability control mounted');
    const field=document.querySelector('[data-formula-field="stats.CHA"]');field.querySelector('.q-field__control').click();await wait(180);
    const options=[...document.querySelectorAll('.q-menu .q-item')];check(options[0]?.textContent.includes('Custom formula'),'custom first');
    options[0].click();await wait(100);const input=field.querySelector('input');const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;
    setter.call(input,'24');input.dispatchEvent(new Event('input',{bubbles:true}));await wait(50);
    [...field.querySelectorAll('button')].find(button=>button.textContent.trim()==='Apply').click();await wait(80);
    check(m.stats.CHA===24&&m.spellcasting.save.overrideValue===8+m.proficiency+7,'UI literal and propagation '+JSON.stringify({cha:m.stats.CHA,dc:m.spellcasting.save.overrideValue,pb:m.proficiency,text:field.textContent}));
    field.querySelector('.q-field__control').click();await wait(100);[...document.querySelectorAll('.q-menu .q-item')].find(item=>item.textContent.includes('Custom formula')).click();await wait(80);
    setter.call(field.querySelector('input'),'31');field.querySelector('input').dispatchEvent(new Event('input',{bubbles:true}));await wait(50);
    [...field.querySelectorAll('button')].find(button=>button.textContent.trim()==='Apply').click();await wait(50);check(m.stats.CHA===24&&field.textContent.includes('maximum'),'invalid UI draft retains value');
    [...field.querySelectorAll('button')].find(button=>button.textContent.trim()==='Cancel').click();await wait(50);
    m.setBinding('stats.CHA',{mode:'formula',expr:'STR'});await wait(60);
    field.querySelector('[aria-label="Detach CHA binding"]').click();await wait(50);check(!m.bindings['stats.CHA'],'UI detach');
    const h=pinia._s.get('history');check(!!h,'history initialized');m.stats.CHA=20;await wait(500);h.clear();h.pushSnapshot('Before source edit');m.stats.CHA=22;await wait(500);
    check(h.canUndo,'undo available');window.dispatchEvent(new KeyboardEvent('keydown',{key:'z',ctrlKey:true,bubbles:true,cancelable:true}));await wait(100);check(m.stats.CHA===20&&m.spellcasting.save.overrideValue===8+m.proficiency+5,'single undo includes dependent DC');
    check(h.canRedo,'redo available');window.dispatchEvent(new KeyboardEvent('keydown',{key:'y',ctrlKey:true,bubbles:true,cancelable:true}));await wait(100);check(m.stats.CHA===22&&m.spellcasting.save.overrideValue===8+m.proficiency+6,'redo');
    return {live:true,invalid:rejected,customFirst:true,uiApply:true,detach:true,undo:true,redo:true,dc:m.spellcasting.save.overrideValue};
  }`)
  await send('Page.reload'); await wait(1800)
  result.reload = await evaluate('()=>{const m=document.querySelector(\'#q-app\').__vue_app__.config.globalProperties.$pinia._s.get(\'monster\');return m.bindings?.[\'spellcasting.save.overrideValue\']?.expr===\'8 + PB + CHA_MOD\'&&m.spellcasting.save.overrideValue===8+m.proficiency+6}')
  result.attackUI = await evaluate(`async()=>{
    const wait=ms=>new Promise(r=>setTimeout(r,ms)),m=document.querySelector('#q-app').__vue_app__.config.globalProperties.$pinia._s.get('monster');
    m.addNewAttack();const attack=m.attacks.at(-1);attack.id='binding-attack';attack.name='Binding witness';attack.range.standard=20;
    const studio=[...document.querySelectorAll('.q-expansion-item')].find(el=>el.querySelector('.q-item__label')?.textContent.trim()==='Actions & Traits Studio');if(!studio.classList.contains('q-expansion-item--expanded'))studio.querySelector('.q-item').click();await wait(150);
    const tab=[...studio.querySelectorAll('button')].find(el=>/^Attacks/.test(el.textContent.trim()));if(!tab)throw new Error('Missing attack tab');tab.click();await wait(200);
    const field=document.querySelector('[data-formula-field="attacks[id=binding-attack].range.standard"]');if(!field)throw new Error('Missing attack numeric control');field.querySelector('.q-field__control').click();await wait(150);
    const custom=[...document.querySelectorAll('.q-menu .q-item')].find(el=>el.textContent.includes('Custom formula'));if(!custom)throw new Error('Attack picker disabled: '+field.textContent);custom.click();await wait(100);
    const input=field.querySelector('input');input.value='PB * 15';input.dispatchEvent(new Event('input',{bubbles:true}));await wait(100);[...field.querySelectorAll('button')].find(el=>el.textContent.trim()==='Apply').click();await wait(100);
    if(attack.range.standard!==m.proficiency*15)throw new Error('Attack range did not apply: '+field.textContent);
    const toggle=document.querySelector('[data-attack-composer="binding-attack"] [data-chain-cell="modifier.override"]');toggle.click();await wait(150);const yes=[...document.querySelectorAll('.chain-editor-menu [role="option"]')].find(el=>el.textContent.trim()==='Yes');if(!yes)throw new Error('Missing attack override option');yes.click();await wait(350);
    const bonus=document.querySelector('[data-formula-field="attacks[id=binding-attack].modifier.overrideValue"]');bonus.querySelector('.q-field__control').click();await wait(200);const customBonus=[...document.querySelectorAll('.q-menu .q-item')].find(el=>el.textContent.includes('Custom formula'));if(!customBonus)throw new Error('Override picker inactive '+JSON.stringify({modifier:attack.modifier,html:bonus.innerHTML.slice(0,450)}));customBonus.click();await wait(150);[...bonus.querySelectorAll('button')].find(el=>el.textContent.trim()==='Cancel').click();await wait(300);return true;
  }`)
  result.structuredDraft = await evaluate(`async()=>{
    const wait=ms=>new Promise(r=>setTimeout(r,ms)),m=document.querySelector('#q-app').__vue_app__.config.globalProperties.$pinia._s.get('monster');
    m.addAction();const a=m.actions.at(-1);Object.assign(a,{id:'binding-action',name:'Finesse witness',attackSource:'weapon',attackReach:'melee',attackBonus:undefined,description:'Keeps authored prose.'});m.stats.STR=10;m.stats.DEX=18;await wait(120);
    const studio=[...document.querySelectorAll('.q-expansion-item')].find(el=>el.querySelector('.q-item__label')?.textContent.trim()==='Actions & Traits Studio');[...studio.querySelectorAll('button')].find(el=>/^All/.test(el.textContent.trim())).click();await wait(150);
    const chain=()=>document.querySelector('[data-composer-chain="binding-action"]');
    chain().querySelector('[data-chain-cell="weapon-ability"]').click();await wait(180);const finesse=[...document.querySelectorAll('.chain-editor-menu [role="option"]')].find(el=>el.textContent.trim()==='Finesse (better of STR and DEX)');if(!finesse)throw new Error('Missing finesse choice');finesse.click();await wait(350);
    if(a.weaponAttackAbility!=='finesse'||!chain().querySelector('[data-chain-cell="attack-bonus"]').textContent.includes('+'+(m.proficiency+4)))throw new Error('Finesse projection mismatch');
    m.stats.DEX=20;await wait(100);if(!chain().querySelector('[data-chain-cell="attack-bonus"]').textContent.includes('+'+(m.proficiency+5)))throw new Error('Finesse does not follow ability');
    const path='actions[id=binding-action].attackBonus';
    const open=async()=>{chain().querySelector('[data-chain-cell="attack-bonus"]').click();await wait(180);const field=document.querySelector('.chain-editor-menu .formula-field');field.querySelector('.q-field__control').click();await wait(180);[...document.querySelectorAll('.q-menu .q-item')].find(el=>el.textContent.includes('Custom formula')).click();await wait(120);return field;};
    let field=await open();let input=field.querySelector('input');input.value='1/2';input.dispatchEvent(new Event('input',{bubbles:true}));await wait(100);if(![...document.querySelector('.chain-editor-menu').querySelectorAll('button')].filter(el=>el.textContent.trim()==='Apply').at(-1)?.disabled)throw new Error('Outer Apply permits invalid nested draft');input.value='PB+2';input.dispatchEvent(new Event('input',{bubbles:true}));await wait(100);[...field.querySelectorAll('button')].find(el=>el.textContent.trim()==='Apply').click();await wait(100);
    const menu=document.querySelector('.chain-editor-menu');[...menu.querySelectorAll('button')].filter(el=>el.textContent.trim()==='Cancel').at(-1).click();await wait(350);if(m.bindings[path]||a.attackBonus!==undefined)throw new Error('Outer cancel leaked binding');
    field=await open();input=field.querySelector('input');input.value='PB+2';input.dispatchEvent(new Event('input',{bubbles:true}));await wait(100);input.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}));input.dispatchEvent(new KeyboardEvent('keyup',{key:'Enter',bubbles:true}));await wait(150);
    if(!document.querySelector('.chain-editor-menu')||m.bindings[path])throw new Error('Nested Enter committed outer draft');
    [...document.querySelector('.chain-editor-menu').querySelectorAll('button')].find(el=>el.textContent.trim()==='Apply').click();await wait(350);if(m.bindings[path]?.expr!=='PB+2'||a.attackBonus!==m.proficiency+2)throw new Error('Outer Apply failed');
    m.proficiency+=1;await wait(100);if(a.attackBonus!==m.proficiency+2)throw new Error('Bound bonus not live');
    return {finesse:true,sourceUpdate:true,cancel:true,enterIsolated:true,apply:true};
  }`)
  result.basicsFamilies = await evaluate(`async()=>{
    const wait=ms=>new Promise(r=>setTimeout(r,ms)),m=document.querySelector('#q-app').__vue_app__.config.globalProperties.$pinia._s.get('monster');
    const paths=['extendedHp.damageThreshold','extendedHp.damageReduction','extendedHp.regeneration.amount','initiativeConfig.lairInitiative','paragonConfig.poolCount'];
    m.initiativeConfig.useLairInitiative=true;
    for(const path of paths)m.setBinding(path,{mode:'formula',expr:path==='paragonConfig.poolCount'?'PB':'PB*5'});
    await wait(100);m.proficiencyOverride=true;m.proficiency=4;await wait(150);
    if(m.extendedHp.damageThreshold!==20||m.extendedHp.regeneration.amount!==20||!m.extendedHp.regeneration.enabled||m.initiativeConfig.lairInitiative!==20||m.paragonConfig.phaseConfigs.length!==4)throw new Error('Basics dependent projection failed');
    const threshold=document.querySelector('[data-formula-field="extendedHp.damageThreshold"]');if(!threshold)throw new Error('Threshold smart control missing');
    for(const path of paths)m.clearBinding(path);m.paragonConfig.poolCount=1;
    return {controls:true,sourceUpdates:true,phaseTopology:true};
  }`)
  result.suspendedDetach = await evaluate(`async()=>{
    const wait=ms=>new Promise(r=>setTimeout(r,ms)),pinia=document.querySelector('#q-app').__vue_app__.config.globalProperties.$pinia,m=pinia._s.get('monster'),h=pinia._s.get('history');
    h.clear();h.pushSnapshot('Current only');if(h.undo()!==false||h.canUndo)throw new Error('History flags stale after pruning current-only snapshot');await wait(70);
    m.hpModifierOverride=true;m.setBinding('HP.modifier',{mode:'formula',expr:'PB'});m.hpModifierOverride=false;await wait(100);
    const field=document.querySelector('[data-formula-field="HP.modifier"]'),button=field?.querySelector('[aria-label="Detach HP Modifier binding"]')||[...field?.querySelectorAll('button')||[]].find(el=>el.getAttribute('aria-label')?.startsWith('Detach '));
    if(!button||button.disabled)throw new Error('Suspended binding detach unavailable');button.click();await wait(100);if(m.bindings['HP.modifier'])throw new Error('Suspended binding remains attached');m.hpModifierOverride=true;
    return true;
  }`)
  result.deletionHistory = await evaluate(`async()=>{
    const wait=ms=>new Promise(r=>setTimeout(r,ms)),pinia=document.querySelector('#q-app').__vue_app__.config.globalProperties.$pinia,m=pinia._s.get('monster'),h=pinia._s.get('history');
    m.speeds.push({id:'binding-delete',type:'fly',speed:30,note:''});const path='speeds[id=binding-delete].speed';m.setBinding(path,{mode:'formula',expr:'PB*10'});h.clear();h.pushSnapshot('Before delete');m.deleteSpeed('binding-delete');await wait(100);
    if(m.bindings[path]||m.speeds.some(s=>s.id==='binding-delete'))throw new Error('Delete left owned binding');
    if(!h.undo())throw new Error('Deleted record cannot undo');await wait(80);if(!m.bindings[path]||!m.speeds.some(s=>s.id==='binding-delete'))throw new Error('Undo lost binding ownership');
    if(!h.redo())throw new Error('Deleted record cannot redo');await wait(80);if(m.bindings[path]||m.speeds.some(s=>s.id==='binding-delete'))throw new Error('Redo left binding');return true;
  }`)
  // Reuse the existing exhaustive attack scenario as a short diagnostic gate.
  const suite = fs.readFileSync(new URL('./exhaustive-ui-fuzz.js', import.meta.url), 'utf8')
  const helperStart = suite.indexOf('const sheetEntryHelper = `') + 'const sheetEntryHelper = `'.length
  const helperEnd = suite.indexOf('`\n', helperStart)
  await evaluate('()=>{' + suite.slice(helperStart, helperEnd) + '}')
  const scenarioStart = suite.indexOf('const step44 = await evalInPage(`') + 'const step44 = await evalInPage(`'.length
  const scenarioEnd = suite.indexOf('`)', scenarioStart)
  const matrix = await evaluate(suite.slice(scenarioStart, scenarioEnd))
  if (matrix.problems.length || matrix.comparisons !== 4 || Object.entries(matrix).some(([key, value]) => key !== 'problems' && key !== 'comparisons' && value !== true)) throw new Error('Attack scenario failed: '+JSON.stringify(matrix))
  result.attackMatrix = true
  await send('Page.reload'); await wait(1600)
  result.weaponReload = await evaluate("()=>{const m=document.querySelector('#q-app').__vue_app__.config.globalProperties.$pinia._s.get('monster');return m.actions.find(a=>a.id==='binding-action')?.weaponAttackAbility==='finesse'&&m.bindings['actions[id=binding-action].attackBonus']?.expr==='PB+2'}")
  if (!result.weaponReload) throw new Error('Weapon metadata or binding lost on reload')
  await send('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 1, mobile: true })
  await wait(200)
  result.narrow = await evaluate('async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),field=document.querySelector(\'[data-formula-field="stats.CHA"]\');field.querySelector(\'.q-field__control\').click();await wait(100);[...document.querySelectorAll(\'.q-menu .q-item\')].find(el=>el.textContent.includes(\'Custom formula\')).click();await wait(100);const draft=field.querySelector(\'.formula-field__draft\'),okay=draft.scrollWidth<=field.clientWidth+1;[...field.querySelectorAll(\'button\')].find(el=>el.textContent.trim()===\'Cancel\').click();return okay;}')
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false })
  await wait(200)
  await evaluate('async()=>{const m=document.querySelector(\'#q-app\').__vue_app__.config.globalProperties.$pinia._s.get(\'monster\');m.setBinding(\'HP.HD\',{mode:\'formula\',expr:\'PB+1\'});await new Promise(r=>setTimeout(r,100));const field=document.querySelector(\'[data-formula-field="HP.HD"]\');field.scrollIntoView({block:\'center\'});field.querySelector(\'.q-field__control\').click();}')
  await wait(200)
  const shot = await send('Page.captureScreenshot', { format: 'png' })
  fs.writeFileSync(path.resolve('.codex-temp/rc162-bindings.png'), Buffer.from(shot.result.data, 'base64'))
  result.sheetSync = await evaluate('()=>{const m=document.querySelector(\'#q-app\').__vue_app__.config.globalProperties.$pinia._s.get(\'monster\');return m.HP.HD===m.proficiency+1&&document.querySelector(\'#render .statblock\').textContent.includes(String(m.HP.HD)+\'d8\')}')
  if (!result.reload || !result.narrow || !result.attackUI || !result.sheetSync || errors.length) throw new Error(JSON.stringify({ result, errors }))
  console.log('PASS binding UI/store/history/reload:', JSON.stringify(result))
} finally {
  ws?.close(); chrome.kill()
  // Only the temporary profile created by this script is removed.
  if (path.resolve(profile).startsWith(path.resolve(os.tmpdir()) + path.sep) && path.basename(profile).startsWith('dnd-bindings-')) {
    try { fs.rmSync(profile, { recursive: true, force: true }) } catch {}
  }
}
