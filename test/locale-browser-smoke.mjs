import assert from 'node:assert/strict'
import { browserProbe } from '../tools/qa/browser-probe.mjs'

// C5: the locale switch in the stat block settings changes help text to pt-BR, persists the choice,
// and leaves untranslated keys in English (fallback) without i18n warnings.
const result = await browserProbe(async ({ evaluate, delay }) => {
  await evaluate("(()=>{window.__w=[];const o=console.warn;console.warn=(...a)=>{window.__w.push(a.map(String).join(' '));o.apply(console,a)}})()")
  const opened = await evaluate("(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.querySelector('.q-icon')?.textContent.trim()==='settings');if(!b)return false;b.click();return true})()")
  await delay(800)
  const clicked = await evaluate("(()=>{const s=document.querySelector('[data-locale-switch]');const b=s&&[...s.querySelectorAll('button')].find(x=>x.textContent.includes('Português'));if(b)b.click();return !!b})()")
  await delay(500)
  const state = await evaluate("(()=>{const g=document.querySelector('#q-app').__vue_app__.config.globalProperties;return {locale:g.$i18n.locale,stored:localStorage.getItem('app.locale'),help:g.$t('help.identity.size'),fallback:g.$t('editor.renderSettings'),warns:window.__w.filter(w=>/i18n|Not found|Fall back/.test(w))}})()")
  return { opened, clicked, ...state }
})
assert.ok(result.opened, 'settings menu opens')
assert.ok(result.clicked, 'locale switch is rendered')
assert.equal(result.locale, 'pt-BR')
assert.equal(result.stored, 'pt-BR')
assert.match(result.help, /Dado de Vida/)
assert.equal(result.fallback, 'Stat Block Settings')
assert.deepEqual(result.warns, [])
console.log('Locale switch checks:', JSON.stringify({ locale: result.locale, stored: result.stored }))
