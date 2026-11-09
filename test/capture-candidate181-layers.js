import { spawn } from 'node:child_process'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const PORT = 9230
const ARTIFACT_DIR = 'C:\\Users\\Administrador\\.gemini\\antigravity\\brain\\addb53e0-c313-4ac6-9aa8-46bc7e873a1d'

async function captureLayers() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-capture-181-layers-'))
  const chromeProc = spawn(CHROME_PATH, [
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${tmpDir}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1600,1400',
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
  if (!targets) throw new Error('Could not connect to Chrome CDP endpoint on port ' + PORT)

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
  await sendCdp('Page.enable')

  async function evalInPage(expression) {
    const res = await sendCdp('Runtime.evaluate', {
      expression: `(${expression})()`,
      awaitPromise: true,
      returnByValue: true
    })
    return res.result?.value !== undefined ? res.result.value : res.result
  }

  // Dismiss Changelog dialog
  await new Promise((r) => setTimeout(r, 1000))
  await evalInPage(`
    () => {
      const dialog = document.querySelector('.q-dialog');
      if (dialog && dialog.textContent.includes('Changelog')) {
        const doneBtn = Array.from(dialog.querySelectorAll('button')).find(b => b.textContent.includes('Done')) || dialog.querySelector('button');
        if (doneBtn) doneBtn.click();
      }
    }
  `)
  await new Promise((r) => setTimeout(r, 400))

  // Set up A4 layers with an occluding banner on top of statblock
  await evalInPage(`
    async () => {
      const app = document.querySelector('#q-app');
      const pinia = app.__vue_app__.config.globalProperties.$pinia;
      const editorStore = pinia._s.get('editor');
      const monster = pinia._s.get('monster');

      editorStore.a4PreviewMode = true;
      editorStore.a4ShowPageSheet = true;
      editorStore.a4FitScale = 0.8;

      // Add custom layer at index 0 (Top of composition, occludes statblock underneath)
      editorStore.a4Layers = [
        {
          id: 'layer-top-banner',
          name: 'Top Occlusion Banner (Normal Blend)',
          type: 'custom',
          visible: true,
          locked: false,
          blendMode: 'normal',
          opacity: 100,
          scaleX: 100,
          scaleY: 100,
          scaleUniform: true,
          offsetX: 100,
          offsetY: 80,
          rotation: 0,
          colorMask: '#8a2be2',
          url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="100"><rect width="300" height="100" fill="%238a2be2" rx="10"/><text x="150" y="55" fill="white" font-size="18" font-family="sans-serif" font-weight="bold" text-anchor="middle">TOP OCCLUDING LAYER</text></svg>'
        },
        {
          id: 'layer-statblock-core',
          name: 'Monster Statblock (Dual-Axis Anamorphic)',
          type: 'statblock',
          visible: true,
          locked: true,
          blendMode: 'normal',
          opacity: 100,
          scaleX: 100,
          scaleY: 100,
          scaleUniform: false,
          offsetX: 0,
          offsetY: 0,
          rotation: 0,
          colorMask: ''
        },
        {
          id: 'layer-portrait-core',
          name: 'Creature Portrait Artwork',
          type: 'portrait',
          visible: false,
          locked: false,
          blendMode: 'normal',
          opacity: 100,
          scaleX: 100,
          scaleY: 100,
          scaleUniform: true,
          offsetX: 0,
          offsetY: 0,
          rotation: 0,
          colorMask: ''
        }
      ];
      await new Promise(r => setTimeout(r, 500));
    }
  `)

  await new Promise((r) => setTimeout(r, 800))

  const clip = await evalInPage(`
    () => {
      const sheet = document.querySelector('.a4-page-sheet');
      if (!sheet) return null;
      const rect = sheet.getBoundingClientRect();
      return {
        x: Math.max(0, Math.round(rect.x)),
        y: Math.max(0, Math.round(rect.y)),
        width: Math.min(1500, Math.round(rect.width)),
        height: Math.min(1000, Math.round(rect.height)),
        scale: 1
      };
    }
  `)

  console.log('Sheet clip:', clip)
  const screenshot = await sendCdp('Page.captureScreenshot', { format: 'png', clip: clip || undefined })
  const buffer = Buffer.from(screenshot.data, 'base64')
  const outPath = path.join(ARTIFACT_DIR, 'candidate181-a4-layers-occlusion.png')
  fs.writeFileSync(outPath, buffer)
  console.log('Saved A4 layers screenshot to:', outPath)

  ws.close()
  chromeProc.kill()
  try { fs.rmSync(tmpDir, { recursive: true, force: true }) } catch (e) {}
}

captureLayers().catch((err) => {
  console.error('Capture layers failed:', err)
  process.exit(1)
})
