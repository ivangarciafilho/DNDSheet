import type { MonsterAction } from './types.ts'

export interface ActionUsageDraft {
  mode: 'none' | 'recharge' | 'limited' | 'custom'
  min: number | string
  max: number | string
  count: number | string
  rate: string
  custom: string
}
type UsageAction = Pick<MonsterAction, 'recharge' | 'rechargeMin' | 'rechargeMax' | 'limitedUse'>
const whole = (value: unknown, max: number) => (typeof value === 'number' || typeof value === 'string') && String(value).trim() !== '' && Number.isInteger(Number(value)) && Number(value) >= 1 && Number(value) <= max

/** One precedence for editor, modern plate and classic token rendering. */
export function actionRecharge(action: Partial<UsageAction>): string {
  if (action.recharge?.trim()) return action.recharge.trim()
  if (action.rechargeMin) return action.rechargeMin < (action.rechargeMax || 6) ? `${action.rechargeMin}–${action.rechargeMax || 6}` : String(action.rechargeMin)
  const uses = action.limitedUse as (UsageAction['limitedUse'] & { recharge?: string }) | undefined
  return uses?.recharge?.trim() || (uses?.rate === 'RECHARGE' ? '5–6' : '')
}

/** Same source precedence as the renderer; opening an editor never normalizes persisted data. */
export function actionUsageDraft(action: Partial<UsageAction>): ActionUsageDraft {
  const uses = action.limitedUse as (UsageAction['limitedUse'] & { recharge?: string }) | undefined
  const raw = actionRecharge(action)
  const draft: ActionUsageDraft = { mode: 'none', min: action.rechargeMin || 5, max: action.rechargeMax || 6, count: uses?.count || 1, rate: uses?.rate || 'DAY', custom: raw }
  if (raw) {
    const match = raw.match(/^(?:Recharge\s+)?(\d+)(?:\s*[-–—]\s*(\d+))?$/i)
    if (match) { draft.mode = 'recharge'; draft.min = Number(match[1]); draft.max = Number(match[2] || match[1]) }
    else draft.mode = 'custom'
  } else if (action.rechargeMin || uses?.rate === 'RECHARGE') draft.mode = 'recharge'
  else if (uses && uses.count > 0) draft.mode = 'limited'
  return draft
}

export function validateActionUsage(value: unknown): string {
  if (!value || typeof value !== 'object') return 'Choose a usage type'
  const draft = value as ActionUsageDraft
  if (draft.mode === 'none') return ''
  if (draft.mode === 'recharge') return whole(draft.min, 100) && whole(draft.max, 100) && Number(draft.min) <= Number(draft.max) ? '' : 'Use a whole recharge range from 1 to 100, with the first value no greater than the last'
  if (draft.mode === 'limited') return whole(draft.count, 999) && typeof draft.rate === 'string' && !!draft.rate.trim() && draft.rate !== 'RECHARGE' ? '' : 'Use 1–999 uses and a refresh rate'
  if (draft.mode === 'custom') return typeof draft.custom === 'string' && !!draft.custom.trim() ? '' : 'Enter the custom recharge text'
  return 'Choose a usage type'
}

/** Replace only cadence fields; preserve custom nested metadata and all other action fields. */
export function actionUsagePatch(action: Partial<UsageAction>, value: unknown): Partial<MonsterAction> {
  const draft = value === '' ? { ...actionUsageDraft(action), mode: 'none' as const } : value as ActionUsageDraft
  if (validateActionUsage(draft)) return {}
  const uses = { ...(action.limitedUse || { count: 0, rate: 'DAY' }) } as UsageAction['limitedUse'] & { recharge?: string }
  delete uses.recharge
  uses.count = draft.mode === 'limited' ? Number(draft.count) : 0
  uses.rate = draft.mode === 'limited' ? draft.rate.trim() : uses.rate === 'RECHARGE' ? 'DAY' : uses.rate
  const recharge = draft.mode === 'recharge' ? Number(draft.min) === Number(draft.max) ? String(Number(draft.min)) : `${Number(draft.min)}–${Number(draft.max)}` : draft.mode === 'custom' ? draft.custom.trim() : ''
  return { recharge, rechargeMin: undefined, rechargeMax: undefined, limitedUse: uses }
}
