import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { exec } from 'node:child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080
// Prefer dist/spa if built, fallback to dist/pwa
const DIST_DIR = fs.existsSync(path.join(__dirname, 'dist/spa'))
  ? path.join(__dirname, 'dist/spa')
  : path.join(__dirname, 'dist/pwa')

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.otf': 'font/otf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
}

const server = http.createServer((req, res) => {
  const urlPath = req.url.split('?')[0].split('#')[0]
  let decodedPath = decodeURI(urlPath)
  if (decodedPath === '/' || decodedPath === '') {
    decodedPath = '/index.html'
  }

  let filePath = path.join(DIST_DIR, decodedPath)

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST_DIR, 'index.html')
  }

  const ext = path.extname(filePath).toLowerCase()
  const contentType = MIME_TYPES[ext] || 'application/octet-stream'

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' })
      res.end('Internal Server Error')
      return
    }

    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000',
    })
    res.end(data)
  })
})

server.listen(PORT, () => {
  const targetUrl = `http://localhost:${PORT}/#/`
  console.log('===========================================================')
  console.log(`⚔️  DNDSheet Release Candidate is LIVE at: ${targetUrl}`)
  console.log(`📂  Serving from: ${path.relative(__dirname, DIST_DIR)}`)
  console.log('🚀  Opening default browser automatically...')
  console.log('===========================================================')
  console.log('Press Ctrl+C to stop the local server at any time.\n')

  const openCmd =
    process.platform === 'win32'
      ? `start "" "${targetUrl}"`
      : process.platform === 'darwin'
      ? `open "${targetUrl}"`
      : `xdg-open "${targetUrl}"`

  exec(openCmd, (err) => {
    if (err) {
      console.log(`Could not auto-open browser. Please visit: ${targetUrl}`)
    }
  })
})
