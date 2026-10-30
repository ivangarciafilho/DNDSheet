import { CR, getCrByNumber, getCrByString } from '../domain/cr-tables.ts'
import { avgRoll, renderBonus, statModifier } from '../domain/math-utils.ts'
import { renderFormulaMacros } from '../domain/formula.ts'
import { formulaContextForMonster } from '../domain/formula-context.ts'
import type {
  DndAttack,
  DndStat,
  Monster,
  MonsterAction,
  MonsterReaction,
  MonsterTrait,
} from '../domain/types.ts'

export type MonsterContext =
  | MonsterTrait
  | Monster['spellcasting']
  | DndAttack
  | MonsterAction
  | Monster['multiattacks']
  | Monster['legendaryActions']
  | Monster['mythicActions']
  | MonsterReaction
  | undefined

export interface ProcessTokensOptions {
  format?: '2014' | '2024'
  context?: MonsterContext
  contextType?: string
}

function getProperty(obj: any, path: string): any {
  if (!obj || !path) return undefined
  const parts = path.split('.')
  let current = obj
  for (const part of parts) {
    if (current == null) return undefined
    current = current[part]
  }
  return current
}

function getStatMod(monster: Monster, stat: string): number {
  const statKey = stat.toUpperCase() as DndStat
  if (monster.stats && statKey in monster.stats) {
    return statModifier(monster.stats[statKey])
  }
  return 0
}

