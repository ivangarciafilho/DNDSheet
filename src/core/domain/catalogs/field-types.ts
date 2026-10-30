import { FORMULA_REFS } from '../formula.ts'
import type { DiceValue, FormulaGroupId, FormulaStyle } from '../formula.ts'
import { parseNumericFieldPath } from './field-path.ts'

export interface NumericFieldGate {
  readonly path: string
  readonly equals?: string | number | boolean | null
  readonly notEquals?: string | number | boolean | null
  readonly present?: boolean
  readonly oneOf?: readonly (string | number | boolean | null | undefined)[]
}
export type NumericFieldSemantic = 'score' | 'bonus' | 'count' | 'dc' | 'hp' | 'ac' | 'distance' | 'duration' | 'die' | 'level' | 'round' | 'damage'
export interface NumericFieldDescriptor {
  readonly path: string
  readonly type: 'integer'
  readonly semanticType: NumericFieldSemantic
  readonly style: Exclude<FormulaStyle, 'dice'>
  readonly group: FormulaGroupId
  readonly allowedReferenceGroups: readonly FormulaGroupId[]
  readonly unit: string
  readonly min?: number
  readonly max?: number
  readonly catalog?: readonly number[]
  readonly optional: boolean
  /** Preserve existing null authorship; numeric binding results must be numbers. */
  readonly nullable: boolean
  readonly zeroMeaning?: string
  readonly bindingPolicy: 'binding' | 'literal-table'
  readonly editableWhen: readonly NumericFieldGate[]
  /** Binding adoption stays blocked until complex editor mode ownership is reconciled. */
  readonly modePolicy: 'reviewed' | 'pending'
}
type Options = Partial<Pick<NumericFieldDescriptor, 'min' | 'max' | 'catalog' | 'optional' | 'nullable' | 'zeroMeaning' | 'bindingPolicy' | 'editableWhen' | 'unit'>>
const dice = Object.freeze([1, 4, 6, 8, 10, 12, 20])
const groups: Record<NumericFieldSemantic, readonly FormulaGroupId[]> = {
  score: ['ability_score'], bonus: ['ability_mod', 'attack', 'saving_throw', 'proficiency', 'spellcasting', 'combat'],
  count: ['hit_points', 'proficiency', 'spellcasting', 'challenge'], dc: ['save_dc', 'spellcasting'],
  hp: ['hit_points'], ac: ['combat', 'ability_mod', 'proficiency'], distance: ['movement'],
  duration: ['spellcasting', 'challenge'], die: ['hit_points'], level: ['spellcasting'],
  round: ['challenge'], damage: ['hit_points', 'ability_mod', 'proficiency', 'spellcasting'],
}
for (const list of Object.values(groups)) Object.freeze(list)
const fields = new Map<string, NumericFieldDescriptor>()
const eq = (path: string, equals: string | number | boolean): NumericFieldGate => ({ path, equals })
const neq = (path: string, notEquals: string | number | boolean): NumericFieldGate => ({ path, notEquals })
function register(path: string, semanticType: NumericFieldSemantic, group: FormulaGroupId, options: Options = {}): void {
  fields.set(path, Object.freeze({ path, type: 'integer', semanticType, style: semanticType === 'bonus' ? 'bonus' : 'number', group,
    allowedReferenceGroups: groups[semanticType], unit: semanticType === 'distance' ? 'ft' : semanticType === 'duration' ? 'minutes' : semanticType === 'hp' ? 'hp' : semanticType === 'round' ? 'rounds' : 'scalar',
    optional: false, nullable: false, bindingPolicy: 'binding', modePolicy: path.startsWith('acConfig.') || /^extendedHp\.deathPrevention\.(saveDc|deathBurst)/.test(path) ? 'pending' : 'reviewed', ...options, editableWhen: Object.freeze((options.editableWhen ?? []).map(g => Object.freeze(g))) }))
}
const optional = { optional: true } as const
const ov = (prefix: string): Options => ({ editableWhen: [eq(`${prefix}.override`, true)] })

/** A9.2 authored scalar whitelist, with no traversal or writes.
 * Identity-poor phases, outcome/effect occurrences, memberships and stagePool
 * need identity migration. Symbolic formulas, CR fractions, annotation multiplier
 * precision, presentation values and tracker state remain excluded. Slots remain
 * literal-table exceptions. This registry alone is not ready for overlay adoption:
 * source ownership and gate evaluation must be integrated with the stored model.
 * Optional permits a missing final leaf, never a missing parent or record.
 */
