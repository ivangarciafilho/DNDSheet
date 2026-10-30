import test from 'node:test'
import assert from 'node:assert/strict'
import { parseNumericFieldPath, readNumericFieldPath, readOptionalNumericFieldPath } from '../../src/core/domain/catalogs/field-path.ts'

test('stable collection addresses survive reordering and encoded IDs', () => {
  const id = 'walk / ].雪'
  const path = `speeds[id=${encodeURIComponent(id)}].speed`
  const a = { id, speed: 35 }; const b = { id: 'fly', speed: 60 }
  assert.equal(readNumericFieldPath({ speeds: [a, b] }, path), 35)
  assert.equal(readNumericFieldPath({ speeds: [b, a] }, path), 35)
  assert.equal(parseNumericFieldPath(path)[0].selector?.value, id)
})

test('semantic skill and spell-level addresses do not serialize occurrence indices', () => {
  assert.equal(readNumericFieldPath({ skills: [{ key: 'perception', overrideValue: 9 }] }, 'skills[key=PERCEPTION].overrideValue'), 9)
  assert.equal(readNumericFieldPath({ spellcasting: { slots: [4, 3, 2] } }, 'spellcasting.slots[level=2]'), 3)
})

test('malformed, prototype, noncanonical and index addresses fail closed', () => {
  for (const path of ['', 'a..b', '__proto__.x', 'a.constructor.x', 'a.prototype.x', 'a[0].b', 'a[id=]', 'a[id=%ZZ].b', 'a[id=%61].b', 'a[level=0]', 'a[level=10]', 'a[key=perception]', 'a[id=a/b].x', 'a[id=a].']) {
    assert.throws(() => parseNumericFieldPath(path), undefined, path)
  }
  assert.throws(() => parseNumericFieldPath('a'.repeat(4097)))
})

test('missing, duplicate, inherited and accessor-backed targets never silently resolve', () => {
  assert.throws(() => readNumericFieldPath({ a: [{ id: 'x', n: 1 }, { id: 'x', n: 2 }] }, 'a[id=x].n'), /ambiguous/i)
  assert.throws(() => readNumericFieldPath({ a: [] }, 'a[id=x].n'), /missing/i)
  assert.throws(() => readNumericFieldPath(Object.create({ a: 1 }), 'a'), /missing/i)
  let invoked = false
  const a = Object.defineProperty({}, 'n', { get() { invoked = true; return 1 } })
  assert.throws(() => readNumericFieldPath(a, 'n'), /accessor/i)
  assert.equal(invoked, false)
})

test('stable selectors treat prototype-looking identity values as plain data', () => {
  assert.equal(readNumericFieldPath({ a: [{ id: '__proto__', n: 4 }] }, 'a[id=__proto__].n'), 4)
})

test('optional leaves do not create missing parents or collection members', () => {
  assert.equal(readOptionalNumericFieldPath({ a: [{ id: 'x' }] }, 'a[id=x].n'), undefined)
  assert.throws(() => readOptionalNumericFieldPath({ a: [] }, 'a[id=x].n'), /missing/i)
  assert.throws(() => readOptionalNumericFieldPath({}, 'a.n'), /missing/i)
})

test('collection readers never invoke index accessors or custom iterators', () => {
  let invoked = false
  const items: unknown[] = []
  Object.defineProperty(items, '0', { get() { invoked = true; return { id: 'x', n: 1 } } })
  assert.throws(() => readNumericFieldPath({ items }, 'items[id=x].n'), /accessor/i)
  assert.equal(invoked, false)
  const safe = [{ id: 'x', n: 2 }]
  Object.defineProperty(safe, Symbol.iterator, { get() { invoked = true; throw new Error('Iterator invoked') } })
  assert.equal(readNumericFieldPath({ items: safe }, 'items[id=x].n'), 2)
  assert.equal(invoked, false)
})
