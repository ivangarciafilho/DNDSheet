import test from 'node:test'
import assert from 'node:assert/strict'
import en from '../../src/i18n/en-US/index.ts'
import pt from '../../src/i18n/pt-BR/index.ts'

// C5 coverage contract for Brazilian Portuguese: no stale keys, identical placeholders, help fully translated,
// and overall coverage that may only grow (raise PT_BR_MIN_KEYS when more namespaces are translated).
const PT_BR_MIN_KEYS = 920

type Tree = { [key: string]: string | Tree }
const leaves = (tree: Tree, prefix = ''): Map<string, string> => {
  const out = new Map<string, string>()
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'string') out.set(path, value)
    else for (const [k, v] of leaves(value, path)) out.set(k, v)
  }
  return out
}
const placeholders = (text: string) => [...text.matchAll(/\{[^{}]*\}/g)].map((m) => m[0]).sort()

const enKeys = leaves(en as unknown as Tree)
const ptKeys = leaves(pt as unknown as Tree)

test('C5: every pt-BR key exists in en-US (no stale or misspelled keys)', () => {
  const stale = [...ptKeys.keys()].filter((key) => !enKeys.has(key))
  assert.deepEqual(stale, [])
})

test('C5: pt-BR keeps the same {placeholders} as en-US', () => {
  const mismatched = [...ptKeys].filter(([key, text]) => JSON.stringify(placeholders(text)) !== JSON.stringify(placeholders(enKeys.get(key) ?? '')))
  assert.deepEqual(mismatched.map(([key]) => key), [])
})

test('C5: pt-BR translates every help text (BS-33) and nothing non-empty in en-US is left empty', () => {
  const missingHelp = [...enKeys.keys()].filter((key) => key.startsWith('help.') && !ptKeys.has(key))
  assert.deepEqual(missingHelp, [])
  assert.deepEqual(
    [...ptKeys].filter(([key, text]) => (enKeys.get(key) ?? '').trim().length > 0 && !text.trim()).map(([key]) => key),
    []
  )
})

test('C5: pt-BR coverage only grows', () => {
  const covered = [...ptKeys.keys()].filter((key) => enKeys.has(key)).length
  assert.ok(covered >= PT_BR_MIN_KEYS, `pt-BR covers ${covered}/${enKeys.size} keys; floor is ${PT_BR_MIN_KEYS}`)
  console.log(`# pt-BR coverage: ${covered}/${enKeys.size} (${((covered / enKeys.size) * 100).toFixed(1)} %)`)
})

