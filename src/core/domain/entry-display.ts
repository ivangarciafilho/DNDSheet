import type { MonsterAction } from './types.ts'

/** Display settings never replace the entry, mechanics, associations or CR annotation. */
export function entryDisplayPatch(field: string, value: unknown): Partial<Pick<MonsterAction, 'stagePool' | 'customPreamble'>> {
  if (field === 'customPreamble') return typeof value === 'boolean' ? { customPreamble: value } : {}
  if (field !== 'stagePool') return {}
  if (value === 'all') return { stagePool: 'all' }
  if ((typeof value === 'number' || typeof value === 'string') && Number.isSafeInteger(Number(value)) && Number(value) > 0) return { stagePool: Number(value) }
  return {}
}
