import { spawn } from 'node:child_process'
import http from 'node:http'

const p = 9225
const proc = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  `--remote-debugging-port=${p}`,
  '--headless=new',
  '--disable-gpu',
  '--no-sandbox',
  '--window-size=1400,1000',
  'http://localhost:8080/#/'
])

await new Promise((r) => setTimeout(r, 1500))

const targets = await new Promise((r) =>
  http.get(`http://127.0.0.1:${p}/json`, (res) => {
    let d = ''
    res.on('data', (c) => (d += c))
    res.on('end', () => r(JSON.parse(d)))
  })
)

const page = targets.find((t) => t.type === 'page')
const ws = new WebSocket(page.webSocketDebuggerUrl)
await new Promise((r) => ws.addEventListener('open', r, { once: true }))

let id = 1
const send = (method, params = {}) =>
  new Promise((r) => {
    const i = id++
    const h = (e) => {
      const m = JSON.parse(e.data)
      if (m.id === i) {
        ws.removeEventListener('message', h)
        r(m.result)
      }
    }
    ws.addEventListener('message', h)
    ws.send(JSON.stringify({ id: i, method, params }))
  })

await send('Runtime.enable')

async function evalInPage(expression) {
  const res = await send('Runtime.evaluate', {
    expression: `(${expression})()`,
    awaitPromise: true,
    returnByValue: true
  })
  return res.result?.value
}

// Wait for Quasar
for (let i = 0; i < 40; i++) {
  const ready = await evalInPage(`
    () => {
      const app = document.querySelector('#q-app');
      return !!(app && app.__vue_app__);
    }
  `)
  if (ready) break
  await new Promise((resolve) => setTimeout(resolve, 250))
}

const info = await evalInPage(`
  () => {
    const s = document.querySelector('.statblock');
    const r = document.querySelector('#render');
    const getR = el => el ? { x: Math.round(el.getBoundingClientRect().x), y: Math.round(el.getBoundingClientRect().y), width: Math.round(el.getBoundingClientRect().width), height: Math.round(el.getBoundingClientRect().height) } : null;
    return {
      hasStatblock: !!s,
      statblockText: s ? s.textContent.slice(0, 80) : null,
      statblockRect: getR(s),
      hasRender: !!r,
      renderRect: getR(r),
      splitter: getR(document.querySelector('#splitter'))
    };
  }
`)

console.log(info)

ws.close()
proc.kill()
