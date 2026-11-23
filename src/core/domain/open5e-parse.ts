import type { DndAttack } from './types.ts'

export interface ParsedOpen5eActionHeader {
  name: string
  recharge: string
  limitedUseCount: number
  limitedUseRate: string
  bonusAction: boolean
}

export interface ParsedOpen5eLegendaryCost {
  baseName: string
  cost: number
}

export interface ParsedOpen5eAttackHeader {
  distance: DndAttack['distance']
  kind: DndAttack['kind']
  toHit: number
  reach: number
  standard: number
  long: number
  targetWord: string
}

export interface ParsedOpen5eAdditionalDamage {
  count: number
  dice: number
  type: string
  note: string
}

export interface ParsedOpen5eAttackDamage {
  count: number
  dice: number
  modifier: number | null
  type: string
  additionalDamage: ParsedOpen5eAdditionalDamage[]
  andClause: string
  trailing: string
}

/** Extracts recharge, limited-use counters, and bonus-action flags from Open5e action headers. */
export function parseOpen5eActionHeader(name: string, desc: string): ParsedOpen5eActionHeader {
  let cleanName = name
  let recharge = ''
  let limitedUseCount = 0
  let limitedUseRate = ''

  const rechargeMatch = /[\w\d\s]*\(recharge (\d-\d)\)/i.exec(name)
  if (rechargeMatch) {
    recharge = rechargeMatch[1]
    cleanName = name.substring(0, name.indexOf('(') - 1)
  }

  const limitedMatch = /\((\d+)\/(\w+)\)/i.exec(name)
  if (limitedMatch) {
    limitedUseCount = parseInt(limitedMatch[1], 10)
    limitedUseRate = limitedMatch[2].toUpperCase()
    cleanName = name.substring(0, name.indexOf('(') - 1)
  }

  return {
    name: cleanName,
    recharge,
    limitedUseCount,
    limitedUseRate,
    bonusAction: /^as a bonus action/i.test(desc.trim()),
  }
}

/** Parses `(Costs N Actions)` suffixes from Open5e legendary action names. */
export function parseOpen5eLegendaryCost(name: string): ParsedOpen5eLegendaryCost {
  const match = /\(costs (\d+) actions?\)/i.exec(name)
  return {
    cost: match ? parseInt(match[1], 10) : 1,
    baseName: match ? name.substring(0, name.indexOf('(') - 1) : name,
  }
}

/** Parses Open5e weapon/spell attack line headers (reach, paired ranges, to-hit, target word). */
export function parseOpen5eAttackHeader(desc: string): ParsedOpen5eAttackHeader | null {
  const match =
    /(Melee|Ranged|Melee or Ranged) (Weapon|Spell) Attack: ([+-]\d+) to hit, (?:reach|range) (\d+|\d+\/\d+) ft\.(?: or (?:reach|range) (\d+)\/(\d+) ft\.)?, (\w+) (?:targets?|creatures?)\./i.exec(
      desc,
    )
  if (!match) return null

  const distRaw = match[1].toUpperCase()
  const distance: DndAttack['distance'] =
    distRaw === 'MELEE OR RANGED' ? 'BOTH' : (distRaw as DndAttack['distance'])
  const kind = match[2].toUpperCase() as DndAttack['kind']
  const toHit = parseInt(match[3], 10)
  const rangeToken = match[4]

  let reach = 5
  let standard = 0
  let long = 0
  if (rangeToken.includes('/')) {
    const [shortRaw, longRaw] = rangeToken.split('/')
    const shortVal = parseInt(shortRaw, 10)
    const longVal = parseInt(longRaw, 10)
    reach = shortVal
    standard = shortVal
    long = longVal
  } else {
    const single = parseInt(rangeToken, 10)
    reach = single
    standard = single
  }

  if (match[5] != null && match[6] != null) {
    standard = parseInt(match[5], 10)
    long = parseInt(match[6], 10)
  }

  return {
    distance,
    kind,
    toHit,
    reach,
    standard,
    long,
    targetWord: match[7],
  }
}

/** Parses primary `Hit:` damage, extra elemental dice clauses, and trailing condition text. */
export function parseOpen5eAttackDamage(desc: string): ParsedOpen5eAttackDamage | null {
  const match =
    /Hit: \d+ \((\d+)d(\d+)\s*([+-]\s*\d+)?\) (\w+) damage\.?(\s?,?\s?plus [^.]+\.)?(?:,\s?(and [^.]+\.?))?(.*)/i.exec(
      desc,
    )
  if (!match) return null

  const additionalDamage: ParsedOpen5eAdditionalDamage[] = []
  if (match[5]) {
    for (const extra of match[5].matchAll(/\((\d+)d(\d+)\) (\w+) damage/gi)) {
      additionalDamage.push({
        count: parseInt(extra[1], 10),
        dice: parseInt(extra[2], 10),
        type: extra[3],
        note: '',
      })
    }
  }

  return {
    count: parseInt(match[1], 10),
    dice: parseInt(match[2], 10),
    modifier: match[3] ? parseInt(match[3].replaceAll(' ', ''), 10) : null,
    type: match[4],
    additionalDamage,
    andClause: (match[6] ?? '').trim(),
    trailing: (match[7] ?? '').trim(),
  }
}
