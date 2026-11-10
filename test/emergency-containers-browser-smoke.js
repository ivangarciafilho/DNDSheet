import assert from 'node:assert/strict'
import { browserProbe } from '../tools/qa/browser-probe.mjs'

await browserProbe(async ({ evaluate, send, delay }) => {
  const result = await evaluate(`(async () => {
    const wait=ms=>new Promise(r=>setTimeout(r,ms));
    const until=async(fn,label)=>{for(let i=0;i<80;i++){const v=fn();if(v)return v;await wait(50)}throw Error('Timed out: '+label)};
    const p=document.querySelector('#q-app').__vue_app__.config.globalProperties.$pinia,m=p._s.get('monster'),e=p._s.get('editor');
    e.activeMode='monster';e.style='2024';m.$reset();await wait(0);
    const fixtures=[];
    for(const [role,method,field] of [['action','addAction','actions'],['trait','addTrait','traits'],['reaction','addReaction','reactions'],['lair','addLairAction','lairActions']]){
      m[method]();const entry=m[field].at(-1);Object.assign(entry,{id:'container-'+role,description:'Original '+role,extension:{retained:true}});if(role!=='lair')entry.name='Container '+role;
      fixtures.push({role,field,id:entry.id});
    }
    const studio=await until(()=>[...document.querySelectorAll('.q-expansion-item')].find(x=>x.querySelector('.q-item__label')?.textContent.trim()==='Actions & Traits Studio'),'studio');
    if(!studio.classList.contains('q-expansion-item--expanded'))studio.querySelector('.q-item').click();
    const checks={};
    const fill=(input,text)=>{const proto=input.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(input,text);input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}))};
    for(const fixture of fixtures){
      const {role,field,id}=fixture;
      const chain=()=>document.querySelector('[data-composer-chain="'+id+'"]');
      await until(chain,role+' chain');
      const firstHeadControl=chain().querySelector('[data-chain-row="head"] .composer-chain__cells').firstElementChild;
      checks[role+'RoleFirst']=firstHeadControl.matches('.q-select')&&!!firstHeadControl.querySelector('[data-composer-role] input[aria-label="Role"]');
      const panel=()=>chain().parentElement.querySelector('[data-description-containers]');
      panel().querySelector('[data-add-description="text"]').click();
      await until(()=>m[field].find(x=>x.id===id).descriptionContainers?.length===1,role+' text added');
      await until(()=>panel().querySelector('textarea'),role+' text visible');
      fill(panel().querySelector('textarea'),'Witness '+role);await wait(120);
      panel().querySelector('[data-add-description="table"]').click();
      await until(()=>m[field].find(x=>x.id===id).descriptionContainers?.length===2,role+' table added');
      const ids=m[field].find(x=>x.id===id).descriptionContainers.map(x=>x.id);
      panel().querySelector('[data-add-description-row]').click();await wait(100);
      const entry=m[field].find(x=>x.id===id);
      checks[role+'BothPersist']=entry.descriptionContainers[0].text==='Witness '+role&&entry.descriptionContainers[1].table.rows.length===3;
      checks[role+'StableIds']=ids.every((x,i)=>x===entry.descriptionContainers[i].id)&&entry.extension.retained;
      checks[role+'Rendered']=await until(()=>document.querySelector('#render').textContent.includes('Witness '+role),role+' rendered');
    }
    await wait(300);return checks;
  })()`)
  assert.ok(Object.values(result).every(Boolean), JSON.stringify(result))
  await send('Page.reload'); await delay(700)
  const reload = await evaluate(`(async()=>{for(let i=0;i<80;i++){const m=document.querySelector('#q-app')?.__vue_app__?.config.globalProperties.$pinia?._s.get('monster');if(m?.actions.some(x=>x.id==='container-action'))return [['action','actions'],['trait','traits'],['reaction','reactions'],['lair','lairActions']].every(([role,field])=>{const entry=m[field].find(x=>x.id==='container-'+role);return entry?.descriptionContainers?.length===2&&entry.descriptionContainers[0].text==='Witness '+role&&entry.descriptionContainers[1].table.rows.length===3&&entry.extension.retained});await new Promise(r=>setTimeout(r,50))}return false})()`)
  assert.equal(reload,true,'All role containers, table edits and unknown metadata survive reload')
  console.log('Additional container browser checks:', JSON.stringify({...result,reload}))
}, {port:9358})
