// Runs one browser-suite script; on failure runs it exactly once more and records it in .gate/flaky.log.
// Why: shared-workstation load produces timing-only timeouts (Build 262: two different scripts, each green on rerun).
// A script that fails twice still fails the gate, and every retry is reported, so a flake is visible rather than hidden.
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
const command = process.argv.slice(2).join(' ')
const attempt = () => spawnSync(command, { shell: true, stdio: 'inherit' }).status
if (attempt() === 0) process.exit(0)
fs.mkdirSync('.gate', { recursive: true })
fs.appendFileSync('.gate/flaky.log', `${new Date().toISOString()} ${process.env.DNDSHEET_E2E_URL || ''} ${command}\n`)
console.error(`RETRY (flaky?): ${command}`)
process.exit(attempt() === 0 ? 0 : 1)
