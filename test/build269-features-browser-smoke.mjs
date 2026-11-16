import assert from 'node:assert/strict'
import { browserProbe } from '../tools/qa/browser-probe.mjs'

// Build 269 owner requests, end to end in the built app: frameless portrait, natural armor, AC riders
// (including migration of a legacy single On Miss pick), and the size strip inside the post-crop radial.
const P = "document.querySelector('#q-app').__vue_app__.config.globalProperties.$pinia"
const result = await browserProbe(async ({ evaluate, delay }) => {
  const img = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="60"><rect width="40" height="60" fill="teal"/></svg>')
  await evaluate("(()=>{for(const h of document.querySelectorAll('.q-expansion-item__container > .q-item'))h.click()})()")
  await delay(1500)
  await evaluate('(()=>{const m=' + P + "._s.get('monster');m.portrait={url:'" + img + "',position:'left',width:200,caption:''};m.stats.DEX=14;m.acConfig={...(m.acConfig||{}),baseMode:'natural',naturalBonus:3,onMiss:'knocks_prone',riders:[]}})()")
  await delay(900)
  const framed = await evaluate("getComputedStyle(document.querySelector('#render .monster-portrait')).borderTopWidth")
  await evaluate('(()=>{' + P + "._s.get('monster').portrait.frameless=true})()")
  await delay(400)
  const frameless = await evaluate("(()=>{const c=getComputedStyle(document.querySelector('#render .monster-portrait'));return c.borderTopWidth+'/'+c.paddingTop})()")
  const state = await evaluate('(()=>{const m=' + P + "._s.get('monster');const t=document.querySelector('#render').textContent;return {riders:(m.acConfig.riders||[]).map(r=>r.trigger+':'+r.effect),onMiss:m.acConfig.onMiss,ac:t.includes('15')&&t.includes('natural armor')&&t.includes('On Miss Knocks Prone')}})()")
  await evaluate("document.querySelector('[data-add-ac-rider]').click()")
  await delay(400)
  const rows = await evaluate("document.querySelectorAll('[data-ac-rider]').length")
  const strip = await evaluate("[...document.querySelectorAll('[data-layer-size-strip]')].filter(s=>s.closest('.radial-offset-controller')).length")
  return { framed, frameless, state, rows, strip }
})
assert.equal(result.framed, '1px', 'portrait keeps its frame by default')
assert.equal(result.frameless, '0px/0px', 'frameless toggle removes border and padding')
assert.deepEqual(result.state.riders, ['miss:knocks_prone'], 'legacy On Miss migrates to an AC rider')
assert.equal(result.state.onMiss, 'none')
assert.ok(result.state.ac, 'AC line keeps 10 + DEX + natural bonus and the migrated rider wording')
assert.equal(result.rows, 2, 'a new AC rider row is added')
assert.ok(result.strip >= 1, 'size strip lives inside the post-crop radial')
console.log('Build 269 feature checks:', JSON.stringify(result))