for (const stat of ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA']) {
  register(`stats.${stat}`, 'score', 'ability_score', { min: 1, max: 30 })
  register(`saves.${stat}.overrideValue`, 'bonus', 'saving_throw', ov(`saves.${stat}`))
}
register('proficiency', 'bonus', 'proficiency', { min: 0, editableWhen: [eq('proficiencyOverride', true)] })
register('AC', 'ac', 'combat', { min: 0, editableWhen: [neq('acConfig.enabled', true)] })
register('HP.HD', 'count', 'hit_points', { min: 1 })
register('HP.type', 'die', 'hit_points', { catalog: dice, editableWhen: [eq('hpDieTypeOverride', true)] })
register('HP.modifier', 'bonus', 'hit_points', { editableWhen: [eq('hpModifierOverride', true)] })
register('passivePerception.overrideValue', 'score', 'movement', { nullable: true, ...ov('passivePerception') })
for (const key of ['perception', 'investigation', 'insight', 'survival', 'arcana', 'history', 'nature', 'religion', 'persuasion', 'deception', 'intimidation', 'animalHandling', 'stealth', 'performance']) register(`passives.${key}.overrideValue`, 'score', 'movement', { ...optional, nullable: true, ...ov(`passives.${key}`) })
register('skills[key=*].overrideValue', 'bonus', 'ability_mod', ov('skills[key=*]'))
register('tools[id=*].overrideValue', 'bonus', 'ability_mod', ov('tools[id=*]'))
register('speeds[id=*].speed', 'distance', 'movement')
for (const name of ['bonusActionSpeed', 'trackingSpeed', 'stealthSpeed']) register(`speedTraversal.${name}`, 'distance', 'movement', optional)
register('sensesList[id=*].range', 'distance', 'movement', { ...optional, unit: 'record.rangeUnit' })
register('sensesList[id=*].observationMinutes', 'duration', 'movement', { ...optional, min: 1 })
// Modern sense records own values; legacy senses.blindsight/etc are not a second authority.
const lang = 'languagesList[id=*]'
register(`${lang}.telepathyRange`, 'distance', 'movement', { ...optional, editableWhen: [eq(`${lang}.telepathy`, true)] })
for (const [name, gate] of [['probeSaveDc', 'probeRequiresSave'], ['sensorySaveDc', 'sensoryRequiresSave']] as const) register(`${lang}.${name}`, 'dc', 'save_dc', { ...optional, editableWhen: [eq(`${lang}.${gate}`, true)] })
register(`${lang}.animalHandling.dc`, 'dc', 'save_dc', { ...optional, editableWhen: [eq(`${lang}.animalHandling.enabled`, true)] })
register(`${lang}.undeadConfig.telepathicRange`, 'distance', 'movement', optional)
register(`${lang}.deadConfig.maxQuestions`, 'count', 'spellcasting', optional)
// Legacy language saveDc is compatibility state, not a parallel authored authority.
for (const name of ['defenseItemCustomBonus', 'temporaryCustomBonus', 'conditionalBonus', 'conditionSecondaryBonus']) register(`acConfig.${name}`, 'bonus', 'combat', { ...optional,
  editableWhen: name === 'defenseItemCustomBonus' ? [eq('acConfig.defenseItem', 'custom')] : name === 'temporaryCustomBonus' ? [eq('acConfig.temporary', 'parry_custom')] : [] })
