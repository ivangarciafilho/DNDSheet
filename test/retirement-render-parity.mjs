// Two-build render parity for saved monsters (A8.6). Each build runs in a fresh headless profile. Every fixture is
// written to localStorage('app.monster') and the page reloaded — the real hydration path — then the live sheet is read
// in 2014/2024 × modern/classic. A projection must not mutate the model, a second reload must round-trip it, dangling
// references must match across builds, and both builds' plates must be byte-identical.
// Usage: node --experimental-strip-types test/retirement-render-parity.mjs <beforeUrl> <afterUrl>
//   DNDSHEET_PARITY_EXTRA=<file>  also replays one saved `app.monster` value byte-exact (e.g. an evaluator's monster).
import { migrateMonsterSchema } from '../src/core/usecases/MigrateMonsterSchema.ts'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const CHROME_PORTS = [9227, 9228]
const [beforeUrl, afterUrl] = process.argv.slice(2)
if (!beforeUrl || !afterUrl) {
  console.error('usage: node --experimental-strip-types test/retirement-render-parity.mjs <beforeUrl> <afterUrl>')
  process.exit(2)
}
const read = (relative) => fs.readFileSync(new URL(relative, import.meta.url), 'utf8')
const migrated = (relative) => migrateMonsterSchema(JSON.parse(read(relative)))

// Edge witness: dual-role membership, a dangling member with extension metadata, phase policy, custom heading,
// manual CR and custom multiattack prose — the saved-data shapes a retirement must not disturb.
const edge = migrated('./fixtures/a7-preservation-v8.json')
edge.name = 'A8.6 Edge Witness'
const mythicId = edge.mythicActions.actions[0]?.actionId
if (!mythicId) throw new Error('edge witness needs a mythic member')
if (!edge.legendaryActions.actions.some((member) => member.actionId === mythicId)) edge.legendaryActions.actions.push({ actionId: mythicId, cost: 2 })
edge.legendaryActions.actions.push({ actionId: 'parity-missing-source', cost: 3, extension: 'keep' })
edge.actions[0].stagePool = 1
edge.actions[1].customPreamble = true
Object.assign(edge.actions[0].crAnnotation, { automatic: false, maxDamage: 28, maxSave: 17 })
Object.assign(edge.multiattackOptions, { useCustomRenderer: true, customMultiattackRenderer: '{NAME} makes two custom strikes.' })

