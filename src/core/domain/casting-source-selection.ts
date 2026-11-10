import { getSpellSlotsForClass, spellcastingRuleClass, calculateSpellcastingMetrics } from '../usecases/AutoSyncSpellcasting.ts'
import { subclassSpells } from './catalogs/subclass-spells.ts'

export interface CastingSourceSelection {
 className: string
 subclass?: string
 level: number
 bypassSlotFilter?: boolean
 spells?: string[]
 resourceType?: string
}
export interface CastingSpellOption { value: string; label: string; level: number; class?: string[]; custom?: boolean }
/** Selection ceilings use this source's progression, never the combined multiclass slots. */
export function sourceSpellCeiling(source: CastingSourceSelection): number | undefined {
 const rulesClass=spellcastingRuleClass(source.className,source.subclass)
 if(!rulesClass)return undefined
 const level=Math.max(0,Math.min(20,Math.trunc(Number(source.level)||0)))
 if(!level)return 0
 const slots=getSpellSlotsForClass(rulesClass,level)
 return slots.reduce((max,count,index)=>count>0?index+1:max,0)
}
export function sourceSpellOptions<T extends CastingSpellOption>(options: readonly T[],source:CastingSourceSelection,level:number):T[] {
 const ceiling=sourceSpellCeiling(source), own=subclassSpells(source.subclass)
 const rulesClass=spellcastingRuleClass(source.className,source.subclass)
 const classList=rulesClass==='third caster'?'wizard':rulesClass
 const recognized=rulesClass!==undefined
 return options.filter(option=>option.level===level && (source.bypassSlotFilter||ceiling===undefined||level===0||level<=ceiling) &&
  (!recognized||option.custom||own.includes(option.value)||(option.class??[]).some(cls=>cls.toLowerCase()===classList)))
  .map(option=>own.includes(option.value)&&!option.custom?{...option,label:`${option.label} (subclass)`}:option)
  .sort((a,b)=>a.label.localeCompare(b.label))
}
/** Existing assignments stay visible even after a class, subclass or level changes. */
export function sourceAssignedAtLevel(options:readonly CastingSpellOption[],assigned:readonly string[],level:number):string[] {
 return assigned.filter(id=>(options.find(option=>option.value===id)?.level??0)===level)
}
export function replaceSourceLevelSpells(options:readonly CastingSpellOption[],assigned:readonly string[],level:number,next:readonly string[]):string[]{
 const current=new Set(sourceAssignedAtLevel(options,assigned,level))
 return [...new Set([...assigned.filter(id=>!current.has(id)),...next])]
}

/** The existing legacy base-class tables are reference capacities, not automatic subclass grants. */
export function sourceCapacityReference(options: readonly CastingSpellOption[], source: CastingSourceSelection, abilityModifier = 0) {
 const rule = spellcastingRuleClass(source.className, source.subclass)
 if (!rule) return undefined
 const metrics = calculateSpellcastingMetrics(source.className, source.level, abilityModifier, source.subclass)
 let selectedCantrips = 0, selectedSpells = 0, unknownAssignments = 0
 for (const id of new Set(source.spells || [])) {
  const spell = options.find(option => option.value === id)
  if (!spell) unknownAssignments++
  else if (spell.level === 0) selectedCantrips++
  else selectedSpells++
 }
 return { ...metrics, selectedCantrips, selectedSpells, unknownAssignments,
  selectionModel: ['bard','sorcerer','warlock','ranger','third caster'].includes(rule) ? 'known' : 'prepared',
  subclassCatalogSpells: subclassSpells(source.subclass) }
}
