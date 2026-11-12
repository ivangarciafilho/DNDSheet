import { formatRiderSchedule, type DefenseEffect, type RiderSchedule } from './basic-riders.ts'
import { actionRecharge } from './action-usage.ts'
import { CADENCES, cadenceDefinition, formatLimitedUses } from './cadence.ts'
import type { DamageDefenseItem, MonsterLanguageItem, MonsterExtendedHp, MonsterTrait, MonsterAcConfig } from './types.ts'
import { buildFormulaContext, evaluateFormula, normalizeLegacyFormula } from './formula.ts'
import type { FormulaContext } from './formula.ts'

/**
 * Formats an individual damage/condition defense item into standard D&D 5e wording.
 */
export function formatDefenseItem(item: DamageDefenseItem): string {
  if (!item) return ''
  let name = (item.type || item.name || '').trim()
  if (name.toLowerCase() === 'damage' || name.toLowerCase() === 'condition') {
    if (item.name) name = item.name.trim()
  }
  if (!name) return ''
  if (item.nonmagical && !name.toLowerCase().startsWith('nonmagical') && !name.toLowerCase().startsWith('non-magical')) {
    name = `nonmagical ${name}`
  }

  const modifiers: string[] = []

  // Mutually exclusive modifier mode
  const mode = item.mode || (item.absorbs ? 'absorbs' : item.advantage ? 'advantage' : item.disadvantage ? 'disadvantage' : 'none')
  if (mode === 'absorbs') {
    modifiers.push('regains HP instead')
  } else if (mode === 'advantage') {
    modifiers.push('Advantage')
  } else if (mode === 'disadvantage') {
    modifiers.push('Disadvantage')
  }

  // Save outcome (e.g. On Success: half damage, On Failure: knocked Prone)
  if (item.saveOutcome && item.saveOutcome.trim()) {
    modifiers.push(item.saveOutcome.trim())
  }

  // Vulnerability acquired negative condition & duration
  if (item.acquiredCondition && item.acquiredCondition !== 'none') {
    const condName = item.acquiredCondition.trim()
    const dur = item.conditionDuration && item.conditionDuration !== 'permanent' ? ` ${item.conditionDuration.trim()}` : ''
    modifiers.push(`${condName}${dur}`)
  } else if (item.customCondition && item.customCondition.trim()) {
    modifiers.push(item.customCondition.trim())
  }

  // Resistance / Immunity / Condition Immunity triggered benefit / reaction
  if (item.triggeredBenefit && item.triggeredBenefit.trim()) {
    const trig = item.benefitTrigger && item.benefitTrigger !== 'none' ? ` ${item.benefitTrigger.trim()}` : ' when hit'
    const dur = item.benefitDuration && item.benefitDuration !== 'instantaneous' ? ` for ${item.benefitDuration.trim()}` : ''
    modifiers.push(`${item.triggeredBenefit.trim()}${trig}${dur}`)
  }

  // Legacy trigger & duration fallback
  if (item.trigger && item.trigger !== 'none') {
    if (item.trigger.toLowerCase() === 'bloodied') {
      modifiers.push('while bloodied')
    } else {
      modifiers.push(`against ${item.trigger}`)
    }
  }
  if (item.duration && item.duration !== 'permanent') {
    const durMap: Record<string, string> = {
      until_end_of_turn: 'until end of turn',
      until_end_of_next_turn: 'until end of next turn',
      until_start_of_next_turn: 'until start of next turn',
      until_regaining_hp: 'until regaining HP',
      until_taking_action: 'until taking action',
      until_taking_bonus_action: 'until taking bonus action',
      until_no_longer_bloodied: 'until no longer bloodied',
    }
    modifiers.push(durMap[item.duration] || item.duration)
  }
  if (item.note && item.note.trim()) {
    modifiers.push(item.note.trim())
  }

  if (modifiers.length > 0) {
    return `${name} (${modifiers.join(', ')})`
  }
  return name
}

/**
 * Formats a list of defense items, joining them with comma/semicolon.
 */
export function formatDefenseList(items: DamageDefenseItem[] | undefined): string {
  if (!Array.isArray(items) || items.length === 0) return ''
  // Group items sharing simple advantage or disadvantage
  const advNames: string[] = []
  const disadvNames: string[] = []

  for (const item of items) {
    if (!item) continue
    const mode = item.mode || (item.absorbs ? 'absorbs' : item.advantage ? 'advantage' : item.disadvantage ? 'disadvantage' : 'none')
    const hasComplex = Boolean(
      item.saveOutcome ||
      (item.acquiredCondition && item.acquiredCondition !== 'none') ||
      item.customCondition ||
      item.triggeredBenefit ||
      (item.trigger && item.trigger !== 'none') ||
      (item.duration && item.duration !== 'permanent') ||
      item.note
    )

    if (!hasComplex && mode === 'advantage') {
      const base = formatDefenseItem({ ...item, mode: 'none', advantage: false, disadvantage: false, absorbs: false })
      if (base) advNames.push(base)
    } else if (!hasComplex && mode === 'disadvantage') {
      const base = formatDefenseItem({ ...item, mode: 'none', advantage: false, disadvantage: false, absorbs: false })
      if (base) disadvNames.push(base)
    }
  }

  const results: string[] = []
  let advHandled = false
  let disadvHandled = false

  for (const item of items) {
    if (!item) continue
    const mode = item.mode || (item.absorbs ? 'absorbs' : item.advantage ? 'advantage' : item.disadvantage ? 'disadvantage' : 'none')
    const hasComplex = Boolean(
      item.saveOutcome ||
      (item.acquiredCondition && item.acquiredCondition !== 'none') ||
      item.customCondition ||
      item.triggeredBenefit ||
      (item.trigger && item.trigger !== 'none') ||
      (item.duration && item.duration !== 'permanent') ||
      item.note
    )

    if (!hasComplex && mode === 'advantage') {
      if (advNames.length > 1) {
        if (!advHandled) {
          results.push(`(${advNames.join(', ')} (Advantage))`)
          advHandled = true
        }
        continue
      }
    } else if (!hasComplex && mode === 'disadvantage') {
      if (disadvNames.length > 1) {
        if (!disadvHandled) {
          results.push(`(${disadvNames.join(', ')} (Disadvantage))`)
          disadvHandled = true
        }
        continue
      }
    }

    const formatted = formatDefenseItem(item)
    if (formatted) results.push(formatted)
  }

  return results.join(', ')
}

/**
 * Formats an individual language entry into standard D&D 5e wording.
 */
