import assert from 'node:assert/strict'
import { browserProbe } from '../tools/qa/browser-probe.mjs'

await browserProbe(async ({ evaluate, send, delay }) => {
  const checks = await evaluate(`(async () => {
    const wait=ms=>new Promise(r=>setTimeout(r,ms));
    const until=async(fn,label)=>{for(let i=0;i<80;i++){const v=fn();if(v)return v;await wait(50)}throw Error('Timed out: '+label+' '+JSON.stringify({editor:document.querySelector('.chain-editor-menu .q-editor')?.outerHTML,trait:m.traits.at(-1),render:document.querySelector('#render')?.innerHTML}))};
    const p=document.querySelector('#q-app').__vue_app__.config.globalProperties.$pinia,m=p._s.get('monster'),e=p._s.get('editor');
    e.activeMode='monster';e.style='2024';m.$reset();await wait(0);m.addTrait();
    const entry=m.traits.at(-1);Object.assign(entry,{id:'rich-mechanic-witness',name:'Rich mechanic witness',outcomes:[{id:'rich-result',trigger:'hit',effects:[{kind:'text',text:'Formatted result'}],extension:{retain:true}}]});
    const studio=await until(()=>[...document.querySelectorAll('.q-expansion-item')].find(x=>x.querySelector('.q-item__label')?.textContent.trim()==='Actions & Traits Studio'),'studio');
    if(!studio.classList.contains('q-expansion-item--expanded'))studio.querySelector('.q-item').click();
    const chain=()=>document.querySelector('[data-composer-chain="rich-mechanic-witness"]');
    await until(chain,'trait compositor');
    const sharedRows=['mechanics','scope','outcomes'].every(row=>chain().querySelector('[data-chain-row="'+row+'"]'));
    const chip=await until(()=>chain().querySelector('[data-chain-cell="outcomes"]'),'outcomes');chip.scrollIntoView({block:'center'});chip.click();
    const menu=await until(()=>document.querySelector('.chain-editor-menu .chain-outcomes')?.closest('.chain-editor'),'outcome editor');
    const format=await until(()=>menu.querySelector('button[aria-label="Format Effect"]'),'format control');format.click();
    const editor=await until(()=>menu.querySelector('.q-editor__content[contenteditable="true"]'),'rich editor');
    editor.focus();const selection=window.getSelection(),range=document.createRange();range.selectNodeContents(editor);selection.removeAllRanges();selection.addRange(range);document.dispatchEvent(new Event('selectionchange'));await wait(80);
    const bold=await until(()=>menu.querySelector('.q-editor [role="button"][aria-label="Bold"]'),'bold toolbar');bold.click();await wait(100);
    const draftIsolation=entry.outcomes[0].effects[0].text==='Formatted result';
    const apply=[...menu.querySelectorAll('button')].find(x=>x.textContent.trim()==='Apply');apply.click();await until(()=>!document.querySelector('.chain-editor-menu .chain-outcomes'),'apply');
    const rendered=await until(()=>[...document.querySelectorAll('#render b,#render strong')].find(x=>x.textContent==='Formatted result'),'formatted final render');
    const savedFormatting=/<(b|strong)>Formatted result<\\/(b|strong)>/.test(entry.outcomes[0].effects[0].text);
    const extension=entry.outcomes[0].extension.retain===true;
    await wait(300);return {sharedRows,draftIsolation,rendered:!!rendered,savedFormatting,extension};
  })()`)
  assert.ok(Object.values(checks).every(Boolean), JSON.stringify(checks))
  await send('Page.reload'); await delay(500)
  const reload = await evaluate(`(async()=>{for(let i=0;i<80;i++){const m=document.querySelector('#q-app')?.__vue_app__?.config.globalProperties.$pinia?._s.get('monster');const t=m?.traits.find(x=>x.id==='rich-mechanic-witness');if(t)return /<(b|strong)>/.test(t.outcomes[0].effects[0].text)&&t.outcomes[0].extension.retain;await new Promise(r=>setTimeout(r,50))}return false})()`)
  assert.equal(reload,true,'Rich effect and extension must survive reload')
  console.log('Emergency rich mechanics browser checks:', JSON.stringify({...checks,reload}))
}, {port:9357})
