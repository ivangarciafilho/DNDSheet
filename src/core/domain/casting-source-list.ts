/** Source-list editing keeps legacy primary fields as an adapter, never as a ghost source. */
export interface SourceBindingRemap { from: string; to?: string }
const sourceKeys = ['class','subclass','level','stat','slots','standard','save','attack','modifier','resourceType','resourceValue','refreshRate','customRefreshRate','bypassSlotLevelFilter','levelCadenceMap','bonusActionLevelMap','levelAmountMap','spellCadenceMap','spellAmountMap','spellBonusActionMap','contribution','automaticGrants','spellGrants','preparedCountOverride','preparedInterval','rulesEdition','useCustomClassPreamble','customClassPreamble'] as const
const mapping: Record<string,string> = {className:'class',spells:'standard',bypassSlotFilter:'bypassSlotLevelFilter',levelCadences:'levelCadenceMap',levelBonusAction:'bonusActionLevelMap',levelAmounts:'levelAmountMap',spellAmounts:'spellAmountMap',spellBonusAction:'spellBonusActionMap'}
const copy = <T>(value:T):T => JSON.parse(JSON.stringify(value)) as T
/** Binding remaps are ordered: discard removed primary paths before promoting the selected source. */
export function removeCastingSource<T extends object>(input:T,id:string):{source:T;removedId:string;wasPrimary:boolean;promotedId?:string;bindingRemaps:SourceBindingRemap[]} {
 const source=copy(input) as Record<string,unknown>, primary=id==='primary'
 const classes=Array.isArray(source.classes)?source.classes as Record<string,unknown>[]:[]
 if(!primary) {
  if(!classes.some(entry=>entry.id===id))return{source:input,removedId:id,wasPrimary:false,bindingRemaps:[]}
  source.classes=classes.filter(entry=>entry.id!==id)
  return{source:source as T,removedId:id,wasPrimary:false,bindingRemaps:[{from:`spellcasting.classes[id=${encodeURIComponent(id)}]`}]}
 }
 const innate=Array.isArray(source.atWill)&&source.atWill.length>0
 if(innate&&source.innateStat===undefined)source.innateStat=source.stat
 if(innate)for(const [from,to] of [['save','innateSave'],['attack','innateAttack'],['modifier','innateModifier']] as const) if(source[to]===undefined&&source[from]!==undefined)source[to]=copy(source[from])
 const remaps:SourceBindingRemap[]=sourceKeys.map(key=>({from:`spellcasting.${key}`}))
 for(const key of sourceKeys)delete source[key]
 // Required compatibility fields remain valid even for an explicitly empty class list.
 Object.assign(source,{primarySourceEnabled:false,class:undefined,level:1,stat:source.innateStat||'INT',standard:[],slots:Array(9).fill(0),save:{override:false,overrideValue:0},attack:{override:false,overrideValue:0},modifier:{override:false,overrideValue:0},useCustomClassPreamble:false,customClassPreamble:''})
 source.multiclass={...(source.multiclass as object||{}),enabled:false}
 const promoted=classes[0]
 source.classes=classes.slice(1)
 if(!promoted)return{source:source as T,removedId:id,wasPrimary:true,bindingRemaps:remaps}
 for(const [key,value] of Object.entries(promoted)) {
  if(['id','atWill','atWillNotes','useCustomInnatePreamble','customInnatePreamble','innateStat','innateSave','innateAttack','innateModifier','classes','multiclass','primarySourceEnabled'].includes(key))continue
  const destination=mapping[key]||key
  source[destination]=copy(value)
  remaps.push({from:`spellcasting.classes[id=${encodeURIComponent(String(promoted.id))}].${key}`,to:`spellcasting.${destination}`})
 }
 source.primarySourceEnabled=true
 return{source:source as T,removedId:id,wasPrimary:true,promotedId:String(promoted.id),bindingRemaps:remaps}
}
