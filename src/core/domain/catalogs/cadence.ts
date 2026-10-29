/**
 * Canonical recovery and availability labels shared by spell projections.
 * Unknown custom values are preserved for homebrew content.
 */
export const CADENCE_LABELS: Readonly<Record<string, string>> = Object.freeze({
  at_will: 'At Will',
  always: 'Always Prepared',
  always_available: 'Always Prepared',
  short_rest: 'Short Rest',
  long_rest: 'Long Rest',
  downtime: 'Downtime',
  daily: '1/Day',
  '1_day': '1/Day',
  '2_day': '2/Day',
  '3_day': '3/Day',
  at_dawn: 'At Dawn',
  at_dusk: 'At Dusk',
  at_midnight: 'At Midnight',
  ritual: 'Ritual',
  recharge_5_6: 'Recharge 5–6',
  recharge_6: 'Recharge 6',
})

export interface CadenceOption {
  label: string
  value: string
}

/** Canonical picker values shared by spellcasting editors and renderers. */
export const CADENCE_OPTIONS: readonly CadenceOption[] = Object.freeze([
  { label: CADENCE_LABELS.long_rest, value: 'long_rest' },
  { label: CADENCE_LABELS.short_rest, value: 'short_rest' },
  { label: CADENCE_LABELS.at_will, value: 'at_will' },
  { label: CADENCE_LABELS['1_day'], value: '1_day' },
  { label: CADENCE_LABELS['2_day'], value: '2_day' },
  { label: CADENCE_LABELS['3_day'], value: '3_day' },
  { label: CADENCE_LABELS.recharge_5_6, value: 'recharge_5_6' },
  { label: CADENCE_LABELS.downtime, value: 'downtime' },
  { label: CADENCE_LABELS.ritual, value: 'ritual' },
  { label: CADENCE_LABELS.always_available, value: 'always_available' },
])

export const RESOURCE_REFRESH_OPTIONS: readonly CadenceOption[] = Object.freeze([
  CADENCE_OPTIONS[0],
  CADENCE_OPTIONS[1],
  CADENCE_OPTIONS[7],
])

/** Maps stored enums and common legacy labels to one human-readable cadence. */
export function cadenceLabel(value?: string | null): string {
  const raw = value?.trim()
  if (!raw) return ''
  const key = raw.toLowerCase().replace(/[\s/-]+/g, '_').replace(/^_+|_+$/g, '')
  return CADENCE_LABELS[key] ?? raw
}
