import test from 'node:test'
import assert from 'node:assert/strict'
import {
  composePermutableAcString,
  formatAcAttackerSave,
  formatPermutableAcClause,
  type PermutableAcCondition,
} from '../../src/core/domain/ac-defense-composer.ts'
import {
  composeHpSurvivalString,
  formatHpSurvivalRule,
  type HpSurvivalRule,
} from '../../src/core/domain/hp-defense-composer.ts'
import {
  composeSpeedWithRiders,
  formatTraversalCunningRider,
  type TraversalCunningRider,
} from '../../src/core/domain/speeds-traversal.ts'

test('Modular Composers - Armor Class 8 Permutations Suite', () => {
  // Sample 1: Attacker Save with creature advantage and success/failure outcomes
  const cond1: PermutableAcCondition = {
    mode: 'attacker_save',
    save: {
      stat: 'Charisma',
      dc: 15,
      targetAdvantage: 'Fiends have Advantage',
      onSuccess: {
        target: 'Attacker',
        damage: '9 (2d8)',
        type: 'Radiant',
      },
      otherwise: {
        double: true,
        knocksProne: true,
      },
    },
  }
  assert.equal(
    composePermutableAcString(15, cond1),
    'Attacker must succeed a Charisma Save DC 15 (Fiends have Advantage), On Success Attacker takes 9 (2d8) of Radiant, otherwise double, and knocks prone'
  )

  // Sample 2: Attacker Save with Bloodied DC and otherwise double knocks prone
  const cond2: PermutableAcCondition = {
    mode: 'attacker_save',
    save: {
      stat: 'Charisma',
      dc: 15,
      bloodiedDc: 20,
      onSuccess: {
        target: 'Attacker',
        damage: '9 (2d8)',
        type: 'Radiant',
      },
      otherwise: {
        double: true,
        knocksProne: true,
      },
    },
  }
  assert.equal(
    composePermutableAcString(15, cond2),
    'Attacker must succeed a Charisma Save DC 15 (20 when Bloodied), On Success Attacker takes 9 (2d8) of Radiant, otherwise double, and knocks prone'
  )

  // Sample 3: AC 20, 15 without temporary hit points
  const cond3: PermutableAcCondition = {
    mode: 'without_temp_hp',
    secondaryAc: 15,
  }
  assert.equal(
    composePermutableAcString(20, cond3),
    '20, 15 without temporary hit points'
  )

  // Sample 4: AC 20, 15 versus attacks that deals Lightning, force or thunder .
  const cond4: PermutableAcCondition = {
    mode: 'versus_damage_types',
    secondaryAc: 15,
    damageTypes: ['Lightning', 'force or thunder'],
  }
  assert.equal(
    composePermutableAcString(20, cond4),
    '20, 15 versus attacks that deals Lightning, force or thunder'
  )

  // Sample 5: AC 15, 20 from 3/4 Cover, while Grappling a creature
  const cond5: PermutableAcCondition = {
    mode: 'cover_while_grappling',
    secondaryAc: 20,
    cover: '3/4 Cover',
    grappleTarget: 'a creature',
  }
  assert.equal(
    composePermutableAcString(15, cond5),
    '15, 20 from 3/4 Cover, while Grappling a creature'
  )

  // Sample 6: AC 15, 20, while Grappling a creature
  const cond6: PermutableAcCondition = {
    mode: 'while_grappling',
    secondaryAc: 20,
    grappleTarget: 'a creature',
  }
  assert.equal(
    composePermutableAcString(15, cond6),
    '15, 20, while Grappling a creature'
  )

  // Sample 7: AC 15, On Hit : Attacker takes 5 of Fire .
  const cond7: PermutableAcCondition = {
    mode: 'on_hit',
    onHit: {
      target: 'Attacker',
      damage: 5,
      damageType: 'Fire',
    },
  }
  assert.equal(
    composePermutableAcString(15, cond7),
    '15, On Hit: Attacker takes 5 of Fire.'
  )

  // Sample 8: AC 15, On Hit : Attacker takes 5 of Fire, double if you're bloodied.
  const cond8: PermutableAcCondition = {
    mode: 'on_hit',
    onHit: {
      target: 'Attacker',
      damage: 5,
      damageType: 'Fire',
      doubleIfBloodied: true,
    },
  }
  assert.equal(
    composePermutableAcString(15, cond8),
    "15, On Hit: Attacker takes 5 of Fire, double if you're bloodied."
  )
})