for (const [name, semantic] of Object.entries({ conditionalCount: 'count', secondaryAc: 'ac', saveDc: 'dc', onSaveFailureDamageAmount: 'damage', onSaveSuccessDamageAmount: 'damage', parryCount: 'count', movedDistance: 'distance', onMissDistance: 'distance', onMissDamageAmount: 'damage', onHitDamageAmount: 'damage' }) as [string, NumericFieldSemantic][]) register(`acConfig.${name}`, semantic, 'combat', optional)
// saveDcCustom is a legacy alias; the current editor writes saveDc.
register('initiativeConfig.lairInitiative', 'count', 'combat', { ...optional, min: 0, max: 40, editableWhen: [eq('initiativeConfig.useLairInitiative', true)] })
register('legendaryActions.count', 'count', 'challenge', { min: 0, max: 99 })
register('paragonConfig.poolCount', 'count', 'hit_points', { min: 1, max: 10 })
register('paragonConfig.actionsPerTurn', 'count', 'challenge', { ...optional, editableWhen: [eq('paragonConfig.enabled', true)] })
for (const [name, mode] of [['bloodiedOverride', 'bloodiedSource'], ['damageThreshold', 'damageThresholdSource'], ['damageReduction', 'damageReductionSource']] as const) register(`extendedHp.${name}`, 'hp', 'hit_points', { ...optional, nullable: true, ...(name === 'bloodiedOverride' ? { min: 1 } : {}), editableWhen: [{ path: `extendedHp.${mode}`, oneOf: Object.freeze(name === 'bloodiedOverride' ? ['flat'] : [undefined, 'none', 'flat']) }] })
register('extendedHp.tempHp.amount', 'hp', 'hit_points')
register('extendedHp.regeneration.amount', 'hp', 'hit_points', { min: 0, editableWhen: [{ path: 'extendedHp.regeneration.valueSource', oneOf: Object.freeze([undefined, 'flat']) }] })
const inv = 'extendedHp.invulnerability'
for (const [name, semantic] of [['nthAttack', 'count'], ['firstXCount', 'count'], ['saveDc', 'dc']] as const) register(`${inv}.${name}`, semantic, 'combat', { ...optional, editableWhen: [eq(`${inv}.enabled`, true)] })
const death = 'extendedHp.deathPrevention'
register(`${death}.critHitsToKill`, 'count', 'hit_points', { ...optional, editableWhen: [eq(`${death}.enabled`, true), eq(`${death}.dcRule`, 'until_x_crits')] })
register(`${death}.returnHpValue`, 'hp', 'hit_points', { ...optional, min: 1, editableWhen: [eq(`${death}.enabled`, true), eq(`${death}.returnHpSource`, 'flat')] })
register(`${death}.saveDc`, 'dc', 'save_dc', { ...optional, editableWhen: [eq(`${death}.enabled`, true)] })
register(`${death}.deathBurstDamageAmount`, 'damage', 'hit_points', { ...optional, min: 1, editableWhen: [eq(`${death}.enabled`, true)] })
register(`${death}.deathBurstRange`, 'distance', 'movement', { ...optional, min: 5, editableWhen: [eq(`${death}.enabled`, true)] })
// returnHpAmount/critCount and extendedHp paragon aliases remain compatibility state.
const attack = 'attacks[id=*]'
register(`${attack}.modifier.overrideValue`, 'bonus', 'attack', ov(`${attack}.modifier`))
register(`${attack}.targets`, 'count', 'attack', { min: 1 })
register(`${attack}.save`, 'dc', 'save_dc', { ...optional, min: 0, zeroMeaning: 'no saving throw' })
for (const name of ['reach', 'standard', 'long']) register(`${attack}.range.${name}`, 'distance', 'movement', { min: 0 })
for (const prefix of ['damage', 'alternateDamage']) {
  const active = prefix === 'alternateDamage' ? [eq(`${attack}.alternateDamage.active`, true)] : []
  register(`${attack}.${prefix}.count`, 'count', 'hit_points', { min: 0, editableWhen: active })
  register(`${attack}.${prefix}.dice`, 'die', 'hit_points', { catalog: dice, editableWhen: active })
  register(`${attack}.${prefix}.modifier.overrideValue`, 'bonus', 'attack', { editableWhen: [...active, eq(`${attack}.${prefix}.modifier.override`, true)] })
}
register(`${attack}.additionalDamage[id=*].count`, 'count', 'hit_points', { min: 0 })
register(`${attack}.additionalDamage[id=*].dice`, 'die', 'hit_points', { catalog: dice })
const action = 'actions[id=*]'
register(`${action}.attackBonus`, 'bonus', 'attack', optional)
register(`${action}.save.overrideValue`, 'dc', 'save_dc', ov(`${action}.save`))
register(`${action}.limitedUse.count`, 'count', 'challenge', { min: 1, max: 999 })
for (const name of ['rechargeMin', 'rechargeMax']) register(`${action}.${name}`, 'count', 'challenge', { ...optional, min: 1, max: 100 })
register(`${action}.targeting.count`, 'count', 'attack', optional)
register(`${action}.targeting.range.distance`, 'distance', 'movement', { unit: 'record.targeting.range.unit' })
register(`${action}.targeting.area.distance`, 'distance', 'movement', { ...optional, unit: 'record.targeting.area.unit' })
for (const collection of ['traits', 'reactions']) register(`${collection}[id=*].limitedUse.count`, 'count', 'challenge', { min: 0, max: 999 })
register('traits[id=*].rechargeCount', 'count', 'challenge', { ...optional, nullable: true, min: 0, max: 999 })
for (const collection of ['traits', 'actions', 'lairActions']) {
  const prefix = `${collection}[id=*].crAnnotation`
  for (const [name, semantic] of [['maxDamage', 'damage'], ['maxSave', 'dc'], ['maxModifier', 'bonus'], ['ehpModifier', 'hp'], ['acModifier', 'bonus']] as const) register(`${prefix}.${name}`, semantic, 'challenge', { min: 0, editableWhen: [eq(`${prefix}.automatic`, false)] })
}
register('spellcasting.level', 'level', 'spellcasting', { min: 1, max: 20 })
for (const name of ['save', 'attack', 'modifier']) register(`spellcasting.${name}.overrideValue`, name === 'save' ? 'dc' : 'bonus', 'spellcasting', ov(`spellcasting.${name}`))
register('spellcasting.multiclass.secondaryLevel', 'level', 'spellcasting', { min: 1, max: 20, editableWhen: [eq('spellcasting.multiclass.enabled', true)] })
for (const [name, semantic] of [['secondarySaveDc', 'dc'], ['secondarySpellAttack', 'bonus']] as const) register(`spellcasting.multiclass.${name}`, semantic, 'spellcasting', { ...optional, editableWhen: [eq('spellcasting.multiclass.enabled', true)] })
register('spellcasting.classes[id=*].level', 'level', 'spellcasting', { min: 1, max: 20 })
register('spellcasting.atWill[id=*].count', 'count', 'spellcasting')
register('spellcasting.preparedCountOverride', 'count', 'spellcasting', { ...optional, nullable: true, min: 0 })
register('spellcasting.cantripSwitchCount', 'count', 'spellcasting', { min: 1, editableWhen: [eq('spellcasting.cantripSwitch', true)] })
register('spellcasting.metamagic.sorceryPoints', 'count', 'spellcasting', { min: 0, editableWhen: [eq('spellcasting.metamagic.enabled', true)] })
for (const prefix of ['spellcasting', 'spellcasting.classes[id=*]']) register(`${prefix}.slots[level=*]`, 'count', 'spellcasting', { min: 0, bindingPolicy: 'literal-table' })
register('anatomyParts[id=*].hp', 'hp', 'hit_points')
for (const [name, semantic] of [['ac', 'ac'], ['threshold', 'hp']] as const) register(`anatomyParts[id=*].${name}`, semantic, 'hit_points', optional)
register('reactiveActions[id=*].usesPerRound', 'count', 'challenge', optional)
register('villainActions[id=*].round', 'round', 'challenge', { catalog: Object.freeze([1, 2, 3]) })
register('runehammerTrack.events[id=*].round', 'round', 'challenge')

