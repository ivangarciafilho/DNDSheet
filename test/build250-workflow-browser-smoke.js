import assert from 'node:assert/strict'
import { browserProbe } from '../tools/qa/browser-probe.mjs'

await browserProbe(async ({ evaluate, send, delay }) => {
  const sendKey = async (key, code, keyCode, text) => {
    await send('Input.dispatchKeyEvent', {
      type: text ? 'rawKeyDown' : 'keyDown',
      key,
      code,
      windowsVirtualKeyCode: keyCode,
      nativeVirtualKeyCode: keyCode,
    })
    if (text) {
      await send('Input.dispatchKeyEvent', { type: 'char', text })
    }
    await send('Input.dispatchKeyEvent', {
      type: 'keyUp',
      key,
      code,
      windowsVirtualKeyCode: keyCode,
      nativeVirtualKeyCode: keyCode,
    })
  }

  // 1. Verify Basics 6-panel decomposition & single 15-section top-level shell
  const setup = await evaluate(`(async () => {
    const wait = (ms) => new Promise((r) => setTimeout(r, ms))
    const until = async (fn, label, timeoutMs = 6000) => {
      const steps = Math.ceil(timeoutMs / 40)
      for (let i = 0; i < steps; i++) {
        const v = fn()
        if (v) return v
        await wait(40)
      }
      throw new Error('Timed out waiting for: ' + label)
    }

    const root = await until(() => document.querySelector('#q-app')?.__vue_app__, 'Vue mount')
    const pinia = root.config.globalProperties.$pinia
    const editor = pinia._s.get('editor')
    const monster = pinia._s.get('monster')
    editor.activeMode = 'monster'
    editor.style = '2024'
    editor.visualTemplate = 'modern'
    editor.visualTheme = 'wotc'
    editor.a4PreviewMode = false
    monster.$reset()
    await wait(120)

    const topPanels = [...document.querySelectorAll('#editor > .q-list > .q-expansion-item')]
    const basicsEl = document.querySelector('[data-editor-section="basics"]')
    if (!basicsEl) throw new Error('Missing basics section')
    const basicsText = basicsEl.textContent || ''
    const hasAllSixSections =
      basicsText.includes('Ability Scores') &&
      basicsText.includes('Armor Class Compositor') &&
      basicsText.includes('Hit Points Defenses & Survival') &&
      basicsText.includes('Initiative Tuning & Paragon Phases') &&
      basicsText.includes('Languages') &&
      Boolean(basicsEl.querySelector('[data-catalog-select="creatureTypes"]'))

    const crSelect = [...basicsEl.querySelectorAll('[data-catalog-select]')].find(
      (el) => (el.getAttribute('aria-label') || '').trim() === 'CR' || el.closest('.q-field')?.querySelector('.q-field__label')?.textContent?.trim() === 'CR',
    )
    if (!crSelect) throw new Error('Missing CR CatalogSelect in Basics')
    crSelect.scrollIntoView({ block: 'center' })
    await wait(80)
    const crRect = (crSelect.closest('.q-field__control') || crSelect.querySelector('.q-field__control') || crSelect).getBoundingClientRect()

    return {
      topPanelCount: topPanels.length,
      hasAllSixSections,
      crX: crRect.left + crRect.width / 2,
      crY: crRect.top + crRect.height / 2,
    }
  })()`)

  assert.equal(setup.topPanelCount, 15, `Expected 15 top-level sections, got ${setup.topPanelCount}`)
  assert.equal(setup.hasAllSixSections, true, 'Missing one or more decomposed Basics subpanels')

  // 2. Test CR = 0 and CR = 15 transitions through real CDP CatalogSelect interaction
  const clickPoint = async (x, y) => {
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 })
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 })
  }

  await clickPoint(setup.crX, setup.crY)
  const crZeroOpt = await evaluate(`(async () => {
    const wait = (ms) => new Promise((r) => setTimeout(r, ms))
    const until = async (fn, label) => {
      for (let i = 0; i < 60; i++) {
        const v = fn()
        if (v) return v
        await wait(40)
      }
      throw new Error('Timed out waiting for: ' + label)
    }
    const opt = await until(() => document.querySelector('.q-menu [data-catalog-option="0"]'), 'CR 0 option')
    opt.scrollIntoView({ block: 'nearest' })
    await wait(40)
    const r = opt.getBoundingClientRect()
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
  })()`)
  await clickPoint(crZeroOpt.x, crZeroOpt.y)
  await delay(120)

  const afterCrZero = await evaluate(`(() => {
    const pinia = document.querySelector('#q-app').__vue_app__.config.globalProperties.$pinia
    const monster = pinia._s.get('monster')
    const statText = document.querySelector('#render .statblock')?.textContent || ''
    const crVal = document.querySelector('#render .statblock .cr-main-region .region-val')?.textContent?.trim() || ''
    return { cr: monster.CR, pb: monster.proficiency, hasZeroCr: crVal === '0' || /CR\\s*0\\b|Challenge\\s*0\\b/i.test(statText) }
  })()`)
  assert.equal(afterCrZero.cr, 0, 'Selecting CR 0 should set monster.CR === 0')
  assert.equal(afterCrZero.hasZeroCr, true, 'Statblock should display CR 0 cleanly')

  // Switch CR to 15 via real click + filter
  const crBtn2 = await evaluate(`(async () => {
    const basicsEl = document.querySelector('[data-editor-section="basics"]')
    const crSelect = [...basicsEl.querySelectorAll('[data-catalog-select]')].find(
      (el) => (el.getAttribute('aria-label') || '').trim() === 'CR' || el.closest('.q-field')?.querySelector('.q-field__label')?.textContent?.trim() === 'CR',
    )
    const r = (crSelect.closest('.q-field__control') || crSelect.querySelector('.q-field__control') || crSelect).getBoundingClientRect()
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
  })()`)
  await clickPoint(crBtn2.x, crBtn2.y)
  const crFifteenOpt = await evaluate(`(async () => {
    const wait = (ms) => new Promise((r) => setTimeout(r, ms))
    const until = async (fn, label) => {
      for (let i = 0; i < 80; i++) {
        const v = fn()
        if (v) return v
        await wait(40)
      }
      throw new Error('Timed out waiting for: ' + label)
    }
    const opt = await until(() => document.querySelector('.q-menu [data-catalog-option="18"]'), 'CR 15 (index 18) option')
    opt.scrollIntoView({ block: 'nearest' })
    await wait(50)
    const r = opt.getBoundingClientRect()
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
  })()`)
  await clickPoint(crFifteenOpt.x, crFifteenOpt.y)
  await delay(120)

  const afterCrFifteen = await evaluate(`(() => {
    const pinia = document.querySelector('#q-app').__vue_app__.config.globalProperties.$pinia
    const monster = pinia._s.get('monster')
    const statText = document.querySelector('#render .statblock')?.textContent || ''
    const crVal = document.querySelector('#render .statblock .cr-main-region .region-val')?.textContent?.trim() || ''
    return { cr: monster.CR, pb: monster.proficiency, hasCr15: crVal === '15' || /\\b15\\b/.test(statText) }
  })()`)
  assert.equal(afterCrFifteen.cr, 18, 'Selecting CR 15 option should update monster.CR index to 18')
  assert.equal(afterCrFifteen.pb, 5, 'CR 15 (index 18) should synchronize proficiency bonus to +5')
  assert.equal(afterCrFifteen.hasCr15, true, 'Statblock should display CR 15')

  // 3. Keyboard-only traversal through Basics controls + CatalogSelect Enter/Escape flow
  const focusPrep = await evaluate(`(() => {
    const basicsEl = document.querySelector('[data-editor-section="basics"]')
    const firstInput = [...basicsEl.querySelectorAll('input')].find((el) => el.offsetParent && !el.disabled)
    if (!firstInput) throw new Error('No focusable input in basics')
    firstInput.scrollIntoView({ block: 'center' })
    firstInput.focus()
    return document.activeElement === firstInput
  })()`)
  assert.equal(focusPrep, true, 'Initial focus should land on first input in basics')

  const visitedTags = new Set()
  for (let i = 0; i < 16; i++) {
    await sendKey('Tab', 'Tab', 9)
    await delay(25)
    const desc = await evaluate(`(() => {
      const a = document.activeElement
      if (!a || a === document.body) return 'body'
      const label = a.getAttribute('aria-label') || a.closest('.q-field')?.querySelector('.q-field__label')?.textContent || a.textContent || ''
      return a.tagName + ':' + label.trim().slice(0, 32)
    })()`)
    if (desc !== 'body') visitedTags.add(desc)
  }
  assert.ok(visitedTags.size >= 8, `Expected keyboard Tab traversal across >= 8 distinct Basics controls, visited ${visitedTags.size}`)

  // Open creatureTypes CatalogSelect -> keyboard search -> Enter -> Escape close
  const typeSelectPoint = await evaluate(`(async () => {
    const el = document.querySelector('[data-editor-section="basics"] [data-catalog-select="creatureTypes"]')
    el.scrollIntoView({ block: 'center' })
    await new Promise((r) => setTimeout(r, 60))
    const r = (el.closest('.q-field__control') || el.querySelector('.q-field__control') || el).getBoundingClientRect()
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
  })()`)
  await clickPoint(typeSelectPoint.x, typeSelectPoint.y)
  await delay(80)
  await send('Input.insertText', { text: 'Celestial' })
  await delay(100)
  await sendKey('ArrowDown', 'ArrowDown', 40)
  await delay(60)
  await sendKey('Enter', 'Enter', 13)
  await delay(100)
  await sendKey('Escape', 'Escape', 27)
  await delay(60)

  const pickedType = await evaluate(`(() => {
    const pinia = document.querySelector('#q-app').__vue_app__.config.globalProperties.$pinia
    return pinia._s.get('monster').type
  })()`)
  assert.match(String(pickedType || ''), /celestial/i, `Expected keyboard CatalogSelect choice to select Celestial, got ${pickedType}`)

  // 4. Verify Sweep 2 & Sweep 3 panels: ClassCastingEditor, A4LayerStudio scroll region (BS-35), and ActionsEditor
  const panelChecks = await evaluate(`(async () => {
    const wait = (ms) => new Promise((r) => setTimeout(r, ms))
    const until = async (fn, label, timeoutMs = 6000) => {
      const steps = Math.ceil(timeoutMs / 40)
      for (let i = 0; i < steps; i++) {
        const v = fn()
        if (v) return v
        await wait(40)
      }
      throw new Error('Timed out waiting for: ' + label)
    }

    // Spellcasting panel
    document.querySelector('[data-section-jump="spellcasting"]')?.click()
    await wait(250)
    const addSourceBtn = await until(() => document.querySelector('[data-add-casting-source]'), 'Add casting source btn')
    addSourceBtn.click()
    await wait(200)
    const hasSourceCatalogSelects =
      Boolean(document.querySelector('[data-source-rules]')) &&
      document.querySelectorAll('[data-casting-source] [data-catalog-select]').length >= 5
    document.querySelector('[data-remove-casting-source]')?.click()
    await wait(120)

    // A4 Layer Studio scroll region (BS-35)
    document.querySelector('[data-section-jump="a4Layers"]')?.click()
    await wait(250)
    const studioEl = await until(() => document.querySelector('[data-editor-section="a4Layers"]'), 'A4 Layer Studio')
    const pinia = document.querySelector('#q-app').__vue_app__.config.globalProperties.$pinia
    const editor = pinia._s.get('editor')
    // Populate 6 mock A4 layers via editor store to test .editor-scroll-region containment
    editor.a4Layers = Array.from({ length: 6 }, (_, i) => ({
      id: 'smoke-layer-' + i,
      name: 'Smoke Layer ' + (i + 1),
      type: 'background',
      visible: true,
      opacity: 100,
      blendMode: 'normal',
      zIndex: i,
      scale: 100,
      offsetX: 0,
      offsetY: 0,
      rotation: 0,
      flipX: false,
      flipY: false,
    }))
    await wait(150)
    const scrollList = studioEl.querySelector('[data-a4-layer-list].editor-scroll-region')
    if (!scrollList) throw new Error('Missing .editor-scroll-region[data-a4-layer-list] in A4LayerStudio')
    const scrollStyle = getComputedStyle(scrollList)
    const layerScrollContained =
      (scrollStyle.overflowY === 'auto' || scrollStyle.overflowY === 'scroll') &&
      scrollList.scrollWidth <= scrollList.clientWidth + 1
    editor.a4Layers = []
    await wait(80)

    // Actions Editor open check
    document.querySelector('[data-section-jump="actions"]')?.click()
    await wait(250)
    const actionsOk = Boolean(document.querySelector('[data-editor-section="actions"]'))

    return { hasSourceCatalogSelects, layerScrollContained, actionsOk }
  })()`)

  assert.equal(panelChecks.hasSourceCatalogSelects, true, 'ClassCastingEditor should mount CatalogSelect kit controls')
  assert.equal(panelChecks.layerScrollContained, true, 'A4LayerStudio layer stack should constrain scroll without horizontal overflow (BS-35)')
  assert.equal(panelChecks.actionsOk, true, 'ActionsEditor section should open cleanly')

  // 5. Verify 0 horizontal overflow across Desktop (1440px), 200% Zoom (640px), and Mobile (390px)
  const checkViewport = async (width, height, scale, mobile) => {
    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: scale,
      mobile,
    })
    await delay(200)
    return evaluate(`(() => ({
      innerWidth: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      hasNarrowSwitcher: Boolean(document.querySelector('[data-narrow-pane-switcher]')),
    }))()`)
  }

  const desktop = await checkViewport(1440, 900, 1, false)
  assert.ok(desktop.scrollWidth <= desktop.innerWidth + 1, `Desktop overflow: ${desktop.scrollWidth} > ${desktop.innerWidth}`)

  const zoom200 = await checkViewport(640, 720, 2, false)
  assert.ok(zoom200.scrollWidth <= zoom200.innerWidth + 1, `200% zoom (640px) overflow: ${zoom200.scrollWidth} > ${zoom200.innerWidth}`)

  const mobile = await checkViewport(390, 844, 2, true)
  assert.ok(mobile.scrollWidth <= mobile.innerWidth + 1, `Mobile (390px) overflow: ${mobile.scrollWidth} > ${mobile.innerWidth}`)
  assert.equal(mobile.hasNarrowSwitcher, true, 'Mobile 390px must display narrow pane switcher')

  // Toggle mobile preview pane cleanly
  const mobileSwitch = await evaluate(`(async () => {
    const buttons = [...document.querySelectorAll('[data-narrow-pane-switcher] button')]
    const previewBtn = buttons.find((b) => (b.textContent || '').includes('Stat block'))
    previewBtn?.click()
    await new Promise((r) => setTimeout(r, 150))
    const hasStatblock = Boolean(document.querySelector('#render .statblock'))
    const overflow = document.documentElement.scrollWidth <= window.innerWidth + 1
    buttons.find((b) => (b.textContent || '').includes('Editor'))?.click()
    return { hasStatblock, overflow }
  })()`)
  assert.equal(mobileSwitch.hasStatblock, true)
  assert.equal(mobileSwitch.overflow, true)

  console.log(
    'Build 250 workflow E2E passed:',
    JSON.stringify({
      topPanels: setup.topPanelCount,
      basicsSections: setup.hasAllSixSections,
      crZero: afterCrZero.cr,
      crFifteen: afterCrFifteen.cr,
      keyboardControlsVisited: visitedTags.size,
      pickedType,
      panelChecks,
      desktop,
      zoom200,
      mobile,
    }),
  )
})