export function formatLanguageItem(item: MonsterLanguageItem, formatValue: (field: string, value: string | number) => string = (_field, value) => String(value)): string {
  if (!item || !item.name) return ''
  const name = item.name.trim()
  const lowerName = name.toLowerCase()

  // 1. Handle Animals / Animal Handling ruling module
  if (item.animalHandling?.enabled || lowerName === 'handle animals' || lowerName.includes('animal handling')) {
    const ah = item.animalHandling || {}
    const dc = ah.dc ?? 10
    const outcomes: string[] = []
    outcomes.push(`DC ${formatValue('animalHandling.dc', dc)} ${ah.peacefulOutcome || 'calm/cease'}`)
    outcomes.push(`DC ${dc + 5} ${ah.commandOutcome || 'basic commands'}`)
    outcomes.push(`DC ${dc + 10} ${ah.recruitOutcome || 'aid/bond'}`)
    if (ah.customNotes?.trim()) {
      outcomes.push(ah.customNotes.trim())
    }
    return `Handle Animals (${outcomes.join('; ')})`
  }

  // Racial / Class Archetype Communication
  if (lowerName === 'speech of beast and leaf' || lowerName.includes('firbolg')) {
    return "Speech of Beast and Leaf (advantage to influence beasts and plants; beasts and plants understand its speech but can't reply)"
  }
  if (lowerName === 'tongue of the sun and moon' || lowerName.includes('monk')) {
    return "Tongue of the Sun and Moon (understands all spoken languages; any creature that understands a language understands its speech)"
  }

  // 2. Animals (Speak with Animals)
  if (lowerName === 'animals' || item.animalsConfig) {
    const cfg = item.animalsConfig || {}
    if (cfg.understandsOnly || item.understandsOnly) {
      return `understands beasts${cfg.specificSubtype ? ` (${cfg.specificSubtype})` : ''} but can't speak`
    }
    const notes: string[] = []
    if (cfg.simpleConceptsOnly !== false) {
      notes.push('simple concepts only')
    }
    if (cfg.specificSubtype && cfg.specificSubtype.trim()) {
      notes.push(cfg.specificSubtype.trim())
    }
    if (cfg.note && cfg.note.trim()) {
      notes.push(cfg.note.trim())
    }
    const noteStr = notes.length > 0 ? `; ${notes.join(', ')}` : ''
    return `Animals (can communicate with beasts${noteStr})`
  }

  // 3. Plants (Speak with Plants)
  if (lowerName === 'plants' || item.plantsConfig) {
    const cfg = item.plantsConfig || {}
    if (cfg.understandsOnly || item.understandsOnly) {
      return `understands plants but can't speak`
    }
    const features: string[] = ['can communicate with plants']
    if (cfg.canQuestionPastDay !== false) {
      features.push('question events of past day')
    }
    if (cfg.difficultTerrainNegotiation) {
      features.push('negotiate difficult terrain')
    }
    if (cfg.note && cfg.note.trim()) {
      features.push(cfg.note.trim())
    }
    return `Plants (${features.join('; ')})`
  }

  // 4. Undead (Command / Speak with Undead)
  if (lowerName === 'undead' || item.undeadConfig) {
    const cfg = item.undeadConfig || {}
    if (cfg.understandsOnly || item.understandsOnly) {
      return `understands languages of undead but can't speak`
    }
    const features: string[] = []
    const range = cfg.telepathicRange && cfg.telepathicRange > 0 ? `${formatValue('undeadConfig.telepathicRange', cfg.telepathicRange)} ft.` : '60 ft.'
    if (cfg.commandMindless !== false) {
      features.push(`can issue mental commands to mindless undead within ${range}`)
    } else {
      features.push(`can communicate with undead within ${range}`)
    }
    if (cfg.note && cfg.note.trim()) {
      features.push(cfg.note.trim())
    }
    return `Undead (${features.join('; ')})`
  }

  // 5. Dead (Speak with Dead)
  if (lowerName.startsWith('dead') || item.deadConfig) {
    const cfg = item.deadConfig || {}
    const maxQ = cfg.maxQuestions ?? 5
    const bits: string[] = maxQ === 5 ? [] : [`up to ${formatValue('deadConfig.maxQuestions', maxQ)} questions`]
    if (cfg.corpseMustHaveMouth === false) {
      bits.push('corpse need not have a mouth')
    }
    if (cfg.deadWithinYears && cfg.deadWithinYears.trim()) {
      bits.push(`dead within ${cfg.deadWithinYears.trim()}`)
    }
    if (cfg.answersCryptic) {
      bits.push('answers may be brief or cryptic')
    }
    if (cfg.note && cfg.note.trim()) {
      bits.push(cfg.note.trim())
    }
    return 'Can cast Speak with Dead (V,S) At Will' + (bits.length ? ' (' + bits.join(', ') + ')' : '')
  }

  // 6. Telepathy (Fluid Official 5e Rules Prose)
  if (item.telepathy || lowerName === 'telepathy') {
    const range = item.telepathyRange && item.telepathyRange > 0 ? `${formatValue('telepathyRange', item.telepathyRange)} ft.` : '120 ft.'

    // Check if any advanced telepathy configuration exists
    const hasAdvanced =
      (item.languageRequirement && item.languageRequirement !== 'none') ||
      item.mustShareLanguage ||
      item.mustUnderstandAtLeastOne ||
      (item.creatureTarget && item.creatureTarget !== 'all') ||
      item.intelligentOnly ||
      item.nonIntelligentOnly ||
      (item.creatureConcentrationFilter && item.creatureConcentrationFilter !== 'all') ||
      item.broadcast ||
      item.noReply ||
      item.simpleConceptsOnly ||
      item.acrossPlanes ||
      item.multiverseWide ||
      item.sensesSentient ||
      item.telepathicEavesdrop ||
      item.telepathicAwareness ||
      item.readThoughts ||
      item.learnDesires ||
      item.senseEmotions ||
      item.senseAlignment ||
      item.senseIntentions ||
      item.detectSincerity ||
      item.accessMemories ||
      item.shareOwnSenses ||
      item.probeCreatureSenses ||
      item.requiresSave ||
      item.probeRequiresSave ||
      item.sensoryRequiresSave ||
      (item.concentrationMode && item.concentrationMode !== 'none') ||
      (item.concentration && item.concentration !== 'none') ||
      item.disruptedByPsychicDamage ||
      item.understandsOnly ||
      (item.note && item.note.trim())

    if (!hasAdvanced) {
      return `telepathy ${range}`
    }

    const sentences: string[] = []

    // Primary interaction sentence
    const verbs: string[] = []
    if (item.sensesSentient || item.telepathicAwareness) {
      verbs.push('sense')
    }
    verbs.push('communicate')

    const interactionStr = verbs.length > 1
      ? `${verbs.join(', and ')} only with`
      : (item.creatureTarget === 'intelligent_only' || item.intelligentOnly || item.creatureTarget === 'non_intelligent_only' || item.nonIntelligentOnly)
        ? 'communicate only with'
        : 'communicate with'

    let targetStr = 'creatures'
    if (item.creatureTarget === 'intelligent_only' || item.intelligentOnly) {
      targetStr = 'intelligent creatures'
    } else if (item.creatureTarget === 'non_intelligent_only' || item.nonIntelligentOnly) {
      targetStr = 'non-intelligent creatures'
    }

    if (item.creatureConcentrationFilter === 'concentrating_only') {
      targetStr += ' concentrating on a spell or effect'
    } else if (item.creatureConcentrationFilter === 'concentration_check') {
      targetStr += ' making or maintaining a Concentration save'
    }

    let langReqStr = ''
    if (item.languageRequirement === 'must_share' || item.mustShareLanguage) {
      langReqStr = ', that share a language'
    } else if (item.languageRequirement === 'must_understand' || item.mustUnderstandAtLeastOne) {
      langReqStr = ', that has a language'
    }

    let planeStr = ''
    if (item.multiverseWide) {
      planeStr = ', across the multiverse'
    } else if (item.acrossPlanes) {
      planeStr = ', across material and ethereal planes'
    }

    const flowBits: string[] = []
    if (item.broadcast && item.noReply) {
      flowBits.push('broadcast, one-way only')
    } else {
      if (item.broadcast) flowBits.push('broadcast')
      if (item.noReply) flowBits.push('no reply')
    }
    if (item.simpleConceptsOnly) {
      flowBits.push('only simple ideas and concepts')
    }
    const flowStr = flowBits.length > 0 ? `, ${flowBits.join(', ')}` : ''

    const mainClause = `${interactionStr} ${targetStr}${langReqStr}${planeStr}${flowStr}`
    sentences.push(mainClause)

    // Flumph pattern: aware of telepathic conversations
    if (item.telepathicEavesdrop) {
      sentences.push('aware of the content of telepathic conversations within range')
    }

    // Mental probing capabilities
    const capabilities: string[] = []
    if (item.readThoughts) capabilities.push('surface thoughts')
    if (item.learnDesires) capabilities.push('desires')
    if (item.senseIntentions) capabilities.push('intents')
    if (item.senseAlignment) capabilities.push('alignment')
    if (item.senseEmotions) capabilities.push('emotions')
    if (item.detectSincerity) capabilities.push('sincerity')
    if (item.accessMemories) capabilities.push('memories')
    if (item.probeCreatureSenses) capabilities.push('perceive through its senses')
    if (item.shareOwnSenses) capabilities.push('share its senses')

    const saveActive = item.requiresSave ?? item.probeRequiresSave ?? item.sensoryRequiresSave
    const dc = item.saveDc ?? item.probeSaveDc ?? 13
    const rawType = (item.saveType ?? item.probeSaveType ?? 'Wisdom').toString().toLowerCase()
    const sType = rawType.startsWith('cha') ? 'Charisma' : rawType.startsWith('int') ? 'Intelligence' : 'Wisdom'
    const concMode = item.concentrationMode || (item.concentration === 'monster_only' ? 'requires_concentration' : 'none')
    const isConcentrationInvolved =
      concMode === 'requires_concentration' ||
      concMode === 'concentration_negates' ||
      concMode === 'forced_concentration' ||
      item.concentration === 'both' ||
      item.concentration === 'monster_only' ||
      item.creatureConcentrationFilter === 'concentrating_only' ||
      item.creatureConcentrationFilter === 'concentration_check'
    const aware = isConcentrationInvolved ? 'aware' : (item.saveAwareness ?? item.probeSaveAwareness ?? 'unaware_on_fail')

    if (capabilities.length > 0) {
      const avoidItems = [...capabilities]
      if (avoidItems.length > 0) {
        avoidItems[0] = `probe ${avoidItems[0]}`
      }
      if (aware === 'unaware_on_fail') {
        avoidItems.push('gain awareness of this reading')
      }
      const listStr = avoidItems.length === 1 ? avoidItems[0] : `${avoidItems.slice(0, -1).join(', ')}, and ${avoidItems[avoidItems.length - 1]}`

      if (saveActive) {
        if (concMode === 'concentration_negates') {
          sentences.push(`Success on a ${sType} Saving Throw DC ${dc} (or concentrating on a spell) avoids letting it: ${listStr}`)
        } else {
          sentences.push(`Success on a ${sType} Saving Throw DC ${dc} avoids letting it: ${listStr}`)
        }
      } else if (concMode === 'forced_concentration') {
        sentences.push(`A creature can start Concentrating, as if on a spell, to avoid letting it: ${listStr}`)
      } else {
        sentences.push(`probes ${capabilities.join(', ')}`)
      }
    } else if (concMode === 'concentration_negates') {
      sentences.push('A creature can start Concentrating, as if on a spell, to negate this effect')
    } else if (saveActive) {
      sentences.push(`resisted by a DC ${dc} ${sType} Saving Throw`)
    }

    if (item.disruptedByPsychicDamage) {
      sentences.push('severed if taking psychic damage')
    }
    if (concMode === 'requires_concentration' || item.concentration === 'both' || item.concentration === 'monster_only') {
      sentences.push('requires concentration (target is aware of mental contact)')
    }
    if (item.understandsOnly) {
      sentences.push("understands but can't speak")
    }
    if (item.note && item.note.trim()) {
      sentences.push(item.note.trim())
    }

    return `Telepathy (${range}, ${sentences.join('. ')})`
  }

  if (item.understandsOnly) {
    return `understands ${name} but can't speak`
  }

  if (item.note && item.note.trim()) {
    return `${name} (${item.note.trim()})`
  }

  return name
}

/**
 * Formats a full languages list, grouping understands-only languages if appropriate.
 */
export function formatLanguagesList(items: MonsterLanguageItem[] | undefined, archetype?: string, formatValue?: (item: MonsterLanguageItem, field: string, value: string | number) => string): string {
  if ((!Array.isArray(items) || items.length === 0) && !archetype) return ''
  const spoken: string[] = []
  const understands: string[] = []
  const telepathy: string[] = []

  if (archetype === 'firbolg') {
    spoken.push("Speech of Beast and Leaf (advantage to influence beasts and plants; beasts and plants understand its speech but can't reply)")
  } else if (archetype === 'monk') {
    spoken.push("Tongue of the Sun and Moon (understands all spoken languages; any creature that understands a language understands its speech)")
  }

  if (Array.isArray(items)) {
    for (const item of items) {
      if (!item.name) continue
      const formatted = formatLanguageItem(item, formatValue ? (field, value) => formatValue(item, field, value) : undefined)
      if (item.telepathy) {
        telepathy.push(formatted)
      } else if (
        item.understandsOnly &&
        !item.animalsConfig &&
        !item.plantsConfig &&
        !item.undeadConfig &&
        !item.deadConfig &&
        !item.animalHandling?.enabled
      ) {
        understands.push(item.name.trim())
      } else {
        spoken.push(formatted)
      }
    }
  }

  const parts: string[] = []
  if (spoken.length > 0) {
    parts.push(spoken.join(', '))
  }
  if (understands.length > 0) {
    parts.push(`understands ${understands.join(', ')} but can't speak it`)
  }
  if (telepathy.length > 0) {
    parts.push(telepathy.join(', '))
  }

  return parts.join('; ')
}

