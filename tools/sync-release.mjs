import fs from 'node:fs'
import { LATEST_RELEASE_METADATA } from '../src/data/RELEASE_NOTES.ts'

const buildJson = JSON.parse(fs.readFileSync('build.json', 'utf8'))
const pkgJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))

const checks = [
  ['build.json build === LATEST_RELEASE_METADATA.latestBuild', String(buildJson.build) === LATEST_RELEASE_METADATA.latestBuild],
  ['package.json version === LATEST_RELEASE_METADATA.version', pkgJson.version === LATEST_RELEASE_METADATA.version],
  ['en-US bullets non-empty', LATEST_RELEASE_METADATA.locales['en-US'].bullets.length > 0],
  ['pt-BR bullets non-empty', LATEST_RELEASE_METADATA.locales['pt-BR'].bullets.length > 0],
]

for (const [label, ok] of checks) {
  if (!ok) {
    console.error(`Release sync mismatch: ${label}`)
    process.exit(1)
  }
}

console.log(`Release metadata synced: v${pkgJson.version} build ${buildJson.build} (${LATEST_RELEASE_METADATA.locales['en-US'].title})`)
