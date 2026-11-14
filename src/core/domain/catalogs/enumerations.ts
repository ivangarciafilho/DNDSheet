/**
 * Canonical 5e enumeration catalogs shared across editor pickers, composers, and domain logic.
 * Pure TypeScript (no Vue/i18n imports) so Node unit tests and browser UI read the same source of truth.
 */
import { STANDARD_ALIGNMENT } from '../../../data/ALIGNMENT.ts'
import { ALL_OFFICIAL_LANGUAGES, EXOTIC_LANGUAGES, MONSTER_LANGUAGES, REGIONAL_LANGUAGES, SPECIAL_LANGUAGES, STANDARD_LANGUAGES } from '../../../data/LANGUAGES.ts'
import { CREATURE_SIZE, HD_FOR_SIZE } from '../../../data/SIZE.ts'
import { STANDARD_CREATURE_TYPE } from '../../../data/TYPE.ts'
import { CADENCES } from '../cadence.ts'

export type CatalogId =
  | 'sizes'
  | 'creatureTypes'
  | 'alignments'
  | 'damageTypes'
  | 'conditions'
  | 'languages'
  | 'senses'
  | 'skills'
  | 'tools'
  | 'schools'
  | 'spellLevels'
  | 'recharge'
  | 'roles'

export interface CanonicalCatalogEntry<T extends string | number = string> {
  value: T
  label: string
  group?: string
  badge?: string
  meta?: Record<string, string>
}

export interface CanonicalCatalog<T extends string | number = string> {
  id: CatalogId
  label: string
  preserveOrder: boolean
  allowCustom: boolean
  entries: readonly CanonicalCatalogEntry<T>[]
}

const ORDINAL_LEVELS = [
  'Cantrip',
  '1st Level',
  '2nd Level',
  '3rd Level',
  '4th Level',
  '5th Level',
  '6th Level',
  '7th Level',
  '8th Level',
  '9th Level',
] as const

const CREATURE_TYPE_GROUPS: Record<string, string> = {
  Humanoid: 'Common',
  Beast: 'Common',
  Monstrosity: 'Common',
  Undead: 'Planar & Arcane',
  Construct: 'Planar & Arcane',
  Elemental: 'Planar & Arcane',
  Fey: 'Planar & Arcane',
  Fiend: 'Planar & Arcane',
  Celestial: 'Planar & Arcane',
  Aberration: 'Planar & Arcane',
  Dragon: 'Apex & Primeval',
  Giant: 'Apex & Primeval',
  Ooze: 'Apex & Primeval',
  Plant: 'Apex & Primeval',
  'Swarm of Tiny Beasts': 'Swarm & Variant',
  Humanoid_or_Other: 'Swarm & Variant',
}

function sizeDieLabel(size: string): string {
  const hd = HD_FOR_SIZE[size as keyof typeof HD_FOR_SIZE]
  return hd ? `d${hd}` : 'HD'
}

function languageGroup(lang: string): string {
  if (STANDARD_LANGUAGES.includes(lang)) return 'Standard'
  if (EXOTIC_LANGUAGES.includes(lang)) return 'Exotic'
  if (MONSTER_LANGUAGES.includes(lang)) return 'Monster'
  if (REGIONAL_LANGUAGES.includes(lang)) return 'Regional'
  if (SPECIAL_LANGUAGES.includes(lang)) return 'Special'
  return 'Other'
}

