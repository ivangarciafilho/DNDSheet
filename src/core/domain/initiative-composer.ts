/**
 * DNDSheet - Composable Initiative Mechanics Domain Engine
 *
 * Provides typed domain models, parsers, and formatters for:
 * - Advantage / Disadvantage roll toggles & choices
 * - Target creature type restrictions (e.g., Fiends and Undead have Disadvantage on Initiative Roll)
 * - Composable trigger & action mechanics:
 *   - Cast Spell (e.g., Thaumaturgy, Compelled Duel, Sanctuary)
 *   - Hide / Influence / Search / Study
 *   - Regain Hit Points / Gain Temporary Hit Points (with custom amounts or formulas)
 *   - Movement (e.g., Move up to your speed, Move 10ft)
 *   - Custom narrative mechanics
 */

export type InitiativeAdvantageMode =
  | 'none'
  | 'advantage'
  | 'at_advantage'
  | 'disadvantage'
  | 'at_disadvantage'
  | 'choose_disadvantage'
  | 'choose_lowest'

export type InitiativeActionType =
  | 'none'
  | 'cast_spell'
  | 'hide'
  | 'influence'
  | 'search'
  | 'study'
  | 'regain_hp'
  | 'gain_temp_hp'
  | 'move_speed'
  | 'move_distance'
  | 'custom'

export interface ComposableInitiativeRider {
  id?: string
  advMode?: InitiativeAdvantageMode
  targetCreatureTypes?: string[] // e.g. ['Fiends', 'Undead']
  targetRollEffect?: 'disadvantage' | 'advantage' // e.g. have Disadvantage on Initiative Roll
  actionType?: InitiativeActionType
  spellName?: string // for cast_spell
  hpAmount?: string | number // for regain_hp or gain_temp_hp
  moveDistance?: string | number // for move_distance (e.g. 10 or '10ft')
  customText?: string
}

export const INITIATIVE_ADV_MODE_OPTIONS = [
  { label: 'None', value: 'none', color: 'grey-5' },
  { label: 'At Advantage', value: 'at_advantage', color: 'teal-4' },
  { label: 'At Disadvantage', value: 'at_disadvantage', color: 'orange-4' },
  { label: 'Choose Disadvantage', value: 'choose_disadvantage', color: 'deep-orange-4' },
  { label: 'With Advantage', value: 'advantage', color: 'teal-4' },
  { label: 'Choose lowest Dice', value: 'choose_lowest', color: 'amber-4' },
]

export const INITIATIVE_ACTION_TYPE_OPTIONS = [
  { label: 'None', value: 'none', icon: 'remove', color: 'grey-5' },
  { label: 'Cast Spell', value: 'cast_spell', icon: 'auto_fix_high', color: 'purple-4' },
  { label: 'Hide', value: 'hide', icon: 'visibility_off', color: 'grey-4' },
  { label: 'Influence', value: 'influence', icon: 'record_voice_over', color: 'blue-4' },
  { label: 'Search', value: 'search', icon: 'search', color: 'cyan-4' },
  { label: 'Study', value: 'study', icon: 'menu_book', color: 'indigo-4' },
  { label: 'Regains Hit Points', value: 'regain_hp', icon: 'favorite', color: 'green-4' },
  { label: 'Gains Temporary Hit Points', value: 'gain_temp_hp', icon: 'shield', color: 'teal-4' },
  { label: 'Move up to your speed', value: 'move_speed', icon: 'directions_run', color: 'amber-4' },
  { label: 'Move distance (e.g. 10ft)', value: 'move_distance', icon: 'straighten', color: 'amber-4' },
  { label: 'Custom text...', value: 'custom', icon: 'edit_note', color: 'grey-4' },
]

export const STANDARD_CREATURE_TYPE_OPTIONS = [
  'Aberrations',
  'Beasts',
  'Celestials',
  'Constructs',
  'Dragons',
  'Elementals',
  'Fey',
  'Fiends',
  'Giants',
  'Humanoids',
  'Monstrosities',
  'Oozes',
  'Plants',
  'Undead',
]

/**
 * Format a single composable initiative rider into clean standard 5e phrasing.
 */
export function formatInitiativeRider(rider: ComposableInitiativeRider): string {
  // 1. Target creature types rule: e.g. "Fiends and Undead have Disadvantage on Initiative Roll"
  if (Array.isArray(rider.targetCreatureTypes) && rider.targetCreatureTypes.length > 0) {
    const list = rider.targetCreatureTypes
    let typeStr = ''
    if (list.length === 1) {
      typeStr = list[0]
    } else if (list.length === 2) {
      typeStr = `${list[0]} and ${list[1]}`
    } else {
      typeStr = `${list.slice(0, -1).join(', ')}, and ${list[list.length - 1]}`
    }
    const effect = rider.targetRollEffect === 'advantage' ? 'Advantage' : 'Disadvantage'
    return `${typeStr} have ${effect} on Initiative Roll`
  }

  // 2. Pre-condition prefix: e.g. "At Disadvantage" or "Choose lowest Dice"
  let prefix = ''
  if (rider.advMode === 'at_advantage') {
    prefix = 'At Advantage'
  } else if (rider.advMode === 'at_disadvantage') {
    prefix = 'At Disadvantage'
  } else if (rider.advMode === 'choose_disadvantage') {
    prefix = 'Choose Disadvantage'
  } else if (rider.advMode === 'choose_lowest') {
    prefix = 'Choose lowest Dice'
  } else if (rider.advMode === 'advantage') {
    prefix = 'With Advantage'
  } else if (rider.advMode === 'disadvantage') {
    prefix = 'At Disadvantage'
  }

  // 3. Action mechanic
  let actionStr = ''
  switch (rider.actionType) {
    case 'cast_spell': {
      const spell = rider.spellName?.trim() || 'Spell'
      actionStr = `Cast ${spell}`
      break
    }
    case 'hide':
      actionStr = 'Hide'
      break
    case 'influence':
      actionStr = 'Influence'
      break
    case 'search':
      actionStr = 'Search'
      break
    case 'study':
      actionStr = 'Study'
      break
    case 'regain_hp': {
      const amt = rider.hpAmount ?? 10
      actionStr = `Regains ${amt} Hit Points`
      break
    }
    case 'gain_temp_hp': {
      const amt = rider.hpAmount ?? 10
      actionStr = `Gains ${amt} Temporary Hit Points`
      break
    }
    case 'move_speed':
      actionStr = 'Move up to your speed'
      break
    case 'move_distance': {
      const dist = String(rider.moveDistance || 10).replace(/ft\.?$/i, '').trim()
      actionStr = `Move ${dist}ft`
      break
    }
    case 'custom':
      actionStr = rider.customText?.trim() || ''
      break
  }

  if (prefix && actionStr) {
    // When both are present: e.g. "At Disadvantage, Cast Thaumaturgy" or "At Disadvantage, Hide"
    // In lower/inline context: "at Disadvantage can cast Thaumaturgy" or "at Disadvantage, Hide"
    return `${prefix}, ${actionStr}`
  } else if (prefix) {
    return prefix
  } else if (actionStr) {
    return actionStr
  }

  return ''
}

/**
 * Format a list of composable initiative riders into a single readable string.
 */
export function formatInitiativeRiders(riders: ComposableInitiativeRider[]): string[] {
  if (!Array.isArray(riders) || riders.length === 0) return []
  return riders
    .map(r => formatInitiativeRider(r))
    .filter((s): s is string => Boolean(s && s.trim()))
}