export const TRAIT_RECHARGE_OPTIONS: Array<{ label: string; value: string; sectionName: string; category?: string; icon?: string; color?: string }> = [
  { label: 'None (Standard Trait)', value: '', sectionName: '', category: 'Standard', icon: 'check_circle_outline', color: 'grey-5' },
  // Recharge Roll
  { label: 'Recharge 4–6', value: 'RECHARGE_4_6', sectionName: 'Recharge 4–6', category: 'Dice Recharge', icon: 'casino', color: 'amber-4' },
  { label: 'Recharge 5–6', value: 'RECHARGE_5_6', sectionName: 'Recharge 5–6', category: 'Dice Recharge', icon: 'casino', color: 'amber-4' },
  { label: 'Recharge 6', value: 'RECHARGE_6', sectionName: 'Recharge 6', category: 'Dice Recharge', icon: 'casino', color: 'amber-4' },
  // Combat Turn Boundaries
  { label: 'End of a turn', value: 'END_OF_A_TURN', sectionName: 'End of a Turn', category: 'Turn Timing', icon: 'schedule', color: 'teal-4' },
  { label: 'End of current turn', value: 'END_OF_CURRENT_TURN', sectionName: 'End of Current Turn', category: 'Turn Timing', icon: 'schedule', color: 'teal-4' },
  { label: 'End of its turn', value: 'END_OF_ITS_TURN', sectionName: 'End of its Turn', category: 'Turn Timing', icon: 'schedule', color: 'teal-4' },
  { label: 'On Initiative', value: 'INITIATIVE', sectionName: 'On Initiative', category: 'Turn Timing', icon: 'flash_on', color: 'teal-4' },
  { label: 'Per Round (Uses/Round)', value: 'ROUND', sectionName: 'Per Round', category: 'Turn Timing', icon: 'loop', color: 'teal-4' },
  { label: 'Per Turn (Uses/Turn)', value: 'TURN', sectionName: 'Per Turn', category: 'Turn Timing', icon: 'bolt', color: 'teal-4' },
  { label: 'Start of a turn', value: 'START_OF_A_TURN', sectionName: 'Start of a Turn', category: 'Turn Timing', icon: 'bolt', color: 'teal-4' },
  { label: 'Start of its turn', value: 'START_OF_ITS_TURN', sectionName: 'Start of its Turn', category: 'Turn Timing', icon: 'bolt', color: 'teal-4' },
  // Time Intervals
  { label: 'Every Day (Uses/Day)', value: 'DAY', sectionName: 'Daily', category: 'Time Interval', icon: 'today', color: 'blue-4' },
  { label: 'Every Day Each (Uses/Day Each)', value: 'DAY_EACH', sectionName: 'Daily', category: 'Time Interval', icon: 'today', color: 'blue-4' },
  { label: 'Every Hour', value: 'HOUR', sectionName: 'Every Hour', category: 'Time Interval', icon: 'hourglass_bottom', color: 'blue-4' },
  { label: 'Every Minute', value: 'MINUTE', sectionName: 'Every Minute', category: 'Time Interval', icon: 'timer', color: 'blue-4' },
  { label: 'Weekly', value: 'WEEKLY', sectionName: 'Weekly', category: 'Time Interval', icon: 'date_range', color: 'blue-4' },
  // Solar & Cosmic Cycle
  { label: 'At Dawn', value: 'DAWN', sectionName: 'At Dawn', category: 'Solar Cycle', icon: 'wb_twilight', color: 'orange-4' },
  { label: 'At Dusk', value: 'DUSK', sectionName: 'At Dusk', category: 'Solar Cycle', icon: 'wb_twilight', color: 'deep-orange-4' },
  { label: 'At Midday', value: 'MIDDAY', sectionName: 'At Midday', category: 'Solar Cycle', icon: 'wb_sunny', color: 'yellow-6' },
  { label: 'At Midnight', value: 'MIDNIGHT', sectionName: 'At Midnight', category: 'Solar Cycle', icon: 'dark_mode', color: 'indigo-4' },
  // Rests & Downtime
  { label: 'On a Long Rest', value: 'LONG_REST', sectionName: 'On a Long Rest', category: 'Rest & Downtime', icon: 'nights_stay', color: 'purple-4' },
  { label: 'On a Short Rest', value: 'SHORT_REST', sectionName: 'On a Short Rest', category: 'Rest & Downtime', icon: 'coffee', color: 'purple-4' },
  { label: 'On a Short or Long Rest', value: 'SHORT_OR_LONG_REST', sectionName: 'On a Short or Long Rest', category: 'Rest & Downtime', icon: 'bedtime', color: 'purple-4' },
  { label: 'On Downtime', value: 'DOWNTIME', sectionName: 'On Downtime', category: 'Rest & Downtime', icon: 'hotel', color: 'purple-4' },
]

for (const cadence of CADENCES) {
  if (['TEN_MINUTES', 'MONTHLY', 'BLOODIED'].includes(cadence.id)) TRAIT_RECHARGE_OPTIONS.push({ label: cadence.label, value: cadence.id, sectionName: cadence.label, category: cadence.category, icon: 'schedule', color: 'blue-4' })
}

export const TRAIT_CONDITIONAL_OPTIONS = [
  { label: 'None (Unconditional)', value: '' },
  { label: 'Bloodied only (Bloodied Hit Points)', value: 'Bloodied only' },
  { label: 'When Bloodied', value: 'When Bloodied' },
  { label: 'While in Dim Light or Darkness', value: 'In Dim Light or Darkness' },
  { label: 'While in Sunlight', value: 'In Sunlight' },
  { label: 'While Underwater', value: 'Underwater' },
  { label: 'While Enraged', value: 'While Enraged' },
  { label: 'When Reduced to 0 HP', value: 'When Reduced to 0 HP' },
]

/**
 * Consolidates all recharging, timeframe, and conditional triggers into ONE single elegant tag.
 * e.g. "Recharge 5–6", "2/Day", "Recharges at Dawn", "(2/Day; Bloodied only)"
 */
export function computeTraitTag(trait: MonsterTrait): string {
  if (trait.rechargeTagOverride && trait.rechargeTagOverride.trim()) {
    return trait.rechargeTagOverride.trim()
  }

  const explicitTiming = trait.rechargeTiming || ''
  // Role copies retain action recharge fields; explicit legacy Trait cadence still wins.
  const sharedRecharge = !explicitTiming && actionRecharge(trait)
  if (sharedRecharge) return /^recharge/i.test(sharedRecharge) ? sharedRecharge : `Recharge ${sharedRecharge}`
  const count = trait.rechargeCount ?? trait.limitedUse?.count ?? 0
  const timing = explicitTiming || (count > 0 && trait.limitedUse?.rate ? trait.limitedUse.rate.toUpperCase() : '')
  const trigger = trait.conditionalTrigger?.trim() || ''

  const tagParts: string[] = []

  // Check timing
  if (!explicitTiming && count > 0 && timing && !timing.startsWith('RECHARGE') && cadenceDefinition(timing)?.kind !== 'special') {
    tagParts.push(formatLimitedUses(count, trait.limitedUse?.rate || timing))
  } else if (timing === 'RECHARGE_5_6') {
    tagParts.push('Recharge 5–6')
  } else if (timing === 'RECHARGE_6') {
    tagParts.push('Recharge 6')
  } else if (timing === 'RECHARGE_4_6') {
    tagParts.push('Recharge 4–6')
  } else if (timing === 'DAWN') {
    tagParts.push('Recharges at Dawn')
  } else if (timing === 'DUSK') {
    tagParts.push('Recharges at Dusk')
  } else if (timing === 'MIDDAY') {
    tagParts.push('Recharges at Midday')
  } else if (timing === 'MIDNIGHT') {
    tagParts.push('Recharges at Midnight')
  } else if (timing === 'MINUTE') {
    tagParts.push(count > 0 ? `${count}/Minute` : 'Every Minute')
  } else if (timing === 'HOUR') {
    tagParts.push(count > 0 ? `${count}/Hour` : 'Every Hour')
  } else if (timing === 'INITIATIVE') {
    tagParts.push('On Initiative')
  } else if (timing === 'DOWNTIME') {
    tagParts.push('On Downtime')
  } else if (timing === 'START_OF_ITS_TURN' || timing === 'START_OF_YOUR_TURN') {
    tagParts.push(count > 0 ? `${count}/Turn (Start of its turn)` : 'Start of its turn')
  } else if (timing === 'END_OF_ITS_TURN' || timing === 'END_OF_YOUR_TURN') {
    tagParts.push(count > 0 ? `${count}/Turn (End of its turn)` : 'End of its turn')
  } else if (timing === 'START_OF_A_TURN' || timing === 'START_OF_CREATURE_TURN') {
    tagParts.push(count > 0 ? `${count}/Turn (Start of a turn)` : 'Start of a turn')
  } else if (timing === 'END_OF_A_TURN' || timing === 'END_OF_CREATURE_TURN') {
    tagParts.push(count > 0 ? `${count}/Turn (End of a turn)` : 'End of a turn')
  } else if (timing === 'END_OF_CURRENT_TURN') {
    tagParts.push(count > 0 ? `${count}/Turn (End of current turn)` : 'End of current turn')
  } else if (timing === 'WEEKLY') {
    tagParts.push(count > 0 ? `${count}/Week` : 'Weekly')
  } else if (timing === 'SHORT_REST' || timing === 'SHORT') {
    tagParts.push(count > 0 ? formatLimitedUses(count, 'SHORT_REST') : 'On a Short Rest')
  } else if (timing === 'LONG_REST' || timing === 'LONG') {
    tagParts.push(count > 0 ? formatLimitedUses(count, 'LONG_REST') : 'On a Long Rest')
  } else if (timing === 'SHORT_OR_LONG_REST' || timing === 'REST' || timing === 'LONG_OR_SHORT') {
    tagParts.push(count > 0 ? formatLimitedUses(count, 'LONG_OR_SHORT') : 'On a Short or Long Rest')
  } else if (timing === 'DAY') {
    tagParts.push(count > 0 ? `${count}/Day` : 'Every Day')
  } else if (timing === 'DAY_EACH') {
    tagParts.push(count > 0 ? `${count}/Day Each` : 'Daily Each')
  } else if (timing === 'TURN') {
    tagParts.push(count > 0 ? `${count}/Turn` : 'Per Turn')
  } else if (timing === 'ROUND') {
    tagParts.push(count > 0 ? `${count}/Round` : 'Per Round')
  } else if (cadenceDefinition(timing)) {
    tagParts.push(count > 0 ? formatLimitedUses(count, timing) : cadenceDefinition(timing)?.label || timing)
  } else if (count > 0) {
    tagParts.push(`${count} Uses`)
  }

  // Check conditional trigger
  if (trigger && trigger !== 'none') {
    if (trigger.toLowerCase().includes('bloodied')) {
      tagParts.push('Bloodied only')
    } else {
      tagParts.push(trigger)
    }
  }

  return tagParts.join('; ')
}

export interface DynamicValueContext {
  avgHp?: number
  maxHp?: number
  proficiency?: number
  hd?: number
  hitDice?: number
  hdType?: number
  cr?: number
  stats?: Record<string, number>
}

/**
 * Evaluates a numeric formula ("8 + PB + CHA_MOD", "HP / 2", "max(1, CON_MOD)")
 * with the shared formula engine (src/core/domain/formula.ts). No eval.
 * Older spellings ("PROFICIENCY BONUS", "2X PB", "STR MOD") still work.
 * Returns the average rounded down, or null when the text is not a formula.
 */
export function evaluateSafeFormula(expr: string | number, ctx?: DynamicValueContext): number | null {
  if (expr == null) return null
  if (typeof expr === 'number') return Number.isFinite(expr) ? Math.floor(expr) : null
  const str = String(expr).trim()
  if (!str) return null
  if (/^-?\d+$/.test(str)) return parseInt(str, 10)
  const result = evaluateFormula(normalizeLegacyFormula(str), formulaContextFromDynamic(ctx))
  return result.ok ? result.value : null
}

