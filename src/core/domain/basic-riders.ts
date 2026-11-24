import { CADENCE_OPTIONS, cadenceLabel } from './catalogs/cadence.ts'

export type BasicRiderScope = 'ac' | 'hp' | 'speed' | 'senses' | 'languages' | 'deathThroes' | 'onDamage' | 'onHeal'
export type HpRiderGroup = 'bloodied' | 'dt' | 'dr' | 'regen' | 'mortality' | 'invulnerability' | 'hp' | 'deathThroes' | 'onDamage' | 'onHeal'

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
  'When it takes damage', 'When it regains hit points', 'When it drops to 0 hit points', 'When it is destroyed',
]

export type DefenseEffect = 'temporaryAc' | 'conditionalAc' | 'defensiveRule' | 'onMiss' | 'onHit'
  | 'damageThreshold' | 'damageReduction' | 'regeneration' | 'deathPrevention'

export interface RiderSchedule {
  cadence?: string
  timing?: string
}

export function formatRiderSchedule(text: string, schedule?: RiderSchedule): string {
  if (!text) return ''
  const cadence = BASIC_RIDER_CADENCES.find(option => option.value === schedule?.cadence)?.label ?? cadenceLabel(schedule?.cadence)
  return [cadence, schedule?.timing, text].filter(Boolean).join(': ')
}

export function formatBasicRider(rider: BasicRider, scope: BasicRiderScope): string {
  const effect = rider.effect?.trim()
  if (!effect) return ''
  const trigger = scope === 'deathThroes' ? 'Death Throes' : scope === 'onDamage' ? 'On Damage' : scope === 'onHeal' ? 'On Regain' : ''
  const cadence = BASIC_RIDER_CADENCES.find(option => option.value === rider.cadence)?.label ?? cadenceLabel(rider.cadence)
  const timing = (scope === 'onDamage' && rider.timing === 'When it takes damage') || (scope === 'onHeal' && rider.timing === 'When it regains hit points') ? '' : rider.timing
  return [trigger, cadence, timing, effect].filter(Boolean).join(': ')
}

/** Guided dropdown entries (Build 274): grouped by scope, each with an icon, a color and a tip. */
interface GuidedEntry { value: string; label: string; group: string; icon: string; color: string; tooltip: string }