export const CANONICAL_DAMAGE_TYPES: readonly CanonicalCatalogEntry[] = [
  { value: 'Acid', label: 'Acid', group: 'Energy' },
  { value: 'Cold', label: 'Cold', group: 'Energy' },
  { value: 'Fire', label: 'Fire', group: 'Energy' },
  { value: 'Force', label: 'Force', group: 'Energy' },
  { value: 'Lightning', label: 'Lightning', group: 'Energy' },
  { value: 'Necrotic', label: 'Necrotic', group: 'Energy' },
  { value: 'Poison', label: 'Poison', group: 'Energy' },
  { value: 'Psychic', label: 'Psychic', group: 'Energy' },
  { value: 'Radiant', label: 'Radiant', group: 'Energy' },
  { value: 'Thunder', label: 'Thunder', group: 'Energy' },
  { value: 'Bludgeoning', label: 'Bludgeoning', group: 'Physical' },
  { value: 'Piercing', label: 'Piercing', group: 'Physical' },
  { value: 'Slashing', label: 'Slashing', group: 'Physical' },
  { value: 'Non-magical bludgeoning', label: 'Non-magical bludgeoning', group: 'Bypassed Physical' },
  { value: 'Non-magical non-adamintine bludgeoning', label: 'Non-magical non-adamantine bludgeoning', group: 'Bypassed Physical' },
  { value: 'Non-magical non-silvered bludgeoning', label: 'Non-magical non-silvered bludgeoning', group: 'Bypassed Physical' },
  { value: 'Non-magical piercing', label: 'Non-magical piercing', group: 'Bypassed Physical' },
  { value: 'Non-magical non-adamantine piercing', label: 'Non-magical non-adamantine piercing', group: 'Bypassed Physical' },
  { value: 'Non-magical non-silvered piercing', label: 'Non-magical non-silvered piercing', group: 'Bypassed Physical' },
  { value: 'Non-magical slashing', label: 'Non-magical slashing', group: 'Bypassed Physical' },
  { value: 'Non-magical non-adamantine slashing', label: 'Non-magical non-adamantine slashing', group: 'Bypassed Physical' },
  { value: 'Non-magical non-silvered slashing', label: 'Non-magical non-silvered slashing', group: 'Bypassed Physical' },
  { value: 'Non-magical bludgeoning, piercing, and slashing', label: 'Non-magical bludgeoning, piercing, and slashing', group: 'Bypassed Physical' },
  {
    value: "Bludgeoning, piercing, and slashing from non-magical attacks that aren't adamantine",
    label: "Bludgeoning, piercing, and slashing from non-magical attacks that aren't adamantine",
    group: 'Bypassed Physical',
  },
  { value: 'Melee attacks', label: 'Melee attacks', group: 'Special' },
  { value: 'Ranged attacks', label: 'Ranged attacks', group: 'Special' },
  { value: 'Spells', label: 'Spells', group: 'Special' },
  { value: 'Traps', label: 'Traps', group: 'Special' },
  { value: 'Magical weapons wielded by chaotic creatures', label: 'Magical weapons (Chaotic)', group: 'Special' },
  { value: 'Magical weapons wielded by evil creatures', label: 'Magical weapons (Evil)', group: 'Special' },
  { value: 'Magical weapons wielded by good creatures', label: 'Magical weapons (Good)', group: 'Special' },
  { value: 'Magical weapons wielded by lawful creatures', label: 'Magical weapons (Lawful)', group: 'Special' },
  { value: 'Magical weapons wielded by neutral creatures', label: 'Magical weapons (Neutral)', group: 'Special' },
] as const

export const CANONICAL_CONDITIONS: readonly CanonicalCatalogEntry[] = [
  { value: 'Blinded', label: 'Blinded', group: 'Sensory & Mind' },
  { value: 'Charmed', label: 'Charmed', group: 'Sensory & Mind' },
  { value: 'Deafened', label: 'Deafened', group: 'Sensory & Mind' },
  { value: 'Frightened', label: 'Frightened', group: 'Sensory & Mind' },
  { value: 'Grappled', label: 'Grappled', group: 'Movement & Control' },
  { value: 'Incapacitated', label: 'Incapacitated', group: 'Incapacitating' },
  { value: 'Invisible', label: 'Invisible', group: 'Sensory & Mind' },
  { value: 'Paralyzed', label: 'Paralyzed', group: 'Incapacitating' },
  { value: 'Petrified', label: 'Petrified', group: 'Incapacitating' },
  { value: 'Poisoned', label: 'Poisoned', group: 'Affliction' },
  { value: 'Prone', label: 'Prone', group: 'Movement & Control' },
  { value: 'Restrained', label: 'Restrained', group: 'Movement & Control' },
  { value: 'Stunned', label: 'Stunned', group: 'Incapacitating' },
  { value: 'Unconscious', label: 'Unconscious', group: 'Incapacitating' },
  { value: 'Diseased', label: 'Diseased', group: 'Affliction' },
  { value: 'Exhaustion', label: 'Exhaustion', group: 'Affliction' },
  { value: 'Sleep', label: 'Sleep', group: 'Affliction' },
] as const

