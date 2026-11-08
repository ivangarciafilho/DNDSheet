import { spawn } from 'node:child_process';
import http from 'node:http';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9228;
const tmpDir = 'C:\\Windows\\Temp\\chrome-debug-181';

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

    function send(method, params = {}) {
      return new Promise((resolve) => {
        ws.send(JSON.stringify({ id: 1, method, params }));
        ws.onmessage = (e) => resolve(JSON.parse(e.data));
      });
    }

    const res = await send('Runtime.evaluate', {
      expression: `(() => {
        const sb = document.querySelector('.statblock');
        const sheet = document.querySelector('.a4-page-sheet');
        const renderer = document.querySelector('.web-renderer-root');
        return JSON.stringify({
          sbRect: sb ? sb.getBoundingClientRect() : null,
          sheetRect: sheet ? sheet.getBoundingClientRect() : null,
          rendererRect: renderer ? renderer.getBoundingClientRect() : null,
          sbComputedStyle: sb ? {
            display: window.getComputedStyle(sb).display,
            visibility: window.getComputedStyle(sb).visibility,
            opacity: window.getComputedStyle(sb).opacity,
            color: window.getComputedStyle(sb).color,
            bg: window.getComputedStyle(sb).backgroundColor
          } : null
        });
      })()`,
      returnByValue: true
    });

    console.log('DOM Info:', JSON.parse(res.result.result.value));
    ws.close();
    chromeProc.kill();
  } catch (err) {
    console.error(err);
    chromeProc.kill();
  }
}, 3000);
