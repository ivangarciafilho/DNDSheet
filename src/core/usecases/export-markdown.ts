import { CR } from '../domain/cr-tables.ts'
import { skillGroupPlacement } from '../domain/skill-action-groups.ts'
import type { CombatSkillGroupId } from '../domain/skill-action-groups.ts'
import type { Monster } from '../domain/types.ts'
import { abilityIdentity, hasStructuredAbility, inferAbility, text2024 } from '../domain/ability-grammar.ts'
import { actionRecharge } from '../domain/action-usage.ts'
import { avgHP, avgRoll, renderBonus, renderModifier, statModifier } from '../domain/math-utils.ts'
import { computeTraitTag, formatDefenseList, formatLanguagesList, formatMinimalistDeathPrevention, formatMinimalistRegen } from '../domain/defense-and-traits-utils.ts'
import { creatureTypeLine } from '../domain/export-markup.ts'
import { formatLimitedUses } from '../domain/cadence.ts'
import { formatReactionAvailability } from '../domain/entry-display.ts'
import { formatRollScalingPhrases, hasRollScaling, resolveRollScaling } from '../domain/roll-scaling.ts'
import { formatSpeedActionRider } from '../domain/speeds-traversal.ts'
import { formulaContextForMonster } from '../domain/formula-context.ts'
import { resolveSpellcastingPlacement } from '../domain/export-contract.ts'
import { structuredAttackBonus } from '../domain/structured-attack.ts'
import { collectCombatCheckRows, formatSkillGroupScores, hasAnySpellcastingContent, renderSpellcastingMarkdown } from './ExportStatblock.ts'
import type { ExportRenderOptions } from './ExportStatblock.ts'

