import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveAppAsset } from '../../src/core/domain/asset-url.ts'

test('root-relative app assets follow the deployment base', () => {
  assert.equal(resolveAppAsset('/homebrew/masks/a.png', '/DNDSheet/'), '/DNDSheet/homebrew/masks/a.png')
  assert.equal(resolveAppAsset('/homebrew/masks/a.png', '/'), '/homebrew/masks/a.png')
})

test('absolute, protocol-relative, data and blob URLs are untouched', () => {
  for (const url of ['https://x.test/a.png', '//cdn.test/a.png', 'data:image/png;base64,AA', 'blob:http://x/1', 'relative/a.png']) {
    assert.equal(resolveAppAsset(url, '/DNDSheet/'), url)
  }
})

test('already-based paths and empty values are left as they are', () => {
  assert.equal(resolveAppAsset('/DNDSheet/homebrew/a.png', '/DNDSheet/'), '/DNDSheet/homebrew/a.png')
  assert.equal(resolveAppAsset('', '/DNDSheet/'), '')
  assert.equal(resolveAppAsset(undefined, '/DNDSheet/'), '')
})
