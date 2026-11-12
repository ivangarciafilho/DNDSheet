import { CADENCE_OPTIONS, cadenceLabel } from './catalogs/cadence.ts'

export type BasicRiderScope = 'ac' | 'hp' | 'speed' | 'senses' | 'languages' | 'deathThroes' | 'onDamage'
export type HpRiderGroup = 'bloodied' | 'dt' | 'dr' | 'regen' | 'mortality' | 'invulnerability' | 'hp' | 'deathThroes' | 'onDamage'

export interface BasicRider {
  id: string
  cadence: string
  timing: string
  effect: string
}

export const BASIC_RIDER_CADENCES = [
  { value: 'once_round', label: 'Once per round' },
  { value: 'once_short_rest', label: 'Once per Short Rest' },
  { value: 'once_long_rest', label: 'Once per Long Rest' },
  ...CADENCE_OPTIONS.filter(option => option.value !== 'hidden' && option.value !== 'always_available'),
]

export const BASIC_RIDER_TIMINGS = [
  'As an Action', 'As a Bonus Action', 'As a Reaction', 'At the start of its turn', 'At the end of its turn',
  'When it takes damage', 'When it drops to 0 hit points', 'When it is destroyed',
]

export function formatBasicRider(rider: BasicRider, scope: BasicRiderScope): string {
  const effect = rider.effect?.trim()
  if (!effect) return ''
  const trigger = scope === 'deathThroes' ? 'Death Throes' : scope === 'onDamage' ? 'On Damage' : ''
  const cadence = BASIC_RIDER_CADENCES.find(option => option.value === rider.cadence)?.label ?? cadenceLabel(rider.cadence)
  const timing = scope === 'onDamage' && rider.timing === 'When it takes damage' ? '' : rider.timing
  return [trigger, cadence, timing, effect].filter(Boolean).join(': ')
}
