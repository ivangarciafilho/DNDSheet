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

    ws.send(JSON.stringify({
      id: 1,
      method: 'Runtime.evaluate',
      params: {
        expression: 'JSON.stringify({ statblockWrapper: !!document.querySelector(".statblock-wrapper"), statblock: !!document.querySelector(".statblock"), render: !!document.querySelector("#render"), rightPane: document.querySelector(".q-splitter__after")?.innerHTML?.slice(0, 500) })',
        returnByValue: true
      }
    }));

    ws.onmessage = (e) => {
      console.log('Result:', JSON.parse(JSON.parse(e.data).result?.result?.value || '{}'));
      ws.close();
      chromeProc.kill();
      process.exit(0);
    };
  } catch (err) {
    console.error(err);
    chromeProc.kill();
    process.exit(1);
  }
}, 3000);
