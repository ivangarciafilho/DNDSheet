// Visual regression (C6): renders fixtures × themes × layouts in two builds and compares the stat block screenshots byte for byte.
// Same machine, same Chrome, same fonts: a refactor that changes nothing produces identical PNG bytes.
// Usage: node --experimental-strip-types tools/qa/visual-diff.mjs <baselineUrl> <candidateUrl> <outDir> [port]
import { spawn } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const root = process.cwd()
const { migrateMonsterSchema } = await import(pathToFileURL(path.join(root, 'src/core/usecases/MigrateMonsterSchema.ts')).href)
const [baseUrl, candUrl, outDir, portArg = '9261'] = process.argv.slice(2)
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const sleep = ms => new Promise(r => setTimeout(r, ms))
const FIXTURES = ['seraph', 'full', 'legacy-actions', 'seraph+dynamics']
// Encounter-dynamics sections render only when these collections exist, which no shared fixture has.
const DYNAMICS = {
  villainActions: [1, 2, 3].map(round => ({ id: 'va' + round, round, name: 'Gambit ' + round, description: 'Each creature within 30 feet must succeed on a DC 15 Wisdom saving throw.' })),
  bloodiedActions: [{ id: 'ba1', name: 'Last Stand', triggerType: 'while_bloodied', description: 'The seraph regains 10 hit points.' }],
  reactiveActions: [{ id: 'ra1', name: 'Riposte', trigger: 'A creature misses it with a melee attack', description: 'It makes one weapon attack.' }],
  comboActions: [{ id: 'ca1', name: 'Smite Chain', leadAction: 'Strike', followUpAction: 'Smite', condition: 'Strike hits', description: 'The target is blinded until the end of its next turn.' }],
  anatomyParts: [{ id: 'ap1', name: 'Wings', hp: 30, ac: 16, breakEffect: 'Its flying speed becomes 0.' }],
  runehammerTrack: { enabled: true, timerDie: 'd4', events: [{ id: 'ev1', round: 1, name: 'Radiance', description: 'Bright light fills the arena.' }] },
}
const THEMES = ['wotc', 'printer', 'lovecraft_golden', 'lovecraft_silver', 'lovecraft_toxic', 'lovecraft_spooky', 'lovecraft_galactic', 'lovecraft_fathomless', 'dwarves_forge', 'dwarves_aetherpunk', 'art_nouveau', 'art_deco']
const LAYOUTS = [{ template: 'modern', style: '2024' }, { template: 'classic', style: '2014' }]
fs.mkdirSync(outDir, { recursive: true })

