import assert from 'node:assert/strict'
import { browserProbe } from '../tools/qa/browser-probe.mjs'

// Every text field that offers bold/italic must print them on the stat block: no dead formatting.
await browserProbe(async ({ evaluate }) => {
  const result = await evaluate(`(async () => {
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms))
    const pinia = document.querySelector('#q-app').__vue_app__.config.globalProperties.$pinia
    const m = pinia._s.get('monster'), editor = pinia._s.get('editor')
    m.$reset()
    const F = key => '<b>B' + key + '</b> and <i>I' + key + '</i><s>S' + key + '</s>'
    // The owner's case: the compositor's own wording, formatted in AC Type.
    m.AC = 15
    m.acConfig = { ...(m.acConfig || {}), enabled: true, conditionMode: 'has_temp_hp', secondaryAc: 20 }
    m.ACType = '<b>20</b> if It Has <i>Temporary Hit Points</i>.'
    m.languagesList = [{ id: 'l', name: 'Common', note: F('lang') }]
    m.sensesList = [{ id: 's', name: 'Darkvision', range: 60, note: F('sense') }]
    m.resistancesList = [{ id: 'r', name: 'fire', type: 'damage', note: F('res') }]
    m.speeds = [{ ...(m.speeds?.[0] || { id: 'w', type: 'walk', speed: 30 }), note: F('speed') }]
    m.basicRiders = { hp: [{ id: 'h', cadence: 'once_round', timing: 'As a Reaction', effect: F('hprider') }] }
    m.traits = [{ id: 't', name: 'Tagged', description: F('desc'), limitedUse: { count: 0, rate: '' }, rechargeTagOverride: F('tag'), isConditional: true, conditionalTrigger: F('cond') }]
    m.multiattackOptions = { ...m.multiattackOptions, postscript: F('post') }
    const keys = ['lang', 'sense', 'res', 'speed', 'hprider', 'desc', 'tag', 'cond']
    const out = { missing: [], escaped: [], themes: 0 }
    for (const template of ['modern', 'classic']) for (const theme of ['wotc', 'printer', 'lovecraft_golden', 'art_deco']) {
      editor.visualTemplate = template; editor.visualTheme = theme; out.themes++
      await wait(250)
      const root = document.querySelector('#render')
      for (const key of keys) {
        const tags = ['b', 'i', 's'].every((tag, index) => [...root.querySelectorAll(tag + ',' + ['strong', 'em', 'strike'][index])].some(el => el.textContent === ['B', 'I', 'S'][index] + key))
        if (!tags) out.missing.push(template + '/' + theme + '/' + key)
        if (root.innerHTML.includes('&lt;b&gt;B' + key)) out.escaped.push(template + '/' + theme + '/' + key)
      }
      const ac = [...root.querySelectorAll('.dnd-cascade-title, .name')].find(x => /^AC/i.test(x.textContent.trim()))
      const acHtml = ac ? (ac.closest('.dnd-cascade-panel, .skill') || ac.parentElement).innerHTML : ''
      out['ac_' + template + '_' + theme] = /<b>20<\\/b>/.test(acHtml) && /<i>Temporary Hit Points<\\/i>/.test(acHtml) && (acHtml.match(/Temporary Hit Points/g) || []).length === 1
    }
    return out
  })()`)
  assert.deepEqual(result.missing, [], JSON.stringify(result))
  assert.deepEqual(result.escaped, [], JSON.stringify(result))
  for (const [key, value] of Object.entries(result)) if (key.startsWith('ac_')) assert.equal(value, true, key + ' ' + JSON.stringify(result))
  console.log(`Formatting reaches the stat block for ${8} field kinds and the compositor AC across ${result.themes} template/theme views.`)
}, { url: process.env.DNDSHEET_E2E_URL || 'http://127.0.0.1:9234/index.html#/', port: 9398 })
