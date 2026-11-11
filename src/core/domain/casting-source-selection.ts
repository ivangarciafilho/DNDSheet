import { getSpellSlotsForClass, spellcastingRuleClass, sourceLearningMetrics, castingCapacityBasis, scaleCastingCapacity } from '../usecases/AutoSyncSpellcasting.ts'
import type { CastingContribution, CastingSpellGrant } from '../usecases/AutoSyncSpellcasting.ts'
import { subclassSpells, subclassSpellGrants, legacySubclassSpells } from './catalogs/subclass-spells.ts'

export interface CastingSourceSelection {
 contribution?: CastingContribution
 automaticGrants?: boolean
 spellGrants?: CastingSpellGrant[]
 preparedCountOverride?: number
 preparedInterval?: string
 rulesEdition?: '2014' | '2024'
 className: string
 subclass?: string
 level: number
 bypassSlotFilter?: boolean
 spells?: string[]
 resourceType?: string
}
export interface CastingSpellOption { value: string; label: string; level: number; class?: string[]; custom?: boolean }
/** Scale effective class level before the source progression lookup; this does not create spendable slots. */
export function sourceSpellCeiling(source: CastingSourceSelection, combinedLevel?: number, sourceCount = 1): number | undefined {
 const rulesClass=spellcastingRuleClass(source.className,source.subclass)
 if(!rulesClass)return undefined
 const config=source.contribution?.highestSlot
 const level=Math.min(20,scaleCastingCapacity(castingCapacityBasis(source.level,config,combinedLevel,sourceCount),config))
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
export function sourceSpellOptions<T extends CastingSpellOption>(options: readonly T[],source:CastingSourceSelection,level:number,combinedLevel?:number,sourceCount=1):T[] {
 const ceiling=sourceSpellCeiling(source,combinedLevel,sourceCount)
 const candidates=sourceGrantedSpells({...source,automaticGrants:true},combinedLevel,sourceCount)
 const own=[...new Set([...candidates,...(source.rulesEdition === '2024' ? [] : legacySubclassSpells(source.className,source.subclass))])]
 const prepared=new Set(source.automaticGrants===false?[]:candidates)
 const rulesClass=spellcastingRuleClass(source.className,source.subclass)
 const classLists=sourceSpellClassLists(source)
 const recognized=rulesClass!==undefined
 return options.filter(option=>option.level===level && (source.bypassSlotFilter||ceiling===undefined||level===0||level<=ceiling) &&
  (!recognized||option.custom||own.includes(option.value)||(option.class??[]).some(cls=>classLists.includes(cls.toLowerCase()))))
  .map(option=>own.includes(option.value)&&!option.custom?{...option,alwaysPrepared:prepared.has(option.value),label:`${option.label} (${prepared.has(option.value)?'always prepared':'expanded list'})`}:option)
  .sort((a,b)=>a.label.localeCompare(b.label))
}
/** Accept only explicit, well-formed grant records. Species names alone never generate spells. */
export function normalizeCastingSpellGrants(input: unknown): CastingSpellGrant[] {
 if (!Array.isArray(input)) return []
 const result: CastingSpellGrant[] = []
 const seen=new Set<string>()
 for (const raw of input) {
  if (!raw || typeof raw !== 'object') continue
  const {spell,minLevel,origin,kind}=raw as Partial<CastingSpellGrant>
  if (typeof spell !== 'string' || !spell.trim() || typeof minLevel !== 'number' || !Number.isInteger(minLevel) || minLevel < 1 || minLevel > 20 || (origin !== 'class' && origin !== 'subclass' && origin !== 'species')) continue
  const availability = kind === 'known' ? 'known' : 'prepared'
  const id=JSON.stringify([spell.trim(),minLevel,origin,availability])
  if (!seen.has(id)) {seen.add(id);result.push({spell:spell.trim(),minLevel,origin,...(kind ? {kind:availability} : {})})}
 }
 return result
}

export function sourceGrantLevel(source: CastingSourceSelection, combinedLevel?: number, sourceCount = 1): number {
 const config=source.contribution?.grants
 return Math.min(20,scaleCastingCapacity(castingCapacityBasis(source.level,config,combinedLevel,sourceCount),config))
}

/** Derived grants never rewrite authored spell lists. The toggle applies to every modeled origin. */
export function sourceGrantedSpells(source: CastingSourceSelection, combinedLevel?: number, sourceCount = 1): string[] {
 if (source.automaticGrants === false) return []
 const level=sourceGrantLevel(source,combinedLevel,sourceCount)
 const catalogue=source.rulesEdition === '2024' ? subclassSpellGrants(source.className,source.subclass,level) : []
 const authored=normalizeCastingSpellGrants(source.spellGrants).filter(grant=>level>=grant.minLevel).map(grant=>grant.spell)
 return [...new Set([...catalogue,...authored])]
}
export function sourceEffectiveSpells(source: CastingSourceSelection, combinedLevel?: number, sourceCount = 1): string[] {
 return [...new Set([...(source.spells || []),...sourceGrantedSpells(source,combinedLevel,sourceCount)])]
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
 const grantedSpells = sourceGrantedSpells(source, combinedLevel, sourceCount)
 const selectedGrantedSpells = [...new Set(source.spells || [])].filter(id=>grantedSpells.includes(id))
 return { ...metrics, highestSlot: sourceSpellCeiling(source, combinedLevel, sourceCount) ?? metrics.highestSlot, selectedCantrips, selectedSpells, unknownAssignments, grantedSpells, selectedGrantedSpells, selectedBudgetSpells:Math.max(0,selectedSpells-selectedGrantedSpells.filter(id=>options.some(option=>option.value===id&&option.level>0)).length),
  grantRules: source.rulesEdition === '2024' ? 'SRD 5.2 (2024)' : 'Legacy: subclass grants not inferred',
  selectionModel: ['bard','sorcerer','warlock','ranger','third caster'].includes(rule) ? 'known' : 'prepared',
  subclassCatalogSpells: subclassSpells(source.subclass) }
}