// VDIFF_CONTROL=1 nudges the candidate by 1px so a run can prove the comparison detects change.
async function capture(url, port, control = false) {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'vdiff-'))
  const chrome = spawn(CHROME, [`--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars', '--force-device-scale-factor=1', '--window-size=1500,1400', 'about:blank'])
  const shots = new Map(); const errors = []
  try {
    let target
    for (let i = 0; i < 100 && !target; i++) { await sleep(400); try { target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find(t => t.type === 'page') } catch {} }
    if (!target) throw new Error('Chrome CDP /json page target missing on port ' + port + ' for ' + url)
    const ws = new WebSocket(target.webSocketDebuggerUrl)
    await new Promise(r => ws.addEventListener('open', r, { once: true }))
    let id = 0; const pending = new Map()
    ws.addEventListener('message', ev => { const m = JSON.parse(String(ev.data)); if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id) } })
    const cdp = (method, params = {}) => new Promise(r => { const n = ++id; pending.set(n, r); ws.send(JSON.stringify({ id: n, method, params })) })
    const evaluate = async expr => { const r = await cdp('Runtime.evaluate', { expression: `(${expr})()`, awaitPromise: true, returnByValue: true }); if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 400)); return r.result?.result?.value }
    await cdp('Runtime.enable'); await cdp('Page.enable'); await cdp('Page.navigate', { url })
    // no caret blink, no transitions: screenshots must be stable
    const freeze = `()=>{if(!document.getElementById('vdiff-freeze')){const s=document.createElement('style');s.id='vdiff-freeze';s.textContent='*,*::before,*::after{transition:none!important;animation:none!important;caret-color:transparent!important}'+(CONTROL?'#render .statblock{padding-left:1px!important}':'');document.head.appendChild(s)}}`.replace('CONTROL', String(control))
    const ready = async () => {
      let ok = false
      for (let i = 0; i < 200; i++) {
        if (await evaluate('()=>location.protocol.startsWith("http")&&!!document.querySelector("#render .statblock")')) { ok = true; break }
        await sleep(150)
      }
      if (!ok) {
        const href = await evaluate('()=>location.href').catch(() => 'unknown')
        throw new Error(`Timed out waiting for ready statblock at ${url} (href=${href}, errors=${JSON.stringify(errors)})`)
      }
      await evaluate('async()=>{const d=document.querySelector(".q-dialog");if(d&&d.textContent.includes("Changelog")){([...d.querySelectorAll("button")].find(b=>b.textContent.includes("Done"))||d.querySelector("button"))?.click();await new Promise(r=>setTimeout(r,400))}}')
      await evaluate(freeze)
      await evaluate('async()=>{await document.fonts.ready}')
      await sleep(400)
    }
    await ready()
    for (const fx of FIXTURES) {
      const monster = migrateMonsterSchema(JSON.parse(fs.readFileSync(path.join(root, `test/fixtures/monsters/${fx.split('+')[0]}.json`), 'utf8')))
      if (fx.endsWith('+dynamics')) Object.assign(monster, structuredClone(DYNAMICS))
      await evaluate(`()=>{localStorage.setItem('app.monster',${JSON.stringify(JSON.stringify(monster))})}`)
      await cdp('Page.reload', { ignoreCache: true }); await sleep(800); await ready()
      for (const lay of LAYOUTS) for (const theme of THEMES) {
        const box = await evaluate(`async()=>{const pinia=document.querySelector('#q-app').__vue_app__.config.globalProperties.$pinia,editor=pinia._s.get('editor');editor.visualTemplate='${lay.template}';editor.style='${lay.style}';editor.visualTheme='${theme}';await new Promise(r=>setTimeout(r,450));await document.fonts.ready;const el=document.querySelector('#render .statblock');el.scrollIntoView();await new Promise(r=>setTimeout(r,150));const r=el.getBoundingClientRect();return {x:Math.round(r.left+window.scrollX),y:Math.round(r.top+window.scrollY),w:Math.round(r.width),h:Math.round(r.height)}}`)
        const shot = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: box.x, y: box.y, width: box.w, height: box.h, scale: 1 } })
        shots.set(`${fx}-${lay.template}-${lay.style}-${theme}`, Buffer.from(shot.result.data, 'base64'))
      }
      // Editor chrome around the sheet: the A4 toolbar in both preview states.
      for (const a4 of [false, true]) {
        const tb = await evaluate(`async()=>{const pinia=document.querySelector('#q-app').__vue_app__.config.globalProperties.$pinia,editor=pinia._s.get('editor');editor.a4PreviewMode=${a4};await new Promise(r=>setTimeout(r,600));const el=document.querySelector('.a4-preview-toolbar');if(!el)return null;el.scrollIntoView();await new Promise(r=>setTimeout(r,150));const r=el.getBoundingClientRect();return {x:Math.round(r.left+window.scrollX),y:Math.round(r.top+window.scrollY),w:Math.round(r.width),h:Math.round(r.height)}}`)
        if (tb) { const shot = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: tb.x, y: tb.y, width: tb.w, height: tb.h, scale: 1 } }); shots.set(`${fx}-toolbar-a4-${a4}`, Buffer.from(shot.result.data, 'base64')) }
        await evaluate("async()=>{const pinia=document.querySelector('#q-app').__vue_app__.config.globalProperties.$pinia;pinia._s.get('editor').a4PreviewMode=false;await new Promise(r=>setTimeout(r,400))}")
      }
    }
    ws.close()
  } finally { chrome.kill(); await sleep(400); try { fs.rmSync(profile, { recursive: true, force: true }) } catch {} }
  return { shots, errors }
}

const sha = b => crypto.createHash('sha256').update(b).digest('hex').slice(0, 16)
const base = await capture(baseUrl, Number(portArg))
const cand = await capture(candUrl, Number(portArg) + 1, process.env.VDIFF_CONTROL === '1')
const diffs = []
for (const [key, a] of base.shots) {
  const b = cand.shots.get(key)
  if (!b || sha(a) !== sha(b)) { diffs.push(key); fs.writeFileSync(path.join(outDir, `${key}.base.png`), a); if (b) fs.writeFileSync(path.join(outDir, `${key}.cand.png`), b) }
}
const summary = { compared: base.shots.size, identical: base.shots.size - diffs.length, diffs, baselineErrors: base.errors, candidateErrors: cand.errors }
fs.writeFileSync(path.join(outDir, 'summary.json'), JSON.stringify(summary, null, 2))
console.log(JSON.stringify(summary))
// An intended presentation change is accepted only with a stated reason, which the summary records.
const accepted = process.env.DNDSHEET_VISUAL_ACCEPT
if (accepted && diffs.length) { console.log('ACCEPTED visual change (' + diffs.length + ' shots): ' + accepted); fs.writeFileSync(path.join(outDir, 'accepted.txt'), accepted) }
process.exit((diffs.length && !accepted) || cand.errors.length ? 1 : 0)
