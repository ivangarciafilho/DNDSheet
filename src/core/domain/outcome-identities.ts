/** Add identities to legacy clauses without changing any existing (even ambiguous) IDs.
 * Reserve the whole list first so an earlier missing ID cannot steal a later authored ID. */
export function stabilizeOutcomeIds<T>(input: T, ownerKey: string): T {
 if (!Array.isArray(input)) return input
 const record=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value)
 const used=new Set(input.filter(record).map(item=>item.id).filter((id):id is string=>typeof id==='string'&&!!id.trim()))
 return input.map((item,index)=>{
  if(!record(item)||item.id!==undefined&&item.id!==null&&item.id!=='')return item
  const base=`oc-${encodeURIComponent(ownerKey)}-${index+1}`;let id=base,suffix=1
  while(used.has(id))id=`${base}-${suffix++}`
  used.add(id);return {...item,id}
 }) as T
}
