/** Stable JSON-model addresses. Array positions are never persisted identities. */
export interface NumericFieldSegment {
  readonly name: string
  readonly selector?: { readonly kind: 'id' | 'key' | 'level'; readonly value: string }
}
const forbidden = new Set(['__proto__', 'prototype', 'constructor'])

export class NumericFieldPathError extends Error {
  readonly code: 'missing' | 'ambiguous' | 'accessor' | 'collection'
  constructor(code: NumericFieldPathError['code'], message: string) {
    super(message)
    this.name = 'NumericFieldPathError'
    this.code = code
  }
}

export function parseNumericFieldPath(path: string): readonly NumericFieldSegment[] {
  if (typeof path !== 'string' || !path || path.length > 4096) throw new Error('Invalid field path length')
  const segments: NumericFieldSegment[] = []
  let offset = 0
  while (offset < path.length) {
    const match = /^([A-Za-z][A-Za-z0-9_]*)(?:\[(id|key|level)=([^\]]*)\])?/.exec(path.slice(offset))
    if (!match || forbidden.has(match[1])) throw new Error('Invalid field path segment')
    const name = match[1]
    let selector: NumericFieldSegment['selector']
    if (match[2]) {
      const kind = match[2] as 'id' | 'key' | 'level'
      const encoded = match[3]
      let value: string
      try { value = decodeURIComponent(encoded) } catch { throw new Error('Invalid field identity encoding') }
      if (!value || encodeURIComponent(value) !== encoded) throw new Error('Noncanonical field identity')
      if (kind === 'key' && !/^[A-Z][A-Z0-9_]*$/.test(value)) throw new Error('Invalid semantic key')
      if (kind === 'level' && !/^[1-9]$/.test(value)) throw new Error('Invalid spell level')
      selector = Object.freeze({ kind, value })
    }
    segments.push(Object.freeze({ name, ...(selector ? { selector } : {}) }))
    offset += match[0].length
    if (offset === path.length) break
    if (path[offset] !== '.' || offset + 1 === path.length) throw new Error('Invalid field path separator')
    offset++
    if (segments.length >= 32) throw new Error('Field path exceeds depth limit')
  }
  return Object.freeze(segments)
}

function ownValue(target: unknown, key: string, optional = false): unknown {
  if (target === null || typeof target !== 'object') throw new NumericFieldPathError('missing', 'Missing field parent')
  const descriptor = Object.getOwnPropertyDescriptor(target, key)
  if (!descriptor) {
    if (optional) return undefined
    throw new NumericFieldPathError('missing', `Missing field: ${key}`)
  }
  if (!('value' in descriptor)) throw new NumericFieldPathError('accessor', 'Accessor fields are not JSON-model targets')
  return descriptor.value
}

/** Read only. Missing/ambiguous identities and inherited/accessor properties fail. */
export function readNumericFieldPath(model: unknown, path: string): unknown {
  return readPath(model, path, false)
}

/** Only a missing final property may be absent; parent identities must exist. */
export function readOptionalNumericFieldPath(model: unknown, path: string): unknown {
  return readPath(model, path, true)
}

function readPath(model: unknown, path: string, optional: boolean): unknown {
  let value = model
  const segments = parseNumericFieldPath(path)
  for (const [index, segment] of segments.entries()) {
    value = ownValue(value, segment.name, optional && index === segments.length - 1 && !segment.selector)
    const selector = segment.selector
    if (!selector) continue
    if (!Array.isArray(value)) throw new NumericFieldPathError('collection', 'Expected collection for field selector')
    if (selector.kind === 'level') {
      value = ownValue(value, String(Number(selector.value) - 1))
      continue
    }
    const matches: unknown[] = []
    // Inspect own data entries without invoking index accessors or iterators.
    const length = ownValue(value, 'length') as number
    for (let index = 0; index < length; index++) {
      const entry = Object.getOwnPropertyDescriptor(value, String(index))
      if (!entry) continue
      if (!('value' in entry)) throw new NumericFieldPathError('accessor', 'Accessor collection entries are not supported')
      const item: unknown = entry.value
      if (!item || typeof item !== 'object') continue
      const descriptor = Object.getOwnPropertyDescriptor(item, selector.kind)
      if (!descriptor) continue
      if (!('value' in descriptor)) throw new NumericFieldPathError('accessor', 'Accessor collection identities are not supported')
      const identity = descriptor.value
      const candidate = selector.kind === 'key' && typeof identity === 'string' ? identity.toUpperCase() : identity
      if (candidate === selector.value) matches.push(item)
    }
    if (matches.length !== 1) throw new NumericFieldPathError(matches.length ? 'ambiguous' : 'missing', matches.length ? 'Ambiguous field identity' : 'Missing field identity')
    value = matches[0]
  }
  return value
}
