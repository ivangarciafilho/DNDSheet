import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
export const GATE_STEPS = Object.freeze(['core', 'lint', 'typecheck', 'build', 'fuzz', 'help', 'spell', 'pages-build', 'pages-assets', 'pages-fuzz'])
export function gateSummaryPasses(summary) {
  return summary?.ok === true && Array.isArray(summary.results) && summary.results.length === GATE_STEPS.length && GATE_STEPS.every(step => summary.results.filter(r => r.step === step && r.ok === true && r.code === 0).length === 1)
}
export function gateInputFingerprint(root = process.cwd()) {
  const files = []
  function walk(dir) {
    if (!fs.existsSync(dir)) return
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.isSymbolicLink()) continue
      const file = path.join(dir, entry.name)
      if (entry.isDirectory()) walk(file)
      else if (entry.isFile()) files.push(file)
    }
  }
  for (const dir of ['src', 'test', 'public', 'tools', 'src-pwa', 'src-bex', 'src-ssr']) walk(path.join(root, dir))
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (entry.isFile() && /^(index\.html|\.env(?:\..*)?|build\.json|package.*\.json|.*lock.*|.*config.*|\.npmrc|\.eslintrc.*|\.eslintignore)$/.test(entry.name)) files.push(path.join(root, entry.name))
  }
  const hash = createHash('sha256')
  for (const file of [...new Set(files)].sort()) hash.update(path.relative(root, file).replaceAll('\\', '/')).update('\0').update(fs.readFileSync(file)).update('\0')
  return hash.digest('hex')
}