/** Adapts the lightweight dynamic-value context to the formula engine's context. */
export function formulaContextFromDynamic(ctx?: DynamicValueContext): FormulaContext {
  const hd = ctx?.hd ?? ctx?.hitDice ?? 2
  return buildFormulaContext(
    {
      stats: ctx?.stats as FormulaContext['stats'] | undefined,
      proficiency: ctx?.proficiency ?? 2,
      HP: { HD: hd, type: ctx?.hdType ?? 8, modifier: 0 },
      CR: ctx?.cr ?? 0,
    },
    { hp: ctx?.avgHp ?? ctx?.maxHp ?? 20 }
  )
}

/** Display text of a formula: "15", or "9 (2d8)" when dice are involved. Null when invalid. */
function formulaDisplayText(expr: string | number | null | undefined, ctx?: DynamicValueContext): string | null {
  if (expr == null) return null
  const str = String(expr).trim()
  if (!str) return null
  const result = evaluateFormula(normalizeLegacyFormula(str), formulaContextFromDynamic(ctx), { style: 'number' })
  return result.ok ? result.text : null
}

export function resolveDynamicNumericSource(
  source: string | undefined,
  flatVal: number | string | null | undefined,
  diceFormula?: string,
  ctx?: DynamicValueContext
): string {
  const hp = ctx?.avgHp ?? ctx?.maxHp ?? 20
  const pb = ctx?.proficiency ?? 2
  const hd = ctx?.hd ?? ctx?.hitDice ?? 2
  const stats = ctx?.stats ?? { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 }
  const mod = (stat: string) => Math.floor(((stats[stat] ?? 10) - 10) / 2)

  // Direct formula or custom evaluation
  if (flatVal != null && typeof flatVal === 'string' && /[+\-*/()]/.test(flatVal)) {
    const evaluated = formulaDisplayText(flatVal, ctx)
    if (evaluated != null) return evaluated
  }

  if (!source || source === 'flat') {
    if (flatVal != null && typeof flatVal === 'string' && isNaN(Number(flatVal))) {
      const evalFlat = formulaDisplayText(flatVal, ctx)
      if (evalFlat != null) return evalFlat
    }
    return `${flatVal ?? 10}`
  }
  const normSource = source.toLowerCase()
  if (normSource === '1') return '1'
  if (normSource === 'zero_hp') return '0'
  if (normSource === 'cr') return `${ctx?.cr ?? 0}`
  if (normSource === 'half_hp') return `${Math.max(1, Math.floor(hp / 2))}`
  if (normSource === 'quarter_hp') return `${Math.max(1, Math.floor(hp / 4))}`
  if (normSource === 'eighth_hp') return `${Math.max(1, Math.floor(hp / 8))}`
  if (normSource === 'proficiency' || normSource === 'pb') return `${pb}`
  if (normSource === 'twice_proficiency' || normSource === '2x_pb') return `${pb * 2}`
  if (normSource === 'hit_dice' || normSource === 'hd_count' || normSource === 'hd') return ctx?.hdType ? `${hd}d${ctx.hdType}` : `${hd}`
  if (normSource === 'hd_type') return `${ctx?.hdType ?? 8}`
  if (normSource === 'dice') return diceFormula?.trim() || '2d8'

  // Custom formula evaluation
  if (normSource === 'custom_formula' || normSource === 'formula') {
    if (diceFormula) {
      const res = formulaDisplayText(diceFormula, ctx)
      if (res != null) return res
      return diceFormula.trim()
    }
    if (flatVal != null) {
      const res = formulaDisplayText(flatVal, ctx)
      if (res != null) return res
    }
  }

  // Ability modifiers and scores
  const statMap: Record<string, string> = {
    str: 'STR', dex: 'DEX', con: 'CON', int: 'INT', wis: 'WIS', cha: 'CHA',
  }
  for (const [k, statKey] of Object.entries(statMap)) {
    if (normSource === `${k}_mod`) return `${Math.max(1, mod(statKey))}`
    if (normSource === `${k}_score`) return `${stats[statKey] ?? 10}`
    if (normSource === `dice_${k}_mod`) {
      const m = mod(statKey)
      const d = diceFormula?.trim() || '2d8'
      return m > 0 ? `${d} + ${m}` : m < 0 ? `${d} - ${Math.abs(m)}` : d
    }
  }

  // Any formula reference ("SPELL_DC", "HD d HD_DIE") or expression works as a source
  const directEval = formulaDisplayText(source, ctx)
  if (directEval != null) return directEval

  return `${flatVal ?? 10}`
}

/**
 * Formats minimalist notation for Regeneration near hit points.
 * e.g. "+10/turn (acid or fire)"
 */
export function formatMinimalistRegen(
  regen: MonsterExtendedHp['regeneration'],
  ctx?: DynamicValueContext,
  formatValue: (field: string, value: string | number) => string = (_field, value) => String(value)
): string {
  if (!regen || !regen.enabled) return ''
  const type = regen.recoveryType || 'regen'
  const valSrc = regen.valueSource || 'flat'
  if (valSrc === 'none') return ''
  if (valSrc === 'flat' && (regen.amount == null || Number(regen.amount) <= 0) && type !== 'absorb_hp' && type !== 'absorb_temp_hp') {
    return ''
  }
  const amt = formatValue('amount', resolveDynamicNumericSource(valSrc, regen.amount ?? 10, regen.diceFormula, ctx))

  const rawFreq = regen.frequency || regen.timeframe || ''
  const freq = rawFreq.toLowerCase()
  if (freq === 'none') return ''
  let tf = regen.timeframe || 'turn'
  if (freq === 'turn_start' || freq === 'start_of_its_turn' || freq === 'turn') tf = 'turn'
  else if (freq === 'a_turn_start' || freq === 'start_of_a_turn') tf = 'start of a turn'
  else if (freq === 'turn_end' || freq === 'end_turn' || freq === 'end_of_its_turn') tf = 'end of its turn'
  else if (freq === 'a_turn_end' || freq === 'end_of_a_turn') tf = 'end of a turn'
  else if (freq === 'current_turn_end' || freq === 'end_of_current_turn') tf = 'end of current turn'
  else if (freq === 'minute') tf = 'minute'
  else if (freq === 'hour') tf = 'hour'
  else if (freq === 'day') tf = 'day'
  else if (freq === 'dawn') tf = 'at dawn'
  else if (freq === 'dusk') tf = 'at dusk'
  else if (freq === 'midday') tf = 'at midday'
  else if (freq === 'midnight') tf = 'at midnight'
  else if (freq === 'short_rest') tf = 'on a short rest'
  else if (freq === 'long_rest') tf = 'on a long rest'
  else if (freq === 'downtime') tf = 'on downtime'

  const types = Array.isArray(regen.disruptedByTypes)
    ? (regen.disruptedByTypes.length > 0 ? regen.disruptedByTypes.join(' or ') : '')
    : (regen.disruptedBy && regen.disruptedBy.trim() ? regen.disruptedBy.trim() : '')
  const note = regen.disruptedByNote ? regen.disruptedByNote.trim() : ''

  // Enriched Heuristic Special Conditions (5 target mechanics)
  const condMod = regen.conditionModifier || ''
  const isTempHp = type === 'temp_hp' || type === 'absorb_temp_hp'
  if (condMod === 'not_bloodied' || regen.triggerCondition === 'not_bloodied') {
    return isTempHp
      ? `Gains ${amt} Temporary Hit Points while not Bloodied`
      : `Regains ${amt} hit points while not Bloodied`
  }
  if (condMod === 'head_not_severed' || (note && (note.toLowerCase().includes('head is not severed') || note.toLowerCase().includes('head not severed')))) {
    return `+${amt} hit points at start of your turn if your head is not severed`
  }
  if (condMod === 'max_hp_reduction' || regen.maxHpReductionUntil) {
    const dmgTypes = Array.isArray(regen.disruptedByTypes) && regen.disruptedByTypes.length > 0
      ? regen.disruptedByTypes.join(' and ')
      : (types || 'Acid and Fire')
    const untilStr = regen.maxHpReductionUntil || 'short rest'
    return `${dmgTypes} reduces maximum hit points until ${untilStr}`
  }
  if (condMod === 'has_temp_hp' || (isTempHp && regen.triggerCondition === 'has_temp_hp')) {
    return `${amt} of temporary hit points if you have temporary hit points`
  }
  if (condMod === 'no_damage_since_previous_turn' || (regen.styleMode === 'natural' && types && (freq === 'no_damage_taken' || tf === 'turn'))) {
    return `+${amt} hit points at start of your turn if you did not take ${types} damage since your previous turn`
  }

  const condNote = (freq === 'no_damage_taken' || regen.triggerCondition === 'no_damage_taken')
    ? 'if took no dmg since last turn'
    : (freq === 'damage_taken' || regen.triggerCondition === 'damage_taken')
      ? `when taking ${regen.triggeredByDamageType || 'necrotic'} dmg`
      : ''
  const dis = [types, note, condNote].filter(Boolean).join(', ')

  if (type === 'absorb_hp') {
    const baseAbsorb = `regains HP from ${regen.triggeredByDamageType || 'necrotic'} dmg`
    return dis ? `${baseAbsorb} (${dis})` : baseAbsorb
  }
  if (type === 'absorb_temp_hp') {
    const baseAbsorbTemp = `temp HP from ${regen.triggeredByDamageType || 'lightning'} dmg`
    return dis ? `${baseAbsorbTemp} (${dis})` : baseAbsorbTemp
  }
  if (type === 'temp_hp') {
    let trig = tf === 'turn' ? 'start of its turn' : tf
    if (freq === 'no_damage_taken' || regen.triggerCondition === 'no_damage_taken') trig = 'if took no dmg since last turn'
    else if (freq === 'damage_taken' || regen.triggerCondition === 'damage_taken') trig = `when taking ${regen.triggeredByDamageType || 'lightning'} dmg`
    else if (freq === 'minute' || freq === 'hour' || freq === 'day') trig = `every ${tf}`
    const extraDis = [types, note].filter(Boolean).join(', ')
    const fullTempNotes = [trig, extraDis ? `disrupted by ${extraDis}` : ''].filter(Boolean).join('; ')
    return `+${amt} temp HP (${fullTempNotes})`
  }

  const sep = tf.startsWith('at ') || tf.startsWith('on ') ? ` ${tf}` : `/${tf}`
  if (dis) {
    return `+${amt}${sep} (${dis})`
  }
  return `+${amt}${sep}`
}

export function formatOrdinalNumber(n: number): string {
  const num = Math.max(1, Math.floor(Number(n) || 1))
  const v = num % 100
  if (v >= 11 && v <= 13) return `${num}th`
  switch (num % 10) {
    case 1: return `${num}st`
    case 2: return `${num}nd`
    case 3: return `${num}rd`
    default: return `${num}th`
  }
}

