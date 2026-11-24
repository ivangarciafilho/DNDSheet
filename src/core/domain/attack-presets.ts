import type { MonsterAction } from './types.ts'

/** One-click attack starters for the Actions & Traits Studio (Build 274). */
export interface AttackPreset {
  kind: 'melee-weapon' | 'ranged-weapon' | 'melee-spell' | 'ranged-spell'
  label: string
  icon: string
  color: string
  tip: string
}

export const ATTACK_PRESETS: readonly AttackPreset[] = [
  { kind: 'melee-weapon', label: 'Melee Weapon Attack', icon: 'mdi-sword', color: 'red-5', tip: 'Reach 5 ft., one target, 1d8 + STR slashing on a hit.' },
  { kind: 'ranged-weapon', label: 'Ranged Weapon Attack', icon: 'mdi-bow-arrow', color: 'orange-5', tip: 'Range 80/320 ft., one target, 1d8 + DEX piercing on a hit.' },
  { kind: 'melee-spell', label: 'Melee Spell Attack', icon: 'mdi-hand-wave', color: 'purple-4', tip: 'Reach 5 ft., one target, 2d8 + spellcasting modifier necrotic on a hit.' },
  { kind: 'ranged-spell', label: 'Ranged Spell Attack', icon: 'mdi-magic-staff', color: 'deep-purple-3', tip: 'Range 120 ft., one target, 1d10 force on a hit.' },
]

type Preset = Pick<MonsterAction, 'name' | 'attackReach' | 'attackSource' | 'targeting' | 'outcomes' | 'deliveryType'> & Partial<Pick<MonsterAction, 'weaponAttackAbility'>>

const hit = (formula: string, damageType: string): MonsterAction['outcomes'] =>
  [{ trigger: 'hit', effects: [{ kind: 'damage', formula, damageType }] }]

/** Fields to lay over `defaultAction()`; every value is plain data the composer edits in place. */
export function attackPresetAction(kind: string): Preset {
  switch (kind) {
    case 'melee-weapon':
      return { name: 'Slam', deliveryType: 'Attack', attackReach: 'melee', attackSource: 'weapon', weaponAttackAbility: 'auto',
        targeting: { count: 1, countMode: 'exact', kind: 'target', range: { distance: 5, unit: 'ft', relation: 'reach' } },
        outcomes: hit('1d8 + STR_MOD', 'slashing') }
    case 'ranged-weapon':
      return { name: 'Longbow', deliveryType: 'Attack', attackReach: 'ranged', attackSource: 'weapon', weaponAttackAbility: 'auto',
        targeting: { count: 1, countMode: 'exact', kind: 'target', range: { distance: 80, longDistance: 320, unit: 'ft', relation: 'range' } },
        outcomes: hit('1d8 + DEX_MOD', 'piercing') }
    case 'melee-spell':
      return { name: 'Withering Touch', deliveryType: 'Attack', attackReach: 'melee', attackSource: 'spell',
        targeting: { count: 1, countMode: 'exact', kind: 'target', range: { distance: 5, unit: 'ft', relation: 'reach' } },
        outcomes: hit('2d8 + SPELL_MOD', 'necrotic') }
    case 'ranged-spell':
      return { name: 'Arcane Bolt', deliveryType: 'Attack', attackReach: 'ranged', attackSource: 'spell',
        targeting: { count: 1, countMode: 'exact', kind: 'target', range: { distance: 120, unit: 'ft', relation: 'range' } },
        outcomes: hit('1d10', 'force') }
    default:
      throw new Error(`Unknown attack preset: ${kind}`)
  }
}
