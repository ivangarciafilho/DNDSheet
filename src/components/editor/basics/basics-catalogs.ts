import type { CanonicalCatalogEntry } from '../../../core/domain/catalogs/enumerations.ts'
import { CR_SELECT, LAIR_CR_SELECT } from '../../../data/CR.ts'
import { ALL_OFFICIAL_LANGUAGES } from '../../../data/LANGUAGES.ts'
import {
  INITIATIVE_ACTION_TYPE_OPTIONS,
  INITIATIVE_ADV_MODE_OPTIONS,
} from '../../../core/domain/initiative-composer.ts'
import { SPECIES_CATALOG } from '../../../core/domain/species-and-heuristics.ts'

export interface LegacyOptionItem<T extends string | number = string | number> {
  label: string
  value: T
  category?: string
  icon?: string
  color?: string
  tooltip?: string
}

export function toCatalogEntries<T extends string | number>(
  items: readonly (LegacyOptionItem<T> | string)[],
  defaultGroup = 'Options',
  includeBadge = true,
): CanonicalCatalogEntry<T>[] {
  return items.map((item) => {
    if (typeof item === 'string') {
      return { value: item as T, label: item, group: defaultGroup }
    }
    return {
      value: item.value,
      label: item.label,
      group: item.category || defaultGroup,
      badge: includeBadge ? item.category : undefined,
      icon: item.icon,
      color: item.color,
      tooltip: item.tooltip,
    }
  })
}

export const PORTRAIT_POSITION_ENTRIES = toCatalogEntries(
  [
    { label: 'None (Hidden)', value: 'none', category: 'Layout', icon: 'visibility_off', color: 'grey-5' },
    { label: 'Left of Statblock', value: 'left', category: 'Layout', icon: 'align_horizontal_left', color: 'amber-4' },
    { label: 'Right of Statblock', value: 'right', category: 'Layout', icon: 'align_horizontal_right', color: 'amber-4' },
  ],
  'Layout',
  false,
)

export const CR_ENTRIES: readonly CanonicalCatalogEntry<number>[] = CR_SELECT.map((cr) => ({
  value: cr.value,
  label: cr.label,
  group: cr.value <= 4 ? 'Low Tier (CR 0–4)' : cr.value <= 13 ? 'Heroic Tier (CR 5–10)' : cr.value <= 20 ? 'Paragon Tier (CR 11–17)' : 'Epic Tier (CR 18–30)',
}))

export const LAIR_CR_ENTRIES: readonly CanonicalCatalogEntry<number>[] = LAIR_CR_SELECT.map((cr) => ({
  value: cr.value,
  label: cr.label,
  group: cr.value < 0 ? 'None' : 'Lair CR',
}))

export const SPECIES_ENTRIES: readonly CanonicalCatalogEntry<string>[] = SPECIES_CATALOG.map((s) => ({
  value: s.id,
  label: s.name,
  group: s.type || 'Species & Lineages',
  badge: s.size || undefined,
  icon: 'fingerprint',
  color: 'primary',
}))

export const PLURAL_CREATURE_TYPE_ENTRIES = toCatalogEntries(
  [
    'Aberrations',
    'Beasts',
    'Celestials',
    'Constructs',
    'Dragons',
    'Elementals',
    'Fey',
    'Fiends',
    'Giants',
    'Humanoids',
    'Monstrosities',
    'Oozes',
    'Plants',
    'Undead',
  ],
  'Creature Types',
  false,
)

export const ATTACK_TYPE_ENTRIES = toCatalogEntries(
  [
    'Ranged Attacks',
    'Melee Attacks',
    'Spell Attacks',
    'Weapon Attacks',
    'Ranged Spell Attacks',
    'Melee Spell Attacks',
    'Ranged Weapon Attacks',
    'Melee Weapon Attacks',
  ],
  'Attack Types',
  false,
)

export const LIGHT_LEVEL_ENTRIES = toCatalogEntries(
  ['Bright Light', 'Daylight', 'Dim Light', 'Darkness', 'Magical Darkness'],
  'Illumination',
  false,
)

export const TIMEFRAME_ENTRIES = toCatalogEntries(
  [
    'The Start Of Its Last Turn',
    'The End Of Its Last Turn',
    'The Start Of Its Current Turn',
    'The End Of Its Current Turn',
    'Its Last Turn',
  ],
  'Timeframes',
  false,
)

export const FULL_ABILITY_NAME_ENTRIES = toCatalogEntries(
  ['Strength', 'Dexterity', 'Constitution', 'Intelligence', 'Wisdom', 'Charisma'],
  'Abilities',
  false,
)

export const SAVE_SHORT_ABILITY_ENTRIES = toCatalogEntries(
  ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'],
  'Abilities',
  false,
)

export const MENTAL_SAVE_STAT_ENTRIES = toCatalogEntries(
  ['Wisdom', 'Intelligence', 'Charisma'],
  'Saving Throw',
  false,
)

