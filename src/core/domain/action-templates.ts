import type { AbilityOutcome, AbilityTargeting, MonsterAction } from './types.ts'

export interface ActionTemplate {
  id: string
  name: string
  category: 'Weapon attacks' | 'Spell attacks' | 'Saves & areas' | 'Auras & utility'
  summary: string
  patch: Partial<MonsterAction>
}

const outcome = (trigger: string, formula?: string, damageType?: string, rider?: string): AbilityOutcome => ({
  trigger,
  effects: formula ? [{ kind: 'damage', formula, damageType }] : [],
  rider,
})

const target = (count: AbilityTargeting['count'], kind: string, range?: AbilityTargeting['range']): AbilityTargeting => ({
  count,
  countMode: 'exact',
  kind,
  range,
})

const actionPatch = (
  values: Pick<MonsterAction, 'name' | 'description' | 'stat' | 'save' | 'range' | 'effects'> & Partial<MonsterAction>
): Partial<MonsterAction> => ({
  name: values.name,
  description: values.description,
  actionType: values.actionType,
  attackReach: values.attackReach,
  attackSource: values.attackSource,
  attackBonus: values.attackBonus,
  targetsText: values.targetsText,
  stat: values.stat,
  save: values.save,
  range: values.range,
  effects: values.effects,
  school: values.school,
  spellLevel: values.spellLevel,
  components: values.components,
  duration: values.duration,
  areaShape: values.areaShape,
  areaDistance: values.areaDistance,
  deliveryType: values.deliveryType,
  targeting: values.targeting,
  outcomes: values.outcomes,
})