export function resolveInvulnerabilityDisplayLocation(
  inv: MonsterExtendedHp['invulnerability'] | undefined
): 'ac' | 'hp' {
  if (!inv) return 'ac'
  const conds = Array.isArray(inv.conditions) ? inv.conditions.filter(Boolean) : []
  const damageOnlyQualifiers = new Set(['different_damage_type', 'specific_damage_types'])
  const hitQualifiers = new Set([
    'critical_hits',
    'attacks_with_advantage',
    'nth_attack_in_round',
    'first_x_attacks_miss',
    'different_attacker',
    'alignment',
    'magical_weapons',
    'adamantine_weapons',
    'silvered_weapons',
    'turn_crits_to_normal',
    'attacker_save',
  ])
  if (conds.length > 0) {
    const hasDamageQualifier = conds.some((c) => damageOnlyQualifiers.has(c))
    const hasHitQualifier = conds.some((c) => hitQualifiers.has(c))
    if (hasDamageQualifier && !hasHitQualifier) return 'hp'
    if (hasHitQualifier) return 'ac'
  }
  if (inv.rule === 'takes_damage_only_from' || inv.rule === 'diff_damage_type') return 'hp'
  if (inv.displayLocation === 'hp') return 'hp'
  return 'ac'
}

/**
 * Smart Heuristic Composer for Decoupled Invulnerability Rules & N Combinable Conditions.
 * Supports unified Conditions & Qualifiers list directly as well as legacy rule strings.
 */
export function composeInvulnerabilityRuling(
  inv: MonsterExtendedHp['invulnerability'] | undefined
): string {
  if (!inv) return ''
  const rule = inv.rule || 'none'
  const conds = Array.isArray(inv.conditions) ? inv.conditions.filter(Boolean) : []
  const hasActiveRule = inv.enabled || (rule && rule !== 'none') || conds.length > 0
  if (!hasActiveRule || (rule === 'none' && conds.length === 0)) return ''

  const formatDisrupt = (disruption: string | undefined, customDisruption?: string): string => {
    if (!disruption || disruption === 'none') return ''
    if (disruption === 'custom') return customDisruption?.trim() || ''
    const dMap: Record<string, string> = {
      incapacitated: 'Incapacitated',
      critical_hits: 'Critical Hits',
      stunned: 'Stunned',
      paralyzed: 'Paralyzed',
      unconscious: 'Unconscious',
      radiant_or_fire: 'Radiant or Fire damage',
      adamantine: 'Adamantine weapons',
      magical: 'Magical attacks',
      psychic: 'Psychic damage',
      silvered: 'Silvered weapons',
      sunlight: 'Sunlight',
    }
    return dMap[disruption] || disruption
  }

  // If decoupled archetype ('only_x_can_hit' or 'takes_damage_only_from') or conditions array is populated:
  if (rule === 'only_x_can_hit' || rule === 'takes_damage_only_from' || conds.length > 0) {
    const activeConds = conds.length > 0 ? conds : (rule === 'takes_damage_only_from' ? ['different_damage_type'] : ['critical_hits'])
    const isDamageMode = rule === 'takes_damage_only_from' || resolveInvulnerabilityDisplayLocation(inv) === 'hp'

    // Separate primary qualifiers from state ("while ...") and standalone clauses
    const hitSources: string[] = []
    const whileClauses: string[] = []
    const standaloneClauses: string[] = []

    const hasCrit = activeConds.includes('critical_hits')
    const hasAdv = activeConds.includes('attacks_with_advantage')
    const hasSpeedNotZero = activeConds.includes('speed_not_zero')

    for (const c of activeConds) {
      if (c === 'critical_hits') {
        hitSources.push(hasAdv || hasSpeedNotZero ? 'critical hits' : 'Critical Hits')
      } else if (c === 'attacks_with_advantage') {
        hitSources.push('attacks with Advantage')
      } else if (c === 'nth_attack_in_round') {
        const ord = formatOrdinalNumber(inv.nthAttack ?? inv.firstXCount ?? 3)
        hitSources.push(`the ${ord} attack in a round`)
      } else if (c === 'first_x_attacks_miss') {
        const count = inv.firstXCount ?? inv.nthAttack ?? 1
        standaloneClauses.push(`First ${count} attack${count === 1 ? '' : 's'} in a round Miss you`)
      } else if (c === 'different_attacker') {
        hitSources.push('attacks from an attacker that did not attack you since your previous turn')
      } else if (c === 'alignment') {
        const align = inv.alignmentFilter?.trim() || 'Good'
        hitSources.push(`${align} Aligned creatures`)
      } else if (c === 'magical_weapons') {
        hitSources.push('Magical weapons or spells')
      } else if (c === 'adamantine_weapons') {
        hitSources.push('Adamantine weapons')
      } else if (c === 'silvered_weapons') {
        hitSources.push('Silvered weapons')
      } else if (c === 'different_damage_type') {
        if (isDamageMode) {
          hitSources.push('a type different from last damage type taken')
        } else {
          standaloneClauses.push('Takes damage only from a type different from last damage type taken')
        }
      } else if (c === 'specific_damage_types') {
        const dTypes = Array.isArray(inv.damageTypesFilter) && inv.damageTypesFilter.length > 0
          ? inv.damageTypesFilter.join(' or ')
          : 'Radiant or Fire'
        if (isDamageMode) {
          hitSources.push(`${dTypes} damage`)
        } else {
          standaloneClauses.push(`Takes damage only from ${dTypes} damage`)
        }
      } else if (c === 'turn_crits_to_normal') {
        standaloneClauses.push('Turn critical Hits into normal hits')
      } else if (c === 'attacker_save') {
        const stat = inv.saveStat || 'Wisdom'
        const dc = inv.saveDc ?? 15
        standaloneClauses.push(`Attacker must succeed on a ${stat} Saving Throw DC ${dc} to automatically Hit instead`)
      } else if (c === 'speed_not_zero') {
        whileClauses.push("while your speed isn't 0")
      } else if (c === 'not_incapacitated') {
        whileClauses.push('while not Incapacitated')
      } else if (c === 'not_stunned') {
        whileClauses.push('while not Stunned')
      } else if (c === 'not_paralyzed') {
        whileClauses.push('while not Paralyzed')
      } else if (c === 'not_unconscious') {
        whileClauses.push('while not Unconscious')
      } else if (c === 'not_in_sunlight') {
        whileClauses.push('while not in Sunlight')
      } else if (c.startsWith('disrupted_by_')) {
        const sub = c.replace('disrupted_by_', '')
        const dMap: Record<string, string> = {
          acid: 'Acid damage',
          fire: 'Fire damage',
          radiant: 'Radiant damage',
          force: 'Force damage',
          silvered: 'Silvered weapons',
          adamantine: 'Adamantine weapons',
          magical: 'Magical attacks',
          holy_water: 'Holy Water',
          sunlight: 'Sunlight',
          incapacitated: 'Incapacitated',
          stunned: 'Stunned',
          unconscious: 'Unconscious',
          paralyzed: 'Paralyzed',
        }
        standaloneClauses.push(`disrupted by ${dMap[sub] || sub}`)
      }
    }

    const composedSegments: string[] = []
    const combinerWord = inv.combiner === 'and' ? ' and ' : ' or '

    if (hitSources.length > 0) {
      const joinedSources = hitSources.length === 1
        ? hitSources[0]
        : hitSources.length === 2
          ? `${hitSources[0]}${combinerWord}${hitSources[1]}`
          : `${hitSources.slice(0, -1).join(', ')},${combinerWord}${hitSources[hitSources.length - 1]}`

      if (isDamageMode) {
        composedSegments.push(`Takes damage only from ${joinedSources}`)
      } else {
        // Match exact casing heuristics from prompt examples:
        // "Only Critical Hits can Hit you" vs "Only critical hits can hit you, while your speed isn't 0" vs "Only critical hits or attacks with Advantage can hit you" vs "Only the 3rd attack in a round can hit you" vs "Only X Aligned creatures can Hit you"
        const useLowerHit = (hasCrit && (hasAdv || hasSpeedNotZero)) || activeConds.includes('nth_attack_in_round')
        const verb = useLowerHit ? 'can hit you' : 'can Hit you'
        composedSegments.push(`Only ${joinedSources} ${verb}`)
      }
    } else if (standaloneClauses.length === 0 && whileClauses.length > 0) {
      composedSegments.push(isDamageMode ? 'Cannot take damage' : "Attacks can't Hit you")
    }

    if (standaloneClauses.length > 0) {
      composedSegments.push(...standaloneClauses)
    }

    let mainClause = composedSegments.join('; ')
    if (whileClauses.length > 0) {
      mainClause += `${mainClause ? ', ' : ''}${whileClauses.join(' and ')}`
    }
    if (inv.customLogic?.trim()) {
      mainClause = mainClause ? `${mainClause}; ${inv.customLogic.trim()}` : inv.customLogic.trim()
    }

    const dStr = formatDisrupt(inv.disruption || (inv as any).disruptedBy, inv.customDisruption)
    const customNote = inv.customDisruption?.trim() && inv.disruption !== 'custom' ? `; ${inv.customDisruption.trim()}` : ''
    const customRuleNote = inv.customRule?.trim() ? `; ${inv.customRule.trim()}` : ''

    return `Invulnerable (${mainClause}${dStr ? `; disrupted by ${dStr}` : ''}${customRuleNote}${customNote})`
  }

  // Legacy rule fallback for backward compatibility
  const ruleMap: Record<string, string> = {
    only_crit: 'Only Critical Hits can Hit you',
    only_crits_hit: 'Only Critical Hits can Hit you',
    only_first_attack: 'Only 1st attack in a Round can Hit you',
    only_1st_attack_hits: 'Only 1st attack in a Round can Hit you',
    first_x_miss: `First ${inv.firstXCount || (inv as any).attackCount || 1} attacks in a round Miss you`,
    first_x_attacks_miss: `First ${inv.firstXCount || (inv as any).attackCount || 1} attacks in a round Miss you`,
    attacker_not_attacked: 'Only attacks from an attacker which did not attack you since your previous turn can Hit you',
    different_attacker_only: 'Only attacks from an attacker which did not attack you since your previous turn can Hit you',
    no_adv_miss: 'Attacks without Advantage Miss you',
    no_advantage_miss: 'Attacks without Advantage Miss you',
    crit_becomes_normal: 'Turn critical Hits into normal hits',
    crits_become_normal: 'Turn critical Hits into normal hits',
    no_adv_against: "Attacks can't have Advantage against you",
    no_advantage_against: "Attacks can't have Advantage against you",
    while_not_incapacitated: "Attacks can't hit you while not Incapacitated",
    cant_hit_not_incapacitated: "Attacks can't hit you while not Incapacitated",
    speed_greater_zero: "Attacks can't Hit you as long as your speed is higher than 0",
    cant_hit_speed_gt_0: "Attacks can't Hit you as long as your speed is higher than 0",
    disadv_speed_greater_zero: 'Attacks have Disadvantage against you as long as your speed is higher than 0',
    disadv_speed_gt_0: 'Attacks have Disadvantage against you as long as your speed is higher than 0',
    diff_damage_type: 'Takes damage only from a type different from last damage type taken',
  }
  const ruleStr = ruleMap[rule] || inv.customRule || rule
  const dStr = formatDisrupt(inv.disruption || (inv as any).disruptedBy, inv.customDisruption)
  const customNote = inv.customDisruption?.trim() && inv.disruption !== 'custom' ? `; ${inv.customDisruption.trim()}` : ''
  return `Invulnerable (${ruleStr}${dStr ? `; disrupted by ${dStr}` : ''}${customNote})`
}

