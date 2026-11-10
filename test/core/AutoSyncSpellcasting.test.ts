import test from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  autoSyncSpellcasting,
  getSpellSlotsForClass,
  calculateSpellcastingMetrics,
  calculateMulticlassSpellcasting,
  getSubclassesForClass,
} from '../../src/core/usecases/AutoSyncSpellcasting.ts'
import { getSpellMetadata, getSpellTagString } from '../../src/core/domain/spell-metadata.ts'
import { migrateMonsterSchema } from '../../src/core/usecases/MigrateMonsterSchema.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

test('AutoSyncSpellcasting - Wizard Level 9 Slot Progression & Save DC', () => {
  const templatePath = path.resolve(__dirname, '../../src/data/templates/monsters/Archmage.5emm.json')
  const raw = JSON.parse(fs.readFileSync(templatePath, 'utf8'))
  const archmage = migrateMonsterSchema(raw)

  // Configure as Level 9 Wizard
  archmage.spellcasting.level = 9
  archmage.spellcasting.class = 'Wizard'
  archmage.proficiency = 4 // standard for level 9 / CR 12

  const synced = autoSyncSpellcasting(archmage)

  // Full caster level 9 slots: [4, 3, 3, 3, 1, 0, 0, 0, 0]
  assert.deepStrictEqual(synced.spellcasting.slots, [4, 3, 3, 3, 1, 0, 0, 0, 0])
  assert.strictEqual(synced.spellcasting.stat, 'INT')
  // INT 20 (+5), Prof 4 -> DC 17, Attack +9
  assert.strictEqual(synced.spellcasting.save.overrideValue, 8 + 4 + 5)
  assert.strictEqual(synced.spellcasting.modifier.overrideValue, 4 + 5)
})

test('AutoSyncSpellcasting - Half Caster Paladin Slot Progression', () => {
  const slotsPaladin5 = getSpellSlotsForClass('Paladin', 5)
  assert.deepStrictEqual(slotsPaladin5, [4, 2, 0, 0, 0, 0, 0, 0, 0])

  const slotsPaladin1 = getSpellSlotsForClass('Paladin', 1)
  assert.deepStrictEqual(slotsPaladin1, [0, 0, 0, 0, 0, 0, 0, 0, 0])
})

test('AutoSyncSpellcasting - Warlock Pact Magic Slots', () => {
  const slotsWarlock5 = getSpellSlotsForClass('Warlock', 5)
  // Warlock 5 has 2 slots of 3rd level
  assert.deepStrictEqual(slotsWarlock5, [0, 0, 2, 0, 0, 0, 0, 0, 0])

  const slotsWarlock11 = getSpellSlotsForClass('Warlock', 11)
  // Warlock 11 has 3 slots of 5th level
  assert.deepStrictEqual(slotsWarlock11, [0, 0, 0, 0, 3, 0, 0, 0, 0])
})

test('AutoSyncSpellcasting - Spellcasting Metrics Calculation', () => {
  // Wizard 10, INT mod +4
  const wizardMetrics = calculateSpellcastingMetrics('Wizard', 10, 4)
  assert.strictEqual(wizardMetrics.cantripsKnown, 5)
  assert.strictEqual(wizardMetrics.preparedSpells, 14) // 10 + 4
  assert.strictEqual(wizardMetrics.highestSlot, 5) // ceil(10/2) = 5
  assert.strictEqual(wizardMetrics.casterType, 'full')

  // Sorcerer 6, CHA mod +3
  const sorcMetrics = calculateSpellcastingMetrics('Sorcerer', 6, 3)
  assert.strictEqual(sorcMetrics.cantripsKnown, 5)
  assert.strictEqual(sorcMetrics.preparedSpells, 7) // 6th level sorcerer knows 7 spells
  assert.strictEqual(sorcMetrics.highestSlot, 3)

  // Paladin 8, CHA mod +2
  const paladinMetrics = calculateSpellcastingMetrics('Paladin', 8, 2)
  assert.strictEqual(paladinMetrics.cantripsKnown, 0)
  assert.strictEqual(paladinMetrics.preparedSpells, 6) // floor(8/2) + 2 = 6
  assert.strictEqual(paladinMetrics.highestSlot, 2)
  assert.strictEqual(paladinMetrics.casterType, 'half')
})

