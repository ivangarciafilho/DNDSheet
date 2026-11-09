/**
 * Plain-language help attached to stable data-help keys in the rendered block.
 * Kept in the presentation layer: these descriptions explain what a field is,
 * not how the game rule must be resolved.
 */
export const STATBLOCK_HELP = Object.freeze({
  'armor-class': 'Armor Class is the target an attack roll must meet or exceed to hit this creature.',
  'hit-points': 'Hit Points show how much damage the creature can take before it is defeated.',
  speed: 'Speed shows the creature’s movement distances and movement types.',
  'challenge-rating': 'Challenge Rating is a compact estimate of the creature’s overall encounter difficulty.',
  'proficiency-bonus': 'Proficiency Bonus is included in checks, attacks, and saves where the creature is proficient.',
  'experience-points': 'Experience Points are the reward associated with this Challenge Rating.',
  initiative: 'Initiative is the creature’s total for determining turn order.',
  vulnerabilities: 'Vulnerabilities list damage types that are especially effective against this creature.',
  resistances: 'Resistances list damage types or conditions that affect this creature less than usual.',
  immunities: 'Immunities list damage types or conditions that do not affect this creature.',
  senses: 'Senses list special ways the creature perceives its surroundings and their ranges.',
  languages: 'Languages list the languages the creature understands or can use to communicate.',
  gear: 'Gear lists equipment carried or used by the creature.',
  search: 'Search is a Wisdom check used to notice hidden creatures, clues, or changes in the environment.',
  study: 'Study is an Intelligence check used to recall knowledge or examine a clue.',
  influence: 'Influence is a Charisma check used to change a creature’s attitude or behavior.',
  hide: 'Hide is a Dexterity check used to conceal yourself or avoid being found.',
  skills: 'Skills that do not belong to Search, Study, Influence, or Hide appear here.',
  tools: 'Tool checks show the tool name, passive score, and check bonus.',
  saves: 'Saving Throws show the creature’s modifiers for resisting effects.',
  'spell-save-dc': 'Spell Save DC is the target a creature must meet on a saving throw against this caster’s spell.',
  'spell-attack': 'Spell Attack is the modifier added to the caster’s spell attack rolls.',
  'spell-slots': 'Spell Slots show the available casting resource by spell level and recovery cadence.',
  cantrips: 'Cantrips are spells that do not use spell slots.',
  metamagic: 'Metamagic options describe how this character can modify spells.',
  'spell-components': 'Spell components show the verbal, somatic, and material requirements of a spell.',
  'spell-school-level': 'School and spell level describe a spell’s magical tradition and its place in the spell progression.',
  'spell-cadence': 'Cadence shows when a spell or other limited use becomes available again.',
  phase: 'The phase label identifies the stage of this creature or the pool that owns the entry.',
  scope: 'Scope describes the target, range, or area affected by this entry.',
  'passive-score': 'A passive score is the check result used when a creature is not actively rolling.',
  'uses-per-day': 'This ability can be used the shown number of times, and the uses return on the displayed schedule.',
  recharge: 'The creature rolls the listed recharge die at the start of its turn; the ability returns if the result falls within the listed range.',
  'recharge-d6': 'At the start of its turn, the creature rolls 1d6. The ability recharges if the result falls within the listed range.',
  'recharge-d12': 'At the start of its turn, the creature rolls 1d12. The ability recharges if the result falls within the listed range.',
  'limited-use': 'This ability has a limited number of uses that return on the listed schedule.',
  'action-entry': 'This plate groups an ability’s name, usage, mechanics, target, and description.',
  reaction: 'A Reaction is an ability used in response to a defined trigger.',
  'bonus-action': 'A Bonus Action is a separate action type with a limited use each turn.',
  'legendary-action': 'Legendary Actions are additional options used outside the creature’s own turn.',
  'entry-name': 'This heading identifies the trait, action, or feature described by the plate.',
  bloodied: 'A creature is Bloodied when its current Hit Points are at or below half its Hit Point maximum (2024 Rules Revision).',
  'temporary-hit-points': 'Temporary Hit Points act as a buffer against damage; they do not stack, cannot be healed, and are lost before regular Hit Points.',
  disengage: 'Taking the Disengage action prevents your movement from provoking Opportunity Attacks for the rest of your turn.',
  dodge: 'Taking the Dodge action imposes Disadvantage on attack rolls against you and gives you Advantage on Dexterity saving throws.',
  cover: 'Cover provides bonuses to AC and Dexterity saving throws: Half Cover (+2), Three-Quarters Cover (+5), and Total Cover (cannot be targeted directly).',
  grappled: 'A Grappled creature’s Speed is 0, it has Disadvantage on attack rolls against targets other than the grappler, and the grappler has Advantage on attacks against it.',
  prone: 'A Prone creature must crawl or spend movement to stand up; attacks against it from within 5 ft. have Advantage, while ranged attacks have Disadvantage.',
  incapacitated: 'An Incapacitated creature can’t take Actions or Reactions, and its Concentration is broken.',
  restrained: 'A Restrained creature’s Speed is 0, attack rolls against it have Advantage, its attack rolls have Disadvantage, and it has Disadvantage on Dexterity saving throws.',
  invisible: 'An Invisible creature is impossible to see without special senses, has Advantage on attack rolls, and attacks against it have Disadvantage.',
} as const)

export type StatblockHelpKey = keyof typeof STATBLOCK_HELP

/** Select an explanatory key without changing the author's displayed usage text. */
export function statblockUsageHelpKey(usage: string | null | undefined): string {
  const value = usage?.trim() ?? ''
  if (!value) return ''
  if (!/^recharge\b/i.test(value)) return /\/\s*day\b/i.test(value) ? 'uses-per-day' : 'limited-use'
  const range = value.match(/(\d+)\s*(?:[–-]\s*(\d+))?\s*$/)
  if (!range) return 'recharge'
  const threshold = Number(range[2] ?? range[1])
  if (threshold <= 6) return 'recharge-d6'
  if (threshold <= 12) return 'recharge-d12'
  return 'recharge'
}

export function statblockHelpText(key: string | null | undefined): string {
  if (!key) return ''
  return STATBLOCK_HELP[key as StatblockHelpKey] ?? ''
}
