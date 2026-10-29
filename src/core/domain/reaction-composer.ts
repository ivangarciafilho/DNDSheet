import type { ComposerRow } from './action-composer.ts'
import { COMPOSER_ROW_ORDER, ROLE_CHAINS } from './action-composer.ts'
import type { ChainCellView, ChainRowView } from './composer-chain.ts'
import type { MonsterReaction } from './types.ts'

const clean = (value: unknown): string => (typeof value === 'string' ? value.trim() : '')

export function reactionChainView(reaction: MonsterReaction, usage: string): ChainRowView[] {
  const cells = new Map<string, ChainCellView>()
  const values: Record<string, string> = {
    name: clean(reaction.name),
    usage: clean(usage),
    trigger: clean(reaction.trigger),
  }

  for (const spec of ROLE_CHAINS.reaction) {
    if (spec.row === 'prose') continue
    const text = values[spec.id] ?? ''
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
    default: return undefined
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
    default: return {}
  }
}
