import type { ComposerRow } from './action-composer.ts'
import { COMPOSER_ROW_ORDER, ROLE_CHAINS } from './action-composer.ts'
import type { ChainCellView, ChainRowView } from './composer-chain.ts'
import { cellPatch, cellValue } from './composer-chain.ts'
import type { MonsterAction, MonsterReaction } from './types.ts'

const clean = (value: unknown): string => (typeof value === 'string' ? value.trim() : '')
const CORE_REACTION_CELLS = new Set(['usage', 'name', 'trigger'])

export function reactionChainView(reaction: MonsterReaction, usage: string): ChainRowView[] {
  const cells = new Map<string, ChainCellView>()
  const values: Record<string, string> = {
    name: clean(reaction.name),
    usage: clean(usage),
    trigger: clean(reaction.trigger),
  }

  for (const spec of ROLE_CHAINS.reaction) {
    if (spec.row === 'prose') continue
    const direct = values[spec.id]
    const val = direct !== undefined ? direct : reactionCellValue(reaction, spec.id)
    let text = ''
    if (typeof val === 'object' && val !== null) {
      if (Array.isArray(val)) {
        text = val.length ? `${val.length} items` : ''
      } else if ('count' in val && (val as { count?: unknown }).count !== undefined && (val as { count?: unknown }).count !== '') {
        const c = val as { count: unknown; mode?: string }
        text = `${c.mode === 'up_to' ? 'up to ' : ''}${c.count}`
      } else if ('distance' in val && (val as { distance?: unknown }).distance !== undefined && (val as { distance?: unknown }).distance !== '') {
        const r = val as { distance: unknown; unit?: string; relation?: string }
        text = `${r.relation ? r.relation + ' ' : ''}${r.distance} ${r.unit || 'ft'}.`
      } else if ('shape' in val && (val as { shape?: unknown }).shape) {
        const a = val as { shape: string; distance?: unknown; unit?: string }
        text = a.distance ? `${a.distance}-${a.unit || 'foot'} ${a.shape}` : a.shape
      }
    } else if (val !== undefined && val !== null) {
      text = clean(String(val))
    }

    // Visibility guards
    if (spec.id === 'weapon-ability' && (reaction as any).attackSource !== 'weapon') continue
    if (spec.id === 'attack-bonus' && !(reaction as any).attackSource) continue
    if (spec.id === 'save-dc' && (!(reaction as any).stat || (reaction as any).stat === 'none')) continue

    // Core cells always display. Non-core cells display when configured/set.
    if (!CORE_REACTION_CELLS.has(spec.id) && !text) continue

    const view: ChainCellView = {
      id: spec.id,
      label: spec.label,
      row: spec.row,
      editor: spec.editor,
      state: text ? 'set' : 'empty',
      text: text || spec.label,
      legacy: false,
    }
    if (spec.id === 'name' && !text) view.invalid = 'Name is required'
    cells.set(spec.id, view)
  }

  return COMPOSER_ROW_ORDER.map((row: ComposerRow) => ({
    row,
    cells: [...cells.values()].filter((cell) => cell.row === row),
  })).filter((row) => row.cells.length > 0)
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
  if (cellId !== 'usage' || !clean(value)) return ''
  const match = /^(\d{1,3})\s*\/\s*[a-z][a-z _-]{0,30}$/i.exec(clean(value))
  return match && Number(match[1]) <= 999 ? '' : 'Use a number and recharge rate, such as 3/Day'
}

export function reactionCellPatch(reaction: MonsterReaction, cellId: string, value: unknown): Partial<MonsterReaction> {
  const text = clean(value)
  switch (cellId) {
    case 'name': return { name: text }
    case 'trigger': return { trigger: text }
    case 'usage': {
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
