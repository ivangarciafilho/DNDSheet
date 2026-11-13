import assert from 'node:assert/strict'
import { browserProbe } from '../tools/qa/browser-probe.mjs'

// One catalog, three completion surfaces: plain fields, rich editors and bare formulas.
await browserProbe(async ({ evaluate, send, delay }) => {
  const result = await evaluate(`(async () => {
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms))
    const visible = el => !!el && !!el.offsetParent && el.getBoundingClientRect().height > 0
    const until = async (fn, label) => { for (let i = 0; i < 60; i++) { const v = fn(); if (v) return v; await wait(50) } throw Error('Timed out: ' + label) }
    const key = (el, k) => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }))
    const out = {}

    // 1. Plain field: "{spe" offers Spell save DC; keyboard insert; preview; combobox state.
    const field = [...document.querySelectorAll('.mechanic-text-editor')].find(e => visible(e) && !e.querySelector('[aria-disabled="true"]') && e.querySelector('input') && !e.querySelector('.q-editor'))
    const input = field.querySelector('input')
    input.focus(); input.value = 'aura {spe'; input.setSelectionRange(9, 9); input.dispatchEvent(new Event('input', { bubbles: true }))
    const menu = await until(() => document.querySelector('[data-macro-suggest] [role="listbox"]'), 'plain suggestions')
    out.plainLabels = [...menu.querySelectorAll('.macro-suggest-label')].map(e => e.textContent)
    out.plainAria = input.getAttribute('role') === 'combobox' && input.getAttribute('aria-expanded') === 'true' && !!document.getElementById(input.getAttribute('aria-activedescendant'))
    const target = out.plainLabels.indexOf('Spell save DC')
    for (let i = 0; i < target; i++) key(input, 'ArrowDown')
    key(input, 'Enter'); await wait(300)
    out.plainValue = input.value
    out.plainPreview = field.querySelector('[data-macro-preview]')?.textContent.trim()
    out.plainClosed = input.getAttribute('aria-expanded') === 'false'

    // 2. Rich editor: "{dc:c" at the caret, Enter inserts and adds no line.
    let ed = [...document.querySelectorAll('.q-editor .q-editor__content[contenteditable="true"]')].find(visible)
    if (!ed) {
      ed = document.querySelector('.q-editor .q-editor__content[contenteditable="true"]')
      const chain = []; for (let n = ed && ed.closest('.q-expansion-item'); n; n = n.parentElement && n.parentElement.closest('.q-expansion-item')) chain.unshift(n)
      for (const item of chain) if (!item.classList.contains('q-expansion-item--expanded')) { item.querySelector('.q-item').click(); await wait(400) }
    }
    ed.scrollIntoView({ block: 'center' }); ed.focus()
    const sel = getSelection(), range = document.createRange(); range.selectNodeContents(ed); range.collapse(false); sel.removeAllRanges(); sel.addRange(range)
    document.execCommand('insertText', false, ' DC {dc:c')
    const pop = await until(() => document.querySelector('[data-macro-suggest-rich]'), 'rich suggestions')
    out.richLabels = [...pop.querySelectorAll('.macro-suggest-label')].map(e => e.textContent)
    out.richAria = ed.getAttribute('aria-expanded') === 'true' && !!document.getElementById(ed.getAttribute('aria-activedescendant'))
    const lines = ed.querySelectorAll('div, br').length
    key(ed, 'Enter'); await wait(300)
    out.richTail = ed.textContent.slice(-12)
    out.richNoLine = ed.querySelectorAll('div, br').length === lines

    return out
  })()`)

  // 3. Custom formula: a real click opens the select; "PB + STR_M" offers STR_MOD, inserted bare.
  const box = await evaluate(`(() => {
    // AC accepts ability modifiers; ability scores themselves do not (that would be circular).
    const formula = document.querySelector('[data-formula-field="AC"]')
    formula.scrollIntoView({ block: 'center' })
    formula.setAttribute('data-smoke-formula', '')
    const r = formula.querySelector('.q-field__control').getBoundingClientRect()
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
  })()`)
  for (const type of ['mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x: box.x, y: box.y, button: 'left', clickCount: 1 })
  await delay(400)
  const formula = await evaluate(`(async () => {
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms))
    const until = async (fn, label) => { for (let i = 0; i < 60; i++) { const v = fn(); if (v) return v; await wait(50) } throw Error('Timed out: ' + label) }
    const key = (el, k) => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }))
    const out = {}
    const formula = document.querySelector('[data-smoke-formula]')
    const custom = await until(() => [...document.querySelectorAll('.q-menu .q-item')].find(e => e.textContent.includes('Custom formula')), 'custom formula option')
    custom.click()
    const draft = await until(() => formula.querySelector('.formula-field__draft input'), 'formula draft')
    draft.focus(); draft.value = 'PB + STR_M'; draft.setSelectionRange(10, 10); draft.dispatchEvent(new Event('input', { bubbles: true }))
    const refs = await until(() => document.querySelector('[data-formula-suggest] [role="listbox"]'), 'formula suggestions')
    out.formulaLabels = [...refs.querySelectorAll('code')].map(e => e.textContent)
    out.formulaAria = draft.getAttribute('aria-expanded') === 'true' && !!document.getElementById(draft.getAttribute('aria-activedescendant'))
    key(draft, 'Enter'); await wait(300)
    out.formulaValue = draft.value
    out.formulaStillEditing = !!formula.querySelector('.formula-field__draft')
    key(draft, 'Escape'); await wait(200)
    return out
  })()`)
  Object.assign(result, formula)
  assert.ok(result.plainLabels.includes('Spell save DC') && result.plainAria, JSON.stringify(result))
  assert.equal(result.plainValue, 'aura {SPELL_DC}', JSON.stringify(result))
  assert.match(result.plainPreview, /^Prints: aura \d+$/, JSON.stringify(result))
  assert.ok(result.plainClosed, JSON.stringify(result))
  assert.ok(result.richLabels.includes('Constitution save DC') && result.richAria, JSON.stringify(result))
  assert.ok(result.richTail.endsWith('DC {DC:CON}') && result.richNoLine, JSON.stringify(result))
  assert.ok(result.formulaLabels[0] === 'STR_MOD' && result.formulaAria, JSON.stringify(result))
  assert.ok(result.formulaValue === 'PB + STR_MOD' && result.formulaStillEditing, JSON.stringify(result))
  console.log('Macro and formula autocomplete passed on plain, rich and formula fields.')
}, { url: process.env.DNDSHEET_E2E_URL || 'http://127.0.0.1:9234/index.html#/', port: 9397 })
