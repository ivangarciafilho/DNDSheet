import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'dnd-bindings-'))
const port = 9229
const url = process.env.DNDSHEET_E2E_URL || 'http://localhost:9124/candidate161/index.html#/'
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
  await send('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 1, mobile: true })
  await wait(200)
  result.narrow = await evaluate('async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),field=document.querySelector(\'[data-formula-field="stats.CHA"]\');field.querySelector(\'.q-field__control\').click();await wait(100);[...document.querySelectorAll(\'.q-menu .q-item\')].find(el=>el.textContent.includes(\'Custom formula\')).click();await wait(100);const draft=field.querySelector(\'.formula-field__draft\'),okay=draft.scrollWidth<=field.clientWidth+1;[...field.querySelectorAll(\'button\')].find(el=>el.textContent.trim()===\'Cancel\').click();return okay;}')
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false })
  await wait(200)
  await evaluate('async()=>{const m=document.querySelector(\'#q-app\').__vue_app__.config.globalProperties.$pinia._s.get(\'monster\');m.setBinding(\'HP.HD\',{mode:\'formula\',expr:\'PB+1\'});await new Promise(r=>setTimeout(r,100));const field=document.querySelector(\'[data-formula-field="HP.HD"]\');field.scrollIntoView({block:\'center\'});field.querySelector(\'.q-field__control\').click();}')
  await wait(200)
  const shot = await send('Page.captureScreenshot', { format: 'png' })
  fs.writeFileSync(path.resolve('.codex-temp/rc161-bindings.png'), Buffer.from(shot.result.data, 'base64'))
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
