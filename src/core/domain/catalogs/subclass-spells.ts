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

/** Verified 2024 subclass-grant thresholds; source class levels, not pooled caster levels. */
export const SUBCLASS_GRANT_SOURCE = 'https://www.dndbeyond.com/sources/dnd/br-2024/character-classes'
const SUBCLASS_GRANT_LEVELS: Readonly<Record<string,readonly {level:number;spells:readonly string[]}[]>> = {
 fiend:[{level:3,spells:SUBCLASS_SPELLS.fiend.slice(0,4)},{level:5,spells:SUBCLASS_SPELLS.fiend.slice(4,6)},{level:7,spells:SUBCLASS_SPELLS.fiend.slice(6,8)},{level:9,spells:SUBCLASS_SPELLS.fiend.slice(8,10)}],
 life:[{level:3,spells:SUBCLASS_SPELLS.life.slice(0,4)},{level:5,spells:SUBCLASS_SPELLS.life.slice(4,6)},{level:7,spells:SUBCLASS_SPELLS.life.slice(6,8)},{level:9,spells:SUBCLASS_SPELLS.life.slice(8,10)}],
 devotion:[{level:3,spells:SUBCLASS_SPELLS.devotion.slice(0,2)},{level:5,spells:SUBCLASS_SPELLS.devotion.slice(2,4)},{level:9,spells:SUBCLASS_SPELLS.devotion.slice(4,6)},{level:13,spells:SUBCLASS_SPELLS.devotion.slice(6,8)},{level:17,spells:SUBCLASS_SPELLS.devotion.slice(8,10)}],
}
export function subclassSpellGrants(className:string,subclass:string|undefined,level:number):string[] {
 const name=(subclass||'').toLowerCase(),cls=className.trim().toLowerCase()
 const key=cls==='warlock'&&name.includes('fiend')?'fiend':cls==='cleric'&&name.includes('life')?'life':cls==='paladin'&&name.includes('devotion')?'devotion':undefined
 return key?(SUBCLASS_GRANT_LEVELS[key]||[]).filter(row=>level>=row.level).flatMap(row=>row.spells):[]
}
/** Legacy expanded-list reference, kept separate from 2024 always-prepared grants.
 * https://media.wizards.com/2016/downloads/DND/SRD-OGL_V5.1.pdf pages 17, 33, 50.
 */
const LEGACY_SUBCLASS_LISTS: Readonly<Record<string,readonly string[]>> = {
 fiend:['Burning Hands','Command','Blindness/Deafness','Scorching Ray','Fireball','Stinking Cloud','Fire Shield','Wall of Fire','Flame Strike','Hallow'],
 life:['Bless','Cure Wounds','Lesser Restoration','Spiritual Weapon','Beacon of Hope','Revivify','Death Ward','Guardian of Faith','Mass Cure Wounds','Raise Dead'],
 devotion:['Protection from Evil and Good','Sanctuary','Lesser Restoration','Zone of Truth','Beacon of Hope','Dispel Magic','Freedom of Movement','Guardian of Faith','Commune','Flame Strike'],
}
export function legacySubclassSpells(className:string,subclass?:string):readonly string[] {
 const cls=className.trim().toLowerCase(),name=(subclass||'').toLowerCase()
 const key=cls==='warlock'&&name.includes('fiend')?'fiend':cls==='cleric'&&name.includes('life')?'life':cls==='paladin'&&name.includes('devotion')?'devotion':undefined
 return key?LEGACY_SUBCLASS_LISTS[key]:[]
}