/**
 * Formats minimalist direct notation for Death Prevention near hit points.
 * Eliminates redundant "Immortal (...)" wrapper words and outputs direct 5e mechanics.
 * e.g. "Can't be reduced below 1 hit point from Non-Radiant damage" or
 * "On 0 hit points, makes a Constitution Saving Throw DC 15, on Success returns to 1" or
 * "When bloodied, makes a Constitution Saving Throw DC 15, on Success returns to 200" or
 * "When bloodied, makes a Constitution Saving Throw DC 15, on Failure Dies"
 */
export function formatMinimalistDeathPrevention(
  dp: MonsterExtendedHp['deathPrevention'],
  ctx?: DynamicValueContext
): string {
  if (!dp || !dp.enabled || dp.name === 'Mortal') return ''
  const name = dp.name?.trim() || 'Immortal'

  // 1. Upon Death Burst Damage
  const isDeathBurst = dp.triggerCondition === 'upon_death_burst' || dp.uponDeathDealsDamage
  let burstText = ''
  if (isDeathBurst) {
    const burstAmt = resolveDynamicNumericSource(dp.deathBurstDamageSource, dp.deathBurstDamageAmount ?? 38, dp.deathBurstDamageDice, ctx)
    const burstType = dp.deathBurstDamageType || 'Radiant'
    const targetFilter = dp.deathBurstTargetFilter || 'Creatures'
    const range = dp.deathBurstRange || 30
    burstText = `Upon death Deals ${burstAmt} of ${burstType} damage to all ${targetFilter} within ${range}ft`
    if (dp.triggerCondition === 'upon_death_burst' && !dp.returnHpSource) {
      return burstText
    }
  }

  // 2. Until X Critical Hits
  if (dp.dcRule === 'until_x_crits' || dp.name === 'Until X Critical Hits') {
    const crits = dp.critHitsToKill || (dp as any).critHitThreshold || 3
    const ex = Array.isArray(dp.exceptions) && dp.exceptions.length > 0 ? dp.exceptions.join(' or ') : ''
    const note = dp.customNote ? dp.customNote.trim() : ''
    const exceptionsStr = [ex, note].filter(Boolean).join(', ')
    if (dp.name === 'Direct') {
      return `Until being hit by ${crits} Critical Hits${exceptionsStr ? `; or ${exceptionsStr}` : ''}`
    }
    return `Immortal (Until being hit by ${crits} Critical Hits${exceptionsStr ? `; or ${exceptionsStr}` : ''})`
  }

  if (dp.hideHp) {
    return 'Immortal'
  }

  // 3. Cant be reduced below 1 HP
  if (dp.dcRule === 'cant_be_reduced_below_1' || dp.name === "Can't be reduced below 1 HP") {
    const ex = Array.isArray(dp.exceptions) && dp.exceptions.length > 0 ? dp.exceptions.join(' or ') : ''
    const note = dp.customNote ? dp.customNote.trim() : ''
    const exceptionsStr = [ex, note].filter(Boolean).join(', ')
    return `Can't be reduced below 1 hit point from ${exceptionsStr ? `Non-${exceptionsStr}` : 'Non-Radiant'} damage`
  }

  // 4. Death Saving Throw Success
  if (dp.triggerCondition === 'death_save_success') {
    const retVal = resolveDynamicNumericSource(dp.returnHpSource || '1', dp.returnHpValue ?? 1, dp.returnHpDice, ctx)
    const revivalText = `Returns with ${retVal} hit point${retVal === '1' ? '' : 's'} upon Death Saving Throw Success`
    return burstText ? `${revivalText}, ${burstText}` : revivalText
  }

  // 5. Return HP / Revival Rules
  if (dp.returnHpSource || dp.dcRule === 'always_survives' || dp.triggerCondition === 'not_reduced_by') {
    const retVal = resolveDynamicNumericSource(dp.returnHpSource || '1', dp.returnHpValue ?? 1, dp.returnHpDice, ctx)
    const rawStat = dp.saveStat || 'CON'
    const statName = rawStat.length <= 3
      ? (rawStat === 'CON' ? 'Constitution' : rawStat === 'WIS' ? 'Wisdom' : rawStat === 'STR' ? 'Strength' : rawStat === 'DEX' ? 'Dexterity' : rawStat === 'INT' ? 'Intelligence' : 'Charisma')
      : rawStat
    const saveDc = dp.saveDc ?? (dp.dcRule === 'dc_10_flat' ? 10 : 15)

    if (dp.triggerCondition === 'bloodied') {
      if (dp.dcRule === 'on_failure_dies') {
        return `When bloodied, makes a ${statName} Saving Throw DC ${saveDc}, on Failure Dies`
      }
      return `When bloodied, makes a ${statName} Saving Throw DC ${saveDc}, on Success returns to ${retVal}`
    }

    if (dp.dcRule === 'direct_save') {
      return `On 0 hit points, makes a ${statName} Saving Throw DC ${saveDc}, on Success returns to ${retVal}`
    }

    const tf = dp.returnTimeframe === 'at_end_of_turn'
      ? ' at end of turn'
      : (dp.returnTimeframe === 'start_of_next_turn' ? ' at start of next turn' : '')

    let formattedExceptions = ''
    if (Array.isArray(dp.exceptions) && dp.exceptions.length > 0) {
      if (dp.exceptions.length === 2) {
        formattedExceptions = `${dp.exceptions[0]}, or ${dp.exceptions[1]}`
      } else {
        formattedExceptions = dp.exceptions.join(', or ')
      }
    }
    if (dp.customNote) {
      formattedExceptions = formattedExceptions ? `${formattedExceptions}, or ${dp.customNote}` : dp.customNote
    }

    let revivalText = ''
    if (name === 'Immortal' && !dp.triggerCondition && dp.dcRule !== 'always_survives') {
      const legacyEx = Array.isArray(dp.exceptions) && dp.exceptions.length > 0 ? dp.exceptions.join(' or ') : ''
      const exStr = [legacyEx, dp.customNote].filter(Boolean).join(', ')
      let ruleText = `Returns to life with ${retVal} hit point${retVal === '1' ? '' : 's'}${tf}`
      if (dp.requiresSave) {
        ruleText += ` on a DC ${saveDc} ${dp.saveStat || 'CON'} save`
      } else if (dp.dcRule && dp.dcRule !== 'none') {
        if (dp.dcRule === 'dc_5_plus_dmg') ruleText += ' on a CON save DC 5 + damage taken'
        else if (dp.dcRule === 'dc_10_flat') ruleText += ' on a DC 10 CON save'
        else if (dp.dcRule === 'dc_15_flat') ruleText += ' on a DC 15 CON save'
      }
      if (exStr) {
        ruleText += `, if not reduced to zero by ${exStr}`
      }
      revivalText = `Immortal (${ruleText})`
    } else if (dp.requiresSave || (dp.dcRule && dp.dcRule !== 'none' && dp.dcRule !== 'always_survives' && dp.dcRule !== 'dc_10_flat' && dp.dcRule !== 'dc_15_flat' && dp.dcRule !== 'dc_5_plus_dmg')) {
      revivalText = `Returns with ${retVal} hit point${retVal === '1' ? '' : 's'}${tf} on a DC ${saveDc} ${rawStat} save`
    } else if (dp.dcRule === 'dc_5_plus_dmg') {
      revivalText = `Returns with ${retVal} hit point${retVal === '1' ? '' : 's'}${tf} on a CON save DC 5 + damage taken`
    } else if (dp.dcRule === 'dc_10_flat') {
      revivalText = `Returns with ${retVal} hit point${retVal === '1' ? '' : 's'}${tf} on a DC 10 CON save`
    } else if (dp.dcRule === 'dc_15_flat') {
      revivalText = `Returns with ${retVal} hit point${retVal === '1' ? '' : 's'}${tf} on a DC 15 CON save`
    } else {
      // Natural 5e prose format: "Returns with 1 hit point if Not Reduced to 0 by..."
      if (formattedExceptions) {
        revivalText = `Returns with ${retVal} hit point${retVal === '1' ? '' : 's'}${tf} if Not Reduced to 0 by ${formattedExceptions}`
      } else {
        revivalText = `Returns with ${retVal} hit point${retVal === '1' ? '' : 's'}${tf}`
      }
    }

    return burstText ? `${revivalText}, ${burstText}` : revivalText
  }

  const ex = Array.isArray(dp.exceptions) && dp.exceptions.length > 0 ? dp.exceptions.join(' or ') : ''
  const note = dp.customNote ? dp.customNote.trim() : ''
  const exceptionsStr = [ex, note].filter(Boolean).join(', ')

  if (exceptionsStr) {
    const text = `${name} (${exceptionsStr})`
    return burstText ? `${text}, ${burstText}` : text
  }
  return burstText || name
}

export interface AcComposedResult {
  totalAc: number
  armorTypeDesc: string
  badges: string[]
  fullText: string
  isAbsoluteRule?: boolean
  absoluteRuleText?: string
}

/**
 * Universal AC Heuristic & Formula Compositor Engine.
 * Seamlessly integrates Base AC, Ability Modifiers, Defense Items, Reaction Buffs,
 * and all 37 target gameplay defensive/invulnerability mechanics.
 */
