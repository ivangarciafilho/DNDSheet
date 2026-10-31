import type { DndAttack } from './types.ts'
import type { ComposerCellSpec } from './action-composer.ts'
import { DAMAGE_TYPES, SAVE_ABILITIES } from './action-composer.ts'
import { lookupNumericField } from './catalogs/field-types.ts'

export const attackExtraPrefix = (id: string): string => `additional.${encodeURIComponent(id).replace(/\./g, '%2E')}`

/** Adapt compositor IDs to stable numeric addresses without changing identity. */
export function attackNumericFieldPath(attack: DndAttack, fieldId: string): string | undefined {
  if (!attackFields(attack).some(field => field.id === fieldId)) return undefined
  let suffix = fieldId
  if (fieldId.startsWith('additional.')) {
    const parts = fieldId.split('.')
    let id: string
    try { id = decodeURIComponent(parts[1]) } catch { return undefined }
    if (attack.additionalDamage.filter(item => item.id === id).length !== 1) return undefined
    suffix = `additionalDamage[id=${encodeURIComponent(id)}].${parts.slice(2).join('.')}`
  }
  const path = `attacks[id=${encodeURIComponent(attack.id)}].${suffix}`
  return lookupNumericField(path) ? path : undefined
}

/** Whitelisted leaf edits into the existing attack model. No role conversion or derived math. */
export interface AttackField extends ComposerCellSpec { boolean?: boolean; min?: number; optional?: boolean }
const field = (id: string, label: string, row: AttackField['row'], options?: readonly string[], min?: number): AttackField =>
  ({ id, field: id, label, row, editor: options ? 'catalog' : min !== undefined ? 'number' : 'text', options, min })
const toggle = (id: string, label: string, row: AttackField['row']): AttackField => ({ ...field(id, label, row, ['Yes', 'No']), boolean: true })
const damageFields = (prefix: string, label: string): AttackField[] => [
  field(`${prefix}.count`, `${label} dice count`, 'outcomes', undefined, 0),
  field(`${prefix}.dice`, `${label} die`, 'outcomes', ['1', '4', '6', '8', '10', '12', '20']),
  { ...field(`${prefix}.type`, `${label} damage type`, 'outcomes', DAMAGE_TYPES), allowCustom: true, optional: true },
  field(`${prefix}.modifier.stat`, `${label} ability`, 'outcomes', SAVE_ABILITIES),
  toggle(`${prefix}.modifier.override`, `${label} override`, 'outcomes'),
  field(`${prefix}.modifier.overrideValue`, `${label} bonus`, 'outcomes', undefined, Number.MIN_SAFE_INTEGER),
]
export function attackFields(attack: DndAttack): AttackField[] {
  return [field('name', 'Name', 'head'), field('distance', 'Attack distance', 'mechanics', ['MELEE', 'RANGED', 'BOTH']),
    field('kind', 'Attack kind', 'mechanics', ['WEAPON', 'SPELL']),
    field('modifier.stat', 'Attack ability', 'mechanics', SAVE_ABILITIES), toggle('modifier.proficient', 'Proficient', 'mechanics'),
    toggle('modifier.override', 'Attack override', 'mechanics'), field('modifier.overrideValue', 'Attack bonus', 'mechanics', undefined, Number.MIN_SAFE_INTEGER),
    field('targets', 'Targets', 'scope', undefined, 1), field('range.reach', 'Reach (ft)', 'scope', undefined, 0),
    field('range.standard', 'Normal range (ft)', 'scope', undefined, 0), field('range.long', 'Long range (ft)', 'scope', undefined, 0),
    field('save', 'Effect DC (0 = none)', 'mechanics', undefined, 0), ...damageFields('damage', 'Primary'),
    toggle('alternateDamage.active', 'Conditional damage', 'outcomes'),
    { ...field('alternateDamage.condition', 'Damage condition', 'outcomes'), optional: true }, ...damageFields('alternateDamage', 'Conditional'),
    ...attack.additionalDamage.flatMap(extra => [field(`${attackExtraPrefix(extra.id)}.count`, 'Extra dice count', 'outcomes', undefined, 0),
      field(`${attackExtraPrefix(extra.id)}.dice`, 'Extra die', 'outcomes', ['1', '4', '6', '8', '10', '12', '20']),
      { ...field(`${attackExtraPrefix(extra.id)}.type`, 'Extra damage type', 'outcomes', DAMAGE_TYPES), allowCustom: true, optional: true },
      { ...field(`${attackExtraPrefix(extra.id)}.note`, 'Extra damage note', 'outcomes'), optional: true }]),
    toggle('legendaryOnly', 'Only in special actions', 'head'), toggle('useCustomRenderer', 'Custom rendering', 'head')]
}
function leaf(attack: DndAttack, id: string): unknown {
  const parts = id.split('.')
  let value: unknown = attack
  if (parts[0] === 'additional') {
    value = attack.additionalDamage.find(extra => extra.id === decodeURIComponent(parts[1])); parts.splice(0, 2)
  }
  for (const key of parts) value = value && typeof value === 'object' ? (value as Record<string, unknown>)[key] : undefined
  return value
}
export function attackValue(attack: DndAttack, id: string): string {
  const value = leaf(attack, id)
  return typeof value === 'boolean' ? value ? 'Yes' : 'No' : String(value ?? '')
}
export function validateAttackField(attack: DndAttack, id: string, value: unknown): string {
  const spec = attackFields(attack).find(spec => spec.id === id)
  if (!spec) return 'This field is no longer available.'
  const text = String(value ?? '').trim()
  if (!text && !spec.optional) return 'Enter a value; this field cannot be cleared.'
  if (spec.min !== undefined && (!text || !Number.isSafeInteger(Number(text)) || Number(text) < spec.min)) return `Enter a whole number of at least ${spec.min}.`
  if (spec.options && !spec.allowCustom && !spec.options.includes(text)) return 'Choose a listed value.'
  return ''
}
export function attackPatch(attack: DndAttack, id: string, value: unknown): Partial<DndAttack> {
  if (validateAttackField(attack, id, value)) return {}
  const spec = attackFields(attack).find(spec => spec.id === id)
  if (!spec) return {}
  const text = String(value ?? '').trim()
  const next = spec.boolean ? text === 'Yes' : spec.min !== undefined || id.endsWith('.dice') ? Number(text) : text
  const parts = id.split('.')
  if (parts[0] === 'additional') return { additionalDamage: attack.additionalDamage.map(extra => extra.id === decodeURIComponent(parts[1]) ? { ...extra, [parts[2]]: next } : extra) }
  // Copy only the owned path; retain extension fields, inactive values and every sibling.
  const copyPath = (object: Record<string, unknown>, keys: string[]): Record<string, unknown> => {
    const [key, ...rest] = keys
    return { ...object, [key]: rest.length ? copyPath(object[key] as Record<string, unknown>, rest) : next }
  }
  const root = parts[0]
  return { [root]: copyPath(attack as unknown as Record<string, unknown>, parts)[root] }
}
