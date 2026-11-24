import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { lookupNumericField } from '../../src/core/domain/catalogs/field-types.ts'

// Build 274: a <formula-field> whose static path is not registered renders permanently
// locked. Every literal path in the editor must resolve to a registered numeric field.
const walk = (dir: string): string[] => readdirSync(dir).flatMap(name => {
  const full = join(dir, name)
  return statSync(full).isDirectory() ? walk(full) : full.endsWith('.vue') ? [full] : []
})

describe('formula-field paths', () => {
  it('every static formula-field path is a registered numeric field', () => {
    const missing: string[] = []
    for (const file of walk('src/components')) {
      const text = readFileSync(file, 'utf8')
      for (const match of text.matchAll(/<formula-field\b[^>]*?\spath="([^"]+)"/gs)) {
        if (!lookupNumericField(match[1])) missing.push(`${file.replace(/\\/g, '/')}: ${match[1]}`)
      }
    }
    assert.deepEqual(missing, [])
  })
})
