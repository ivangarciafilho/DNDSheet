import test from 'node:test'
import assert from 'node:assert/strict'
import {
  formatLanguageItem, formatLanguagesList, formatMinimalistDeathPrevention, formatMinimalistRegen,
  isManufacturerLanguage, normalizeDeathPrevention, normalizeDeathRule, regenTimingPhrase,
} from '../../src/core/domain/defense-and-traits-utils.ts'
import { reactionCellPatch, reactionChainView } from '../../src/core/domain/reaction-composer.ts'
import { COMPOSER_ROW_ORDER } from '../../src/core/domain/action-composer.ts'
import type { MonsterExtendedHp, MonsterLanguageItem, MonsterReaction } from '../../src/core/domain/types.ts'

type Regen = NonNullable<MonsterExtendedHp['regeneration']>
type Dp = NonNullable<MonsterExtendedHp['deathPrevention']>

// The default monster ships these exact values (monster-store.ts).
const defaultRegen = (): Regen => ({
  enabled: true, recoveryType: 'regen', valueSource: 'flat', amount: 10, timeframe: 'turn', frequency: 'turn_start',
  diceFormula: '', disruptedByTypes: ['acid', 'fire'], disruptedByNote: '', displayMode: 'minimalist',
  conditionModifier: 'none', maxHpReductionUntil: 'short rest', styleMode: 'concise',
} as Regen)

test('regeneration amount prints when the default max-HP-reduction duration is present but not selected', () => {
  const text = formatMinimalistRegen(defaultRegen())
  assert.match(text, /10/)
  assert.doesNotMatch(text, /reduces maximum hit points/)
  const reduction = formatMinimalistRegen({ ...defaultRegen(), conditionModifier: 'max_hp_reduction' })
  assert.match(reduction, /reduces maximum hit points until short rest/)
})

test('regeneration trait timing follows the chosen frequency', () => {
  assert.equal(regenTimingPhrase(defaultRegen()), 'at the start of its turn')
  assert.equal(regenTimingPhrase({ ...defaultRegen(), frequency: 'turn_end' }), 'at the end of its turn')
  assert.equal(regenTimingPhrase({ ...defaultRegen(), frequency: 'dawn', timeframe: 'dawn' }), 'at dawn')
})

const undeadFortitude = (): Dp => ({
  enabled: true, name: 'Undead Fortitude', dcRule: 'CON save DC 5 + damage taken', returnHpSource: '1', returnHpValue: 1,
  returnHpDice: '2d8', requiresSave: false, saveStat: 'CON', saveDc: 15, hideHp: false, critHitsToKill: 3,
  exceptions: ['radiant', 'critical hit'], customNote: '', displayMode: 'minimalist',
} as Dp)

test('legacy label-valued death rules resolve to their option keys', () => {
  assert.equal(normalizeDeathRule('CON save DC 5 + damage taken'), 'dc_5_plus_dmg')
  assert.equal(normalizeDeathRule('custom_save'), 'custom_save')
  assert.match(formatMinimalistDeathPrevention(undeadFortitude()), /DC 5 \+ damage taken/)
  assert.doesNotMatch(formatMinimalistDeathPrevention(undeadFortitude()), /DC 15/)
})

test('a revival trigger left by an earlier rule stops printing once another rule is chosen', () => {
  const stale = { ...undeadFortitude(), dcRule: 'always_survives', triggerCondition: 'death_save_success' } as Dp
  assert.equal(normalizeDeathPrevention(stale).triggerCondition, undefined)
  assert.doesNotMatch(formatMinimalistDeathPrevention(stale), /Death Saving Throw/)
  const burst = { ...undeadFortitude(), dcRule: 'dc_5_plus_dmg', triggerCondition: 'upon_death_burst', uponDeathDealsDamage: true } as Dp
  assert.doesNotMatch(formatMinimalistDeathPrevention(burst), /Upon death/)
  const chosen = { ...undeadFortitude(), dcRule: 'death_save_success' } as Dp
  assert.match(formatMinimalistDeathPrevention(chosen), /Death Saving Throw Success/)
})

test('manufacturer language reads as understanding, optionally without speech', () => {
  const item = { name: 'Language of its Manufacturer' } as MonsterLanguageItem
  assert.ok(isManufacturerLanguage(item))
  assert.equal(formatLanguageItem(item), 'understands the language of its manufacturer')
  assert.equal(formatLanguageItem({ ...item, understandsOnly: true }), "understands the language of its manufacturer but can't speak")
  assert.equal(
    formatLanguagesList([{ name: 'Common' } as MonsterLanguageItem, { ...item, understandsOnly: true }]),
    "Common, understands the language of its manufacturer but can't speak",
  )
})

test('reaction trigger owns the row directly under the head, ahead of rolls and targets', () => {
  const reaction = { id: 'r', name: 'Parry', description: '', trigger: 'When hit', limitedUse: { count: 0, rate: 'DAY' } } as MonsterReaction
  const rows = reactionChainView(reaction, '')
  assert.deepEqual(rows.slice(0, 2).map(row => row.row), ['head', 'trigger'])
  const order = rows.map(row => COMPOSER_ROW_ORDER.indexOf(row.row))
  assert.deepEqual(order, [...order].sort((a, b) => a - b))
  assert.ok(order.every(index => index >= 0))
  assert.deepEqual(reactionCellPatch(reaction, 'trigger-placement', 'end'), { triggerPlacement: 'end' })
  assert.deepEqual(reactionCellPatch(reaction, 'trigger-placement', 'start'), { triggerPlacement: 'start' })
})
