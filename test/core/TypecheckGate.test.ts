import test from 'node:test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import assert from 'node:assert/strict'
import { parseDiagnostics, parseCompilerOutput, compareDiagnostics } from '../../tools/typecheck-diagnostics.mjs'
import { GATE_STEPS, gateSummaryPasses, gateInputFingerprint } from '../../tools/gate-contract.mjs'

test('type signatures ignore positions and checkout location but retain messages and multiplicity', () => {
  const before = parseDiagnostics('src/a.ts(1,2): error TS2322: Type A is not B.\n  Detail.\nC:/one/node_modules/pkg/index.d.ts(2,3): error TS2304: Missing X.')
  const after = parseDiagnostics('src/a.ts(8,9): error TS2322: Type A is not B.\n  Detail.\nD:/other space/node_modules/pkg/index.d.ts(12,3): error TS2304: Missing X.')
  assert.deepEqual(compareDiagnostics(after,before).added, [])
  assert.equal(compareDiagnostics([...after,after[0]],before).added.length,1)
  assert.equal(compareDiagnostics([{...after[0],message:'Different error'}],before).added.length,1)
  assert.equal(compareDiagnostics([],before).resolved,2)
})

test('gate requires every named step once including typecheck, all successful', () => {
  const results=GATE_STEPS.map(step=>({step,ok:true,code:0}))
  assert.ok(gateSummaryPasses({ok:true,results}))
  assert.ok(!gateSummaryPasses({ok:true,results:results.filter(r=>r.step!=='typecheck')}))
  assert.ok(!gateSummaryPasses({ok:true,results:[...results.slice(1),results[1]]}))
  assert.ok(!gateSummaryPasses({ok:true,results:results.map(r=>r.step==='typecheck'?{...r,ok:false,code:1}:r)}))
})


test('global compiler errors and unrecognized output fail closed', () => {
  assert.throws(() => parseCompilerOutput("error TS5103: Invalid value for ignoreDeprecations."), /unrecognized/)
  assert.throws(() => parseCompilerOutput("src/a.ts(1,1): error TS2322: mismatch\ncompiler crashed"), /unrecognized/)
  assert.equal(parseCompilerOutput("src/a.ts(1,1): error TS2322: mismatch\n  Detail.").length, 1)
})


test('gate freshness covers tools and build metadata while excluding installed dependencies', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dndsheet-gate-'))
  try {
    fs.mkdirSync(path.join(root, 'tools', 'node_modules'), { recursive: true })
    fs.writeFileSync(path.join(root, 'tools', 'guard.mjs'), 'first')
    fs.writeFileSync(path.join(root, 'build.json'), '{}')
    const before = gateInputFingerprint(root)
    fs.writeFileSync(path.join(root, 'tools', 'node_modules', 'ignored.js'), 'installed')
    assert.equal(gateInputFingerprint(root), before)
    fs.writeFileSync(path.join(root, 'tools', 'guard.mjs'), 'changed')
    const changedTool = gateInputFingerprint(root)
    assert.notEqual(changedTool, before)
    fs.writeFileSync(path.join(root, 'build.json'), '{"build":214}')
    assert.notEqual(gateInputFingerprint(root), changedTool)
    const metadata = gateInputFingerprint(root)
    fs.writeFileSync(path.join(root, 'index.html'), '<html>entry</html>')
    const entry = gateInputFingerprint(root)
    assert.notEqual(entry, metadata)
    fs.writeFileSync(path.join(root, '.env.production'), 'PUBLIC_PATH=/DNDSheet/')
    assert.notEqual(gateInputFingerprint(root), entry)
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})