export const AC_BASE_ENTRIES = toCatalogEntries([
  { label: 'Current Flat AC', value: 'flat', category: 'Standard', icon: 'numbers', color: 'blue-4' },
  { label: '10 + DEX (Unarmored)', value: '10', category: 'Standard', icon: 'accessibility', color: 'blue-4' },
  { label: 'Leather Armor (11 + DEX)', value: 'leather', category: 'Light Armor', icon: 'shield', color: 'brown-4' },
  { label: 'Studded Leather (12 + DEX)', value: 'studded_leather', category: 'Light Armor', icon: 'shield', color: 'brown-4' },
  { label: 'Hide (12 + DEX max 2)', value: 'hide', category: 'Medium Armor', icon: 'shield', color: 'orange-4' },
  { label: 'Chain Shirt (13 + DEX max 2)', value: 'chain_shirt', category: 'Medium Armor', icon: 'shield', color: 'orange-4' },
  { label: 'Scale Mail (14 + DEX max 2)', value: 'scale_mail', category: 'Medium Armor', icon: 'shield', color: 'orange-4' },
  { label: 'Breastplate (14 + DEX max 2)', value: 'breastplate', category: 'Medium Armor', icon: 'shield', color: 'orange-4' },
  { label: 'Half Plate (15 + DEX max 2)', value: 'half_plate', category: 'Medium Armor', icon: 'shield', color: 'orange-4' },
  { label: 'Ring Mail (14)', value: 'ring_mail', category: 'Heavy Armor', icon: 'shield', color: 'grey-7' },
  { label: 'Chain Mail (16)', value: 'chain_mail', category: 'Heavy Armor', icon: 'shield', color: 'grey-7' },
  { label: 'Splint (17)', value: 'splint', category: 'Heavy Armor', icon: 'shield', color: 'grey-7' },
  { label: 'Plate (18)', value: 'plate', category: 'Heavy Armor', icon: 'shield', color: 'amber-6' },
  { label: 'Arcane Armor (13 + INT/DEX)', value: 'arcane_armor', category: 'Special', icon: 'auto_fix_high', color: 'purple-4' },
  { label: 'Strength Score as AC', value: 'str_score', category: 'Ability Scores', icon: 'fitness_center', color: 'red-4' },
  { label: 'Dexterity Score as AC', value: 'dex_score', category: 'Ability Scores', icon: 'directions_run', color: 'green-4' },
  { label: 'Constitution Score as AC', value: 'con_score', category: 'Ability Scores', icon: 'favorite', color: 'amber-4' },
  { label: 'Intelligence Score as AC', value: 'int_score', category: 'Ability Scores', icon: 'school', color: 'blue-4' },
  { label: 'Wisdom Score as AC', value: 'wis_score', category: 'Ability Scores', icon: 'psychology', color: 'teal-4' },
  { label: 'Charisma Score as AC', value: 'cha_score', category: 'Ability Scores', icon: 'record_voice_over', color: 'purple-4' },
])

export const AC_ABILITY_BONUS_ENTRIES = toCatalogEntries([
  { label: 'None', value: 'none', category: 'None', icon: 'block', color: 'grey-5' },
  { label: 'STR Modifier', value: 'STR', category: 'Ability Score', icon: 'fitness_center', color: 'red-4' },
  { label: 'DEX Modifier', value: 'DEX', category: 'Ability Score', icon: 'directions_run', color: 'green-4' },
  { label: 'CON Modifier', value: 'CON', category: 'Ability Score', icon: 'favorite', color: 'amber-4' },
  { label: 'INT Modifier', value: 'INT', category: 'Ability Score', icon: 'school', color: 'blue-4' },
  { label: 'WIS Modifier', value: 'WIS', category: 'Ability Score', icon: 'psychology', color: 'teal-4' },
  { label: 'CHA Modifier', value: 'CHA', category: 'Ability Score', icon: 'record_voice_over', color: 'purple-4' },
  { label: 'Proficiency Bonus (+PB)', value: 'pb', category: 'Proficiency & Level', icon: 'military_tech', color: 'amber-5' },
  { label: 'Monster Level', value: 'level', category: 'Proficiency & Level', icon: 'military_tech', color: 'amber-5' },
  { label: 'CR (Challenge Rating)', value: 'cr', category: 'Proficiency & Level', icon: 'grade', color: 'amber-6' },
  { label: 'Hit Dice Count', value: 'hd', category: 'Hit Dice', icon: 'casino', color: 'cyan-4' },
])

export const AC_DEFENSE_ITEM_ENTRIES = toCatalogEntries([
  { label: 'None', value: 'none', category: 'None', icon: 'block', color: 'grey-5' },
  { label: 'Shield (+2)', value: 'shield', category: 'Shield', icon: 'shield', color: 'blue-4' },
  { label: 'Animated Shield (+2)', value: 'animated_shield', category: 'Magic Shield', icon: 'auto_awesome', color: 'purple-4' },
  { label: 'Cloak of Protection (+1)', value: 'cloak_of_protection', category: 'Wondrous Item', icon: 'dry_cleaning', color: 'teal-4' },
  { label: 'Ring of Protection (+1)', value: 'ring_of_protection', category: 'Ring', icon: 'circle', color: 'amber-4' },
  { label: 'Defender (+3)', value: 'defender', category: 'Magic Weapon', icon: 'colorize', color: 'deep-orange-4' },
  { label: 'Bracers of Defense (+2)', value: 'bracers_of_defense', category: 'Wondrous Item', icon: 'front_hand', color: 'green-4' },
  { label: 'Custom Magic Item', value: 'custom', category: 'Custom', icon: 'star', color: 'amber-5' },
])

export const AC_TEMPORARY_ENTRIES = toCatalogEntries([
  { label: 'None', value: 'none', category: 'None', icon: 'block', color: 'grey-5' },
  { label: 'Spell: Shield (+5)', value: 'spell_shield', category: 'Spells', icon: 'shield', color: 'indigo-4' },
  { label: 'Spell: Shield of Faith (+2)', value: 'spell_shield_of_faith', category: 'Spells', icon: 'auto_fix_high', color: 'amber-4' },
  { label: 'Parry (+PB)', value: 'parry_pb', category: 'Reactions', icon: 'sports_kabaddi', color: 'red-4' },
  { label: 'Parry (+2)', value: 'parry_custom', category: 'Reactions', icon: 'sports_kabaddi', color: 'red-4' },
])