const fixtures = [
  ...(process.env.DNDSHEET_PARITY_EXTRA ? [{ label: `saved value ${path.basename(process.env.DNDSHEET_PARITY_EXTRA)}`, raw: fs.readFileSync(process.env.DNDSHEET_PARITY_EXTRA, 'utf8') }] : []),
  { label: 'A7 Preservation Witness', raw: JSON.stringify(migrated('./fixtures/a7-preservation-v8.json')) },
  { label: 'A8.6 Edge Witness', raw: JSON.stringify(edge) },
  ...['Knight', 'Archmage', 'Ancient Green Dragon'].map((name) => ({ label: name, raw: JSON.stringify(migrated(`../src/data/templates/monsters/${name}.5emm.json`)) })),
]

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function project(url, port) {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'dn-sheet-parity-'))
  const chrome = spawn(CHROME_PATH, [`--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--headless=new', '--disable-gpu', '--no-sandbox', '--disable-extensions', url])
  try {
    let target
    for (let attempt = 0; attempt < 30 && !target; attempt++) {
      await sleep(400)
      try { target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((entry) => entry.type === 'page') } catch { /* Chrome still starting */ }
    }
    if (!target) throw new Error(`no Chrome page target on port ${port}`)
    const ws = new WebSocket(target.webSocketDebuggerUrl)
    await new Promise((resolve) => ws.addEventListener('open', resolve, { once: true }))
    let nextId = 0
    const pending = new Map()
    const errors = []
    ws.addEventListener('message', (event) => {
      const message = JSON.parse(String(event.data))
      if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text)
      if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') errors.push(message.params.args.map((arg) => arg.value ?? arg.description).join(' '))
      if (message.id && pending.has(message.id)) { pending.get(message.id)(message); pending.delete(message.id) }
    })
    const cdp = (method, params = {}) => new Promise((resolve) => { const id = ++nextId; pending.set(id, resolve); ws.send(JSON.stringify({ id, method, params })) })
    const evaluate = async (expression) => {
      const response = await cdp('Runtime.evaluate', { expression: `(${expression})()`, awaitPromise: true, returnByValue: true })
      if (response.result?.exceptionDetails) throw new Error('page evaluation failed: ' + JSON.stringify(response.result.exceptionDetails).slice(0, 600))
      return response.result?.result?.value
    }
    const ready = async () => {
      for (let attempt = 0; attempt < 80; attempt++) {
        if (await evaluate('()=>!!(document.querySelector("#q-app")?.__vue_app__&&document.querySelector("#render .statblock"))')) break
        await sleep(150)
      }
      await evaluate('async()=>{const dialog=document.querySelector(".q-dialog");if(dialog&&dialog.textContent.includes("Changelog")){([...dialog.querySelectorAll("button")].find(b=>b.textContent.includes("Done"))||dialog.querySelector("button"))?.click();for(let i=0;i<30&&document.querySelector(".q-dialog");i++)await new Promise(r=>setTimeout(r,50));}}')
      await sleep(500)
    }
    const reload = async () => { await cdp('Page.reload', { ignoreCache: true }); await sleep(800); await ready() }
    await cdp('Runtime.enable')
    await cdp('Page.enable')
    await ready()
    const results = []
    for (const fixture of fixtures) {
      await evaluate(`()=>{localStorage.setItem('app.monster',${JSON.stringify(fixture.raw)})}`)
      await reload()
      const view = await evaluate(`async()=>{
        const pinia=document.querySelector('#q-app').__vue_app__.config.globalProperties.$pinia,monster=pinia._s.get('monster'),editor=pinia._s.get('editor');
        const wait=ms=>new Promise(r=>setTimeout(r,ms)),state=()=>JSON.stringify(monster.$state),before=state(),original={style:editor.style,template:editor.visualTemplate},views=[];
        for(const style of ['2014','2024'])for(const template of ['modern','classic']){editor.style=style;editor.visualTemplate=template;await wait(250);views.push({style,template,html:document.querySelector('#render .statblock').outerHTML});}
        editor.style=original.style;editor.visualTemplate=original.template;await wait(250);
        const sources=new Set([...monster.actions,...monster.attacks].map(source=>source.id));
        const references=[...monster.legendaryActions.actions.map(m=>'legendary:'+m.actionId),...monster.mythicActions.actions.map(m=>'mythic:'+m.actionId),...monster.multiattacks.flatMap(group=>[...(group.attacks||[]),...(group.actions||[])].map(id=>'multiattack:'+id))];
        return {views,unchanged:before===state(),state:state(),dangling:references.filter(reference=>!sources.has(reference.slice(reference.indexOf(':')+1))),current:document.querySelector('#render .statblock').outerHTML};
      }`)
      await reload()
      const again = await evaluate('()=>({state:JSON.stringify(document.querySelector("#q-app").__vue_app__.config.globalProperties.$pinia._s.get("monster").$state),current:document.querySelector("#render .statblock").outerHTML})')
      results.push({ label: fixture.label, views: view.views, unchanged: view.unchanged, dangling: view.dangling, roundTrip: again.state === view.state, stableRender: again.current === view.current })
    }
    ws.close()
    return { results, errors }
  } finally {
    chrome.kill()
    await sleep(300)
    try { fs.rmSync(profile, { recursive: true, force: true }) } catch { /* Chrome may still hold the profile briefly */ }
  }
}

const before = await project(beforeUrl, CHROME_PORTS[0])
const after = await project(afterUrl, CHROME_PORTS[1])
const problems = []
before.results.forEach((old, index) => {
  const next = after.results[index]
  for (const run of [old, next]) {
    if (!run.unchanged) problems.push(`${run.label}: projection mutated the model`)
    if (!run.roundTrip) problems.push(`${run.label}: reload round trip changed the model`)
    if (!run.stableRender) problems.push(`${run.label}: render changed after reload`)
  }
  old.views.forEach((view, at) => { if (view.html !== next.views[at].html) problems.push(`${old.label} ${view.style}/${view.template}: plate differs`) })
  if (JSON.stringify(old.dangling) !== JSON.stringify(next.dangling)) problems.push(`${old.label}: dangling references differ ${JSON.stringify(old.dangling)} -> ${JSON.stringify(next.dangling)}`)
})
for (const error of [...before.errors, ...after.errors]) problems.push(`browser error: ${error}`)
const plates = after.results.reduce((total, result) => total + result.views.length, 0)
if (problems.length) {
  console.error(`FAIL render parity\n${problems.join('\n')}`)
  process.exit(1)
}
console.log(`PASS ${after.results.length} saved monsters / ${plates} byte-identical plates; reload round trips stable; dangling references unchanged (${after.results.flatMap((result) => result.dangling).join(', ') || 'none'}); 0 browser errors`)
