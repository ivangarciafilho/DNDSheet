/**
 * DNDSheet - Modular Speeds & Traversal Cunning Actions Compositor Engine
 *
 * Implements compoundable speed and traversal modifiers and movement action riders:
 * - Dash can Shove as a Bonus Action
 * - Dash or Disengage: Teleport as a Bonus Action up to 10 ft. of a point you can see / familiar to you
 * - Dash or Disengage: Creatures 5 ft. of you take 1d8 fire damage
 * - Once per round: when a creature enters 5 ft. of you, it takes 1d10 fire damage
 * - Once per round per creature: when a creature leaves 5 ft. of you, it takes 1d10 fire damage
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
  phaseStage?: number
  condition?: string
  freeformFallback?: string
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
    label: 'Disengage: Gain 10 Temporary Hit Points',
    action: 'Disengage',
    actionType: 'Action',
    rider: 'Gain 10 Temporary Hit Points',
  },
  {
    id: 'dodge-lightly-obscured',
    label: 'Dodge: Creatures 5 ft. of you are lightly obscured',
    action: 'Dodge',
    actionType: 'Action',
    rider: 'Creatures 5 ft. of you are lightly obscured',
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
    id: 'disengage-teleport-10 ft.-see',
    label: 'Disengage: Teleport up to 10 ft. to a point you can see',
    action: 'Disengage',
    actionType: 'Action',
    rider: 'Teleport up to 10 ft. to a point you can see',
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
    label: 'Dash or Disengage: Teleport 10 ft. (point you can see)',
    action: 'Dash, or Disengage',
    actionType: 'Bonus Action',
    rider: 'Teleport as a Bonus Action up to 10 ft. of a point you can see',
  },
  {
    id: 'dash-disengage-teleport-familiar',
    label: 'Dash or Disengage: Teleport 10 ft. (point familiar to you)',
    action: 'Dash, or Disengage',
    actionType: 'Bonus Action',
    rider: 'Teleport as a Bonus Action up to 10 ft. of a point familiar to you',
  },
  {
    id: 'dash-disengage-fire',
    label: 'Dash or Disengage: 5 ft. Damage Aura (1d8 fire)',
    action: 'Dash, or Disengage',
    actionType: 'Free',
    rider: 'Creatures 5 ft. of you takes 1d8 of fire damage',
  },
  {
    id: 'once-per-round-enter-fire',
    label: 'Once per round: Creature enters 5 ft. takes 1d10 Fire',
    action: 'Once per round',
    actionType: 'Reaction',
    rider: 'when a creature enters 5 ft. of you, it takes 1d10 fire damage',
  },
  {
    id: 'once-per-round-leave-fire',
    label: 'Once per round per creature: Creature leaves 5 ft. takes 1d10 Fire',
    action: 'Once per round per creature',
    actionType: 'Reaction',
    rider: 'when a creature leaves 5 ft. of you, it takes 1d10 fire damage',
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
function formatBaseSpeedActionRider(rider: SpeedActionRider): string {
  const trimmedRider = (rider.rider || '').trim()
  if (!trimmedRider) {
    return rider.freeformFallback?.trim() || ''
  }
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

export function formatSpeedActionRider(rider: SpeedActionRider): string {
  if (!rider) return ''
  const base = formatBaseSpeedActionRider(rider)
  if (!base) return ''

  const phasePrefix =
    rider.phaseStage !== undefined && Number.isFinite(rider.phaseStage)
      ? `[Phase ${rider.phaseStage}] `
      : ''
  const cond = rider.condition?.trim()
  const condSuffix =
    cond && !base.toLowerCase().includes(cond.toLowerCase()) ? ` (${cond})` : ''

  return `${phasePrefix}${base}${condSuffix}`
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

export interface ParsedSpeedMovement {
  mode: 'walk' | 'fly' | 'swim' | 'climb' | 'burrow' | 'teleport'
  valueFt: number
  note?: string
  raw: string
}

export interface MigratedLegacySpeed {
  rawSpeed: string
  baseSpeedText: string
  speeds: ParsedSpeedMovement[]
  riders: SpeedActionRider[]
  freeformFallback?: string
  lossless: boolean
}

function splitTopLevelSpeedSegments(raw: string): string[] {
  const segments: string[] = []
  let current = ''
  let depth = 0
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i]
    if (ch === '(' || ch === '[') depth++
    else if ((ch === ')' || ch === ']') && depth > 0) depth--
    if (ch === ',' && depth === 0) {
      const trimmed = current.trim()
      if (trimmed) segments.push(trimmed)
      current = ''
    } else {
      current += ch
    }
  }
  const tail = current.trim()
  if (tail) segments.push(tail)
  return segments
}

export function migrateLegacySpeedString(rawSpeed: string): MigratedLegacySpeed {
  const trimmed = (rawSpeed || '').trim()
  if (!trimmed) {
    return { rawSpeed: '', baseSpeedText: '', speeds: [], riders: [], lossless: true }
  }

  const segments = splitTopLevelSpeedSegments(trimmed)
  const baseSegments: string[] = []
  const speeds: ParsedSpeedMovement[] = []
  const riders: SpeedActionRider[] = []
  const freeformSegments: string[] = []

  segments.forEach((seg, idx) => {
    const speedMatch = seg.match(
      /^(?:(walk|fly|swim|climb|burrow|teleport)\s+)?(\d+)\s*ft\.?(?:\s*\(([^)]+)\))?$/i
    )
    if (speedMatch) {
      const mode = (speedMatch[1] ? speedMatch[1].toLowerCase() : 'walk') as ParsedSpeedMovement['mode']
      const valueFt = Number.parseInt(speedMatch[2], 10)
      const note = speedMatch[3]?.trim()
      speeds.push({ mode, valueFt, ...(note ? { note } : {}), raw: seg })
      baseSegments.push(seg)
      return
    }

    let working = seg
    let phaseStage: number | undefined
    const phaseMatch = working.match(/^\[Phase\s+(\d+)\]\s*(.+)$/i)
    if (phaseMatch) {
      phaseStage = Number.parseInt(phaseMatch[1], 10)
      working = phaseMatch[2].trim()
    }

    let condition: string | undefined
    const condMatch = working.match(/^(.+?)\s*\(((?:while|when|if|below|above|during|under)[^)]+)\)$/i)
    if (condMatch) {
      working = condMatch[1].trim()
      condition = condMatch[2].trim()
    }

    const colonMatch = working.match(/^([^:]{2,40}):\s*(.+)$/)
    if (colonMatch) {
      riders.push({
        id: `legacy-rider-${idx + 1}`,
        action: colonMatch[1].trim(),
        rider: colonMatch[2].trim(),
        ...(phaseStage !== undefined ? { phaseStage } : {}),
        ...(condition ? { condition } : {}),
      })
      return
    }

    const canMatch = working.match(/^([A-Za-z]+(?:\s+or\s+[A-Za-z]+)?)\s+(can\s+.+)$/i)
    if (canMatch) {
      riders.push({
        id: `legacy-rider-${idx + 1}`,
        action: canMatch[1].trim(),
        rider: canMatch[2].trim(),
        ...(phaseStage !== undefined ? { phaseStage } : {}),
        ...(condition ? { condition } : {}),
      })
      return
    }

    freeformSegments.push(seg)
  })

  const baseSpeedText = baseSegments.join(', ')
  const freeformFallback = freeformSegments.length > 0 ? freeformSegments.join(', ') : undefined
  return {
    rawSpeed: trimmed,
    baseSpeedText,
    speeds,
    riders,
    ...(freeformFallback ? { freeformFallback } : {}),
    lossless: true,
  }
}

export function composeMigratedSpeed(migrated: MigratedLegacySpeed): string {
  const parts: string[] = []
  if (migrated.baseSpeedText) parts.push(migrated.baseSpeedText)
  for (const r of migrated.riders) {
    const formatted = formatSpeedActionRider(r)
    if (formatted) parts.push(formatted)
  }
  if (migrated.freeformFallback?.trim()) {
    parts.push(migrated.freeformFallback.trim())
  }
  return parts.join(', ')
}