export const ACTION_TEMPLATES: readonly ActionTemplate[] = [
  {
    id: 'melee-weapon-attack',
    name: 'Melee weapon attack',
    category: 'Weapon attacks',
    summary: 'One target within 5 feet; slashing damage.',
    patch: actionPatch({
      name: 'Melee weapon attack', description: '', stat: 'none', save: { override: false, overrideValue: 0 },
      range: 'reach 5 ft.', effects: [], actionType: 'weapon_attack', attackReach: 'melee', attackSource: 'weapon',
      targeting: target(1, 'creature', { distance: 5, unit: 'ft', relation: 'reach' }),
      outcomes: [outcome('hit', '2d6 + STR_MOD', 'slashing')], deliveryType: 'Attack',
    }),
  },
  {
    id: 'ranged-weapon-attack',
    name: 'Ranged weapon attack',
    category: 'Weapon attacks',
    summary: 'One target within 80 feet; piercing damage.',
    patch: actionPatch({
      name: 'Ranged weapon attack', description: '', stat: 'none', save: { override: false, overrideValue: 0 },
      range: 'range 80 ft.', effects: [], actionType: 'weapon_attack', attackReach: 'ranged', attackSource: 'weapon',
      targeting: target(1, 'creature', { distance: 80, unit: 'ft', relation: 'range' }),
      outcomes: [outcome('hit', '1d8 + DEX_MOD', 'piercing')], deliveryType: 'Attack',
    }),
  },
  {
    id: 'melee-spell-attack',
    name: 'Melee spell attack',
    category: 'Spell attacks',
    summary: 'One target within 5 feet; force damage.',
    patch: actionPatch({
      name: 'Melee spell attack', description: '', stat: 'none', save: { override: false, overrideValue: 0 },
      range: 'reach 5 ft.', effects: [], actionType: 'spell_attack', attackReach: 'melee', attackSource: 'spell',
      targeting: target(1, 'creature', { distance: 5, unit: 'ft', relation: 'reach' }),
      outcomes: [outcome('hit', '2d10', 'force')], school: 'Evocation', spellLevel: 'Cantrip', components: ['V', 'S'],
      deliveryType: 'Attack',
    }),
  },
  {
    id: 'ranged-spell-attack',
    name: 'Ranged spell attack',
    category: 'Spell attacks',
    summary: 'One target within 120 feet; fire damage.',
    patch: actionPatch({
      name: 'Ranged spell attack', description: '', stat: 'none', save: { override: false, overrideValue: 0 },
      range: 'range 120 ft.', effects: [], actionType: 'spell_attack', attackReach: 'ranged', attackSource: 'spell',
      targeting: target(1, 'creature', { distance: 120, unit: 'ft', relation: 'range' }),
      outcomes: [outcome('hit', '1d10 + CHA_MOD', 'fire')], school: 'Evocation', spellLevel: 'Cantrip', components: ['V', 'S'],
      deliveryType: 'Attack',
    }),
  },
  {
    id: 'area-saving-throw',
    name: 'Area saving throw',
    category: 'Saves & areas',
    summary: 'Creatures in a 20-foot-radius sphere; half damage on success.',
    patch: actionPatch({
      name: 'Area saving throw', description: '', stat: 'CON', save: { override: false, overrideValue: 0 },
      range: 'all creatures in a 20-foot-radius sphere', effects: [], actionType: 'save_ability',
      targeting: { count: 'all', kind: 'creatures', area: { shape: 'radius sphere', distance: 20, unit: 'ft' } },
      outcomes: [
        outcome('failure', '4d10', 'radiant'),
        outcome('success', undefined, undefined, 'The creature takes half as much damage.'),
      ], deliveryType: 'Save',
    }),
  },
  {
    id: 'veil-of-radiance',
    name: 'Veil of Radiance',
    category: 'Saves & areas',
    summary: 'Creatures within 20 feet; Charisma save against radiant damage.',
    patch: actionPatch({
      name: 'Veil of Radiance', description: 'Hostile creatures in the area are surrounded by a radiant flare.',
      stat: 'CHA', save: { override: false, overrideValue: 0 },
      range: 'Self (creatures within 20 ft. of you) across Material and Ethereal Planes', effects: [],
      actionType: 'save_ability', spellLevel: 'None', school: 'Abjuration', components: ['V', 'S'],
      targeting: {
        count: 'all', kind: 'creatures',
        range: { distance: 20, unit: 'ft', relation: 'within', origin: 'you' },
        planes: ['Material', 'Ethereal'],
      },
      outcomes: [outcome('failure', '1d10', 'radiant', 'The creature is knocked Prone.')], deliveryType: 'Save',
    }),
  },
  {
    id: 'angelic-halo',
    name: 'Angelic Halo',
    category: 'Auras & utility',
    summary: 'A 20-foot protective light; one-minute duration.',
    patch: actionPatch({
      name: 'Angelic Halo', description: 'Sheds bright light in a 20-foot radius. Magical darkness created by a spell of 2nd level or lower is suppressed in the area.',
      stat: 'none', save: { override: false, overrideValue: 0 }, range: 'Self (20-foot radius)', effects: [],
      actionType: 'standard', school: 'Abjuration', spellLevel: '2nd Level', components: ['V', 'C'], duration: '1 minute',
      deliveryType: 'Utility',
    }),
  },
  {
    id: 'holy-javelin',
    name: 'Holy Javelin',
    category: 'Spell attacks',
    summary: 'One visible target within 120 feet; radiant damage and a light rider.',
    patch: actionPatch({
      name: 'Holy Javelin', description: '', stat: 'none', save: { override: false, overrideValue: 0 },
      range: 'range 120 ft.', effects: [], actionType: 'spell_attack', attackReach: 'ranged', attackSource: 'spell',
      targeting: {
        ...target(1, 'creature', { distance: 120, unit: 'ft', relation: 'range' }),
        qualifier: 'which you can see',
      },
      outcomes: [outcome('hit', '2d10', 'radiant', 'The target sheds dim light until the start of its next turn.')],
      school: 'Evocation', spellLevel: '2nd Level', components: ['V', 'S'], deliveryType: 'Attack',
    }),
  },
  {
    id: 'utility-aura',
    name: 'Utility aura',
    category: 'Auras & utility',
    summary: 'A prose-first utility effect with no assumed attack or save.',
    patch: actionPatch({
      name: 'Utility aura', description: 'Describe the aura and its effect.', stat: 'none',
      save: { override: false, overrideValue: 0 }, range: 'Self', effects: [],
      actionType: 'standard', deliveryType: 'Aura', outcomes: [],
    }),
  },
]

const TEMPLATE_OWNED_FIELDS: readonly (keyof MonsterAction)[] = [
  'name', 'description', 'actionType', 'attackReach', 'attackSource', 'attackBonus', 'targetsText', 'stat', 'save',
  'range', 'effects', 'school', 'spellLevel', 'components', 'duration', 'areaShape', 'areaDistance', 'deliveryType',
  'targeting', 'outcomes',
]

function cloneTemplateValue<T>(value: T): T {
  if (Array.isArray(value)) return value.map((item) => cloneTemplateValue(item)) as T
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nested]) => [key, cloneTemplateValue(nested)])
    ) as T
  }
  return value
}

export function applyActionTemplate(action: MonsterAction, templateId: string): MonsterAction {
  const template = ACTION_TEMPLATES.find((item) => item.id === templateId)
  if (!template) return action

  const next = { ...action }
  const mutableNext = next as unknown as Record<string, unknown>
  for (const field of TEMPLATE_OWNED_FIELDS) {
    mutableNext[field] = cloneTemplateValue(template.patch[field])
  }

  // Templates replace ability content, never document identity, role, usage, cadence, or CR policy.
  next.id = action.id
  next.bonusAction = action.bonusAction
  next.legendaryOnly = action.legendaryOnly
  next.limitedUse = action.limitedUse
  next.recharge = action.recharge
  next.stagePool = action.stagePool
  next.customPreamble = action.customPreamble
  next.crAnnotation = action.crAnnotation
  return next
}
