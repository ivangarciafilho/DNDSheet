// A13.5: fail when help-tip coverage drops below the committed floor. Usage: npm run audit:help
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
const FLOOR = Number(fs.readFileSync('test/help-floor.txt', 'utf8').trim())
const report = execFileSync(process.execPath, ['test/inventory.mjs'], { encoding: 'utf8' })
const row = report.split('\n').find((line) => /^\| \d+ \| \d+ \| [\d.]+ % \|$/.test(line))
const [, controls, tipped] = row.split('|').map((cell) => cell.trim())
const coverage = (Number(tipped) / Number(controls)) * 100
console.log(`help coverage ${coverage.toFixed(1)} % (${tipped}/${controls}), floor ${FLOOR} %`)
process.exit(coverage + 1e-9 >= FLOOR ? 0 : 1)
