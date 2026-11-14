import assert from 'node:assert/strict'
import fs from 'node:fs'
import { browserProbe } from '../tools/qa/browser-probe.mjs'

const seraph = JSON.parse(
  fs.readFileSync(new URL('./fixtures/monsters/seraph.json', import.meta.url), 'utf8'),
)

await browserProbe(async ({ evaluate, send, delay }) => {
  // 1. Load Seraph fixture and measure Keystroke -> Preview p95 (<= 100 ms) + Completion Open (<= 100 ms) + Contrast (>= 4.5)
  const metrics = await evaluate(`(async () => {
    const wait = (ms) => new Promise((r) => setTimeout(r, ms))
    const until = async (fn, label, timeoutMs = 6000) => {
      const steps = Math.ceil(timeoutMs / 25)
      for (let i = 0; i < steps; i++) {
        const v = fn()
        if (v) return v
        await wait(25)
      }
      throw new Error('Timed out waiting for: ' + label)
    }

    const seraphData = ${JSON.stringify(seraph)}
    const root = await until(() => document.querySelector('#q-app')?.__vue_app__, 'Vue app mount')
    const pinia = root.config.globalProperties.$pinia
    const editor = pinia._s.get('editor')
    const monster = pinia._s.get('monster')
    editor.activeMode = 'monster'
    editor.style = '2024'
    editor.visualTemplate = 'modern'
    editor.visualTheme = 'wotc'
    editor.a4PreviewMode = false
    monster.$reset()
    monster.$patch(seraphData)
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))

    const initialSubtype = monster.subtype || ''
    const subtypeField = await until(
      () =>
        [...document.querySelectorAll('[data-editor-section="basics"] .q-field')].find((el) =>
          (el.textContent || '').toLowerCase().includes('subtype tag') && el.querySelector('input'),
        ),
      'Seraph Subtype Tag field',
    )
    const subtypeInput = subtypeField.querySelector('input')
    subtypeInput.scrollIntoView({ block: 'center' })
    const setInputValue = (el, val) => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set
      setter.call(el, val)
      el.dispatchEvent(new Event('input', { bubbles: true }))
    }

    const waitRenderIncludes = (expectedText) =>
      new Promise((resolve, reject) => {
        const render = document.querySelector('#render .statblock')
        if (!render) return reject(new Error('Missing #render .statblock'))
        if (render.textContent.includes(expectedText)) return resolve(0)
        const start = performance.now()
        let done = false
        const observer = new MutationObserver(() => {
          if (!done && render.textContent.includes(expectedText)) {
            done = true
            observer.disconnect()
            resolve(performance.now() - start)
          }
        })
        observer.observe(render, { childList: true, subtree: true, characterData: true })
        setTimeout(() => {
          if (!done) {
            done = true
            observer.disconnect()
            reject(new Error('Render did not reflect ' + expectedText))
          }
        }, 2000)
      })

    // Warmup passes before measurement
    for (let w = 0; w < 3; w++) {
      const token = 'WarmProbe' + w
      const p = waitRenderIncludes(token)
      setInputValue(subtypeInput, token)
      await p
    }

    const keystrokeSamples = []
    for (let i = 0; i < 15; i++) {
      const token = 'SeraphProbe' + i
      const start = performance.now()
      const waiter = waitRenderIncludes(token)
      setInputValue(subtypeInput, token)
      await waiter
      keystrokeSamples.push(performance.now() - start)
    }

    const sortedKeystrokes = [...keystrokeSamples].sort((a, b) => a - b)
    const keystrokeP95 = sortedKeystrokes[Math.min(sortedKeystrokes.length - 1, Math.floor(sortedKeystrokes.length * 0.95))]

    // Measure completion menu open latency (<= 100 ms) on non-debounced ACType mechanic-text-editor
    const macroField = [...document.querySelectorAll('[data-editor-section="basics"] .mechanic-text-editor')].find((wrap) => {
      const txt = (wrap.textContent || '').toLowerCase()
      const inp = wrap.querySelector('input')
      return inp && !inp.disabled && inp.offsetParent && !txt.includes('lair')
    })?.querySelector('input')
    if (!macroField) throw new Error('No visible non-debounced .mechanic-text-editor input found for completion probe')
    const initialMacroValue = macroField.value
    macroField.scrollIntoView({ block: 'center' })
    macroField.focus()
    const compStart = performance.now()
    const compWait = new Promise((resolve, reject) => {
      const existing = document.querySelector('[data-macro-suggest] [role="listbox"]')
      if (existing) return resolve(0)
      const observer = new MutationObserver(() => {
        if (document.querySelector('[data-macro-suggest] [role="listbox"]')) {
          observer.disconnect()
          resolve(performance.now() - compStart)
        }
      })
      observer.observe(document.body, { childList: true, subtree: true })
      setTimeout(() => {
        observer.disconnect()
        reject(new Error('Completion listbox timed out'))
      }, 2000)
    })
    setInputValue(macroField, 'aura {spe')
    macroField.setSelectionRange(9, 9)
    const completionOpenMs = await compWait
    macroField.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
    setInputValue(macroField, initialMacroValue)
    setInputValue(subtypeInput, initialSubtype)

    // Contrast ratio check on AC head in current painted surface (>= 4.5 : 1)
    const colorCanvas = document.createElement('canvas')
    colorCanvas.width = 1
    colorCanvas.height = 1
    const colorCtx = colorCanvas.getContext('2d')
    const rgba = (c) => {
      if (!colorCtx || !c) return [0, 0, 0, 0]
      colorCtx.clearRect(0, 0, 1, 1)
      colorCtx.fillStyle = 'rgba(0, 0, 0, 0)'
      colorCtx.fillStyle = c
      colorCtx.fillRect(0, 0, 1, 1)
      return [...colorCtx.getImageData(0, 0, 1, 1).data]
    }
    const lum = ([r, g, b]) => {
      const [rl, gl, bl] = [r, g, b].map((v) => {
        const s = v / 255
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
      })
      return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl
    }
    const contrast = (fgRgb, bgRgb) => {
      const l1 = lum(fgRgb)
      const l2 = lum(bgRgb)
      return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
    }
    const paintedOf = (node) => {
      for (let n = node; n; n = n.parentElement) {
        const bg = getComputedStyle(n).backgroundColor
        const parsed = rgba(bg)
        if (parsed[3] >= 250) return parsed
      }
      return [255, 255, 255, 255]
    }
    const acHead = document.querySelector('#render .statblock .dnd-cascade-title[data-help="armor-class"]')
    const fgColor = acHead ? getComputedStyle(acHead).color : ''
    const headContrast = acHead ? contrast(rgba(fgColor), paintedOf(acHead)) : 0

    // Arm MutationObserver + click timestamp for real CDP CatalogSelect open latency
    const selectEl = await until(
      () => document.querySelector('[data-editor-section="basics"] [data-catalog-select="creatureTypes"]'),
      'CatalogSelect creatureTypes',
    )
    const control = selectEl.querySelector('.q-field__control') || selectEl
    control.scrollIntoView({ block: 'center' })
    await wait(80)
    window.__catOpenPromise = new Promise((resolve, reject) => {
      let clickedAt = 0
      const onDown = () => {
        clickedAt = performance.now()
      }
      control.addEventListener('mousedown', onDown, { once: true })
      const observer = new MutationObserver(() => {
        if (document.querySelector('.q-menu [role="listbox"]')) {
          observer.disconnect()
          resolve(clickedAt ? performance.now() - clickedAt : 0)
        }
      })
      observer.observe(document.body, { childList: true, subtree: true })
      setTimeout(() => {
        observer.disconnect()
        reject(new Error('CatalogSelect listbox timed out'))
      }, 2500)
    })
    const rect = control.getBoundingClientRect()
    return {
      keystrokeP95,
      keystrokeSamples,
      completionOpenMs,
      headContrast,
      clickX: rect.left + rect.width / 2,
      clickY: rect.top + rect.height / 2,
    }
  })()`)

  // 2. Dispatch real CDP mouse click on CatalogSelect and measure open latency (<= 150 ms)
  await send('Input.dispatchMouseEvent', {
    type: 'mousePressed',
    x: metrics.clickX,
    y: metrics.clickY,
    button: 'left',
    clickCount: 1,
  })
  await send('Input.dispatchMouseEvent', {
    type: 'mouseReleased',
    x: metrics.clickX,
    y: metrics.clickY,
    button: 'left',
    clickCount: 1,
  })
  const catalogOpenMs = await evaluate('window.__catOpenPromise')
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' })
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape' })
  await delay(80)

  const summary = {
    keystrokeP95Ms: Number(metrics.keystrokeP95.toFixed(2)),
    completionOpenMs: Number(metrics.completionOpenMs.toFixed(2)),
    catalogSelectOpenMs: Number(catalogOpenMs.toFixed(2)),
    headContrast: Number(metrics.headContrast.toFixed(2)),
  }
  console.log('Budget probe metrics:', JSON.stringify(summary))

  assert.ok(metrics.keystrokeP95 <= 100, `Keystroke->preview p95 ${metrics.keystrokeP95.toFixed(2)} ms > 100 ms`)
  assert.ok(metrics.completionOpenMs <= 100, `Completion open ${metrics.completionOpenMs.toFixed(2)} ms > 100 ms`)
  assert.ok(catalogOpenMs <= 150, `CatalogSelect open ${catalogOpenMs.toFixed(2)} ms > 150 ms`)
  assert.ok(metrics.headContrast >= 4.5, `Head contrast ${metrics.headContrast.toFixed(2)} < 4.5`)
})