export function composeAcAndDefenses(
  monster: {
    AC: number
    ACType?: string
    stats?: Record<string, number>
    proficiency?: number
    CR?: number
    HP?: { HD: number }
    acConfig?: MonsterAcConfig
    defenseSchedules?: Partial<Record<DefenseEffect, RiderSchedule>>
  }
): AcComposedResult {
  const cfg = monster.acConfig || {}
  const scheduled = (effect: DefenseEffect, text: string) => {
    const schedule = monster.defenseSchedules?.[effect]
    const ruling = schedule?.timing ? text.replace(/ as a Reaction$/, '') : text
    return formatRiderSchedule(ruling, schedule)
  }
  const stats = monster.stats || { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 }
  const mod = (stat: string) => Math.floor(((stats[stat] ?? 10) - 10) / 2)
  const dexMod = mod('DEX')
  const conMod = mod('CON')
  const wisMod = mod('WIS')
  const intMod = mod('INT')
  const chaMod = mod('CHA')
  const strMod = mod('STR')
  const pb = monster.proficiency ?? 2
  const cr = monster.CR ?? 0
  const hd = monster.HP?.HD ?? 1

  let base = monster.AC || 10
  const armorParts: string[] = []

  const mode = cfg.baseMode || 'flat'
  if (mode === '10') {
    base = 10 + dexMod
  } else if (mode === 'leather') {
    base = 11 + dexMod
    armorParts.push('leather armor')
  } else if (mode === 'studded_leather') {
    base = 12 + dexMod
    armorParts.push('studded leather')
  } else if (mode === 'hide') {
    base = 12 + Math.min(2, dexMod)
    armorParts.push('hide armor')
  } else if (mode === 'chain_shirt') {
    base = 13 + Math.min(2, dexMod)
    armorParts.push('chain shirt')
  } else if (mode === 'scale_mail') {
    base = 14 + Math.min(2, dexMod)
    armorParts.push('scale mail')
  } else if (mode === 'breastplate') {
    base = 14 + Math.min(2, dexMod)
    armorParts.push('breastplate')
  } else if (mode === 'half_plate') {
    base = 15 + Math.min(2, dexMod)
    armorParts.push('half plate')
  } else if (mode === 'ring_mail') {
    base = 14
    armorParts.push('ring mail')
  } else if (mode === 'chain_mail') {
    base = 16
    armorParts.push('chain mail')
  } else if (mode === 'splint') {
    base = 17
    armorParts.push('splint armor')
  } else if (mode === 'plate') {
    base = 18
    armorParts.push('plate armor')
  } else if (mode === 'arcane_armor') {
    base = 13 + Math.max(dexMod, intMod)
    armorParts.push('arcane armor')
  } else if (mode === 'str_score') {
    base = stats.STR || 10
  } else if (mode === 'dex_score') {
    base = stats.DEX || 10
  } else if (mode === 'con_score') {
    base = stats.CON || 10
  } else if (mode === 'int_score') {
    base = stats.INT || 10
  } else if (mode === 'wis_score') {
    base = stats.WIS || 10
  } else if (mode === 'cha_score') {
    base = stats.CHA || 10
  }

  // 2. Ability Bonus
  if (cfg.abilityBonus === 'STR') base += strMod
  else if (cfg.abilityBonus === 'DEX' && mode !== '10' && !mode.includes('leather')) base += dexMod
  else if (cfg.abilityBonus === 'CON') base += conMod
  else if (cfg.abilityBonus === 'WIS') base += wisMod
  else if (cfg.abilityBonus === 'INT') base += intMod
  else if (cfg.abilityBonus === 'CHA') base += chaMod
  else if (cfg.abilityBonus === 'pb') base += pb
  else if (cfg.abilityBonus === 'cr') base += cr
  else if (cfg.abilityBonus === 'hd') base += hd

  // 3. Defense Item
  if (cfg.defenseItem === 'shield') {
    base += 2
    armorParts.push('shield')
  } else if (cfg.defenseItem === 'animated_shield') {
    base += 2
    armorParts.push('animated shield')
  } else if (cfg.defenseItem === 'cloak_of_protection') {
    base += 1
    armorParts.push('cloak of protection')
  } else if (cfg.defenseItem === 'ring_of_protection') {
    base += 1
    armorParts.push('ring of protection')
  } else if (cfg.defenseItem === 'defender') {
    base += 3
    armorParts.push('defender')
  } else if (cfg.defenseItem === 'bracers_of_defense') {
    base += 2
    armorParts.push('bracers of defense')
  } else if (cfg.defenseItem === 'custom') {
    base += (cfg.defenseItemCustomBonus || 1)
    if (cfg.defenseItemCustomName) armorParts.push(cfg.defenseItemCustomName.trim())
  }

  // 4. Temporary & Reaction
  const tempNotes: string[] = []
  if (cfg.temporary === 'spell_shield') {
    tempNotes.push(`${base + 5} with Shield spell as a Reaction`)
  } else if (cfg.temporary === 'spell_shield_of_faith') {
    tempNotes.push(`${base + 2} with Shield of Faith`)
  } else if (cfg.temporary === 'parry_pb' || cfg.temporary === 'parry_custom') {
    const parryVal = cfg.temporary === 'parry_pb' ? pb : (cfg.temporaryCustomBonus || 3)
    tempNotes.push(`${base + parryVal}, Parry as a Reaction`)
  }

  const temporaryCount = tempNotes.length

  // 5. Conditional Modifiers
  if (cfg.conditional === 'all_attacks_beyond_first') {
    const b = cfg.conditionalBonus ?? 2
    const tf = cfg.conditionalTimeframe || 'until its next turn'
    tempNotes.push(`+${b} to attacks beyond 1st ${tf}`)
  } else if (cfg.conditional === 'first_y_attacks') {
    const b = cfg.conditionalBonus ?? 2
    const count = cfg.conditionalCount ?? 2
    const tf = cfg.conditionalTimeframe || 'each round'
    tempNotes.push(`+${b} to first ${count} attacks ${tf}`)
  }

  // 6. Enhanced 37 Gameplay Mechanics & Invulnerability Integration
  const secAc = cfg.secondaryAc != null && cfg.secondaryAc > 0 ? cfg.secondaryAc : undefined
  const cMode = cfg.conditionMode || 'none'
  const dmgTypes = Array.isArray(cfg.conditionDamageTypes) && cfg.conditionDamageTypes.length > 0
    ? cfg.conditionDamageTypes.join(', ')
    : 'Lightning, Thunder, Force'
  const creatTypes = Array.isArray(cfg.conditionCreatureTypes) && cfg.conditionCreatureTypes.length > 0
    ? (cfg.conditionCreatureTypes.length === 2 ? `${cfg.conditionCreatureTypes[0]}, and ${cfg.conditionCreatureTypes[1]}` : cfg.conditionCreatureTypes.join(', '))
    : 'Undead, and Fiends'
  const attackTypes = Array.isArray(cfg.conditionAttackTypes) && cfg.conditionAttackTypes.length > 0
    ? cfg.conditionAttackTypes.join(', ')
    : 'Ranged Attacks'

  // Decoupled On Miss logic
  let onMissText = ''
  if (cfg.onMiss === 'hits_attacker') {
    onMissText = 'On Miss Hits the Attacker Instead'
  } else if (cfg.onMiss === 'hits_target_range') {
    onMissText = 'On Miss Hits Target within its Range'
  } else if (cfg.onMiss === 'hits_target_feet') {
    const dist = cfg.onMissDistance || 10
    onMissText = `On Miss Hits another creature within ${dist}ft`
  } else if (cfg.onMiss === 'damage_attacker') {
    const dmgAmt = cfg.onMissDamageAmount || 5
    const dmgType = cfg.onMissDamageType || 'Force'
    onMissText = `On Miss Attacker takes ${dmgAmt} of ${dmgType} Damage`
  } else if (cfg.onMiss === 'knocks_prone') {
    onMissText = 'On Miss Knocks Prone'
  }

  // Decoupled When Hit logic
  let onHitText = ''
  if (cfg.onHit === 'damage_attacker') {
    const dmgAmt = cfg.onHitDamageAmount ?? 5
    const dmgType = cfg.onHitDamageType || 'Fire'
    let hitBase = `On Hit: Attacker takes ${dmgAmt} of ${dmgType}`
    if (cfg.onHitDoubleBloodied || cfg.doubleIfBloodied) {
      hitBase += ", double if you're bloodied"
    }
    onHitText = hitBase
  } else if (cfg.onHit === 'knocks_prone') {
    onHitText = 'On Hit Attacker Knocks Prone'
  } else if (cfg.onHit === 'retaliate_melee') {
    onHitText = 'On Hit Can make a Melee Attack as a Reaction'
  }

  const saveStat = cfg.saveStat || 'Wisdom'
  let saveDc = cfg.saveDc ?? 13
  if (typeof saveDc === 'string' && /[+\-*/()]/.test(saveDc)) {
    const evalDc = evaluateSafeFormula(saveDc, { proficiency: pb, stats, avgHp: monster.AC * 10, cr, hd })
    if (evalDc != null) saveDc = evalDc
  }

  if (cfg.saveDcSource === 'spell_save_dc' && monster.proficiency) {
    const spellStat = (monster as any).spellcasting?.stat || 'INT'
    const statMod = mod(spellStat)
    saveDc = 8 + pb + statMod
  } else if (cfg.saveDcSource === 'special_save_dc' && cfg.saveStat) {
    const statMod = mod(cfg.saveStat.slice(0, 3).toUpperCase())
    saveDc = 8 + pb + statMod
  } else if (cfg.saveDcSource === '8_plus_2x_pb' && cfg.saveStat) {
    const statMod = mod(cfg.saveStat.slice(0, 3).toUpperCase())
    saveDc = 8 + 2 * pb + statMod
  } else if (cfg.saveDcSource === '10_plus_pb' && cfg.saveStat) {
    const statMod = mod(cfg.saveStat.slice(0, 3).toUpperCase())
    saveDc = 10 + pb + statMod
  } else if (cfg.saveDcSource === 'cr_based') {
    saveDc = 8 + pb + cr
  } else if (cfg.saveDcSource?.startsWith('8_plus_pb_')) {
    const statKey = cfg.saveDcSource.replace('8_plus_pb_', '').toUpperCase()
    saveDc = 8 + pb + mod(statKey)
  } else if (cfg.saveDcSource === 'custom' && cfg.saveDcCustom != null) {
    saveDc = cfg.saveDcCustom
  }

  let isAbsoluteRule = false
  let absoluteRuleText = ''
  let triggerDesc = ''
  const conditionNotes: string[] = []

  switch (cMode) {
    case 'attacker_save': {
      isAbsoluteRule = true
      const rawVerb = cfg.saveVerb || 'must_succeed'
      const verbText = rawVerb === 'makes'
        ? 'Makes'
        : (rawVerb === 'must_succeed_to_hit' ? 'Must Succeed' : 'must Succeed')

      const rawStat = cfg.saveStat || 'Wisdom'
      const statClause = rawStat.toLowerCase().includes('saving throw')
        ? rawStat
        : `${rawStat} Saving Throw`

      let failText = ''
      if (cfg.onSaveFailure === 'otherwise_double_and_knocks_prone' || cfg.otherwiseDoubleProne) {
        failText = 'otherwise double, and knocks prone'
      } else if (cfg.onSaveFailure === 'knocks_prone') {
        failText = 'On Failure Knocks Prone'
      } else if (cfg.onSaveFailure === 'damage_attacker' || cfg.onSaveFailure === 'takes_damage') {
        const failAmt = resolveDynamicNumericSource(cfg.onSaveFailureDamageSource, cfg.onSaveFailureDamageAmount ?? 10, cfg.onSaveFailureDamageDice, { proficiency: pb, stats, avgHp: monster.AC * 10, cr, hd })
        const failType = cfg.onSaveFailureDamageType || 'Radiant'
        failText = `On Failure Takes ${failAmt} of ${failType} Damage`
      } else if (cfg.onSaveFailure === 'cant_attack') {
        failText = "On Failure Can't Attack"
      }

      let succText = ''
      if (cfg.onSaveSuccess === 'damage_attacker' || cfg.onSaveSuccess === 'takes_damage') {
        const succAmt = resolveDynamicNumericSource(cfg.onSaveSuccessDamageSource, cfg.onSaveSuccessDamageAmount ?? 13, cfg.onSaveSuccessDamageDice, { proficiency: pb, stats, avgHp: monster.AC * 10, cr, hd })
        const succType = cfg.onSaveSuccessDamageType || 'Radiant'
        succText = `On Success Takes ${succAmt} of ${succType} Damage`
      } else if (cfg.onSaveSuccess === 'hits_automatically') {
        succText = 'to Hit automatically'
      } else if (cfg.onSaveSuccess === 'half_damage') {
        succText = 'On Success Takes Half Damage'
      }

      if (rawVerb === 'must_succeed_to_hit') {
        const core = `Attacker Must Succeed on a ${statClause} DC ${saveDc} to Hit`
        const extras = [failText, succText].filter(Boolean)
        absoluteRuleText = extras.length > 0 ? `${core}, ${extras.join(', ')}` : core
      } else {
        const qualifiers = []
        if (cfg.targetAdvantage) qualifiers.push(cfg.targetAdvantage.trim())
        if (cfg.bloodiedDc) qualifiers.push(`${cfg.bloodiedDc} when Bloodied`)
        const qualStr = qualifiers.length > 0 ? ` (${qualifiers.join(', ')})` : ''
        const verbPrefix = rawVerb === 'must_succeed_a' || cfg.syntax === 'must_succeed_a' ? 'must succeed a' : `${verbText} on a`
        const core = `Attacker ${verbPrefix} ${statClause} DC ${saveDc}${qualStr}`
        const clauses = [core]
        if (failText && !failText.startsWith('otherwise')) clauses.push(failText)
        if (succText) clauses.push(succText)
        if (failText && failText.startsWith('otherwise')) clauses.push(failText)
        absoluteRuleText = clauses.join(', ')
      }
      break
    }
    case 'only_crits':
      isAbsoluteRule = true
      absoluteRuleText = 'Only Hit by Critical Hits'
      break
    case 'only_magical':
      isAbsoluteRule = true
      absoluteRuleText = 'Only hit by magical attacks'
      break
    case 'only_adamantine_silver':
      isAbsoluteRule = true
      absoluteRuleText = 'Only hit by adamantine or silvered weapons'
      break
    case 'creature_type':
    case 'versus_creature_types':
      triggerDesc = `${secAc ?? 30} against ${creatTypes}`
      break
    case 'attack_type':
    case 'ranged_attacks':
      triggerDesc = `${secAc ?? 30} against ${attackTypes}`
      break
    case 'melee_attacks':
      triggerDesc = `${secAc ?? 30} against Melee Attacks`
      break
    case 'versus_damage_types':
    case 'damage_type':
      triggerDesc = `${secAc ?? 15} versus attacks that deals ${dmgTypes.toLowerCase()}`
      break
    case 'without_temp_hp':
      triggerDesc = `${secAc ?? 15} without temporary hit points`
      break
    case 'cover_while_grappling':
      triggerDesc = `${secAc ?? 20} from ${cfg.cover || '3/4 Cover'}, while Grappling ${cfg.grappleTarget || 'a creature'}`
      break
    case 'while_grappling':
      triggerDesc = `${secAc ?? 20}, while Grappling ${cfg.grappleTarget || 'a creature'}`
      break
    case 'has_temp_hp':
      triggerDesc = `${secAc ?? 30} if It Has Temporary Hit Points`
      break
    case 'took_damage_since':
      triggerDesc = `${secAc ?? 11} if It took ${cfg.tookDamageType || 'Cold Damage'} since ${cfg.tookDamageTimeframe || 'The Start Of Its Last Turn'}`
      break
    case 'in_light':
      triggerDesc = `${secAc ?? 11} if In ${cfg.lightLevel || 'Bright Light'}`
      break
    case 'in_bright_light':
      triggerDesc = `${secAc ?? 11} if In Bright Light`
      break
    case 'in_daylight':
      triggerDesc = `${secAc ?? 11} if In Daylight`
      break
    case 'in_darkness':
      triggerDesc = `${secAc ?? base + 7} in dim light or darkness`
      break
    case 'bloodied':
    case 'while_bloodied':
      triggerDesc = `${secAc ?? 30} if Bloodied`
      break
    case 'without_advantage':
      triggerDesc = `${secAc ?? 30} without Advantage`
      break
    case 'while_cursed':
      triggerDesc = `${secAc ?? 13} while Cursed`
      break
    case 'near_ally':
      triggerDesc = `${secAc ?? 30} while near a non-incapacitated allied creature`
      break
    case 'parry':
      triggerDesc = `${secAc ?? base + 3}, Parry as a Reaction`
      break
    case 'no_advantage_misses':
      triggerDesc = 'Attacks without Advantage miss'
      break
    case 'while_moving':
      triggerDesc = `${secAc ?? base + 5}, while moving`
      break
    case 'per_distance_moved':
      triggerDesc = '+1 per 10 ft moved this turn'
      break
    case 'while_within_ally':
      triggerDesc = `${secAc ?? 21} while within 10 ft of an ally`
      break
    case 'while_within_shield_bearer':
      triggerDesc = `${secAc ?? 21} while within 5 ft of a shield bearer`
      break
    case 'while_prone':
      triggerDesc = `${secAc ?? 12} while prone`
      break
    case 'distance_away':
      triggerDesc = `${secAc ?? base + 7} against attacks from more than 30 ft away`
      break
    case 'first_attack_each_round':
      triggerDesc = `${secAc ?? base + 5} against the first attack each round`
      break
    case 'attacks_beyond_first':
      triggerDesc = `${secAc ?? base + 5} against attacks beyond the first each turn`
      break
    case 'spell_attacks':
      triggerDesc = `${secAc ?? base + 4} against spell attacks`
      break
    case 'behind_flanking':
      triggerDesc = `${secAc ?? 12} against attacks from behind or flanking`
      break
    case 'per_hostile':
      triggerDesc = '+2 per hostile creature within 5 ft, max +6'
      break
    case 'per_grappler':
      triggerDesc = '-2 per creature grappling it'
      break
    case 'while_flying':
      triggerDesc = `${secAc ?? base + 6} while flying`
      break
    case 'while_underwater':
      triggerDesc = `${secAc ?? 10} while underwater`
      break
    case 'versus_bps':
      triggerDesc = `${secAc ?? base + 6} against attacks that deal Bludgeoning, Piercing, or Slashing`
      break
    case 'while_concentrating':
      triggerDesc = `${secAc ?? base + 4} while concentrating on a spell`
      break
    case 'asleep_unconscious':
      triggerDesc = `${secAc ?? 10} while asleep or unconscious`
      break
    case 'miss_reflects':
      triggerDesc = 'Ranged attacks that miss reflect back at attacker'
      break
    case 'custom':
      if (cfg.customCondition?.trim()) {
        triggerDesc = cfg.customCondition.trim()
      }
      break
  }

  // The legacy ACType projection stays free of schedule prefixes.
  const rawConditions = [triggerDesc, onMissText, onHitText].filter(Boolean)
  const rawConditionNotes = triggerDesc ? [rawConditions.join(', ')] : rawConditions
  const generatedArmorDesc = [...armorParts, ...tempNotes, ...rawConditionNotes].join(', ')
  const scheduledTempNotes = tempNotes.map((text, index) => scheduled(index < temporaryCount ? 'temporaryAc' : 'conditionalAc', text))
  triggerDesc = scheduled('defensiveRule', triggerDesc)
  absoluteRuleText = scheduled('defensiveRule', absoluteRuleText)
  onMissText = scheduled('onMiss', onMissText)
  onHitText = scheduled('onHit', onHitText)

  // Combine condition trigger with decoupled onMiss and onHit
  if (triggerDesc) {
    const ruleParts: string[] = [triggerDesc]
    if (onMissText) ruleParts.push(onMissText)
    if (onHitText) ruleParts.push(onHitText)
    conditionNotes.push(ruleParts.join(', '))
  } else {
    if (onMissText) conditionNotes.push(onMissText)
    if (onHitText) conditionNotes.push(onHitText)
  }

  // Combine parenthetical descriptors
  const allParenthetical: string[] = [
    ...armorParts,
    ...scheduledTempNotes,
    ...conditionNotes,
  ]

  // If user had existing ACType that is not already covered, preserve it
  const savedAcType = monster.ACType?.trim()
  const legacyAcType = savedAcType && savedAcType !== generatedArmorDesc ? savedAcType : ''
  if (legacyAcType && !armorParts.some(p => legacyAcType.toLowerCase().includes(p.toLowerCase()))) {
    if (!cfg.baseMode || cfg.baseMode === 'flat') {
      allParenthetical.unshift(legacyAcType)
    }
  }

  const scheduledArmorDesc = allParenthetical.join(', ')
  const armorTypeDesc = [...(legacyAcType && allParenthetical[0] === legacyAcType ? [legacyAcType] : []),
    generatedArmorDesc].filter(Boolean).join(', ')

  const badges: string[] = []
  const splitRows = Boolean((monster as any).splitAcRiderRows)

  if (splitRows) {
    const baseArmorParts = [...armorParts]
    if (legacyAcType && !armorParts.some(p => legacyAcType.toLowerCase().includes(p.toLowerCase()))) {
      if (!cfg.baseMode || cfg.baseMode === 'flat') {
        baseArmorParts.unshift(legacyAcType)
      }
    }
    const baseArmorDesc = baseArmorParts.join(', ')
    const primaryBadge = `<strong class="dnd-num">${base}</strong>${baseArmorDesc ? ` (${baseArmorDesc})` : ''}`
    badges.push(primaryBadge)

    if (isAbsoluteRule && absoluteRuleText) {
      badges.push(absoluteRuleText)
    }
    for (const tn of scheduledTempNotes) {
      if (tn) badges.push(tn)
    }
    if (triggerDesc) badges.push(triggerDesc)
    if (onMissText) badges.push(onMissText)
    if (onHitText) badges.push(onHitText)

    const fullText = isAbsoluteRule && absoluteRuleText
      ? absoluteRuleText
      : (scheduledArmorDesc ? `${base} (${scheduledArmorDesc})` : `${base}`)

    return {
      totalAc: base,
      armorTypeDesc,
      badges,
      fullText,
      isAbsoluteRule,
      absoluteRuleText: isAbsoluteRule ? absoluteRuleText : undefined,
    }
  }

  if (isAbsoluteRule && absoluteRuleText) {
    badges.push(absoluteRuleText)
    if (onMissText && monster.defenseSchedules?.onMiss) badges.push(onMissText)
    if (onHitText && monster.defenseSchedules?.onHit) badges.push(onHitText)
    return {
      totalAc: base,
      armorTypeDesc: '',
      badges,
      fullText: absoluteRuleText,
      isAbsoluteRule: true,
      absoluteRuleText,
    }
  }

  const primaryBadge = `<strong class="dnd-num">${base}</strong>`
  badges.push(primaryBadge)
  if (scheduledArmorDesc) {
    badges.push(`(${scheduledArmorDesc})`)
  }

  const fullText = scheduledArmorDesc ? `${base} (${scheduledArmorDesc})` : `${base}`

  return {
    totalAc: base,
    armorTypeDesc,
    badges,
    fullText,
    isAbsoluteRule: false,
  }
}