test('Modular Composers - Hit Points 28 Defense Survival Rules Suite', () => {
  const base = 'HP 112 (15d8+45)'
  const baseBloodied = 'HP 112/56 Bloodied (15d8+45)'

  // Rule 1: At end of turn with 0 hit points, return to 1
  assert.equal(
    composeHpSurvivalString(base, [{ type: 'revival', trigger: 'at_end_of_turn_0hp', returnHp: 1 }]),
    'HP 112 (15d8+45), At end of turn with 0 hit points, return to 1'
  )

  // Rule 2: When reduced to 0 hit points by non radiant, or non Critical Hit, return to 1
  assert.equal(
    composeHpSurvivalString(base, [{ type: 'revival', exceptions: ['non radiant', 'non Critical Hit'], returnHp: 1 }]),
    'HP 112 (15d8+45), When reduced to 0 hit points by non radiant, or non Critical Hit, return to 1'
  )

  // Rule 3: When reduced to 0 hit points by non necrotic, or non Critical Hit, return to 1
  assert.equal(
    composeHpSurvivalString(base, [{ type: 'revival', exceptions: ['non necrotic', 'non Critical Hit'], returnHp: 1 }]),
    'HP 112 (15d8+45), When reduced to 0 hit points by non necrotic, or non Critical Hit, return to 1'
  )

  // Rule 4: When reduced to 0 hit points by non radiant, or non Critical Hit, Make a Constitution Save DC 5 + damage taken, On Success Return to 1
  assert.equal(
    composeHpSurvivalString(base, [{
      type: 'save_revival',
      exceptions: ['non radiant', 'non Critical Hit'],
      saveStat: 'Constitution',
      saveDcFormula: '5 + damage taken',
      onSuccessReturnHp: 1,
    }]),
    'HP 112 (15d8+45), When reduced to 0 hit points by non radiant, or non Critical Hit, Make a Constitution Save DC 5 + damage taken, On Success Return to 1'
  )

  // Rule 5: When reduced to 0 hit points by non necrotic, or non Critical Hit, Make a Constitution Save DC 5 + damage taken, On Success Return to 1, On Failure Creatures 20ft of you takes 3d8 of Radiant
  assert.equal(
    composeHpSurvivalString(base, [{
      type: 'save_revival',
      exceptions: ['non necrotic', 'non Critical Hit'],
      saveStat: 'Constitution',
      saveDcFormula: '5 + damage taken',
      onSuccessReturnHp: 1,
      onFailureBurst: {
        range: 20,
        target: 'Creatures',
        damage: '3d8',
        damageType: 'Radiant',
      },
    }]),
    'HP 112 (15d8+45), When reduced to 0 hit points by non necrotic, or non Critical Hit, Make a Constitution Save DC 5 + damage taken, On Success Return to 1, On Failure Creatures 20ft of you takes 3d8 of Radiant'
  )

  // Rule 6: When reduced to 0 hit points, Creatures 20ft of you takes 3d8 of Necrotic
  assert.equal(
    composeHpSurvivalString(base, [{
      type: 'death_burst',
      trigger: 'when_reduced_to_0',
      burstRange: 20,
      burstTarget: 'Creatures',
      burstDamage: '3d8',
      burstDamageType: 'Necrotic',
    }]),
    'HP 112 (15d8+45), When reduced to 0 hit points, Creatures 20ft of you takes 3d8 of Necrotic'
  )

  // Rule 7: When destroyed, Creatures 20ft of you takes 3d8 of Necrotic
  assert.equal(
    composeHpSurvivalString(base, [{
      type: 'death_burst',
      trigger: 'when_destroyed',
      burstRange: 20,
      burstTarget: 'Creatures',
      burstDamage: '3d8',
      burstDamageType: 'Necrotic',
    }]),
    'HP 112 (15d8+45), When destroyed, Creatures 20ft of you takes 3d8 of Necrotic'
  )

  // Rule 8: When reduced to 0 hit points, Allies 10ft of you Regains 2d8
  assert.equal(
    composeHpSurvivalString(base, [{
      type: 'death_burst',
      trigger: 'when_reduced_to_0',
      burstRange: 10,
      burstTarget: 'Allies',
      burstHealAllies: '2d8',
    }]),
    'HP 112 (15d8+45), When reduced to 0 hit points, Allies 10ft of you Regains 2d8'
  )

  // Rule 9: When destroyed, Allies 10ft of you Regains 2d8
  assert.equal(
    composeHpSurvivalString(base, [{
      type: 'death_burst',
      trigger: 'when_destroyed',
      burstRange: 10,
      burstTarget: 'Allies',
      burstHealAllies: '2d8',
    }]),
    'HP 112 (15d8+45), When destroyed, Allies 10ft of you Regains 2d8'
  )

  // Rule 10: When destroyed, Returns to life within 1d4 days
  assert.equal(
    composeHpSurvivalString(base, [{
      type: 'revival',
      trigger: 'when_destroyed',
      timeframe: 'within 1d4 days',
    }]),
    'HP 112 (15d8+45), When destroyed, Returns to life within 1d4 days'
  )

  // Rule 11: When reduced to 0 hit points, Allies 5ft of you Regains 2d8, enemies 20ft of you takes 3d8 of Necrotic
  assert.equal(
    composeHpSurvivalString(base, [{
      type: 'multi_death_burst',
      trigger: 'when_reduced_to_0',
      burstRange: 5,
      burstHealAllies: '2d8',
      burstEnemiesDamage: '3d8',
      burstEnemiesType: 'Necrotic',
    }]),
    'HP 112 (15d8+45), When reduced to 0 hit points, Allies 5ft of you Regains 2d8, enemies 20ft of you takes 3d8 of Necrotic'
  )

  // Rule 12: While Bloodied, Enemies 10ft of you Takes 5 of Psychic
  assert.equal(
    composeHpSurvivalString(baseBloodied, [{
      type: 'bloodied_aura',
      auraRange: 10,
      auraTarget: 'Enemies',
      auraDamage: '5',
      auraDamageType: 'Psychic',
    }]),
    'HP 112/56 Bloodied (15d8+45), While Bloodied, Enemies 10ft of you Takes 5 of Psychic'
  )

  // Rule 13: While Bloodied, Enemies 10ft of you Takes 3d8 of Fire
  assert.equal(
    composeHpSurvivalString(baseBloodied, [{
      type: 'bloodied_aura',
      auraRange: 10,
      auraTarget: 'Enemies',
      auraDamage: '3d8',
      auraDamageType: 'Fire',
    }]),
    'HP 112/56 Bloodied (15d8+45), While Bloodied, Enemies 10ft of you Takes 3d8 of Fire'
  )

  // Rule 14: 20 Temporary Hit Points At start of turn, When Temporary Hit Points Reduced to 0, Creatures 10ft of you takes 1d10 of Force, and knocks Prone.
  assert.equal(
    composeHpSurvivalString(base, [{
      type: 'temp_hp_retaliation',
      tempHpAmount: 20,
      tempHpBreakRange: 10,
      tempHpBreakDamage: '1d10',
      tempHpBreakType: 'Force',
      tempHpBreakProne: true,
    }]),
    'HP 112 (15d8+45), 20 Temporary Hit Points At start of turn, When Temporary Hit Points Reduced to 0, Creatures 10ft of you takes 1d10 of Force, and knocks Prone.'
  )

  // Rule 15: Once per round Ally 10ft of you regains damage taken.
  assert.equal(
    composeHpSurvivalString(base, [{
      type: 'ally_damage_sharing',
      allyCadence: 'Once per round',
      allyRange: 10,
      allyBenefit: 'regains damage taken',
    }]),
    'HP 112 (15d8+45), Once per round Ally 10ft of you regains damage taken.'
  )

  // Rule 16: Ally 10ft of you regains 1d8.
  assert.equal(
    composeHpSurvivalString(base, [{
      type: 'ally_damage_sharing',
      allyRange: 10,
      allyBenefit: 'regains 1d8',
    }]),
    'HP 112 (15d8+45), Ally 10ft of you regains 1d8.'
  )

  // Rule 17: Ally 10ft of you regains half of the damage taken.
  assert.equal(
    composeHpSurvivalString(base, [{
      type: 'ally_damage_sharing',
      allyRange: 10,
      allyBenefit: 'regains half of the damage taken',
    }]),
    'HP 112 (15d8+45), Ally 10ft of you regains half of the damage taken.'
  )

  // Rule 18: Ally 10ft of you gains half of the damage taken as temporary hit points.
  assert.equal(
    composeHpSurvivalString(base, [{
      type: 'ally_damage_sharing',
      allyRange: 10,
      allyBenefit: 'gains half of the damage taken as temporary hit points',
    }]),
    'HP 112 (15d8+45), Ally 10ft of you gains half of the damage taken as temporary hit points.'
  )

  // Rule 19: Ally 10ft of you gains 1d8 of temporary hit points.
  assert.equal(
    composeHpSurvivalString(base, [{
      type: 'ally_damage_sharing',
      allyRange: 10,
      allyBenefit: 'gains 1d8 of temporary hit points',
    }]),
    'HP 112 (15d8+45), Ally 10ft of you gains 1d8 of temporary hit points.'
  )

  // Rule 20: When stabilized regains 1 hit point in 1d4 of rounds.
  assert.equal(
    composeHpSurvivalString(base, [{
      type: 'stabilization',
      stabilizeHp: 1,
      stabilizeRounds: '1d4',
    }]),
    'HP 112 (15d8+45), When stabilized regains 1 hit point in 1d4 of rounds.'
  )

  // Rule 21: Regains double the hit points.
  assert.equal(
    composeHpSurvivalString(base, [{ type: 'healing_multiplier' }]),
    'HP 112 (15d8+45), Regains double the hit points.'
  )

  // Rule 22: 10 of DT, Stunned when damage higher than DT.
  assert.equal(
    composeHpSurvivalString(base, [{
      type: 'damage_threshold',
      dtAmount: 10,
      dtCondition: 'Stunned',
    }]),
    'HP 112 (15d8+45), 10 of DT, Stunned when damage higher than DT.'
  )

  // Rule 23: 10 of DT, Stunned when Lightning damage higher than DT.
  assert.equal(
    composeHpSurvivalString(base, [{
      type: 'damage_threshold',
      dtAmount: 10,
      dtCondition: 'Stunned',
      dtDamageType: 'Lightning',
    }]),
    'HP 112 (15d8+45), 10 of DT, Stunned when Lightning damage higher than DT.'
  )

  // Rule 24: 10 of DT, Paralyzed when Psychic damage higher than DT.
  assert.equal(
    composeHpSurvivalString(base, [{
      type: 'damage_threshold',
      dtAmount: 10,
      dtCondition: 'Paralyzed',
      dtDamageType: 'Psychic',
    }]),
    'HP 112 (15d8+45), 10 of DT, Paralyzed when Psychic damage higher than DT.'
  )

  // Rule 25: creatures which it communicates Telepathically takes Psychic taken.
  assert.equal(
    composeHpSurvivalString(base, [{
      type: 'telepathic_damage',
      telepathicTarget: 'creatures',
      telepathicDamage: 'Psychic taken',
    }]),
    'HP 112 (15d8+45), creatures which it communicates Telepathically takes Psychic taken.'
  )

  // Rule 26: enemies which it communicates Telepathically takes 1d8 Psychic.
  assert.equal(
    composeHpSurvivalString(base, [{
      type: 'telepathic_damage',
      telepathicTarget: 'enemies',
      telepathicDamage: '1d8 Psychic',
    }]),
    'HP 112 (15d8+45), enemies which it communicates Telepathically takes 1d8 Psychic.'
  )

  // Rule 27: Creatures Grappled by you takes Half of damage taken.
  assert.equal(
    composeHpSurvivalString(base, [{
      type: 'grappled_damage',
      grappleRelation: 'grappled_by_you',
      grappledDamageFraction: 'Half of damage taken',
    }]),
    'HP 112 (15d8+45), Creatures Grappled by you takes Half of damage taken.'
  )

  // Rule 28: Creatures Grappled by you or Grappling you takes Half of damage taken.
  assert.equal(
    composeHpSurvivalString(base, [{
      type: 'grappled_damage',
      grappleRelation: 'grappled_or_grappling',
      grappledDamageFraction: 'Half of damage taken',
    }]),
    'HP 112 (15d8+45), Creatures Grappled by you or Grappling you takes Half of damage taken.'
  )
})

