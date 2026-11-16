// Species catalog, part 3 of 3 (entries kept in catalog order; joined in species-and-heuristics.ts).
import type { SpeciesEntry } from './species-and-heuristics.ts'

export const SPECIES_CATALOG_PART_3: SpeciesEntry[] = [
  {
    'id': 'hexblood',
    'name': 'Hexblood',
    'type': 'Fey',
    'subtype': 'Hexblood',
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
      'WIS': 2,
      'INT': 1
    },
    'traits': [
      {
        'name': 'Hex Magic',
        'description': 'Can cast Disguise Self and Hex once per Long Rest (Intelligence, Wisdom, or Charisma).'
      },
      {
        'name': 'Eerie Token',
        'description': 'Bonus action to remove a lock of hair or nail to create a magical token: telepathic message up to 10 miles away, or remote sensor for 1 minute.'
      }
    ]
  },
  {
    'id': 'reborn',
    'name': 'Reborn',
    'type': 'Humanoid',
    'subtype': 'Reborn',
    'speed': 30,
    'resistances': [
      'poison'
    ],
    'immunities': [
      'disease'
    ],
    'languages': [
      'Common'
    ],
    'statBonuses': {
      'CON': 2,
      'STR': 1
    },
    'traits': [
      {
        'name': 'Deathless Nature',
        'description': 'Advantage on saving throws against disease and being poisoned; resistance to poison damage; advantage on death saving throws; does not need to eat, drink, breathe, or sleep; finishes a Long Rest in 4 hours.'
      },
      {
        'name': 'Knowledge from a Past Life',
        'description': 'When making an ability check that uses a skill, can roll a 1d6 and add the number rolled to the check (PB times/Long Rest).'
      }
    ]
  },
  {
    'id': 'eladrin',
    'name': 'Eladrin',
    'type': 'Humanoid',
    'subtype': 'Elf',
    'speed': 30,
    'senses': [
      {
        'name': 'Darkvision',
        'value': '60 ft.'
      }
    ],
    'languages': [
      'Common',
      'Elvish'
    ],
    'statBonuses': {
      'DEX': 2,
      'CHA': 1
    },
    'traits': [
      {
        'name': 'Fey Ancestry',
        'description': 'Advantage on saves against being Charmed; magic cannot put to sleep.'
      },
      {
        'name': 'Trance',
        'description': 'Meditates deeply for 4 hours instead of sleeping.'
      },
      {
        'name': 'Fey Step',
        'description': 'Bonus action to magically teleport up to 30 feet to an unoccupied space (PB times/Long Rest) with seasonal effect: Autumn (charm target), Winter (frighten target), Spring (teleport willing ally), Summer (deal fire damage equal to Charisma mod).'
      }
    ]
  },
  {
    'id': 'shadarkai',
    'name': 'Shadar-kai',
    'type': 'Humanoid',
    'subtype': 'Elf',
    'speed': 30,
    'senses': [
      {
        'name': 'Darkvision',
        'value': '60 ft.'
      }
    ],
    'resistances': [
      'necrotic'
    ],
    'languages': [
      'Common',
      'Elvish'
    ],
    'statBonuses': {
      'DEX': 2,
      'CON': 1
    },
    'traits': [
      {
        'name': 'Fey Ancestry',
        'description': 'Advantage on saves against being Charmed; magic cannot put to sleep.'
      },
      {
        'name': 'Trance',
        'description': 'Meditates deeply for 4 hours instead of sleeping.'
      },
      {
        'name': 'Necrotic Resistance',
        'description': 'Resistance to necrotic damage.'
      },
      {
        'name': 'Blessing of the Raven Queen',
        'description': 'Bonus action to magically teleport up to 30 feet (PB times/Long Rest); gains resistance to all damage until start of next turn.'
      }
    ]
  },
  {
    'id': 'sea_elf',
    'name': 'Elf (Sea)',
    'type': 'Humanoid',
    'subtype': 'Elf',
    'speed': 30,
    'senses': [
      {
        'name': 'Darkvision',
        'value': '60 ft.'
      }
    ],
    'resistances': [
      'cold'
    ],
    'languages': [
      'Common',
      'Elvish',
      'Aquan'
    ],
    'statBonuses': {
      'DEX': 2,
      'CON': 1
    },
    'traits': [
      {
        'name': 'Fey Ancestry',
        'description': 'Advantage on saves against being Charmed; magic cannot put to sleep.'
      },
      {
        'name': 'Child of the Sea',
        'description': 'Swimming speed of 30 feet and can breathe air and water.'
      },
      {
        'name': 'Friend of the Sea',
        'description': 'Can communicate simple ideas to any beast that has an inborn swimming speed.'
      }
    ]
  },
  {
    'id': 'astral_elf',
    'name': 'Elf (Astral)',
    'type': 'Humanoid',
    'subtype': 'Elf',
    'speed': 30,
    'senses': [
      {
        'name': 'Darkvision',
        'value': '60 ft.'
      }
    ],
    'languages': [
      'Common',
      'Elvish',
      'Celestial'
    ],
    'statBonuses': {
      'DEX': 2,
      'INT': 1
    },
    'traits': [
      {
        'name': 'Astral Fire',
        'description': 'Knows one of Sacred Flame, Dancing Lights, or Light (Int, Wis, or Cha).'
      },
      {
        'name': 'Astral Trance',
        'description': 'Trance in 4 hours; gain proficiency in one skill and with one weapon or tool of choice after trance.'
      },
      {
        'name': 'Starlight Step',
        'description': 'Bonus action to magically teleport up to 30 feet (PB times/Long Rest).'
      }
    ]
  },
  {
    'id': 'gnome_deep',
    'name': 'Gnome (Deep / Svirfneblin)',
    'type': 'Humanoid',
    'subtype': 'Gnome',
    'size': 'Small',
    'speed': 25,
    'senses': [
      {
        'name': 'Superior Darkvision',
        'value': '120 ft.'
      }
    ],
    'languages': [
      'Common',
      'Gnomish',
      'Undercommon'
    ],
    'statBonuses': {
      'INT': 2,
      'DEX': 1
    },
    'traits': [
      {
        'name': 'Gnome Cunning',
        'description': 'Advantage on all Intelligence, Wisdom, and Charisma saving throws against magic.'
      },
      {
        'name': 'Svirfneblin Camouflage',
        'description': 'Advantage on Dexterity (Stealth) checks made to hide in rocky terrain or underground.'
      },
      {
        'name': 'Gift of the Svirfneblin',
        'description': 'Can cast Disguise Self (3rd) and Nondetection (5th) once per Long Rest (Intelligence).'
      }
    ]
  },
  {
    'id': 'gnome_forest',
    'name': 'Gnome (Forest)',
    'type': 'Humanoid',
    'subtype': 'Gnome',
    'size': 'Small',
    'speed': 25,
    'senses': [
      {
        'name': 'Darkvision',
        'value': '60 ft.'
      }
    ],
    'languages': [
      'Common',
      'Gnomish'
    ],
    'statBonuses': {
      'INT': 2,
      'DEX': 1
    },
    'traits': [
      {
        'name': 'Gnome Cunning',
        'description': 'Advantage on all Intelligence, Wisdom, and Charisma saving throws against magic.'
      },
      {
        'name': 'Natural Illusionist',
        'description': 'Knows the Minor Illusion cantrip (Intelligence).'
      },
      {
        'name': 'Speak with Small Beasts',
        'description': 'Through sounds and gestures, can communicate simple ideas with Small or smaller beasts.'
      }
    ]
  },
  {
    'id': 'halfling_lightfoot',
    'name': 'Halfling (Lightfoot)',
    'type': 'Humanoid',
    'subtype': 'Halfling',
    'size': 'Small',
    'speed': 25,
    'languages': [
      'Common',
      'Halfling'
    ],
    'statBonuses': {
      'DEX': 2,
      'CHA': 1
    },
    'traits': [
      {
        'name': 'Lucky',
        'description': 'Reroll 1s on attack rolls, ability checks, and saving throws.'
      },
      {
        'name': 'Brave',
        'description': 'Advantage on saving throws against being Frightened.'
      },
      {
        'name': 'Naturally Stealthy',
        'description': 'Can attempt to hide even when obscured only by a creature that is at least one size larger.'
      }
    ]
  },
  {
    'id': 'halfling_stout',
    'name': 'Halfling (Stout)',
    'type': 'Humanoid',
    'subtype': 'Halfling',
    'size': 'Small',
    'speed': 25,
    'resistances': [
      'poison'
    ],
    'languages': [
      'Common',
      'Halfling'
    ],
    'statBonuses': {
      'DEX': 2,
      'CON': 1
    },
    'traits': [
      {
        'name': 'Lucky',
        'description': 'Reroll 1s on attack rolls, ability checks, and saving throws.'
      },
      {
        'name': 'Brave',
        'description': 'Advantage on saving throws against being Frightened.'
      },
      {
        'name': 'Stout Resilience',
        'description': 'Advantage on saving throws against poison, and resistance against poison damage.'
      }
    ]
  },
  {
    'id': 'custom_lineage',
    'name': 'Custom Lineage',
    'type': 'Humanoid',
    'speed': 30,
    'languages': [
      'Common'
    ],
    'statBonuses': {},
    'traits': [
      {
        'name': 'Feat',
        'description': 'Gain one feat of choice for which you qualify.'
      },
      {
        'name': 'Variable Trait',
        'description': 'Gain Darkvision 60 ft. or proficiency in one skill of choice.'
      }
    ]
  },
  {
    'id': 'autognome',
    'name': 'Autognome',
    'type': 'Construct',
    'subtype': 'Gnome',
    'size': 'Small',
    'speed': 30,
    'languages': [
      'Common'
    ],
    'statBonuses': {},
    'resistances': [
      'poison',
      'paralyzed'
    ],
    'immunities': [
      'disease'
    ],
    'traits': [
      {
        'name': 'Armored Casing',
        'description': 'Base AC equals 13 + Dexterity modifier when not wearing armor.'
      },
      {
        'name': 'Built for Success',
        'description': 'Can add a 1d4 to one attack roll, ability check, or saving throw after rolling (PB times/Long Rest).'
      },
      {
        'name': 'Mechanical Nature',
        'description': 'Does not need to eat, drink, or breathe; immune to disease.'
      }
    ]
  },
  {
    'id': 'giff',
    'name': 'Giff',
    'type': 'Humanoid',
    'speed': 30,
    'languages': [
      'Common'
    ],
    'statBonuses': {},
    'traits': [
      {
        'name': 'Astral Spark',
        'description': 'Deal extra force damage equal to PB on simple or martial weapon hits (PB times/Long Rest).'
      },
      {
        'name': 'Hippo Build',
        'description': 'Advantage on Strength-based ability checks and saving throws; counts as one size larger for carrying capacity.'
      }
    ]
  },
  {
    'id': 'hadozee',
    'name': 'Hadozee',
    'type': 'Humanoid',
    'speed': 30,
    'languages': [
      'Common'
    ],
    'statBonuses': {},
    'traits': [
      {
        'name': 'Glide',
        'description': 'Can glide horizontally 5 feet for every 1 foot fallen, taking zero falling damage.'
      },
      {
        'name': 'Dexterous Feet',
        'description': 'Can use a Bonus Action to manipulate an object, open/close doors, or stow an item using feet.'
      }
    ]
  },
  {
    'id': 'plasmoid',
    'name': 'Plasmoid',
    'type': 'Ooze',
    'speed': 30,
    'languages': [
      'Common'
    ],
    'statBonuses': {},
    'resistances': [
      'acid',
      'poison'
    ],
    'traits': [
      {
        'name': 'Amorphous',
        'description': 'Can squeeze through spaces as narrow as 1 inch wide without squeezing.'
      },
      {
        'name': 'Hold Breath',
        'description': 'Can hold breath for up to 1 hour.'
      },
      {
        'name': 'Shape Self',
        'description': 'Can extend a pseudopod up to 10 feet long as a Bonus Action to manipulate objects.'
      }
    ]
  },
  {
    'id': 'thrikreen',
    'name': 'Thri-kreen',
    'type': 'Monstrosity',
    'speed': 30,
    'senses': [
      {
        'name': 'Darkvision',
        'value': '60 ft.'
      }
    ],
    'languages': [
      'Common',
      'Thri-kreen'
    ],
    'statBonuses': {},
    'traits': [
      {
        'name': 'Chameleon Carapace',
        'description': 'Base AC 13 + Dex; can change color to gain Advantage on Stealth checks.'
      },
      {
        'name': 'Secondary Arms',
        'description': 'Has two smaller secondary arms to manipulate light objects and light weapons.'
      },
      {
        'name': 'Sleepless Revitalization',
        'description': 'Remains fully conscious during a 4-hour rest.'
      }
    ]
  },
  {
    'id': 'kender',
    'name': 'Kender',
    'type': 'Humanoid',
    'size': 'Small',
    'speed': 30,
    'languages': [
      'Common'
    ],
    'statBonuses': {},
    'traits': [
      {
        'name': 'Fearless',
        'description': 'Immune to the Frightened condition.'
      },
      {
        'name': 'Taunt',
        'description': 'Bonus action target within 60 ft must make Wis save (DC 8+PB+Cha) or have Disadvantage on attacks against targets other than you.'
      },
      {
        'name': 'Kender Pockets',
        'description': 'Can pull random simple items from pockets (PB times/Long Rest).'
      }
    ]
  },
  {
    'id': 'loxodon',
    'name': 'Loxodon',
    'type': 'Humanoid',
    'speed': 30,
    'languages': [
      'Common',
      'Loxodon'
    ],
    'statBonuses': {
      'CON': 2,
      'WIS': 1
    },
    'traits': [
      {
        'name': 'Natural Armor',
        'description': 'Base AC equals 12 + Constitution modifier.'
      },
      {
        'name': 'Trunk',
        'description': 'Can use trunk to grasp items, lift up to 5 times Strength score, or make unarmed strikes.'
      },
      {
        'name': 'Keen Smell',
        'description': 'Advantage on Perception, Survival, and Investigation checks that rely on smell.'
      }
    ]
  },
  {
    'id': 'simic_hybrid',
    'name': 'Simic Hybrid',
    'type': 'Humanoid',
    'speed': 30,
    'senses': [
      {
        'name': 'Darkvision',
        'value': '60 ft.'
      }
    ],
    'languages': [
      'Common',
      'Elvish'
    ],
    'statBonuses': {
      'CON': 2
    },
    'traits': [
      {
        'name': 'Animal Enhancement',
        'description': 'Mutations include Manta Glide, Nimble Climber, Underwater Adaptation, Grappling Appendages, Carapace, or Acid Spit.'
      }
    ]
  },
  {
    'id': 'vedalken',
    'name': 'Vedalken',
    'type': 'Humanoid',
    'speed': 30,
    'languages': [
      'Common',
      'Vedalken'
    ],
    'statBonuses': {
      'INT': 2,
      'WIS': 1
    },
    'traits': [
      {
        'name': 'Vedalken Dispassion',
        'description': 'Advantage on all Intelligence, Wisdom, and Charisma saving throws.'
      },
      {
        'name': 'Tireless Precision',
        'description': 'Add 1d4 to checks with chosen skill and tool.'
      },
      {
        'name': 'Partially Amphibious',
        'description': 'Can breathe underwater for up to 1 hour per rest.'
      }
    ]
  },
  {
    'id': 'verdan',
    'name': 'Verdan',
    'type': 'Humanoid',
    'speed': 30,
    'languages': [
      'Common',
      'Goblin'
    ],
    'statBonuses': {
      'CHA': 2,
      'CON': 1
    },
    'traits': [
      {
        'name': 'Black Blood Healing',
        'description': 'Reroll 1s and 2s on hit dice spent during Short Rests.'
      },
      {
        'name': 'Telepathic Insight',
        'description': 'Advantage on all Wisdom and Charisma saving throws.'
      }
    ]
  },
  {
    'id': 'locathah',
    'name': 'Locathah',
    'type': 'Humanoid',
    'speed': 30,
    'languages': [
      'Common',
      'Aquan'
    ],
    'statBonuses': {
      'STR': 2,
      'DEX': 1
    },
    'traits': [
      {
        'name': 'Natural Armor',
        'description': 'Base AC 12 + Dexterity modifier.'
      },
      {
        'name': 'Leviathan Will',
        'description': 'Advantage on saving throws against being Charmed, Frightened, Paralyzed, Poisoned, Stunned, or Sleep.'
      },
      {
        'name': 'Limited Amphibiousness',
        'description': 'Can breathe air and water, but must be submerged in water at least once every 4 hours.'
      }
    ]
  },
  {
    'id': 'grung',
    'name': 'Grung',
    'type': 'Humanoid',
    'size': 'Small',
    'speed': 25,
    'languages': [
      'Grung'
    ],
    'statBonuses': {
      'DEX': 2,
      'CON': 1
    },
    'immunities': [
      'poison'
    ],
    'traits': [
      {
        'name': 'Poisonous Skin',
        'description': 'Any creature that grapples or touches grung with bare skin must succeed on a DC 12 Con save or become Poisoned for 1 minute.'
      },
      {
        'name': 'Standing Leap',
        'description': 'Long jump is up to 25 feet and high jump is up to 15 feet with or without a running start.'
      }
    ]
  },
]
