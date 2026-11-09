import type { DndStat } from './types.ts'

export interface PointBuyResult {
  spent: number
  remaining: number
  total: number
  isValid: boolean
  outOfRangeStats: string[]
}

export const POINT_BUY_BUDGET = 27

export const POINT_BUY_COST_TABLE: Record<number, number> = {
  8: 0,
  9: 1,
  10: 2,
  11: 3,
  12: 4,
  13: 5,
  14: 7,
  15: 9,
}

export function calculatePointBuySpent(stats: Record<string, number>): PointBuyResult {
  const statKeys = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA']
  let spent = 0
  const outOfRangeStats: string[] = []

  for (const k of statKeys) {
    const val = Number(stats[k]) || 10
    if (val < 8 || val > 15) {
      outOfRangeStats.push(k)
      // Approximate costs for stats outside 8-15
      if (val < 8) spent += 0
      else spent += 9 + (val - 15) * 2
    } else {
      spent += POINT_BUY_COST_TABLE[val] ?? 0
    }
  }

  const remaining = POINT_BUY_BUDGET - spent
  return {
    spent,
    remaining,
    total: POINT_BUY_BUDGET,
    isValid: remaining >= 0 && outOfRangeStats.length === 0,
    outOfRangeStats,
  }
}

export const STANDARD_ARRAY: Record<DndStat, number> = {
  STR: 15,
  DEX: 14,
  CON: 13,
  INT: 12,
  WIS: 10,
  CHA: 8,
}

export interface MonsterRoleArchetype {
  id: string
  label: string
  icon: string
  color: string
  stats: Record<DndStat, number>
  description: string
}

export const MONSTER_ROLE_ARCHETYPES: Record<string, MonsterRoleArchetype> = {
  brute: {
    id: 'brute',
    label: 'Brute',
    icon: 'fitness_center',
    color: 'deep-orange',
    stats: { STR: 18, DEX: 10, CON: 16, INT: 8, WIS: 10, CHA: 8 },
    description: 'High STR and CON; melee powerhouse with high hit points and devastating physical attacks.',
  },
  skirmisher: {
    id: 'skirmisher',
    label: 'Skirmisher',
    icon: 'directions_run',
    color: 'teal',
    stats: { STR: 10, DEX: 18, CON: 14, INT: 12, WIS: 14, CHA: 10 },
    description: 'High DEX and mobility; excels at hit-and-run tactics, stealth, and elusive traversal.',
  },
  artillery: {
    id: 'artillery',
    label: 'Artillery',
    icon: 'gps_fixed',
    color: 'amber-9',
    stats: { STR: 8, DEX: 16, CON: 12, INT: 16, WIS: 12, CHA: 10 },
    description: 'High DEX and ranged attack/spell stat; deals heavy damage from safe distance.',
  },
  controller: {
    id: 'controller',
    label: 'Controller',
    icon: 'psychology',
    color: 'purple',
    stats: { STR: 8, DEX: 12, CON: 14, INT: 18, WIS: 16, CHA: 12 },
    description: 'High casting stat; alters the battlefield, inflicts conditions, and disables enemies.',
  },
  leader: {
    id: 'leader',
    label: 'Leader',
    icon: 'military_tech',
    color: 'indigo',
    stats: { STR: 14, DEX: 10, CON: 14, INT: 12, WIS: 14, CHA: 18 },
    description: 'High CHA and defenses; enhances allies, grants tactical commands, and coordinates troops.',
  },
  soldier: {
    id: 'soldier',
    label: 'Soldier',
    icon: 'shield',
    color: 'blue-grey',
    stats: { STR: 16, DEX: 12, CON: 16, INT: 10, WIS: 12, CHA: 10 },
    description: 'Disciplined and well-armored; works in formations with balanced physical defenses.',
  },
}

export interface SpeciesEntry {
  id: string
  name: string
  type: string
  subtype?: string
  size?: 'Tiny' | 'Small' | 'Medium' | 'Large' | 'Huge' | 'Gargantuan'
  speed?: number
  senses?: Array<{ name: string; value: string }>
  resistances?: string[]
  immunities?: string[]
  languages?: string[]
  statBonuses: Partial<Record<DndStat, number>>
  traits: Array<{ name: string; description: string }>
}

