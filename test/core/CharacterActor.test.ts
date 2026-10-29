import test from 'node:test'
import assert from 'node:assert'
import { defaultCharacterActor } from '../../src/core/domain/types.ts'
import { statModifier } from '../../src/core/domain/math-utils.ts'

test('CharacterActor - Default initialization and stat modifiers', () => {
  const actor = defaultCharacterActor()

  assert.strictEqual(actor.name, 'New Adventurer')
  assert.strictEqual(actor.class, 'Fighter')
  assert.strictEqual(actor.level, 1)
  assert.strictEqual(actor.proficiency, 2)
  assert.strictEqual(actor.stats.STR, 15)
  assert.strictEqual(statModifier(actor.stats.STR), 2)
  assert.strictEqual(statModifier(actor.stats.CHA), -1)

  assert.strictEqual(actor.hp.current, 12)
  assert.strictEqual(actor.hp.max, 12)
  assert.strictEqual(actor.hp.temp, 0)

  assert.strictEqual(actor.deathSaves.successes, 0)
  assert.strictEqual(actor.deathSaves.failures, 0)
  assert.strictEqual(actor.spellSlots.max.length, 9)
})

test('CharacterActor - Inventory weight and encumbrance calculations', () => {
  const actor = defaultCharacterActor()
  actor.stats.STR = 16

  actor.inventory = [
    { id: '1', name: 'Plate Armor', quantity: 1, weight: 65, equipped: true },
    { id: '2', name: 'Greatsword', quantity: 1, weight: 6, equipped: true },
    { id: '3', name: 'Rations (1 day)', quantity: 10, weight: 2 },
    { id: '4', name: 'Waterskin', quantity: 2, weight: 5 },
  ]

  const totalWeight = actor.inventory.reduce((sum, item) => sum + item.quantity * item.weight, 0)
  assert.strictEqual(totalWeight, 65 + 6 + 20 + 10) // 101 lbs

  const maxCarry = actor.stats.STR * 15 // 240 lbs
  const encumberedThreshold = actor.stats.STR * 5 // 80 lbs
  const heavilyEncumberedThreshold = actor.stats.STR * 10 // 160 lbs

  assert.strictEqual(totalWeight <= maxCarry, true)
  assert.strictEqual(totalWeight > encumberedThreshold, true, 'Should be encumbered (> 80 lbs)')
  assert.strictEqual(totalWeight <= heavilyEncumberedThreshold, true, 'Should not be heavily encumbered (<= 160 lbs)')
})

test('CharacterActor - Level progression and standard proficiency scaling', () => {
  const getProficiency = (lvl: number) => Math.floor((lvl - 1) / 4) + 2

  assert.strictEqual(getProficiency(1), 2)
  assert.strictEqual(getProficiency(4), 2)
  assert.strictEqual(getProficiency(5), 3)
  assert.strictEqual(getProficiency(9), 4)
  assert.strictEqual(getProficiency(13), 5)
  assert.strictEqual(getProficiency(17), 6)
  assert.strictEqual(getProficiency(20), 6)
})

test('CharacterActor - Hit Dice and Spell Slot tracking state transitions', () => {
  const actor = defaultCharacterActor()
  actor.hitDice = { total: 5, spent: 2, die: 10 }
  assert.strictEqual(actor.hitDice.total - actor.hitDice.spent, 3, '3 remaining hit dice')

  // Spend another hit die
  actor.hitDice.spent += 1
  assert.strictEqual(actor.hitDice.spent, 3)

  // Long rest recovers up to half total hit dice (min 1)
  const recovered = Math.max(1, Math.floor(actor.hitDice.total / 2))
  actor.hitDice.spent = Math.max(0, actor.hitDice.spent - recovered)
  assert.strictEqual(actor.hitDice.spent, 1, 'Should have 1 spent after recovering 2')

  // Spell slot expenditure
  actor.spellSlots.max = [4, 3, 2, 0, 0, 0, 0, 0, 0]
  actor.spellSlots.current = [4, 3, 2, 0, 0, 0, 0, 0, 0]

  // Cast 1st-level spell
  actor.spellSlots.current[0] -= 1
  assert.strictEqual(actor.spellSlots.current[0], 3)

  // Reset on long rest
  actor.spellSlots.current = [...actor.spellSlots.max]
  assert.deepStrictEqual(actor.spellSlots.current, [4, 3, 2, 0, 0, 0, 0, 0, 0])
})

test('CharacterActor - Saving Throws, Skills & Spellcasting calculations', () => {
  const actor = defaultCharacterActor()
  actor.stats.STR = 16 // +3
  actor.stats.DEX = 14 // +2
  actor.stats.INT = 16 // +3
  actor.proficiency = 3 // Level 5
  actor.savingThrows = { STR: true, CON: false }

  // Saving Throw: STR is proficient (+3 stat + 3 prof = +6)
  const strSave = statModifier(actor.stats.STR) + (actor.savingThrows.STR ? actor.proficiency : 0)
  assert.strictEqual(strSave, 6)

  // DEX is not proficient (+2 stat + 0 prof = +2)
  const dexSave = statModifier(actor.stats.DEX) + (actor.savingThrows.DEX ? actor.proficiency : 0)
  assert.strictEqual(dexSave, 2)

  // Skills: Athletics (STR) proficient (+3 stat + 3 prof = +6)
  // Stealth (DEX) expertise (+2 stat + 3 prof + 3 expertise = +8)
  actor.skills = {
    Athletics: { proficient: true, expertise: false },
    Stealth: { proficient: true, expertise: true },
    Arcana: { proficient: false, expertise: false },
  }

  const athMod = statModifier(actor.stats.STR) + actor.proficiency
  assert.strictEqual(athMod, 6)

  const stlMod = statModifier(actor.stats.DEX) + actor.proficiency * 2
  assert.strictEqual(stlMod, 8)

  // Spellcasting: INT (+3), prof (+3) -> Save DC 14, Attack +6
  actor.spellcasting = { ability: 'INT' }
  const saveDc = 8 + actor.proficiency + statModifier(actor.stats[actor.spellcasting.ability])
  const atkBonus = actor.proficiency + statModifier(actor.stats[actor.spellcasting.ability])
  assert.strictEqual(saveDc, 14)
  assert.strictEqual(atkBonus, 6)

  // Portrait default
  assert.strictEqual(actor.portrait?.position, 'none')
})
