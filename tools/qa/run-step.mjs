// Run one fuzz step's page code in a fresh headless Chrome against a served bundle, and print the full result or
// exception. Use it to bisect a failing step without the 2.5-minute full fuzz, or as a mutation control against an
// older bundle. Usage: node tools/qa/run-step.mjs <url> <stepNumber> [fuzzFile] [port]
// Limit: the step runs on a fresh page, so state left by earlier steps is absent; a pass here and a failure in the
// full fuzz means the step depends on earlier state.
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const [url, step, fuzzFile = 'test/exhaustive-ui-fuzz.js', portArg = '9334'] = process.argv.slice(2)
if (!url || !step) { console.error('usage: node tools/qa/run-step.mjs <url> <stepNumber> [fuzzFile] [port]'); process.exit(2) }
const source = fs.readFileSync(fuzzFile, 'utf8')
const marker = source.indexOf(`--- Step ${step}:`)
if (marker < 0) { console.error('no Step ' + step); process.exit(2) }
const open = source.indexOf('evalInPage(`', marker) + 'evalInPage(`'.length
const close = source.indexOf('}`)', open) + 1
// The fuzz writes page code inside a template literal; undo its one level of backslash escaping.
const body = source.slice(open, close).replace(/\\\\/g, '\\')
const port = Number(portArg)
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'run-step-'))
const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--window-size=1600,1200', 'about:blank'])
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
try {
  let targets
  for (let i = 0; i < 50 && !targets; i++) { try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json() } catch { await sleep(200) } }
  const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl)
  await new Promise((resolve) => (ws.onopen = resolve))
  let id = 0
  const pending = new Map()
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id) } }
  const send = (method, params = {}) => new Promise((resolve) => { const n = ++id; pending.set(n, resolve); ws.send(JSON.stringify({ id: n, method, params })) })
  await send('Page.navigate', { url })
  await sleep(4500)
  const r = await send('Runtime.evaluate', { expression: `(${body})()`, awaitPromise: true, returnByValue: true })
  const details = r.result?.exceptionDetails
  console.log(details ? `EXCEPTION: ${details.exception?.description || details.text} (line ${details.lineNumber}, column ${details.columnNumber})` : JSON.stringify(r.result?.result?.value, null, 1))
  ws.close()
  process.exitCode = details ? 1 : 0
} finally { chrome.kill(); await sleep(300); try { fs.rmSync(profile, { recursive: true, force: true }) } catch { /* profile still locked */ } }
