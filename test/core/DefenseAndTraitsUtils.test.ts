import test from 'node:test'
import assert from 'node:assert/strict'
import {
  formatDefenseItem,
  formatDefenseList,
  formatLanguageItem,
  formatLanguagesList,
  computeTraitTag,
  formatMinimalistRegen,
  formatMinimalistDeathPrevention,
  resolveDynamicNumericSource,
  composeInvulnerabilityRuling,
  resolveInvulnerabilityDisplayLocation,
  composeAcAndDefenses,
} from '../../src/core/domain/defense-and-traits-utils.ts'

test('defense-and-traits-utils - formatDefenseItem & formatDefenseList', () => {
  assert.equal(formatDefenseItem({ id: '1', type: 'fire' }), 'fire')
  assert.equal(
    formatDefenseItem({ id: '2', type: 'lightning', absorbs: true }),
    'lightning (regains HP instead)'
  )
  assert.equal(
    formatDefenseItem({ id: '3', type: 'poison', advantage: true }),
    'poison (Advantage)'
  )
  assert.equal(
    formatDefenseItem({ id: '3b', type: 'psychic', disadvantage: true }),
    'psychic (Disadvantage)'
  )
  assert.equal(
    formatDefenseItem({ id: '3c', type: 'charmed', category: 'condition', saveOutcome: 'On Failure: takes 2d6 psychic damage' }),
    'charmed (On Failure: takes 2d6 psychic damage)'
  )
  assert.equal(
    formatDefenseItem({
      id: '4',
      type: 'bludgeoning, piercing, and slashing',
      nonmagical: true,
      note: 'that aren\'t silvered',
    }),
    'nonmagical bludgeoning, piercing, and slashing (that aren\'t silvered)'
  )
  assert.equal(
    formatDefenseItem({
      id: '5',
      type: 'cold',
      trigger: 'bloodied',
      duration: 'until_end_of_next_turn',
    }),
    'cold (while bloodied, until end of next turn)'
  )

  // Test mode, acquiredCondition, and triggeredBenefit
  assert.equal(
    formatDefenseItem({
      id: '6',
      type: 'fire',
      acquiredCondition: 'Restrained',
      conditionDuration: 'until end of its next turn',
    }),
    'fire (Restrained until end of its next turn)'
  )
  assert.equal(
    formatDefenseItem({
      id: '7',
      type: 'lightning',
      triggeredBenefit: 'uses its Reaction to move up to its speed',
      benefitTrigger: 'when hit',
    }),
    'lightning (uses its Reaction to move up to its speed when hit)'
  )
  assert.equal(
    formatDefenseItem({
      id: '8',
      type: 'acid',
      mode: 'absorbs',
    }),
    'acid (regains HP instead)'
  )

  const list = [
    { id: '1', type: 'fire' },
    { id: '2', type: 'cold', advantage: true },
    { id: '3', type: 'lightning', absorbs: true },
  ]
  assert.equal(
    formatDefenseList(list),
    'fire, cold (Advantage), lightning (regains HP instead)'
  )
})

