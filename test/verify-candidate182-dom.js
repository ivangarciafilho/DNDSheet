import { spawn } from 'node:child_process'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const PORT = 9229

async function verify() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-verify-182-'))
  const chromeProc = spawn(CHROME_PATH, [
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${tmpDir}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    'http://localhost:8080/#/'
  ])

  let targets = null
  for (let attempt = 0; attempt < 25; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 400))
    try {
      targets = await new Promise((resolve, reject) => {
        http.get(`http://127.0.0.1:${PORT}/json`, (res) => {
          let data = ''
          res.on('data', (chunk) => (data += chunk))
          res.on('end', () => {
            try { resolve(JSON.parse(data)) } catch (err) { reject(err) }
          })
        }).on('error', reject)
      })
      if (Array.isArray(targets) && targets.length > 0) break
    } catch {}
  }
  if (!targets) throw new Error('Could not connect to Chrome CDP endpoint')

  const pageTarget = targets.find((t) => t.type === 'page')
  const ws = new globalThis.WebSocket(pageTarget.webSocketDebuggerUrl)
  await new Promise((resolve) => ws.addEventListener('open', resolve, { once: true }))

  let id = 1
  const pendingRequests = new Map()

  ws.addEventListener('message', (event) => {
    const raw = typeof event.data === 'string' ? event.data : event.data.toString()
    const msg = JSON.parse(raw)
    if (msg.id && pendingRequests.has(msg.id)) {
      const cb = pendingRequests.get(msg.id)
      pendingRequests.delete(msg.id)
      cb(msg)
    }
  })

  function sendCdp(method, params = {}) {
    return new Promise((resolve) => {
      const key = id++
      pendingRequests.set(key, (msg) => resolve(msg.result))
      ws.send(JSON.stringify({ id: key, method, params }))
    })
  }

  await sendCdp('Runtime.enable')

  async function evalInPage(expression) {
    const res = await sendCdp('Runtime.evaluate', {
      expression: `(${expression})()`,
      awaitPromise: true,
      returnByValue: true
    })
    return res.result?.value !== undefined ? res.result.value : res.result
  }

  // Wait for Quasar
  for (let i = 0; i < 40; i++) {
    const ready = await evalInPage(`() => !!document.querySelector('#render .statblock')`)
    if (ready) break
    await new Promise((resolve) => setTimeout(resolve, 250))
  }

  const domCheck = await evalInPage(`
    async () => {
      const app = document.querySelector('#q-app');
      const pinia = app.__vue_app__.config.globalProperties.$pinia;
      const monster = pinia._s.get('monster');
      const editorStore = pinia._s.get('editor');

      monster.name = 'Ezra Meridian Aethelgard';
      monster.ac = 10;
      monster.splitAcRiderRows = true;
      monster.extendedHp = monster.extendedHp || {};
      monster.extendedHp.acSubmodule = {
        enabled: true,
        attackerSave: { enabled: true, stat: 'WIS', dc: 15, failureEffect: 'Knocks Prone' }
      };

      monster.splitHpRiderRows = true;
      monster.hp = { total: 112, bloodied: 56, formula: '15d8+45', type: 'd8', modifier: 45 };
      monster.extendedHp.regeneration = {
        enabled: true,
        amount: 10,
        recoveryType: 'temp_hp',
        conditionModifier: 'not_bloodied',
        displayMode: 'minimalist'
      };

      monster.splitSpeedRiderRows = true;
      monster.speeds = [{ id: 'sp-1', type: 'walk', speed: 30, note: '' }];
      monster.speedRiders = [
        { id: 'sr-1', name: 'Dash', note: 'Can Dash as a Bonus Action' }
      ];

      monster.traits = [
        {
          id: 'tr-condenser',
          name: 'Arcane Condenser',
          description: 'It has 10 charges, regained after 4 hours of Inactivity.',
          limitedUse: { count: 0, rate: '' }
        }
      ];

      editorStore.visualTemplate = 'modern';
      await new Promise(r => setTimeout(r, 300));
      return {
        hasAcSubrow: !!document.querySelector('.dnd-vitals-indented-subrow'),
        hasTraitStreamlined: !!document.querySelector('.sb-plate.sb-trait-streamlined'),
        hasSubrowBullet: document.querySelector('.dnd-vitals-indented-subrow')?.textContent.includes('↳')
      };
    }
  `)

  console.log('DOM Check result:', domCheck)

  ws.close()
  chromeProc.kill()
  try { fs.rmSync(tmpDir, { recursive: true, force: true }) } catch (e) {}
}

verify().catch((err) => {
  console.error('Verify failed:', err)
  process.exit(1)
})
