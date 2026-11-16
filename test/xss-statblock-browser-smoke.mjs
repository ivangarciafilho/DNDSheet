import assert from 'node:assert/strict'
import { browserProbe } from '../tools/qa/browser-probe.mjs'

// Every author text that reaches the stat block through v-html must be sanitized: an injected handler,
// script or javascript: URL must neither run nor survive as live markup. This is the evidence behind
// turning off vue/no-v-html (see docs/roadmap/DNDSheet-Build261-Closing-C3-C6-C8-C10.md).
await browserProbe(async ({ evaluate }) => {
  const result = await evaluate(`(async () => {
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms))
    const pinia = document.querySelector('#q-app').__vue_app__.config.globalProperties.$pinia
    const m = pinia._s.get('monster'), editor = pinia._s.get('editor')
    m.$reset()
    window.__xss = []
    const P = key => 'ok' + key + '<img src=x onerror="window.__xss.push(\\'img-' + key + '\\')"><script>window.__xss.push("script-' + key + '")<\\/script><svg onload="window.__xss.push(\\'svg-' + key + '\\')"></svg><a href="javascript:window.__xss.push(\\'a-' + key + '\\')">l</a>'
    m.name = P('name')
    m.ACType = P('actype')
    m.languagesList = [{ id: 'l', name: 'Common', note: P('lang') }]
    m.sensesList = [{ id: 's', name: 'Darkvision', range: 60, note: P('sense') }]
    m.resistancesList = [{ id: 'r', name: 'fire', type: 'damage', note: P('res') }]
    m.speeds = [{ ...(m.speeds?.[0] || { id: 'w', type: 'walk', speed: 30 }), note: P('speed') }]
    m.basicRiders = { hp: [{ id: 'h', cadence: 'once_round', timing: 'As a Reaction', effect: P('hprider') }] }
    m.traits = [{ id: 't', name: 'Trait', description: P('trait'), limitedUse: { count: 0, rate: '' }, isConditional: true, conditionalTrigger: P('cond') }]
    m.actions = [{ ...(m.actions?.[0] || {}), id: 'a', name: 'Act', description: P('action') }]
    m.reactions = [{ ...(m.reactions?.[0] || {}), id: 'r1', name: 'React', description: P('reaction') }]
    m.lairActions = [P('lair')]
    m.regionalEffects = [P('regional')]
    m.inventory = P('inventory')
    m.villainActions = [{ id: 'v', round: 1, name: 'Gambit', description: P('villain') }]
    m.comboActions = [{ id: 'c', name: 'Combo', leadAction: 'A', followUpAction: 'B', condition: P('combocond'), description: P('combo') }]
    m.randomTables = [{ id: 'rt', title: 'Table', dice: '1d4', rows: [{ id: 'r', min: 1, max: 4, text: P('table') }] }]
    const out = { fired: [], live: [], views: 0 }
    for (const template of ['modern', 'classic']) for (const style of ['2024', '2014']) {
      editor.visualTemplate = template; editor.style = style; out.views++
      await wait(400)
      const root = document.querySelector('#render')
      for (const el of root.querySelectorAll('*')) {
        if (el.tagName === 'SCRIPT') out.live.push(template + style + ':script')
        for (const attr of el.attributes) {
          if (/^on/i.test(attr.name)) out.live.push(template + style + ':' + el.tagName + '[' + attr.name + ']')
          if (/^\\s*javascript:/i.test(attr.value)) out.live.push(template + style + ':' + el.tagName + '[' + attr.name + '=javascript:]')
        }
      }
    }
    await wait(500)
    out.fired = [...new Set(window.__xss)]
    out.rendered = document.querySelector('#render').textContent.includes('okname')
    return out
  })()`)
  assert.equal(result.rendered, true, 'payload host text must still render: ' + JSON.stringify(result))
  assert.deepEqual(result.fired, [], 'injected code ran: ' + JSON.stringify(result))
  assert.deepEqual([...new Set(result.live)], [], 'live injected markup survived: ' + JSON.stringify(result))
  console.log('XSS smoke: 18 author fields x ' + result.views + ' layouts; no handler ran, no live script/on*/javascript: markup survived.')
}, { url: process.env.DNDSHEET_E2E_URL || 'http://127.0.0.1:9234/index.html#/', port: 9399 })
