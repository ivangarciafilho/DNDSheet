// Species catalog, part 2 of 3 (entries kept in catalog order; joined in species-and-heuristics.ts).
import type { SpeciesEntry } from './species-and-heuristics.ts'

export const SPECIES_CATALOG_PART_2: SpeciesEntry[] = [
  {
    'id': 'yuanti_pureblood',
    'name': 'Yuan-ti Pureblood',
    'type': 'Humanoid',
    'subtype': 'Yuan-ti',
    'speed': 30,
    'senses': [
      {
        'name': 'Darkvision',
        'value': '60 ft.'
      }
    ],
    'immunities': [
      'poison',
      'poisoned'
    ],
    'languages': [
      'Common',
      'Abyssal',
      'Draconic'
    ],
    'statBonuses': {
      'CHA': 2,
      'INT': 1
    },
    'traits': [
      {
        'name': 'Magic Resistance',
        'description': 'Advantage on saving throws against spells and other magical effects.'
      },
      {
        'name': 'Poison Immunity',
        'description': 'Immune to poison damage and the poisoned condition.'
      },
      {
        'name': 'Innate Spellcasting',
        'description': 'Can cast Poison Spray at will; Animal Friendship (snakes only) at will; Suggestion 1/Long Rest (Charisma).'
      }
    ]
  },
  {
    'id': 'goblin',
    'name': 'Goblin',
    'type': 'Humanoid',
    'subtype': 'Goblinoid',
    'size': 'Small',
    'speed': 30,
    'senses': [
      {
        'name': 'Darkvision',
        'value': '60 ft.'
      }
    ],
    'languages': [
      'Common',
      'Goblin'
    ],
    'statBonuses': {
      'DEX': 2,
      'CON': 1
    },
    'traits': [
      {
        'name': 'Fury of the Small',
        'description': 'When damaging a creature larger than itself, can deal extra damage equal to level (PB times per Long Rest).'
      },
      {
        'name': 'Nimble Escape',
        'description': 'Can take the Disengage or Hide action as a Bonus Action on each of its turns.'
      }
    ]
  },
  {
    'id': 'hobgoblin',
    'name': 'Hobgoblin',
    'type': 'Humanoid',
    'subtype': 'Goblinoid',
    'speed': 30,
    'senses': [
      {
        'name': 'Darkvision',
        'value': '60 ft.'
      }
    ],
    'languages': [
      'Common',
      'Goblin'
    ],
    'statBonuses': {
      'CON': 2,
      'INT': 1
    },
    'traits': [
      {
        'name': 'Fey Ancestry',
        'description': 'Advantage on saving throws against being Charmed.'
      },
      {
        'name': 'Saving Face',
        'description': 'If missing an attack roll or failing an ability check or save, can gain a bonus to the roll equal to the number of allies seen within 30ft (max +5, 1/Short or Long Rest).'
      }
    ]
  },
  {
    'id': 'bugbear',
    'name': 'Bugbear',
    'type': 'Humanoid',
    'subtype': 'Goblinoid',
    'speed': 30,
    'senses': [
      {
        'name': 'Darkvision',
        'value': '60 ft.'
      }
    ],
    'languages': [
      'Common',
      'Goblin'
    ],
    'statBonuses': {
      'STR': 2,
      'DEX': 1
    },
    'traits': [
      {
        'name': 'Long-Limbed',
        'description': 'When making a melee attack on its turn, reach for that attack is 5 feet greater than normal.'
      },
      {
        'name': 'Powerful Build',
        'description': 'Counts as one size larger when determining carrying capacity and weight it can push, drag, or lift.'
      },
      {
        'name': 'Surprise Attack',
        'description': 'If hitting a creature that has not taken a turn yet in current combat, deals an extra 2d6 damage with the attack.'
      }
    ]
  },
  {
    'id': 'kobold',
    'name': 'Kobold',
    'type': 'Humanoid',
    'subtype': 'Kobold',
    'size': 'Small',
    'speed': 30,
    'senses': [
      {
        'name': 'Darkvision',
        'value': '60 ft.'
      }
    ],
    'languages': [
      'Common',
      'Draconic'
    ],
    'statBonuses': {
      'DEX': 2
    },
    'traits': [
      {
        'name': 'Draconic Cry',
        'description': 'Bonus action: yell to embolden allies within 10ft; allies have Advantage on attack rolls against enemies within 10ft until start of next turn (PB times/Long Rest).'
      },
      {
        'name': 'Kobold Legacy',
        'description': 'Craftiness (skill proficiency), Defiance (advantage against Frightened), or Draconic Sorcery (one sorcerer cantrip).'
      }
    ]
  },
  {
    'id': 'githyanki',
    'name': 'Githyanki',
    'type': 'Humanoid',
    'subtype': 'Gith',
    'speed': 30,
    'languages': [
      'Common',
      'Gith'
    ],
    'statBonuses': {
      'STR': 2,
      'INT': 1
    },
    'traits': [
      {
        'name': 'Astral Knowledge',
        'description': 'After a Long Rest, gains proficiency in one skill and one weapon or tool of choice until next Long Rest.'
      },
      {
        'name': 'Githyanki Psionics',
        'description': 'Knows Mage Hand; can cast Jump (3rd level) and Misty Step (5th level) 1/Long Rest (Intelligence).'
      }
    ]
  },
  {
    'id': 'githzerai',
    'name': 'Githzerai',
    'type': 'Humanoid',
    'subtype': 'Gith',
    'speed': 30,
    'languages': [
      'Common',
      'Gith'
    ],
    'statBonuses': {
      'WIS': 2,
      'INT': 1
    },
    'traits': [
      {
        'name': 'Mental Discipline',
        'description': 'Advantage on saving throws against being Charmed or Frightened.'
      },
      {
        'name': 'Githzerai Psionics',
        'description': 'Knows Mage Hand; can cast Shield (3rd level) and Detect Thoughts (5th level) 1/Long Rest (Wisdom).'
      }
    ]
  },
  {
    'id': 'changeling',
    'name': 'Changeling',
    'type': 'Fey',
    'subtype': 'Shapechanger',
    'speed': 30,
    'languages': [
      'Common'
    ],
    'statBonuses': {
      'CHA': 2,
      'DEX': 1
    },
    'traits': [
      {
        'name': 'Shapechanger',
        'description': 'As an action, can change appearance and voice into any humanoid seen, adjusting height and weight between Small and Medium.'
      },
      {
        'name': 'Changeling Instincts',
        'description': 'Proficiency with two skills chosen from Deception, Insight, Intimidation, Performance, and Persuasion.'
      }
    ]
  },
  {
    'id': 'shifter_beasthide',
    'name': 'Shifter (Beasthide)',
    'type': 'Humanoid',
    'subtype': 'Shifter',
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
      'CON': 2,
      'STR': 1
    },
    'traits': [
      {
        'name': 'Shifting',
        'description': 'Bonus action to shift for 1 minute: gains 1d6 + Con + level temporary HP and +1 bonus to AC (PB times/Long Rest).'
      },
      {
        'name': 'Natural Athlete',
        'description': 'Proficiency in the Athletics skill.'
      }
    ]
  },
  {
    'id': 'shifter_wildhunt',
    'name': 'Shifter (Wildhunt)',
    'type': 'Humanoid',
    'subtype': 'Shifter',
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
      'DEX': 1
    },
    'traits': [
      {
        'name': 'Shifting',
        'description': 'Bonus action to shift for 1 minute: Advantage on all Wisdom checks, and no creature within 30 feet can make an attack roll with advantage against it (PB times/Long Rest).'
      },
      {
        'name': 'Natural Tracker',
        'description': 'Proficiency in the Survival skill.'
      }
    ]
  },
  {
    'id': 'shifter_longtooth',
    'name': 'Shifter (Longtooth)',
    'type': 'Humanoid',
    'subtype': 'Shifter',
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
      'STR': 2,
      'DEX': 1
    },
    'traits': [
      {
        'name': 'Shifting',
        'description': 'Bonus action to shift for 1 minute: When shifting and as a bonus action on subsequent turns, can make a fanged bite attack dealing 1d6 + Strength modifier piercing damage (PB times/Long Rest).'
      },
      {
        'name': 'Fierce',
        'description': 'Proficiency in the Intimidation skill.'
      }
    ]
  },
  {
    'id': 'shifter_swiftstride',
    'name': 'Shifter (Swiftstride)',
    'type': 'Humanoid',
    'subtype': 'Shifter',
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
        'name': 'Shifting',
        'description': 'Bonus action to shift for 1 minute: Walking speed increases by 10 feet. When an enemy ends its turn within 5 feet, can use a reaction to move up to 10 feet without provoking opportunity attacks (PB times/Long Rest).'
      },
      {
        'name': 'Graceful',
        'description': 'Proficiency in the Acrobatics skill.'
      }
    ]
  },
  {
    'id': 'warforged',
    'name': 'Warforged',
    'type': 'Construct',
    'subtype': 'Warforged',
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
        'name': 'Constructed Resilience',
        'description': 'Advantage on saves against Poisoned; resistance to poison damage; immune to disease; does not need to eat, drink, or breathe; magic cannot put it to sleep.'
      },
      {
        'name': "Sentry's Rest",
        'description': 'Needs 6 hours of inactive, motionless state instead of sleeping, remaining fully conscious.'
      },
      {
        'name': 'Integrated Protection',
        'description': 'Gains a +1 bonus to Armor Class.'
      }
    ]
  },
  {
    'id': 'kalashtar',
    'name': 'Kalashtar',
    'type': 'Humanoid',
    'subtype': 'Kalashtar',
    'speed': 30,
    'resistances': [
      'psychic'
    ],
    'languages': [
      'Common',
      'Quori'
    ],
    'statBonuses': {
      'WIS': 2,
      'CHA': 1
    },
    'traits': [
      {
        'name': 'Dual Mind',
        'description': 'Advantage on all Wisdom saving throws.'
      },
      {
        'name': 'Mental Discipline',
        'description': 'Resistance to psychic damage.'
      },
      {
        'name': 'Mind Link',
        'description': 'Can speak telepathically to any creature within 10 feet per level (target must understand at least one language).'
      },
      {
        'name': 'Severed from Dreams',
        'description': 'Immune to spells and other magical effects that require dreaming.'
      }
    ]
  },
  {
    'id': 'firbolg',
    'name': 'Firbolg',
    'type': 'Humanoid',
    'subtype': 'Giant',
    'speed': 30,
    'languages': [
      'Common',
      'Elvish',
      'Giant'
    ],
    'statBonuses': {
      'WIS': 2,
      'STR': 1
    },
    'traits': [
      {
        'name': 'Firbolg Magic',
        'description': 'Can cast Detect Magic and Disguise Self (Wisdom, 1/Short or Long Rest).'
      },
      {
        'name': 'Hidden Step',
        'description': 'Bonus action to magically turn invisible until start of next turn or until attacking or casting a spell (PB times/Long Rest).'
      },
      {
        'name': 'Powerful Build',
        'description': 'Counts as one size larger for carrying capacity and pushing, dragging, or lifting.'
      },
      {
        'name': 'Speech of Beast and Leaf',
        'description': 'Advantage on Charisma checks to influence beasts and leaf plants; they understand speech though cannot reply.'
      }
    ]
  },
  {
    'id': 'triton',
    'name': 'Triton',
    'type': 'Humanoid',
    'subtype': 'Triton',
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
      'Primordial'
    ],
    'statBonuses': {
      'STR': 1,
      'CON': 1,
      'CHA': 1
    },
    'traits': [
      {
        'name': 'Amphibious',
        'description': 'Can breathe air and water.'
      },
      {
        'name': 'Control Air and Water',
        'description': 'Can cast Fog Cloud (1st), Gust of Wind (3rd), and Wall of Water (5th) once per Long Rest (Charisma).'
      },
      {
        'name': 'Emissary of the Sea',
        'description': 'Can communicate simple ideas to beasts that have a swimming speed.'
      },
      {
        'name': 'Guardians of the Depths',
        'description': 'Adapted to the freezing depths: resistance to cold damage and ignores pressure effects.'
      }
    ]
  },
  {
    'id': 'tortle',
    'name': 'Tortle',
    'type': 'Humanoid',
    'subtype': 'Tortle',
    'speed': 30,
    'languages': [
      'Common',
      'Aquan'
    ],
    'statBonuses': {
      'STR': 2,
      'WIS': 1
    },
    'traits': [
      {
        'name': 'Claws',
        'description': 'Unarmed strike deals 1d6 + Str modifier slashing damage.'
      },
      {
        'name': 'Hold Breath',
        'description': 'Can hold breath for up to 1 hour at a time.'
      },
      {
        'name': 'Natural Armor',
        'description': 'Base AC is 17 regardless of Dexterity modifier; cannot wear armor, but shields apply normally.'
      },
      {
        'name': 'Shell Defense',
        'description': 'Action to withdraw into shell: +4 bonus to AC, advantage on Strength and Constitution saving throws, speed becomes 0, disadvantage on Dexterity saves.'
      }
    ]
  },
  {
    'id': 'harengon',
    'name': 'Harengon',
    'type': 'Humanoid',
    'subtype': 'Harengon',
    'speed': 30,
    'languages': [
      'Common'
    ],
    'statBonuses': {
      'DEX': 2,
      'WIS': 1
    },
    'traits': [
      {
        'name': 'Hare-Trigger',
        'description': 'Adds proficiency bonus to initiative rolls.'
      },
      {
        'name': 'Leporine Senses',
        'description': 'Proficiency in the Perception skill.'
      },
      {
        'name': 'Lucky Footwork',
        'description': 'Reaction when failing a Dexterity saving throw: add 1d4 to the roll, potentially turning failure into success.'
      },
      {
        'name': 'Rabbit Hop',
        'description': 'Bonus action to jump up to 5 times PB in feet without provoking opportunity attacks (PB times/Long Rest).'
      }
    ]
  },
  {
    'id': 'fairy',
    'name': 'Fairy',
    'type': 'Fey',
    'subtype': 'Fairy',
    'size': 'Small',
    'speed': 30,
    'languages': [
      'Common',
      'Sylvan'
    ],
    'statBonuses': {
      'DEX': 2,
      'CHA': 1
    },
    'traits': [
      {
        'name': 'Flight',
        'description': 'Flying speed of 30 feet. Cannot fly while wearing medium or heavy armor.'
      },
      {
        'name': 'Fairy Magic',
        'description': 'Knows Druidcraft; can cast Faerie Fire (3rd level) and Enlarge/Reduce (5th level) once per Long Rest (Intelligence, Wisdom, or Charisma).'
      }
    ]
  },
  {
    'id': 'owlin',
    'name': 'Owlin',
    'type': 'Humanoid',
    'subtype': 'Owlin',
    'speed': 30,
    'senses': [
      {
        'name': 'Superior Darkvision',
        'value': '120 ft.'
      }
    ],
    'languages': [
      'Common'
    ],
    'statBonuses': {
      'DEX': 2,
      'INT': 1
    },
    'traits': [
      {
        'name': 'Flight',
        'description': 'Flying speed of 30 feet. Cannot fly while wearing medium or heavy armor.'
      },
      {
        'name': 'Silent Feathers',
        'description': 'Proficiency in the Stealth skill.'
      }
    ]
  },
  {
    'id': 'satyr',
    'name': 'Satyr',
    'type': 'Fey',
    'subtype': 'Satyr',
    'speed': 35,
    'languages': [
      'Common',
      'Sylvan'
    ],
    'statBonuses': {
      'CHA': 2,
      'DEX': 1
    },
    'traits': [
      {
        'name': 'Ram',
        'description': 'Headbutt deals 1d6 + Str modifier bludgeoning damage.'
      },
      {
        'name': 'Magic Resistance',
        'description': 'Advantage on saving throws against spells and other magical effects.'
      },
      {
        'name': 'Mirthful Leaps',
        'description': 'Whenever making a long or high jump, can roll 1d8 and add the number rolled to the jump distance.'
      },
      {
        'name': 'Reveler',
        'description': 'Proficiency in the Performance and Persuasion skills and with one musical instrument.'
      }
    ]
  },
  {
    'id': 'centaur',
    'name': 'Centaur',
    'type': 'Fey',
    'subtype': 'Centaur',
    'speed': 40,
    'languages': [
      'Common',
      'Sylvan'
    ],
    'statBonuses': {
      'STR': 2,
      'WIS': 1
    },
    'traits': [
      {
        'name': 'Charge',
        'description': 'If moving at least 30 feet straight toward a target and hitting with a melee weapon attack on the same turn, can make one hooves attack as a Bonus Action.'
      },
      {
        'name': 'Hooves',
        'description': 'Hooves deal 1d6 + Str modifier bludgeoning damage.'
      },
      {
        'name': 'Equine Build',
        'description': 'Counts as one size larger for carrying capacity; climbing requires 4 feet of movement per foot instead of 1.'
      }
    ]
  },
  {
    'id': 'minotaur',
    'name': 'Minotaur',
    'type': 'Humanoid',
    'subtype': 'Minotaur',
    'speed': 30,
    'languages': [
      'Common',
      'Minotaur'
    ],
    'statBonuses': {
      'STR': 2,
      'CON': 1
    },
    'traits': [
      {
        'name': 'Horns',
        'description': 'Horns deal 1d6 + Str modifier piercing damage.'
      },
      {
        'name': 'Goring Rush',
        'description': 'Immediately after using the Dash action on its turn, can make one melee attack with horns as a Bonus Action.'
      },
      {
        'name': 'Hammering Horns',
        'description': 'Immediately after hitting a creature with a melee attack on its turn, can use a Bonus Action to attempt to push the target up to 10 feet away (Str save DC 8+PB+Str).'
      }
    ]
  },
  {
    'id': 'leonin',
    'name': 'Leonin',
    'type': 'Humanoid',
    'subtype': 'Leonin',
    'speed': 35,
    'senses': [
      {
        'name': 'Darkvision',
        'value': '60 ft.'
      }
    ],
    'languages': [
      'Common',
      'Leonin'
    ],
    'statBonuses': {
      'CON': 2,
      'STR': 1
    },
    'traits': [
      {
        'name': 'Claws',
        'description': 'Claws deal 1d4 + Str modifier slashing damage.'
      },
      {
        'name': "Hunter's Instincts",
        'description': 'Proficiency in Athletics, Intimidation, Perception, or Survival.'
      },
      {
        'name': 'Daunting Roar',
        'description': 'Bonus action roar: creatures of choice within 10 feet must succeed on a Con save (DC 8+PB+Con) or become frightened until end of its next turn (1/Short or Long Rest).'
      }
    ]
  },
  {
    'id': 'dhampir',
    'name': 'Dhampir',
    'type': 'Humanoid',
    'subtype': 'Dhampir',
    'speed': 35,
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
      'CON': 2,
      'DEX': 1
    },
    'traits': [
      {
        'name': 'Spider Climb',
        'description': 'Climbing speed equal to walking speed, and can move up, down, and across vertical surfaces and ceilings while leaving hands free.'
      },
      {
        'name': 'Vampiric Bite',
        'description': 'Constitution-based fanged bite deals 1d4 piercing damage. While bloodied (half HP), attack has Advantage; on hit can regain HP or add bonus to next ability check or attack roll (PB times/Long Rest).'
      },
      {
        'name': 'Deathless Nature',
        'description': 'Does not need to breathe.'
      }
    ]
  },
]
