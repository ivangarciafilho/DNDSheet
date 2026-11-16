import { actionRecharge } from './action-usage.ts'
import { CADENCES, cadenceDefinition, formatLimitedUses } from './cadence.ts'
import type { DamageDefenseItem, MonsterLanguageItem, MonsterTrait } from './types.ts'
import { buildFormulaContext, evaluateFormula, normalizeLegacyFormula } from './formula.ts'
import type { FormulaContext } from './formula.ts'
export * from './regen-and-invulnerability.ts'

export * from './ac-and-defenses.ts'

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
/** "Language of its Manufacturer", "languages of its creator": always phrased as understanding. */
export function isManufacturerLanguage(item: Pick<MonsterLanguageItem, 'name'> | undefined): boolean {
  return /\blanguages? of (?:its|their|the) (?:manufacturer|creator|maker)s?\b/i.test(String(item?.name ?? ''))
}

export function formatLanguageItem(item: MonsterLanguageItem, formatValue: (field: string, value: string | number) => string = (_field, value) => String(value)): string {
  if (!item || !item.name) return ''
  const name = item.name.trim()
  const lowerName = name.toLowerCase()

  if (isManufacturerLanguage(item)) {
    const phrase = `understands the ${name.replace(/^understands\s+(?:the\s+)?/i, '').replace(/^the\s+/i, '').toLowerCase()}`
    const base = item.understandsOnly ? `${phrase} but can't speak` : phrase
    return item.note?.trim() ? `${base} (${item.note.trim()})` : base
  }

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
    return 'Tongue of the Sun and Moon (understands all spoken languages; any creature that understands a language understands its speech)'
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
      return 'understands plants but can\'t speak'
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
      return 'understands languages of undead but can\'t speak'
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
    spoken.push('Tongue of the Sun and Moon (understands all spoken languages; any creature that understands a language understands its speech)')
  }

  if (Array.isArray(items)) {
    for (const item of items) {
      if (!item.name) continue
      const formatted = formatLanguageItem(item, formatValue ? (field, value) => formatValue(item, field, value) : undefined)
      if (item.telepathy) {
        telepathy.push(formatted)
      } else if (
        item.understandsOnly &&
        !isManufacturerLanguage(item) &&
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

// Older saves and defaults stored the option label instead of its key; both resolve to the key.
const DEATH_RULE_ALIASES: Readonly<Record<string, string>> = {
  'con save dc 5 + damage taken': 'dc_5_plus_dmg',
  'con save dc 5 + damage taken (undead fortitude)': 'dc_5_plus_dmg',
  'returns to life with x hit points': 'always_survives',
  'returns upon death saving throw success': 'death_save_success',
  'upon death deals damage (death burst)': 'upon_death_burst',
  'custom saving throw dc': 'custom_save',
  'true immortal (hide hp on statblock)': 'true_immortal',
  'until hit by x critical hits (hide hp)': 'until_x_crits',
}

export function normalizeDeathRule(rule: unknown): string {
  const text = typeof rule === 'string' ? rule.trim() : ''
  return DEATH_RULE_ALIASES[text.toLowerCase()] ?? text
}

/**
 * The rule select is the single owner of the revival trigger: a trigger or death burst left behind
 * by an earlier rule must not keep printing after the author picks another rule.
 */
export function normalizeDeathPrevention<T extends { dcRule?: string; triggerCondition?: string; uponDeathDealsDamage?: boolean } | undefined>(dp: T): T {
  if (!dp) return dp
  const rule = normalizeDeathRule(dp.dcRule)
  const ruleTriggers = ['death_save_success', 'upon_death_burst']
  // With no rule chosen, an explicit trigger is the author's choice, not a leftover.
  const staleTrigger = Boolean(rule) && ruleTriggers.includes(String(dp.triggerCondition ?? '')) && dp.triggerCondition !== rule
  return {
    ...dp,
    dcRule: rule,
    triggerCondition: ruleTriggers.includes(rule) ? rule : staleTrigger ? undefined : dp.triggerCondition,
    uponDeathDealsDamage: rule === 'upon_death_burst' || (Boolean(dp.uponDeathDealsDamage) && !staleTrigger),
  } as T
}

/** When a regeneration trait acts, as trait prose: "at the start of its turn", "at dawn". */
export function regenTimingPhrase(regen: { frequency?: string; timeframe?: string } | undefined): string {
  const freq = String(regen?.frequency || regen?.timeframe || 'turn_start').toLowerCase()
  const phrases: Record<string, string> = {
    turn: 'at the start of its turn', turn_start: 'at the start of its turn', start_of_its_turn: 'at the start of its turn',
    a_turn_start: 'at the start of each turn', start_of_a_turn: 'at the start of each turn',
    turn_end: 'at the end of its turn', end_turn: 'at the end of its turn', end_of_its_turn: 'at the end of its turn',
    a_turn_end: 'at the end of each turn', end_of_a_turn: 'at the end of each turn',
    current_turn_end: 'at the end of the current turn', end_of_current_turn: 'at the end of the current turn',
    minute: 'every minute', hour: 'every hour', day: 'every day',
    dawn: 'at dawn', dusk: 'at dusk', midday: 'at midday', midnight: 'at midnight',
    short_rest: 'when it finishes a Short Rest', long_rest: 'when it finishes a Long Rest', downtime: 'during downtime',
    no_damage_taken: 'at the start of its turn if it took no damage since its last turn',
  }
  return phrases[freq] ?? 'at the start of its turn'
}

export interface AcComposedResult {
  totalAc: number
  armorTypeDesc: string
  badges: string[]
  fullText: string
  isAbsoluteRule?: boolean
  absoluteRuleText?: string
}