export const AC_CONDITIONAL_ENTRIES = toCatalogEntries([
  { label: 'None', value: 'none', category: 'None', icon: 'block', color: 'grey-5' },
  { label: '+2 to attacks beyond 1st until next turn', value: 'all_attacks_beyond_first', category: 'Sequential Attacks', icon: 'trending_up', color: 'green-4' },
  { label: '+2 to first 2 attacks each round', value: 'first_y_attacks', category: 'Round Attacks', icon: 'filter_2', color: 'cyan-4' },
])

export const AC_DEFENSIVE_MECHANIC_ENTRIES = toCatalogEntries([
  { label: 'None (Standard AC)', value: 'none', category: 'Standard', icon: 'shield', color: 'grey-5' },
  { label: 'Versus Creature Type (e.g. Undead, Fiends)', value: 'creature_type', category: 'Creature Type Defenses', icon: 'cruelty_free', color: 'purple-4' },
  { label: 'Versus Attack Type (e.g. Ranged, Spell Attacks)', value: 'attack_type', category: 'Attack Type Defenses', icon: 'gps_fixed', color: 'teal-4' },
  { label: 'Versus Damage Type (e.g. Lightning, Thunder, Force)', value: 'damage_type', category: 'Damage Defenses', icon: 'bolt', color: 'amber-5' },
  { label: 'If It Has Temporary Hit Points', value: 'has_temp_hp', category: 'Health Thresholds', icon: 'add_moderator', color: 'cyan-4' },
  { label: 'If It took Damage since Timeframe', value: 'took_damage_since', category: 'Damage Defenses', icon: 'ac_unit', color: 'light-blue-4' },
  { label: 'If In Light Level (Bright Light, Daylight, etc.)', value: 'in_light', category: 'Environment Defenses', icon: 'wb_sunny', color: 'yellow-7' },
  { label: 'If Bloodied (Higher or Lower AC)', value: 'bloodied', category: 'Health Thresholds', icon: 'bloodtype', color: 'red-4' },
  { label: 'Parry (Reaction: +PB / +X)', value: 'parry', category: 'Reaction Defenses', icon: 'sports_kabaddi', color: 'cyan-4' },
  { label: 'Without Advantage (e.g. AC 30 without Advantage)', value: 'without_advantage', category: 'Advantage Qualifiers', icon: 'trending_up', color: 'purple-4' },
  { label: 'Attacks Without Advantage Miss You', value: 'no_advantage_misses', category: 'Advantage Qualifiers', icon: 'visibility_off', color: 'purple-4' },
  { label: 'Versus Damage Types (Force, Lightning, Thunder + Miss Reflection)', value: 'versus_damage_types', category: 'Damage Defenses', icon: 'bolt', color: 'amber-5' },
  { label: 'Attacker Save DC to Hit Automatically', value: 'attacker_save', category: 'Absolute Rules', icon: 'psychology_alt', color: 'amber-4' },
  { label: 'Only Hit by Critical Hits', value: 'only_crits', category: 'Absolute Rules', icon: 'flare', color: 'red-4' },
  { label: 'Only Hit by Magical Attacks', value: 'only_magical', category: 'Absolute Rules', icon: 'auto_awesome', color: 'deep-purple-4' },
  { label: 'Only Hit by Adamantine or Silvered Weapons', value: 'only_adamantine_silver', category: 'Absolute Rules', icon: 'hardware', color: 'blue-grey-4' },
  { label: 'While Cursed (e.g. AC 13 while Cursed)', value: 'while_cursed', category: 'Condition / State', icon: 'coronavirus', color: 'deep-orange-4' },
  { label: 'Near Non-Incapacitated Allied Creature', value: 'near_ally', category: 'Proximity Defenses', icon: 'group', color: 'green-4' },
  { label: 'While Moving (+X AC)', value: 'while_moving', category: 'Movement Defenses', icon: 'directions_run', color: 'blue-4' },
  { label: 'Per 10 ft Moved This Turn (+1 per 10 ft)', value: 'per_distance_moved', category: 'Movement Defenses', icon: 'speed', color: 'blue-4' },
  { label: 'While Bloodied (Higher or Lower AC)', value: 'while_bloodied', category: 'Health Thresholds', icon: 'bloodtype', color: 'red-4' },
  { label: 'Within 10 ft of an Ally', value: 'while_within_ally', category: 'Proximity Defenses', icon: 'people', color: 'green-4' },
  { label: 'Within 5 ft of a Shield Bearer', value: 'while_within_shield_bearer', category: 'Proximity Defenses', icon: 'shield', color: 'green-4' },
  { label: 'While Prone (Reduced AC)', value: 'while_prone', category: 'Condition / State', icon: 'airline_seat_flat', color: 'orange-4' },
  { label: 'Shield Spell (+5 Reaction)', value: 'shield_spell', category: 'Spell Buffs', icon: 'shield', color: 'cyan-4' },
  { label: 'Shield of Faith (+2)', value: 'shield_of_faith', category: 'Spell Buffs', icon: 'church', color: 'amber-4' },
  { label: 'Against Ranged Attacks (+X)', value: 'ranged_attacks', category: 'Attack Type Defenses', icon: 'gps_fixed', color: 'teal-4' },
  { label: 'Against Melee Attacks (+X)', value: 'melee_attacks', category: 'Attack Type Defenses', icon: 'sports_martial_arts', color: 'teal-4' },
  { label: 'Attacks from More Than 30 ft Away', value: 'distance_away', category: 'Distance Defenses', icon: 'straighten', color: 'indigo-4' },
  { label: 'First Attack Each Round', value: 'first_attack_each_round', category: 'Turn & Round Defenses', icon: 'filter_1', color: 'blue-4' },
  { label: 'Attacks Beyond the First Each Turn', value: 'attacks_beyond_first', category: 'Turn & Round Defenses', icon: 'filter_2', color: 'blue-4' },
  { label: 'Against Spell Attacks', value: 'spell_attacks', category: 'Attack Type Defenses', icon: 'auto_fix_high', color: 'purple-4' },
  { label: 'From Behind or Flanking (Reduced AC)', value: 'behind_flanking', category: 'Positioning Defenses', icon: 'low_priority', color: 'deep-orange-4' },
  { label: 'Per Hostile Creature within 5 ft (+X, max +Y)', value: 'per_hostile', category: 'Proximity Defenses', icon: 'groups', color: 'red-4' },
  { label: 'Per Creature Grappling It (-X per grappler)', value: 'per_grappler', category: 'Condition / State', icon: 'pan_tool', color: 'orange-4' },
  { label: 'While Flying', value: 'while_flying', category: 'Movement Defenses', icon: 'flight', color: 'light-blue-4' },
  { label: 'While Underwater', value: 'while_underwater', category: 'Environment Defenses', icon: 'scuba_diving', color: 'cyan-4' },
  { label: 'In Bright Light', value: 'in_bright_light', category: 'Environment Defenses', icon: 'wb_sunny', color: 'yellow-7' },
  { label: 'In Dim Light or Darkness', value: 'in_darkness', category: 'Environment Defenses', icon: 'dark_mode', color: 'indigo-4' },
  { label: 'Versus Bludgeoning, Piercing, or Slashing', value: 'versus_bps', category: 'Damage Defenses', icon: 'shield', color: 'brown-4' },
  { label: 'Versus Aberrations, Celestials, or Fiends', value: 'versus_creature_types', category: 'Creature Type Defenses', icon: 'cruelty_free', color: 'purple-4' },
  { label: 'While Concentrating on a Spell', value: 'while_concentrating', category: 'Spell Buffs', icon: 'self_improvement', color: 'teal-4' },
  { label: 'While Asleep or Unconscious', value: 'asleep_unconscious', category: 'Condition / State', icon: 'bedtime', color: 'grey-7' },
  { label: 'Ranged Misses Reflect Back at Attacker', value: 'miss_reflects', category: 'Reflection Defenses', icon: 'replay', color: 'cyan-4' },
  { label: 'Custom Defensive Condition...', value: 'custom', category: 'Custom', icon: 'edit_note', color: 'cyan-4' },
])

