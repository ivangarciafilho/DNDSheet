import type { ChainCellView, ChainRowView } from './composer-chain.ts'
import { chainView, cellPatch, cellValue, validateCell } from './composer-chain.ts'
import type { MonsterAction, MonsterReaction } from './types.ts'

const clean = (value: unknown): string => (typeof value === 'string' ? value.trim() : '')

export function reactionChainView(reaction: MonsterReaction, usage: string): ChainRowView[] {
 const rows=chainView('action',reaction as unknown as Partial<MonsterAction>,{usage}).filter(row=>row.row!=='prose')
 const trigger:ChainCellView={id:'trigger',label:'Trigger',row:'mechanics',editor:'text',state:clean(reaction.trigger)?'set':'empty',text:clean(reaction.trigger)||'Trigger',legacy:false}
 const mechanics=rows.find(row=>row.row==='mechanics')
 if(mechanics)mechanics.cells.unshift(trigger)
 else rows.splice(1,0,{row:'mechanics',cells:[trigger]})
 return rows
}

export function reactionCellValue(reaction: MonsterReaction, cellId: string): unknown {
  switch (cellId) {
    case 'name': return reaction.name ?? ''
    case 'usage':
      return reaction.limitedUse?.count > 0 && reaction.limitedUse.rate
        ? `${reaction.limitedUse.count}/${reaction.limitedUse.rate}`
        : ''
    case 'trigger': return reaction.trigger ?? ''
    default: return cellValue(reaction as unknown as Partial<MonsterAction>, cellId)
  }
}

export function validateReactionCell(cellId: string, value: unknown): string {
  if (cellId === 'name') return clean(value) ? '' : 'Name is required'
  if (cellId === 'usage' && value && typeof value === 'object') return validateCell(cellId,value)
  if (cellId !== 'usage') return validateCell(cellId,value)
  if (!clean(value)) return ''
  const match = /^(\d{1,3})\s*\/\s*[a-z][a-z _-]{0,30}$/i.exec(clean(value))
  return match && Number(match[1]) <= 999 ? '' : 'Use a number and recharge rate, such as 3/Day'
}

export function reactionCellPatch(reaction: MonsterReaction, cellId: string, value: unknown): Partial<MonsterReaction> {
  const text = clean(value)
  switch (cellId) {
    case 'name': return { name: text }
    case 'trigger': return { trigger: text }
    case 'usage': {
      if (value && typeof value === 'object') return cellPatch(reaction as unknown as Partial<MonsterAction>,cellId,value) as unknown as Partial<MonsterReaction>
      if (!text) return { limitedUse: { ...reaction.limitedUse, count: 0 } }
      const match = /^(\d{1,3})\s*\/\s*([a-z][a-z _-]{0,30})$/i.exec(text)
      if (!match) return {}
      const aliases: Readonly<Record<string, string>> = {
        'long or short rest': 'LONG_OR_SHORT',
        'short or long rest': 'LONG_OR_SHORT',
        'short rest': 'SHORT_REST',
        'long rest': 'LONG_REST',
        'day each': 'DAY_EACH',
      }
      const rateText = match[2].trim()
      const rate = aliases[rateText.toLowerCase()] ?? rateText.toUpperCase().replace(/[ -]+/g, '_')
      return { limitedUse: { count: Number(match[1]), rate } }
    }
    default: return cellPatch(reaction as unknown as MonsterAction, cellId, value) as unknown as Partial<MonsterReaction>
  }
}
