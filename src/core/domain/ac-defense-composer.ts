/**
 * DNDSheet - Modular Armor Class & Defensive Rule Compositor Engine
 *
 * Implements permutable clause chaining for Armor Class:
 * - Attacker saves with creature-type advantage (e.g. Fiends have Advantage, Bloodied DC)
 * - Outcomes on save success, failure, and otherwise (e.g. double damage, knock prone)
 * - Conditional ACs (without temp HP, vs specific damage types, cover + grapple)
 * - On Hit retaliations (fire damage, bloodied double multiplier)
 */

export interface PermutableAcAttackerSave {
  stat: string
  dc: number
  bloodiedDc?: number
  targetAdvantage?: string
  onSuccess?: {
    target: string
    damage: string
    type: string
  }
  otherwise?: {
    double?: boolean
    knocksProne?: boolean
    custom?: string
  }
}

export interface PermutableAcCondition {
  mode:
    | 'attacker_save'
    | 'without_temp_hp'
    | 'versus_damage_types'
    | 'cover_while_grappling'
    | 'while_grappling'
    | 'on_hit'
    | 'custom'
  baseAc?: number
  secondaryAc?: number
  save?: PermutableAcAttackerSave
  damageTypes?: string[]
  cover?: string
  grappleTarget?: string
  onHit?: {
    target: string
    damage: string | number
    damageType: string
    doubleIfBloodied?: boolean
  }
  customText?: string
}

/**
 * Format a permutable attacker save rule into standard statblock syntax.
 * Example:
 * Attacker must succeed a Charisma Save DC 15 (Fiends have Advantage), On Success Attacker takes 9 (2d8) of Radiant, otherwise double, and knocks prone
 */
export function formatAcAttackerSave(rule: PermutableAcAttackerSave): string {
  const stat = rule.stat.trim() || 'Charisma'
  const statName = stat.length <= 3
    ? (stat.toUpperCase() === 'STR' ? 'Strength' : stat.toUpperCase() === 'DEX' ? 'Dexterity' : stat.toUpperCase() === 'CON' ? 'Constitution' : stat.toUpperCase() === 'INT' ? 'Intelligence' : stat.toUpperCase() === 'WIS' ? 'Wisdom' : 'Charisma')
    : stat

  const parentheticalQualifiers: string[] = []
  if (rule.targetAdvantage?.trim()) {
    parentheticalQualifiers.push(rule.targetAdvantage.trim())
  }
  if (rule.bloodiedDc != null && rule.bloodiedDc > 0) {
    parentheticalQualifiers.push(`${rule.bloodiedDc} when Bloodied`)
  }

  const qualStr = parentheticalQualifiers.length > 0 ? ` (${parentheticalQualifiers.join(', ')})` : ''
  let text = `Attacker must succeed a ${statName} Save DC ${rule.dc}${qualStr}`

  const outcomeParts: string[] = []
  if (rule.onSuccess) {
    const s = rule.onSuccess
    outcomeParts.push(`On Success ${s.target || 'Attacker'} takes ${s.damage} of ${s.type}`)
  }

  if (rule.otherwise) {
    const o = rule.otherwise
    const othParts: string[] = []
    if (o.double) othParts.push('double')
    if (o.knocksProne) othParts.push('and knocks prone')
    if (o.custom) othParts.push(o.custom)
    if (othParts.length > 0) {
      outcomeParts.push(`otherwise ${othParts.join(', ')}`)
    }
  }

  if (outcomeParts.length > 0) {
    text += `, ${outcomeParts.join(', ')}`
  }

  return text
}

/**
 * Format a permutable AC clause according to D&D 5e / 2024 revised modular grammar.
 */
export function formatPermutableAcClause(cond: PermutableAcCondition): string {
  switch (cond.mode) {
    case 'attacker_save': {
      if (!cond.save) return ''
      return formatAcAttackerSave(cond.save)
    }
    case 'without_temp_hp': {
      const sec = cond.secondaryAc ?? 15
      return `${sec} without temporary hit points`
    }
    case 'versus_damage_types': {
      const sec = cond.secondaryAc ?? 15
      const types = cond.damageTypes && cond.damageTypes.length > 0
        ? cond.damageTypes.join(', ')
        : 'Lightning, force or thunder'
      return `${sec} versus attacks that deals ${types}`
    }
    case 'cover_while_grappling': {
      const sec = cond.secondaryAc ?? 20
      const cov = cond.cover || '3/4 Cover'
      const grap = cond.grappleTarget || 'a creature'
      return `${sec} from ${cov}, while Grappling ${grap}`
    }
    case 'while_grappling': {
      const sec = cond.secondaryAc ?? 20
      const grap = cond.grappleTarget || 'a creature'
      return `${sec}, while Grappling ${grap}`
    }
    case 'on_hit': {
      if (!cond.onHit) return ''
      const h = cond.onHit
      let hitStr = `On Hit: ${h.target || 'Attacker'} takes ${h.damage} of ${h.damageType}`
      if (h.doubleIfBloodied) {
        hitStr += ", double if you're bloodied"
      }
      return hitStr
    }
    case 'custom':
      return cond.customText?.trim() || ''
    default:
      return ''
  }
}

/**
 * Compose full AC statblock string from base AC and permutable conditions.
 */
export function composePermutableAcString(
  baseAc: number,
  condition?: PermutableAcCondition
): string {
  if (!condition) return `${baseAc}`
  if (condition.mode === 'attacker_save' && condition.save) {
    return formatAcAttackerSave(condition.save)
  }
  const clause = formatPermutableAcClause(condition)
  if (!clause) return `${baseAc}`
  if (condition.mode === 'on_hit') {
    return `${baseAc}, ${clause}.`
  }
  return `${baseAc}, ${clause}`
}