export const CANONICAL_SENSES: readonly CanonicalCatalogEntry[] = [
  { value: 'Darkvision', label: 'Darkvision', group: 'Standard Senses', badge: '60 ft.' },
  { value: 'Superior Darkvision', label: 'Superior Darkvision', group: 'Standard Senses', badge: '120 ft.' },
  { value: 'Blindsight', label: 'Blindsight', group: 'Special Perception', badge: 'radius' },
  { value: 'Tremorsense', label: 'Tremorsense', group: 'Special Perception', badge: 'radius' },
  { value: 'Truesight', label: 'Truesight', group: 'Special Perception', badge: 'radius' },
] as const

export const CANONICAL_SKILLS: readonly CanonicalCatalogEntry[] = [
  { value: 'ATHLETICS', label: 'Athletics', group: 'STR', badge: 'STR', meta: { stat: 'STR' } },
  { value: 'ACROBATICS', label: 'Acrobatics', group: 'DEX', badge: 'DEX', meta: { stat: 'DEX' } },
  { value: 'INITIATIVE', label: 'Initiative', group: 'DEX', badge: 'DEX', meta: { stat: 'DEX' } },
  { value: 'SLIGHT_OF_HAND', label: 'Sleight of Hand', group: 'DEX', badge: 'DEX', meta: { stat: 'DEX' } },
  { value: 'STEALTH', label: 'Stealth', group: 'DEX', badge: 'DEX', meta: { stat: 'DEX' } },
  { value: 'ARCANA', label: 'Arcana', group: 'INT', badge: 'INT', meta: { stat: 'INT' } },
  { value: 'HISTORY', label: 'History', group: 'INT', badge: 'INT', meta: { stat: 'INT' } },
  { value: 'INVESTIGATION', label: 'Investigation', group: 'INT', badge: 'INT', meta: { stat: 'INT' } },
  { value: 'NATURE', label: 'Nature', group: 'INT', badge: 'INT', meta: { stat: 'INT' } },
  { value: 'RELIGION', label: 'Religion', group: 'INT', badge: 'INT', meta: { stat: 'INT' } },
  { value: 'ANIMAL_HANDLING', label: 'Animal Handling', group: 'WIS', badge: 'WIS', meta: { stat: 'WIS' } },
  { value: 'INSIGHT', label: 'Insight', group: 'WIS', badge: 'WIS', meta: { stat: 'WIS' } },
  { value: 'MEDICINE', label: 'Medicine', group: 'WIS', badge: 'WIS', meta: { stat: 'WIS' } },
  { value: 'PERCEPTION', label: 'Perception', group: 'WIS', badge: 'WIS', meta: { stat: 'WIS' } },
  { value: 'SURVIVAL', label: 'Survival', group: 'WIS', badge: 'WIS', meta: { stat: 'WIS' } },
  { value: 'DECEPTION', label: 'Deception', group: 'CHA', badge: 'CHA', meta: { stat: 'CHA' } },
  { value: 'INTIMIDATION', label: 'Intimidation', group: 'CHA', badge: 'CHA', meta: { stat: 'CHA' } },
  { value: 'PERFORMANCE', label: 'Performance', group: 'CHA', badge: 'CHA', meta: { stat: 'CHA' } },
  { value: 'PERSUASION', label: 'Persuasion', group: 'CHA', badge: 'CHA', meta: { stat: 'CHA' } },
] as const

