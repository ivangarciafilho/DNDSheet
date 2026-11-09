// Publish one gated build: release candidate folder + tag + gh-pages commit, refusing anything unproven.
// Usage: node tools/publish.mjs --build 211 --slug some-slug --base <prevCommit> [--push]
// Preconditions: `npm run gate` passed in this tree (it leaves .gate/summary.json, dist/spa and dist-pages).
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith('--') ? [...acc, [a.slice(2), all[i + 1] && !all[i + 1].startsWith('--') ? all[i + 1] : true]] : acc), []))
const tree = path.resolve('.')
const repo = path.resolve(args.repo || 'F:/AI_Resources/DNDSheet')
const remote = args.remote || 'https://github.com/ivangarciafilho/DNDSheet.git'
const fail = (message) => { console.error('refusing: ' + message); process.exit(1) }
if (!args.build || !args.slug || !args.base) fail('need --build, --slug and --base')
const tag = `rc-2.4.3-build-${args.build}-${args.slug}`
const git = (gitArgs, env = {}) => execFileSync('git', ['-C', repo, ...gitArgs], { env: { ...process.env, ...env }, encoding: 'utf8' }).trim()

// 1. The gate must have passed on this tree, and its outputs must be newer than every source file.
const summaryFile = path.join(tree, '.gate', 'summary.json')
if (!fs.existsSync(summaryFile)) fail('no .gate/summary.json; run npm run gate first')
const summary = JSON.parse(fs.readFileSync(summaryFile, 'utf8'))
if (!summary.ok || summary.results.length !== 9) fail('gate summary is not a 9/9 pass')
const newestSource = ['src', 'test', 'public'].flatMap((dir) => walk(path.join(tree, dir))).reduce((max, f) => Math.max(max, fs.statSync(f).mtimeMs), 0)
if (fs.statSync(summaryFile).mtimeMs < newestSource) fail('sources changed after the gate ran')

// 2. Pages output lives in dist-pages/ (not dist-pages/spa/) and must carry the /DNDSheet/ base.
const pages = path.join(tree, 'dist-pages'), spa = path.join(tree, 'dist', 'spa')
const index = path.join(pages, 'index.html')
if (!fs.existsSync(index) || !fs.readFileSync(index, 'utf8').includes('/DNDSheet/assets/')) fail('dist-pages/index.html missing or without the /DNDSheet/ base')
if (fs.existsSync(path.join(pages, 'spa'))) fail('dist-pages/spa exists; that is the wrong publish root')
fs.writeFileSync(path.join(pages, '.nojekyll'), '')
const pageFiles = walk(pages)
if (pageFiles.length < 20) fail(`dist-pages has only ${pageFiles.length} files`)

// 3. Commit and tag must exist and agree.
const commit = args.commit || git(['rev-parse', 'build185-repairs'])
if (git(['rev-parse', `${commit}^`]) !== git(['rev-parse', args.base])) fail(`commit ${commit} is not a child of ${args.base}`)

// 4. Release candidate folder (never overwritten).
const rcDir = path.join(repo, '.codex-temp', 'release-candidates', tag)
const meta = path.join(os.tmpdir(), `${tag}.json`)
fs.writeFileSync(meta, JSON.stringify({ build: Number(args.build), commit: commit.slice(0, 7), base: args.base, tag, verification: { gate: summary.results.map((r) => `${r.step}:${r.ok ? 'pass' : 'FAIL'}`).join(' ') }, boundary: 'statblock-overhaul untouched' }, null, 2))
execFileSync(process.execPath, [path.join(tree, 'tools', 'make-rc.mjs'), spa, rcDir, meta], { stdio: 'inherit' })

// 5. Tag and gh-pages commit through a private index, so no working tree is touched.
if (!git(['tag', '--list', tag])) git(['tag', tag, commit])
const index2 = path.join(os.tmpdir(), `gh-pages-${args.build}.idx`)
fs.rmSync(index2, { force: true })
const env = { GIT_INDEX_FILE: index2 }
git(['--work-tree', pages, 'add', '-A', '.'], env)
const pagesTree = git(['write-tree'], env)
const count = git(['ls-tree', '-r', '--name-only', pagesTree]).split('\n').filter(Boolean).length
if (count !== pageFiles.length) fail(`pages tree has ${count} files, disk has ${pageFiles.length}`)
const pagesCommit = git(['commit-tree', pagesTree, '-p', 'gh-pages', '-m', `docs: publish build ${args.build}`])
git(['update-ref', 'refs/heads/gh-pages', pagesCommit])
console.log(`tag ${tag} -> ${commit.slice(0, 7)}; gh-pages ${pagesCommit.slice(0, 7)} (${count} files)`)
if (args.push) console.log(git(['push', remote, 'build185-repairs', 'gh-pages', tag]))

function walk(dir) { return fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)])) : [] }