test('Modular Composers - Traversal and Cunning Actions 10 Riders Suite', () => {
  const base30 = '30ft'
  const base10 = '10ft'
  const base20 = '20ft'

  // Rider 1: 30ft, Disengage (can enter the Ethereal Plane).
  assert.equal(
    composeSpeedWithRiders(base30, [{
      actions: ['Disengage'],
      rider: 'can enter the Ethereal Plane',
    }]) + '.',
    '30ft, Disengage (can enter the Ethereal Plane).'
  )

  // Rider 2: 30ft, Dash or Dodge (can move through occupied spaces as difficult terrain, at end of turn, shunts into closest unoccupied space taking 1d10 Force per 5ft).
  assert.equal(
    composeSpeedWithRiders(base30, [{
      actions: ['Dash', 'Dodge'],
      rider: 'can move through occupied spaces as difficult terrain, at end of turn, shunts into closest unoccupied space taking 1d10 Force per 5ft',
    }]) + '.',
    '30ft, Dash or Dodge (can move through occupied spaces as difficult terrain, at end of turn, shunts into closest unoccupied space taking 1d10 Force per 5ft).'
  )

  // Rider 3: 30ft, Disengage (Bonus Action, or as an Action to Grapple or Shove a creature 5ft of you)
  assert.equal(
    composeSpeedWithRiders(base30, [{
      actions: ['Disengage'],
      rider: 'Bonus Action, or as an Action to Grapple or Shove a creature 5ft of you',
    }]),
    '30ft, Disengage (Bonus Action, or as an Action to Grapple or Shove a creature 5ft of you)'
  )

  // Rider 4: 30ft, Dash (Until end of turn: Advantage on Strength and Dexterity Saving Throws and Ability Checks)
  assert.equal(
    composeSpeedWithRiders(base30, [{
      actions: ['Dash'],
      rider: 'Until end of turn: Advantage on Strength and Dexterity Saving Throws and Ability Checks',
    }]),
    '30ft, Dash (Until end of turn: Advantage on Strength and Dexterity Saving Throws and Ability Checks)'
  )

  // Rider 5: 10ft, Dash (Once per turn: Teleport up to 10ft to a point you can see.)
  assert.equal(
    composeSpeedWithRiders(base10, [{
      actions: ['Dash'],
      rider: 'Once per turn: Teleport up to 10ft to a point you can see.',
    }]),
    '10ft, Dash (Once per turn: Teleport up to 10ft to a point you can see.)'
  )

  // Rider 6: 10ft, Dash (Once per turn: Teleport up to 10ft to a point familiar to you.)
  assert.equal(
    composeSpeedWithRiders(base10, [{
      actions: ['Dash'],
      rider: 'Once per turn: Teleport up to 10ft to a point familiar to you.',
    }]),
    '10ft, Dash (Once per turn: Teleport up to 10ft to a point familiar to you.)'
  )

  // Rider 7: 20ft, Dash (Once per turn: Teleport to your starting position this turn.)
  assert.equal(
    composeSpeedWithRiders(base20, [{
      actions: ['Dash'],
      rider: 'Once per turn: Teleport to your starting position this turn.',
    }]),
    '20ft, Dash (Once per turn: Teleport to your starting position this turn.)'
  )

  // Rider 8: 20ft, Dash or Disengage (At end of turn: Teleport to your starting position this turn.)
  assert.equal(
    composeSpeedWithRiders(base20, [{
      actions: ['Dash', 'Disengage'],
      rider: 'At end of turn: Teleport to your starting position this turn.',
    }]),
    '20ft, Dash or Disengage (At end of turn: Teleport to your starting position this turn.)'
  )

  // Rider 9: 20ft, Dash (At end of turn: Teleport to your starting position this turn.)
  assert.equal(
    composeSpeedWithRiders(base20, [{
      actions: ['Dash'],
      rider: 'At end of turn: Teleport to your starting position this turn.',
    }]),
    '20ft, Dash (At end of turn: Teleport to your starting position this turn.)'
  )

  // Rider 10: 30ft, Dash, or Disengage (Until end of turn: When a creature leaves 5ft of you, it takes 5 of Fire.)
  assert.equal(
    composeSpeedWithRiders(base30, [{
      actions: ['Dash', 'Disengage'],
      separator: ', or ',
      rider: 'Until end of turn: When a creature leaves 5ft of you, it takes 5 of Fire.',
    }]),
    '30ft, Dash, or Disengage (Until end of turn: When a creature leaves 5ft of you, it takes 5 of Fire.)'
  )
})

