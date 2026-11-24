import assert from 'node:assert/strict'
import { browserProbe } from '../tools/qa/browser-probe.mjs'

// Build 274 owner requests, end to end in the built app: stat-block-only preview, attack presets,
// one-card AC and HP modules, an editable natural bonus, On Regain riders and a tooltip-free stat block.
const P = "document.querySelector('#q-app').__vue_app__.config.globalProperties.$pinia"
const result = await browserProbe(async ({ evaluate, delay }) => {
  const img = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="60"><rect width="40" height="60" fill="teal"/></svg>')
  await evaluate("(()=>{for(const h of document.querySelectorAll('.q-expansion-item__container > .q-item'))h.click()})()")
  await delay(1500)
  await evaluate('(()=>{const m=' + P + "._s.get('monster'),e=" + P + "._s.get('editor');e.a4PreviewMode=false;m.portrait={url:'" + img + "',position:'left',width:200,caption:''};m.stats.DEX=14;m.acConfig={...(m.acConfig||{}),baseMode:'natural',naturalBonus:2,riders:[]};m.basicRiders={...(m.basicRiders||{}),onHeal:[{id:'h',cadence:'once_round',timing:'When it regains hit points',effect:'It sheds bright light.'}]}})()")
  await delay(900)
  const preview = await evaluate("(()=>{const p=document.querySelector('#render .monster-portrait'),s=document.querySelector('#render .statblock'),w=document.querySelector('#render');return {portraitLeft:Math.round(p.getBoundingClientRect().left),statLeft:Math.round(s.getBoundingClientRect().left-w.getBoundingClientRect().left)}})()")
  // Open every collapsed ancestor of the AC module and the Database Studio macros tab before measuring.
  await evaluate(`(()=>{const open=el=>{let e=el;while((e=e&&e.parentElement&&e.parentElement.closest('.q-expansion-item'))){if(!e.classList.contains('q-expansion-item--expanded'))e.querySelector(':scope > .q-expansion-item__container > .q-item')?.click()}};
    open(document.querySelector('[data-natural-armor-bonus]'));
    const tab=[...document.querySelectorAll('.q-tab')].find(x=>x.textContent.includes('Macros & Formulas'));open(tab);tab?.click()})()`)
  await delay(900)
  const modules = await evaluate(`(()=>{const ac=document.querySelector('[data-ac-compositor]'),hp=document.querySelector('[data-hp-compositor]');
    const bonus=document.querySelector('[data-natural-armor-bonus]');
    return {acField:!!ac?.querySelector('[data-formula-field="AC"]'),acRiders:!!ac?.querySelector('[data-basic-riders="ac"]'),
      hd:!!hp?.querySelector('[data-formula-field="HP.HD"]'),heal:!!hp?.querySelector('[data-basic-riders="onHeal"]'),
      throes:!!hp?.querySelector('[data-basic-riders="deathThroes"]'),
      bonusLocked:!bonus||bonus.classList.contains('formula-field--locked')||!!bonus.querySelector('.q-field--disabled'),bonusWidth:Math.round(bonus?.getBoundingClientRect().width||0)}})()`)
  const text = await evaluate("document.querySelector('#render').textContent")
  const headline = await evaluate("document.querySelector('[data-hp-headline]')?.textContent.trim()")
  await evaluate("(()=>{const t=document.querySelector('#render .statblock [data-help]');t.dispatchEvent(new PointerEvent('pointerover',{bubbles:true,pointerType:'mouse'}))})()")
  await delay(200)
  const tooltip = await evaluate("!!document.querySelector('#statblock-help-tip, .statblock-help-tip')")
  await evaluate("[...document.querySelectorAll('.q-btn')].find(b=>b.textContent.includes('Add Entry'))?.click()")
  await delay(500)
  await evaluate("document.querySelector('[data-add-attack-preset=\"ranged-weapon\"]')?.click()")
  await delay(700)
  const attack = await evaluate('(()=>{const a=' + P + "._s.get('monster').actions.at(-1);return {name:a?.name,reach:a?.attackReach,source:a?.attackSource,rendered:document.querySelector('#render').textContent.includes('Longbow')}})()")
  const library = await evaluate("!!document.querySelector('[data-builtin-macro-library]')")
  return { preview, headline, modules, ac: text.includes('14') && text.includes('natural armor'), regain: text.includes('On Regain'), tooltip, attack, library }
})
assert.ok(result.preview.portraitLeft < -1000, 'the portrait is parked off-screen outside A4 preview')
assert.ok(result.preview.statLeft < 40, 'the stat block starts at the left edge, with no empty portrait column')
assert.deepEqual({ ...result.modules, bonusWidth: undefined }, { acField: true, acRiders: true, hd: true, heal: true, throes: true, bonusLocked: false, bonusWidth: undefined })
assert.ok(result.modules.bonusWidth >= 100, 'the natural bonus field keeps a clickable width')
assert.match(result.headline, /^HP \d+ \(\d+d\d+/, 'the HP headline prints dice as NdM')
assert.ok(result.ac, 'AC prints 10 + DEX + natural bonus')
assert.ok(result.regain, 'On Regain riders reach the stat block')
assert.equal(result.tooltip, false, 'the stat block raises no tooltip')
assert.deepEqual(result.attack, { name: 'Longbow', reach: 'ranged', source: 'weapon', rendered: true })
assert.ok(result.library, 'the Database Studio lists the built-in library')
console.log('Build 274 feature checks:', JSON.stringify(result))
