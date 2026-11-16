import assert from 'node:assert/strict'
import { browserProbe } from '../tools/qa/browser-probe.mjs'

// Build 269 owner report: "+ Text Block" / "+ Dice Table" content must reach the stat block for traits,
// actions and reactions in both visual templates (the modern legacy-action branch used to drop it).
const result = await browserProbe(async ({ evaluate, delay }) => {
  const res = {}
  for (const tpl of ['classic', 'modern']) for (const kind of ['Trait', 'Action', 'Reaction']) {
    const list = kind.toLowerCase() + 's'
    await evaluate("(()=>{const p=document.querySelector('#q-app').__vue_app__.config.globalProperties.$pinia;const m=p._s.get('monster'),e=p._s.get('editor');e.visualTemplate='" + tpl + "';m.traits=[];m.actions=[];m.reactions=[];m.add" + kind + '();const x=m.' + list + "[0];x.name='Probe';x.description='Base text.';x.descriptionContainers=[{id:'c1',kind:'text',outcomeTarget:'On Hit',text:'ZZTEXT'},{id:'c2',kind:'table',outcomeTarget:'',table:{headers:['Roll','Outcome'],rows:[['1-10','ZZROW']]}}]})()")
    await delay(600)
    res[tpl + '/' + kind] = await evaluate("(()=>{const t=document.querySelector('#render').textContent;return t.includes('ZZTEXT')&&t.includes('ZZROW')&&t.indexOf('Base text')<t.indexOf('ZZTEXT')})()")
  }
  return res
})
for (const [key, ok] of Object.entries(result)) assert.ok(ok, `${key}: text block and dice table render after the description`)
console.log('Description container checks:', JSON.stringify(result))
