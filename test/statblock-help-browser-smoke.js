import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import http from 'node:http'
import os from 'node:os'
import path from 'node:path'

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const port = 9226
const appUrl = process.env.DNDSHEET_E2E_URL || 'http://localhost:8080/#/'
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'dn-sheet-help-'))
const chrome = spawn(chromePath, [`--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--headless=new', '--disable-gpu', '--no-sandbox', '--disable-extensions', appUrl])
let ws

try {
  const targets = await waitForTargets()
  const page = targets.find((target) => target.type === 'page')
  assert.ok(page, 'Chrome did not expose a page target')
  ws = new WebSocket(page.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Chrome DevTools websocket timed out')), 5000)
    ws.addEventListener('open', () => { clearTimeout(timeout); resolve() }, { once: true })
    ws.addEventListener('error', reject, { once: true })
  })

  let nextId = 1
  const pending = new Map()
  ws.addEventListener('message', (event) => {
    const message = JSON.parse(event.data)
    if (message.id && pending.has(message.id)) { pending.get(message.id)(message); pending.delete(message.id) }
  })
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = nextId++
    pending.set(id, (message) => message.error ? reject(new Error(message.error.message)) : resolve(message))
    ws.send(JSON.stringify({ id, method, params }))
  })
  const evaluate = async (expression) => {
    const response = await send('Runtime.evaluate', { expression: `(${expression})()`, awaitPromise: true, returnByValue: true })
    if (response.result?.exceptionDetails) throw new Error(response.result.exceptionDetails.text)
    return response.result?.result?.value
  }
  await send('Runtime.enable')
  let ready = false
  for (let i = 0; i < 80; i++) {
    ready = await evaluate(`() => Boolean(document.querySelector('.statblock [data-help="armor-class"]'))`)
    if (ready) break
    await delay(250)
  }
  assert.equal(ready, true, 'The rendered stat block help target did not appear')

  const rowGrammar = await evaluate(`() => {
    const rows = [...document.querySelectorAll('.statblock .dnd-cellular-row')]
    const migrated = rows.filter((row) => row.matches('.ac, .hp, .speed, .dnd-defense-cascade-row, .cascade-skill-search, .cascade-skill-study, .cascade-skill-influence, .cascade-skill-hide'))
    return {
      count: migrated.length,
      allRows: migrated.every((row) => row.classList.contains('sb-row')),
      allHeads: migrated.every((row) => row.querySelectorAll(':scope > .sb-cell.sb-head').length === 1),
      allHaveData: migrated.every((row) => row.querySelector(':scope > .sb-cell:not(.sb-head)')),
    }
  }`)
  assert.ok(rowGrammar.count >= 3, 'Expected AC, HP, and Speed shared grammar rows')
  assert.equal(rowGrammar.allRows, true, 'Migrated cascade rows should use the shared row class')
  assert.equal(rowGrammar.allHeads, true, 'Each migrated row should have exactly one semantic head cell')
  assert.equal(rowGrammar.allHaveData, true, 'Each migrated row should expose a data cell')

  const themeProbe = await evaluate(`async () => {
    const root = document.querySelector('#q-app')
    const editor = root.__vue_app__.config.globalProperties.$pinia._s.get('editor')
    const themes = ['wotc', 'printer', 'lovecraft_golden', 'lovecraft_silver', 'lovecraft_toxic', 'lovecraft_spooky', 'lovecraft_galactic', 'lovecraft_fathomless', 'dwarves_forge', 'dwarves_aetherpunk', 'art_nouveau', 'art_deco']
    const results = []
    for (const theme of themes) {
      editor.visualTheme = theme
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      const head = document.querySelector('.statblock .ac .sb-head')
      const cell = document.querySelector('.statblock .ac .sb-cell:not(.sb-head)')
      if (!head || !cell) { results.push({ theme, valid: false }); continue }
      const headStyle = getComputedStyle(head)
      const cellStyle = getComputedStyle(cell)
      const visibleText = cell.querySelector('.dnd-cascade-badge') || cell
      results.push({
        theme,
        valid: headStyle.backgroundColor !== 'rgba(0, 0, 0, 0)' && cellStyle.backgroundColor !== 'rgba(0, 0, 0, 0)',
        headBackground: headStyle.backgroundColor,
        headInk: headStyle.color,
        headContrast: contrast(headStyle.color, headStyle.backgroundColor),
        cellBackground: cellStyle.backgroundColor,
        cellInk: getComputedStyle(visibleText).color,
        cellContrast: contrast(getComputedStyle(visibleText).color, cellStyle.backgroundColor),
      })
    }
    return results

    function contrast(foreground, background) {
      const luminance = (value) => {
        const matched = value.match(/[0-9.]+/g)
        if (!matched || matched.length < 3) return 0
        const channels = matched.slice(0, 3).map(Number).map((channel) => {
          const normalized = channel / 255
          return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4
        })
        return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
      }
      const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a)
      return Number(((values[0] + 0.05) / (values[1] + 0.05)).toFixed(2))
    }
  }`)
  assert.equal(themeProbe.length, 12, 'The application currently defines twelve selectable visual themes')
  assert.ok(themeProbe.every((result) => result.valid), `Every theme should render themed head and data cells: ${JSON.stringify(themeProbe)}`)
  assert.equal(new Set(themeProbe.map((result) => result.headBackground)).size, 12, 'Each selectable theme should retain its own head palette')
  assert.ok(themeProbe.every((result) => result.headContrast >= 4.5 && result.cellContrast >= 4.5), `Theme text should retain 4.5:1 contrast: ${JSON.stringify(themeProbe)}`)

  const reposition = await evaluate(`async () => {
    const target = document.querySelector('.statblock [data-help="armor-class"]')
    target.dispatchEvent(new PointerEvent('pointerover', { bubbles: true, pointerType: 'mouse' }))
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    const tip = document.querySelector('#statblock-help-tip')
    const initial = { top: tip.style.top, left: tip.style.left }
    target.style.transform = 'translateY(32px)'
    document.dispatchEvent(new Event('scroll', { bubbles: true }))
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    const afterScroll = tip.style.top
    target.style.transform = 'translateX(24px)'
    window.dispatchEvent(new Event('resize'))
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    const afterResize = tip.style.left
    target.style.removeProperty('transform')
    return { initial, afterScroll, afterResize }
  }`)
  assert.notEqual(reposition.afterScroll, reposition.initial.top, 'Scroll should reposition an open tooltip with its target')
  assert.notEqual(reposition.afterResize, reposition.initial.left, 'Resize should reposition an open tooltip with its target')

  await evaluate(`() => {
    const target = document.querySelector('.statblock [data-help="armor-class"]')
    target.dispatchEvent(new PointerEvent('pointerover', { bubbles: true, pointerType: 'mouse' }))
  }`)
  const hover = await evaluate(`() => {
    const tip = document.querySelector('#statblock-help-tip')
    const target = document.querySelector('.statblock [data-help="armor-class"]')
    const rect = tip?.getBoundingClientRect()
    return { text: tip?.textContent, described: target?.getAttribute('aria-describedby'), visible: target?.dataset.helpVisible, inside: Boolean(rect && rect.left >= 0 && rect.top >= 0 && rect.right <= innerWidth && rect.bottom <= innerHeight) }
  }`)
  assert.match(hover.text || '', /Armor Class/)
  assert.match(hover.text || '', /Shown here:/)
  assert.equal(hover.described, 'statblock-help-tip')
  assert.equal(hover.visible, 'true')
  assert.equal(hover.inside, true, 'Tooltip should be clamped to viewport')

  await evaluate(`() => {
    const target = document.querySelector('.statblock [data-help="armor-class"]')
    target.focus()
    document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
  }`)
  const afterEscape = await evaluate(`() => ({ tip: Boolean(document.querySelector('#statblock-help-tip')), described: document.querySelector('.statblock [data-help="armor-class"]')?.hasAttribute('aria-describedby') })`)
  assert.deepEqual(afterEscape, { tip: false, described: false }, 'Escape should dismiss the tooltip and its ARIA reference')

  const keyboardFocus = await evaluate(`() => {
    const target = document.querySelector('.statblock [data-help="armor-class"]')
    target.focus()
    return document.activeElement === target
  }`)
  assert.equal(keyboardFocus, true, 'The help head should be keyboard focusable')
  await evaluate(`() => {
    const target = document.querySelector('.statblock [data-help="armor-class"]')
    target.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
  }`)
  const focusHelp = await evaluate(`() => ({ tip: Boolean(document.querySelector('#statblock-help-tip')), described: document.querySelector('.statblock [data-help="armor-class"]')?.getAttribute('aria-describedby') })`)
  assert.deepEqual(focusHelp, { tip: true, described: 'statblock-help-tip' }, 'Focus should expose a programmatic description')
  await evaluate(`() => {
    const target = document.querySelector('.statblock [data-help="armor-class"]')
    target.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: document.body }))
    target.dispatchEvent(new PointerEvent('pointerover', { bubbles: true, pointerType: 'mouse' }))
    target.remove()
  }`)
  const afterDetach = await evaluate(`async () => {
    await new Promise((resolve) => setTimeout(resolve, 50))
    return !document.querySelector('.statblock-help-tip')
  }`)
  assert.equal(afterDetach, true, 'Detaching the active target should clear its tooltip and ARIA state')
  console.log('Statblock UI smoke passed: shared row grammar, 12 theme contrast probes, hover/focus help, viewport repositioning, Escape, detached-target cleanup')
} finally {
  ws?.close()
  chrome.kill()
  await new Promise((resolve) => chrome.once('close', resolve))
  try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }) } catch { /* Windows may retain a transient Chrome profile lock. */ }
}

function delay(ms) { return new Promise((resolve) => setTimeout(resolve, ms)) }
function waitForTargets() {
  return new Promise((resolve, reject) => {
    const start = Date.now()
    const poll = () => http.get(`http://127.0.0.1:${port}/json`, (response) => {
      let data = ''
      response.setEncoding('utf8')
      response.on('data', (chunk) => { data += chunk })
      response.on('end', () => {
        try { resolve(JSON.parse(data)) } catch (error) { reject(error) }
      })
    }).on('error', (error) => {
      if (Date.now() - start > 15000) reject(error)
      else setTimeout(poll, 100)
    })
    poll()
  })
}