export const SAVE_VERB_ENTRIES = toCatalogEntries(
  [
    { label: 'must Succeed (Standard)', value: 'must_succeed' },
    { label: 'Makes (Alternative Trigger)', value: 'makes' },
    { label: 'Must Succeed ... to Hit', value: 'must_succeed_to_hit' },
  ],
  'Phrasing',
  false,
)

export const SAVE_DC_SOURCE_ENTRIES = toCatalogEntries(
  [
    { label: 'Spell Save DC (Calculated from Spellcasting)', value: 'spell_save_dc' },
    { label: 'Special Ability DC (8 + PB + Stat)', value: 'special_save_dc' },
    { label: '8 + PB + STR DC', value: '8_plus_pb_str' },
    { label: '8 + PB + DEX DC', value: '8_plus_pb_dex' },
    { label: '8 + PB + CON DC', value: '8_plus_pb_con' },
    { label: '8 + PB + INT DC', value: '8_plus_pb_int' },
    { label: '8 + PB + WIS DC', value: '8_plus_pb_wis' },
    { label: '8 + PB + CHA DC', value: '8_plus_pb_cha' },
    { label: '8 + 2x PB + Stat (Legendary Save DC)', value: '8_plus_2x_pb' },
    { label: '10 + PB + Stat (Epic DC)', value: '10_plus_pb' },
    { label: '8 + PB + CR (CR Scaled DC)', value: 'cr_based' },
    { label: 'Custom Flat / Formula DC', value: 'custom' },
  ],
  'Save DC Source',
  false,
)

export const ON_SAVE_FAILURE_ENTRIES = toCatalogEntries(
  [
    { label: 'On Failure: None', value: 'none' },
    { label: 'On Failure: Knocks Prone', value: 'knocks_prone' },
    { label: 'On Failure: Takes Damage', value: 'takes_damage' },
    { label: "On Failure: Can't Attack", value: 'cant_attack' },
  ],
  'Save Failure',
  false,
)

export const ON_SAVE_SUCCESS_ENTRIES = toCatalogEntries(
  [
    { label: 'On Success: None', value: 'none' },
    { label: 'On Success: Takes Damage', value: 'takes_damage' },
    { label: 'to Hit Automatically', value: 'hits_automatically' },
    { label: 'On Success: Half Damage', value: 'half_damage' },
  ],
  'Save Success',
  false,
)

export const ON_MISS_ENTRIES = toCatalogEntries(
  [
    { label: 'None', value: 'none' },
    { label: 'Hits the Attacker Instead', value: 'hits_attacker' },
    { label: 'Hits Target within its Range', value: 'hits_target_range' },
    { label: 'Hits another creature within Distance', value: 'hits_target_feet' },
    { label: 'Attacker takes Damage', value: 'damage_attacker' },
    { label: 'Knocks Prone', value: 'knocks_prone' },
  ],
  'On Miss',
  false,
)