export function markdownOf(
  monster: Monster,
  style: '2014' | '2024',
  options: ExportRenderOptions = {},
  spellcastingPlaceholder?: string,
): string {
  const crObj = CR[monster.CR] || { cr: '0', xp: 0 }
  const hpTotal = avgHP(monster.HP)
  const hpFormula = `${monster.HP.HD}d${monster.HP.type}${
    monster.HP.modifier !== 0
      ? monster.HP.modifier > 0
        ? ` + ${monster.HP.modifier}`
        : ` - ${Math.abs(monster.HP.modifier)}`
      : ''
  }`

  let hpExtended = ''
  if (monster.extendedHp?.regeneration?.enabled) {
    const r = formatMinimalistRegen(monster.extendedHp.regeneration)
    if (r) hpExtended += `; ${r}`
  }
  if (monster.extendedHp?.deathPrevention?.enabled) {
    const dp = formatMinimalistDeathPrevention(monster.extendedHp.deathPrevention)
    if (dp) hpExtended += `; ${dp}`
  }
  if (monster.extendedHp?.damageThreshold) {
    hpExtended += `; Damage Threshold ${monster.extendedHp.damageThreshold}`
  }
  if (monster.extendedHp?.damageReduction) {
    hpExtended += `; Damage Reduction ${monster.extendedHp.damageReduction}`
  }
  let bloodiedPrefix = ''
  if (monster.extendedHp?.showBloodied) {
    const bloodiedVal =
      monster.extendedHp.bloodiedOverride && monster.extendedHp.bloodiedOverride > 0
        ? monster.extendedHp.bloodiedOverride
        : Math.max(1, Math.floor(hpTotal / 2))
    bloodiedPrefix = `${bloodiedVal} bloodied, `
  }

  let hpParagon = ''
  if (monster.paragonConfig?.enabled) {
    const pCount = monster.paragonConfig.poolCount || monster.paragonConfig.poolsCount || 2
    const poolHpStr = Array.isArray(monster.paragonConfig.poolHp) && monster.paragonConfig.poolHp.length > 0
      ? monster.paragonConfig.poolHp.map((h, i) => `Pool ${i + 1}: ${h} HP`).join(', ')
      : `${pCount} Pools of ${Math.floor(hpTotal / pCount)} HP`
    hpParagon = `; Paragon: ${poolHpStr}`
  }

  const lines: string[] = []
  lines.push('___')
  lines.push(`## ${monster.nickname || monster.name}`)
  // Shared with every other exporter: no dangling comma when alignment (or size/type) is empty.
  lines.push(`*${creatureTypeLine(monster.size, monster.type, monster.alignment)}*`)
  lines.push('___')
  lines.push(`**Armor Class** ${monster.AC}${monster.ACType ? ` (${monster.ACType})` : ''}`)
  lines.push(`**Hit Points** ${hpTotal} (${bloodiedPrefix}${hpFormula}${hpExtended}${hpParagon})`)

  // Speeds
  const speedStrings = (monster.speeds || []).map((s) => {
    const typeStr = s.type && s.type !== 'walk' ? `${s.type} ` : ''
    const noteBits: string[] = []
    if (s.hover && !s.note?.toLowerCase().includes('hover')) noteBits.push('hover')
    if (s.note && s.note.trim()) noteBits.push(s.note.trim())
    const noteStr = noteBits.length > 0 ? ` (${noteBits.join(', ')})` : ''
    return `${typeStr}${s.speed} ft.${noteStr}`
  })
  if (monster.speedTraversal) {
    const trav = monster.speedTraversal
    if (trav.amorphous1Inch) speedStrings.push('move through 1-inch spaces without squeezing')
    if (trav.amorphousCannotEnterLiquids) speedStrings.push("can't enter liquid bodies")
    if (trav.moveThroughCreaturesDifficultTerrain) {
      if (trav.moveThroughCreaturesShunt) {
        const dmg = trav.moveThroughCreaturesShuntDamage?.trim() || '1d10 force'
        speedStrings.push(`move through creature spaces as difficult terrain (shunts to adjacent space dealing ${dmg} damage)`)
      } else {
        speedStrings.push('move through creature spaces as difficult terrain')
      }
    }
    if (trav.moveThroughCreaturesTwoSizesDifferent) speedStrings.push('move through spaces of creatures 2 sizes different')
    if (trav.ignoresDifficultTerrain) speedStrings.push('ignores difficult terrain')
    const cunning: string[] = []
    if (trav.bonusActionDash) cunning.push('Dash')
    if (trav.bonusActionDodge) cunning.push('Dodge')
    if (trav.bonusActionDisengage) cunning.push('Disengage')
    if (cunning.length > 0) speedStrings.push(`bonus action ${cunning.join('/')}`)
    if (Array.isArray(trav.actionRiders) && trav.actionRiders.length > 0) {
      for (const rider of trav.actionRiders) {
        const formatted = formatSpeedActionRider(rider)
        if (formatted) speedStrings.push(formatted)
      }
    }
    if (trav.bonusActionSpeed) speedStrings.push(`bonus action speed ${trav.bonusActionSpeed} ft.`)
    if (trav.trackingSpeed) speedStrings.push(`tracking ${trav.trackingSpeed} ft.`)
    if (trav.stealthSpeed) speedStrings.push(`stealth ${trav.stealthSpeed} ft.`)
    if (trav.aquaticBreathing && trav.aquaticBreathing !== 'none') {
      if (trav.aquaticBreathing === 'amphibious') speedStrings.push('amphibious')
      else if (trav.aquaticBreathing === 'underwater') speedStrings.push('can breathe underwater')
      else if (trav.aquaticBreathing === 'water_only') speedStrings.push('can only breathe underwater')
      else if (trav.aquaticBreathing === 'hold_breath') speedStrings.push(`can hold breath for ${trav.holdBreathDuration?.trim() || '1 hour'}`)
    }
    if (trav.note) speedStrings.push(trav.note.trim())
  }
  lines.push(`**Speed** ${speedStrings.join(', ') || '30 ft.'}`)
  lines.push('___')

  // Stats Table
  lines.push('|STR|DEX|CON|INT|WIS|CHA|')
  lines.push('|:---:|:---:|:---:|:---:|:---:|:---:|')
  lines.push(
    `|${monster.stats.STR} (${renderModifier(monster.stats.STR)})|${monster.stats.DEX} (${renderModifier(
      monster.stats.DEX
    )})|${monster.stats.CON} (${renderModifier(monster.stats.CON)})|${monster.stats.INT} (${renderModifier(
      monster.stats.INT
    )})|${monster.stats.WIS} (${renderModifier(monster.stats.WIS)})|${monster.stats.CHA} (${renderModifier(
      monster.stats.CHA
    )})|`
  )
  lines.push('___')

  // Saves & Skills
  const proficientSaves = Object.entries(monster.saves || {})
    .filter(([, s]) => s.proficient || s.override || s.advantage || s.disadvantage || s.condition)
    .map(([stat, s]) => {
      const bonus = s.override
        ? s.overrideValue
        : statModifier(monster.stats[stat as keyof typeof monster.stats]) + (s.proficient ? monster.proficiency : 0)
      const badge = s.advantage ? ' ▲▲' : s.disadvantage ? ' ▼▼' : ''
      const cond = s.condition ? ` (${s.condition})` : ''
      return `${stat} ${renderBonus(bonus)}${badge}${cond}`
    })
  if (proficientSaves.length > 0) {
    lines.push(`**Saving Throws** ${proficientSaves.join(', ')}`)
  }

  const skillEntries = (monster.skills || [])
    .filter((s) => s.proficient || s.override || s.advantage || s.disadvantage || s.condition || s.conditional)
    .map((s) => {
      const bonus = s.override
        ? s.overrideValue
        : statModifier(monster.stats[s.skill.stat]) +
          (s.expertise ? monster.proficiency * 2 : s.proficient ? monster.proficiency : 0)
      const badge = s.advantage ? ' ▲▲' : s.disadvantage ? ' ▼▼' : ''
      const cond = s.condition || s.conditional ? ` (${s.condition || s.conditional})` : ''
      return `${s.skill.label || s.key} ${renderBonus(bonus)}${badge}${cond}`
    })
  if (skillEntries.length > 0) {
    lines.push(`**Skills** ${skillEntries.join(', ')}`)
  }

  // Tools
  if (Array.isArray(monster.tools) && monster.tools.length > 0) {
    const toolEntries = monster.tools.map((t) => {
      const statMod = statModifier(monster.stats[t.stat] ?? 10)
      const bonus = t.override
        ? t.overrideValue
        : statMod + (t.proficient ? monster.proficiency : 0) + (t.expertise ? monster.proficiency : 0)
      const badge = t.advantage ? ' ▲▲' : t.disadvantage ? ' ▼▼' : ''
      const cond = t.condition ? ` (${t.condition})` : ''
      return `${t.name} ${renderBonus(bonus)}${badge}${cond}`
    })
    lines.push(`**Tools** ${toolEntries.join(', ')}`)
  }

  // Defenses (Linear 6-Stage Progression)
  const vulnStr = Array.isArray(monster.vulnerabilitiesList) && monster.vulnerabilitiesList.length > 0
    ? formatDefenseList(monster.vulnerabilitiesList)
    : (monster.vulnerabilities || []).join(', ')
  if (vulnStr) lines.push(`**Damage Vulnerabilities** ${vulnStr}`)

  const condVulnStr = Array.isArray(monster.conditionVulnerabilitiesList) && monster.conditionVulnerabilitiesList.length > 0
    ? formatDefenseList(monster.conditionVulnerabilitiesList)
    : ''
  if (condVulnStr) lines.push(`**Condition Vulnerabilities** ${condVulnStr}`)

  const resStr = Array.isArray(monster.resistancesList) && monster.resistancesList.length > 0
    ? formatDefenseList(monster.resistancesList)
    : (monster.resistances || []).join(', ')
  if (resStr) lines.push(`**Damage Resistances** ${resStr}`)

  const condResStr = Array.isArray(monster.conditionResistancesList) && monster.conditionResistancesList.length > 0
    ? formatDefenseList(monster.conditionResistancesList)
    : ''
  if (condResStr) lines.push(`**Condition Resistances** ${condResStr}`)

  const immStr = Array.isArray(monster.immunitiesList) && monster.immunitiesList.length > 0
    ? formatDefenseList(monster.immunitiesList)
    : (monster.immunities || []).join(', ')
  if (immStr) lines.push(`**Damage Immunities** ${immStr}`)

  const condStr = Array.isArray(monster.conditionsList) && monster.conditionsList.length > 0
    ? formatDefenseList(monster.conditionsList)
    : (monster.conditions || []).join(', ')
  if (condStr) lines.push(`**Condition Immunities** ${condStr}`)

  // Senses
  const senseList: string[] = []
  if (Array.isArray(monster.sensesList) && monster.sensesList.length > 0) {
    monster.sensesList.forEach((item) => {
      const rangeUnit = item.rangeUnit || 'ft.'
      const rangeStr = item.range != null && item.range > 0 ? `${item.range} ${rangeUnit}` : ''
      const notes: string[] = []
      if (item.blindBeyond) notes.push('blind beyond this radius')
      if (item.echolocation) notes.push("can't use blindsight while deafened")
      if (item.devilsSight) notes.push("magical darkness doesn't impede")
      if (item.webSense) notes.push('while touching web, knows location of creatures on same web')
      if (item.lifeSense) notes.push('senses living creatures')
      if (item.keenTypes && item.keenTypes.length > 0) {
        notes.push(`advantage on Perception checks relying on ${item.keenTypes.join('/')}`)
      }
      if (item.sunlightSensitivity) notes.push('disadvantage in sunlight')
      if (item.note && item.note.trim()) notes.push(item.note.trim())
      const noteClause = notes.length > 0 ? ` (${notes.join('; ')})` : ''
      senseList.push(`${item.name.toLowerCase()}${rangeStr ? ` ${rangeStr}` : ''}${noteClause}`)
    })
  } else {
    if (monster.senses?.blindsight) senseList.push(`blindsight ${monster.senses.blindsight} ft.`)
    if (monster.senses?.darkvision) senseList.push(`darkvision ${monster.senses.darkvision} ft.`)
    if (monster.senses?.tremorsense) senseList.push(`tremorsense ${monster.senses.tremorsense} ft.`)
    if (monster.senses?.truesight) senseList.push(`truesight ${monster.senses.truesight} ft.`)
  }
  const passivePerc = 10 + statModifier(monster.stats.WIS) + (monster.saves?.WIS?.proficient ? monster.proficiency : 0)
  senseList.push(`passive Perception ${passivePerc}`)
  lines.push(`**Senses** ${senseList.join(', ')}`)

  // Action Passives (2024 unified check groups vs 2014 legacy rows)
  const monsterRecord = monster as unknown as Record<string, unknown>
  const aop = monster.actionOrientedPassives as Record<string, unknown> | undefined
  const editorPassives = monsterRecord.passives as Record<string, Record<string, unknown>> | undefined
  const headerCheckLines: string[] = []
  const actionCheckEntries: string[] = []
  const bonusCheckEntries: string[] = []

  if (style === '2024') {
    const riders = (aop?.riders || editorPassives?.riders) as Record<string, string> | undefined
    for (const row of collectCombatCheckRows(monster)) {
      if (row.id === 'skills') continue
      const placement = skillGroupPlacement(
        row.id as CombatSkillGroupId,
        row.actionType,
        editorPassives,
        aop,
        monsterRecord,
      )
      const scores = formatSkillGroupScores(row)
      const riderText = typeof riders?.[row.id] === 'string' && riders[row.id].trim() ? ` ${riders[row.id].trim()}` : ''
      if (placement === 'header') {
        headerCheckLines.push(`**${row.label}** ${scores}`)
      } else if (placement === 'bonus_action') {
        bonusCheckEntries.push(`***${row.label} ${scores}.***${riderText}`)
      } else {
        actionCheckEntries.push(`***${row.label} ${scores}.***${riderText}`)
      }
    }
    lines.push(...headerCheckLines)
  } else if (monster.actionOrientedPassives) {
    const p = monster.actionOrientedPassives
    if (p.search && (p.search.perception || p.search.investigation || p.search.survival)) {
      const items: string[] = []
      if (p.search.perception) items.push(`Perception ${10 + statModifier(monster.stats.WIS)}`)
      if (p.search.investigation) items.push(`Investigation ${10 + statModifier(monster.stats.INT)}`)
      if (p.search.survival) items.push(`Survival ${10 + statModifier(monster.stats.WIS)}`)
      lines.push(`**Search** ${items.join(', ')}`)
    }
    if (p.study && (p.study.arcana || p.study.history || p.study.nature || p.study.religion)) {
      const items: string[] = []
      if (p.study.arcana) items.push(`Arcana ${10 + statModifier(monster.stats.INT)}`)
      if (p.study.history) items.push(`History ${10 + statModifier(monster.stats.INT)}`)
      if (p.study.nature) items.push(`Nature ${10 + statModifier(monster.stats.INT)}`)
      if (p.study.religion) items.push(`Religion ${10 + statModifier(monster.stats.INT)}`)
      lines.push(`**Study** ${items.join(', ')}`)
    }
    if (p.hide && (p.hide.stealth || p.hide.acrobatics || p.hide.sleightOfHand)) {
      const items: string[] = []
      if (p.hide.stealth) items.push(`Stealth ${10 + statModifier(monster.stats.DEX)}`)
      if (p.hide.acrobatics) items.push(`Acrobatics ${10 + statModifier(monster.stats.DEX)}`)
      if (p.hide.sleightOfHand) items.push(`Sleight of Hand ${10 + statModifier(monster.stats.DEX)}`)
      lines.push(`**Hide** ${items.join(', ')}`)
    }
    if (p.influence && (p.influence.insight || p.influence.persuasion || p.influence.deception || p.influence.intimidation)) {
      const items: string[] = []
      if (p.influence.insight) items.push(`Insight ${10 + statModifier(monster.stats.WIS)}`)
      if (p.influence.persuasion) items.push(`Persuasion ${10 + statModifier(monster.stats.CHA)}`)
      if (p.influence.deception) items.push(`Deception ${10 + statModifier(monster.stats.CHA)}`)
      if (p.influence.intimidation) items.push(`Intimidation ${10 + statModifier(monster.stats.CHA)}`)
      lines.push(`**Influence** ${items.join(', ')}`)
    }
  }

  // Languages
  const langStr = Array.isArray(monster.languagesList) && monster.languagesList.length > 0
    ? formatLanguagesList(monster.languagesList)
    : (monster.languages || '--')
  lines.push(`**Languages** ${langStr}`)
  lines.push(`**Challenge** ${monster.useCrDisplayOverride ? monster.crOverride : crObj.cr} (${crObj.xp.toLocaleString()} XP)`)
  lines.push('___')

  // Traits
  const standardTraits: typeof monster.traits = []
  const rechargeTraits = new Map<string, typeof monster.traits>()
  const conditionalTraits = new Map<string, typeof monster.traits>()

  for (const trait of monster.traits || []) {
    if (trait.isConditional && trait.conditionalTrigger) {
      const key = trait.conditionalTrigger.trim()
      if (!conditionalTraits.has(key)) conditionalTraits.set(key, [])
      conditionalTraits.get(key)!.push(trait)
    } else if (trait.renderInRechargeSection && trait.rechargeSection) {
      const key = trait.rechargeSection.trim()
      if (!rechargeTraits.has(key)) rechargeTraits.set(key, [])
      rechargeTraits.get(key)!.push(trait)
    } else {
      standardTraits.push(trait)
    }
  }

  for (const trait of standardTraits) {
    const tag = computeTraitTag(trait)
    const tagStr = tag ? ` (${tag})` : ''
    const stageStr = trait.stagePool && trait.stagePool !== 'all' ? ` [Stage ${trait.stagePool}]` : ''
    lines.push(`***${trait.name}${stageStr}${tagStr}.*** ${trait.description}`)
    lines.push('')
  }

  for (const [sec, tList] of rechargeTraits.entries()) {
    lines.push(`#### ${sec}`)
    for (const trait of tList) {
      const tag = computeTraitTag(trait)
      const tagStr = tag ? ` (${tag})` : ''
      const stageStr = trait.stagePool && trait.stagePool !== 'all' ? ` [Stage ${trait.stagePool}]` : ''
      lines.push(`***${trait.name}${stageStr}${tagStr}.*** ${trait.description}`)
      lines.push('')
    }
  }

  for (const [cond, tList] of conditionalTraits.entries()) {
    lines.push(`#### Conditionals (${cond})`)
    for (const trait of tList) {
      const tag = computeTraitTag(trait)
      const tagStr = tag ? ` (${tag})` : ''
      const stageStr = trait.stagePool && trait.stagePool !== 'all' ? ` [Stage ${trait.stagePool}]` : ''
      lines.push(`***${trait.name}${stageStr}${tagStr}.*** ${trait.description}`)
      lines.push('')
    }
  }

  const spellPlacement = resolveSpellcastingPlacement(options.spellcastingPlacement, 'export')
  const spellLines = spellcastingPlaceholder
    ? (hasAnySpellcastingContent(monster) ? [spellcastingPlaceholder, ''] : [])
    : renderSpellcastingMarkdown(monster, style, options.spells)

  if (spellPlacement === 'with_traits' && spellLines.length > 0) {
    lines.push(...spellLines)
  }

  const actionText = (action: Monster['actions'][number]): string => {
    if (style !== '2024' || !hasStructuredAbility(action)) return action.description
    const ability = inferAbility(action)
    const attackBonus = structuredAttackBonus(action, monster)
    const saveDc = action.save?.override
      ? action.save.overrideValue
      : ability.saveAbility
      ? 8 + monster.proficiency + statModifier(monster.stats[ability.saveAbility])
      : undefined
    return text2024(action, {
      attackBonus,
      saveDc,
      formulaContext: formulaContextForMonster(monster),
    }, { componentsInLead: true })
  }

  const actionLead = (action: Monster['actions'][number]): string => {
    if (style !== '2024' || !hasStructuredAbility(action)) return action.name
    const recharge = actionRecharge(action)
    const usage = recharge ? (/^recharge/i.test(recharge) ? recharge : `Recharge ${recharge}`)
      : action.limitedUse?.count > 0 ? formatLimitedUses(action.limitedUse.count, action.limitedUse.rate) : ''
    return [usage, abilityIdentity(action)].filter(Boolean).join(' · ')
  }

  if (spellPlacement === 'before_actions' && spellLines.length > 0) {
    lines.push(...spellLines)
  }

  // Actions
  const standardActions = (monster.actions || []).filter((a) => !a.bonusAction)
  const hasActionsSection =
    actionCheckEntries.length > 0 ||
    standardActions.length > 0 ||
    (monster.attacks && monster.attacks.length > 0) ||
    (spellPlacement === 'after_actions' && spellLines.length > 0)
  if (hasActionsSection) {
    lines.push('### Actions')
    for (const checkEntry of actionCheckEntries) {
      lines.push(checkEntry)
      lines.push('')
    }
    for (const atk of monster.attacks || []) {
      const reachOrRange =
        atk.distance === 'MELEE'
          ? `reach ${atk.range.reach || 5} ft.`
          : `range ${atk.range.standard}/${atk.range.long} ft.`
      const toHitBonus = atk.modifier.override
        ? atk.modifier.overrideValue
        : statModifier(monster.stats[atk.modifier.stat]) + (atk.modifier.proficient ? monster.proficiency : 0)
      const dmgBonus = atk.damage.modifier.override
        ? atk.damage.modifier.overrideValue
        : statModifier(monster.stats[atk.damage.modifier.stat])
      const avgDmg = avgRoll(atk.damage.count, atk.damage.dice) + dmgBonus
      const bonusStr = dmgBonus !== 0 ? renderBonus(dmgBonus, true) : ''
      const scalingPhrases = hasRollScaling(atk.rollScaling)
        ? formatRollScalingPhrases(
            resolveRollScaling(
              { formulaContext: formulaContextForMonster(monster), cr: monster.CR },
              atk.rollScaling,
              {
                attackCount: atk.attackCount,
                attackRollModifier: atk.attackRollModifier,
                attackException: atk.attackException,
                targetCount: atk.targets,
              },
            ),
          )
        : {}
      const scalingExtra = [
        scalingPhrases.beamPhrase,
        scalingPhrases.multiplierPhrase,
        scalingPhrases.rollAdvantagePhrase,
        scalingPhrases.saveAdvantagePhrase,
        scalingPhrases.provenanceNote,
      ]
        .filter(Boolean)
        .join('; ')
      lines.push(
        `***${atk.name}.*** *${atk.kind === 'WEAPON' ? 'Weapon' : 'Spell'} Attack:* ${renderBonus(
          toHitBonus
        )} to hit, ${reachOrRange}, ${atk.targets || 1} target. *Hit:* ${avgDmg} (${atk.damage.count}d${
          atk.damage.dice
        }${bonusStr}) ${atk.damage.type} damage.${scalingExtra ? ` (${scalingExtra}.)` : ''}`
      )
      lines.push('')
    }

    for (const act of standardActions) {
      const stageStr = act.stagePool && act.stagePool !== 'all' ? ` [Stage ${act.stagePool}]` : ''
      lines.push(`***${actionLead(act)}${stageStr}.*** ${actionText(act)}`)
      lines.push('')
    }

    if (spellPlacement === 'after_actions' && spellLines.length > 0) {
      lines.push(...spellLines)
    }
  }

  // Bonus Actions
  const bonusActs = (monster.actions || []).filter((a) => a.bonusAction)
  if (bonusActs.length > 0 || bonusCheckEntries.length > 0) {
    lines.push('### Bonus Actions')
    for (const checkEntry of bonusCheckEntries) {
      lines.push(checkEntry)
      lines.push('')
    }
    for (const ba of bonusActs) {
      const stageStr = ba.stagePool && ba.stagePool !== 'all' ? ` [Stage ${ba.stagePool}]` : ''
      lines.push(`***${actionLead(ba)}${stageStr}.*** ${actionText(ba)}`)
      lines.push('')
    }
  }

  // Reactions
  if (Array.isArray(monster.reactions) && monster.reactions.length > 0) {
    lines.push('### Reactions')
    for (const rx of monster.reactions) {
      const { poolsLabel, conditionLabel } = formatReactionAvailability(rx, monster.paragonConfig?.phaseName || 'Stage')
      const availabilityTags = [poolsLabel ? `[${poolsLabel}]` : '', conditionLabel ? `[${conditionLabel}]` : ''].filter(Boolean).join(' ')
      const rxAsAction = rx as unknown as Monster['actions'][number]
      const recharge = actionRecharge(rx)
      const hasUsage = Boolean(recharge || (rx.limitedUse?.count ?? 0) > 0)
      const isStructured = style === '2024' && hasStructuredAbility(rxAsAction)
      if (!availabilityTags && !hasUsage && !isStructured && rx.triggerPlacement !== 'end') {
        lines.push(`***${rx.name}.*** ${rx.description}`)
        lines.push('')
        continue
      }
      const usageSuffix = !isStructured && hasUsage
        ? recharge
          ? ` (${/^recharge/i.test(recharge) ? recharge : `Recharge ${recharge}`})`
          : ` (${formatLimitedUses(rx.limitedUse.count, rx.limitedUse.rate)})`
        : ''
      const lead = `${actionLead(rxAsAction)}${usageSuffix}${availabilityTags ? ` ${availabilityTags}` : ''}`
      const prose = actionText(rxAsAction)
      const triggerText = rx.trigger?.trim() ? `*Trigger:* ${rx.trigger.trim()}` : ''
      const body = !triggerText
        ? prose
        : rx.triggerPlacement === 'end'
          ? `${prose} ${triggerText}`.trim()
          : `${triggerText} ${prose}`.trim()
      lines.push(`***${lead}.*** ${body}`)
      lines.push('')
    }
  }

  // Villain Actions
  if (Array.isArray(monster.villainActions) && monster.villainActions.length > 0) {
    lines.push('### Villain Actions')
    for (const va of monster.villainActions) {
      lines.push(`***Round ${va.round}: ${va.name}.*** ${va.description}`)
      lines.push('')
    }
  }

  // Bloodied Actions
  if (Array.isArray(monster.bloodiedActions) && monster.bloodiedActions.length > 0) {
    lines.push('### Bloodied Actions')
    for (const ba of monster.bloodiedActions) {
      lines.push(`***${ba.name} (${ba.trigger || 'Bloodied'}).*** ${ba.description}`)
      lines.push('')
    }
  }

  // Reactive Actions
  if (Array.isArray(monster.reactiveActions) && monster.reactiveActions.length > 0) {
    lines.push('### Reactive Actions')
    for (const ra of monster.reactiveActions) {
      lines.push(`***${ra.name} (${ra.trigger}).*** ${ra.description}`)
      lines.push('')
    }
  }

  // Combo Actions
  if (Array.isArray(monster.comboActions) && monster.comboActions.length > 0) {
    lines.push('### Combo Actions')
    for (const ca of monster.comboActions) {
      lines.push(`***${ca.name} (${ca.leadAction} ➔ ${ca.followup}).*** ${ca.description}`)
      lines.push('')
    }
  }

  // Draco Anatomy
  if (Array.isArray(monster.anatomyParts) && monster.anatomyParts.length > 0) {
    lines.push('### Breakable Anatomy')
    for (const ap of monster.anatomyParts) {
      lines.push(`- **${ap.part}** (AC ${ap.ac}, ${ap.hp} HP): ${ap.severEffect}`)
    }
    lines.push('')
  }

  // Runehammer Escalation Track
  if (monster.runehammerTrack?.enabled && monster.runehammerTrack.events?.length) {
    const trackDie = (monster.runehammerTrack.die || monster.runehammerTrack.timerDie || 'd4').toUpperCase()
    lines.push(`### Escalation Track (${trackDie})`)
    for (const ev of monster.runehammerTrack.events) {
      lines.push(`- **Round ${ev.round}: ${ev.name}** — ${ev.effect}`)
    }
    lines.push('')
  }

  // Paragon Boss Pools
  if (monster.paragonConfig?.enabled) {
    const p = monster.paragonConfig
    const poolCount = p.poolCount || p.poolsCount || 2
    const acts = p.actionsPerTurn || 1
    const trans = p.enrageNote || p.transitionEffect || ''
    lines.push('### Paragon Boss Pools')
    lines.push(`The creature has **${poolCount} stage pools** (${acts} actions/pool/round). ${trans}`)
    lines.push('')
  }

  return lines.join('\n')
}
