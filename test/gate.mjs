// Per-build gate (A17.3): every build runs all of these on the final source before it is committed.
// Usage: npm run gate. Logs and summary.json land in .gate/; exit code is non-zero if any step fails.
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { gateSummaryPasses, gateInputFingerprint } from '../tools/gate-contract.mjs'

const OUT = path.resolve('.gate')
const PAGES_BASE = '/DNDSheet'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.ico': 'image/x-icon' }
fs.rmSync(OUT, { recursive: true, force: true })
fs.mkdirSync(OUT, { recursive: true })
const results = []
const inputFingerprint = gateInputFingerprint()

function run(name, command, env = {}) {
  return new Promise((resolve) => {
    const started = Date.now()
    const log = fs.createWriteStream(path.join(OUT, `${name}.log`))
    const child = spawn(command, { shell: true, env: { ...process.env, ...env } })
    child.stdout.pipe(log)
    child.stderr.pipe(log)
    child.on('close', (code) => {
      log.end()
      results.push({ step: name, ok: code === 0, code, seconds: Math.round((Date.now() - started) / 1000) })
      console.log(`${code === 0 ? 'PASS' : 'FAIL'} ${name} (${code})`)
      resolve(code === 0)
    })
  })
}

// Serves root under prefix ('' or '/DNDSheet'), the way the release candidate and GitHub Pages serve it.
function serve(root, port, prefix) {
  const base = path.resolve(root)
  const server = http.createServer((req, res) => {
    let url = decodeURIComponent((req.url || '/').split('?')[0])
    if (prefix) {
      if (!url.startsWith(prefix + '/')) { res.statusCode = 404; return res.end('outside base') }
      url = url.slice(prefix.length)
    }
    if (url.endsWith('/')) url += 'index.html'
    const file = path.resolve(base, '.' + url)
    if (!file.startsWith(base)) { res.statusCode = 403; return res.end() }
    fs.readFile(file, (error, data) => {
      if (error) { res.statusCode = 404; return res.end('not found') }
      res.setHeader('Content-Type', MIME[path.extname(file)] || 'application/octet-stream')
      res.end(data)
    })
  })
  return new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve(server)))
}

async function check(name, fn) {
  let ok = false
  try { ok = await fn() } catch (error) { fs.writeFileSync(path.join(OUT, `${name}.log`), String(error)) }
  results.push({ step: name, ok, code: ok ? 0 : 1, seconds: 0 })
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`)
  return ok
}

await run('core', 'npm test')
await run('lint', 'npx eslint --ext .js,.ts,.vue src test')
await run('typecheck', 'npm run typecheck')
if (await run('build', 'npx quasar build')) {
  const spa = await serve('dist/spa', 9230, '')
  const url = 'http://localhost:9230/index.html#/'
  await run('fuzz', 'node test/exhaustive-ui-fuzz.js', { DNDSHEET_E2E_URL: url })
  await run('help', 'node test/emergency-skills-browser-smoke.js && node test/emergency-spellcasting-browser-smoke.js && node test/casting-sources-browser-smoke.js && node test/print-parity-browser-smoke.js && node test/emergency-rich-mechanics-browser-smoke.js && node test/emergency-containers-browser-smoke.js && node test/emergency-numeric-presentation-browser-smoke.js && node test/outcome-lifecycle-browser-smoke.js && node test/statblock-help-browser-smoke.js && node --experimental-strip-types test/release-matrix-browser-smoke.js && node tools/qa/overflow-probe.js', { DNDSHEET_E2E_URL: url })
  await run('spell', 'node test/spell-plate-browser-smoke.js', { DNDSHEET_E2E_URL: url })
  spa.close()
}
if (await run('pages-build', 'npx quasar build', { PUBLIC_PATH: `${PAGES_BASE}/`, DNDSHEET_BUILD_DIR: 'dist-pages' })) {
  const pages = await serve('dist-pages', 9231, PAGES_BASE)
  const origin = `http://localhost:9231${PAGES_BASE}`
  await check('pages-assets', async () => {
    const index = await (await fetch(`${origin}/index.html`)).text()
    const mask = await fetch(`${origin}/homebrew/masks/watercolor_splash_center.png`)
    return index.includes(`${PAGES_BASE}/assets/`) && mask.status === 200
  })
  await run('pages-fuzz', 'node test/exhaustive-ui-fuzz.js && node test/emergency-skills-browser-smoke.js && node test/emergency-spellcasting-browser-smoke.js && node test/casting-sources-browser-smoke.js && node test/print-parity-browser-smoke.js && node test/emergency-rich-mechanics-browser-smoke.js && node test/emergency-containers-browser-smoke.js && node test/emergency-numeric-presentation-browser-smoke.js', { DNDSHEET_E2E_URL: `${origin}/index.html#/` })
  pages.close()
}

const failed = results.filter((r) => !r.ok)
const summary = { ok: failed.length === 0 && inputFingerprint === gateInputFingerprint(), inputFingerprint, results }
summary.ok = gateSummaryPasses(summary)
fs.writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify(summary, null, 2))
console.log(!summary.ok ? `GATE FAILED: ${failed.map((r) => r.step).join(', ')}` : `GATE PASSED: ${results.length} steps`)
process.exit(summary.ok ? 0 : 1)
