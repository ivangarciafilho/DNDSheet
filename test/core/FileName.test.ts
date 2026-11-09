import test from 'node:test'
import assert from 'node:assert'
import { safeFileName } from '../../src/core/domain/file-name.ts'

test('export file names keep authored text but drop characters no platform accepts (B4.11)', () => {
  assert.strictEqual(safeFileName('Ogre: Elder/Chief?', '.5emm.json'), 'Ogre- Elder-Chief.5emm.json')
  assert.strictEqual(safeFileName('Ancient "Red" Dragon', '.md'), 'Ancient -Red- Dragon.md')
  assert.strictEqual(safeFileName('a\\b|c*d<e>f', '.tex'), 'a-b-c-d-e-f.tex')
  assert.strictEqual(safeFileName('Lich\u0007King', '.txt'), 'Lich-King.txt')
  assert.strictEqual(safeFileName('Trailing dots...', '.png'), 'Trailing dots.png')
  assert.strictEqual(safeFileName('Café Ünïcode 龍', '.html'), 'Café Ünïcode 龍.html')
})

test('empty, blank or reserved names fall back safely', () => {
  assert.strictEqual(safeFileName('', '.md'), 'statblock.md')
  assert.strictEqual(safeFileName('   ', '.md', 'Hero'), 'Hero.md')
  assert.strictEqual(safeFileName(undefined, '.json'), 'statblock.json')
  assert.strictEqual(safeFileName('???', '.json'), 'statblock.json')
  assert.strictEqual(safeFileName('CON', '.txt'), 'CON_.txt')
  assert.strictEqual(safeFileName('nul', '.txt'), 'nul_.txt')
})

test('very long names are cut so the suffix always survives', () => {
  const out = safeFileName('x'.repeat(500), '.improved-initiative.json')
  assert.ok(out.endsWith('.improved-initiative.json'))
  assert.ok(out.length <= 200)
})
