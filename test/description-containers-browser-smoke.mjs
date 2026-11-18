import assert from 'node:assert/strict'
import { browserProbe } from '../tools/qa/browser-probe.mjs'

// Build 269/271: "+ Text Block" / "+ Dice Table" content must reach the stat block in both visual templates,
// following prose for unstructured entries and preceding trailing prose on structured Modern Reactions (C12.R4).
const result = await browserProbe(async ({ evaluate, waitFor }) => {
  const res = {}
  for (const tpl of ['classic', 'modern']) for (const kind of ['Trait', 'Action', 'Reaction']) {
    const list = kind.toLowerCase() + 's'
    await evaluate("(()=>{const p=document.querySelector('#q-app').__vue_app__.config.globalProperties.$pinia;const m=p._s.get('monster'),e=p._s.get('editor');e.visualTemplate='" + tpl + "';m.traits=[];m.actions=[];m.reactions=[];m.add" + kind + '();const x=m.' + list + "[0];x.name='Probe';x.description='Base text.';x.descriptionContainers=[{id:'c1',kind:'text',outcomeTarget:'On Hit',text:'ZZTEXT'},{id:'c2',kind:'table',outcomeTarget:'',table:{headers:['Roll','Outcome'],rows:[['1-10','ZZROW']]}}]})()")
    await waitFor("document.querySelector('#render').textContent.includes('ZZTEXT')", { label: tpl + '/' + kind + ' containers rendered' })
    res[tpl + '/' + kind] = await evaluate("(()=>{const t=document.querySelector('#render').textContent;return t.includes('ZZTEXT')&&t.includes('ZZROW')&&t.indexOf('Base text')<t.indexOf('ZZTEXT')})()")
  }
  await evaluate("(()=>{const p=document.querySelector('#q-app').__vue_app__.config.globalProperties.$pinia;const m=p._s.get('monster'),e=p._s.get('editor');e.visualTemplate='modern';m.reactions=[];m.addReaction();const r=m.reactions[0];r.name='Structured Rx';r.trigger='When targeted';r.stat='DEX';r.description='Trailing note.';r.outcomes=[{id:'o1',trigger:'fail',effects:[{text:'Stunned.'}]}];r.descriptionContainers=[{id:'rc1',kind:'text',outcomeTarget:'Afterward',text:'RXBLOCK'}]})()")
  await waitFor("document.querySelector('#render').textContent.includes('RXBLOCK')", { label: 'structured reaction container rendered' })
  res['modern/StructuredReactionOrder'] = await evaluate("(()=>{const t=document.querySelector('#render').textContent;const oi=t.indexOf('Stunned.'),ci=t.indexOf('RXBLOCK'),di=t.indexOf('Trailing note.');return oi>=0&&ci>oi&&di>ci})()")
  return res
})
for (const [key, ok] of Object.entries(result)) assert.ok(ok, `${key}: text block and dice table render after the description`)
console.log('Description container checks:', JSON.stringify(result))