test('defense-and-traits-utils - formatLanguageItem & formatLanguagesList', () => {
  assert.equal(formatLanguageItem({ id: '1', name: 'Common' }), 'Common')
  assert.equal(
    formatLanguageItem({ id: '2', name: 'Elvish', understandsOnly: true }),
    "understands Elvish but can't speak"
  )
  assert.equal(
    formatLanguageItem({ id: '3', name: 'Telepathy', telepathy: true, telepathyRange: 120 }),
    'telepathy 120 ft.'
  )
  assert.equal(
    formatLanguageItem({
      id: '4',
      name: 'Telepathy',
      telepathy: true,
      telepathyRange: 60,
      mustUnderstandAtLeastOne: true,
      acrossPlanes: true,
      requiresSave: true,
      saveDc: 15,
      saveType: 'Wisdom',
    }),
    'Telepathy (60 ft., communicate with creatures, that has a language, across material and ethereal planes. resisted by a DC 15 Wisdom Saving Throw)'
  )
  assert.equal(
    formatLanguageItem({
      id: '4b',
      name: 'Telepathy',
      telepathy: true,
      telepathyRange: 60,
      readThoughts: true,
      requiresSave: true,
      saveDc: 14,
      saveType: 'Charisma',
      saveAwareness: 'unaware_on_fail',
    }),
    'Telepathy (60 ft., communicate with creatures. Success on a Charisma Saving Throw DC 14 avoids letting it: probe surface thoughts, and gain awareness of this reading)'
  )
  assert.equal(
    formatLanguageItem({
      id: '4c',
      name: 'Telepathy',
      telepathy: true,
      telepathyRange: 120,
      sensesSentient: true,
      creatureTarget: 'intelligent_only',
      languageRequirement: 'must_understand',
      acrossPlanes: true,
      readThoughts: true,
      learnDesires: true,
      senseIntentions: true,
      senseAlignment: true,
      senseEmotions: true,
      detectSincerity: true,
      probeCreatureSenses: true,
      requiresSave: true,
      saveDc: 13,
      saveType: 'Wisdom',
      saveAwareness: 'unaware_on_fail',
    }),
    'Telepathy (120 ft., sense, and communicate only with intelligent creatures, that has a language, across material and ethereal planes. Success on a Wisdom Saving Throw DC 13 avoids letting it: probe surface thoughts, desires, intents, alignment, emotions, sincerity, perceive through its senses, and gain awareness of this reading)'
  )

  // Test Special Languages
  assert.equal(
    formatLanguageItem({
      id: '5',
      name: 'Handle Animals',
      animalHandling: { dc: 12 },
    }),
    'Handle Animals (DC 12 calm/cease; DC 17 basic commands; DC 22 aid/bond)'
  )
  assert.equal(
    formatLanguageItem({
      id: '6',
      name: 'Animals',
      animalsConfig: { simpleConceptsOnly: true },
    }),
    'Animals (can communicate with beasts; simple concepts only)'
  )
  assert.equal(
    formatLanguageItem({
      id: '7',
      name: 'Plants',
      plantsConfig: { canQuestionPastDay: true },
    }),
    'Plants (can communicate with plants; question events of past day)'
  )
  assert.equal(
    formatLanguageItem({
      id: '8',
      name: 'Undead',
      undeadConfig: { commandMindless: true, telepathicRange: 60 },
    }),
    'Undead (can issue mental commands to mindless undead within 60 ft.)'
  )
  assert.equal(
    formatLanguageItem({
      id: '9',
      name: 'Dead (Speak with Dead)',
      deadConfig: { maxQuestions: 5, corpseMustHaveMouth: true },
    }),
    'Dead (as Speak with Dead; up to 5 questions, corpse must have a mouth)'
  )

  const list = [
    { id: '1', name: 'Common' },
    { id: '2', name: 'Draconic' },
    { id: '3', name: 'Infernal', understandsOnly: true },
    { id: '4', name: 'Telepathy', telepathy: true, telepathyRange: 60 },
  ]
  const formatted = formatLanguagesList(list)
  assert.equal(
    formatted,
    "Common, Draconic; understands Infernal but can't speak it; telepathy 60 ft."
  )

  assert.equal(
    formatLanguagesList(list, 'firbolg'),
    "Speech of Beast and Leaf (advantage to influence beasts and plants; beasts and plants understand its speech but can't reply), Common, Draconic; understands Infernal but can't speak it; telepathy 60 ft."
  )
  assert.equal(
    formatLanguagesList([], 'monk'),
    "Tongue of the Sun and Moon (understands all spoken languages; any creature that understands a language understands its speech)"
  )
})

