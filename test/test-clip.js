import { spawn } from 'node:child_process';
import http from 'node:http';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9229;
const tmpDir = 'C:\\Windows\\Temp\\chrome-debug-181b';

const chromeProc = spawn(CHROME_PATH, [
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${tmpDir}`,
  '--headless=new',
  '--window-size=1600,1200',
  'http://localhost:8080/#/'
]);

setTimeout(async () => {
  try {
    const targets = await new Promise((resolve) => {
      http.get(`http://127.0.0.1:${PORT}/json`, (res) => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => resolve(JSON.parse(data)));
      });
    });
    const page = targets.find(t => t.type === 'page');
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    let id = 1;
    function send(method, params = {}) {
      return new Promise((resolve) => {
        const key = id++;
        const onMsg = (e) => {
          const msg = JSON.parse(e.data);
          if (msg.id === key) {
            ws.removeEventListener('message', onMsg);
            resolve(msg);
          }
        };
        ws.addEventListener('message', onMsg);
        ws.send(JSON.stringify({ id: key, method, params }));
      });
    }

    const r = await send('Runtime.evaluate', {
      expression: `(() => {
        const el = document.querySelector('#render .statblock') || document.querySelector('.statblock');
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        return {
          x: Math.max(0, Math.round(rect.x) - 4),
          y: Math.max(0, Math.round(rect.y) - 4),
          width: Math.round(rect.width) + 8,
          height: Math.round(rect.height) + 8,
          scale: 1
        };
      })()`,
      returnByValue: true
    });

    console.log('Full CDP response:', JSON.stringify(r));
    ws.close();
    chromeProc.kill();
  } catch (err) {
    console.error(err);
    chromeProc.kill();
  }
}, 3000);
