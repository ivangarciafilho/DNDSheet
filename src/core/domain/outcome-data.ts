import type { AbilityOutcome } from './types.ts'

const record = (value: unknown): Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
const text = (value: unknown): string => typeof value === 'string' || typeof value === 'number' ? String(value) : ''
const sectors = ['all', 'top_left', 'top_right', 'bottom_left', 'bottom_right', 'row_1', 'row_2', 'col_1', 'col_2']

/** Read-only presentation boundary for legacy optional data; never rewrites authored state. */
export function normalizeOutcomeData(input: unknown): AbilityOutcome[] {
  return (Array.isArray(input) ? input : []).map((entry) => {
    const item = record(entry)
    return {
      ...item,
      trigger: typeof item.trigger === 'string' ? item.trigger : '',
      id: typeof item.id === 'string' ? item.id : '',
      recipient: text(item.recipient),
      targetFilter: text(item.targetFilter),
      rider: text(item.rider),
      refs: Array.isArray(item.refs) ? item.refs.filter((ref): ref is string => typeof ref === 'string') : [],
      effects: (Array.isArray(item.effects) ? item.effects : []).map((entry) => {
        const effect = record(entry)
        return { ...effect, text: text(effect.text), formula: text(effect.formula), damageType: text(effect.damageType) }
      }),
      diceTable: Array.isArray(item.diceTable) ? item.diceTable.map((entry) => {
        const row = record(entry)
        return { roll: text(row.roll), effect: text(row.effect) }
      }) : [],
      presentation: item.presentation === 'horizontal' || item.presentation === 'vertical' ? item.presentation : 'inline',
      layoutSector: typeof item.layoutSector === 'string' && sectors.includes(item.layoutSector) ? item.layoutSector : 'all',
    } as AbilityOutcome
  })
}