export const CANONICAL_TOOLS: readonly CanonicalCatalogEntry[] = [
  { value: 'Disguise Kit', label: 'Disguise Kit', group: 'Specialist Kit', meta: { color: 'deep-purple-6', icon: 'fa-solid fa-masks-theater' } },
  { value: 'Forgery Kit', label: 'Forgery Kit', group: 'Specialist Kit', meta: { color: 'deep-purple-6', icon: 'fa-solid fa-feather-pointed' } },
  { value: 'Herbalism Kit', label: 'Herbalism Kit', group: 'Specialist Kit', meta: { color: 'green-7', icon: 'fa-solid fa-leaf' } },
  { value: "Navigator's Tools", label: "Navigator's Tools", group: 'Specialist Kit', meta: { color: 'cyan-7', icon: 'fa-solid fa-compass' } },
  { value: "Poisoner's Kit", label: "Poisoner's Kit", group: 'Specialist Kit', meta: { color: 'purple-7', icon: 'fa-solid fa-skull-crossbones' } },
  { value: "Thieves' Tools", label: "Thieves' Tools", group: 'Specialist Kit', meta: { color: 'amber-8', icon: 'fa-solid fa-key' } },
  { value: "Alchemist's Supplies", label: "Alchemist's Supplies", group: "Artisan's Tools", meta: { color: 'teal-6', icon: 'fa-solid fa-flask' } },
  { value: "Brewer's Supplies", label: "Brewer's Supplies", group: "Artisan's Tools", meta: { color: 'teal-6', icon: 'fa-solid fa-beer-mug-empty' } },
  { value: "Calligrapher's Supplies", label: "Calligrapher's Supplies", group: "Artisan's Tools", meta: { color: 'teal-6', icon: 'fa-solid fa-pen-nib' } },
  { value: "Carpenter's Tools", label: "Carpenter's Tools", group: "Artisan's Tools", meta: { color: 'teal-6', icon: 'fa-solid fa-hammer' } },
  { value: "Cartographer's Tools", label: "Cartographer's Tools", group: "Artisan's Tools", meta: { color: 'teal-6', icon: 'fa-solid fa-map' } },
  { value: "Cobbler's Tools", label: "Cobbler's Tools", group: "Artisan's Tools", meta: { color: 'teal-6', icon: 'fa-solid fa-shoe-prints' } },
  { value: "Cook's Utensils", label: "Cook's Utensils", group: "Artisan's Tools", meta: { color: 'teal-6', icon: 'fa-solid fa-utensils' } },
  { value: "Glassblower's Tools", label: "Glassblower's Tools", group: "Artisan's Tools", meta: { color: 'teal-6', icon: 'fa-solid fa-wine-glass' } },
  { value: "Jeweler's Tools", label: "Jeweler's Tools", group: "Artisan's Tools", meta: { color: 'teal-6', icon: 'fa-solid fa-gem' } },
  { value: "Leatherworker's Tools", label: "Leatherworker's Tools", group: "Artisan's Tools", meta: { color: 'teal-6', icon: 'fa-solid fa-vest' } },
  { value: "Mason's Tools", label: "Mason's Tools", group: "Artisan's Tools", meta: { color: 'teal-6', icon: 'fa-solid fa-trowel-bricks' } },
  { value: "Painter's Supplies", label: "Painter's Supplies", group: "Artisan's Tools", meta: { color: 'teal-6', icon: 'fa-solid fa-palette' } },
  { value: "Potter's Tools", label: "Potter's Tools", group: "Artisan's Tools", meta: { color: 'teal-6', icon: 'fa-solid fa-jar' } },
  { value: "Smith's Tools", label: "Smith's Tools", group: "Artisan's Tools", meta: { color: 'teal-6', icon: 'fa-solid fa-gavel' } },
  { value: "Tinker's Tools", label: "Tinker's Tools", group: "Artisan's Tools", meta: { color: 'teal-6', icon: 'fa-solid fa-gears' } },
  { value: "Weaver's Tools", label: "Weaver's Tools", group: "Artisan's Tools", meta: { color: 'teal-6', icon: 'fa-solid fa-shirt' } },
  { value: "Woodcarver's Tools", label: "Woodcarver's Tools", group: "Artisan's Tools", meta: { color: 'teal-6', icon: 'fa-solid fa-tree' } },
  { value: 'Bagpipes', label: 'Bagpipes', group: 'Instrument', meta: { color: 'pink-6', icon: 'fa-solid fa-music' } },
  { value: 'Drum', label: 'Drum', group: 'Instrument', meta: { color: 'pink-6', icon: 'fa-solid fa-drum' } },
  { value: 'Dulcimer', label: 'Dulcimer', group: 'Instrument', meta: { color: 'pink-6', icon: 'fa-solid fa-music' } },
  { value: 'Flute', label: 'Flute', group: 'Instrument', meta: { color: 'pink-6', icon: 'fa-solid fa-music' } },
  { value: 'Horn', label: 'Horn', group: 'Instrument', meta: { color: 'pink-6', icon: 'fa-solid fa-bullhorn' } },
  { value: 'Lute', label: 'Lute', group: 'Instrument', meta: { color: 'pink-6', icon: 'fa-solid fa-guitar' } },
  { value: 'Lyre', label: 'Lyre', group: 'Instrument', meta: { color: 'pink-6', icon: 'fa-solid fa-music' } },
  { value: 'Pan Flute', label: 'Pan Flute', group: 'Instrument', meta: { color: 'pink-6', icon: 'fa-solid fa-music' } },
  { value: 'Shawm', label: 'Shawm', group: 'Instrument', meta: { color: 'pink-6', icon: 'fa-solid fa-music' } },
  { value: 'Viol', label: 'Viol', group: 'Instrument', meta: { color: 'pink-6', icon: 'fa-solid fa-music' } },
  { value: 'Dice Set', label: 'Dice Set', group: 'Gaming Set', meta: { color: 'indigo-6', icon: 'fa-solid fa-dice' } },
  { value: 'Dragonchess Set', label: 'Dragonchess Set', group: 'Gaming Set', meta: { color: 'indigo-6', icon: 'fa-solid fa-chess' } },
  { value: 'Playing Card Set', label: 'Playing Card Set', group: 'Gaming Set', meta: { color: 'indigo-6', icon: 'fa-solid fa-diamond' } },
  { value: 'Three-Dragon Ante Set', label: 'Three-Dragon Ante Set', group: 'Gaming Set', meta: { color: 'indigo-6', icon: 'fa-solid fa-dragon' } },
  { value: 'Vehicles (Air)', label: 'Vehicles (Air)', group: 'Vehicle', meta: { color: 'blue-grey-6', icon: 'fa-solid fa-wind' } },
  { value: 'Vehicles (Land)', label: 'Vehicles (Land)', group: 'Vehicle', meta: { color: 'blue-grey-6', icon: 'fa-solid fa-horse' } },
  { value: 'Vehicles (Space)', label: 'Vehicles (Space)', group: 'Vehicle', meta: { color: 'blue-grey-6', icon: 'fa-solid fa-shuttle-space' } },
  { value: 'Vehicles (Water)', label: 'Vehicles (Water)', group: 'Vehicle', meta: { color: 'blue-grey-6', icon: 'fa-solid fa-ship' } },
] as const

