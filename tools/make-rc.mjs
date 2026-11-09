// Freeze a staged build as a release candidate: <rc>/spa (doccheck excluded), release-candidate.json, SHA256SUMS.txt.
// Refuses to touch an existing RC folder. Sums: "sha256  posix/path" lines, LF, trailing newline, ordered like the
// earlier RCs (pathlib on Windows: component-wise, case-insensitive).
// Usage: node make-rc.mjs <stagedSpa> <rcDir> <release-candidate.json source>
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const [staged, rcDir, jsonSource] = process.argv.slice(2)
if (!staged || !rcDir || !jsonSource) throw new Error('usage: <stagedSpa> <rcDir> <jsonSource>')
if (fs.existsSync(rcDir)) throw new Error(`refusing: ${rcDir} already exists`)
const EXCLUDE = new Set(['__doccheck.html'])
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)])
const files = walk(staged).filter(f => !(path.dirname(f) === path.resolve(staged) && EXCLUDE.has(path.basename(f))))
fs.mkdirSync(path.join(rcDir, 'spa'), { recursive: true })
for (const file of files) {
  const rel = path.relative(staged, file)
  const target = path.join(rcDir, 'spa', rel)
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.copyFileSync(file, target)
  if (!fs.readFileSync(target).equals(fs.readFileSync(file))) throw new Error('copy mismatch ' + rel)
}
JSON.parse(fs.readFileSync(jsonSource, 'utf8'))
fs.copyFileSync(jsonSource, path.join(rcDir, 'release-candidate.json'))
const sha = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
const byComponents = (a, b) => {
  const x = a.toLowerCase().split('/'), y = b.toLowerCase().split('/')
  for (let i = 0; i < Math.min(x.length, y.length); i++) if (x[i] !== y[i]) return x[i] < y[i] ? -1 : 1
  return x.length - y.length
}
const entries = walk(rcDir).map(f => path.relative(rcDir, f).split(path.sep).join('/')).filter(rel => rel !== 'SHA256SUMS.txt').sort(byComponents)
fs.writeFileSync(path.join(rcDir, 'SHA256SUMS.txt'), entries.map(rel => `${sha(path.join(rcDir, rel))}  ${rel}`).join('\n') + '\n')
// Re-verify from disk.
const lines = fs.readFileSync(path.join(rcDir, 'SHA256SUMS.txt'), 'utf8').trimEnd().split('\n')
for (const line of lines) { const [digest, rel] = [line.slice(0, 64), line.slice(66)]; if (sha(path.join(rcDir, rel)) !== digest) throw new Error('verify failed ' + rel) }
console.log(`RC ${rcDir}: ${files.length} spa files + release-candidate.json = ${lines.length} verified entries`)