export const ON_HIT_ENTRIES = toCatalogEntries(
  [
    { label: 'None', value: 'none' },
    { label: 'Attacker takes Damage', value: 'damage_attacker' },
    { label: 'Attacker Knocks Prone', value: 'knocks_prone' },
    { label: 'Can make a Melee Attack as a Reaction', value: 'retaliate_melee' },
  ],
  'On Hit',
  false,
)

export const SECONDARY_STAT_ENTRIES = toCatalogEntries([
  { label: 'None (DEX only)', value: 'none', category: 'Standard', icon: 'flash_on', color: 'grey-5' },
  { label: 'Charisma (CHA)', value: 'CHA', category: 'Ability', icon: 'auto_awesome', color: 'purple-4' },
  { label: 'Constitution (CON)', value: 'CON', category: 'Ability', icon: 'shield', color: 'teal-4' },
  { label: 'Intelligence (INT)', value: 'INT', category: 'Ability', icon: 'psychology', color: 'blue-4' },
  { label: 'Strength (STR)', value: 'STR', category: 'Ability', icon: 'fitness_center', color: 'red-4' },
  { label: 'Wisdom (WIS)', value: 'WIS', category: 'Ability', icon: 'visibility', color: 'amber-4' },
])

export const STAT_MODE_ENTRIES = toCatalogEntries(
  [
    { label: 'Add to DEX (DEX + Stat)', value: 'add' },
    { label: 'Replace DEX (Use Stat instead)', value: 'replace' },
  ],
  'Mode',
  false,
)

export const INITIATIVE_TRIGGER_ENTRIES = toCatalogEntries([
  { label: 'None (Standard Roll)', value: 'none', category: 'Standard', icon: 'flash_on', color: 'grey-5' },
  { label: 'At End of Every Turn', value: 'at_end_of_every_turn', category: 'Action Economy', icon: 'sync', color: 'purple-4' },
  { label: 'At End of Every Turn | At Start of Every Turn (Lair)', value: 'at_end_and_start_lair', category: 'Action Economy', icon: 'all_inclusive', color: 'purple-4' },
  { label: 'Within 1d6 of rounds', value: 'within_1d6_rounds', category: 'Dramatic Triggers', icon: 'hourglass_bottom', color: 'deep-orange-4' },
  { label: 'When it has no temporary Hit Points remaining', value: 'no_temp_hp_remaining', category: 'Dramatic Triggers', icon: 'shield', color: 'deep-orange-4' },
  { label: 'When hit points not equal to Maximum', value: 'hp_not_equal_max', category: 'Dramatic Triggers', icon: 'favorite_border', color: 'deep-orange-4' },
  { label: 'Choose lowest Dice to Cast Compelled Duel', value: 'cast_compelled_duel', category: 'Spell Trigger', icon: 'auto_fix_high', color: 'amber-4' },
  { label: 'Choose lowest Dice to Cast Thaumaturgy', value: 'cast_thaumaturgy', category: 'Spell Trigger', icon: 'auto_fix_high', color: 'amber-4' },
  { label: 'Choose lowest Dice to Cast Custom Spell...', value: 'cast_custom', category: 'Spell Trigger', icon: 'auto_fix_high', color: 'amber-4' },
  { label: 'While Bloodied, acts twice per round', value: 'while_bloodied_act_twice', category: 'Dramatic Triggers', icon: 'bloodtype', color: 'red-4' },
  { label: 'Custom Initiative Note...', value: 'custom', category: 'Custom', icon: 'edit_note', color: 'cyan-4' },
])

export const INITIATIVE_ADV_MODE_ENTRIES = toCatalogEntries(
  INITIATIVE_ADV_MODE_OPTIONS as unknown as readonly LegacyOptionItem<string>[],
  'Precondition',
  false,
)

export const INITIATIVE_ROLL_EFFECT_ENTRIES = toCatalogEntries(
  [
    { label: 'Disadvantage', value: 'disadvantage' },
    { label: 'Advantage', value: 'advantage' },
  ],
  'Roll Effect',
  false,
)

export const INITIATIVE_ACTION_TYPE_ENTRIES = toCatalogEntries(
  INITIATIVE_ACTION_TYPE_OPTIONS as unknown as readonly LegacyOptionItem<string>[],
  'Composable Action',
  false,
)