/** Exact whitelist with canonical selectors. Identity existence is checked by field-path. */
export function lookupNumericField(path: string): NumericFieldDescriptor | undefined {
  let segments: ReturnType<typeof parseNumericFieldPath>
  try { segments = parseNumericFieldPath(path) } catch { return undefined }
  const pattern = segments.map(segment => segment.name + (segment.selector ? `[${segment.selector.kind}=*]` : '')).join('.')
  const field = fields.get(pattern)
  if (!field) return undefined
  const selectors = segments.flatMap(s => s.selector ? [`[${s.selector.kind}=${encodeURIComponent(s.selector.value)}]`] : [])
  const instantiate = (value: string): string => { let index = 0; return value.replace(/\[(?:id|key|level)=\*\]/g, () => selectors[index++]) }
  return Object.freeze({ ...field, path, editableWhen: Object.freeze(field.editableWhen.map(gate => Object.freeze({ ...gate, path: instantiate(gate.path) }))) })
}
/** No coercion, rounding, averaging, clamping or model mutation. */
export function validateNumericFieldValue(path: string, value: unknown): void {
  const field = lookupNumericField(path)
  if (!field) throw new Error(`Unsupported numeric field: ${path}`)
  if (typeof value !== 'number' || !Number.isSafeInteger(value)) throw new Error(`Expected a finite safe integer for ${path}`)
  if (field.min !== undefined && value < field.min) throw new Error(`Value below minimum for ${path}`)
  if (field.max !== undefined && value > field.max) throw new Error(`Value above maximum for ${path}`)
  if (field.catalog && !field.catalog.includes(value)) throw new Error(`Value outside catalog for ${path}`)
}
export function validateNumericFieldDiceValue(path: string, value: DiceValue): void {
  if (!value || !Array.isArray(value.dice) || value.dice.length) throw new Error(`Dice terms are not scalar values for ${path}`)
  validateNumericFieldValue(path, value.flat)
}
export function isReferenceAllowedForField(path: string, referenceId: string): boolean {
  const field = lookupNumericField(path)
  if (!field || field.bindingPolicy !== 'binding') return false
  const token = referenceId.toUpperCase()
  const ref = FORMULA_REFS.find(item => item.id === token || item.aliases?.includes(token))
  return !!ref && ref.style !== 'dice' && field.allowedReferenceGroups.includes(ref.group)
}
