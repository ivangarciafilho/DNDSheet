/** Authored mechanic formatting is a small attribute-free vocabulary, never arbitrary HTML. */
const tags = new Set(['b','strong','i','em','u','s','strike','del','sub','sup','code','br','div','p','ul','ol','li'])
const tagPattern = /<\/?([a-z][\w:-]*)\b[^>]*>/gi
const escapeText = (value: string) => value.replace(/&(?!(?:amp|lt|gt|quot|apos|nbsp|#\d+|#x[\da-f]+);)/gi,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
export function mechanicRichHtml(value: unknown): string {
 const input = typeof value === 'string' || typeof value === 'number' ? String(value) : ''
 let output='', start=0
 for(const match of input.matchAll(tagPattern)) {
  output += escapeText(input.slice(start,match.index))
  const tag=match[1].toLowerCase()
  output += tags.has(tag) ? '<'+(match[0].startsWith('</')?'/':'')+tag+'>' : escapeText(match[0])
  start=(match.index ?? 0)+match[0].length
 }
 return output+escapeText(input.slice(start))
}
export function mechanicPlainText(value: unknown): string {
 const input = typeof value === 'string' || typeof value === 'number' ? String(value) : ''
 return input.replace(tagPattern,(full,tag:string)=>tags.has(tag.toLowerCase()) ? /^(?:<br|<\/(?:div|p|li))/i.test(full)?'\n':'' : full)
  .replace(/&(?:amp|lt|gt|quot|apos|nbsp|#(\d+)|#x([\da-f]+));/gi,(entity,decimal,hex)=>{
   if(decimal||hex){const code=parseInt(decimal||hex,decimal?10:16);return code>0&&code<=0x10ffff?String.fromCodePoint(code):entity}
   return ({'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'",'&nbsp;':' '} as Record<string,string>)[entity.toLowerCase()]??entity
  }).trim()
}
export const hasMechanicFormatting=(value:unknown):boolean=>typeof value==='string'&&/<\/?(?:b|strong|i|em|u|s|strike|del|sub|sup|code|br|div|p|ul|ol|li)\b/i.test(value)
