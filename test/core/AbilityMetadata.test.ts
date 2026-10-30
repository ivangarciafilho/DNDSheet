import test from 'node:test'
import assert from 'node:assert/strict'
import { abilityHeader, abilityIdentity, text2024 } from '../../src/core/domain/ability-grammar.ts'
import { defaultAction } from '../../src/core/domain/types.ts'

test('metadata preserves authored values and matches the plate word order',()=>{
  const action={...defaultAction('a'),school:'Evocation',spellLevel:'2nd Level',components:['V','S'],duration:'1 minute'}
  const before=JSON.stringify(action)
  assert.deepEqual(abilityHeader(action),{discipline:'2nd Level Evocation',components:['V','S'],duration:'1 minute'})
  const text=text2024({...action,targeting:{kind:'allies'}})
  assert.ok(text.startsWith('2nd Level Evocation (V, S); Duration: 1 minute.'))
  assert.equal(JSON.stringify(action),before)
  assert.equal(abilityHeader({...action,spellLevel:'Cantrip'}).discipline,'Evocation Cantrip')
})
test('none/blank fields and instantaneous duration add no metadata noise',()=>{
  assert.deepEqual(abilityHeader({school:'None',spellLevel:'',components:[],duration:'Instantaneous'}),{discipline:'',components:[],duration:''})
  assert.equal(text2024({...defaultAction('a'),description:'Preserved prose.',targeting:{}}),'Preserved prose.')
})
test('attack prose retains target qualifiers, area, origin and planes exactly once',()=>{
  const action={...defaultAction('a'),attackSource:'spell' as const,attackReach:'ranged' as const,attackBonus:7,
    targeting:{count:3,countMode:'up_to' as const,kind:'creatures',qualifier:'which you can see',range:{distance:120,unit:'ft' as const,relation:'within' as const,origin:'you'},area:{shape:'sphere',distance:10,unit:'ft' as const},planes:['Ethereal']}}
  const text=text2024(action)
  for(const value of ['up to three creatures','which you can see','within 120 ft. of you','10-foot sphere','Ethereal'])assert.ok(text.includes(value),value)
  assert.equal((text.match(/120/g)||[]).length,1)
})
test('utility abilities retain scope without inventing an attack or save',()=>{
  const text=text2024({...defaultAction('a'),targeting:{count:'all',kind:'allies',qualifier:'willing to receive the effect'}})
  assert.equal(text,'Targets: all allies willing to receive the effect.')
  assert.doesNotMatch(text,/Attack|Saving Throw/)
})
test('metadata HTML uses semantic emphasis, while literal angle brackets remain text',()=>{
  const action={...defaultAction('a'),school:'Arcane <custom>',components:['V'],duration:'1 minute',targeting:{}}
  const text=text2024(action,{}, {markup:'html'})
  assert.ok(text.includes('<i>Arcane &lt;custom&gt; (V); Duration: 1 minute.</i>'))
  assert.ok(text2024(action).includes('Arcane <custom>'))
})

// Components belong beside the caller-owned entry name when a full heading is rendered.
test('heading-aware prose leaves components in the lead exactly once',()=>{
  const action={...defaultAction('a'),name:'Mantle',school:'Abjuration',spellLevel:'2nd Level',components:['V','S'],duration:'1 minute',targeting:{}}
  assert.equal(text2024(action,{}, {componentsInLead:true}), '2nd Level Abjuration; Duration: 1 minute.')
  assert.ok(text2024(action).includes('(V, S)'))
})

test('HTML heading identity escapes authored component markup while text preserves it',()=>{
  const action={...defaultAction('a'),name:'Mantle <custom>',components:['M <pearl>','S & V']}
  assert.equal(abilityIdentity(action,'html'),'Mantle &lt;custom&gt; (M &lt;pearl&gt;, S &amp; V)')
  assert.equal(abilityIdentity(action),'Mantle <custom> (M <pearl>, S & V)')
})
