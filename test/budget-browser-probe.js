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

  const clickPoint = async (x, y) => {
    await send('Input.dispatchMouseEvent', {
      type: 'mousePressed',
      x,
      y,
      button: 'left',
      clickCount: 1,
    })
    await send('Input.dispatchMouseEvent', {
      type: 'mouseReleased',
      x,
      y,
      button: 'left',
      clickCount: 1,
    })
  }

  const pressEscape = async () => {
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27, nativeVirtualKeyCode: 27 })
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27, nativeVirtualKeyCode: 27 })
    await delay(120)
  }

  // 2. Dispatch real CDP mouse click on CatalogSelect and measure open latency (<= 150 ms)
  await clickPoint(metrics.clickX, metrics.clickY)
  const catalogOpenMs = await evaluate('window.__catOpenPromise')
  await pressEscape()

  // 3. Permanent WCAG AA contrast guard across dark UI chrome, expanded editor panels,
  //    CatalogSelect listbox, and Character sheet parchment surface (dark + light OS media)
  const scanUiContrast = async (label, selectors) =>
    evaluate(`(() => {
      const parseRgba = (s) => {
        const m = String(s).match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)(?:,\\s*([\\d.]+))?\\)/)
        return m ? { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] } : null
      }
      const composite = (fg, bg) => {
        const a = fg.a ?? 1
        return {
          r: Math.round(fg.r * a + bg.r * (1 - a)),
          g: Math.round(fg.g * a + bg.g * (1 - a)),
          b: Math.round(fg.b * a + bg.b * (1 - a)),
          a: 1,
        }
      }
      const effectiveBg = (el) => {
        const layers = []
        for (let cur = el; cur; cur = cur.parentElement) {
          const c = parseRgba(getComputedStyle(cur).backgroundColor)
          if (c && c.a > 0) layers.push(c)
        }
        let base = document.body.classList.contains('body--dark')
          ? { r: 18, g: 18, b: 18, a: 1 }
          : { r: 255, g: 255, b: 255, a: 1 }
        for (let i = layers.length - 1; i >= 0; i--) base = composite(layers[i], base)
        return base
      }
      const lum = ({ r, g, b }) => {
        const f = (c) => {
          c /= 255
          return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
        }
        return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
      }
      const ratio = (c1, c2) => {
        const l1 = lum(c1)
        const l2 = lum(c2)
        return Number(((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)).toFixed(2))
      }
      const groups = new Map()
      const roots = ${JSON.stringify(selectors)}.flatMap((sel) => [...document.querySelectorAll(sel)])
      let checkedTextNodes = 0
      for (const root of roots) {
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
        let node
        while ((node = walker.nextNode())) {
          const txt = (node.nodeValue || '').trim()
          if (!txt) continue
          const el = node.parentElement
          if (!el || el.closest('#render')) continue
          if (el.closest('[disabled], [aria-disabled="true"], .disabled')) continue
          const st = getComputedStyle(el)
          if (st.display === 'none' || st.visibility === 'hidden' || st.opacity === '0') continue
          const rect = el.getBoundingClientRect()
          if (rect.width === 0 || rect.height === 0) continue
          const fgRaw = parseRgba(st.color)
          if (!fgRaw) continue
          checkedTextNodes++
          const bg = effectiveBg(el)
          const fg = fgRaw.a < 1 ? composite(fgRaw, bg) : fgRaw
          const cr = ratio(fg, bg)
          const fontSize = parseFloat(st.fontSize) || 14
          const weight = parseInt(st.fontWeight, 10) || 400
          const minRatio = fontSize >= 24 || (fontSize >= 18.66 && weight >= 700) ? 3.0 : 4.5
          if (cr < minRatio) {
            const key =
              ${JSON.stringify(label)} + '|' + el.tagName + '|' + String(el.className || '').slice(0, 40) + '|' + st.color + '|' + bg.r + ',' + bg.g + ',' + bg.b
            if (!groups.has(key)) {
              groups.set(key, {
                view: ${JSON.stringify(label)},
                tag: el.tagName,
                cls: String(el.className || '').slice(0, 60),
                sample: txt.slice(0, 35),
                fg: st.color,
                bg: 'rgb(' + bg.r + ',' + bg.g + ',' + bg.b + ')',
                cr,
                minRatio,
              })
            }
          }
        }
      }
      return {
        bodyDark: document.body.classList.contains('body--dark'),
        checkedTextNodes,
        menuCount: document.querySelectorAll('.q-menu .q-item').length,
        violations: [...groups.values()],
      }
    })()`)

  const catalogPoint = await evaluate(`(async () => {
    document.querySelectorAll('#editor .q-expansion-item > .q-expansion-item__container > .q-item')
      .forEach((el) => { if (el.getAttribute('aria-expanded') !== 'true') el.click() })
    await new Promise((r) => setTimeout(r, 350))
    document.querySelectorAll('#editor .q-expansion-item .q-expansion-item > .q-expansion-item__container > .q-item')
      .forEach((el) => { if (el.getAttribute('aria-expanded') !== 'true') el.click() })
    await new Promise((r) => setTimeout(r, 150))
    const sel = document.querySelector('[data-editor-section="basics"] [data-catalog-select="creatureTypes"]')
    const target = sel?.querySelector('.q-field__control') || sel
    target.scrollIntoView({ block: 'center' })
    await new Promise((r) => setTimeout(r, 100))
    const r = target.getBoundingClientRect()
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
  })()`)
  await clickPoint(catalogPoint.x, catalogPoint.y)
  await evaluate(`(async () => {
    for (let i = 0; i < 40; i++) {
      if (document.querySelectorAll('.q-menu .q-item').length > 0) return true
      await new Promise((r) => setTimeout(r, 25))
    }
    throw new Error('Timed out waiting for CatalogSelect .q-menu options')
  })()`)

  const uiViolations = []
  const darkUi = await scanUiContrast('monster-dark-os', ['#main-nav', '#editor', '#footer', '.q-menu'])
  assert.ok(darkUi.checkedTextNodes > 100, `Expected >100 checked text nodes in monster dark scan, got ${darkUi.checkedTextNodes}`)
  assert.ok(darkUi.menuCount > 0, 'Expected open CatalogSelect .q-menu items during UI contrast scan')
  assert.equal(darkUi.bodyDark, true, 'Expected body--dark to be active under dark OS media')
  uiViolations.push(...darkUi.violations)

  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }] })
  await delay(250)
  const lightOsUi = await scanUiContrast('monster-light-os', ['#main-nav', '#editor', '#footer', '.q-menu'])
  assert.equal(lightOsUi.bodyDark, true, 'Expected body--dark to stay locked under light OS media')
  uiViolations.push(...lightOsUi.violations)

  await pressEscape()
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'dark' }] })
  await evaluate(`(() => {
    const root = document.querySelector('#q-app')?.__vue_app__
    root.config.globalProperties.$pinia._s.get('editor').activeMode = 'character'
  })()`)
  await delay(400)
  await evaluate(`(() => {
    document.querySelectorAll('#char-editor .q-expansion-item > .q-expansion-item__container > .q-item')
      .forEach((el) => { if (el.getAttribute('aria-expanded') !== 'true') el.click() })
  })()`)
  await delay(350)
  const charUi = await scanUiContrast('character-mode', ['#main-nav', '#char-editor', '#char-sheet', '#footer'])
  assert.ok(charUi.checkedTextNodes > 50, `Expected >50 checked text nodes in character scan, got ${charUi.checkedTextNodes}`)
  uiViolations.push(...charUi.violations)

  await evaluate(`(() => {
    const root = document.querySelector('#q-app')?.__vue_app__
    const pinia = root.config.globalProperties.$pinia
    pinia._s.get('editor').activeMode = 'monster'
    pinia._s.get('editor').style = '2014'
  })()`)
  await delay(250)
  const mode2014Ui = await scanUiContrast('monster-2014-header', ['header', '#main-nav'])
  assert.ok(mode2014Ui.checkedTextNodes > 15, `Expected >15 checked text nodes in 2014 header, got ${mode2014Ui.checkedTextNodes}`)
  uiViolations.push(...mode2014Ui.violations)

  // Dismiss any overlapping toast notification before clicking top-bar dialogs
  await evaluate(`(() => {
    for (const b of document.querySelectorAll('.q-notification button')) {
      if (/got it/i.test(b.textContent || '')) b.click()
    }
    document.querySelector('[data-library-open]')?.click()
  })()`)
  await delay(300)
  const libUi = await scanUiContrast('library-dialog', ['.q-dialog .q-card'])
  assert.ok(libUi.checkedTextNodes > 10, `Expected >10 checked text nodes in library dialog, got ${libUi.checkedTextNodes}`)
  uiViolations.push(...libUi.violations)
  await pressEscape()
  await evaluate(`(() => {
    const closeBtn = [...document.querySelectorAll('.q-dialog button')].find((b) => /done|close/i.test((b.textContent || '') + ' ' + (b.getAttribute('aria-label') || '')))
    closeBtn?.click()
  })()`)
  await delay(200)

  await evaluate(`(() => {
    const btn = [...document.querySelectorAll('header button')].find((b) => (b.innerHTML || '').includes('sword'))
    btn?.click()
  })()`)
  await delay(300)
  const combatUi = await scanUiContrast('combat-drawer', ['.q-drawer'])
  assert.ok(combatUi.checkedTextNodes >= 5, `Expected >=5 checked text nodes in combat drawer, got ${combatUi.checkedTextNodes}`)
  uiViolations.push(...combatUi.violations)
  await evaluate(`(() => {
    const btn = [...document.querySelectorAll('.q-drawer button')].find((b) => /close/i.test((b.textContent || '') + ' ' + (b.getAttribute('aria-label') || '')))
    btn?.click()
  })()`)
  await delay(200)

  // D2.2: Scan FocusedHelpBar and RulesConversionDialog contrast + Escape keyboard close
  const helpBarUi = await scanUiContrast('focused-help-bar', ['[data-focused-help-bar]'])
  assert.ok(helpBarUi.checkedTextNodes >= 2, `Expected >=2 text nodes in FocusedHelpBar, got ${helpBarUi.checkedTextNodes}`)
  uiViolations.push(...helpBarUi.violations)

  await evaluate(`(() => {
    const settingsBtn = [...document.querySelectorAll('header button')].find((b) => b.querySelector('.q-icon')?.textContent?.trim() === 'settings')
    settingsBtn?.click()
  })()`)
  await delay(250)
  await evaluate(`(() => {
    document.querySelector('[data-open-rules-converter]')?.click()
  })()`)
  await evaluate(`(async () => {
    for (let i = 0; i < 40; i++) {
      const dlg = document.querySelector('[data-rules-conversion-dialog]')
      if (dlg && parseFloat(getComputedStyle(dlg).opacity) > 0.9 && dlg.getBoundingClientRect().height > 80) return true
      await new Promise((r) => setTimeout(r, 30))
    }
    throw new Error('Timed out waiting for visible RulesConversionDialog')
  })()`)
  await delay(100)
  const rulesDialogUi = await scanUiContrast('rules-conversion-dialog', ['[data-rules-conversion-dialog]'])
  assert.ok(rulesDialogUi.checkedTextNodes >= 6, `Expected >=6 text nodes in RulesConversionDialog, got ${rulesDialogUi.checkedTextNodes}`)
  uiViolations.push(...rulesDialogUi.violations)
  await pressEscape()
  const rulesDialogClosed = await evaluate(`(async () => {
    for (let i = 0; i < 40; i++) {
      if (!document.querySelector('[data-rules-conversion-dialog]')) return true
      await new Promise((r) => setTimeout(r, 30))
    }
    return false
  })()`)
  assert.equal(rulesDialogClosed, true, 'Expected Escape to dismiss RulesConversionDialog')

  for (const route of ['#/templates', '#/spells', '#/reset']) {
    await evaluate(`location.hash = ${JSON.stringify(route)}`)
    await delay(300)
    const routeUi = await scanUiContrast(route, ['.q-layout', '.q-page', '.q-card'])
    assert.ok(routeUi.checkedTextNodes > 15, `Expected >15 checked text nodes in ${route}, got ${routeUi.checkedTextNodes}`)
    uiViolations.push(...routeUi.violations)
  }
  await evaluate(`(() => {
    location.hash = '#/'
    const root = document.querySelector('#q-app')?.__vue_app__
    const ed = root.config.globalProperties.$pinia._s.get('editor')
    ed.activeMode = 'monster'
    ed.style = '2024'
  })()`)
  await delay(250)

  const summary = {
    keystrokeP95Ms: Number(metrics.keystrokeP95.toFixed(2)),
    completionOpenMs: Number(metrics.completionOpenMs.toFixed(2)),
    catalogSelectOpenMs: Number(catalogOpenMs.toFixed(2)),
    headContrast: Number(metrics.headContrast.toFixed(2)),
    uiContrastViolations: uiViolations.length,
  }
  console.log('Budget probe metrics:', JSON.stringify(summary))

  assert.ok(metrics.keystrokeP95 <= 100, `Keystroke->preview p95 ${metrics.keystrokeP95.toFixed(2)} ms > 100 ms`)
  assert.ok(metrics.completionOpenMs <= 100, `Completion open ${metrics.completionOpenMs.toFixed(2)} ms > 100 ms`)
  assert.ok(catalogOpenMs <= 150, `CatalogSelect open ${catalogOpenMs.toFixed(2)} ms > 150 ms`)
  assert.ok(metrics.headContrast >= 4.5, `Head contrast ${metrics.headContrast.toFixed(2)} < 4.5`)
  assert.equal(uiViolations.length, 0, `UI contrast violations detected: ${JSON.stringify(uiViolations)}`)
})
