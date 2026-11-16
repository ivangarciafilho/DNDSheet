import { formatRiderSchedule } from './basic-riders.ts'
import type { DefenseEffect, RiderSchedule } from './basic-riders.ts'
import type { MonsterAcConfig } from './types.ts'
import { mechanicPlainText } from './mechanic-rich-text.ts'
import { evaluateSafeFormula, resolveDynamicNumericSource } from './defense-and-traits-utils.ts'
import type { AcComposedResult } from './defense-and-traits-utils.ts'

/**
 * Universal AC Heuristic & Formula Compositor Engine.
 * Seamlessly integrates Base AC, Ability Modifiers, Defense Items, Reaction Buffs,
 * and all 37 target gameplay defensive/invulnerability mechanics.
 */
export function composeAcAndDefenses(
  monster: {
    AC: number
    ACType?: string
    spellcasting?: { stat?: string }
    splitAcRiderRows?: boolean
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

  let saveDc = cfg.saveDc ?? 13
  if (typeof saveDc === 'string' && /[+\-*/()]/.test(saveDc)) {
    const evalDc = evaluateSafeFormula(saveDc, { proficiency: pb, stats, avgHp: monster.AC * 10, cr, hd })
    if (evalDc != null) saveDc = evalDc
  }

  if (cfg.saveDcSource === 'spell_save_dc' && monster.proficiency) {
    const spellStat = monster.spellcasting?.stat || 'INT'
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
  // The compositor copies its wording into AC Type. When the author formats that copy (bold,
  // italic...) without changing its words, the formatted copy is what prints.
  const plainKey = (text?: string) => mechanicPlainText(text ?? '').replace(/[\s.;,]+$/, '').replace(/\s+/g, ' ').trim().toLowerCase()
  const formattedCopy = Boolean(savedAcType && generatedArmorDesc) && savedAcType !== generatedArmorDesc && plainKey(savedAcType) === plainKey(generatedArmorDesc)
  if (formattedCopy && savedAcType) allParenthetical.splice(0, allParenthetical.length, savedAcType)
  const legacyAcType = savedAcType && savedAcType !== generatedArmorDesc && !formattedCopy ? savedAcType : ''
  if (legacyAcType && !armorParts.some(p => legacyAcType.toLowerCase().includes(p.toLowerCase()))) {
    if (!cfg.baseMode || cfg.baseMode === 'flat') {
      allParenthetical.unshift(legacyAcType)
    }
  }

  const scheduledArmorDesc = allParenthetical.join(', ')
  const armorTypeDesc = formattedCopy && savedAcType ? savedAcType : [...(legacyAcType && allParenthetical[0] === legacyAcType ? [legacyAcType] : []),
    generatedArmorDesc].filter(Boolean).join(', ')

  const badges: string[] = []
  const splitRows = Boolean(monster.splitAcRiderRows)

  if (splitRows && formattedCopy && savedAcType) {
    const fullText = `${base} (${savedAcType})`
    return { totalAc: base, armorTypeDesc, badges: [`<strong class="dnd-num">${base}</strong> (${savedAcType})`], fullText, isAbsoluteRule, absoluteRuleText: isAbsoluteRule ? absoluteRuleText : undefined }
  }

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
