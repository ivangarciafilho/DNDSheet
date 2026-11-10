import { getSpellSlotsForClass, spellcastingRuleClass, sourceLearningMetrics } from '../usecases/AutoSyncSpellcasting.ts'
import type { CastingContribution } from '../usecases/AutoSyncSpellcasting.ts'
import { subclassSpells, subclassSpellGrants, legacySubclassSpells } from './catalogs/subclass-spells.ts'

export interface CastingSourceSelection {
 contribution?: CastingContribution
 rulesEdition?: '2014' | '2024'
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
/** Divine Soul broadens selection to the Cleric base list; affinity grants remain an authored choice.
 * Publisher reference: https://www.dndbeyond.com/posts/1080-druid-201-a-guide-to-multiclassing
 */
export function sourceSpellClassLists(source: CastingSourceSelection): string[] {
 const rule=spellcastingRuleClass(source.className,source.subclass)
 if(!rule)return []
 const lists=[rule==='third caster'?'wizard':rule]
 if(rule==='sorcerer'&&/^divine\s+soul$/i.test((source.subclass||'').trim()))lists.push('cleric')
 return lists
}
export function sourceSpellOptions<T extends CastingSpellOption>(options: readonly T[],source:CastingSourceSelection,level:number):T[] {
 const ceiling=sourceSpellCeiling(source), own=source.rulesEdition === '2024' ? subclassSpellGrants(source.className,source.subclass,source.level) : legacySubclassSpells(source.className,source.subclass)
 const rulesClass=spellcastingRuleClass(source.className,source.subclass)
 const classLists=sourceSpellClassLists(source)
 const recognized=rulesClass!==undefined
 return options.filter(option=>option.level===level && (source.bypassSlotFilter||ceiling===undefined||level===0||level<=ceiling) &&
  (!recognized||option.custom||own.includes(option.value)||(option.class??[]).some(cls=>classLists.includes(cls.toLowerCase()))))
  .map(option=>own.includes(option.value)&&!option.custom?{...option,alwaysPrepared:source.rulesEdition==='2024',label:`${option.label} (${source.rulesEdition==='2024'?'always prepared':'subclass'})`}:option)
  .sort((a,b)=>a.label.localeCompare(b.label))
}
/** Derived grants never rewrite the authored source spell list. */
export function sourceGrantedSpells(source: CastingSourceSelection): string[] {
 return source.rulesEdition === '2024' ? subclassSpellGrants(source.className,source.subclass,source.level) : []
}
export function sourceEffectiveSpells(source: CastingSourceSelection): string[] {
 return [...new Set([...(source.spells || []),...sourceGrantedSpells(source)])]
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
export function sourceCapacityReference(options: readonly CastingSpellOption[], source: CastingSourceSelection, abilityModifier = 0, combinedLevel?: number, sourceCount = combinedLevel === undefined ? 1 : 2) {
 const rule = spellcastingRuleClass(source.className, source.subclass)
 if (!rule) return undefined
 const metrics = sourceLearningMetrics(source, abilityModifier, combinedLevel, sourceCount)
 let selectedCantrips = 0, selectedSpells = 0, unknownAssignments = 0
 for (const id of new Set(source.spells || [])) {
  const spell = options.find(option => option.value === id)
  if (!spell) unknownAssignments++
  else if (spell.level === 0) selectedCantrips++
  else selectedSpells++
 }
 const grantedSpells = sourceGrantedSpells(source)
 const selectedGrantedSpells = [...new Set(source.spells || [])].filter(id=>grantedSpells.includes(id))
 return { ...metrics, selectedCantrips, selectedSpells, unknownAssignments, grantedSpells, selectedGrantedSpells, selectedBudgetSpells:Math.max(0,selectedSpells-selectedGrantedSpells.filter(id=>options.some(option=>option.value===id&&option.level>0)).length),
  grantRules: source.rulesEdition === '2024' ? 'SRD 5.2 (2024)' : 'Legacy: subclass grants not inferred',
  selectionModel: ['bard','sorcerer','warlock','ranger','third caster'].includes(rule) ? 'known' : 'prepared',
  subclassCatalogSpells: subclassSpells(source.subclass) }
}
