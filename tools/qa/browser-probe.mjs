import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { findChrome, cleanupChrome } from './chrome.mjs'
export async function browserProbe(
  run,
  {
    url = process.env.DNDSHEET_E2E_URL || 'http://localhost:8080/#/',
    port = 9345,
  } = {}
) {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'dndsheet-probe-'))
  const child = spawn(
    findChrome(),
    [
      '--headless=new',
      '--disable-gpu',
      '--disable-extensions',
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${profile}`,
      '--window-size=1600,1200',
      'about:blank',
    ],
    { windowsHide: true }
  )
  let ws
  let launchError
  child.on('error', (e) => {
    launchError = e
  })
  const delay = (ms) => new Promise((r) => setTimeout(r, ms))
  const pending = new Map(),
    exceptions = []
  try {
    let target
    for (let i = 0; i < 300 && !target; i++) {
      if (launchError) throw launchError
      try {
        const pages = await (await fetch(`http://127.0.0.1:${port}/json`)).json()
        target = pages.find((p) => p.type === 'page')
      } catch { /* Wait for Chrome to expose its page target. */ }
      if (!target) await delay(100)
    }
    if (!target) throw Error('Chrome page target unavailable')
    ws = new WebSocket(target.webSocketDebuggerUrl)
    await new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(Error('CDP connection timeout')),
        5000
      )
      ws.onopen = () => {
        clearTimeout(timer)
        resolve()
      }
      ws.onerror = (e) => {
        clearTimeout(timer)
        reject(e)
      }
    })
    let id = 0
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data)
      pending.get(message.id)?.(message)
      if (message.method === 'Runtime.exceptionThrown')
        exceptions.push(message.params.exceptionDetails)
    }
    const send = (method, params = {}) =>
      new Promise((resolve, reject) => {
        const key = ++id,
          timer = setTimeout(() => {
            pending.delete(key)
            reject(Error(method + ' timed out'))
          }, 30000)
        pending.set(key, (m) => {
          clearTimeout(timer)
          pending.delete(key)
          m.error ? reject(Error(m.error.message)) : resolve(m)
        })
        ws.send(JSON.stringify({ id: key, method, params }))
      })
    const evaluate = async (expression) => {
      const r = await send('Runtime.evaluate', {
        expression,
        awaitPromise: true,
        returnByValue: true,
      })
      if (r.result.exceptionDetails)
        throw Error(
          r.result.exceptionDetails.exception?.description ||
            r.result.exceptionDetails.text
        )
      return r.result.result.value
    }
    await send('Runtime.enable')
    await send('Page.navigate', { url })
    let ready = false
    for (let i = 0; i < 450; i++) {
      ready = await evaluate("!!document.querySelector('#render .statblock')")
      if (ready) break
      await delay(100)
    }
    if (!ready) throw Error('Rendered app unavailable: ' + JSON.stringify(exceptions))
    const result = await run({ send, evaluate, delay })
    if (exceptions.length) throw Error(JSON.stringify(exceptions))
    return result
  } finally {
    ws?.close()
    await cleanupChrome(child, profile)
  }
}
