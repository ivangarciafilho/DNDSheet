import { FORMULA_REFS } from '../formula.ts'
import type { DiceValue, FormulaGroupId, FormulaStyle } from '../formula.ts'
import { parseNumericFieldPath } from './field-path.ts'

export interface NumericFieldGate {
  readonly path: string
  readonly equals?: string | number | boolean | null
  readonly notEquals?: string | number | boolean | null
  readonly anyOf?: readonly NumericFieldGate[]
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
function freezeGate(gate: NumericFieldGate): NumericFieldGate {
  return Object.freeze({ ...gate, ...(gate.oneOf ? { oneOf: Object.freeze([...gate.oneOf]) } : {}), ...(gate.anyOf ? { anyOf: Object.freeze(gate.anyOf.map(freezeGate)) } : {}) })
}
function register(path: string, semanticType: NumericFieldSemantic, group: FormulaGroupId, options: Options = {}): void {
  if (fields.has(path)) throw new Error(`Duplicate numeric field descriptor: ${path}`)
  fields.set(path, Object.freeze({ path, type: 'integer', semanticType, style: semanticType === 'bonus' ? 'bonus' : 'number', group,
    allowedReferenceGroups: groups[semanticType], unit: semanticType === 'distance' ? 'ft' : semanticType === 'duration' ? 'minutes' : semanticType === 'hp' ? 'hp' : semanticType === 'round' ? 'rounds' : 'scalar',
    optional: false, nullable: false, bindingPolicy: 'binding', modePolicy: 'reviewed', ...options, editableWhen: Object.freeze((options.editableWhen ?? []).map(freezeGate)) }))
}
const optional = { optional: true } as const
const ov = (prefix: string): Options => ({ editableWhen: [eq(`${prefix}.override`, true)] })

/** A9.2 authored scalar whitelist, with no traversal or writes.
 * Identity-poor phases, outcome/effect occurrences, memberships and stagePool
 * need identity migration. Symbolic formulas, CR fractions, annotation multiplier
 * precision, presentation values and tracker state remain excluded. Slots remain
 * literal-table exceptions. Gate inspection uses stored model ownership; adapters
 * must resolve against the same context as their dependency source provider.
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
register(`${lang}.saveDc`, 'dc', 'save_dc', { ...optional, min: 1 })
// Mode ownership matches BasicsEditor and composeArmorClass. Type-only, unused
// fields conditionSecondaryBonus/parryCount/movedDistance are deliberately excluded.
const acMode = (values: readonly string[]): NumericFieldGate => ({ path: 'acConfig.conditionMode', oneOf: values })
const secondaryAcModes = Object.freeze([
  'parry', 'without_advantage', 'versus_damage_types', 'damage_type', 'while_cursed', 'near_ally',
  'while_moving', 'while_bloodied', 'bloodied', 'while_within_ally', 'while_within_shield_bearer',
  'while_prone', 'shield_spell', 'shield_of_faith', 'ranged_attacks', 'melee_attacks',
  'distance_away', 'first_attack_each_round', 'attacks_beyond_first', 'spell_attacks',
  'behind_flanking', 'while_flying', 'while_underwater', 'in_bright_light', 'in_daylight', 'in_darkness', 'in_light',
  'versus_bps', 'versus_creature_types', 'creature_type', 'attack_type', 'has_temp_hp', 'took_damage_since',
  'while_concentrating', 'asleep_unconscious',
])
register('acConfig.defenseItemCustomBonus', 'bonus', 'combat', { ...optional, editableWhen: [eq('acConfig.defenseItem', 'custom')] })
register('acConfig.temporaryCustomBonus', 'bonus', 'combat', { ...optional, editableWhen: [eq('acConfig.temporary', 'parry_custom')] })
register('acConfig.conditionalBonus', 'bonus', 'combat', { ...optional, editableWhen: [{ path: 'acConfig.conditional', oneOf: ['all_attacks_beyond_first', 'first_y_attacks'] }] })
register('acConfig.conditionalCount', 'count', 'combat', { ...optional, editableWhen: [eq('acConfig.conditional', 'first_y_attacks')] })
register('acConfig.secondaryAc', 'ac', 'combat', { ...optional, editableWhen: [acMode(secondaryAcModes)] })
register('acConfig.saveDc', 'dc', 'combat', { ...optional, editableWhen: [acMode(['attacker_save']), { path: 'acConfig.saveDcSource', oneOf: [undefined, 'custom'] }, { path: 'acConfig.saveDcCustom', present: false }] })
for (const outcome of ['Failure', 'Success']) register(`acConfig.onSave${outcome}DamageAmount`, 'damage', 'combat', { ...optional, editableWhen: [acMode(['attacker_save']), { path: `acConfig.onSave${outcome}`, oneOf: ['takes_damage', 'damage_attacker'] }] })
register('acConfig.onMissDistance', 'distance', 'combat', { ...optional, editableWhen: [eq('acConfig.onMiss', 'hits_target_feet')] })
register('acConfig.onMissDamageAmount', 'damage', 'combat', { ...optional, editableWhen: [eq('acConfig.onMiss', 'damage_attacker')] })
register('acConfig.onHitDamageAmount', 'damage', 'combat', { ...optional, editableWhen: [eq('acConfig.onHit', 'damage_attacker')] })
// saveDcCustom is a legacy alias; the current editor writes saveDc.
register('initiativeConfig.lairInitiative', 'count', 'combat', { ...optional, min: 0, max: 40, editableWhen: [eq('initiativeConfig.useLairInitiative', true)] })
register('legendaryActions.count', 'count', 'challenge', { min: 0, max: 99 })
register('paragonConfig.poolCount', 'count', 'hit_points', { min: 1, max: 10 })
register('paragonConfig.actionsPerTurn', 'count', 'challenge', { ...optional, editableWhen: [eq('paragonConfig.enabled', true)] })
register('paragonConfig.phaseConfigs[id=*].initiativeBonus', 'bonus', 'combat', { ...optional, nullable: true })
register('paragonConfig.phaseConfigs[id=*].hpOverride', 'hp', 'hit_points', { ...optional, nullable: true, min: 1 })
for (const [name, mode] of [['bloodiedOverride', 'bloodiedSource'], ['damageThreshold', 'damageThresholdSource'], ['damageReduction', 'damageReductionSource']] as const) register(`extendedHp.${name}`, 'hp', 'hit_points', { ...optional, nullable: true, ...(name === 'bloodiedOverride' ? { min: 1 } : {}), editableWhen: [{ path: `extendedHp.${mode}`, oneOf: Object.freeze(name === 'bloodiedOverride' ? ['flat'] : [undefined, 'none', 'flat']) }] })
register('extendedHp.tempHp.amount', 'hp', 'hit_points')
register('extendedHp.regeneration.amount', 'hp', 'hit_points', { min: 0, editableWhen: [{ path: 'extendedHp.regeneration.valueSource', oneOf: Object.freeze([undefined, 'flat']) }] })
const inv = 'extendedHp.invulnerability'
for (const [name, semantic] of [['nthAttack', 'count'], ['firstXCount', 'count'], ['saveDc', 'dc']] as const) register(`${inv}.${name}`, semantic, 'combat', { ...optional, editableWhen: [eq(`${inv}.enabled`, true)] })
const death = 'extendedHp.deathPrevention'
const deathActive = [eq(`${death}.enabled`, true), { path: `${death}.name`, present: true, notEquals: 'Mortal' }, neq(`${death}.name`, '')] as const
const visibleReturn = [...deathActive, neq(`${death}.hideHp`, true), neq(`${death}.dcRule`, 'until_x_crits')]
register(`${death}.critHitsToKill`, 'count', 'hit_points', { ...optional, editableWhen: [...deathActive, eq(`${death}.dcRule`, 'until_x_crits')] })
register(`${death}.returnHpValue`, 'hp', 'hit_points', { ...optional, min: 1, editableWhen: [...visibleReturn, eq(`${death}.returnHpSource`, 'flat')] })
register(`${death}.saveDc`, 'dc', 'save_dc', { ...optional, editableWhen: [...visibleReturn, { path: `${death}.enabled`, anyOf: [eq(`${death}.requiresSave`, true), eq(`${death}.dcRule`, 'custom_save')] }] })
const burstActive = [...deathActive, { path: `${death}.enabled`, anyOf: [eq(`${death}.dcRule`, 'upon_death_burst'), eq(`${death}.uponDeathDealsDamage`, true)] }]
register(`${death}.deathBurstDamageAmount`, 'damage', 'hit_points', { ...optional, min: 1, editableWhen: burstActive })
register(`${death}.deathBurstRange`, 'distance', 'movement', { ...optional, min: 5, editableWhen: burstActive })
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
for (const name of ['rollCount', 'beamCount', 'damageMultiplier']) {
  register(`${action}.rollScaling.${name}`, 'count', 'attack', { ...optional, min: 1, max: 99 })
  register(`${attack}.rollScaling.${name}`, 'count', 'attack', { ...optional, min: 1, max: 99 })
}
register(`${action}.targeting.range.distance`, 'distance', 'movement', { unit: 'record.targeting.range.unit' })
register(`${action}.targeting.area.distance`, 'distance', 'movement', { ...optional, unit: 'record.targeting.area.unit' })
for (const collection of ['traits','reactions']) {
 const prefix=collection+'[id=*]'
 register(prefix+'.attackBonus','bonus','attack',optional)
 register(prefix+'.save.overrideValue','dc','save_dc',ov(prefix+'.save'))
 register(prefix+'.targeting.count','count','attack',optional)
 register(prefix+'.rollScaling.rollCount','count','attack',{...optional,min:1,max:99})
 register(prefix+'.rollScaling.beamCount','count','attack',{...optional,min:1,max:99})
 register(prefix+'.rollScaling.damageMultiplier','count','attack',{...optional,min:1,max:99})
 register(prefix+'.targeting.range.distance','distance','movement',{unit:'record.targeting.range.unit'})
 register(prefix+'.targeting.area.distance','distance','movement',{...optional,unit:'record.targeting.area.unit'})
 for(const name of ['rechargeMin','rechargeMax']) register(prefix+'.'+name,'count','challenge',{...optional,min:1,max:100})
}
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
register('spellcasting.classes[id=*].preparedCountOverride', 'count', 'spellcasting', { ...optional, nullable: true, min: 0 })
for (const name of ['save', 'attack', 'modifier']) register('spellcasting.classes[id=*].'+name+'.overrideValue', name === 'save' ? 'dc' : 'bonus', 'spellcasting', ov('spellcasting.classes[id=*].'+name))
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
  const instantiateGate = (gate: NumericFieldGate): NumericFieldGate => freezeGate({ ...gate, path: instantiate(gate.path), ...(gate.anyOf ? { anyOf: gate.anyOf.map(instantiateGate) } : {}) })
  return Object.freeze({ ...field, path, editableWhen: Object.freeze(field.editableWhen.map(instantiateGate)) })
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

/** Immutable inventory for adoption coverage and invariant checks. */
export const NUMERIC_FIELD_CATALOG: readonly NumericFieldDescriptor[] = Object.freeze([...fields.values()])
