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
  long_or_short: 'Short or Long Rest',
  downtime: 'Downtime',
  daily: '1/Day',
  '1_day': '1/Day',
  '2_day': '2/Day',
  '3_day': '3/Day',
  at_dawn: 'At Dawn',
  dawn: 'At Dawn',
  at_dusk: 'At Dusk',
  dusk: 'At Dusk',
  at_midday: 'At Midday',
  midday: 'At Midday',
  at_midnight: 'At Midnight',
  midnight: 'At Midnight',
  while_bloodied: 'While Bloodied',
  when_bloodied: 'When Bloodied',
  while_not_bloodied: 'While Not Bloodied',
  at_0_hp: 'At 0 Hit Points',
  at_1_hp: 'At 1 Hit Point',
  hourly: 'Hourly',
  hour: 'Hourly',
  '10_minutes': '10 Minutes',
  ten_minutes: '10 Minutes',
  '1_minute': '1 Minute',
  minute: '1 Minute',
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
  hidden: '',
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
  { label: CADENCE_LABELS.at_dawn, value: 'at_dawn' },
  { label: CADENCE_LABELS.at_dusk, value: 'at_dusk' },
  { label: CADENCE_LABELS.at_midday, value: 'at_midday' },
  { label: CADENCE_LABELS.at_midnight, value: 'at_midnight' },
  { label: CADENCE_LABELS.while_bloodied, value: 'while_bloodied' },
  { label: CADENCE_LABELS.when_bloodied, value: 'when_bloodied' },
  { label: CADENCE_LABELS.at_0_hp, value: 'at_0_hp' },
  { label: CADENCE_LABELS.at_1_hp, value: 'at_1_hp' },
  { label: CADENCE_LABELS.hourly, value: 'hourly' },
  { label: CADENCE_LABELS['10_minutes'], value: '10_minutes' },
  { label: CADENCE_LABELS['1_minute'], value: '1_minute' },
  { label: CADENCE_LABELS.weekly, value: 'weekly' },
  { label: CADENCE_LABELS.monthly, value: 'monthly' },
  { label: 'Hidden', value: 'hidden' },
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

export function cadenceKey(value?: string | null, fallback = ''): string {
  const raw = value?.trim()
  if (!raw) return fallback
  const key = raw.toLowerCase().replace(/[\s/-]+/g, '_').replace(/^_+|_+$/g, '')
  return key in CADENCE_LABELS ? key : raw
}
