import test from 'node:test'
import assert from 'node:assert/strict'
import { dependencyOrder, detectCycles, resolveNumeric, isNumericBinding, bindingSource, buildFormulaContext, BindingGraphError } from '../../src/core/domain/formula.ts'
import type { NumericBinding } from '../../src/core/domain/formula.ts'
const paths: Record<string, readonly string[]> = { CHA_MOD: ['stats.CHA'], CHA: ['stats.CHA'], PB: ['proficiency'], AC: ['AC'], SPELL_DC: ['saveDc'] }
const sources = (ref: string): readonly string[] => paths[ref] || []

test('literal bindings resolve with existing styles and reject malformed imported values safely',()=>{
 const ctx=buildFormulaContext({})
 assert.equal(isNumericBinding({mode:'literal',value:0}),true)
 assert.equal(bindingSource({mode:'literal',value:-2}),'-2')
 assert.equal(resolveNumeric({mode:'literal',value:12},ctx).value,12)
 assert.equal(resolveNumeric({mode:'literal',value:2},ctx,{style:'bonus'}).text,'+2')
 for(const value of [NaN,Infinity,'12',null]){const invalid={mode:'literal',value} as unknown as NumericBinding;assert.equal(isNumericBinding(invalid),false);const result=resolveNumeric(invalid,ctx,{fallback:7});assert.equal(result.ok,false);assert.equal(result.value,7)}
})
test('dependency ordering puts bound sources first and is stable across insertion order',()=>{
 const bindings={saveDc:{mode:'formula',expr:'8 + PB + CHA_MOD'},'stats.CHA':{mode:'literal',value:20},proficiency:{mode:'literal',value:3}} as const
 const before=JSON.stringify(bindings)
 assert.deepEqual(dependencyOrder(bindings,sources),['proficiency','stats.CHA','saveDc'])
 assert.deepEqual(dependencyOrder(Object.fromEntries(Object.entries(bindings).reverse()),sources),['proficiency','stats.CHA','saveDc'])
 assert.deepEqual(detectCycles(bindings,sources),[])
 assert.equal(JSON.stringify(bindings),before)
})
test('cycles report deterministic strongly connected field groups including self bindings',()=>{
 const bindings={AC:{mode:'ref',ref:'SPELL_DC'},saveDc:{mode:'ref',ref:'AC'},'stats.CHA':{mode:'formula',expr:'CHA + 1'}} as const
 assert.deepEqual(detectCycles(bindings,sources),[['AC','saveDc'],['stats.CHA']])
 assert.throws(()=>dependencyOrder(bindings,sources),error=>error instanceof BindingGraphError&&error.cycles.length===2)
})
test('aliases and function/dice operands contribute dependencies, unbound sources stay external',()=>{
 const seen:string[]=[]
 const bindings={dice:{mode:'formula',expr:'max(1, CHA_MOD) d 6 + PB'},'stats.CHA':{mode:'literal',value:18}} as const
 assert.deepEqual(dependencyOrder(bindings,(ref)=>{seen.push(ref);return sources(ref)}),['stats.CHA','dice'])
 assert.ok(seen.includes('CHA_MOD')&&seen.includes('PB'))
 assert.deepEqual(dependencyOrder({dc:{mode:'ref',ref:'DC:CHA'}},ref=>{assert.equal(ref,'DC_CHA');return []}),['dc'])
})
test('invalid formulas, unknown references and oversized graphs fail explicitly instead of a partial order',()=>{
 for(const binding of [{mode:'formula',expr:'PB +'}, {mode:'ref',ref:'MISSING'}, {mode:'formula',expr:'MISSING + 1'}] as NumericBinding[])assert.throws(()=>dependencyOrder({field:binding},sources),BindingGraphError)
 const huge=Object.fromEntries(Array.from({length:513},(_,index)=>['f'+index,{mode:'literal',value:1}])) as Record<string,NumericBinding>
 assert.throws(()=>dependencyOrder(huge,sources),BindingGraphError)
})

test('finite literal magnitudes bypass formula notation parsing',()=>{
 const ctx=buildFormulaContext({})
 for(const value of [1e-7,1e21,-1e21]){const result=resolveNumeric({mode:'literal',value},ctx,{fallback:7});assert.equal(result.ok,true);assert.equal(result.value,value)}
})
test('reference mode accepts one catalog identity, never an expression or numeric literal',()=>{
 for(const ref of ['PB + 1','12','max(1, PB)'])assert.throws(()=>dependencyOrder({field:{mode:'ref',ref}},sources),BindingGraphError)
 assert.deepEqual(dependencyOrder({field:{mode:'ref',ref:'DC:CHA'}},()=>[]),['field'])
})
