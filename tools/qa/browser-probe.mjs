import { spawn } from 'node:child_process'
import fs from 'node:fs'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'
import { findChrome, cleanupChrome, CHROME_HEADLESS_FLAGS } from './chrome.mjs'

function freePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer()
    srv.unref()
    srv.on('error', reject)
    srv.listen(0, '127.0.0.1', () => {
      const addr = srv.address()
      const p = typeof addr === 'object' && addr ? addr.port : 0
      srv.close((err) => (err ? reject(err) : resolve(p)))
    })
  })
}

export async function browserProbe(
  run,
  {
    url = process.env.DNDSHEET_E2E_URL || 'http://localhost:8080/#/',
    port = 0,
  } = {}
) {
  const cdpPort = port || (await freePort())
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'dndsheet-probe-'))
  const child = spawn(
    findChrome(),
    [
      ...CHROME_HEADLESS_FLAGS,
      `--remote-debugging-port=${cdpPort}`,
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
        const pages = await (await fetch(`http://127.0.0.1:${cdpPort}/json`, { signal: AbortSignal.timeout(3000) })).json()
        target = pages.find((p) => p.type === 'page')
      } catch { /* Wait for Chrome to expose its page target. */ }
      if (!target) await delay(150)
    }
    if (!target) throw Error('Chrome page target unavailable')
    ws = new WebSocket(target.webSocketDebuggerUrl)
    await new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(Error('CDP connection timeout')),
        15000
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
          }, 90000)
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
    await send('Page.enable')
    await send('Page.navigate', { url })
    let ready = false
    for (let i = 0; i < 450; i++) {
      ready = await evaluate("!!document.querySelector('#render .statblock')")
      if (ready) break
      if (i === 150) await send('Page.navigate', { url })
      await delay(100)
    }
    if (!ready) throw Error('Rendered app unavailable: ' + JSON.stringify(exceptions))
    const waitFor = async (predicateExpression, { timeoutMs = 8000, intervalMs = 50, label = predicateExpression } = {}) => {
      const deadline = Date.now() + timeoutMs
      while (Date.now() < deadline) {
        const value = await evaluate(predicateExpression)
        if (value) return value
        await delay(intervalMs)
      }
      throw Error(`waitFor timed out after ${timeoutMs}ms: ${label}`)
    }
    const result = await run({ send, evaluate, delay, waitFor })
    if (exceptions.length) throw Error(JSON.stringify(exceptions))
    return result
  } finally {
    ws?.close()
    await cleanupChrome(child, profile)
  }
}
