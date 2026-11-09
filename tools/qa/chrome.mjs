import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
export function findChrome({
  env = process.env,
  platform = process.platform,
  exists = fs.existsSync,
} = {}) {
  const override = env.DNDSHEET_CHROME_PATH || env.CHROME_PATH
  const candidates = override
    ? [override]
    : platform === 'win32'
    ? [env.PROGRAMFILES, env['PROGRAMFILES(X86)'], env.LOCALAPPDATA]
        .filter(Boolean)
        .flatMap((base) => [
          path.join(base, 'Google/Chrome/Application/chrome.exe'),
          path.join(base, 'Microsoft/Edge/Application/msedge.exe'),
        ])
    : platform === 'darwin'
    ? [
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
      ]
    : [
        '/usr/bin/google-chrome',
        '/usr/bin/google-chrome-stable',
        '/usr/bin/chromium',
        '/usr/bin/chromium-browser',
      ]
  const found = candidates.find(exists)
  if (!found)
    throw new Error(
      `Chrome/Edge executable unavailable. Set DNDSHEET_CHROME_PATH to its full path. Checked: ${
        candidates.join(', ') || '(no installed candidates)'
      }`
    )
  return found
}
export async function cleanupChrome(child, profile, timeoutMs = 5000) {
  if (child && child.exitCode === null && child.signalCode === null) {
    let timer
    const exited = new Promise((resolve) => child.once('exit', resolve))
    child.kill()
    await Promise.race([
      exited,
      new Promise((resolve) => {
        timer = setTimeout(resolve, timeoutMs)
      }),
    ])
    clearTimeout(timer)
    if (child.exitCode === null && child.signalCode === null)
      child.kill('SIGKILL')
  }
  if (
    profile &&
    (path.dirname(path.resolve(profile)) !== path.resolve(os.tmpdir()) ||
      !/^(?:chrome-fuzz-|run-step-|dndsheet-probe-)/.test(
        path.basename(profile)
      ))
  )
    throw new Error('Refusing cleanup outside owned temporary browser profiles')
  if (profile)
    await fs.promises.rm(profile, {
      recursive: true,
      force: true,
      maxRetries: 10,
      retryDelay: 150,
    })
}
