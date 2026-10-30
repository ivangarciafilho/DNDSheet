import test from 'node:test'
import assert from 'node:assert/strict'
import { entryDisplayPatch } from '../../src/core/domain/entry-display.ts'

test('entry policy patches own phase and heading only, without mutating mechanics',()=>{
  assert.deepEqual(entryDisplayPatch('stagePool','3'),{stagePool:3})
  assert.deepEqual(entryDisplayPatch('stagePool','all'),{stagePool:'all'})
  assert.deepEqual(entryDisplayPatch('customPreamble',true),{customPreamble:true})
  for(const value of [-1,0,1.5,Infinity,'oops',{},true])assert.deepEqual(entryDisplayPatch('stagePool',value),{})
  assert.deepEqual(entryDisplayPatch('customPreamble','true'),{})
  assert.deepEqual(entryDisplayPatch('attackBonus',99),{})
})
