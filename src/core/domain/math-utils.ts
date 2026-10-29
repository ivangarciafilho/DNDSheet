import type {
  DndAttack,
  DndDice,
  DndStat,
  Monster,
  MonsterAction,
  MonsterSkill,
} from './types.ts'

export function avgHP(HP: DndDice): number {
  return Math.floor(HP.HD * ((HP.type + 1) / 2) + HP.modifier)
}

export function avgRoll(count: number, dice: number): number {
  if (dice === 1) return count
  return Math.floor(count * ((dice + 1) / 2))
}

export function statModifier(score: number): number {
  return Math.floor((score - 10) / 2)
}

export function renderBonus(number: number, spaces = false): string {
  return `${spaces ? ' ' : ''}${number >= 0 ? '+' : ''}${
    spaces ? ' ' : ''
  }${number}`
}

export function renderModifier(score: number): string {
  return renderBonus(statModifier(score))
}

export function saveModifier(score: number, proficiency: number): number {
  return statModifier(score) + proficiency
}

export function saveModifierForStat(
  monster: Monster,
  stat: keyof typeof monster.stats
): number {
  if (monster.saves[stat].override) {
    return monster.saves[stat].overrideValue
  }
  return (
    statModifier(monster.stats[stat]) +
    (monster.saves[stat].proficient ? monster.proficiency : 0)
  )
}

export function saveForAction(
  monster: Monster,
  stat: DndStat,
  override: MonsterAction['save']
): number {
  if (override.override) {
    return override.overrideValue
  }
  return 8 + monster.proficiency + statModifier(monster.stats[stat])
}

export function bonusForSkill(monster: Monster, skill: MonsterSkill): number {
  if (skill.override) {
    return skill.overrideValue
  }
  const profModifier = skill.expertise ? 2 : skill.proficient ? 1 : 0
  return (
    statModifier(monster.stats[skill.skill.stat]) +
    monster.proficiency * profModifier
  )
}

export function bonusForAttack(monster: Monster, attack: DndAttack): number {
  if (attack.modifier.override) {
    return attack.modifier.overrideValue
  }
  const profModifier = attack.modifier.proficient ? 1 : 0
  return (
    statModifier(monster.stats[attack.modifier.stat]) +
    monster.proficiency * profModifier
  )
}

export function bonusForAttackDamage(
  monster: Monster,
  attack: DndAttack
): number {
  if (attack.damage.modifier.override) {
    return attack.damage.modifier.overrideValue
  }
  return statModifier(monster.stats[attack.damage.modifier.stat])
}

export function bonusForConditionalDamage(
  monster: Monster,
  attack: DndAttack
): number {
  if (attack.alternateDamage.modifier.override) {
    return attack.alternateDamage.modifier.overrideValue
  }
  return statModifier(monster.stats[attack.alternateDamage.modifier.stat])
}
