import type { Monster } from './types.ts'

/** Innate systems survive deletion/promotion of the legacy primary class adapter. */
export function innateCastingContext(source: Monster['spellcasting']): Monster['spellcasting'] {
  return { ...source, stat: source.innateStat || source.stat, save: source.innateSave || source.save, attack: source.innateAttack || source.attack, modifier: source.innateModifier || source.modifier }
}
export function resolveCastingAbility(source: Pick<Monster['spellcasting'], 'stat' | 'save' | 'attack' | 'modifier'>, stats: Record<string, number>, proficiency: number) {
  const native = Math.floor(((stats[source.stat || 'INT'] ?? 10) - 10) / 2)
  return {
    save: source.save?.override ? source.save.overrideValue : 8 + proficiency + native,
    attack: source.attack?.override ? source.attack.overrideValue : proficiency + native,
    modifier: source.modifier?.override ? source.modifier.overrideValue : native,
  }
}
