import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'
import { LATEST_RELEASE_METADATA } from '../../src/data/RELEASE_NOTES.ts'

test('D4.3/C5.R7: build.json, package.json, and structured bilingual release notes stay synchronized', () => {
  const buildJson = JSON.parse(fs.readFileSync('build.json', 'utf8')) as { build: string }
  const pkgJson = JSON.parse(fs.readFileSync('package.json', 'utf8')) as { version: string }

  assert.equal(String(buildJson.build), LATEST_RELEASE_METADATA.latestBuild)
  assert.equal(pkgJson.version, LATEST_RELEASE_METADATA.version)
  assert.ok(LATEST_RELEASE_METADATA.locales['en-US'].bullets.length >= 3)
  assert.ok(LATEST_RELEASE_METADATA.locales['pt-BR'].bullets.length >= 3)
  assert.ok(LATEST_RELEASE_METADATA.locales['en-US'].title.includes(buildJson.build))
  assert.ok(LATEST_RELEASE_METADATA.locales['pt-BR'].title.includes(buildJson.build))
})
