/**
 * A12.5: subclass spells that are always prepared and always offered, whatever the class filter.
 * SRD 5.2 (2024) lists; other subclasses fall back to the class list.
 */
export const SUBCLASS_SPELLS: Readonly<Record<string, readonly string[]>> = Object.freeze({
  fiend: ['Burning Hands', 'Command', 'Scorching Ray', 'Suggestion', 'Fireball', 'Stinking Cloud', 'Fire Shield', 'Wall of Fire', 'Geas', 'Insect Plague'],
  life: ['Aid', 'Bless', 'Cure Wounds', 'Lesser Restoration', 'Mass Healing Word', 'Revivify', 'Aura of Life', 'Death Ward', 'Greater Restoration', 'Mass Cure Wounds'],
  devotion: ['Protection from Evil and Good', 'Shield of Faith', 'Aid', 'Zone of Truth', 'Beacon of Hope', 'Dispel Magic', 'Freedom of Movement', 'Guardian of Faith', 'Commune', 'Flame Strike'],
})

/** Matches "Fiend", "The Fiend", "Fiend Patron", "Life Domain", "Oath of Devotion" and so on. */
export function subclassSpells(subclass?: string): readonly string[] {
  const key = (subclass ?? '').toLowerCase()
  const hit = Object.keys(SUBCLASS_SPELLS).find((name) => key.includes(name))
  return hit ? SUBCLASS_SPELLS[hit] : []
}