export const CANONICAL_SCHOOLS: readonly CanonicalCatalogEntry[] = [
  { value: 'Abjuration', label: 'Abjuration', group: 'Magic Schools' },
  { value: 'Conjuration', label: 'Conjuration', group: 'Magic Schools' },
  { value: 'Divination', label: 'Divination', group: 'Magic Schools' },
  { value: 'Enchantment', label: 'Enchantment', group: 'Magic Schools' },
  { value: 'Evocation', label: 'Evocation', group: 'Magic Schools' },
  { value: 'Illusion', label: 'Illusion', group: 'Magic Schools' },
  { value: 'Necromancy', label: 'Necromancy', group: 'Magic Schools' },
  { value: 'Transmutation', label: 'Transmutation', group: 'Magic Schools' },
] as const

export const CANONICAL_ROLES: readonly CanonicalCatalogEntry[] = [
  { value: 'action', label: 'Action', group: 'Turn Economy' },
  { value: 'bonus_action', label: 'Bonus Action', group: 'Turn Economy' },
  { value: 'reaction', label: 'Reaction', group: 'Turn Economy' },
  { value: 'trait', label: 'Trait', group: 'Passive & Always-On' },
  { value: 'legendary', label: 'Legendary Action', group: 'Boss Economy' },
  { value: 'mythic', label: 'Mythic Action', group: 'Boss Economy' },
  { value: 'lair', label: 'Lair Action', group: 'Boss Economy' },
] as const