test('Modular Composers - Actions & Traits Studio 4 Compositions Suite', async () => {
  const { formatStructuredStudioActionPlate } = await import('../../src/core/domain/structured-studio-action.ts')

  // Sample 1: Astral Binding (An Action)
  // | <Recharge (4-12)>, <Astral Binding <(<V>,<S>)>>, <Cantrip> <Evocation> | <3> <Ranged> <Spell Attacks> of <+7> <(▲▲ <Versus <Undeads>>)>, <<Enemies> <you can see> <60ft> <of you>> <across <<Ethereal>, and <Material> planes>>. | 
  // | On Hit: takes 9 (1d8 + 5) Radiant, speed reduced by 10ft, if 0ft at End Of Turn, its knocked Prone.|
  const astralBinding = {
    name: 'Astral Binding',
    role: 'action' as const,
    recharge: '4-12',
    components: ['V', 'S'],
    spellLevel: 'Cantrip',
    school: 'Evocation',
    attackCount: 3,
    attackReach: 'ranged' as const,
    attackSource: 'spell' as const,
    attackBonus: 7,
    advantageAgainst: 'Undeads',
    targetKind: 'Enemies',
    targetQualifier: 'you can see',
    targetRange: '60ft of you',
    targetPlanes: ['Ethereal', 'Material'],
    outcomes: [
      {
        trigger: 'On Hit',
        damage: '9 (1d8 + 5)',
        damageType: 'Radiant',
        rider: 'speed reduced by 10ft, if 0ft at End Of Turn, its knocked Prone.',
      },
    ],
  }
  const astralPlates = formatStructuredStudioActionPlate(astralBinding)
  assert.equal(
    astralPlates[0],
    '| Recharge (4-12), Astral Binding (V, S), Cantrip Evocation | 3 Ranged Spell Attacks of +7 (▲▲ Versus Undeads), Enemies you can see 60ft of you across Ethereal and Material planes. |'
  )
  assert.equal(
    astralPlates[1],
    '| On Hit: takes 9 (1d8 + 5) Radiant, speed reduced by 10ft, if 0ft at End Of Turn, its knocked Prone. |'
  )

  // Sample 2: Exorcism (A Bonus Action)
  // | <Recharge (8-12)>, <Exorcism <(<V>,<S>)>>, <Cantrip> <Abjuration> | <<Enemies> <60ft> <of you>>, <across <<Ethereal>, and <Material Planes>>, <Charisma Save> DC <15> <(<Undeads> have <Disadvantage>)>>. | 
  // | On Success: takes 13 (3d8 + 5) Radiant.|
  // | On Failure: double and until End Of Turn, Suppresses its effects leaving one or more creatures Possessed or Charmed by it, brought into the Material Plane if on the Ethereal Plane to closest unoccupied space, without Immunity to being Grappled and Prone.|
  const exorcism = {
    name: 'Exorcism',
    role: 'bonus_action' as const,
    recharge: '8-12',
    components: ['V', 'S'],
    spellLevel: 'Cantrip',
    school: 'Abjuration',
    targetKind: 'Enemies',
    targetRange: '60ft of you',
    targetPlanes: ['Ethereal', 'Material'],
    saveStat: 'Charisma',
    saveDc: 15,
    disadvantageAgainst: 'Undeads',
    outcomes: [
      {
        trigger: 'On Success',
        damage: '13 (3d8 + 5)',
        damageType: 'Radiant.',
      },
      {
        trigger: 'On Failure',
        rider: 'double and until End Of Turn, Suppresses its effects leaving one or more creatures Possessed or Charmed by it, brought into the Material Plane if on the Ethereal Plane to closest unoccupied space, without Immunity to being Grappled and Prone.',
      },
    ],
  }
  const exorcismPlates = formatStructuredStudioActionPlate(exorcism)
  assert.equal(
    exorcismPlates[0],
    '| Recharge (8-12), Exorcism (V, S), Cantrip Abjuration | Enemies 60ft of you across Ethereal and Material planes, Charisma Save DC 15 (Undeads have Disadvantage). |'
  )
  assert.equal(
    exorcismPlates[1],
    '| On Success: takes 13 (3d8 + 5) Radiant. |'
  )
  assert.equal(
    exorcismPlates[2],
    '| On Failure: double and until End Of Turn, Suppresses its effects leaving one or more creatures Possessed or Charmed by it, brought into the Material Plane if on the Ethereal Plane to closest unoccupied space, without Immunity to being Grappled and Prone. |'
  )

  // Sample 3: Inner Light (A Trait)
  // | When you have to expend a HD, treat as if you expended a d12 instead and use its rolled value to check if you Recharges any of your Actions.|
  const innerLight = {
    name: 'Inner Light',
    role: 'trait' as const,
    description: '| When you have to expend a HD, treat as if you expended a d12 instead and use its rolled value to check if you Recharges any of your Actions.|',
  }
  const innerLightPlates = formatStructuredStudioActionPlate(innerLight)
  assert.equal(
    innerLightPlates[0],
    '| When you have to expend a HD, treat as if you expended a d12 instead and use its rolled value to check if you Recharges any of your Actions.|'
  )

  // Sample 4: Tether Divinity (A Reaction)
  // | <Recharge (12)>, <Tether Divinity <(<V>, <S>, <M>)>>, <Cantrip> <Abjuration> | Trigger : When one of more Creatures 10ft of you takes damage or regain hit points from dice rolls. |
  // | For each dice rolled, you can choose to expend and roll 1 of your HD, replacing it by the number rolled on your Hit Die. |
  const tetherDivinity = {
    name: 'Tether Divinity',
    role: 'reaction' as const,
    recharge: '12',
    components: ['V', 'S', 'M'],
    spellLevel: 'Cantrip',
    school: 'Abjuration',
    trigger: 'When one of more Creatures 10ft of you takes damage or regain hit points from dice rolls',
    description: 'For each dice rolled, you can choose to expend and roll 1 of your HD, replacing it by the number rolled on your Hit Die.',
  }
  const tetherPlates = formatStructuredStudioActionPlate(tetherDivinity)
  assert.equal(
    tetherPlates[0],
    '| Recharge (12), Tether Divinity (V, S, M), Cantrip Abjuration | Trigger: When one of more Creatures 10ft of you takes damage or regain hit points from dice rolls. |'
  )
  assert.equal(
    tetherPlates[1],
    '| For each dice rolled, you can choose to expend and roll 1 of your HD, replacing it by the number rolled on your Hit Die. |'
  )
})