export const SPECIES_CATALOG: SpeciesEntry[] = [
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
    "id": "aasimar_protector",
    "name": "Aasimar (Protector)",
    "type": "Celestial",
    "subtype": "Aasimar",
    "speed": 30,
    "senses": [
      {
        "name": "Darkvision",
        "value": "60 ft."
      }
    ],
    "resistances": [
      "radiant",
      "necrotic"
    ],
    "languages": [
      "Common",
      "Celestial"
    ],
    "statBonuses": {
      "CHA": 2,
      "WIS": 1
    },
    "traits": [
      {
        "name": "Celestial Resistance",
        "description": "Resistance to necrotic damage and radiant damage."
      },
      {
        "name": "Healing Hands",
        "description": "As an action, touch a creature and restore HP equal to level (1/Long Rest)."
      },
      {
        "name": "Light Bearer",
        "description": "Knows the Light cantrip (Charisma)."
      },
      {
        "name": "Radiant Soul",
        "description": "Bonus action to sprout wings for 1 minute: 30ft fly speed and deal extra radiant damage equal to level once per turn."
      }
    ]
  },
  {
    "id": "aasimar_scourge",
    "name": "Aasimar (Scourge)",
    "type": "Celestial",
    "subtype": "Aasimar",
    "speed": 30,
    "senses": [
      {
        "name": "Darkvision",
        "value": "60 ft."
      }
    ],
    "resistances": [
      "radiant",
      "necrotic"
    ],
    "languages": [
      "Common",
      "Celestial"
    ],
    "statBonuses": {
      "CHA": 2,
      "CON": 1
    },
    "traits": [
      {
        "name": "Celestial Resistance",
        "description": "Resistance to necrotic damage and radiant damage."
      },
      {
        "name": "Healing Hands",
        "description": "As an action, touch a creature and restore HP equal to level (1/Long Rest)."
      },
      {
        "name": "Radiant Consumption",
        "description": "Bonus action to unleash searing light: 10ft aura dealing radiant damage equal to half level, and extra radiant damage to one target."
      }
    ]
  },
  {
    "id": "aasimar_fallen",
    "name": "Aasimar (Fallen)",
    "type": "Celestial",
    "subtype": "Aasimar",
    "speed": 30,
    "senses": [
      {
        "name": "Darkvision",
        "value": "60 ft."
      }
    ],
    "resistances": [
      "radiant",
      "necrotic"
    ],
    "languages": [
      "Common",
      "Celestial"
    ],
    "statBonuses": {
      "CHA": 2,
      "STR": 1
    },
    "traits": [
      {
        "name": "Celestial Resistance",
        "description": "Resistance to necrotic damage and radiant damage."
      },
      {
        "name": "Healing Hands",
        "description": "As an action, touch a creature and restore HP equal to level (1/Long Rest)."
      },
      {
        "name": "Necrotic Shroud",
        "description": "Bonus action: creatures within 10ft must succeed on Charisma save (DC 8+PB+Cha) or be frightened; extra necrotic damage once per turn."
      }
    ]
  },
  {
    "id": "genasi_air",
    "name": "Genasi (Air)",
    "type": "Humanoid",
    "subtype": "Genasi",
    "speed": 30,
    "languages": [
      "Common",
      "Primordial"
    ],
    "statBonuses": {
      "CON": 2,
      "DEX": 1
    },
    "traits": [
      {
        "name": "Unending Breath",
        "description": "Can hold its breath indefinitely while not incapacitated."
      },
      {
        "name": "Mingle with the Wind",
        "description": "Can cast Levitate once per Long Rest requiring no material components (Constitution)."
      }
    ]
  },
  {
    "id": "genasi_earth",
    "name": "Genasi (Earth)",
    "type": "Humanoid",
    "subtype": "Genasi",
    "speed": 30,
    "languages": [
      "Common",
      "Primordial"
    ],
    "statBonuses": {
      "CON": 2,
      "STR": 1
    },
    "traits": [
      {
        "name": "Earth Walk",
        "description": "Can move across difficult terrain made of earth or stone without expending extra movement."
      },
      {
        "name": "Merge with Stone",
        "description": "Can cast Pass without Trace once per Long Rest requiring no material components (Constitution)."
      }
    ]
  },
  {
    "id": "genasi_fire",
    "name": "Genasi (Fire)",
    "type": "Humanoid",
    "subtype": "Genasi",
    "speed": 30,
    "senses": [
      {
        "name": "Darkvision",
        "value": "60 ft."
      }
    ],
    "resistances": [
      "fire"
    ],
    "languages": [
      "Common",
      "Primordial"
    ],
    "statBonuses": {
      "CON": 2,
      "INT": 1
    },
    "traits": [
      {
        "name": "Fire Resistance",
        "description": "Resistance to fire damage."
      },
      {
        "name": "Reach to the Blaze",
        "description": "Knows Produce Flame cantrip; can cast Burning Hands once per Long Rest (Constitution)."
      }
    ]
  },
  {
    "id": "genasi_water",
    "name": "Genasi (Water)",
    "type": "Humanoid",
    "subtype": "Genasi",
    "speed": 30,
    "resistances": [
      "acid"
    ],
    "languages": [
      "Common",
      "Primordial"
    ],
    "statBonuses": {
      "CON": 2,
      "WIS": 1
    },
    "traits": [
      {
        "name": "Acid Resistance",
        "description": "Resistance to acid damage."
      },
      {
        "name": "Amphibious",
        "description": "Can breathe air and water."
      },
      {
        "name": "Swim",
        "description": "Has a swimming speed of 30 feet."
      },
      {
        "name": "Call to the Wave",
        "description": "Knows Shape Water cantrip; can cast Create or Destroy Water once per Long Rest (Constitution)."
      }
    ]
  },
  {
    "id": "goliath",
    "name": "Goliath",
    "type": "Humanoid",
    "subtype": "Goliath",
    "speed": 30,
    "resistances": [
      "cold"
    ],
    "languages": [
      "Common",
      "Giant"
    ],
    "statBonuses": {
      "STR": 2,
      "CON": 1
    },
    "traits": [
      {
        "name": "Stone's Endurance",
        "description": "When taking damage, reaction to roll 1d12 + Con modifier and reduce the damage taken by that total (1/Short or Long Rest)."
      },
      {
        "name": "Powerful Build",
        "description": "Counts as one size larger when determining carrying capacity and the weight it can push, drag, or lift."
      },
      {
        "name": "Mountain Born",
        "description": "Acclimated to high altitude and naturally adapted to cold climates."
      }
    ]
  },
  {
    "id": "tabaxi",
    "name": "Tabaxi",
    "type": "Humanoid",
    "subtype": "Tabaxi",
    "speed": 30,
    "senses": [
      {
        "name": "Darkvision",
        "value": "60 ft."
      }
    ],
    "languages": [
      "Common"
    ],
    "statBonuses": {
      "DEX": 2,
      "CHA": 1
    },
    "traits": [
      {
        "name": "Feline Agility",
        "description": "When moving on its turn in combat, can double its speed until the end of the turn. Once used, cannot use again until moving 0 feet on one of its turns."
      },
      {
        "name": "Cat's Claws",
        "description": "Climbing speed of 20 feet and unarmed strikes deal 1d4 + Str modifier slashing damage."
      },
      {
        "name": "Cat's Talent",
        "description": "Proficiency in the Perception and Stealth skills."
      }
    ]
  },
  {
    "id": "kenku",
    "name": "Kenku",
    "type": "Humanoid",
    "subtype": "Kenku",
    "speed": 30,
    "languages": [
      "Common",
      "Auran"
    ],
    "statBonuses": {
      "DEX": 2,
      "WIS": 1
    },
    "traits": [
      {
        "name": "Expert Forgery",
        "description": "Can duplicate other creatures handwriting and craftwork. Advantage on all checks made to produce forgeries."
      },
      {
        "name": "Kenku Recall",
        "description": "Proficiency in two skills of choice; can give itself Advantage on an ability check using any skill PB times per Long Rest."
      },
      {
        "name": "Mimicry",
        "description": "Can mimic sounds it has heard, including voices. Deception vs Insight check to determine if authentic."
      }
    ]
  },
  {
    "id": "lizardfolk",
    "name": "Lizardfolk",
    "type": "Humanoid",
    "subtype": "Lizardfolk",
    "speed": 30,
    "languages": [
      "Common",
      "Draconic"
    ],
    "statBonuses": {
      "CON": 2,
      "WIS": 1
    },
    "traits": [
      {
        "name": "Bite",
        "description": "Fanged maw deals 1d6 + Str modifier piercing damage."
      },
      {
        "name": "Hungry Jaws",
        "description": "Bonus action bite attack; on hit, gains temporary HP equal to Constitution modifier (1/Short or Long Rest)."
      },
      {
        "name": "Hold Breath",
        "description": "Can hold breath for up to 15 minutes at a time."
      },
      {
        "name": "Natural Armor",
        "description": "Base AC is 13 + Dexterity modifier when not wearing armor."
      }
    ]
  },
  {
    "id": "yuanti_pureblood",
    "name": "Yuan-ti Pureblood",
    "type": "Humanoid",
    "subtype": "Yuan-ti",
    "speed": 30,
    "senses": [
      {
        "name": "Darkvision",
        "value": "60 ft."
      }
    ],
    "immunities": [
      "poison",
      "poisoned"
    ],
    "languages": [
      "Common",
      "Abyssal",
      "Draconic"
    ],
    "statBonuses": {
      "CHA": 2,
      "INT": 1
    },
    "traits": [
      {
        "name": "Magic Resistance",
        "description": "Advantage on saving throws against spells and other magical effects."
      },
      {
        "name": "Poison Immunity",
        "description": "Immune to poison damage and the poisoned condition."
      },
      {
        "name": "Innate Spellcasting",
        "description": "Can cast Poison Spray at will; Animal Friendship (snakes only) at will; Suggestion 1/Long Rest (Charisma)."
      }
    ]
  },
  {
    "id": "goblin",
    "name": "Goblin",
    "type": "Humanoid",
    "subtype": "Goblinoid",
    "size": "Small",
    "speed": 30,
    "senses": [
      {
        "name": "Darkvision",
        "value": "60 ft."
      }
    ],
    "languages": [
      "Common",
      "Goblin"
    ],
    "statBonuses": {
      "DEX": 2,
      "CON": 1
    },
    "traits": [
      {
        "name": "Fury of the Small",
        "description": "When damaging a creature larger than itself, can deal extra damage equal to level (PB times per Long Rest)."
      },
      {
        "name": "Nimble Escape",
        "description": "Can take the Disengage or Hide action as a Bonus Action on each of its turns."
      }
    ]
  },
  {
    "id": "hobgoblin",
    "name": "Hobgoblin",
    "type": "Humanoid",
    "subtype": "Goblinoid",
    "speed": 30,
    "senses": [
      {
        "name": "Darkvision",
        "value": "60 ft."
      }
    ],
    "languages": [
      "Common",
      "Goblin"
    ],
    "statBonuses": {
      "CON": 2,
      "INT": 1
    },
    "traits": [
      {
        "name": "Fey Ancestry",
        "description": "Advantage on saving throws against being Charmed."
      },
      {
        "name": "Saving Face",
        "description": "If missing an attack roll or failing an ability check or save, can gain a bonus to the roll equal to the number of allies seen within 30ft (max +5, 1/Short or Long Rest)."
      }
    ]
  },
  {
    "id": "bugbear",
    "name": "Bugbear",
    "type": "Humanoid",
    "subtype": "Goblinoid",
    "speed": 30,
    "senses": [
      {
        "name": "Darkvision",
        "value": "60 ft."
      }
    ],
    "languages": [
      "Common",
      "Goblin"
    ],
    "statBonuses": {
      "STR": 2,
      "DEX": 1
    },
    "traits": [
      {
        "name": "Long-Limbed",
        "description": "When making a melee attack on its turn, reach for that attack is 5 feet greater than normal."
      },
      {
        "name": "Powerful Build",
        "description": "Counts as one size larger when determining carrying capacity and weight it can push, drag, or lift."
      },
      {
        "name": "Surprise Attack",
        "description": "If hitting a creature that has not taken a turn yet in current combat, deals an extra 2d6 damage with the attack."
      }
    ]
  },
  {
    "id": "kobold",
    "name": "Kobold",
    "type": "Humanoid",
    "subtype": "Kobold",
    "size": "Small",
    "speed": 30,
    "senses": [
      {
        "name": "Darkvision",
        "value": "60 ft."
      }
    ],
    "languages": [
      "Common",
      "Draconic"
    ],
    "statBonuses": {
      "DEX": 2
    },
    "traits": [
      {
        "name": "Draconic Cry",
        "description": "Bonus action: yell to embolden allies within 10ft; allies have Advantage on attack rolls against enemies within 10ft until start of next turn (PB times/Long Rest)."
      },
      {
        "name": "Kobold Legacy",
        "description": "Craftiness (skill proficiency), Defiance (advantage against Frightened), or Draconic Sorcery (one sorcerer cantrip)."
      }
    ]
  },
  {
    "id": "githyanki",
    "name": "Githyanki",
    "type": "Humanoid",
    "subtype": "Gith",
    "speed": 30,
    "languages": [
      "Common",
      "Gith"
    ],
    "statBonuses": {
      "STR": 2,
      "INT": 1
    },
    "traits": [
      {
        "name": "Astral Knowledge",
        "description": "After a Long Rest, gains proficiency in one skill and one weapon or tool of choice until next Long Rest."
      },
      {
        "name": "Githyanki Psionics",
        "description": "Knows Mage Hand; can cast Jump (3rd level) and Misty Step (5th level) 1/Long Rest (Intelligence)."
      }
    ]
  },
  {
    "id": "githzerai",
    "name": "Githzerai",
    "type": "Humanoid",
    "subtype": "Gith",
    "speed": 30,
    "languages": [
      "Common",
      "Gith"
    ],
    "statBonuses": {
      "WIS": 2,
      "INT": 1
    },
    "traits": [
      {
        "name": "Mental Discipline",
        "description": "Advantage on saving throws against being Charmed or Frightened."
      },
      {
        "name": "Githzerai Psionics",
        "description": "Knows Mage Hand; can cast Shield (3rd level) and Detect Thoughts (5th level) 1/Long Rest (Wisdom)."
      }
    ]
  },
  {
    "id": "changeling",
    "name": "Changeling",
    "type": "Fey",
    "subtype": "Shapechanger",
    "speed": 30,
    "languages": [
      "Common"
    ],
    "statBonuses": {
      "CHA": 2,
      "DEX": 1
    },
    "traits": [
      {
        "name": "Shapechanger",
        "description": "As an action, can change appearance and voice into any humanoid seen, adjusting height and weight between Small and Medium."
      },
      {
        "name": "Changeling Instincts",
        "description": "Proficiency with two skills chosen from Deception, Insight, Intimidation, Performance, and Persuasion."
      }
    ]
  },
  {
    "id": "shifter_beasthide",
    "name": "Shifter (Beasthide)",
    "type": "Humanoid",
    "subtype": "Shifter",
    "speed": 30,
    "senses": [
      {
        "name": "Darkvision",
        "value": "60 ft."
      }
    ],
    "languages": [
      "Common"
    ],
    "statBonuses": {
      "CON": 2,
      "STR": 1
    },
    "traits": [
      {
        "name": "Shifting",
        "description": "Bonus action to shift for 1 minute: gains 1d6 + Con + level temporary HP and +1 bonus to AC (PB times/Long Rest)."
      },
      {
        "name": "Natural Athlete",
        "description": "Proficiency in the Athletics skill."
      }
    ]
  },
  {
    "id": "shifter_wildhunt",
    "name": "Shifter (Wildhunt)",
    "type": "Humanoid",
    "subtype": "Shifter",
    "speed": 30,
    "senses": [
      {
        "name": "Darkvision",
        "value": "60 ft."
      }
    ],
    "languages": [
      "Common"
    ],
    "statBonuses": {
      "WIS": 2,
      "DEX": 1
    },
    "traits": [
      {
        "name": "Shifting",
        "description": "Bonus action to shift for 1 minute: Advantage on all Wisdom checks, and no creature within 30 feet can make an attack roll with advantage against it (PB times/Long Rest)."
      },
      {
        "name": "Natural Tracker",
        "description": "Proficiency in the Survival skill."
      }
    ]
  },
  {
    "id": "shifter_longtooth",
    "name": "Shifter (Longtooth)",
    "type": "Humanoid",
    "subtype": "Shifter",
    "speed": 30,
    "senses": [
      {
        "name": "Darkvision",
        "value": "60 ft."
      }
    ],
    "languages": [
      "Common"
    ],
    "statBonuses": {
      "STR": 2,
      "DEX": 1
    },
    "traits": [
      {
        "name": "Shifting",
        "description": "Bonus action to shift for 1 minute: When shifting and as a bonus action on subsequent turns, can make a fanged bite attack dealing 1d6 + Strength modifier piercing damage (PB times/Long Rest)."
      },
      {
        "name": "Fierce",
        "description": "Proficiency in the Intimidation skill."
      }
    ]
  },
  {
    "id": "shifter_swiftstride",
    "name": "Shifter (Swiftstride)",
    "type": "Humanoid",
    "subtype": "Shifter",
    "speed": 30,
    "senses": [
      {
        "name": "Darkvision",
        "value": "60 ft."
      }
    ],
    "languages": [
      "Common"
    ],
    "statBonuses": {
      "DEX": 2,
      "CHA": 1
    },
    "traits": [
      {
        "name": "Shifting",
        "description": "Bonus action to shift for 1 minute: Walking speed increases by 10 feet. When an enemy ends its turn within 5 feet, can use a reaction to move up to 10 feet without provoking opportunity attacks (PB times/Long Rest)."
      },
      {
        "name": "Graceful",
        "description": "Proficiency in the Acrobatics skill."
      }
    ]
  },
  {
    "id": "warforged",
    "name": "Warforged",
    "type": "Construct",
    "subtype": "Warforged",
    "speed": 30,
    "resistances": [
      "poison"
    ],
    "immunities": [
      "disease"
    ],
    "languages": [
      "Common"
    ],
    "statBonuses": {
      "CON": 2,
      "STR": 1
    },
    "traits": [
      {
        "name": "Constructed Resilience",
        "description": "Advantage on saves against Poisoned; resistance to poison damage; immune to disease; does not need to eat, drink, or breathe; magic cannot put it to sleep."
      },
      {
        "name": "Sentry's Rest",
        "description": "Needs 6 hours of inactive, motionless state instead of sleeping, remaining fully conscious."
      },
      {
        "name": "Integrated Protection",
        "description": "Gains a +1 bonus to Armor Class."
      }
    ]
  },
  {
    "id": "kalashtar",
    "name": "Kalashtar",
    "type": "Humanoid",
    "subtype": "Kalashtar",
    "speed": 30,
    "resistances": [
      "psychic"
    ],
    "languages": [
      "Common",
      "Quori"
    ],
    "statBonuses": {
      "WIS": 2,
      "CHA": 1
    },
    "traits": [
      {
        "name": "Dual Mind",
        "description": "Advantage on all Wisdom saving throws."
      },
      {
        "name": "Mental Discipline",
        "description": "Resistance to psychic damage."
      },
      {
        "name": "Mind Link",
        "description": "Can speak telepathically to any creature within 10 feet per level (target must understand at least one language)."
      },
      {
        "name": "Severed from Dreams",
        "description": "Immune to spells and other magical effects that require dreaming."
      }
    ]
  },
  {
    "id": "firbolg",
    "name": "Firbolg",
    "type": "Humanoid",
    "subtype": "Giant",
    "speed": 30,
    "languages": [
      "Common",
      "Elvish",
      "Giant"
    ],
    "statBonuses": {
      "WIS": 2,
      "STR": 1
    },
    "traits": [
      {
        "name": "Firbolg Magic",
        "description": "Can cast Detect Magic and Disguise Self (Wisdom, 1/Short or Long Rest)."
      },
      {
        "name": "Hidden Step",
        "description": "Bonus action to magically turn invisible until start of next turn or until attacking or casting a spell (PB times/Long Rest)."
      },
      {
        "name": "Powerful Build",
        "description": "Counts as one size larger for carrying capacity and pushing, dragging, or lifting."
      },
      {
        "name": "Speech of Beast and Leaf",
        "description": "Advantage on Charisma checks to influence beasts and leaf plants; they understand speech though cannot reply."
      }
    ]
  },
  {
    "id": "triton",
    "name": "Triton",
    "type": "Humanoid",
    "subtype": "Triton",
    "speed": 30,
    "senses": [
      {
        "name": "Darkvision",
        "value": "60 ft."
      }
    ],
    "resistances": [
      "cold"
    ],
    "languages": [
      "Common",
      "Primordial"
    ],
    "statBonuses": {
      "STR": 1,
      "CON": 1,
      "CHA": 1
    },
    "traits": [
      {
        "name": "Amphibious",
        "description": "Can breathe air and water."
      },
      {
        "name": "Control Air and Water",
        "description": "Can cast Fog Cloud (1st), Gust of Wind (3rd), and Wall of Water (5th) once per Long Rest (Charisma)."
      },
      {
        "name": "Emissary of the Sea",
        "description": "Can communicate simple ideas to beasts that have a swimming speed."
      },
      {
        "name": "Guardians of the Depths",
        "description": "Adapted to the freezing depths: resistance to cold damage and ignores pressure effects."
      }
    ]
  },
  {
    "id": "tortle",
    "name": "Tortle",
    "type": "Humanoid",
    "subtype": "Tortle",
    "speed": 30,
    "languages": [
      "Common",
      "Aquan"
    ],
    "statBonuses": {
      "STR": 2,
      "WIS": 1
    },
    "traits": [
      {
        "name": "Claws",
        "description": "Unarmed strike deals 1d6 + Str modifier slashing damage."
      },
      {
        "name": "Hold Breath",
        "description": "Can hold breath for up to 1 hour at a time."
      },
      {
        "name": "Natural Armor",
        "description": "Base AC is 17 regardless of Dexterity modifier; cannot wear armor, but shields apply normally."
      },
      {
        "name": "Shell Defense",
        "description": "Action to withdraw into shell: +4 bonus to AC, advantage on Strength and Constitution saving throws, speed becomes 0, disadvantage on Dexterity saves."
      }
    ]
  },
  {
    "id": "harengon",
    "name": "Harengon",
    "type": "Humanoid",
    "subtype": "Harengon",
    "speed": 30,
    "languages": [
      "Common"
    ],
    "statBonuses": {
      "DEX": 2,
      "WIS": 1
    },
    "traits": [
      {
        "name": "Hare-Trigger",
        "description": "Adds proficiency bonus to initiative rolls."
      },
      {
        "name": "Leporine Senses",
        "description": "Proficiency in the Perception skill."
      },
      {
        "name": "Lucky Footwork",
        "description": "Reaction when failing a Dexterity saving throw: add 1d4 to the roll, potentially turning failure into success."
      },
      {
        "name": "Rabbit Hop",
        "description": "Bonus action to jump up to 5 times PB in feet without provoking opportunity attacks (PB times/Long Rest)."
      }
    ]
  },
  {
    "id": "fairy",
    "name": "Fairy",
    "type": "Fey",
    "subtype": "Fairy",
    "size": "Small",
    "speed": 30,
    "languages": [
      "Common",
      "Sylvan"
    ],
    "statBonuses": {
      "DEX": 2,
      "CHA": 1
    },
    "traits": [
      {
        "name": "Flight",
        "description": "Flying speed of 30 feet. Cannot fly while wearing medium or heavy armor."
      },
      {
        "name": "Fairy Magic",
        "description": "Knows Druidcraft; can cast Faerie Fire (3rd level) and Enlarge/Reduce (5th level) once per Long Rest (Intelligence, Wisdom, or Charisma)."
      }
    ]
  },
  {
    "id": "owlin",
    "name": "Owlin",
    "type": "Humanoid",
    "subtype": "Owlin",
    "speed": 30,
    "senses": [
      {
        "name": "Superior Darkvision",
        "value": "120 ft."
      }
    ],
    "languages": [
      "Common"
    ],
    "statBonuses": {
      "DEX": 2,
      "INT": 1
    },
    "traits": [
      {
        "name": "Flight",
        "description": "Flying speed of 30 feet. Cannot fly while wearing medium or heavy armor."
      },
      {
        "name": "Silent Feathers",
        "description": "Proficiency in the Stealth skill."
      }
    ]
  },
  {
    "id": "satyr",
    "name": "Satyr",
    "type": "Fey",
    "subtype": "Satyr",
    "speed": 35,
    "languages": [
      "Common",
      "Sylvan"
    ],
    "statBonuses": {
      "CHA": 2,
      "DEX": 1
    },
    "traits": [
      {
        "name": "Ram",
        "description": "Headbutt deals 1d6 + Str modifier bludgeoning damage."
      },
      {
        "name": "Magic Resistance",
        "description": "Advantage on saving throws against spells and other magical effects."
      },
      {
        "name": "Mirthful Leaps",
        "description": "Whenever making a long or high jump, can roll 1d8 and add the number rolled to the jump distance."
      },
      {
        "name": "Reveler",
        "description": "Proficiency in the Performance and Persuasion skills and with one musical instrument."
      }
    ]
  },
  {
    "id": "centaur",
    "name": "Centaur",
    "type": "Fey",
    "subtype": "Centaur",
    "speed": 40,
    "languages": [
      "Common",
      "Sylvan"
    ],
    "statBonuses": {
      "STR": 2,
      "WIS": 1
    },
    "traits": [
      {
        "name": "Charge",
        "description": "If moving at least 30 feet straight toward a target and hitting with a melee weapon attack on the same turn, can make one hooves attack as a Bonus Action."
      },
      {
        "name": "Hooves",
        "description": "Hooves deal 1d6 + Str modifier bludgeoning damage."
      },
      {
        "name": "Equine Build",
        "description": "Counts as one size larger for carrying capacity; climbing requires 4 feet of movement per foot instead of 1."
      }
    ]
  },
  {
    "id": "minotaur",
    "name": "Minotaur",
    "type": "Humanoid",
    "subtype": "Minotaur",
    "speed": 30,
    "languages": [
      "Common",
      "Minotaur"
    ],
    "statBonuses": {
      "STR": 2,
      "CON": 1
    },
    "traits": [
      {
        "name": "Horns",
        "description": "Horns deal 1d6 + Str modifier piercing damage."
      },
      {
        "name": "Goring Rush",
        "description": "Immediately after using the Dash action on its turn, can make one melee attack with horns as a Bonus Action."
      },
      {
        "name": "Hammering Horns",
        "description": "Immediately after hitting a creature with a melee attack on its turn, can use a Bonus Action to attempt to push the target up to 10 feet away (Str save DC 8+PB+Str)."
      }
    ]
  },
  {
    "id": "leonin",
    "name": "Leonin",
    "type": "Humanoid",
    "subtype": "Leonin",
    "speed": 35,
    "senses": [
      {
        "name": "Darkvision",
        "value": "60 ft."
      }
    ],
    "languages": [
      "Common",
      "Leonin"
    ],
    "statBonuses": {
      "CON": 2,
      "STR": 1
    },
    "traits": [
      {
        "name": "Claws",
        "description": "Claws deal 1d4 + Str modifier slashing damage."
      },
      {
        "name": "Hunter's Instincts",
        "description": "Proficiency in Athletics, Intimidation, Perception, or Survival."
      },
      {
        "name": "Daunting Roar",
        "description": "Bonus action roar: creatures of choice within 10 feet must succeed on a Con save (DC 8+PB+Con) or become frightened until end of its next turn (1/Short or Long Rest)."
      }
    ]
  },
  {
    "id": "dhampir",
    "name": "Dhampir",
    "type": "Humanoid",
    "subtype": "Dhampir",
    "speed": 35,
    "senses": [
      {
        "name": "Darkvision",
        "value": "60 ft."
      }
    ],
    "languages": [
      "Common"
    ],
    "statBonuses": {
      "CON": 2,
      "DEX": 1
    },
    "traits": [
      {
        "name": "Spider Climb",
        "description": "Climbing speed equal to walking speed, and can move up, down, and across vertical surfaces and ceilings while leaving hands free."
      },
      {
        "name": "Vampiric Bite",
        "description": "Constitution-based fanged bite deals 1d4 piercing damage. While bloodied (half HP), attack has Advantage; on hit can regain HP or add bonus to next ability check or attack roll (PB times/Long Rest)."
      },
      {
        "name": "Deathless Nature",
        "description": "Does not need to breathe."
      }
    ]
  },
  {
    "id": "hexblood",
    "name": "Hexblood",
    "type": "Fey",
    "subtype": "Hexblood",
    "speed": 30,
    "senses": [
      {
        "name": "Darkvision",
        "value": "60 ft."
      }
    ],
    "languages": [
      "Common"
    ],
    "statBonuses": {
      "WIS": 2,
      "INT": 1
    },
    "traits": [
      {
        "name": "Hex Magic",
        "description": "Can cast Disguise Self and Hex once per Long Rest (Intelligence, Wisdom, or Charisma)."
      },
      {
        "name": "Eerie Token",
        "description": "Bonus action to remove a lock of hair or nail to create a magical token: telepathic message up to 10 miles away, or remote sensor for 1 minute."
      }
    ]
  },
  {
    "id": "reborn",
    "name": "Reborn",
    "type": "Humanoid",
    "subtype": "Reborn",
    "speed": 30,
    "resistances": [
      "poison"
    ],
    "immunities": [
      "disease"
    ],
    "languages": [
      "Common"
    ],
    "statBonuses": {
      "CON": 2,
      "STR": 1
    },
    "traits": [
      {
        "name": "Deathless Nature",
        "description": "Advantage on saving throws against disease and being poisoned; resistance to poison damage; advantage on death saving throws; does not need to eat, drink, breathe, or sleep; finishes a Long Rest in 4 hours."
      },
      {
        "name": "Knowledge from a Past Life",
        "description": "When making an ability check that uses a skill, can roll a 1d6 and add the number rolled to the check (PB times/Long Rest)."
      }
    ]
  },
  {
    "id": "eladrin",
    "name": "Eladrin",
    "type": "Humanoid",
    "subtype": "Elf",
    "speed": 30,
    "senses": [
      {
        "name": "Darkvision",
        "value": "60 ft."
      }
    ],
    "languages": [
      "Common",
      "Elvish"
    ],
    "statBonuses": {
      "DEX": 2,
      "CHA": 1
    },
    "traits": [
      {
        "name": "Fey Ancestry",
        "description": "Advantage on saves against being Charmed; magic cannot put to sleep."
      },
      {
        "name": "Trance",
        "description": "Meditates deeply for 4 hours instead of sleeping."
      },
      {
        "name": "Fey Step",
        "description": "Bonus action to magically teleport up to 30 feet to an unoccupied space (PB times/Long Rest) with seasonal effect: Autumn (charm target), Winter (frighten target), Spring (teleport willing ally), Summer (deal fire damage equal to Charisma mod)."
      }
    ]
  },
  {
    "id": "shadarkai",
    "name": "Shadar-kai",
    "type": "Humanoid",
    "subtype": "Elf",
    "speed": 30,
    "senses": [
      {
        "name": "Darkvision",
        "value": "60 ft."
      }
    ],
    "resistances": [
      "necrotic"
    ],
    "languages": [
      "Common",
      "Elvish"
    ],
    "statBonuses": {
      "DEX": 2,
      "CON": 1
    },
    "traits": [
      {
        "name": "Fey Ancestry",
        "description": "Advantage on saves against being Charmed; magic cannot put to sleep."
      },
      {
        "name": "Trance",
        "description": "Meditates deeply for 4 hours instead of sleeping."
      },
      {
        "name": "Necrotic Resistance",
        "description": "Resistance to necrotic damage."
      },
      {
        "name": "Blessing of the Raven Queen",
        "description": "Bonus action to magically teleport up to 30 feet (PB times/Long Rest); gains resistance to all damage until start of next turn."
      }
    ]
  },
  {
    "id": "sea_elf",
    "name": "Elf (Sea)",
    "type": "Humanoid",
    "subtype": "Elf",
    "speed": 30,
    "senses": [
      {
        "name": "Darkvision",
        "value": "60 ft."
      }
    ],
    "resistances": [
      "cold"
    ],
    "languages": [
      "Common",
      "Elvish",
      "Aquan"
    ],
    "statBonuses": {
      "DEX": 2,
      "CON": 1
    },
    "traits": [
      {
        "name": "Fey Ancestry",
        "description": "Advantage on saves against being Charmed; magic cannot put to sleep."
      },
      {
        "name": "Child of the Sea",
        "description": "Swimming speed of 30 feet and can breathe air and water."
      },
      {
        "name": "Friend of the Sea",
        "description": "Can communicate simple ideas to any beast that has an inborn swimming speed."
      }
    ]
  },
  {
    "id": "astral_elf",
    "name": "Elf (Astral)",
    "type": "Humanoid",
    "subtype": "Elf",
    "speed": 30,
    "senses": [
      {
        "name": "Darkvision",
        "value": "60 ft."
      }
    ],
    "languages": [
      "Common",
      "Elvish",
      "Celestial"
    ],
    "statBonuses": {
      "DEX": 2,
      "INT": 1
    },
    "traits": [
      {
        "name": "Astral Fire",
        "description": "Knows one of Sacred Flame, Dancing Lights, or Light (Int, Wis, or Cha)."
      },
      {
        "name": "Astral Trance",
        "description": "Trance in 4 hours; gain proficiency in one skill and with one weapon or tool of choice after trance."
      },
      {
        "name": "Starlight Step",
        "description": "Bonus action to magically teleport up to 30 feet (PB times/Long Rest)."
      }
    ]
  },
  {
    "id": "gnome_deep",
    "name": "Gnome (Deep / Svirfneblin)",
    "type": "Humanoid",
    "subtype": "Gnome",
    "size": "Small",
    "speed": 25,
    "senses": [
      {
        "name": "Superior Darkvision",
        "value": "120 ft."
      }
    ],
    "languages": [
      "Common",
      "Gnomish",
      "Undercommon"
    ],
    "statBonuses": {
      "INT": 2,
      "DEX": 1
    },
    "traits": [
      {
        "name": "Gnome Cunning",
        "description": "Advantage on all Intelligence, Wisdom, and Charisma saving throws against magic."
      },
      {
        "name": "Svirfneblin Camouflage",
        "description": "Advantage on Dexterity (Stealth) checks made to hide in rocky terrain or underground."
      },
      {
        "name": "Gift of the Svirfneblin",
        "description": "Can cast Disguise Self (3rd) and Nondetection (5th) once per Long Rest (Intelligence)."
      }
    ]
  },
  {
    "id": "gnome_forest",
    "name": "Gnome (Forest)",
    "type": "Humanoid",
    "subtype": "Gnome",
    "size": "Small",
    "speed": 25,
    "senses": [
      {
        "name": "Darkvision",
        "value": "60 ft."
      }
    ],
    "languages": [
      "Common",
      "Gnomish"
    ],
    "statBonuses": {
      "INT": 2,
      "DEX": 1
    },
    "traits": [
      {
        "name": "Gnome Cunning",
        "description": "Advantage on all Intelligence, Wisdom, and Charisma saving throws against magic."
      },
      {
        "name": "Natural Illusionist",
        "description": "Knows the Minor Illusion cantrip (Intelligence)."
      },
      {
        "name": "Speak with Small Beasts",
        "description": "Through sounds and gestures, can communicate simple ideas with Small or smaller beasts."
      }
    ]
  },
  {
    "id": "halfling_lightfoot",
    "name": "Halfling (Lightfoot)",
    "type": "Humanoid",
    "subtype": "Halfling",
    "size": "Small",
    "speed": 25,
    "languages": [
      "Common",
      "Halfling"
    ],
    "statBonuses": {
      "DEX": 2,
      "CHA": 1
    },
    "traits": [
      {
        "name": "Lucky",
        "description": "Reroll 1s on attack rolls, ability checks, and saving throws."
      },
      {
        "name": "Brave",
        "description": "Advantage on saving throws against being Frightened."
      },
      {
        "name": "Naturally Stealthy",
        "description": "Can attempt to hide even when obscured only by a creature that is at least one size larger."
      }
    ]
  },
  {
    "id": "halfling_stout",
    "name": "Halfling (Stout)",
    "type": "Humanoid",
    "subtype": "Halfling",
    "size": "Small",
    "speed": 25,
    "resistances": [
      "poison"
    ],
    "languages": [
      "Common",
      "Halfling"
    ],
    "statBonuses": {
      "DEX": 2,
      "CON": 1
    },
    "traits": [
      {
        "name": "Lucky",
        "description": "Reroll 1s on attack rolls, ability checks, and saving throws."
      },
      {
        "name": "Brave",
        "description": "Advantage on saving throws against being Frightened."
      },
      {
        "name": "Stout Resilience",
        "description": "Advantage on saving throws against poison, and resistance against poison damage."
      }
    ]
  },
  {
    "id": "custom_lineage",
    "name": "Custom Lineage",
    "type": "Humanoid",
    "speed": 30,
    "languages": [
      "Common"
    ],
    "statBonuses": {},
    "traits": [
      {
        "name": "Feat",
        "description": "Gain one feat of choice for which you qualify."
      },
      {
        "name": "Variable Trait",
        "description": "Gain Darkvision 60 ft. or proficiency in one skill of choice."
      }
    ]
  },
  {
    "id": "autognome",
    "name": "Autognome",
    "type": "Construct",
    "subtype": "Gnome",
    "size": "Small",
    "speed": 30,
    "languages": [
      "Common"
    ],
    "statBonuses": {},
    "resistances": [
      "poison",
      "paralyzed"
    ],
    "immunities": [
      "disease"
    ],
    "traits": [
      {
        "name": "Armored Casing",
        "description": "Base AC equals 13 + Dexterity modifier when not wearing armor."
      },
      {
        "name": "Built for Success",
        "description": "Can add a 1d4 to one attack roll, ability check, or saving throw after rolling (PB times/Long Rest)."
      },
      {
        "name": "Mechanical Nature",
        "description": "Does not need to eat, drink, or breathe; immune to disease."
      }
    ]
  },
  {
    "id": "giff",
    "name": "Giff",
    "type": "Humanoid",
    "speed": 30,
    "languages": [
      "Common"
    ],
    "statBonuses": {},
    "traits": [
      {
        "name": "Astral Spark",
        "description": "Deal extra force damage equal to PB on simple or martial weapon hits (PB times/Long Rest)."
      },
      {
        "name": "Hippo Build",
        "description": "Advantage on Strength-based ability checks and saving throws; counts as one size larger for carrying capacity."
      }
    ]
  },
  {
    "id": "hadozee",
    "name": "Hadozee",
    "type": "Humanoid",
    "speed": 30,
    "languages": [
      "Common"
    ],
    "statBonuses": {},
    "traits": [
      {
        "name": "Glide",
        "description": "Can glide horizontally 5 feet for every 1 foot fallen, taking zero falling damage."
      },
      {
        "name": "Dexterous Feet",
        "description": "Can use a Bonus Action to manipulate an object, open/close doors, or stow an item using feet."
      }
    ]
  },
  {
    "id": "plasmoid",
    "name": "Plasmoid",
    "type": "Ooze",
    "speed": 30,
    "languages": [
      "Common"
    ],
    "statBonuses": {},
    "resistances": [
      "acid",
      "poison"
    ],
    "traits": [
      {
        "name": "Amorphous",
        "description": "Can squeeze through spaces as narrow as 1 inch wide without squeezing."
      },
      {
        "name": "Hold Breath",
        "description": "Can hold breath for up to 1 hour."
      },
      {
        "name": "Shape Self",
        "description": "Can extend a pseudopod up to 10 feet long as a Bonus Action to manipulate objects."
      }
    ]
  },
  {
    "id": "thrikreen",
    "name": "Thri-kreen",
    "type": "Monstrosity",
    "speed": 30,
    "senses": [
      {
        "name": "Darkvision",
        "value": "60 ft."
      }
    ],
    "languages": [
      "Common",
      "Thri-kreen"
    ],
    "statBonuses": {},
    "traits": [
      {
        "name": "Chameleon Carapace",
        "description": "Base AC 13 + Dex; can change color to gain Advantage on Stealth checks."
      },
      {
        "name": "Secondary Arms",
        "description": "Has two smaller secondary arms to manipulate light objects and light weapons."
      },
      {
        "name": "Sleepless Revitalization",
        "description": "Remains fully conscious during a 4-hour rest."
      }
    ]
  },
  {
    "id": "kender",
    "name": "Kender",
    "type": "Humanoid",
    "size": "Small",
    "speed": 30,
    "languages": [
      "Common"
    ],
    "statBonuses": {},
    "traits": [
      {
        "name": "Fearless",
        "description": "Immune to the Frightened condition."
      },
      {
        "name": "Taunt",
        "description": "Bonus action target within 60 ft must make Wis save (DC 8+PB+Cha) or have Disadvantage on attacks against targets other than you."
      },
      {
        "name": "Kender Pockets",
        "description": "Can pull random simple items from pockets (PB times/Long Rest)."
      }
    ]
  },
  {
    "id": "loxodon",
    "name": "Loxodon",
    "type": "Humanoid",
    "speed": 30,
    "languages": [
      "Common",
      "Loxodon"
    ],
    "statBonuses": {
      "CON": 2,
      "WIS": 1
    },
    "traits": [
      {
        "name": "Natural Armor",
        "description": "Base AC equals 12 + Constitution modifier."
      },
      {
        "name": "Trunk",
        "description": "Can use trunk to grasp items, lift up to 5 times Strength score, or make unarmed strikes."
      },
      {
        "name": "Keen Smell",
        "description": "Advantage on Perception, Survival, and Investigation checks that rely on smell."
      }
    ]
  },
  {
    "id": "simic_hybrid",
    "name": "Simic Hybrid",
    "type": "Humanoid",
    "speed": 30,
    "senses": [
      {
        "name": "Darkvision",
        "value": "60 ft."
      }
    ],
    "languages": [
      "Common",
      "Elvish"
    ],
    "statBonuses": {
      "CON": 2
    },
    "traits": [
      {
        "name": "Animal Enhancement",
        "description": "Mutations include Manta Glide, Nimble Climber, Underwater Adaptation, Grappling Appendages, Carapace, or Acid Spit."
      }
    ]
  },
  {
    "id": "vedalken",
    "name": "Vedalken",
    "type": "Humanoid",
    "speed": 30,
    "languages": [
      "Common",
      "Vedalken"
    ],
    "statBonuses": {
      "INT": 2,
      "WIS": 1
    },
    "traits": [
      {
        "name": "Vedalken Dispassion",
        "description": "Advantage on all Intelligence, Wisdom, and Charisma saving throws."
      },
      {
        "name": "Tireless Precision",
        "description": "Add 1d4 to checks with chosen skill and tool."
      },
      {
        "name": "Partially Amphibious",
        "description": "Can breathe underwater for up to 1 hour per rest."
      }
    ]
  },
  {
    "id": "verdan",
    "name": "Verdan",
    "type": "Humanoid",
    "speed": 30,
    "languages": [
      "Common",
      "Goblin"
    ],
    "statBonuses": {
      "CHA": 2,
      "CON": 1
    },
    "traits": [
      {
        "name": "Black Blood Healing",
        "description": "Reroll 1s and 2s on hit dice spent during Short Rests."
      },
      {
        "name": "Telepathic Insight",
        "description": "Advantage on all Wisdom and Charisma saving throws."
      }
    ]
  },
  {
    "id": "locathah",
    "name": "Locathah",
    "type": "Humanoid",
    "speed": 30,
    "languages": [
      "Common",
      "Aquan"
    ],
    "statBonuses": {
      "STR": 2,
      "DEX": 1
    },
    "traits": [
      {
        "name": "Natural Armor",
        "description": "Base AC 12 + Dexterity modifier."
      },
      {
        "name": "Leviathan Will",
        "description": "Advantage on saving throws against being Charmed, Frightened, Paralyzed, Poisoned, Stunned, or Sleep."
      },
      {
        "name": "Limited Amphibiousness",
        "description": "Can breathe air and water, but must be submerged in water at least once every 4 hours."
      }
    ]
  },
  {
    "id": "grung",
    "name": "Grung",
    "type": "Humanoid",
    "size": "Small",
    "speed": 25,
    "languages": [
      "Grung"
    ],
    "statBonuses": {
      "DEX": 2,
      "CON": 1
    },
    "immunities": [
      "poison"
    ],
    "traits": [
      {
        "name": "Poisonous Skin",
        "description": "Any creature that grapples or touches grung with bare skin must succeed on a DC 12 Con save or become Poisoned for 1 minute."
      },
      {
        "name": "Standing Leap",
        "description": "Long jump is up to 25 feet and high jump is up to 15 feet with or without a running start."
      }
    ]
  },
];
