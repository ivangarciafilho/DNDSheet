export type RulesEdition = '2014' | '2024'

export interface MetamagicOption {
  name: string
  cost2014: string
  cost2024: string
  effect2014: string
  effect2024: string
  source2014: string
  source2024: string
}

/**
 * Core Sorcerer Metamagic catalog. Descriptions are concise table-facing summaries;
 * the selected rules edition controls costs and the exact rule remains authoritative.
 * Sources: 2014 Player's Handbook, Sorcerer class; 2024 Player's Handbook, Sorcerer class.
 */
export const METAMAGIC_OPTIONS: readonly MetamagicOption[] = Object.freeze([
  { name: 'Careful Spell', cost2014: '1', cost2024: '1', effect2014: 'Protect selected creatures from a spell’s saving throw effect.', effect2024: 'Protect selected creatures from a spell’s saving throw effect.', source2014: 'PHB 2014', source2024: 'PHB 2024' },
  { name: 'Distant Spell', cost2014: '1', cost2024: '1', effect2014: 'Double a spell’s range, or make a touch spell’s range 30 feet.', effect2024: 'Double a spell’s range, or make a touch spell’s range 30 feet.', source2014: 'PHB 2014', source2024: 'PHB 2024' },
  { name: 'Empowered Spell', cost2014: '1', cost2024: '1', effect2014: 'Reroll damage dice, up to your Charisma modifier (minimum one).', effect2024: 'Reroll damage dice, up to your Charisma modifier (minimum one).', source2014: 'PHB 2014', source2024: 'PHB 2024' },
  { name: 'Extended Spell', cost2014: '1', cost2024: '1', effect2014: 'Double a qualifying spell’s duration, to a maximum of 24 hours.', effect2024: 'Double a qualifying spell’s duration, to a maximum of 24 hours.', source2014: 'PHB 2014', source2024: 'PHB 2024' },
  { name: 'Heightened Spell', cost2014: '3', cost2024: '2', effect2014: 'Give one target disadvantage on saves against the spell.', effect2024: 'Give one target disadvantage on saves against the spell.', source2014: 'PHB 2014', source2024: 'PHB 2024' },
  { name: 'Quickened Spell', cost2014: '2', cost2024: '2', effect2014: 'Cast a spell with a casting time of 1 action as a Bonus Action.', effect2024: 'Cast a spell with a casting time of 1 action as a Bonus Action.', source2014: 'PHB 2014', source2024: 'PHB 2024' },
  { name: 'Seeking Spell', cost2014: '2', cost2024: '1', effect2014: 'Reroll a missed spell attack roll.', effect2024: 'Reroll a missed spell attack roll.', source2014: 'PHB 2014', source2024: 'PHB 2024' },
  { name: 'Subtle Spell', cost2014: '1', cost2024: '1', effect2014: 'Cast without Verbal or Somatic components.', effect2024: 'Cast without components except costly or consumed Materials.', source2014: 'PHB 2014', source2024: 'PHB 2024' },
  { name: 'Transmuted Spell', cost2014: '1', cost2024: '1', effect2014: 'Change eligible spell damage to Acid, Cold, Fire, Lightning, Poison, or Thunder.', effect2024: 'Change eligible spell damage to Acid, Cold, Fire, Lightning, Poison, or Thunder.', source2014: 'PHB 2014', source2024: 'PHB 2024' },
  { name: 'Twinned Spell', cost2014: 'Spell level', cost2024: '1', effect2014: 'Target a second eligible creature with the spell.', effect2024: 'Increase the spell’s effective level by one.', source2014: 'PHB 2014', source2024: 'PHB 2024' },
])

const OPTIONS_BY_NAME = new Map(METAMAGIC_OPTIONS.map((option) => [option.name.toLowerCase(), option]))

export function getMetamagicOption(name: string): MetamagicOption | undefined {
  return OPTIONS_BY_NAME.get(name.trim().toLowerCase())
}

export function metamagicCost(name: string, edition: RulesEdition = '2024'): string {
  const option = getMetamagicOption(name)
  return option?.[edition === '2014' ? 'cost2014' : 'cost2024'] ?? ''
}
