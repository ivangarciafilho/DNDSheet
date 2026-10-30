import { ROLE_CHAINS } from './action-composer.ts'
import type { ChainRowView } from './composer-chain.ts'
import { computeTraitTag, TRAIT_RECHARGE_OPTIONS } from './defense-and-traits-utils.ts'
import type { MonsterTrait } from './types.ts'

export interface TraitCadenceDraft {
  limitedUse: { count: number | string; rate: string }
  rechargeTiming: string
  rechargeCount: number | string
  rechargeTagOverride: string
}

/** Match the builder's ten-pool limit while keeping a saved legacy phase selectable. */
export function traitPhaseOptions(poolCount: number, current: MonsterTrait['stagePool']): { label: string; value: string | number }[] {
  const options: { label: string; value: string | number }[] = [{ label: 'All phases', value: 'all' }]
  const count = Number.isFinite(poolCount) ? Math.min(10, Math.max(1, Math.floor(poolCount))) : 1
  for (let pool = 1; pool <= count; pool++) options.push({ label: `Phase / pool ${pool}`, value: pool })
  if (typeof current === 'number' && Number.isSafeInteger(current) && current > count) options.push({ label: `Phase / pool ${current} (saved)`, value: current })
  return options
}

const clean = (value: unknown): string => typeof value === 'string' ? value.trim() : ''
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value)
const validCount = (value: unknown): boolean => (typeof value === 'number' || typeof value === 'string') &&
  String(value).trim() !== '' && Number.isInteger(Number(value)) && Number(value) >= 0 && Number(value) <= 999

export function traitChainView(trait: MonsterTrait): ChainRowView[] {
  const tag = computeTraitTag(trait)
  return [{ row: 'head', cells: ROLE_CHAINS.trait.filter((spec) => spec.row === 'head').map((spec) => {
    const text = spec.id === 'name' ? clean(trait.name) : tag
    return {
      id: spec.id, label: spec.label, row: spec.row, editor: spec.editor,
      state: text ? 'set' as const : 'empty' as const,
      text: text || spec.label, legacy: false,
      ...(spec.id === 'name' && !text ? { invalid: 'Name is required' } : {}),
    }
  }) }]
}

export function traitCellValue(trait: MonsterTrait, cellId: string): unknown {
  if (cellId === 'name') return trait.name ?? ''
  if (cellId !== 'trait-usage') return undefined
  const draft: TraitCadenceDraft = {
    limitedUse: { count: trait.limitedUse?.count ?? 0, rate: trait.limitedUse?.rate ?? 'DAY' },
    rechargeTiming: trait.rechargeTiming ?? '',
    rechargeCount: trait.rechargeCount ?? '',
    rechargeTagOverride: trait.rechargeTagOverride ?? '',
  }
  return draft
}

export function validateTraitCell(cellId: string, value: unknown): string {
  if (cellId === 'name') return clean(value) ? '' : 'Name is required'
  if (cellId !== 'trait-usage' || value === '') return ''
  if (!record(value) || !record(value.limitedUse) || !validCount(value.limitedUse.count)) return 'Use a whole count from 0 to 999'
  if (Number(value.limitedUse.count) > 0 && !clean(value.limitedUse.rate)) return 'Choose a recovery rate for limited uses'
  if (value.rechargeCount != null && value.rechargeCount !== '' && !validCount(value.rechargeCount)) return 'Use a whole recharge count from 0 to 999, or leave it blank'
  return ''
}

/** Cadence owns only tag inputs. Grouping, identity, CR policy and prose are never replaced. */
export function traitCellPatch(trait: MonsterTrait, cellId: string, value: unknown): Partial<MonsterTrait> {
  if (validateTraitCell(cellId, value)) return {}
  if (cellId === 'name') return { name: clean(value) }
  if (cellId !== 'trait-usage') return {}
  if (value === '') return {
    limitedUse: { ...trait.limitedUse, count: 0 }, rechargeTiming: '',
    rechargeCount: undefined, rechargeTagOverride: '',
  }
  const draft = value as TraitCadenceDraft
  const nextTiming = clean(draft.rechargeTiming)
  const patch: Partial<MonsterTrait> = {
    limitedUse: { ...trait.limitedUse, count: Number(draft.limitedUse.count), rate: clean(draft.limitedUse.rate) },
    rechargeTiming: nextTiming,
    rechargeCount: draft.rechargeCount == null || draft.rechargeCount === '' ? undefined : Number(draft.rechargeCount),
    rechargeTagOverride: clean(draft.rechargeTagOverride),
  }
  // Update generated section labels, retaining authored labels across cadence changes.
  const oldDefault = TRAIT_RECHARGE_OPTIONS.find((option) => option.value === trait.rechargeTiming)?.sectionName
  if (trait.renderInRechargeSection && (!clean(trait.rechargeSection) || trait.rechargeSection === oldDefault)) {
    patch.rechargeSection = TRAIT_RECHARGE_OPTIONS.find((option) => option.value === nextTiming)?.sectionName || 'Recharging Traits'
  }
  return patch
}

export function traitPolicyPatch(trait: MonsterTrait, field: string, value: unknown): Partial<MonsterTrait> {
  switch (field) {
    case 'customPreamble': return typeof value === 'boolean' ? { customPreamble: value } : {}
    case 'renderInRechargeSection':
      return typeof value === 'boolean' ? {
        renderInRechargeSection: value,
        ...(value && !clean(trait.rechargeSection) ? {
          rechargeSection: TRAIT_RECHARGE_OPTIONS.find((option) => option.value === trait.rechargeTiming)?.sectionName || 'Recharging Traits',
        } : {}),
      } : {}
    case 'isConditional':
      return typeof value === 'boolean' ? {
        isConditional: value,
        ...(value && !clean(trait.conditionalTrigger) ? { conditionalTrigger: 'Bloodied (bloodied hit points)' } : {}),
      } : {}
    // Live text inputs must retain spaces between keystrokes; projection trims for display.
    case 'rechargeSection': return { rechargeSection: typeof value === 'string' ? value : '' }
    case 'conditionalTrigger': return { conditionalTrigger: typeof value === 'string' ? value : '' }
    case 'stagePool':
      if (value === 'all' || value == null || value === '') return { stagePool: 'all' }
      return Number.isInteger(Number(value)) && Number(value) > 0 ? { stagePool: Number(value) } : {}
    default: return {}
  }
}
