export const STANDARD_LANGUAGES = [
  'Common',
  'Common Sign Language',
  'Dwarvish',
  'Elvish',
  'Giant',
  'Gnomish',
  'Goblin',
  'Halfling',
  'Orc',
]

export const EXOTIC_LANGUAGES = [
  'Abyssal',
  'Aquan',
  'Auran',
  'Celestial',
  'Deep Speech',
  'Draconic',
  'Druidic',
  'Ignan',
  'Infernal',
  'Primordial',
  'Sylvan',
  'Terran',
  'Thieves\' cant',
  'Undercommon',
]

/** Monster tongues from the Monster Manual and adventures (2014 and 2024). */
export const MONSTER_LANGUAGES = [
  'Aarakocra',
  'Blink Dog',
  'Bullywug',
  'Giant Eagle',
  'Giant Elk',
  'Giant Owl',
  'Gith',
  'Gnoll',
  'Grell',
  'Grung',
  'Hook Horror',
  'Ixitxachitl',
  'Kraul',
  'Modron',
  'Otyugh',
  'Sahuagin',
  'Slaad',
  'Sphinx',
  'Thri-kreen',
  'Tlincalli',
  'Troglodyte',
  'Umber Hulk',
  'Vegepygmy',
  'Winter Wolf',
  'Worg',
  'Yeti',
]

/** Human languages of the Forgotten Realms. */
export const REGIONAL_LANGUAGES = [
  'Chondathan',
  'Damaran',
  'Illuskan',
  'Loross',
  'Mulhorandi',
  'Netherese',
  'Rashemi',
  'Shou',
  'Tuigan',
  'Turmic',
  'Uluik',
]

/** Constructs and created beings: "understands the language of its manufacturer". */
export const MANUFACTURER_LANGUAGE = 'Language of its Manufacturer'

export const SPECIAL_LANGUAGES = [
  'All languages',
  'All languages it knew in life',
  'Animals',
  'Any one language (usually Common)',
  'Any two languages',
  'Dead (Speak with Dead)',
  'Handle Animals',
  MANUFACTURER_LANGUAGE,
  'Plants',
  'Telepathy',
  'Undead',
]

export const ALL_OFFICIAL_LANGUAGES = [
  ...STANDARD_LANGUAGES,
  ...EXOTIC_LANGUAGES,
  ...MONSTER_LANGUAGES,
  ...REGIONAL_LANGUAGES,
  ...SPECIAL_LANGUAGES,
]
