import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import http from 'node:http'
import os from 'node:os'
import path from 'node:path'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
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
    initialRenderReady = await evaluate('() => Boolean(document.querySelector(".statblock .monster-name"))')
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
      const statblock = document.querySelector('.statblock')
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
    assert.match(check.text, /9th Level Wizard/)
    assert.match(check.text, /Cantrips[\s\S]*Fire Bolt/)
    assert.match(check.text, /1st[\s\S]*Level[\s\S]*4[\s\S]*Magic Missile/)
    assert.match(check.text, /3rd[\s\S]*Level[\s\S]*3[\s\S]*1\/Day[\s\S]*Fireball/)
    assert.match(check.text, /14 Spell Slots through 5th level · regained on Long Rest/)
    assert.match(check.text, /2 prepared Wizard spells · Long Rest/)
    assert.match(check.text, /Heightened Spell: Give one target disadvantage on saves against the spell\./)
    assert.match(check.text, /Twinned Spell: Increase the spell’s effective level by one\./)
    assert.match(check.text, /Cost 2 SP/)
    assert.match(check.text, /Cost 1 SP/)
    assert.doesNotMatch(check.text, /Daily|\bx points\b|Level3|\(\(V, S|is a 9th-level spellcaster|has the following Wizard spells prepared/i)
    assert.ok(check.spellTags.some((tag) => tag.text === '(V, S, M)'))
    assert.ok(check.spellTags.every((tag) => ['none', 'normal'].includes(tag.before) && ['none', 'normal'].includes(tag.after)))
    assert.ok(check.colors?.background && check.colors.background !== 'rgba(0, 0, 0, 0)')
    assert.ok(check.colors?.border)
  }

  assert.equal(new Set(result.map((check) => check.colors?.background)).size, themes.length, 'Theme backgrounds should remain distinct across the spell plate')

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