export function processTokens(
  input: string,
  monster: Monster,
  options: ProcessTokensOptions = {}
): string {
  if (!input) return ''
  if (!monster) return input

  let text = input

  // 1. {monster.hp} token
  text = text.replace(/\{monster\.hp\}/gi, () => {
    const hp = monster.HP || { HD: 1, type: 8, modifier: 0 }
    const mod = hp.modifier ?? 0
    const modStr = mod !== 0 ? (mod > 0 ? `+${mod}` : `${mod}`) : ''
    return `{${hp.HD ?? 1}d${hp.type ?? 8}${modStr}}`
  })

  // 1b. Shorthand property tokens: {NAME}, {AC}, {HP}, {PROF}, {PB}, {CANTRIP_TIER}, {TIER}, {STR_MOD}, etc.
  text = text.replace(/\{LAIR_INITIATIVE\}/gi, () => String(monster.initiativeConfig?.lairInitiative ?? 20))
  text = text.replace(/\{(STR|DEX|CON|INT|WIS|CHA)_MOD\}/gi, (_match, s) => {
    return renderBonus(getStatMod(monster, s))
  })
  text = text.replace(/\{(STR|DEX|CON|INT|WIS|CHA)\}/gi, (match, s) => {
    const k = s.toUpperCase() as DndStat
    return monster.stats?.[k] != null ? String(monster.stats[k]) : match
  })
  text = text.replace(/\{(PROF|PB)\}/gi, () => {
    return renderBonus(monster.proficiency ?? 2)
  })
  text = text.replace(/\{AC\}/gi, () => {
    return String(monster.AC ?? 10)
  })
  text = text.replace(/\{HP\}/gi, () => {
    const avg = monster.avgHp || (monster.HP ? Math.floor(monster.HP.HD * ((monster.HP.type + 1) / 2) + monster.HP.modifier) : 10)
    return String(avg)
  })
  text = text.replace(/\{(CANTRIP_TIER|TIER)\}/gi, () => {
    const effective = Math.max(monster.HP?.HD || 1, monster.spellcasting?.level || 1)
    const tier = effective >= 17 ? 4 : effective >= 11 ? 3 : effective >= 5 ? 2 : 1
    return String(tier)
  })

  // 2. Dice rolling token with dynamic formula support: {xdy+z}, {xdy - CHA_MOD}, {1d10 + CHA_MOD}
  text = text.replace(
    /\{(\d+)d(\d+)(?:\s*([+-])\s*([A-Za-z0-9_]+))?\}/gi,
    (_match, countStr, diceStr, signStr, modStr) => {
      const count = parseInt(countStr, 10)
      const dice = parseInt(diceStr, 10)
      let cleanMod = 0
      if (modStr) {
        const upper = modStr.toUpperCase()
        if (upper.endsWith('_MOD')) {
          const stat = upper.replace('_MOD', '')
          cleanMod = getStatMod(monster, stat)
        } else if (upper === 'PROF' || upper === 'PB') {
          cleanMod = monster.proficiency ?? 2
        } else if (['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'].includes(upper)) {
          cleanMod = getStatMod(monster, upper)
        } else {
          cleanMod = parseInt(modStr, 10) || 0
        }
        if (signStr === '-') cleanMod = -cleanMod
      }

      const avg = Math.floor(avgRoll(count, dice) + cleanMod)

      if (dice === 1 || count === 0) {
        return `${avg}`
      }

      const bonusStr = cleanMod !== 0 ? renderBonus(cleanMod, true) : ''
      return `${avg} (${count}d${dice}${bonusStr})`
    }
  )

  // Bare stat mod words like CHA_MOD, STR_MOD
  text = text.replace(/\b(STR|DEX|CON|INT|WIS|CHA)_MOD\b/gi, (_match, s) => {
    return renderBonus(getStatMod(monster, s))
  })

  // 3. Spell Save DC token: {DC:STAT} (with optional preceding "DC " consumed to avoid "DC DC")
  text = text.replace(/(?:DC\s+)?\{DC:(\w{3})\}/gi, (match, statUpper) => {
    const statKey = statUpper.toUpperCase() as DndStat
    if (monster.stats && statKey in monster.stats) {
      const prof = monster.proficiency ?? 2
      const saveDc = 8 + prof + statModifier(monster.stats[statKey])
      return `DC ${saveDc}`
    }
    return match
  })

  // 4. Attack Modifier token: {A:STAT}
  text = text.replace(/\{A:(\w{3})\}/gi, (match, statUpper) => {
    const statKey = statUpper.toUpperCase() as DndStat
    if (monster.stats && statKey in monster.stats) {
      const prof = monster.proficiency ?? 2
      const attackMod = prof + statModifier(monster.stats[statKey])
      return renderBonus(attackMod)
    }
    return match
  })

  // 5. Monster Name token: {NAME}
  text = text.replace(/\{NAME\}/gi, () => {
    const article = monster.useArticleInToken ? 'the ' : ''
    const displayName = monster.nickname ? monster.nickname : (monster.name ?? '')
    return `${article}${displayName}`
  })

  // Capitalize "The" if at start of text or after a sentence break
  text = text.replace(/(?:\.\s*|^)\s*(?:<\/?[bi]>)*\s*(the)\b/gm, (match) => {
    return match.replace(/\bthe\b/, 'The')
  })

  // 6. XP rendering: {XP:CR} or {XP:monster} or {XP:CR+}
  text = text.replace(/\{XP:([\d/]+|monster)(\+)?\}/gi, (match, crParam, additive) => {
    const monsterCrVal = monster.CR ?? 0
    const crData =
      crParam.toLowerCase() === 'monster'
        ? (CR[monsterCrVal] || getCrByNumber(monsterCrVal))
        : getCrByString(crParam)

    if (crData) {
      if (additive != null) {
        const monsterCr = CR[monsterCrVal] || getCrByNumber(monsterCrVal)
        return `${(crData.xp + (monsterCr?.xp ?? 0)).toLocaleString()} XP`
      }
      return `${crData.xp.toLocaleString()} XP`
    }
    return match
  })

  // 7. Generic monster property tokens: {monster.property}
  text = text.replace(/\{monster\.([\w\d[\].]+)\}/gi, (match, propPath) => {
    const val = getProperty(monster, propPath)
    return val !== undefined ? String(val) : match
  })

  // 8. Context-specific tokens (traits, actions)
  if (options.context) {
    const ctx = options.context as any
    if (ctx.limitedUse) {
      text = text.replace(/\{trait\.limitedUse\}/gi, () => {
        if (ctx.limitedUse.count > 0) {
          return ` (${ctx.limitedUse.count}/${ctx.limitedUse.rate})`
        }
        return ''
      })
      text = text.replace(/\{trait\.limitedUse\.count\}/gi, String(ctx.limitedUse.count))
      text = text.replace(/\{trait\.limitedUse\.rate\}/gi, String(ctx.limitedUse.rate))

      text = text.replace(/\{action\.limitedUse\}/gi, () => {
        if (ctx.limitedUse.count > 0) {
          return ` (${ctx.limitedUse.count}/${ctx.limitedUse.rate})`
        }
        return ''
      })
      text = text.replace(/\{action\.limitedUse\.count\}/gi, String(ctx.limitedUse.count))
      text = text.replace(/\{action\.limitedUse\.rate\}/gi, String(ctx.limitedUse.rate))
    }
  }

  // 9. Any remaining {formula}: references and expressions from the formula engine,
  //    e.g. {SPELL_DC}, {HIT_DIE}, {HD d HD_DIE}, {2d6 + 1d8 + STR_MOD}, {8 + PB + CHA_MOD}
  if (text.includes('{')) {
    text = renderFormulaMacros(text, formulaContextForMonster(monster))
  }

  // Normalize double DC artifacts (e.g. "DC DC 19" -> "DC 19")
  text = text.replace(/\bDC\s+DC\b/gi, 'DC')

  return text
}
