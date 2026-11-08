/**
 * DNDSheet - Modular Speeds & Traversal Cunning Actions Compositor Engine
 *
 * Implements compoundable speed and traversal modifiers and movement action riders:
 * - Dash can Shove as a Bonus Action
 * - Dash or Disengage: Teleport as a Bonus Action up to 10ft of a point you can see / familiar to you
 * - Dash or Disengage: Creatures 5ft of you take 1d8 fire damage
 * - Once per round: when a creature enters 5ft of you, it takes 1d10 fire damage
 * - Once per round per creature: when a creature leaves 5ft of you, it takes 1d10 fire damage
 * - Teleport to a point visited this turn
 * - Dodge or Disengage, can Hide as a Bonus Action
 * - Disengage, shift to the Ethereal Plane
 */

export interface TraversalCunningRider {
  actions: ('Dash' | 'Disengage' | 'Dodge')[]
  separator?: ' or ' | ', or '
  rider: string
}

export interface SpeedActionRider {
  id: string
  action: string
  actionType?: 'Action' | 'Bonus Action' | 'Reaction' | 'Free'
  rider: string
  trigger?: string
}

export const SPEED_ACTION_RIDER_PRESETS: Array<{
  id: string
  label: string
  action: string
  actionType: 'Action' | 'Bonus Action' | 'Reaction' | 'Free'
  rider: string
}> = [
  {
    id: 'disengage-temp-hp',
    label: 'Disengage: Gain 10 of Temporary Hit Points',
    action: 'Disengage',
    actionType: 'Action',
    rider: 'Gain 10 of Temporary Hit Points',
  },
  {
    id: 'dodge-lightly-obscured',
    label: 'Dodge: Creatures 5ft of you are lightly obscured',
    action: 'Dodge',
    actionType: 'Action',
    rider: 'Creatures 5ft of you are lightly obscured',
  },
  {
    id: 'dash-adv-str-dex-saves',
    label: 'Dash: Until End Of Turn: Advantage on Strength, and Dexterity Saving Throws',
    action: 'Dash',
    actionType: 'Action',
    rider: 'Until End Of Turn: Advantage on Strength, and Dexterity Saving Throws',
  },
  {
    id: 'dash-disengage-teleport-visited-eot',
    label: 'Dash, Disengage: At end of turn: Teleports to unoccupied space visited this turn',
    action: 'Dash, Disengage',
    actionType: 'Action',
    rider: 'At end of turn: Teleports to unoccupied space visited this turn',
  },
  {
    id: 'dash-disengage-teleport-familiar-eot',
    label: 'Dash, Disengage: At end of turn: Teleports to unoccupied space familiar to you',
    action: 'Dash, Disengage',
    actionType: 'Action',
    rider: 'At end of turn: Teleports to unoccupied space familiar to you',
  },
  {
    id: 'disengage-teleport-10ft-see',
    label: 'Disengage: Teleport up to 10ft to a point you can see',
    action: 'Disengage',
    actionType: 'Action',
    rider: 'Teleport up to 10ft to a point you can see',
  },
  {
    id: 'dash-shove-ba',
    label: 'Dash can Shove as a Bonus Action',
    action: 'Dash',
    actionType: 'Bonus Action',
    rider: 'can Shove as a Bonus Action',
  },
  {
    id: 'dash-disengage-teleport-see',
    label: 'Dash or Disengage: Teleport 10ft (point you can see)',
    action: 'Dash, or Disengage',
    actionType: 'Bonus Action',
    rider: 'Teleport as a Bonus Action up to 10ft of a point you can see',
  },
  {
    id: 'dash-disengage-teleport-familiar',
    label: 'Dash or Disengage: Teleport 10ft (point familiar to you)',
    action: 'Dash, or Disengage',
    actionType: 'Bonus Action',
    rider: 'Teleport as a Bonus Action up to 10ft of a point familiar to you',
  },
  {
    id: 'dash-disengage-fire',
    label: 'Dash or Disengage: 5ft Damage Aura (1d8 fire)',
    action: 'Dash, or Disengage',
    actionType: 'Free',
    rider: 'Creatures 5ft of you takes 1d8 of fire damage',
  },
  {
    id: 'once-per-round-enter-fire',
    label: 'Once per round: Creature enters 5ft takes 1d10 Fire',
    action: 'Once per round',
    actionType: 'Reaction',
    rider: 'when a creature enters 5ft of you, it takes 1d10 fire damage',
  },
  {
    id: 'once-per-round-leave-fire',
    label: 'Once per round per creature: Creature leaves 5ft takes 1d10 Fire',
    action: 'Once per round per creature',
    actionType: 'Reaction',
    rider: 'when a creature leaves 5ft of you, it takes 1d10 fire damage',
  },
  {
    id: 'teleport-visited-turn',
    label: 'Teleport to a point visited this turn',
    action: 'General',
    actionType: 'Bonus Action',
    rider: 'Teleport to a point visited this turn',
  },
  {
    id: 'dodge-disengage-hide-ba',
    label: 'Dodge or Disengage, can Hide as a Bonus Action',
    action: 'Dodge or Disengage',
    actionType: 'Bonus Action',
    rider: 'can Hide as a Bonus Action',
  },
  {
    id: 'disengage-ethereal-shift',
    label: 'Disengage, shift to the Ethereal Plane',
    action: 'Disengage',
    actionType: 'Bonus Action',
    rider: 'shift to the Ethereal Plane',
  },
]

