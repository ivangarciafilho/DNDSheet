// Run the fuzz's own setup, prerequisites and complete selected step.
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import http from 'node:http'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { findChrome, cleanupChrome } from './chrome.mjs'
import { buildStepHarness } from './step-harness.mjs'
const [
  url,
  stepArg,
  fuzzFile = 'test/exhaustive-ui-fuzz.js',
  portArg = '9334',
] = process.argv.slice(2)
let child, profile, timer
const originalUrl = process.env.DNDSHEET_E2E_URL
try {
  if (!url || !stepArg)
    throw new Error(
      'usage: node tools/qa/run-step.mjs <url> <stepNumber> [fuzzFile] [port]'
    )
  const port = Number(portArg)
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error('Invalid CDP port')
  const harness = buildStepHarness(
    fs.readFileSync(fuzzFile, 'utf8'),
    Number(stepArg)
  )
  const chrome = findChrome()
  console.log(
    JSON.stringify({
      step: Number(stepArg),
      mode: 'prerequisite-replay',
      prerequisites: harness.prerequisites,
    })
  )
  process.env.DNDSHEET_E2E_URL = url
  const launch = (executable, args) => {
    profile = args
      .find((arg) => arg.startsWith('--user-data-dir='))
      ?.slice('--user-data-dir='.length)
    child = spawn(executable, args, { windowsHide: true })
    child.on('error', (error) =>
      console.error('Chrome launch failed:', error.message)
    )
    return child
  }
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor
  const execute = new AsyncFunction(
    'assert',
    'spawn',
    'http',
    'fs',
    'path',
    'os',
    'CHROME_PATH',
    'PORT',
    `let activeBrowser;\n${harness.body}`
  )
  const timeout = Number(process.env.DNDSHEET_RUN_STEP_TIMEOUT_MS || 600000)
  if (!Number.isFinite(timeout) || timeout <= 0)
    throw new Error('Invalid run-step timeout')
  timer = setTimeout(async () => {
    console.error(`Step ${stepArg} timed out after ${timeout}ms`)
    try {
      await cleanupChrome(child, profile)
    } finally {
      process.exit(1)
    }
  }, timeout)
  await execute(assert, launch, http, fs, path, os, chrome, port)
  console.log(`Step ${stepArg} and its prerequisite assertions passed`)
} catch (error) {
  console.error('Step/prerequisite failure:', error.stack || error)
  process.exitCode = 1
} finally {
  clearTimeout(timer)
  if (originalUrl === undefined) delete process.env.DNDSHEET_E2E_URL
  else process.env.DNDSHEET_E2E_URL = originalUrl
  try {
    await cleanupChrome(child, profile)
  } catch (error) {
    console.error('Chrome cleanup failed:', error.message)
    process.exitCode = 1
  }
}