test('defense-and-traits-utils - computeTraitTag consolidated tags', () => {
  assert.equal(
    computeTraitTag({
      id: '1',
      name: 'Breath Weapon',
      rechargeTiming: 'RECHARGE_5_6',
      rechargeCount: 1,
      conditionalTrigger: 'none',
      description: 'Exhales fire',
      limitedUse: { count: 0, rate: '' },
      crAnnotation: { maxDamage: 0, maxSave: 0, maxToHit: 0, ehpMultiplier: 1, ehpModifier: 0, acModifier: 0 },
    }),
    'Recharge 5–6'
  )

  assert.equal(
    computeTraitTag({
      id: '2',
      name: 'Bloodied Fury',
      rechargeTiming: 'DAY',
      rechargeCount: 3,
      conditionalTrigger: 'Bloodied only',
      description: 'Enters a rage',
      limitedUse: { count: 3, rate: 'DAY' },
      crAnnotation: { maxDamage: 0, maxSave: 0, maxToHit: 0, ehpMultiplier: 1, ehpModifier: 0, acModifier: 0 },
    }),
    '3/Day; Bloodied only'
  )

  assert.equal(
    computeTraitTag({
      id: '3',
      name: 'Dawn Renewal',
      rechargeTiming: 'DAWN',
      rechargeCount: 1,
      conditionalTrigger: '',
      description: 'Recharges at dawn',
      limitedUse: { count: 0, rate: '' },
      crAnnotation: { maxDamage: 0, maxSave: 0, maxToHit: 0, ehpMultiplier: 1, ehpModifier: 0, acModifier: 0 },
    }),
    'Recharges at Dawn'
  )
})

test('defense-and-traits-utils - formatMinimalistRegen & formatMinimalistDeathPrevention', () => {
  assert.equal(
    formatMinimalistRegen({
      enabled: true,
      amount: 10,
      timeframe: 'turn',
      disruptedByTypes: ['acid', 'fire'],
      disruptedByNote: '',
      displayMode: 'minimalist',
    }),
    '+10/turn (acid or fire)'
  )

  assert.equal(
    formatMinimalistDeathPrevention({
      enabled: true,
      name: 'Immortal',
      exceptions: ['radiant', 'critical hit'],
      customNote: '',
      displayMode: 'minimalist',
    }),
    'Immortal (radiant or critical hit)'
  )

  assert.equal(
    formatMinimalistDeathPrevention({
      enabled: true,
      name: 'Undead Fortitude',
      exceptions: ['radiant', 'critical hit'],
      customNote: 'or DC 5 + dmg CON save',
      displayMode: 'minimalist',
    }),
    'Undead Fortitude (radiant or critical hit, or DC 5 + dmg CON save)'
  )

  const ctx = {
    maxHp: 200,
    proficiency: 5,
    hitDice: 18,
    hdType: 12,
    stats: { STR: 20, DEX: 14, CON: 22, INT: 10, WIS: 16, CHA: 18 },
  }
  assert.equal(resolveDynamicNumericSource('half_hp', 10, undefined, ctx), '100')
  assert.equal(resolveDynamicNumericSource('quarter_hp', 10, undefined, ctx), '50')
  assert.equal(resolveDynamicNumericSource('eighth_hp', 10, undefined, ctx), '25')
  assert.equal(resolveDynamicNumericSource('proficiency', 10, undefined, ctx), '5')
  assert.equal(resolveDynamicNumericSource('CON_mod', 10, undefined, ctx), '6')
  assert.equal(resolveDynamicNumericSource('CON_score', 10, undefined, ctx), '22')
  assert.equal(resolveDynamicNumericSource('hit_dice', 10, undefined, ctx), '18d12')
  assert.equal(resolveDynamicNumericSource('dice', 10, '2d8+4', ctx), '2d8+4')

  assert.equal(
    formatMinimalistDeathPrevention(
      {
        enabled: true,
        name: 'Immortal',
        returnHpSource: 'half_hp',
        exceptions: ['radiant', 'critical hit'],
      },
      ctx
    ),
    'Immortal (Returns to life with 100 hit points, if not reduced to zero by radiant or critical hit)'
  )

  assert.equal(
    formatMinimalistDeathPrevention(
      {
        enabled: true,
        name: 'Until X Critical Hits',
        critHitThreshold: 3,
      } as any,
      ctx
    ),
    'Immortal (Until being hit by 3 Critical Hits)'
  )
})