const dynamicSourceItems: LegacyOptionItem<string>[] = [
  { label: '1/2 of Hit Points', value: 'half_hp', category: 'HP Fraction', icon: 'favorite', color: 'red-4' },
  { label: '1/4 of Hit Points', value: 'quarter_hp', category: 'HP Fraction', icon: 'favorite_border', color: 'red-4' },
  { label: '1/8 of Hit Points', value: 'eighth_hp', category: 'HP Fraction', icon: 'heart_broken', color: 'red-4' },
  { label: 'CR (Challenge Rating)', value: 'cr', category: 'Dice & Scaling', icon: 'grade', color: 'amber-6' },
  { label: 'Custom Formula (Expression)', value: 'custom_formula', category: 'Dice & Scaling', icon: 'calculate', color: 'cyan-4' },
  { label: 'Dice Roll Formula', value: 'dice', category: 'Dice & Scaling', icon: 'casino', color: 'amber-4' },
  { label: 'Flat Value', value: 'flat', category: 'Dice & Scaling', icon: 'pin', color: 'cyan-4' },
  { label: 'Hit Dice Count', value: 'hit_dice', category: 'Dice & Scaling', icon: 'layers', color: 'amber-4' },
  { label: 'Hit Dice Die Size (d8/d10)', value: 'hd_type', category: 'Dice & Scaling', icon: 'casino', color: 'amber-4' },
  { label: 'Proficiency Bonus (+PB)', value: 'proficiency', category: 'Dice & Scaling', icon: 'military_tech', color: 'amber-4' },
  { label: 'Twice Proficiency (+2x PB)', value: 'twice_proficiency', category: 'Dice & Scaling', icon: 'military_tech', color: 'amber-5' },
  { label: 'Charisma Modifier (CHA mod)', value: 'cha_mod', category: 'Ability Mod', icon: 'auto_awesome', color: 'purple-4' },
  { label: 'Constitution Modifier (CON mod)', value: 'con_mod', category: 'Ability Mod', icon: 'shield', color: 'purple-4' },
  { label: 'Dexterity Modifier (DEX mod)', value: 'dex_mod', category: 'Ability Mod', icon: 'bolt', color: 'purple-4' },
  { label: 'Intelligence Modifier (INT mod)', value: 'int_mod', category: 'Ability Mod', icon: 'psychology', color: 'purple-4' },
  { label: 'Strength Modifier (STR mod)', value: 'str_mod', category: 'Ability Mod', icon: 'fitness_center', color: 'purple-4' },
  { label: 'Wisdom Modifier (WIS mod)', value: 'wis_mod', category: 'Ability Mod', icon: 'visibility', color: 'purple-4' },
  { label: 'Charisma Score (CHA)', value: 'cha_score', category: 'Ability Score', icon: 'auto_awesome', color: 'teal-4' },
  { label: 'Constitution Score (CON)', value: 'con_score', category: 'Ability Score', icon: 'shield', color: 'teal-4' },
  { label: 'Dexterity Score (DEX)', value: 'dex_score', category: 'Ability Score', icon: 'bolt', color: 'teal-4' },
  { label: 'Intelligence Score (INT)', value: 'int_score', category: 'Ability Score', icon: 'psychology', color: 'teal-4' },
  { label: 'Strength Score (STR)', value: 'str_score', category: 'Ability Score', icon: 'fitness_center', color: 'teal-4' },
  { label: 'Wisdom Score (WIS)', value: 'wis_score', category: 'Ability Score', icon: 'visibility', color: 'teal-4' },
]

export const DYNAMIC_SOURCE_ENTRIES = toCatalogEntries(dynamicSourceItems)
export const BLOODIED_SOURCE_ENTRIES = toCatalogEntries([
  { label: 'None (Hidden)', value: 'none', category: 'Disabled', icon: 'visibility_off', color: 'grey-5' },
  ...dynamicSourceItems,
])
export const DT_DR_SOURCE_ENTRIES = toCatalogEntries([
  { label: 'Flat Value (or Empty for Disabled)', value: 'flat', category: 'Dice & Scaling', icon: 'pin', color: 'cyan-4' },
  ...dynamicSourceItems.filter((o) => o.value !== 'flat'),
])

export const RETURN_HP_SOURCE_ENTRIES = toCatalogEntries([
  { label: '1 Hit Point', value: '1', category: 'Fixed', icon: 'looks_one', color: 'amber-4' },
  { label: 'Flat Value', value: 'flat', category: 'Fixed', icon: 'pin', color: 'cyan-4' },
  { label: '1/2 of Hit Points', value: 'half_hp', category: 'HP Fraction', icon: 'favorite', color: 'red-4' },
  { label: '1/4 of Hit Points', value: 'quarter_hp', category: 'HP Fraction', icon: 'favorite_border', color: 'red-4' },
  { label: '1/8 of Hit Points', value: 'eighth_hp', category: 'HP Fraction', icon: 'heart_broken', color: 'red-4' },
  { label: 'Dice Roll', value: 'dice', category: 'Dice & Scaling', icon: 'casino', color: 'amber-4' },
  { label: 'Dice Roll + CHA Modifier', value: 'dice_cha_mod', category: 'Dice & Scaling', icon: 'casino', color: 'amber-4' },
  { label: 'Dice Roll + CON Modifier', value: 'dice_con_mod', category: 'Dice & Scaling', icon: 'casino', color: 'amber-4' },
  { label: 'Dice Roll + WIS Modifier', value: 'dice_wis_mod', category: 'Dice & Scaling', icon: 'casino', color: 'amber-4' },
  { label: 'Hit Dice Count', value: 'hit_dice', category: 'Dice & Scaling', icon: 'layers', color: 'amber-4' },
  { label: 'Proficiency Bonus (+PB)', value: 'proficiency', category: 'Dice & Scaling', icon: 'military_tech', color: 'amber-4' },
  { label: 'Constitution Modifier (CON mod)', value: 'con_mod', category: 'Ability Mod', icon: 'shield', color: 'purple-4' },
  { label: 'Charisma Score (CHA)', value: 'cha_score', category: 'Ability Score', icon: 'auto_awesome', color: 'teal-4' },
  { label: 'Constitution Score (CON)', value: 'con_score', category: 'Ability Score', icon: 'shield', color: 'teal-4' },
  { label: 'Strength Score (STR)', value: 'str_score', category: 'Ability Score', icon: 'fitness_center', color: 'teal-4' },
  { label: 'Wisdom Score (WIS)', value: 'wis_score', category: 'Ability Score', icon: 'visibility', color: 'teal-4' },
])