test('AutoSyncSpellcasting - Multiclass 5e Calculation & Dual Save DCs', () => {
  const stats = { INT: 18, WIS: 14, CHA: 10, STR: 10, DEX: 10, CON: 10 }
  const proficiency = 3

  // Wizard 5 (INT +4) + Cleric 3 (WIS +2) -> Combined Level 8 (Full 5 + Full 3 = 8)
  const result = calculateMulticlassSpellcasting('Wizard', 5, 'Cleric', 3, stats, proficiency)
  assert.strictEqual(result.combinedCasterLevel, 8)
  // Level 8 full caster slots: [4, 3, 3, 2, 0, 0, 0, 0, 0]
  assert.deepStrictEqual(result.slots, [4, 3, 3, 2, 0, 0, 0, 0, 0])
  // Primary (Wizard): DC 8 + 3 + 4 = 15, Attack 3 + 4 = +7
  assert.strictEqual(result.primarySaveDc, 15)
  assert.strictEqual(result.primarySpellAttack, 7)
  // Secondary (Cleric): DC 8 + 3 + 2 = 13, Attack 3 + 2 = +5
  assert.strictEqual(result.secondarySaveDc, 13)
  assert.strictEqual(result.secondarySpellAttack, 5)
})

test('SpellMetadata - Components, Concentration and Rituals', () => {
  const fireball = getSpellMetadata('Fireball')
  assert.strictEqual(fireball.school, 'Evocation')
  assert.deepStrictEqual(fireball.components, ['V', 'S', 'M'])
  assert.strictEqual(fireball.concentration, false)
  assert.strictEqual(fireball.ritual, false)
  assert.strictEqual(getSpellTagString('Fireball'), 'V, S, M')

  const detectMagic = getSpellMetadata('Detect Magic')
  assert.strictEqual(detectMagic.school, 'Divination')
  assert.strictEqual(detectMagic.concentration, true)
  assert.strictEqual(detectMagic.ritual, true)
  assert.strictEqual(getSpellTagString('Detect Magic'), 'V, S, C, R')

  const mistyStep = getSpellMetadata('Misty Step')
  assert.deepStrictEqual(mistyStep.components, ['V'])
  assert.strictEqual(getSpellTagString('Misty Step'), 'V')
})

test('AutoSyncSpellcasting - Advanced Tri-Class Multiclassing & Subclasses', () => {
  const stats = { INT: 18, CHA: 16, WIS: 12, STR: 10, DEX: 10, CON: 14 }
  const proficiency = 4

  // Tri-class: Wizard 6 (Evocation) + Sorcerer 3 (Draconic) + Warlock 5 (Fiend)
  const classes = [
    { className: 'Wizard', subclass: 'Evocation', level: 6, stat: 'INT' as const },
    { className: 'Sorcerer', subclass: 'Draconic Bloodline', level: 3, stat: 'CHA' as const },
    { className: 'Warlock', subclass: 'Fiend', level: 5, stat: 'CHA' as const },
  ]

  const result = calculateMulticlassSpellcasting(classes, stats, proficiency)

  // Combined level for standard slots: Wizard 6 + Sorcerer 3 = 9
  assert.strictEqual(result.combinedCasterLevel, 9)
  // Level 9 full caster slots: [4, 3, 3, 3, 1, 0, 0, 0, 0]
  assert.deepStrictEqual(result.slots, [4, 3, 3, 3, 1, 0, 0, 0, 0])
  // Warlock 5 pact slots: [0, 0, 2, 0, 0, 0, 0, 0, 0] (2 of 3rd level)
  assert.deepStrictEqual(result.warlockSlots, [0, 0, 2, 0, 0, 0, 0, 0, 0])

  // Highest slot: Level 5
  assert.strictEqual(result.highestSlot, 5)

  // Breakdowns
  assert.strictEqual(result.classes?.length, 3)
  // Wizard: INT +4, prof 4 -> DC 16, Attack +8
  assert.strictEqual(result.classes?.[0].saveDc, 16)
  assert.strictEqual(result.classes?.[0].spellAttack, 8)
  assert.strictEqual(result.classes?.[0].subclass, 'Evocation')

  // Sorcerer: CHA +3, prof 4 -> DC 15, Attack +7
  assert.strictEqual(result.classes?.[1].saveDc, 15)
  assert.strictEqual(result.classes?.[1].spellAttack, 7)
  assert.strictEqual(result.classes?.[1].subclass, 'Draconic Bloodline')

  // Warlock: CHA +3, prof 4 -> DC 15, Attack +7
  assert.strictEqual(result.classes?.[2].saveDc, 15)
  assert.strictEqual(result.classes?.[2].spellAttack, 7)
  assert.strictEqual(result.classes?.[2].subclass, 'Fiend')
})

