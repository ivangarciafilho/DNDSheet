// Production bundle size ceilings (F4.3). Enforced in pages-assets gate step, ratchet --bundle, and publish.
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import { pathToFileURL } from 'node:url'

export const BUNDLE_BUDGETS = Object.freeze({
  maxChunkRawBytes: 1536 * 1024,
  maxChunkGzipBytes: 450 * 1024,
  maxTotalJsRawBytes: 3400 * 1024,
  maxTotalJsGzipBytes: 1000 * 1024,
})

export function checkBundleBudgets(assetsDir, budgets = BUNDLE_BUDGETS) {
  if (!fs.existsSync(assetsDir)) {
    return {
      ok: false,
      violations: [`Assets directory not found: ${assetsDir}`],
      fileCount: 0,
      largestChunkName: '',
      largestChunkRaw: 0,
      largestChunkGzip: 0,
      totalJsRaw: 0,
      totalJsGzip: 0,
    }
  }

  const jsNames = fs.readdirSync(assetsDir).filter((name) => name.endsWith('.js'))
  if (!jsNames.length) {
    return {
      ok: false,
      violations: [`No JS bundle chunks found in ${assetsDir}`],
      fileCount: 0,
      largestChunkName: '',
      largestChunkRaw: 0,
      largestChunkGzip: 0,
      totalJsRaw: 0,
      totalJsGzip: 0,
    }
  }

  let largestChunkName = ''
  let largestChunkRaw = 0
  let largestChunkGzip = 0
  let totalJsRaw = 0
  let totalJsGzip = 0

  for (const name of jsNames) {
    const raw = fs.readFileSync(path.join(assetsDir, name))
    const gzip = zlib.gzipSync(raw, { level: 9 }).length
    totalJsRaw += raw.length
    totalJsGzip += gzip
    if (raw.length > largestChunkRaw) {
      largestChunkName = name
      largestChunkRaw = raw.length
      largestChunkGzip = gzip
    }
  }

  const violations = []
  if (largestChunkRaw > budgets.maxChunkRawBytes) {
    violations.push(`largest chunk raw ${largestChunkName} (${largestChunkRaw} B > ${budgets.maxChunkRawBytes} B)`)
  }
  if (largestChunkGzip > budgets.maxChunkGzipBytes) {
    violations.push(`largest chunk gzip ${largestChunkName} (${largestChunkGzip} B > ${budgets.maxChunkGzipBytes} B)`)
  }
  if (totalJsRaw > budgets.maxTotalJsRawBytes) {
    violations.push(`total JS raw (${totalJsRaw} B > ${budgets.maxTotalJsRawBytes} B)`)
  }
  if (totalJsGzip > budgets.maxTotalJsGzipBytes) {
    violations.push(`total JS gzip (${totalJsGzip} B > ${budgets.maxTotalJsGzipBytes} B)`)
  }

  return {
    ok: violations.length === 0,
    violations,
    fileCount: jsNames.length,
    largestChunkName,
    largestChunkRaw,
    largestChunkGzip,
    totalJsRaw,
    totalJsGzip,
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const targetDir = path.resolve(process.argv[2] || 'dist-pages/assets')
  const result = checkBundleBudgets(targetDir)
  console.log(JSON.stringify(result, null, 2))
  if (!result.ok) process.exit(1)
}