test('defense-and-traits-utils - composeInvulnerabilityRuling decoupled rules & N combinable conditions', () => {
  assert.equal(
    composeInvulnerabilityRuling({
      enabled: true,
      rule: 'only_x_can_hit',
      conditions: ['critical_hits'],
    }),
    'Invulnerable (Only Critical Hits can Hit you)'
  )

  assert.equal(
    composeInvulnerabilityRuling({
      enabled: true,
      rule: 'only_x_can_hit',
      conditions: ['turn_crits_to_normal'],
    }),
    'Invulnerable (Turn critical Hits into normal hits)'
  )

  assert.equal(
    composeInvulnerabilityRuling({
      enabled: true,
      rule: 'only_x_can_hit',
      conditions: ['critical_hits', 'speed_not_zero'],
    }),
    "Invulnerable (Only critical hits can hit you, while your speed isn't 0)"
  )

  assert.equal(
    composeInvulnerabilityRuling({
      enabled: true,
      rule: 'only_x_can_hit',
      conditions: ['critical_hits', 'attacks_with_advantage'],
    }),
    'Invulnerable (Only critical hits or attacks with Advantage can hit you)'
  )

  assert.equal(
    composeInvulnerabilityRuling({
      enabled: true,
      rule: 'only_x_can_hit',
      conditions: ['nth_attack_in_round'],
      nthAttack: 3,
    }),
    'Invulnerable (Only the 3rd attack in a round can hit you)'
  )

  assert.equal(
    composeInvulnerabilityRuling({
      enabled: true,
      rule: 'only_x_can_hit',
      conditions: ['attacker_save'],
      saveStat: 'Wisdom',
      saveDc: 16,
    }),
    'Invulnerable (Attacker must succeed on a Wisdom Saving Throw DC 16 to automatically Hit instead)'
  )

  assert.equal(
    composeInvulnerabilityRuling({
      enabled: true,
      rule: 'only_x_can_hit',
      conditions: ['alignment'],
      alignmentFilter: 'Good',
    }),
    'Invulnerable (Only Good Aligned creatures can Hit you)'
  )

  // Test unified Conditions & Qualifiers without standalone rule and auto-routing between AC and HP
  assert.equal(
    resolveInvulnerabilityDisplayLocation({
      conditions: ['critical_hits'],
    }),
    'ac'
  )
  assert.equal(
    resolveInvulnerabilityDisplayLocation({
      conditions: ['different_damage_type'],
    }),
    'hp'
  )
  assert.equal(
    composeInvulnerabilityRuling({
      conditions: ['critical_hits', 'speed_not_zero'],
    }),
    "Invulnerable (Only critical hits can hit you, while your speed isn't 0)"
  )
})

test('defense-and-traits-utils - unified 15 timeframes for formatMinimalistRegen & computeTraitTag', () => {
  assert.equal(
    formatMinimalistRegen({
      enabled: true,
      amount: 15,
      timeframe: 'START_OF_ITS_TURN',
      disruptedByTypes: ['acid', 'fire'],
    }),
    '+15/turn (acid or fire)'
  )
  assert.equal(
    formatMinimalistRegen({
      enabled: true,
      amount: 20,
      timeframe: 'END_OF_A_TURN',
      disruptedByTypes: ['radiant'],
    }),
    '+20/end of a turn (radiant)'
  )
  assert.equal(
    formatMinimalistRegen({
      enabled: true,
      amount: 10,
      recoveryType: 'temp_hp',
      timeframe: 'DAWN',
      disruptedByTypes: ['necrotic'],
    }),
    '+10 temp HP (at dawn; disrupted by necrotic)'
  )
  assert.equal(
    formatMinimalistRegen({
      enabled: true,
      amount: 5,
      timeframe: 'SHORT_REST',
      disruptedBy: 'silvered weapons',
    }),
    '+5 on a short rest (silvered weapons)'
  )

  assert.equal(
    computeTraitTag({
      id: 't1',
      name: 'Solar Pulse',
      rechargeTiming: 'MIDDAY',
      rechargeCount: 1,
      conditionalTrigger: '',
      description: 'Pulses at midday',
      limitedUse: { count: 0, rate: '' },
      crAnnotation: { maxDamage: 0, maxSave: 0, maxToHit: 0, ehpMultiplier: 1, ehpModifier: 0, acModifier: 0 },
    }),
    'Recharges at Midday'
  )
  assert.equal(
    computeTraitTag({
      id: 't2',
      name: 'Turn Renewal',
      rechargeTiming: 'START_OF_ITS_TURN',
      rechargeCount: 1,
      conditionalTrigger: '',
      description: 'Triggers at start of its turn',
      limitedUse: { count: 0, rate: '' },
      crAnnotation: { maxDamage: 0, maxSave: 0, maxToHit: 0, ehpMultiplier: 1, ehpModifier: 0, acModifier: 0 },
    }),
    '1/Turn (Start of its turn)'
  )
})

