import assert from 'node:assert/strict'
import { test } from 'node:test'
import fs from 'node:fs'
import { buildStepHarness } from '../../tools/qa/step-harness.mjs'
import { findChrome, cleanupChrome } from '../../tools/qa/chrome.mjs'

test('complete selected step preserves interpolation, escaping, helpers and assertions', async () => {
  const source =
    'async function runFuzz(){const consoleErrors=[],runtimeExceptions=[],ws={close(){}};const helper="x";async function evalInPage(x){return x};console.log("--- Step 1: setup"); const previous=7; console.log("--- Step 2: selected"); const result=await evalInPage(`a${helper}b`); assert.equal(result,"axb"); assert.equal(previous,7); console.log("--- Step 3: later"); throw Error("must not run");}'
  const harness = buildStepHarness(source, 2)
  assert.deepEqual(harness.prerequisites, [1])
  const AsyncFunction = Object.getPrototypeOf(async function () { /* constructor probe */ }).constructor
  await new AsyncFunction('assert', harness.body)(assert)
})
test('false assertions propagate instead of reporting a page result as passing', async () => {
  const source =
    'async function runFuzz(){const consoleErrors=[],runtimeExceptions=[],ws={close(){}};console.log("--- Step 1: fail");assert.equal(false,true); console.log("--- Step 2: later");}'
  const AsyncFunction = Object.getPrototypeOf(async function () { /* constructor probe */ }).constructor
  await assert.rejects(
    new AsyncFunction('assert', buildStepHarness(source, 1).body)(assert),
    /false !== true/
  )
})
test('all real fuzz steps parse as complete JavaScript with prerequisite scope', () => {
  const source = fs.readFileSync('test/exhaustive-ui-fuzz.js', 'utf8')
  const AsyncFunction = Object.getPrototypeOf(async function () { /* constructor probe */ }).constructor
  for (let step = 1; step <= 58; step++)
    assert.doesNotThrow(
      () => new AsyncFunction(buildStepHarness(source, step).body)
    )
  assert.throws(() => buildStepHarness(source, 59), /No Step/)
})
test('Chrome override is authoritative and unavailable diagnostic names searched path', () => {
  assert.equal(
    findChrome({
      env: { DNDSHEET_CHROME_PATH: '/custom' },
      exists: (p) => p === '/custom',
    }),
    '/custom'
  )
  assert.throws(
    () =>
      findChrome({
        env: { DNDSHEET_CHROME_PATH: '/missing' },
        exists: () => false,
      }),
    /DNDSHEET_CHROME_PATH.*\/missing/
  )
  assert.equal(
    findChrome({
      env: { PROGRAMFILES: 'C:/Apps' },
      platform: 'win32',
      exists: (p) => p.includes('Edge'),
    }).includes('Edge'),
    true
  )
})

test('template escapes are evaluated once by the original harness', async () => {
  const slash = String.fromCharCode(92),
    tick = String.fromCharCode(96)
  const source =
    'async function runFuzz(){const consoleErrors=[],runtimeExceptions=[],ws={close(){}};console.log("--- Step 1: escape"); const value=' +
    tick +
    'left' +
    slash.repeat(2) +
    'right' +
    tick +
    '; assert.equal(value,"left"+String.fromCharCode(92)+"right");console.log("--- Step 2: stop");}'
  const AsyncFunction = Object.getPrototypeOf(async function () { /* constructor probe */ }).constructor
  await new AsyncFunction('assert', buildStepHarness(source, 1).body)(assert)
})

test('browser cleanup refuses a directory outside its owned temporary profiles', async () => {
  await assert.rejects(cleanupChrome(null, process.cwd()), /Refusing cleanup/)
})