export const CANONICAL_CATALOGS: Record<CatalogId, CanonicalCatalog<string | number>> = {
  sizes: {
    id: 'sizes',
    label: 'Size',
    preserveOrder: true,
    allowCustom: false,
    entries: CREATURE_SIZE.map((size) => ({
      value: size,
      label: size,
      group: 'Size Scale',
      badge: sizeDieLabel(size),
    })),
  },
  creatureTypes: {
    id: 'creatureTypes',
    label: 'Creature Type',
    preserveOrder: false,
    allowCustom: true,
    entries: STANDARD_CREATURE_TYPE.map((type) => ({
      value: type,
      label: type,
      group: CREATURE_TYPE_GROUPS[type] || 'Creature Types',
    })),
  },
  alignments: {
    id: 'alignments',
    label: 'Alignment',
    preserveOrder: true,
    allowCustom: true,
    entries: STANDARD_ALIGNMENT.map((alignment) => ({
      value: alignment,
      label: alignment,
      group: alignment.includes('Good')
        ? 'Good'
        : alignment.includes('Evil')
          ? 'Evil'
          : 'Neutral & Unaligned',
    })),
  },
  damageTypes: {
    id: 'damageTypes',
    label: 'Damage Types',
    preserveOrder: false,
    allowCustom: true,
    entries: CANONICAL_DAMAGE_TYPES,
  },
  conditions: {
    id: 'conditions',
    label: 'Conditions',
    preserveOrder: false,
    allowCustom: true,
    entries: CANONICAL_CONDITIONS,
  },
  languages: {
    id: 'languages',
    label: 'Languages',
    preserveOrder: false,
    allowCustom: true,
    entries: ALL_OFFICIAL_LANGUAGES.map((language) => ({
      value: language,
      label: language,
      group: languageGroup(language),
    })),
  },
  senses: {
    id: 'senses',
    label: 'Senses',
    preserveOrder: true,
    allowCustom: true,
    entries: CANONICAL_SENSES,
  },
  skills: {
    id: 'skills',
    label: 'Skills',
    preserveOrder: false,
    allowCustom: false,
    entries: CANONICAL_SKILLS,
  },
  tools: {
    id: 'tools',
    label: 'Tools & Proficiencies',
    preserveOrder: false,
    allowCustom: true,
    entries: CANONICAL_TOOLS,
  },
  schools: {
    id: 'schools',
    label: 'Magic Schools',
    preserveOrder: false,
    allowCustom: false,
    entries: CANONICAL_SCHOOLS,
  },
  spellLevels: {
    id: 'spellLevels',
    label: 'Spell Levels',
    preserveOrder: true,
    allowCustom: false,
    entries: ORDINAL_LEVELS.map((label, value) => ({
      value,
      label,
      group: value === 0 ? 'Cantrips' : 'Spell Slots',
      badge: value === 0 ? '0' : String(value),
    })),
  },
  recharge: {
    id: 'recharge',
    label: 'Cadence & Recharge',
    preserveOrder: false,
    allowCustom: true,
    entries: CADENCES.map((cadence) => ({
      value: cadence.id,
      label: cadence.label,
      group: cadence.category,
      badge: cadence.kind,
    })),
  },
  roles: {
    id: 'roles',
    label: 'Ability Roles',
    preserveOrder: true,
    allowCustom: false,
    entries: CANONICAL_ROLES,
  },
}

export function canonicalCatalog(id: CatalogId): CanonicalCatalog<string | number> {
  return CANONICAL_CATALOGS[id]
}

export function canonicalCatalogIds(): CatalogId[] {
  return Object.keys(CANONICAL_CATALOGS) as CatalogId[]
}
