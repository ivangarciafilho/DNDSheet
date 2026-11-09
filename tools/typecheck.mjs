import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { parseCompilerOutput, compareDiagnostics } from './typecheck-diagnostics.mjs'
const tools = path.dirname(fileURLToPath(import.meta.url))
const runtime = path.join(tools, 'typecheck-runtime')
const require = createRequire(path.join(runtime, 'package.json'))
try {
  for (const [name, expected] of [['typescript', '6.0.3'], ['vue-tsc', '3.3.14']]) {
    const packagePath = require.resolve(`${name}/package.json`)
    if (!packagePath.startsWith(path.join(runtime, 'node_modules') + path.sep)) throw new Error(`${name} must be installed in tools/typecheck-runtime; run npm run typecheck:setup`)
    if (require(`${name}/package.json`).version !== expected) throw new Error(`${name} must be exactly ${expected}`)
  }
  const baseline = JSON.parse(fs.readFileSync(path.join(tools, 'typecheck-baseline.json'), 'utf8'))
  const result = spawnSync(process.execPath, [require.resolve('vue-tsc/bin/vue-tsc.js'), '--noEmit'], { cwd: path.dirname(tools), encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, timeout: 180000 })
  const output = (result.stdout || '') + (result.stderr || '')
  if (result.error || result.signal || ![0, 1, 2].includes(result.status)) throw result.error || new Error(`compiler failed: ${result.signal || result.status}\n${output}`)
  const diagnostics = parseCompilerOutput(output)
  if ((result.status !== 0 && !diagnostics.length) || (result.status === 0 && output.trim())) throw new Error(`unexpected compiler output:\n${output}`)
  const comparison = compareDiagnostics(diagnostics, baseline.diagnostics)
  const perFile = Object.fromEntries([...diagnostics.reduce((counts, diagnostic) => counts.set(diagnostic.file, (counts.get(diagnostic.file) || 0) + 1), new Map())].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])))
  const reportDirectory = path.join(path.dirname(tools), '.gate')
  fs.mkdirSync(reportDirectory, { recursive: true })
  fs.writeFileSync(path.join(reportDirectory, 'typecheck-current.json'), JSON.stringify({ baselineCommit: baseline.commit, compiler: { typescript: '6.0.3', vueTsc: '3.3.14' }, total: diagnostics.length, added: comparison.added, resolved: comparison.resolved, perFile }, null, 2) + '\n')
  console.log(`Typecheck: ${diagnostics.length} diagnostics; ${comparison.added.length} new; ${comparison.resolved} resolved (approved baseline ${baseline.diagnostics.length}, Build213 ${baseline.commit}).`)
  for (const diagnostic of comparison.added) console.error(`${diagnostic.file}: ${diagnostic.code}: ${diagnostic.message}`)
  process.exitCode = comparison.added.length ? 1 : 0
} catch (error) {
  console.error(`Typecheck guard failed: ${error.message}`)
  process.exitCode = 1
}
