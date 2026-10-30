import test from 'node:test'
import assert from 'node:assert/strict'
import { multiattackReferences, multiattackReferencePatch, countMultiattackReferences } from '../../src/core/domain/multiattack-composer.ts'
import type { Multiattack } from '../../src/core/domain/types.ts'
const group = (): Multiattack => ({ id: 'combo', attacks: ['a','b','a'], actions: ['spell'], extension: 'keep' } as Multiattack)
const library = [{ id: 'a', name: 'Claw' }, { id: 'b', name: 'Bite' }]
test('multiattack references retain occurrence order and resolve strictly by stable ID', () => {
 const rows=multiattackReferences(group(),'attacks',library)
 assert.deepEqual(rows.map(row=>[row.index,row.id,row.name,row.missing]),[[0,'a','Claw',false],[1,'b','Bite',false],[2,'a','Claw',false]])
 assert.equal(multiattackReferences({...group(),attacks:['Claw']},'attacks',library)[0].missing,true)
})
test('removing the last repeated reference preserves the first occurrence and source model', () => {
 const source=group(), before=JSON.stringify(source)
 const patch=multiattackReferencePatch(source,{kind:'attacks',operation:'remove',index:2,expectedId:'a'},library)
 assert.deepEqual(patch,{attacks:['a','b']});assert.equal(JSON.stringify(source),before)
 assert.equal(({...source,...patch} as Multiattack & {extension:string}).extension,'keep')
})
test('moving references edits only their own ordered list', () => {
 const source=group()
 assert.deepEqual(multiattackReferencePatch(source,{kind:'attacks',operation:'up',index:2,expectedId:'a'},library),{attacks:['a','a','b']})
 assert.deepEqual(multiattackReferencePatch(source,{kind:'actions',operation:'down',index:0,expectedId:'spell'},[]),{})
 assert.deepEqual(source.actions,['spell'])
})
test('replacement repairs a missing target without changing group identity or other occurrences', () => {
 const source={...group(),attacks:['missing','a']}
 assert.deepEqual(multiattackReferencePatch(source,{kind:'attacks',operation:'replace',index:0,expectedId:'missing',targetId:'b'},library),{attacks:['b','a']})
})
test('stale, fractional and invalid reference edits cannot change the wrong occurrence', () => {
 for(const edit of [
  {kind:'attacks',operation:'remove',index:1,expectedId:'a'},
  {kind:'attacks',operation:'remove',index:1.5,expectedId:'b'},
  {kind:'attacks',operation:'replace',index:0,expectedId:'a',targetId:'unknown'},
  {kind:'attacks',operation:'up',index:0,expectedId:'a'},
 ] as const) assert.deepEqual(multiattackReferencePatch(group(),edit,library),{})
})
test('adding references permits repeated IDs but rejects unavailable targets', () => {
 assert.deepEqual(multiattackReferencePatch(group(),{kind:'attacks',operation:'add',targetId:'a'},library),{attacks:['a','b','a','a']})
 assert.deepEqual(multiattackReferencePatch(group(),{kind:'actions',operation:'add',targetId:'a'},[]),{})
})
test('renderer collation counts prototype-like IDs safely and keeps first-seen order', () => {
 assert.deepEqual(countMultiattackReferences(['10','2','__proto__','10','constructor','__proto__']),[['10',2],['2',1],['__proto__',2],['constructor',1]])
})