export const DEATH_PREVENTION_RULE_ENTRIES = toCatalogEntries([
  { label: 'Returns to Life with X Hit Points', value: 'always_survives', category: 'Revival', icon: 'autorenew', color: 'positive' },
  { label: 'Returns upon Death Saving Throw Success', value: 'death_save_success', category: 'Revival', icon: 'favorite', color: 'teal-4' },
  { label: 'Upon death Deals Damage (Death Burst)', value: 'upon_death_burst', category: 'Death Burst', icon: 'flare', color: 'deep-orange-4' },
  { label: 'CON Save DC 5 + Damage Taken (Undead Fortitude)', value: 'dc_5_plus_dmg', category: 'Saving Throw', icon: 'shield', color: 'amber-4' },
  { label: 'Custom Saving Throw DC', value: 'custom_save', category: 'Saving Throw', icon: 'tune', color: 'amber-4' },
  { label: 'True Immortal (Hide HP on Statblock)', value: 'true_immortal', category: 'Immortality', icon: 'all_inclusive', color: 'purple-4' },
  { label: 'Until Hit by X Critical Hits (Hide HP)', value: 'until_x_crits', category: 'Immortality', icon: 'gavel', color: 'red-4' },
])

export const DISRUPTION_ENTRIES = toCatalogEntries([
  { label: 'None', value: 'none', category: 'Standard', icon: 'check_circle_outline', color: 'grey-5' },
  { label: 'Adamantine Weapons', value: 'adamantine', category: 'Weapon / Attack', icon: 'hardware', color: 'amber-4' },
  { label: 'Critical Hits', value: 'critical_hits', category: 'Weapon / Attack', icon: 'flare', color: 'red-4' },
  { label: 'Magical Attacks', value: 'magical', category: 'Weapon / Attack', icon: 'auto_fix_high', color: 'purple-4' },
  { label: 'Silvered Weapons', value: 'silvered', category: 'Weapon / Attack', icon: 'colorize', color: 'blue-3' },
  { label: 'Incapacitated', value: 'incapacitated', category: 'Condition', icon: 'block', color: 'orange-4' },
  { label: 'Paralyzed', value: 'paralyzed', category: 'Condition', icon: 'accessibility_new', color: 'orange-4' },
  { label: 'Stunned', value: 'stunned', category: 'Condition', icon: 'offline_bolt', color: 'orange-4' },
  { label: 'Unconscious', value: 'unconscious', category: 'Condition', icon: 'bedtime', color: 'orange-4' },
  { label: 'Psychic Damage', value: 'psychic', category: 'Damage / Env', icon: 'psychology', color: 'pink-4' },
  { label: 'Radiant or Fire Damage', value: 'radiant_or_fire', category: 'Damage / Env', icon: 'local_fire_department', color: 'amber-5' },
  { label: 'Sunlight', value: 'sunlight', category: 'Damage / Env', icon: 'wb_sunny', color: 'yellow-6' },
  { label: 'Custom Disruption', value: 'custom', category: 'Custom', icon: 'edit_note', color: 'cyan-4' },
])

export const FREQUENCY_ENTRIES = toCatalogEntries([
  { label: 'None (Disabled)', value: 'none', category: 'Disabled', icon: 'block', color: 'grey-5' },
  { label: 'Did not take damage since the start of last turn', value: 'no_damage_taken', category: 'Combat Turn', icon: 'shield', color: 'teal-4' },
  { label: 'End of a turn', value: 'end_of_a_turn', category: 'Combat Turn', icon: 'schedule', color: 'teal-4' },
  { label: 'End of current turn', value: 'end_of_current_turn', category: 'Combat Turn', icon: 'update', color: 'teal-4' },
  { label: 'End of its turn', value: 'turn_end', category: 'Combat Turn', icon: 'schedule', color: 'teal-4' },
  { label: 'Start of a turn', value: 'start_of_a_turn', category: 'Combat Turn', icon: 'play_circle', color: 'teal-4' },
  { label: 'Start of its turn', value: 'turn_start', category: 'Combat Turn', icon: 'bolt', color: 'teal-4' },
  { label: 'When taking damage of selected type', value: 'damage_taken', category: 'Combat Turn', icon: 'flash_on', color: 'amber-4' },
  { label: 'At Dawn', value: 'dawn', category: 'Solar Cycle', icon: 'wb_twilight', color: 'amber-4' },
  { label: 'At Dusk', value: 'dusk', category: 'Solar Cycle', icon: 'nights_stay', color: 'deep-orange-4' },
  { label: 'At Midday', value: 'midday', category: 'Solar Cycle', icon: 'wb_sunny', color: 'yellow-6' },
  { label: 'At Midnight', value: 'midnight', category: 'Solar Cycle', icon: 'bedtime', color: 'indigo-4' },
  { label: 'Every Day', value: 'day', category: 'Time Interval', icon: 'today', color: 'blue-4' },
  { label: 'Every Hour', value: 'hour', category: 'Time Interval', icon: 'hourglass_bottom', color: 'blue-4' },
  { label: 'Every Minute', value: 'minute', category: 'Time Interval', icon: 'timer', color: 'blue-4' },
  { label: 'On a Long Rest', value: 'long_rest', category: 'Rest & Downtime', icon: 'hotel', color: 'purple-4' },
  { label: 'On a Short Rest', value: 'short_rest', category: 'Rest & Downtime', icon: 'coffee', color: 'purple-4' },
  { label: 'On Downtime', value: 'downtime', category: 'Rest & Downtime', icon: 'weekend', color: 'purple-4' },
])

export const RECOVERY_TYPE_ENTRIES = toCatalogEntries([
  { label: 'Absorb Damage as Hit Points', value: 'absorb_hp', category: 'Absorption', icon: 'flash_on', color: 'amber-4' },
  { label: 'Absorb Damage as Temp HP', value: 'absorb_temp_hp', category: 'Absorption', icon: 'shield', color: 'amber-4' },
  { label: 'Gain Temporary Hit Points', value: 'temp_hp', category: 'Temp HP', icon: 'add_moderator', color: 'cyan-4' },
  { label: 'Regain Hit Points (Regeneration)', value: 'regen', category: 'Healing', icon: 'favorite', color: 'teal-4' },
])

