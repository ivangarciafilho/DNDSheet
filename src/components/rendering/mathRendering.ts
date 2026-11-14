import {
  DndAttack,
  DndDice,
  DndStat,
  Monster,
  MonsterAction,
  MonsterSkill,
} from '../models'
import N2W from 'number-to-words'
import { SKILL } from 'src/data/SKILL'

// helpers for rendering stats
export function avgHP(HP: DndDice) {
  if (!HP) return 0
  const hd = Number.isFinite(HP.HD) ? HP.HD : 0
  const type = Number.isFinite(HP.type) ? HP.type : 8
  const mod = Number.isFinite(HP.modifier) ? HP.modifier : 0
  return Math.floor(hd * ((type + 1) / 2) + mod)
}

export function avgRoll(count: number, dice: number) {
  const safeCount = Number.isFinite(count) ? count : 0
  const safeDice = Number.isFinite(dice) ? dice : 1
  if (safeDice === 1) return safeCount

  return Math.floor(safeCount * ((safeDice + 1) / 2))
}

export function statModifier(score: number) {
  const num = Number.isFinite(score) ? score : 10
  return Math.floor((num - 10) / 2)
}

export function renderModifier(score: number): string {
  return renderBonus(statModifier(score))
}

export function saveModifier(score: number, proficiency: number) {
  const prof = Number.isFinite(proficiency) ? proficiency : 0
  return statModifier(score) + prof
}

export function saveModifierForStat(
  monster: Monster,
  stat: keyof typeof monster.stats
) {
  if (!monster || !monster.saves || !monster.saves[stat]) return 0
  if (monster.saves[stat].override) {
    return monster.saves[stat].overrideValue ?? 0
  } else {
    const prof = monster.proficiency ?? 2
    const statVal = monster.stats?.[stat] ?? 10
    return (
      statModifier(statVal) +
      (monster.saves[stat].proficient ? prof : 0)
    )
  }
}

export function saveForAction(
  monster: Monster,
  stat: DndStat,
  override?: MonsterAction['save']
) {
  if (override && override.override) {
    return override.overrideValue ?? 10
  } else {
    const prof = monster?.proficiency ?? 2
    const statVal = monster?.stats?.[stat] ?? 10
    return 8 + prof + statModifier(statVal)
  }
}

export function bonusForSkill(monster: Monster, skill: MonsterSkill) {
  if (!skill) return 0
  if (skill.override) {
    return skill.overrideValue ?? 0
  } else {
    const prof = monster?.proficiency ?? 2
    const profModifier = skill.expertise ? 2 : skill.proficient ? 1 : 0
    const statKey = skill.skill?.stat || (skill.key ? (SKILL as any)[String(skill.key).toUpperCase()]?.stat : undefined)
    const statVal = statKey && monster?.stats ? monster.stats[statKey] ?? 10 : 10
    return statModifier(statVal) + prof * profModifier
  }
}

export function bonusForAttack(monster: Monster, attack: DndAttack) {
  if (!attack || !attack.modifier) return 0
  if (attack.modifier.override) {
    return attack.modifier.overrideValue ?? 0
  } else {
    const prof = monster?.proficiency ?? 2
    const profModifier = attack.modifier.proficient ? 1 : 0
    const statKey = attack.modifier.stat ?? 'STR'
    const statVal = monster?.stats?.[statKey] ?? 10
    return statModifier(statVal) + prof * profModifier
  }
}

export function bonusForAttackDamage(monster: Monster, attack: DndAttack) {
  if (!attack || !attack.damage || !attack.damage.modifier) return 0
  if (attack.damage.modifier.override) {
    return attack.damage.modifier.overrideValue ?? 0
  } else {
    const statKey = attack.damage.modifier.stat ?? 'STR'
    const statVal = monster?.stats?.[statKey] ?? 10
    return statModifier(statVal)
  }
}

export function bonusForConditionalDamage(monster: Monster, attack: DndAttack) {
  if (!attack || !attack.alternateDamage || !attack.alternateDamage.modifier) return 0
  if (attack.alternateDamage.modifier.override) {
    return attack.alternateDamage.modifier.overrideValue ?? 0
  } else {
    const statKey = attack.alternateDamage.modifier.stat ?? 'STR'
    const statVal = monster?.stats?.[statKey] ?? 10
    return statModifier(statVal)
  }
}

export function renderBonus(number: number, spaces = false) {
  const num = Number.isFinite(number) ? number : 0
  return `${spaces ? ' ' : ''}${num >= 0 ? '+' : ''}${
    spaces ? ' ' : ''
  }${num}`
}

export function safeToWords(val: any, fallback = 'one'): string {
  const num = typeof val === 'number' ? val : parseInt(String(val), 10)
  if (!Number.isFinite(num)) return fallback
  try {
    return N2W.toWords(num)
  } catch {
    return String(num)
  }
}

export function safeToOrdinal(val: any, fallback = '1st'): string {
  const num = typeof val === 'number' ? val : parseInt(String(val), 10)
  if (!Number.isFinite(num)) return fallback
  try {
    return N2W.toOrdinal(num)
  } catch {
    return String(num)
  }
}
