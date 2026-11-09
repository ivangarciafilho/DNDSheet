// Replace exactly one occurrence of an anchor block with a new block, preserving the file's line endings.
// Matching is done on LF-normalised text; the output is written back with the original EOL style.
// Usage: node edit-anchored.mjs <file> <oldBlockFile> <newBlockFile> [outFile]
import fs from 'node:fs'
const [file, oldFile, newFile, outFile = file] = process.argv.slice(2)
const raw = fs.readFileSync(file, 'utf8')
const eol = raw.includes('\r\n') ? '\r\n' : '\n'
const text = raw.replace(/\r\n/g, '\n')
const strip = s => fs.readFileSync(s, 'utf8').replace(/\r\n/g, '\n').replace(/\n+$/, '')
const before = strip(oldFile)
const after = strip(newFile)
const count = text.split(before).length - 1
if (count !== 1) { console.error(`FAILED: anchor matched ${count} times in ${file}`); process.exit(2) }
const result = text.replace(before, () => after)
fs.writeFileSync(outFile, eol === '\r\n' ? result.replace(/\n/g, '\r\n') : result)
console.log(`edited ${file} -> ${outFile} (${eol === '\r\n' ? 'CRLF' : 'LF'}), ${before.split('\n').length} -> ${after.split('\n').length} lines`)
