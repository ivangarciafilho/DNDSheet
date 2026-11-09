// Read-only visual probe: renders one fixture in a fresh headless profile and captures the top of the live sheet
// for several template/style/theme combinations. Usage: node --experimental-strip-types tools/qa/shots.mjs <url> <outDir> <prefix> [port]
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

// Run from the repository root; the fixture and migration come from this checkout, not a fixed drive path.
const root = process.cwd()
const { migrateMonsterSchema } = await import(pathToFileURL(path.join(root, 'src/core/usecases/MigrateMonsterSchema.ts')).href)

const [url, outDir, prefix, portArg = '9251'] = process.argv.slice(2)
const port = Number(portArg)
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const sleep = ms => new Promise(r => setTimeout(r, ms))
const fixture = migrateMonsterSchema(JSON.parse(fs.readFileSync(path.join(root, 'test/fixtures/a7-preservation-v8.json'), 'utf8')))
fixture.senses = { ...fixture.senses, darkvision: 120, truesight: 30 }
fixture.languages = 'Celestial, Common, telepathy 120 ft.'
fixture.initiativeConfig = { ...(fixture.initiativeConfig || {}), advantage: true }
const configs = [
  { template: 'modern', style: '2024', theme: 'wotc' },
  { template: 'classic', style: '2014', theme: 'wotc' },
  { template: 'classic', style: '2024', theme: 'printer' },
  { template: 'modern', style: '2014', theme: 'lovecraft_golden' },
]
fs.mkdirSync(outDir, { recursive: true })
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'shots-'))
const chrome = spawn(CHROME, [`--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--headless=new', '--disable-gpu', '--no-sandbox', '--window-size=1500,1400', url])
try {
  let target
  for (let i = 0; i < 30 && !target; i++) { await sleep(400); try { target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find(t => t.type === 'page') } catch {} }
  const ws = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise(r => ws.addEventListener('open', r, { once: true }))
  let id = 0; const pending = new Map(); const errors = []
  ws.addEventListener('message', ev => {
    const m = JSON.parse(String(ev.data))
    if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text)
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id) }
  })
  const cdp = (method, params = {}) => new Promise(r => { const n = ++id; pending.set(n, r); ws.send(JSON.stringify({ id: n, method, params })) })
  const evaluate = async expr => { const r = await cdp('Runtime.evaluate', { expression: `(${expr})()`, awaitPromise: true, returnByValue: true }); if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 400)); return r.result?.result?.value }
  await cdp('Runtime.enable'); await cdp('Page.enable')
  const ready = async () => { for (let i = 0; i < 80; i++) { if (await evaluate('()=>!!document.querySelector("#render .statblock")')) break; await sleep(150) } await evaluate('async()=>{const d=document.querySelector(".q-dialog");if(d&&d.textContent.includes("Changelog")){([...d.querySelectorAll("button")].find(b=>b.textContent.includes("Done"))||d.querySelector("button"))?.click();await new Promise(r=>setTimeout(r,400))}}'); await sleep(400) }
  await ready()
  await evaluate(`()=>{localStorage.setItem('app.monster',${JSON.stringify(JSON.stringify(fixture))})}`)
  await cdp('Page.reload', { ignoreCache: true }); await sleep(800); await ready()
  for (const c of configs) {
    const box = await evaluate(`async()=>{const pinia=document.querySelector('#q-app').__vue_app__.config.globalProperties.$pinia,editor=pinia._s.get('editor');editor.visualTemplate='${c.template}';editor.style='${c.style}';editor.visualTheme='${c.theme}';await new Promise(r=>setTimeout(r,500));const el=document.querySelector('#render .statblock');el.scrollIntoView();await new Promise(r=>setTimeout(r,200));const r=el.getBoundingClientRect();return {x:r.left+window.scrollX,y:r.top+window.scrollY,w:r.width,h:Math.min(r.height,640)}}`)
    const shot = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: box.x, y: box.y, width: box.w, height: box.h, scale: 1 } })
    const file = path.join(outDir, `${prefix}-${c.template}-${c.style}-${c.theme}.png`)
    fs.writeFileSync(file, Buffer.from(shot.result.data, 'base64'))
    console.log('wrote', file, JSON.stringify(box))
  }
  console.log('errors', JSON.stringify(errors))
  ws.close()
} finally { chrome.kill(); await sleep(300); try { fs.rmSync(profile, { recursive: true, force: true }) } catch {} }
