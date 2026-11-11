import assert from 'node:assert/strict'
import { findChrome } from '../tools/qa/chrome.mjs'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import http from 'node:http'
import os from 'node:os'
import path from 'node:path'

const CHROME_PATH = findChrome()
const CHROME_PORT = 9225
const APP_URL = process.env.DNDSHEET_E2E_URL || 'http://localhost:8080/#/'
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'dn-sheet-spell-'))
const chrome = spawn(CHROME_PATH, [
  `--remote-debugging-port=${CHROME_PORT}`,
  `--user-data-dir=${profile}`,
  '--headless=new',
  '--disable-gpu',
  '--no-sandbox',
  '--disable-extensions',
  APP_URL,
])
const chromeExited = new Promise((resolve) => chrome.once('close', resolve))

let ws

try {
  const targets = await waitForPageTarget()
  const pageTarget = targets.find((target) => target.type === 'page')
  assert.ok(pageTarget, 'Chrome did not expose a page target')

  ws = new WebSocket(pageTarget.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Chrome DevTools websocket timed out')), 5000)
    ws.addEventListener('open', () => { clearTimeout(timeout); resolve() }, { once: true })
    ws.addEventListener('error', reject, { once: true })
  })

  let nextId = 1
  const pending = new Map()
  ws.addEventListener('message', (event) => {
    const message = JSON.parse(event.data)
    if (!message.id || !pending.has(message.id)) return
    pending.get(message.id)(message)
    pending.delete(message.id)
  })

  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = nextId++
    pending.set(id, (message) => message.error ? reject(new Error(message.error.message)) : resolve(message))
    ws.send(JSON.stringify({ id, method, params }))
  })

  const evaluate = async (expression) => {
    const response = await send('Runtime.evaluate', {
      expression: `(${expression})()`,
      awaitPromise: true,
      returnByValue: true,
    })
    if (response.result?.exceptionDetails) {
      throw new Error(response.result.exceptionDetails.text || response.result.exceptionDetails.exception?.description)
    }
    return response.result?.result?.value
  }

  await send('Runtime.enable')
  await send('Page.enable')

  let appReady = false
  for (let attempt = 0; attempt < 60; attempt++) {
    appReady = await evaluate(`() => {
      const root = document.querySelector('#q-app')
      const pinia = root?.__vue_app__?.config.globalProperties.$pinia
      return Boolean(pinia?._s.get('monster') && pinia._s.get('spells'))
    }`)
    if (appReady) break
    await delay(250)
  }
  assert.equal(appReady, true, 'The app and its spell store did not mount')

  let initialRenderReady = false
  for (let attempt = 0; attempt < 60; attempt++) {
    initialRenderReady = await evaluate('() => Boolean(document.querySelector("#render .statblock .monster-name"))')
    if (initialRenderReady) break
    await delay(250)
  }
  assert.equal(initialRenderReady, true, 'The statblock preview did not finish its initial render')

  const fixtureResult = await evaluate(`() => {
    const root = document.querySelector('#q-app')
    const pinia = root.__vue_app__.config.globalProperties.$pinia
    const monster = pinia._s.get('monster')
    const spells = pinia._s.get('spells')
    const editor = pinia._s.get('editor')
    const ids = ['Fire Bolt', 'Magic Missile', 'Fireball']
    const missing = ids.filter((id) => !spells.allSpells[id] || spells.allSpells[id].name !== id)
    if (missing.length) throw new Error('Fixture spells missing: ' + missing.join(', '))

    monster.name = 'Spell Plate Browser Fixture'
    monster.CR = 12
    monster.stats.INT = 18
    monster.spellcasting.class = 'Wizard'
    monster.spellcasting.level = 9
    monster.spellcasting.slots = [4, 3, 3, 3, 1, 0, 0, 0, 0]
    monster.spellcasting.standard = ids
    monster.spellcasting.atWill = [
      { rate: 'AT_WILL', count: 0, spells: ['Fire Bolt'] },
      { rate: 'DAY', count: 3, spells: ['Fireball'] },
    ]
    monster.spellcasting.resourceType = 'slots'
    monster.spellcasting.refreshRate = 'long_rest'
    monster.spellcasting.preparedCountOverride = 2
    monster.spellcasting.preparedInterval = 'long_rest'
    monster.spellcasting.levelCadenceMap = { 3: '1_day' }
    monster.spellcasting.levelAmountMap = { 3: 1 }
    monster.spellcasting.spellCadenceMap = { Fireball: '1_day' }
    monster.spellcasting.metamagic = {
      enabled: true,
      sorceryPoints: 9,
      refreshRate: 'long_rest',
      options: ['Heightened Spell', 'Seeking Spell', 'Twinned Spell'],
    }
    editor.style = '2024'
    editor.visualTheme = 'wotc'
    return { spellIds: ids, level: monster.spellcasting.level }
  }`)
  assert.deepEqual(fixtureResult.spellIds, ['Fire Bolt', 'Magic Missile', 'Fireball'])

  let plateReady = false
  for (let attempt = 0; attempt < 40; attempt++) {
    plateReady = await evaluate('() => Boolean(document.querySelector(".class-spellcasting.sb-plate"))')
    if (plateReady) break
    await delay(100)
  }
  assert.equal(plateReady, true, 'The spellcasting fixture did not render a class spell plate')
  const themes = ['wotc', 'printer', 'lovecraft_golden', 'lovecraft_spooky', 'art_nouveau']
  const result = await evaluate(`async () => {
    const root = document.querySelector('#q-app')
    const pinia = root.__vue_app__.config.globalProperties.$pinia
    const editor = pinia._s.get('editor')
    const checks = []
    for (const theme of ${JSON.stringify(themes)}) {
      editor.visualTheme = theme
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      const statblock = document.querySelector('#render .statblock')
      const plate = document.querySelector('.class-spellcasting.sb-plate')
      const innatePlate = document.querySelector('.innate-spellcasting.sb-plate')
      const text = plate?.innerText || ''
      const innateText = innatePlate?.innerText || ''
      checks.push({
        theme,
        themeApplied: Boolean(statblock?.classList.contains('theme-' + theme)),
        plateVisible: Boolean(plate),
        innatePlateVisible: Boolean(innatePlate),
        innateText,
        text,
        colors: plate ? {
          background: getComputedStyle(plate).backgroundColor,
          border: getComputedStyle(plate).borderTopColor,
        } : null,
        spellTags: [...(plate?.querySelectorAll('.spell-tag-badge') || [])].map((tag) => ({
          text: tag.textContent,
          before: getComputedStyle(tag, '::before').content,
          after: getComputedStyle(tag, '::after').content,
        })),
      })
    }
    return checks
  }`)

  assert.equal(result.length, themes.length)
  console.log('Spell plate theme probes:', result.map(({ theme, themeApplied, plateVisible }) => ({ theme, themeApplied, plateVisible })))
  for (const check of result) {
    assert.equal(check.themeApplied, true, `${check.theme}: theme class did not apply`)
    assert.equal(check.plateVisible, true, `${check.theme}: class spell plate did not render`)
    assert.equal(check.innatePlateVisible, true, `${check.theme}: innate spell plate did not render`)
    assert.match(check.innateText, /Innate Spellcasting[\s\S]*At Will[\s\S]*Fire Bolt[\s\S]*3\/Day[\s\S]*Fireball/)
    assert.match(check.text, /9th Level Spellcaster/)
    assert.doesNotMatch(check.text, /Wizard/i, 'class names belong in the editor')
    assert.match(check.text, /Cantrips[\s\S]*Fire Bolt/)
    assert.match(check.text, /\(4\/Long Rest\), Level 1:\s*Magic Missile/)
    assert.match(check.text, /\(1\/Day\), Level 3:\s*Fireball/)
    assert.doesNotMatch(check.text, /\(3\/1\/Day\)/, 'a counted cadence must not be prefixed with the slot count')
    assert.match(check.text, /You have 14 spell slots through 5th level, regained on Long Rests/)
    assert.match(check.text, /Can prepare 2 spells per Long Rest/)
    assert.match(check.text, /9 Sorcery Points, regained on Long Rest/i)
    assert.match(check.text, /2:\s*Give one target disadvantage on saves against the spell\./)
    assert.match(check.text, /1:\s*Increase the spell’s effective level by one\./)
    assert.doesNotMatch(check.text, /Daily|\bx points\b|Level3|\(\(V, S|is a 9th-level spellcaster|has the following Wizard spells prepared/i)
    assert.ok(check.spellTags.some((tag) => tag.text.trim() === '(V, S, M)'))
    assert.ok(check.spellTags.every((tag) => ['none', 'normal'].includes(tag.before) && ['none', 'normal'].includes(tag.after)))
    assert.ok(check.colors?.background && check.colors.background !== 'rgba(0, 0, 0, 0)')
    assert.ok(check.colors?.border)
  }

  assert.equal(new Set(result.map((check) => check.colors?.background)).size, themes.length, 'Theme backgrounds should remain distinct across the spell plate')

  // A12.10 b: a slot edit updates the plate live; c: Hidden and counted cadences survive a reload.
  const plateText = () => evaluate('() => document.querySelector(".class-spellcasting.sb-plate")?.innerText || ""')
  await evaluate(`async () => {
    const monster = document.querySelector('#q-app').__vue_app__.config.globalProperties.$pinia._s.get('monster')
    monster.spellcasting.slots = [2, 3, 3, 3, 1, 0, 0, 0, 0]
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  }`)
  const liveText = await plateText()
  assert.match(liveText, /\(2\/Long Rest\), Level 1:\s*Magic Missile/, 'a slot edit should update the plate without reload')
  await evaluate(`async () => {
    const monster = document.querySelector('#q-app').__vue_app__.config.globalProperties.$pinia._s.get('monster')
    monster.spellcasting.levelCadenceMap = { 1: 'hidden', 3: '1_day' }
    monster.spellcasting.subclass = 'Evocation'
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  }`)
  assert.match(await plateText(), /\(2\), Level 1:\s*Magic Missile/, 'Hidden keeps only the slot count')
  let persisted = false
  for (let attempt = 0; attempt < 50 && !persisted; attempt++) {
    persisted = await evaluate('() => { const raw = localStorage.getItem("app.monster") || ""; return raw.includes("hidden") && raw.includes("1_day") && raw.includes("[2,3,3,3,1") }')
    if (!persisted) await delay(200)
  }
  assert.equal(persisted, true, 'the edited spellcasting should reach storage before reload')
  await send('Page.reload', { ignoreCache: false })
  let reloaded = ''
  for (let attempt = 0; attempt < 80 && !/Level 3:/.test(reloaded); attempt++) {
    await delay(250)
    reloaded = await plateText().catch(() => '')
  }
  assert.match(reloaded, /\(2\), Level 1:\s*Magic Missile/, 'Hidden cadence should survive reload')
  assert.match(reloaded, /\(1\/Day\), Level 3:\s*Fireball/, 'a counted cadence should survive reload')
  assert.doesNotMatch(reloaded, /\(2\/1\/Day\)|\(3\/1\/Day\)/, 'reload must not re-prefix the counted cadence')
  const subclassAfterReload = await evaluate('() => document.querySelector("#q-app").__vue_app__.config.globalProperties.$pinia._s.get("monster").spellcasting.subclass')
  assert.equal(subclassAfterReload, 'Evocation', 'A12.3: the primary subclass should persist across reload')
  console.log('Spell plate live edit and reload: pass')

  console.log(`Spell plate browser smoke passed across ${result.length} themes: ${themes.join(', ')}`)
} finally {
  ws?.close()
  chrome.kill()
  await Promise.race([chromeExited, delay(2000)])
  try {
    fs.rmSync(profile, { recursive: true, force: true })
  } catch {
    // Chrome may keep profile files locked briefly after its process exits.
  }
}

async function waitForPageTarget() {
  for (let attempt = 0; attempt < 40; attempt++) {
    const targets = await new Promise((resolve) => {
      http.get(`http://127.0.0.1:${CHROME_PORT}/json`, (response) => {
        let body = ''
        response.on('data', (part) => { body += part })
        response.on('end', () => resolve(JSON.parse(body)))
      }).on('error', () => resolve(null))
    })
    if (Array.isArray(targets) && targets.some((target) => target.type === 'page')) return targets
    await delay(250)
  }
  throw new Error(`Chrome DevTools did not start on port ${CHROME_PORT}`)
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
