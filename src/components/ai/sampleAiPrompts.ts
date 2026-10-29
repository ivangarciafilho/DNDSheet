export const SAMPLE_AI_STATBLOCK_DRAGON = `Here is the statblock generated for your encounter:

\`\`\`json
{
  "name": "Infernal Cinder Dragon",
  "size": "Huge",
  "type": "dragon",
  "alignment": "chaotic evil",
  "AC": 19,
  "ACType": "natural armor",
  "CR": 15,
  "proficiency": 5,
  "HP": {
    "HD": 18,
    "type": 12,
    "modifier": 108
  },
  "stats": {
    "STR": 26,
    "DEX": 12,
    "CON": 23,
    "INT": 16,
    "WIS": 15,
    "CHA": 19
  },
  "saves": {
    "STR": { "proficient": false, "override": false, "overrideValue": 0 },
    "DEX": { "proficient": true, "override": false, "overrideValue": 0 },
    "CON": { "proficient": true, "override": false, "overrideValue": 0 },
    "INT": { "proficient": false, "override": false, "overrideValue": 0 },
    "WIS": { "proficient": true, "override": false, "overrideValue": 0 },
    "CHA": { "proficient": true, "override": false, "overrideValue": 0 }
  },
  "speeds": [
    { "id": "walk", "type": "walk", "speed": 40, "note": "" },
    { "id": "fly", "type": "fly", "speed": 80, "note": "hover" }
  ],
  "resistances": ["bludgeoning, piercing, and slashing from nonmagical attacks"],
  "immunities": ["fire"],
  "conditions": ["frightened", "paralyzed"],
  "senses": {
    "blindsight": 60,
    "darkvision": 120,
    "tremorsense": 0,
    "truesight": 0
  },
  "languages": "Common, Draconic, Ignan",
  "traits": [
    {
      "id": "legendary-res",
      "name": "Legendary Resistance",
      "description": "If {NAME} fails a saving throw, it can choose to succeed instead.",
      "limitedUse": { "count": 3, "rate": "DAY" },
      "crAnnotation": { "include": true }
    }
  ],
  "attacks": [
    {
      "id": "bite-1",
      "name": "Cinder Bite",
      "distance": "MELEE",
      "kind": "WEAPON",
      "targets": 1,
      "range": { "standard": 10, "reach": 10, "long": 0 },
      "damage": { "count": 2, "dice": 10, "type": "piercing", "modifier": { "override": false, "overrideValue": 0, "stat": "STR" } },
      "additionalDamage": [
        { "id": "fire-bonus", "count": 2, "dice": 6, "type": "fire", "note": "plus fire" }
      ],
      "alternateDamage": { "active": false, "count": 1, "dice": 6, "type": "slashing", "condition": "", "modifier": { "override": false, "overrideValue": 0, "stat": "STR" } },
      "description": "",
      "legendaryOnly": false,
      "useCustomRenderer": false,
      "customRenderer": ""
    }
  ],
  "actions": [
    {
      "id": "breath-1",
      "name": "Cinder Breath",
      "range": "60-foot cone",
      "description": "{NAME} exhales raging embers in a 60-foot cone. Each creature in that area must make a {DC:CON} Dexterity saving throw, taking {14d6} fire damage on a failed save, or half as much on a successful one.",
      "stat": "DEX",
      "save": { "override": false, "overrideValue": 0 },
      "recharge": "5-6",
      "limitedUse": { "count": 1, "rate": "RECHARGE", "recharge": "5-6" },
      "crAnnotation": { "include": true }
    }
  ]
}
\`\`\`
`

export const SAMPLE_AI_STATBLOCK_ARCHMAGE = `\`\`\`json
{
  "name": "Aether Archmage",
  "size": "Medium",
  "type": "humanoid",
  "alignment": "neutral",
  "AC": 15,
  "ACType": "18 with Mage Armor",
  "CR": 12,
  "proficiency": 4,
  "HP": {
    "HD": 18,
    "type": 8,
    "modifier": 18
  },
  "stats": {
    "STR": 10,
    "DEX": 14,
    "CON": 12,
    "INT": 20,
    "WIS": 15,
    "CHA": 16
  },
  "saves": {
    "STR": { "proficient": false, "override": false, "overrideValue": 0 },
    "DEX": { "proficient": false, "override": false, "overrideValue": 0 },
    "CON": { "proficient": false, "override": false, "overrideValue": 0 },
    "INT": { "proficient": true, "override": false, "overrideValue": 0 },
    "WIS": { "proficient": true, "override": false, "overrideValue": 0 },
    "CHA": { "proficient": false, "override": false, "overrideValue": 0 }
  },
  "speeds": [{ "id": "walk", "type": "walk", "speed": 30, "note": "" }],
  "languages": "Common, Elvish, Draconic, Celestial",
  "traits": [
    {
      "id": "magic-res",
      "name": "Magic Resistance",
      "description": "{NAME} has advantage on saving throws against spells and other magical effects.",
      "limitedUse": { "count": 0, "rate": "AT_WILL" },
      "crAnnotation": { "include": true }
    }
  ],
  "spellcasting": {
    "stat": "INT",
    "class": "Wizard",
    "level": 17,
    "save": { "override": false, "overrideValue": 0 },
    "modifier": { "override": false, "overrideValue": 0 },
    "attack": { "override": false, "overrideValue": 0 },
    "slots": [4, 3, 3, 3, 2, 1, 1, 1, 1],
    "atWill": [],
    "standard": [],
    "notes": ""
  },
  "actions": [
    {
      "id": "arcane-burst",
      "name": "Arcane Burst",
      "range": "120 ft.",
      "description": "{NAME} fires a concentrated bolt of force energy. Ranged Spell Attack: +9 to hit, range 120 ft., one target. Hit: 28 (4d10 + 6) force damage.",
      "stat": "INT",
      "save": { "override": false, "overrideValue": 0 },
      "crAnnotation": { "include": true }
    }
  ]
}
\`\`\`
`