/**
 * Format a compound cunning action rider into standard statblock syntax.
 */
export function formatTraversalCunningRider(rider: TraversalCunningRider): string {
  const sep = rider.separator || (rider.actions.length > 2 ? ', or ' : ' or ')
  const actionText = rider.actions.join(sep)
  return `${actionText} (${rider.rider.trim()})`
}

/**
 * Format an authored movement action rider into clean statblock prose.
 */
export function formatSpeedActionRider(rider: SpeedActionRider): string {
  if (!rider || !rider.rider || !rider.rider.trim()) return ''
  const trimmedRider = rider.rider.trim()
  const act = (rider.action || '').trim()

  if (!act || act.toLowerCase() === 'general' || act.toLowerCase() === 'none') {
    return trimmedRider
  }

  // Already prefixed with action name or punctuation
  if (trimmedRider.toLowerCase().startsWith(act.toLowerCase())) {
    return trimmedRider
  }

  if (trimmedRider.startsWith(':') || trimmedRider.startsWith(',')) {
    return `${act}${trimmedRider}`
  }

  if (/^can\s+/i.test(trimmedRider)) {
    if (act.includes(' or ') || act.includes(',')) {
      return `${act}, ${trimmedRider}`
    }
    return `${act} ${trimmedRider}`
  }

  if (/^shift\s+/i.test(trimmedRider)) {
    return `${act}, ${trimmedRider}`
  }

  if (/^when\s+/i.test(trimmedRider) || act.toLowerCase().startsWith('once per')) {
    return `${act}: ${trimmedRider}`
  }

  // Standard action colon syntax
  return `${act}: ${trimmedRider}`
}

/**
 * Compose a full speed line with base speeds and compoundable cunning riders.
 * Example:
 * 30 ft., Dash can Shove as a Bonus Action, tracking 30 ft.
 */
export function composeSpeedWithRiders(
  baseSpeedText: string,
  riders: (TraversalCunningRider | SpeedActionRider)[]
): string {
  if (!riders || riders.length === 0) return baseSpeedText
  const formattedRiders = riders
    .map((r) => ('actions' in r ? formatTraversalCunningRider(r) : formatSpeedActionRider(r)))
    .filter(Boolean)
  if (formattedRiders.length === 0) return baseSpeedText
  return `${baseSpeedText}, ${formattedRiders.join(', ')}`
}