test('defense-and-traits-utils - 5 Enhanced Regeneration Heuristics & Invulnerability Combiner', () => {
  // Heuristic 1: Took no Acid or Fire damage since previous turn
  assert.equal(
    formatMinimalistRegen({
      enabled: true,
      amount: 20,
      disruptedByTypes: ['Acid', 'Fire'],
      conditionModifier: 'no_damage_since_previous_turn',
    }),
    '+20 hit points at start of your turn if you did not take Acid or Fire damage since your previous turn'
  )

  // Heuristic 2: Head not severed
  assert.equal(
    formatMinimalistRegen({
      enabled: true,
      amount: 20,
      conditionModifier: 'head_not_severed',
    }),
    '+20 hit points at start of your turn if your head is not severed'
  )

  // Heuristic 3: Acid and Fire reduces maximum hit points until short rest
  assert.equal(
    formatMinimalistRegen({
      enabled: true,
      amount: 10,
      disruptedByTypes: ['Acid', 'Fire'],
      conditionModifier: 'max_hp_reduction',
      maxHpReductionUntil: 'short rest',
    }),
    'Acid and Fire reduces maximum hit points until short rest'
  )

  // Heuristic 4: While not Bloodied
  assert.equal(
    formatMinimalistRegen({
      enabled: true,
      amount: 20,
      conditionModifier: 'not_bloodied',
    }),
    'Regains 20 hit points while not Bloodied'
  )

  // Heuristic 5: Temporary hit points if you have temporary hit points
  assert.equal(
    formatMinimalistRegen({
      enabled: true,
      amount: 50,
      conditionModifier: 'has_temp_hp',
    }),
    '50 of temporary hit points if you have temporary hit points'
  )

  // Invulnerability Combiner 'and'
  assert.equal(
    composeInvulnerabilityRuling({
      enabled: true,
      rule: 'only_x_can_hit',
      conditions: ['critical_hits', 'attacks_with_advantage'],
      combiner: 'and',
    }),
    'Invulnerable (Only critical hits and attacks with Advantage can hit you)'
  )

  // Invulnerability with Integrated Disruption & Custom Logic
  assert.equal(
    composeInvulnerabilityRuling({
      enabled: true,
      rule: 'only_x_can_hit',
      conditions: ['critical_hits', 'disrupted_by_acid'],
      customLogic: 'Only while attuned to the Soul Core',
    }),
    'Invulnerable (Only Critical Hits can Hit you; disrupted by Acid damage; Only while attuned to the Soul Core)'
  )
})

