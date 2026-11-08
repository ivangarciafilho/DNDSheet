/**
 * DNDSheet - Structured Studio Action & Traitor Chaining Engine
 *
 * Formats modular compositions for Actions, Bonus Actions, Traits, and Reactions:
 * - Astral Binding (Action): Multi-target spell attacks with advantages vs Undead across planes
 * - Exorcism (Bonus Action): Multi-plane targeting with save disadvantages, condition suppression, and plane shifting
 * - Inner Light (Trait): Hit Die modification for action recharges
 * - Tether Divinity (Reaction): Trigger on damage/healing dice rolls with Hit Die substitution
 */

export interface StructuredStudioAction {
  name: string
  role: 'action' | 'bonus_action' | 'trait' | 'reaction' | 'legendary' | 'mythic' | 'lair'
  recharge?: string
  school?: string
  spellLevel?: string
  components?: string[]
  duration?: string
  // Mechanics & Targeting
  trigger?: string
  attackCount?: number | string
  attackReach?: 'melee' | 'ranged' | 'melee_or_ranged'
  attackSource?: 'weapon' | 'spell'
  attackBonus?: number
  advantageAgainst?: string
  disadvantageAgainst?: string
  saveStat?: string
  saveDc?: number
  targetCount?: string
  targetKind?: string
  targetQualifier?: string
  targetRange?: string
  targetPlanes?: string[]
  // Outcomes
  outcomes?: {
    trigger: string
    damage?: string
    damageType?: string
    rider?: string
    conditionSuppression?: string
  }[]
  // Simple prose for traits
  description?: string
}

/**
 * Format the structured action into cellular plate lines.
 * Each cell is enclosed with `| cell | cell |`.
 */
export function formatStructuredStudioActionPlate(action: StructuredStudioAction): string[] {
  if (action.role === 'trait') {
    return [action.description || '']
  }

  // Row 1: Header / Classification
  const headParts: string[] = []
  if (action.recharge) {
    headParts.push(`Recharge (${action.recharge})`)
  }
  const compStr = action.components && action.components.length > 0
    ? ` (${action.components.join(', ')})`
    : ''
  headParts.push(`${action.name}${compStr}`)
  if (action.spellLevel || action.school) {
    headParts.push([action.spellLevel, action.school].filter(Boolean).join(' '))
  }

  // Row 1 / Cell 2: Targeting & Scope
  const scopeParts: string[] = []
  if (action.trigger) {
    scopeParts.push(`Trigger: ${action.trigger}`)
  }
  if (action.attackCount != null && action.attackSource && action.attackReach) {
    const reachLabel = action.attackReach === 'ranged' ? 'Ranged' : 'Melee'
    const sourceLabel = action.attackSource === 'spell' ? 'Spell Attacks' : 'Weapon Attacks'
    const bonusStr = action.attackBonus != null ? ` of +${action.attackBonus}` : ''
    const advStr = action.advantageAgainst ? ` (▲▲ Versus ${action.advantageAgainst})` : ''
    scopeParts.push(`${action.attackCount} ${reachLabel} ${sourceLabel}${bonusStr}${advStr}`)
  }

  // Target clause
  const targetDescParts: string[] = []
  if (action.targetKind) {
    targetDescParts.push(action.targetKind)
  }
  if (action.targetQualifier) {
    targetDescParts.push(action.targetQualifier)
  }
  if (action.targetRange) {
    targetDescParts.push(action.targetRange)
  }
  if (targetDescParts.length > 0) {
    let tClause = targetDescParts.join(' ')
    if (action.targetPlanes && action.targetPlanes.length > 0) {
      tClause += ` across ${action.targetPlanes.join(' and ')} planes`
    }
    scopeParts.push(tClause)
  }

  // Save clause
  if (action.saveStat && action.saveDc != null) {
    const disadvStr = action.disadvantageAgainst ? ` (${action.disadvantageAgainst} have Disadvantage)` : ''
    scopeParts.push(`${action.saveStat} Save DC ${action.saveDc}${disadvStr}`)
  }

  const lines: string[] = []
  lines.push(`| ${headParts.join(', ')} | ${scopeParts.join(', ')}. |`)

  // Outcomes rows
  if (action.outcomes && action.outcomes.length > 0) {
    for (const oc of action.outcomes) {
      const ocParts: string[] = []
      if (oc.damage) {
        const typeStr = oc.damageType ? ` ${oc.damageType}` : ''
        ocParts.push(`takes ${oc.damage}${typeStr}`)
      }
      if (oc.rider) {
        ocParts.push(oc.rider)
      }
      if (oc.conditionSuppression) {
        ocParts.push(oc.conditionSuppression)
      }
      lines.push(`| ${oc.trigger}: ${ocParts.join(', ')} |`)
    }
  }

  if (action.description && !action.outcomes?.length) {
    lines.push(`| ${action.description} |`)
  }

  return lines
}