export const REGEN_CONDITION_MODIFIER_ENTRIES = toCatalogEntries([
  { label: 'Standard Minimalist Notation', value: 'none', category: 'Standard', icon: 'favorite', color: 'teal-4' },
  { label: 'If took no damage since previous turn', value: 'no_damage_since_previous_turn', category: 'Turn Trigger', icon: 'verified_user', color: 'green-4' },
  { label: 'If your head is not severed', value: 'head_not_severed', category: 'Anatomy / Survival', icon: 'face', color: 'blue-4' },
  { label: 'Reduces maximum hit points until rest', value: 'max_hp_reduction', category: 'Max HP Reduction', icon: 'trending_down', color: 'deep-orange-4' },
  { label: 'While not Bloodied', value: 'not_bloodied', category: 'State', icon: 'warning', color: 'red-4' },
  { label: 'Of temp HP if you have temp HP', value: 'has_temp_hp', category: 'Temp HP Condition', icon: 'shield', color: 'cyan-4' },
])

export const DISPLAY_MODE_ENTRIES = toCatalogEntries(
  [
    { label: 'Both (Near HP & in Traits)', value: 'both' },
    { label: 'Minimalist Only (Near HP)', value: 'minimalist' },
    { label: 'Detailed Only (In Traits)', value: 'detailed' },
  ],
  'Display Format',
  false,
)

export const MAX_HP_REDUCTION_UNTIL_ENTRIES = toCatalogEntries(
  ['short rest', 'long rest', 'short or long rest', 'dawn', 'midnight', '24 hours'],
  'Duration',
  false,
)

export const DEATH_PREVENTION_TEMPLATE_ENTRIES = toCatalogEntries(
  ['Mortal', 'Immortal', 'Undead Fortitude', 'Relentless Endurance', 'Death Ward', 'Custom'],
  'Templates',
  false,
)

export const REVIVAL_TIMEFRAME_ENTRIES = toCatalogEntries(
  [
    { label: 'Immediate (Standard)', value: 'none' },
    { label: 'At End of Turn', value: 'at_end_of_turn' },
    { label: 'At Start of Next Turn', value: 'start_of_next_turn' },
  ],
  'Revival Timing',
  false,
)

export const BURST_TARGET_FILTER_ENTRIES = toCatalogEntries(
  ['Creatures', 'Undeads, and Fiends', 'Hostile Creatures', 'Allies'],
  'Targets',
  false,
)

export const DEATH_EXCEPTION_ENTRIES = toCatalogEntries(
  [
    'Necrotic Damage',
    'Critical Strikes',
    'Radiant Damage',
    'Fire Damage',
    'acid',
    'bludgeoning',
    'cold',
    'fire',
    'force',
    'lightning',
    'necrotic',
    'piercing',
    'poison',
    'psychic',
    'radiant',
    'slashing',
    'thunder',
    'adamantine weapons',
    'critical hit',
    'disintegration',
    'holy water',
    'magical weapons',
    'running water',
    'silvered weapons',
    'sunlight',
    'wish spell',
    'charmed',
    'exhaustion',
    'frightened',
    'grappled',
    'incapacitated',
    'paralyzed',
    'petrified',
    'poisoned',
    'restrained',
    'stunned',
    'unconscious',
  ],
  'Revival Exceptions',
  false,
)

export const LANGUAGE_REQUIREMENT_ENTRIES = toCatalogEntries(
  [
    { label: 'None', value: 'none' },
    { label: 'Must Understand >=1', value: 'must_understand' },
    { label: 'Must Share Language', value: 'must_share' },
  ],
  'Requirement',
  false,
)

export const CREATURE_TARGET_ENTRIES = toCatalogEntries(
  [
    { label: 'All Creatures', value: 'all' },
    { label: 'Intelligent (INT >= 6)', value: 'intelligent_only' },
    { label: 'Non-Intelligent (INT <= 5)', value: 'non_intelligent_only' },
  ],
  'Target Filter',
  false,
)

export const CONCENTRATION_FILTER_ENTRIES = toCatalogEntries(
  [
    { label: 'All Creatures', value: 'all' },
    { label: 'Creatures Concentrating Only', value: 'concentrating_only' },
    { label: 'Creatures Making/Maintaining Concentration', value: 'concentration_check' },
  ],
  'Concentration',
  false,
)

export const CONCENTRATION_MODE_ENTRIES = toCatalogEntries(
  [
    { label: 'Standard (None)', value: 'none' },
    { label: 'Concentration Negates (Spell Concentration Negates Effect)', value: 'concentration_negates' },
    { label: 'Forced Concentration (Concentration Avoids Reading instead of Save)', value: 'forced_concentration' },
    { label: 'Requires Concentration (Monster Concentrates)', value: 'requires_concentration' },
  ],
  'Concentration Mode',
  false,
)

export const CONCENTRATION_ENTRIES = toCatalogEntries(
  [
    { label: 'None', value: 'none' },
    { label: 'Monster', value: 'monster_only' },
    { label: 'Target Creature', value: 'creature_only' },
    { label: 'Both', value: 'both' },
  ],
  'Concentration',
  false,
)

export const SAVE_AWARENESS_ENTRIES = toCatalogEntries(
  [
    { label: 'Unaware on Failure', value: 'unaware_on_fail' },
    { label: 'Always Unaware', value: 'always_unaware' },
    { label: 'Always Aware', value: 'aware' },
  ],
  'Awareness',
  false,
)

export const ALL_LANGUAGE_SORTED: readonly string[] = [...ALL_OFFICIAL_LANGUAGES]
