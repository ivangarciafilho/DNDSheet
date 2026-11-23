import assert from 'node:assert/strict'
import { browserProbe } from '../tools/qa/browser-probe.mjs'

// C5 + BS-06: switching to pt-BR updates full editor UI & Quasar lang pack, preserves English fallback for
// untranslated sentinel keys without i18n warnings, and survives full Page.reload with mutated Monster state.
const result = await browserProbe(async ({ send, evaluate, waitFor }) => {
  await evaluate("(()=>{window.__w=[];const o=console.warn;console.warn=(...a)=>{window.__w.push(a.map(String).join(' '));o.apply(console,a)}})()")
  const opened = await evaluate("(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.querySelector('.q-icon')?.textContent.trim()==='settings');if(!b)return false;b.click();return true})()")
  assert.ok(opened, 'settings menu opens')
  await waitFor("!!document.querySelector('[data-locale-switch]')", { label: 'locale switch menu' })
  const clicked = await evaluate("(()=>{const s=document.querySelector('[data-locale-switch]');const b=s&&[...s.querySelectorAll('button')].find(x=>x.textContent.includes('Português'));if(b)b.click();return !!b})()")
  assert.ok(clicked, 'locale switch button clicked')
  await waitFor("document.querySelector('#q-app').__vue_app__.config.globalProperties.$i18n.locale === 'pt-BR'", { label: 'pt-BR locale applied' })

  const beforeReload = await evaluate(`(()=>{
    const gp = document.querySelector('#q-app').__vue_app__.config.globalProperties
    const p = gp.$pinia
    const m = p._s.get('monster')
    m.name = 'BS06 Reload Witness'
    m.CR = 9
    m.HP.HD = 14
    m.traits = [...m.traits, { id: 'bs06-trait', name: 'Persisted Ward', description: 'Survives browser reload.', limitedUse: { count: 0, rate: 'AT_WILL' }, crAnnotation: { maxDamage: 0, maxSave: 0, maxModifier: 0, multitarget: false, ehpModifier: 0, ehpMultiplier: 1, acModifier: 0, include: true, automatic: true } }]
    m.acConfig = { ...(m.acConfig || {}), baseMode: 'natural', naturalBonus: 4, riders: [{ id: 'bs06-rider', trigger: 'hit', cadence: 'turn', timing: 'reaction', effect: 'custom', text: '+2 AC until end of turn' }] }
    return {
      locale: gp.$i18n.locale,
      fallbackLocale: gp.$i18n.fallbackLocale,
      quasarLang: gp.$q.lang.isoName,
      stored: localStorage.getItem('app.locale'),
      help: gp.$t('help.identity.size'),
      settingsTitle: gp.$t('editor.renderSettings'),
      missingKeyEcho: gp.$t('__missing_i18n_probe__'),
      warns: window.__w.filter(w => /i18n|Not found|Fall back/.test(w)),
    }
  })()`)

  await waitFor("localStorage.getItem('app.monster')?.includes('bs06-rider')", { label: 'app.monster persisted to localStorage' })
  await send('Page.reload')
  await waitFor("!!document.querySelector('#render .statblock') && !!document.querySelector('#q-app')?.__vue_app__?.config?.globalProperties?.$pinia?._s?.get('monster')", { label: 'reloaded app and Pinia hydrated' })

  const afterReload = await evaluate(`(()=>{
    const gp = document.querySelector('#q-app').__vue_app__.config.globalProperties
    const m = gp.$pinia._s.get('monster')
    return {
      locale: gp.$i18n.locale,
      quasarLang: gp.$q.lang.isoName,
      stored: localStorage.getItem('app.locale'),
      settingsTitle: gp.$t('editor.renderSettings'),
      name: m.name,
      cr: m.CR,
      hd: m.HP.HD,
      hasTrait: m.traits.some(t => t.id === 'bs06-trait' && t.name === 'Persisted Ward'),
      acNaturalBonus: m.acConfig?.naturalBonus,
      acRidersCount: Array.isArray(m.acConfig?.riders) ? m.acConfig.riders.length : 0,
    }
  })()`)

  // D1.5: Open RulesConversionDialog, apply conversion, verify provenance change and single-step undo rollback
  await evaluate("(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.querySelector('.q-icon')?.textContent.trim()==='settings');if(b)b.click()})()")
  await waitFor("!!document.querySelector('[data-open-rules-converter]')", { label: 'rules converter trigger in settings menu' })
  await evaluate("document.querySelector('[data-open-rules-converter]').click()")
  await waitFor("!!document.querySelector('[data-rules-conversion-dialog]')", { label: 'RulesConversionDialog visible' })
  await evaluate("document.querySelector('[data-convert-target=\"2014\"]')?.click()")
  await evaluate("document.querySelector('[data-confirm-rules-conversion]')?.click()")
  await waitFor("!document.querySelector('[data-rules-conversion-dialog]')", { label: 'RulesConversionDialog closed after apply' })
  const conversionRoundtrip = await evaluate(`(()=>{
    const p = document.querySelector('#q-app').__vue_app__.config.globalProperties.$pinia
    const m = p._s.get('monster')
    const ed = p._s.get('editor')
    const h = p._s.get('history')
    const appliedStyle = ed.style
    const appliedRuleset = m.provenance?.ruleset
    const undoWorked = h.canUndo
    if (undoWorked) h.undo()
    return {
      appliedStyle,
      appliedRuleset,
      undoWorked,
      revertedRuleset: m.provenance?.ruleset ?? 'unset',
    }
  })()`)

  return { beforeReload, afterReload, conversionRoundtrip }
})

assert.equal(result.beforeReload.locale, 'pt-BR')
assert.equal(result.beforeReload.fallbackLocale, 'en-US')
assert.equal(result.beforeReload.quasarLang, 'pt-BR')
assert.equal(result.beforeReload.stored, 'pt-BR')
assert.match(result.beforeReload.help, /Dado de Vida/)
assert.match(result.beforeReload.settingsTitle, /Configurações do Bloco/)
assert.equal(result.beforeReload.missingKeyEcho, '__missing_i18n_probe__')
assert.deepEqual(result.beforeReload.warns, [])

assert.equal(result.afterReload.locale, 'pt-BR')
assert.equal(result.afterReload.quasarLang, 'pt-BR')
assert.equal(result.afterReload.stored, 'pt-BR')
assert.match(result.afterReload.settingsTitle, /Configurações do Bloco/)
assert.equal(result.afterReload.name, 'BS06 Reload Witness')
assert.equal(result.afterReload.cr, 9)
assert.equal(result.afterReload.hd, 14)
assert.equal(result.afterReload.hasTrait, true)
assert.equal(result.afterReload.acNaturalBonus, 4)
assert.equal(result.afterReload.acRidersCount, 1)
assert.equal(result.conversionRoundtrip.appliedStyle, '2014')
assert.equal(result.conversionRoundtrip.appliedRuleset, '2014')
assert.equal(result.conversionRoundtrip.undoWorked, true)
assert.notEqual(result.conversionRoundtrip.revertedRuleset, '2014')
console.log('Locale & BS-06 reload checks:', JSON.stringify(result.afterReload))
console.log('RulesConversionDialog roundtrip:', JSON.stringify(result.conversionRoundtrip))
