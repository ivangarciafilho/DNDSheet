import { aggregateSpellcastingSources, spellcastingRuleClass } from '../usecases/AutoSyncSpellcasting.ts'
import type { CastingContribution, MulticlassCalculationResult, SpellcastingSourcesInput } from '../usecases/AutoSyncSpellcasting.ts'
import { ordinalLabel, pactResourceSummary, spellRowRecovery } from './spell-plate.ts'
export interface ResourceSource { className?:string; class?:string; subclass?:string; resourceType?:string; resourceValue?:number; contribution?:CastingContribution; slots?:number[]; refreshRate?:string; customRefreshRate?:string }
/** Select the receiving pool without allowing a Warlock class label to override a custom route.
 * Saved native source slot arrays are authored overrides; an explicit custom route supersedes them. */
export function castingResourceView(source:ResourceSource, combined:MulticlassCalculationResult|undefined) {
 const name=source.className||source.class||''
 const custom=source.contribution?.mode==='custom'
 const resourceType=custom?source.contribution!.target:source.resourceType|| (name.toLowerCase()==='warlock'?'pact':'slots')
 if(!combined||(!custom&&!spellcastingRuleClass(name, source.subclass))||(!custom&&['points','focus','at_will'].includes(resourceType)))return {className:name,pactPool:undefined as boolean|undefined,resourceType,slots:source.slots,resourceValue:source.resourceValue}
 const pact=custom?resourceType==='pact':resourceType==='pact'||name.toLowerCase()==='warlock'
 return {className:name,pactPool:pact,resourceType:pact?'pact':resourceType,
  slots:!custom && Array.isArray(source.slots) ? source.slots : pact?combined.warlockSlots||[]:resourceType==='slots'?combined.standardSlots:[],
  resourceValue:resourceType==='points'?combined.customPoints:resourceType==='focus'?combined.customFocus:source.resourceValue}
}
/** Counts are shared; source rows retain their explicitly configured recovery cadence. */
export function castingResourceSummary(source:SpellcastingSourcesInput,stats:Record<string,number>,proficiency:number):string|undefined {
 if(!(source.classes?.length||source.contribution?.mode==='custom'))return undefined
 const result=aggregateSpellcastingSources(source,stats,proficiency);if(!result)return undefined
 const entries: ResourceSource[] = [...(source.primarySourceEnabled === false ? [] : [{...source,className:source.class}]), ...(source.classes || [])]
 const pactRecovery = (entry: ResourceSource) => spellRowRecovery(1, undefined, { ...entry, pactPool: true })
 const overrides = entries.filter(entry => {
  if(entry.contribution?.mode === 'custom' || !Array.isArray(entry.slots) || ['points','focus','at_will'].includes(entry.resourceType || '')) return false
  const pact=entry.resourceType==='pact'||entry.className?.toLowerCase()==='warlock'
  const computed=pact?result.warlockSlots||[]:result.standardSlots
  return Array.from({length:9},(_,i)=>Number(entry.slots?.[i])||0).some((value,i)=>value!==(computed[i]||0))
 })
 // Saved source overrides are authoritative. A computed global count would contradict those rows.
 if(overrides.length) {
  const sourceCounts=entries.flatMap(entry=>{
   const pool=castingResourceView(entry,result)
   if(!['slots','pact'].includes(pool.resourceType))return []
   const values=Array.from({length:9},(_,i)=>Math.max(0,Math.trunc(Number(pool.slots?.[i])||0)))
   const total=values.reduce((sum,value)=>sum+value,0),highest=values.reduce((max,value,i)=>value?i+1:max,0)
   if(!total)return []
   const label=[entry.className||entry.class||'Spellcasting',entry.subclass].filter(Boolean).join(' / ')
   return [label+': '+(pool.pactPool ? pactResourceSummary(values, pactRecovery(entry)) : total+' Spell Slots through '+ordinalLabel(highest)+' level')]
  })
  if(result.customPoints)sourceCounts.push(result.customPoints+' Custom Spell Points')
  if(result.customFocus)sourceCounts.push(result.customFocus+' Custom Focus Points')
  return sourceCounts.join('; ')||undefined
 }
 const parts:string[]=[]
 const slots=(values:number[],label:string)=>{const count=values.reduce((a,b)=>a+b,0),highest=values.reduce((max,n,i)=>n?i+1:max,0);if(count)parts.push(count+' Shared Spell Slots through '+ordinalLabel(highest)+' level')}
 slots(result.standardSlots,'Spell Slots')
 const pactSources = entries.filter(entry => castingResourceView(entry, result).pactPool)
 const recoveries = [...new Set(pactSources.map(pactRecovery))]
 const pact = pactResourceSummary(result.warlockSlots || [], recoveries.length === 1 ? recoveries[0] : recoveries.length > 1 ? 'hidden' : undefined)
 if (pact) parts.push(pact)
 if(result.customPoints)parts.push(result.customPoints+' Custom Spell Points')
 if(result.customFocus)parts.push(result.customFocus+' Custom Focus Points')
 return parts.join(' \u00b7 ')||undefined
}