const CADENCE_GUIDE: Readonly<Record<string, Omit<GuidedEntry, 'value' | 'label'>>> = {
  once_round: { group: 'Per round', icon: 'replay', color: 'cyan-5', tooltip: 'Usable once in each round of combat; refreshes at the start of the next round.' },
  at_will: { group: 'Unlimited', icon: 'all_inclusive', color: 'green-5', tooltip: 'No limit: usable whenever its trigger or action is available.' },
  once_short_rest: { group: 'Per rest', icon: 'hotel', color: 'indigo-4', tooltip: 'Once, then refreshes when the creature finishes a Short or Long Rest.' },
  once_long_rest: { group: 'Per rest', icon: 'bedtime', color: 'indigo-4', tooltip: 'Once, then refreshes only when the creature finishes a Long Rest.' },
  short_rest: { group: 'Per rest', icon: 'hotel', color: 'indigo-4', tooltip: 'Refreshes when the creature finishes a Short or Long Rest.' },
  long_rest: { group: 'Per rest', icon: 'bedtime', color: 'indigo-4', tooltip: 'Refreshes only when the creature finishes a Long Rest.' },
  '1_day': { group: 'Per day', icon: 'looks_one', color: 'amber-6', tooltip: 'One use, regained each day (printed 1/Day).' },
  '2_day': { group: 'Per day', icon: 'looks_two', color: 'amber-6', tooltip: 'Two uses, regained each day (printed 2/Day).' },
  '3_day': { group: 'Per day', icon: 'looks_3', color: 'amber-6', tooltip: 'Three uses, regained each day (printed 3/Day).' },
  recharge_5_6: { group: 'Recharge', icon: 'casino', color: 'red-5', tooltip: 'Roll a d6 at the start of each turn; on a 5 or 6 the ability is available again.' },
  at_dawn: { group: 'Time of day', icon: 'wb_twilight', color: 'orange-5', tooltip: 'Refreshes at dawn each day.' },
  at_dusk: { group: 'Time of day', icon: 'nights_stay', color: 'orange-5', tooltip: 'Refreshes at dusk each day.' },
  at_midday: { group: 'Time of day', icon: 'light_mode', color: 'orange-5', tooltip: 'Refreshes at midday each day.' },
  at_midnight: { group: 'Time of day', icon: 'dark_mode', color: 'orange-5', tooltip: 'Refreshes at midnight each day.' },
  while_bloodied: { group: 'Hit point state', icon: 'water_drop', color: 'red-7', tooltip: 'Active for as long as the creature is Bloodied (at or below half its hit points).' },
  when_bloodied: { group: 'Hit point state', icon: 'water_drop', color: 'red-7', tooltip: 'Triggers once at the moment the creature becomes Bloodied.' },
  at_0_hp: { group: 'Hit point state', icon: 'heart_broken', color: 'red-7', tooltip: 'Triggers when the creature drops to 0 hit points.' },
  at_1_hp: { group: 'Hit point state', icon: 'monitor_heart', color: 'red-7', tooltip: 'Triggers when the creature is reduced to exactly 1 hit point.' },
  '1_minute': { group: 'Duration', icon: 'timer', color: 'teal-5', tooltip: 'Refreshes or lasts for 1 minute (10 rounds).' },
  '10_minutes': { group: 'Duration', icon: 'timer', color: 'teal-5', tooltip: 'Refreshes or lasts for 10 minutes; usually outside combat.' },
  hourly: { group: 'Duration', icon: 'schedule', color: 'teal-5', tooltip: 'Refreshes once every hour.' },
  weekly: { group: 'Calendar', icon: 'date_range', color: 'brown-4', tooltip: 'Refreshes once every week; a slow, strategic resource.' },
  monthly: { group: 'Calendar', icon: 'calendar_month', color: 'brown-4', tooltip: 'Refreshes once every month; for campaign-scale powers.' },
  downtime: { group: 'Outside combat', icon: 'construction', color: 'blue-grey-4', tooltip: 'Usable only during downtime between adventures.' },
  ritual: { group: 'Outside combat', icon: 'auto_stories', color: 'blue-grey-4', tooltip: 'Performed as a ritual, taking 10 minutes longer and costing no use.' },
}
const FALLBACK = { group: 'Other', icon: 'more_horiz', color: 'grey-5', tooltip: 'A homebrew cadence; it prints exactly as labelled.' }

export const BASIC_RIDER_CADENCE_ENTRIES: readonly GuidedEntry[] = BASIC_RIDER_CADENCES.map((option) => ({
  value: option.value, label: option.label, ...(CADENCE_GUIDE[option.value] ?? FALLBACK),
}))

const TIMING_GUIDE: Readonly<Record<string, Omit<GuidedEntry, 'value' | 'label'>>> = {
  'As an Action': { group: 'Action economy', icon: 'mdi-sword', color: 'amber-5', tooltip: 'Costs the creature its Action on its turn.' },
  'As a Bonus Action': { group: 'Action economy', icon: 'mdi-flash', color: 'orange-5', tooltip: 'Costs the creature its Bonus Action on its turn.' },
  'As a Reaction': { group: 'Action economy', icon: 'mdi-reply', color: 'purple-4', tooltip: 'Costs its Reaction; usable on another creature\'s turn when the trigger happens.' },
  'At the start of its turn': { group: 'Turn timing', icon: 'first_page', color: 'cyan-5', tooltip: 'Happens automatically as the creature\'s turn begins.' },
  'At the end of its turn': { group: 'Turn timing', icon: 'last_page', color: 'cyan-5', tooltip: 'Happens automatically as the creature\'s turn ends.' },
  'When it takes damage': { group: 'Hit point events', icon: 'heart_broken', color: 'red-5', tooltip: 'Triggers each time the creature takes damage.' },
  'When it regains hit points': { group: 'Hit point events', icon: 'healing', color: 'green-5', tooltip: 'Triggers each time the creature regains hit points.' },
  'When it drops to 0 hit points': { group: 'Hit point events', icon: 'skull', color: 'red-8', tooltip: 'Triggers when the creature is reduced to 0 hit points (Death Throes).' },
  'When it is destroyed': { group: 'Hit point events', icon: 'dangerous', color: 'red-8', tooltip: 'Triggers when the creature is destroyed and cannot return.' },
}
export const BASIC_RIDER_TIMING_ENTRIES: readonly GuidedEntry[] = BASIC_RIDER_TIMINGS.map((timing) => ({
  value: timing, label: timing, ...(TIMING_GUIDE[timing] ?? FALLBACK),
}))