test('getSubclassesForClass - case-insensitive resolution across 5e classes', () => {
  // Uppercase from data store
  const warlockSubs = getSubclassesForClass('WARLOCK')
  assert.ok(warlockSubs.includes('Fiend'))
  assert.ok(warlockSubs.includes('Celestial'))
  assert.ok(warlockSubs.includes('Hexblade'))

  const wizardSubs = getSubclassesForClass('wizard')
  assert.ok(wizardSubs.includes('Evocation'))
  assert.ok(wizardSubs.includes('Bladesinging'))

  // Rogue and Fighter archetypes
  const rogueSubs = getSubclassesForClass('Rogue')
  assert.ok(rogueSubs.includes('Arcane Trickster'))
  assert.ok(rogueSubs.includes('Soulknife'))

  const fighterSubs = getSubclassesForClass('FIGHTER')
  assert.ok(fighterSubs.includes('Eldritch Knight'))
  assert.ok(fighterSubs.includes('Battle Master'))

  // Fallback on missing or undefined
  assert.ok(getSubclassesForClass(undefined).length > 0)
})

test('Custom contribution replaces Warlock pact progression with authored half-level slots', () => {
 const own = calculateMulticlassSpellcasting([{className:'Wizard',level:5},{className:'Warlock',level:6}])
 const pooled = calculateMulticlassSpellcasting([{className:'Wizard',level:5},{className:'Warlock',level:6,contribution:{mode:'custom',target:'slots',numerator:1,denominator:2}}])
 assert.strictEqual(own.combinedCasterLevel,5)
 assert.strictEqual(pooled.combinedCasterLevel,8)
 assert.strictEqual(pooled.warlockSlots,undefined)
 assert.strictEqual(pooled.totalCantripsKnown,own.totalCantripsKnown)
 assert.strictEqual(pooled.totalPreparedSpells,own.totalPreparedSpells)
})

test('Custom contribution supports inverse pact pooling, spell points and authored focus', () => {
 const pact=calculateMulticlassSpellcasting([{className:'Wizard',level:8,contribution:{mode:'custom',target:'pact',numerator:1,denominator:2}}])
 assert.deepStrictEqual(pact.warlockSlots,getSpellSlotsForClass('Warlock',4))
 const points=calculateMulticlassSpellcasting([{className:'Warlock',level:6,contribution:{mode:'custom',target:'points',numerator:1,denominator:2}}])
 assert.strictEqual(points.customPoints,14)
 assert.strictEqual(points.warlockSlots,undefined)
 const focus=calculateMulticlassSpellcasting([{className:'Custom focus caster',level:7,contribution:{mode:'custom',target:'focus',numerator:1,denominator:2,focusPerLevel:3}}])
 assert.strictEqual(focus.customFocus,9)
 assert.strictEqual(focus.totalPreparedSpells,0)
})

test('Invalid contribution fractions cannot invent resources', () => {
 for(const denominator of [0,-1,Infinity,NaN]) {
  const result=calculateMulticlassSpellcasting([{className:'Wizard',level:10,contribution:{mode:'custom',target:'slots',numerator:1,denominator}}])
  assert.ok(result.slots.every(value=>value===0))
 }
})

test('Legacy enabled secondary caster is retained as an owned source through migration', () => {
 const migrated=migrateMonsterSchema({saveVersion:11,spellcasting:{multiclass:{enabled:true,secondaryClass:'Cleric',secondaryLevel:3,secondaryStat:'WIS'}}})
 assert.strictEqual(migrated.spellcasting.classes?.[0].className,'Cleric')
 const again=migrateMonsterSchema(JSON.parse(JSON.stringify(migrated)))
 assert.strictEqual(again.spellcasting.classes?.length,1)
 assert.strictEqual(again.spellcasting.classes?.[0].id,'legacy-secondary-casting-source')
})

test('Shared source aggregate preserves explicit custom systems and ignores unsupported manual resources', async () => {
 const {aggregateSpellcastingSources}=await import('../../src/core/usecases/AutoSyncSpellcasting.ts')
 const result=aggregateSpellcastingSources({class:'Wizard',level:5,classes:[{className:'Focus adept',level:6,contribution:{mode:'custom',target:'focus',numerator:1,denominator:2,focusPerLevel:4}},{className:'Unspecified manual system',level:20}]})
 assert.strictEqual(result?.combinedCasterLevel,5)
 assert.strictEqual(result?.customFocus,12)
 assert.strictEqual(result?.classes?.length,2)
 assert.strictEqual(aggregateSpellcastingSources({class:'Unspecified manual system',level:20}),undefined)
})