test('defense-and-traits-utils - AC Submodule Attacker Save Permutations', () => {
  // Target 1: AC Attacker must Succeed on a Wisdom Saving Throw DC 30, On Failure Knocks Prone, On Success Takes 13 of Radiant Damage
  const res1 = composeAcAndDefenses({
    AC: 10,
    acConfig: {
      conditionMode: 'attacker_save',
      saveVerb: 'must_succeed',
      saveStat: 'Wisdom',
      saveDc: 30,
      onSaveFailure: 'knocks_prone',
      onSaveSuccess: 'takes_damage',
      onSaveSuccessDamageAmount: 13,
      onSaveSuccessDamageType: 'Radiant',
    },
  })
  assert.equal(
    res1.fullText,
    'Attacker must Succeed on a Wisdom Saving Throw DC 30, On Failure Knocks Prone, On Success Takes 13 of Radiant Damage'
  )

  // Target 2: AC Attacker Makes on a Wisdom Saving Throw DC 30, On Failure Knocks Prone, On Success Takes 13 of Radiant Damage
  const res2 = composeAcAndDefenses({
    AC: 10,
    acConfig: {
      conditionMode: 'attacker_save',
      saveVerb: 'makes',
      saveStat: 'Wisdom',
      saveDc: 30,
      onSaveFailure: 'knocks_prone',
      onSaveSuccess: 'takes_damage',
      onSaveSuccessDamageAmount: 13,
      onSaveSuccessDamageType: 'Radiant',
    },
  })
  assert.equal(
    res2.fullText,
    'Attacker Makes on a Wisdom Saving Throw DC 30, On Failure Knocks Prone, On Success Takes 13 of Radiant Damage'
  )

  // Target 3: AC Attacker Must Succeed on a Wisdom Saving Throw DC 30 to Hit
  const res3 = composeAcAndDefenses({
    AC: 10,
    acConfig: {
      conditionMode: 'attacker_save',
      saveVerb: 'must_succeed_to_hit',
      saveStat: 'Wisdom',
      saveDc: 30,
    },
  })
  assert.equal(
    res3.fullText,
    'Attacker Must Succeed on a Wisdom Saving Throw DC 30 to Hit'
  )
})

test('defense-and-traits-utils - Minimalist Death Prevention Prose Targets', () => {
  // Target 1: Returns with 1 hit point if Not Reduced to 0 by Necrotic Damage, or Critical Strikes
  const dp1 = {
    enabled: true,
    name: 'Direct',
    returnHpSource: '1',
    returnHpValue: 1,
    exceptions: ['Necrotic Damage', 'Critical Strikes'],
  }
  assert.equal(
    formatMinimalistDeathPrevention(dp1),
    'Returns with 1 hit point if Not Reduced to 0 by Necrotic Damage, or Critical Strikes'
  )

  // Target 2: Returns with 1 hit point at end of turn if Not Reduced to 0 by Necrotic Damage, or Critical Strikes
  const dp2 = {
    enabled: true,
    name: 'Direct',
    returnHpSource: '1',
    returnHpValue: 1,
    returnTimeframe: 'at_end_of_turn',
    exceptions: ['Necrotic Damage', 'Critical Strikes'],
  }
  assert.equal(
    formatMinimalistDeathPrevention(dp2),
    'Returns with 1 hit point at end of turn if Not Reduced to 0 by Necrotic Damage, or Critical Strikes'
  )

  // Target 3: Returns with 1 hit point upon Death Saving Throw Success
  const dp3 = {
    enabled: true,
    name: 'Direct',
    triggerCondition: 'death_save_success',
    returnHpSource: '1',
    returnHpValue: 1,
  }
  assert.equal(
    formatMinimalistDeathPrevention(dp3),
    'Returns with 1 hit point upon Death Saving Throw Success'
  )

  // Target 4: Upon death Deals 38 of Radiant damage to all Creatures within 30ft
  const dp4 = {
    enabled: true,
    name: 'Direct',
    triggerCondition: 'upon_death_burst',
    uponDeathDealsDamage: true,
    deathBurstDamageAmount: 38,
    deathBurstDamageType: 'Radiant',
    deathBurstTargetFilter: 'Creatures',
    deathBurstRange: 30,
  }
  assert.equal(
    formatMinimalistDeathPrevention(dp4),
    'Upon death Deals 38 of Radiant damage to all Creatures within 30ft'
  )

  // Target 5: Upon death Deals 38 of Radiant damage to all Undeads, and Fiends within 30ft
  const dp5 = {
    enabled: true,
    name: 'Direct',
    triggerCondition: 'upon_death_burst',
    uponDeathDealsDamage: true,
    deathBurstDamageAmount: 38,
    deathBurstDamageType: 'Radiant',
    deathBurstTargetFilter: 'Undeads, and Fiends',
    deathBurstRange: 30,
  }
  assert.equal(
    formatMinimalistDeathPrevention(dp5),
    'Upon death Deals 38 of Radiant damage to all Undeads, and Fiends within 30ft'
  )
})
