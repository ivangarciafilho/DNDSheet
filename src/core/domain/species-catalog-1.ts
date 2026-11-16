// Species catalog, part 1 of 3 (entries kept in catalog order; joined in species-and-heuristics.ts).
import type { SpeciesEntry } from './species-and-heuristics.ts'

export const SPECIES_CATALOG_PART_1: SpeciesEntry[] = [
  {
    id: 'human',
    name: 'Human',
    type: 'Humanoid',
    subtype: 'Human',
    speed: 30,
    languages: ['Common'],
    statBonuses: { STR: 1, DEX: 1, CON: 1, INT: 1, WIS: 1, CHA: 1 },
    traits: [
      {
        name: 'Versatile',
        description: 'Humans gain proficiency in one additional skill of their choice and one feat.',
      },
    ],
  },
  {
    id: 'elf_high',
    name: 'Elf (High)',
    type: 'Humanoid',
    subtype: 'Elf',
    speed: 30,
    senses: [{ name: 'Darkvision', value: '60 ft.' }],
    languages: ['Common', 'Elvish'],
    statBonuses: { DEX: 2, INT: 1 },
    traits: [
      {
        name: 'Fey Ancestry',
        description: 'The elf has Advantage on saving throws against being Charmed, and magic cannot put the elf to sleep.',
      },
      {
        name: 'Trance',
        description: 'The elf does not need to sleep. Instead, they meditate deeply for 4 hours a day.',
      },
    ],
  },
  {
    id: 'elf_wood',
    name: 'Elf (Wood)',
    type: 'Humanoid',
    subtype: 'Elf',
    speed: 35,
    senses: [{ name: 'Darkvision', value: '60 ft.' }],
    languages: ['Common', 'Elvish'],
    statBonuses: { DEX: 2, WIS: 1 },
    traits: [
      {
        name: 'Fey Ancestry',
        description: 'The elf has Advantage on saving throws against being Charmed, and magic cannot put the elf to sleep.',
      },
      {
        name: 'Mask of the Wild',
        description: 'The elf can attempt to hide even when only lightly obscured by foliage, heavy rain, falling snow, mist, and other natural phenomena.',
      },
    ],
  },
  {
    id: 'elf_drow',
    name: 'Elf (Drow)',
    type: 'Humanoid',
    subtype: 'Elf',
    speed: 30,
    senses: [{ name: 'Superior Darkvision', value: '120 ft.' }],
    languages: ['Common', 'Elvish', 'Undercommon'],
    statBonuses: { DEX: 2, CHA: 1 },
    traits: [
      {
        name: 'Fey Ancestry',
        description: 'The elf has Advantage on saving throws against being Charmed, and magic cannot put the elf to sleep.',
      },
      {
        name: 'Sunlight Sensitivity',
        description: 'While in sunlight, the drow has Disadvantage on attack rolls, as well as on Wisdom (Perception) checks that rely on sight.',
      },
    ],
  },
  {
    id: 'dwarf_hill',
    name: 'Dwarf (Hill)',
    type: 'Humanoid',
    subtype: 'Dwarf',
    speed: 25,
    senses: [{ name: 'Darkvision', value: '60 ft.' }],
    resistances: ['poison'],
    languages: ['Common', 'Dwarvish'],
    statBonuses: { CON: 2, WIS: 1 },
    traits: [
      {
        name: 'Dwarven Resilience',
        description: 'The dwarf has Advantage on saving throws against poison, and resistance against poison damage.',
      },
      {
        name: 'Dwarven Toughness',
        description: 'The dwarf hit point maximum increases by 1 for every hit die it possesses.',
      },
    ],
  },
  {
    id: 'dwarf_mountain',
    name: 'Dwarf (Mountain)',
    type: 'Humanoid',
    subtype: 'Dwarf',
    speed: 25,
    senses: [{ name: 'Darkvision', value: '60 ft.' }],
    resistances: ['poison'],
    languages: ['Common', 'Dwarvish'],
    statBonuses: { CON: 2, STR: 2 },
    traits: [
      {
        name: 'Dwarven Resilience',
        description: 'The dwarf has Advantage on saving throws against poison, and resistance against poison damage.',
      },
    ],
  },
  {
    id: 'tiefling',
    name: 'Tiefling',
    type: 'Humanoid',
    subtype: 'Tiefling',
    speed: 30,
    senses: [{ name: 'Darkvision', value: '60 ft.' }],
    resistances: ['fire'],
    languages: ['Common', 'Infernal'],
    statBonuses: { CHA: 2, INT: 1 },
    traits: [
      {
        name: 'Hellish Resistance',
        description: 'The tiefling has resistance to fire damage.',
      },
    ],
  },
  {
    id: 'dragonborn',
    name: 'Dragonborn',
    type: 'Humanoid',
    subtype: 'Dragonborn',
    speed: 30,
    languages: ['Common', 'Draconic'],
    statBonuses: { STR: 2, CHA: 1 },
    traits: [
      {
        name: 'Draconic Ancestry',
        description: 'The dragonborn has a breath weapon and damage resistance determined by its draconic ancestry.',
      },
    ],
  },
  {
    id: 'halfling',
    name: 'Halfling',
    type: 'Humanoid',
    subtype: 'Halfling',
    size: 'Small',
    speed: 25,
    languages: ['Common', 'Halfling'],
    statBonuses: { DEX: 2 },
    traits: [
      {
        name: 'Lucky',
        description: 'When the halfling rolls a 1 on the d20 for an attack roll, ability check, or saving throw, it can reroll the die and must use the new roll.',
      },
      {
        name: 'Brave',
        description: 'The halfling has Advantage on saving throws against being Frightened.',
      },
    ],
  },
  {
    id: 'gnome_rock',
    name: 'Gnome (Rock)',
    type: 'Humanoid',
    subtype: 'Gnome',
    size: 'Small',
    speed: 25,
    senses: [{ name: 'Darkvision', value: '60 ft.' }],
    languages: ['Common', 'Gnomish'],
    statBonuses: { INT: 2, CON: 1 },
    traits: [
      {
        name: 'Gnome Cunning',
        description: 'The gnome has Advantage on all Intelligence, Wisdom, and Charisma saving throws against magic.',
      },
    ],
  },
  {
    id: 'orc',
    name: 'Orc',
    type: 'Humanoid',
    subtype: 'Orc',
    speed: 30,
    senses: [{ name: 'Darkvision', value: '60 ft.' }],
    languages: ['Common', 'Orc'],
    statBonuses: { STR: 2, CON: 1 },
    traits: [
      {
        name: 'Aggressive',
        description: 'As a Bonus Action, the orc can move up to its speed toward a hostile creature that it can see.',
      },
      {
        name: 'Relentless Endurance',
        description: 'When the orc is reduced to 0 hit points but not killed outright, it can drop to 1 hit point instead (1/Long Rest).',
      },
    ],
  },
  {
    id: 'undead',
    name: 'Undead Heritage',
    type: 'Undead',
    speed: 30,
    senses: [{ name: 'Darkvision', value: '60 ft.' }],
    immunities: ['poison', 'poisoned'],
    statBonuses: { CON: 2, STR: 1 },
    traits: [
      {
        name: 'Undead Fortitude',
        description: 'If damage reduces the creature to 0 hit points, it must make a Constitution saving throw with a DC of 5 + the damage taken, unless the damage is radiant or from a critical hit. On a success, the creature drops to 1 hit point instead.',
      },
    ],
  },
  {
    id: 'fiend',
    name: 'Fiend Heritage',
    type: 'Fiend',
    speed: 30,
    senses: [{ name: 'Darkvision', value: '120 ft.' }],
    resistances: ['cold', 'fire', 'lightning'],
    immunities: ['poison', 'poisoned'],
    statBonuses: { CHA: 2, STR: 1, CON: 1 },
    traits: [
      {
        name: 'Magic Resistance',
        description: 'The fiend has Advantage on saving throws against spells and other magical effects.',
      },
    ],
  },
  {
    id: 'celestial',
    name: 'Celestial Heritage',
    type: 'Celestial',
    speed: 30,
    senses: [{ name: 'Darkvision', value: '120 ft.' }, { name: 'Truesight', value: '60 ft.' }],
    resistances: ['radiant'],
    immunities: ['charmed', 'exhaustion', 'frightened'],
    statBonuses: { WIS: 2, CHA: 2, CON: 1 },
    traits: [
      {
        name: 'Angelic Weapons',
        description: 'The celestial weapon attacks are magical. When it hits with any weapon, the weapon deals an extra 4d8 radiant damage.',
      },
      {
        name: 'Magic Resistance',
        description: 'The celestial has Advantage on saving throws against spells and other magical effects.',
      },
      {
        name: 'Divine Awareness',
        description: 'The celestial knows if it hears a lie.',
      },
    ],
  },
  {
    'id': 'aasimar_protector',
    'name': 'Aasimar (Protector)',
    'type': 'Celestial',
    'subtype': 'Aasimar',
    'speed': 30,
    'senses': [
      {
        'name': 'Darkvision',
        'value': '60 ft.'
      }
    ],
    'resistances': [
      'radiant',
      'necrotic'
    ],
    'languages': [
      'Common',
      'Celestial'
    ],
    'statBonuses': {
      'CHA': 2,
      'WIS': 1
    },
    'traits': [
      {
        'name': 'Celestial Resistance',
        'description': 'Resistance to necrotic damage and radiant damage.'
      },
      {
        'name': 'Healing Hands',
        'description': 'As an action, touch a creature and restore HP equal to level (1/Long Rest).'
      },
      {
        'name': 'Light Bearer',
        'description': 'Knows the Light cantrip (Charisma).'
      },
      {
        'name': 'Radiant Soul',
        'description': 'Bonus action to sprout wings for 1 minute: 30ft fly speed and deal extra radiant damage equal to level once per turn.'
      }
    ]
  },
  {
    'id': 'aasimar_scourge',
    'name': 'Aasimar (Scourge)',
    'type': 'Celestial',
    'subtype': 'Aasimar',
    'speed': 30,
    'senses': [
      {
        'name': 'Darkvision',
        'value': '60 ft.'
      }
    ],
    'resistances': [
      'radiant',
      'necrotic'
    ],
    'languages': [
      'Common',
      'Celestial'
    ],
    'statBonuses': {
      'CHA': 2,
      'CON': 1
    },
    'traits': [
      {
        'name': 'Celestial Resistance',
        'description': 'Resistance to necrotic damage and radiant damage.'
      },
      {
        'name': 'Healing Hands',
        'description': 'As an action, touch a creature and restore HP equal to level (1/Long Rest).'
      },
      {
        'name': 'Radiant Consumption',
        'description': 'Bonus action to unleash searing light: 10ft aura dealing radiant damage equal to half level, and extra radiant damage to one target.'
      }
    ]
  },
  {
    'id': 'aasimar_fallen',
    'name': 'Aasimar (Fallen)',
    'type': 'Celestial',
    'subtype': 'Aasimar',
    'speed': 30,
    'senses': [
      {
        'name': 'Darkvision',
        'value': '60 ft.'
      }
    ],
    'resistances': [
      'radiant',
      'necrotic'
    ],
    'languages': [
      'Common',
      'Celestial'
    ],
    'statBonuses': {
      'CHA': 2,
      'STR': 1
    },
    'traits': [
      {
        'name': 'Celestial Resistance',
        'description': 'Resistance to necrotic damage and radiant damage.'
      },
      {
        'name': 'Healing Hands',
        'description': 'As an action, touch a creature and restore HP equal to level (1/Long Rest).'
      },
      {
        'name': 'Necrotic Shroud',
        'description': 'Bonus action: creatures within 10ft must succeed on Charisma save (DC 8+PB+Cha) or be frightened; extra necrotic damage once per turn.'
      }
    ]
  },
  {
    'id': 'genasi_air',
    'name': 'Genasi (Air)',
    'type': 'Humanoid',
    'subtype': 'Genasi',
    'speed': 30,
    'languages': [
      'Common',
      'Primordial'
    ],
    'statBonuses': {
      'CON': 2,
      'DEX': 1
    },
    'traits': [
      {
        'name': 'Unending Breath',
        'description': 'Can hold its breath indefinitely while not incapacitated.'
      },
      {
        'name': 'Mingle with the Wind',
        'description': 'Can cast Levitate once per Long Rest requiring no material components (Constitution).'
      }
    ]
  },
  {
    'id': 'genasi_earth',
    'name': 'Genasi (Earth)',
    'type': 'Humanoid',
    'subtype': 'Genasi',
    'speed': 30,
    'languages': [
      'Common',
      'Primordial'
    ],
    'statBonuses': {
      'CON': 2,
      'STR': 1
    },
    'traits': [
      {
        'name': 'Earth Walk',
        'description': 'Can move across difficult terrain made of earth or stone without expending extra movement.'
      },
      {
        'name': 'Merge with Stone',
        'description': 'Can cast Pass without Trace once per Long Rest requiring no material components (Constitution).'
      }
    ]
  },
  {
    'id': 'genasi_fire',
    'name': 'Genasi (Fire)',
    'type': 'Humanoid',
    'subtype': 'Genasi',
    'speed': 30,
    'senses': [
      {
        'name': 'Darkvision',
        'value': '60 ft.'
      }
    ],
    'resistances': [
      'fire'
    ],
    'languages': [
      'Common',
      'Primordial'
    ],
    'statBonuses': {
      'CON': 2,
      'INT': 1
    },
    'traits': [
      {
        'name': 'Fire Resistance',
        'description': 'Resistance to fire damage.'
      },
      {
        'name': 'Reach to the Blaze',
        'description': 'Knows Produce Flame cantrip; can cast Burning Hands once per Long Rest (Constitution).'
      }
    ]
  },
  {
    'id': 'genasi_water',
    'name': 'Genasi (Water)',
    'type': 'Humanoid',
    'subtype': 'Genasi',
    'speed': 30,
    'resistances': [
      'acid'
    ],
    'languages': [
      'Common',
      'Primordial'
    ],
    'statBonuses': {
      'CON': 2,
      'WIS': 1
    },
    'traits': [
      {
        'name': 'Acid Resistance',
        'description': 'Resistance to acid damage.'
      },
      {
        'name': 'Amphibious',
        'description': 'Can breathe air and water.'
      },
      {
        'name': 'Swim',
        'description': 'Has a swimming speed of 30 feet.'
      },
      {
        'name': 'Call to the Wave',
        'description': 'Knows Shape Water cantrip; can cast Create or Destroy Water once per Long Rest (Constitution).'
      }
    ]
  },
  {
    'id': 'goliath',
    'name': 'Goliath',
    'type': 'Humanoid',
    'subtype': 'Goliath',
    'speed': 30,
    'resistances': [
      'cold'
    ],
    'languages': [
      'Common',
      'Giant'
    ],
    'statBonuses': {
      'STR': 2,
      'CON': 1
    },
    'traits': [
      {
        'name': "Stone's Endurance",
        'description': 'When taking damage, reaction to roll 1d12 + Con modifier and reduce the damage taken by that total (1/Short or Long Rest).'
      },
      {
        'name': 'Powerful Build',
        'description': 'Counts as one size larger when determining carrying capacity and the weight it can push, drag, or lift.'
      },
      {
        'name': 'Mountain Born',
        'description': 'Acclimated to high altitude and naturally adapted to cold climates.'
      }
    ]
  },
  {
    'id': 'tabaxi',
    'name': 'Tabaxi',
    'type': 'Humanoid',
    'subtype': 'Tabaxi',
    'speed': 30,
    'senses': [
      {
        'name': 'Darkvision',
        'value': '60 ft.'
      }
    ],
    'languages': [
      'Common'
    ],
    'statBonuses': {
      'DEX': 2,
      'CHA': 1
    },
    'traits': [
      {
        'name': 'Feline Agility',
        'description': 'When moving on its turn in combat, can double its speed until the end of the turn. Once used, cannot use again until moving 0 feet on one of its turns.'
      },
      {
        'name': "Cat's Claws",
        'description': 'Climbing speed of 20 feet and unarmed strikes deal 1d4 + Str modifier slashing damage.'
      },
      {
        'name': "Cat's Talent",
        'description': 'Proficiency in the Perception and Stealth skills.'
      }
    ]
  },
  {
    'id': 'kenku',
    'name': 'Kenku',
    'type': 'Humanoid',
    'subtype': 'Kenku',
    'speed': 30,
    'languages': [
      'Common',
      'Auran'
    ],
    'statBonuses': {
      'DEX': 2,
      'WIS': 1
    },
    'traits': [
      {
        'name': 'Expert Forgery',
        'description': 'Can duplicate other creatures handwriting and craftwork. Advantage on all checks made to produce forgeries.'
      },
      {
        'name': 'Kenku Recall',
        'description': 'Proficiency in two skills of choice; can give itself Advantage on an ability check using any skill PB times per Long Rest.'
      },
      {
        'name': 'Mimicry',
        'description': 'Can mimic sounds it has heard, including voices. Deception vs Insight check to determine if authentic.'
      }
    ]
  },
  {
    'id': 'lizardfolk',
    'name': 'Lizardfolk',
    'type': 'Humanoid',
    'subtype': 'Lizardfolk',
    'speed': 30,
    'languages': [
      'Common',
      'Draconic'
    ],
    'statBonuses': {
      'CON': 2,
      'WIS': 1
    },
    'traits': [
      {
        'name': 'Bite',
        'description': 'Fanged maw deals 1d6 + Str modifier piercing damage.'
      },
      {
        'name': 'Hungry Jaws',
        'description': 'Bonus action bite attack; on hit, gains temporary HP equal to Constitution modifier (1/Short or Long Rest).'
      },
      {
        'name': 'Hold Breath',
        'description': 'Can hold breath for up to 15 minutes at a time.'
      },
      {
        'name': 'Natural Armor',
        'description': 'Base AC is 13 + Dexterity modifier when not wearing armor.'
      }
    ]
  },
]
