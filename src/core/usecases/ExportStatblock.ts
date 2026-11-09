import { characterVitals, characterVitalText } from '../domain/character-truth.ts'
import { structuredAttackBonus } from '../domain/structured-attack.ts'
import { actionRecharge } from '../domain/action-usage.ts'
import { formatLimitedUses } from '../domain/cadence.ts'
import { CR } from '../domain/cr-tables.ts'
import { creatureTypeLine } from '../domain/export-markup.ts'
import { avgHP, avgRoll, renderBonus, renderModifier, statModifier } from '../domain/math-utils.ts'
import type { Monster, CharacterActor, DndStat } from '../domain/types.ts'
import { abilityIdentity, hasStructuredAbility, inferAbility, text2024 } from '../domain/ability-grammar.ts'
import { formulaContextForMonster } from '../domain/formula-context.ts'
import { DND_SKILLS } from '../domain/types.ts'
import {
  computeTraitTag,
  formatDefenseList,
  formatLanguagesList,
  formatMinimalistRegen,
  formatMinimalistDeathPrevention,
} from '../domain/defense-and-traits-utils.ts'
import { formatSpeedActionRider } from '../domain/speeds-traversal.ts'

export function exportToMarkdown(monster: Monster, style: '2014' | '2024' = '2014'): string {
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

  // Action Passives
  if (monster.actionOrientedPassives) {
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

  // Actions
  if ((monster.actions && monster.actions.length > 0) || (monster.attacks && monster.attacks.length > 0)) {
    lines.push('### Actions')
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
      lines.push(
        `***${atk.name}.*** *${atk.kind === 'WEAPON' ? 'Weapon' : 'Spell'} Attack:* ${renderBonus(
          toHitBonus
        )} to hit, ${reachOrRange}, ${atk.targets || 1} target. *Hit:* ${avgDmg} (${atk.damage.count}d${
          atk.damage.dice
        }${bonusStr}) ${atk.damage.type} damage.`
      )
      lines.push('')
    }

    for (const act of monster.actions || []) {
      if (!act.bonusAction) {
        const stageStr = act.stagePool && act.stagePool !== 'all' ? ` [Stage ${act.stagePool}]` : ''
        lines.push(`***${actionLead(act)}${stageStr}.*** ${actionText(act)}`)
        lines.push('')
      }
    }
  }

  // Bonus Actions
  const bonusActs = (monster.actions || []).filter((a) => a.bonusAction)
  if (bonusActs.length > 0) {
    lines.push('### Bonus Actions')
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
      lines.push(`***${rx.name}.*** ${rx.description}`)
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
    lines.push(`### Escalation Track (${monster.runehammerTrack.die.toUpperCase()})`)
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

export function exportToPlainText(monster: Monster, style: '2014' | '2024' = '2014'): string {
  const md = exportToMarkdown(monster, style)
  return md
    .replace(/^___$/gm, '----------------------------------------')
    .replace(/^### /gm, '\n=== ')
    .replace(/^## /gm, '')
    .replace(/\*\*\*(.*?)\.\*\*\*/g, '$1.')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
}

export function exportToHtml(monster: Monster, style: '2014' | '2024' = '2014'): string {
  const monsterName = monster.nickname || monster.name || 'Monster'
  const md = exportToMarkdown(monster, style)
  let body = md
    .replace(/^## (.*$)/gm, '<h2 class="statblock-name">$1</h2>')
    .replace(/^\*(.*)\*$/gm, '<div class="statblock-meta"><em>$1</em></div>')
    .replace(/^___$/gm, '<hr class="statblock-divider" />')
    .replace(/^### (.*$)/gm, '<h3 class="statblock-section">$1</h3>')
    .replace(/\*\*\*(.*?)\.\*\*\*/g, '<strong><em>$1.</em></strong>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '<p></p>')

  // Enhance with interactive click-to-roll tags
  // 1. Attack bonuses: e.g. "+5 to hit"
  body = body.replace(/([+-]\d+)\s+to hit/g, '<button class="dnd-roll-btn" onclick="rollD20(\'Attack Roll\', $1)">$1 to hit</button>')
  // 2. Damage formulas: e.g. "(2d6 + 3)" or "(1d8)"
  body = body.replace(/\((\d+)d(\d+)(?:\s*([+-])\s*(\d+))?\)/g, (match, count, dice, sign, mod) => {
    const m = sign === '-' ? -parseInt(mod || '0') : parseInt(mod || '0')
    return `(<button class="dnd-roll-btn" onclick="rollDice('Damage Roll', ${count}, ${dice}, ${m})">${count}d${dice}${sign ? ` ${sign} ${mod}` : ''}</button>)`
  })
  // 3. Recharge tags: e.g. "Recharge 5–6" or "Recharge 6"
  body = body.replace(/Recharge\s*(\d+)[–-]6/gi, (match, min) => {
    return `<button class="dnd-roll-btn recharge" onclick="rollRecharge('Recharge Check', ${min})">Recharge ${min}–6</button>`
  })
  body = body.replace(/Recharge\s*6\b/gi, '<button class="dnd-roll-btn recharge" onclick="rollRecharge(\'Recharge Check\', 6)">Recharge 6</button>')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${monsterName} - Interactive D&D 5e Statblock</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: #1e1e1e;
      color: #333;
      font-family: Georgia, 'Times New Roman', serif;
      padding: 24px;
      display: flex;
      justify-content: center;
    }
    .dnd-statblock-wrapper {
      max-width: 800px;
      width: 100%;
    }
    .dnd-statblock {
      background: #fdf1dc;
      padding: 24px;
      border: 1px solid #d3a362;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
      border-radius: 4px;
      position: relative;
    }
    .dnd-statblock.revised {
      border-left: 6px solid #7a2021;
    }
    .dnd-statblock.classic {
      border-top: 5px solid #e69a28;
      border-bottom: 5px solid #e69a28;
    }
    .statblock-name {
      color: #7a2021;
      font-family: 'Cinzel', Georgia, serif;
      font-size: 28px;
      font-weight: 700;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
      text-transform: capitalize;
    }
    .statblock-meta {
      font-size: 14px;
      color: #555;
      font-style: italic;
      margin-bottom: 8px;
    }
    .statblock-divider {
      border: 0;
      height: 2px;
      background: linear-gradient(90deg, #9c2727 0%, #e69a28 50%, #9c2727 100%);
      margin: 10px 0;
    }
    .statblock-section {
      color: #7a2021;
      font-size: 18px;
      border-bottom: 1px solid #7a2021;
      padding-bottom: 3px;
      margin-top: 14px;
      margin-bottom: 8px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 8px 0;
      text-align: center;
    }
    th {
      color: #7a2021;
      font-weight: bold;
      font-size: 13px;
      padding: 4px;
    }
    td {
      font-size: 14px;
      padding: 4px;
    }
    p {
      margin-bottom: 6px;
      font-size: 14px;
      line-height: 1.45;
    }
    strong {
      color: #222;
    }
    .dnd-roll-btn {
      background: rgba(122, 32, 33, 0.08);
      color: #7a2021;
      border: 1px solid rgba(122, 32, 33, 0.25);
      border-radius: 4px;
      padding: 2px 6px;
      font-family: inherit;
      font-size: inherit;
      font-weight: bold;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      transition: all 0.15s ease;
      vertical-align: middle;
      line-height: 1.2;
    }
    .dnd-roll-btn:hover {
      background: #7a2021;
      color: #fff;
      border-color: #7a2021;
      box-shadow: 0 2px 6px rgba(122, 32, 33, 0.4);
      transform: translateY(-1px);
    }
    .dnd-roll-btn.recharge {
      background: rgba(230, 154, 40, 0.15);
      color: #b36b00;
      border-color: rgba(230, 154, 40, 0.4);
    }
    .dnd-roll-btn.recharge:hover {
      background: #b36b00;
      color: #fff;
    }
    .roll-adv {
      color: #2e7d32;
      font-size: 14px;
      margin-right: 2px;
    }
    .roll-disadv {
      color: #c62828;
      font-size: 14px;
      margin-right: 2px;
    }
    /* Floating Dice Tray */
    #dice-tray {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 320px;
      max-width: calc(100vw - 40px);
      background: #2a2a2a;
      border: 1px solid #e69a28;
      border-radius: 8px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
      color: #e0e0e0;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    #dice-tray-header {
      background: #1e1e1e;
      padding: 10px 14px;
      font-weight: bold;
      font-size: 14px;
      color: #e69a28;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #444;
      cursor: pointer;
    }
    #dice-tray-controls button {
      background: transparent;
      border: none;
      color: #aaa;
      font-size: 12px;
      cursor: pointer;
      padding: 2px 6px;
      border-radius: 3px;
    }
    #dice-tray-controls button:hover {
      color: #fff;
      background: #444;
    }
    #dice-tray-log {
      max-height: 240px;
      overflow-y: auto;
      padding: 10px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .dice-roll-card {
      background: #333;
      border-left: 3px solid #e69a28;
      border-radius: 4px;
      padding: 8px 10px;
      font-size: 13px;
      animation: fadeIn 0.2s ease-out;
    }
    .dice-roll-card.recharged {
      border-left-color: #4caf50;
    }
    .dice-roll-card.failed {
      border-left-color: #f44336;
    }
    .dice-roll-title {
      font-weight: bold;
      color: #fff;
      display: flex;
      justify-content: space-between;
      margin-bottom: 2px;
    }
    .dice-roll-time {
      font-size: 11px;
      color: #888;
    }
    .dice-roll-breakdown {
      color: #bbb;
      font-size: 12px;
    }
    .dice-roll-total {
      font-size: 16px;
      font-weight: bold;
      color: #e69a28;
      text-align: right;
      margin-top: 2px;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }
  </style>
</head>
<body>
  <div class="dnd-statblock-wrapper">
    <div class="dnd-statblock ${style === '2024' ? 'revised' : 'classic'}">
${body}
    </div>
  </div>

  <!-- Floating Dice Tray -->
  <div id="dice-tray">
    <div id="dice-tray-header" onclick="toggleDiceTray()">
      <span>🎲 Roll Log & Dice Tray</span>
      <div id="dice-tray-controls" onclick="event.stopPropagation()">
        <button onclick="clearDiceLog()">Clear</button>
        <button id="toggle-tray-btn" onclick="toggleDiceTray()">_</button>
      </div>
    </div>
    <div id="dice-tray-log">
      <div class="dice-roll-card" style="border-left-color: #888;">
        <div class="dice-roll-title">
          <span>Click any bonus or damage formula to roll!</span>
        </div>
      </div>
    </div>
  </div>

  <script>
    function logRoll(title, breakdown, total, statusClass) {
      const log = document.getElementById('dice-tray-log');
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const card = document.createElement('div');
      card.className = 'dice-roll-card' + (statusClass ? ' ' + statusClass : '');
      card.innerHTML =
        '<div class="dice-roll-title">' +
          '<span>' + title + '</span>' +
          '<span class="dice-roll-time">' + timeStr + '</span>' +
        '</div>' +
        '<div class="dice-roll-breakdown">' + breakdown + '</div>' +
        (total !== undefined ? '<div class="dice-roll-total">' + total + '</div>' : '');
      log.appendChild(card);
      log.scrollTop = log.scrollHeight;
    }

    function rollD20(title, mod, advDis) {
      const m = parseInt(mod) || 0;
      const modStr = m >= 0 ? '+' + m : '' + m;
      if (advDis === 'adv') {
        const r1 = Math.floor(Math.random() * 20) + 1;
        const r2 = Math.floor(Math.random() * 20) + 1;
        const kept = Math.max(r1, r2);
        const total = kept + m;
        logRoll(title + ' (Advantage)', '2d20 [' + r1 + ', ' + r2 + '] (kept ' + kept + ') ' + modStr, total);
      } else if (advDis === 'disadv') {
        const r1 = Math.floor(Math.random() * 20) + 1;
        const r2 = Math.floor(Math.random() * 20) + 1;
        const kept = Math.min(r1, r2);
        const total = kept + m;
        logRoll(title + ' (Disadvantage)', '2d20 [' + r1 + ', ' + r2 + '] (kept ' + kept + ') ' + modStr, total);
      } else {
        const r = Math.floor(Math.random() * 20) + 1;
        const total = r + m;
        logRoll(title, '1d20 (' + r + ') ' + modStr, total);
      }
    }

    function rollDice(title, count, dice, mod, type) {
      const c = parseInt(count) || 1;
      const d = parseInt(dice) || 6;
      const m = parseInt(mod) || 0;
      const rolls = [];
      let sum = 0;
      for (let i = 0; i < c; i++) {
        const r = Math.floor(Math.random() * d) + 1;
        rolls.push(r);
        sum += r;
      }
      const total = sum + m;
      const modStr = m !== 0 ? (m > 0 ? ' + ' + m : ' - ' + Math.abs(m)) : '';
      const typeStr = type ? ' ' + type : '';
      logRoll(title, c + 'd' + d + ' (' + rolls.join(', ') + ')' + modStr, total + typeStr);
    }

    function rollRecharge(title, minSuccess) {
      const min = parseInt(minSuccess) || 5;
      const r = Math.floor(Math.random() * 6) + 1;
      const success = r >= min;
      logRoll(
        title,
        '1d6 (' + r + ') vs ' + min + '+',
        success ? 'RECHARGED! ⚡' : 'FAILED',
        success ? 'recharged' : 'failed'
      );
    }

    function clearDiceLog() {
      document.getElementById('dice-tray-log').innerHTML = '';
    }

    let isTrayCollapsed = false;
    function toggleDiceTray() {
      const log = document.getElementById('dice-tray-log');
      const btn = document.getElementById('toggle-tray-btn');
      isTrayCollapsed = !isTrayCollapsed;
      log.style.display = isTrayCollapsed ? 'none' : 'flex';
      btn.textContent = isTrayCollapsed ? '▲' : '_';
    }
  </script>
</body>
</html>`
}

export function exportToFoundryActor(monster: Monster): Record<string, unknown> {
  const crObj = CR[monster.CR] || { cr: '0', numeric: 0 }
  const hpVal = avgHP(monster.HP)

  const items = [
    ...(monster.attacks || []).map((atk) => ({
      name: atk.name,
      type: 'weapon',
      system: {
        damage: {
          parts: [[`${atk.damage.count}d${atk.damage.dice}+@mod`, atk.damage.type]],
        },
        range: { value: atk.range.standard, long: atk.range.long, units: 'ft' },
      },
    })),
    ...(monster.traits || []).map((t) => ({
      name: t.name,
      type: 'feat',
      system: {
        description: { value: t.description },
      },
    })),
  ]

  return {
    name: monster.nickname || monster.name,
    type: 'npc',
    img: monster.portrait?.url || 'icons/svg/mystery-man.svg',
    system: {
      abilities: {
        str: { value: monster.stats.STR, mod: statModifier(monster.stats.STR) },
        dex: { value: monster.stats.DEX, mod: statModifier(monster.stats.DEX) },
        con: { value: monster.stats.CON, mod: statModifier(monster.stats.CON) },
        int: { value: monster.stats.INT, mod: statModifier(monster.stats.INT) },
        wis: { value: monster.stats.WIS, mod: statModifier(monster.stats.WIS) },
        cha: { value: monster.stats.CHA, mod: statModifier(monster.stats.CHA) },
      },
      attributes: {
        ac: { value: monster.AC },
        hp: { value: hpVal, max: hpVal, formula: `${monster.HP.HD}d${monster.HP.type}+${monster.HP.modifier}` },
        movement: {
          walk: (monster.speeds || []).find((s) => !s.type || s.type === 'walk')?.speed || 30,
        },
      },
      details: {
        cr: crObj.numeric,
        alignment: monster.alignment,
        type: { value: monster.type },
        biography: { value: monster.inventory || '' },
      },
      traits: {
        size: monster.size.toLowerCase().substring(0, 3),
        dr: { value: monster.resistances || [] },
        di: { value: monster.immunities || [] },
        dv: { value: monster.vulnerabilities || [] },
        ci: { value: monster.conditions || [] },
        languages: {
          value: Array.isArray(monster.languagesList) && monster.languagesList.length > 0
            ? formatLanguagesList(monster.languagesList)
            : monster.languages || '',
        },
      },
    },
    items,
  }
}

export function exportToFoundryJson(monster: Monster): string {
  return JSON.stringify(exportToFoundryActor(monster), null, 2)
}

export function exportCharacterToMarkdown(char: CharacterActor): string {
  const lines: string[] = []
  lines.push('___')
  lines.push(`## ${char.name}`)
  lines.push(`*Level ${char.level} ${char.subclass ? char.subclass + ' ' : ''}${char.class} (${char.race}) • ${char.background} • ${char.alignment}*`)
  lines.push('___')
  const vitals = characterVitals(char)
  lines.push(`**Armor Class** ${characterVitalText(vitals.armorClass)}`)
  lines.push(`**Hit Points** ${char.hp.current} / ${char.hp.max}${char.hp.temp > 0 ? ` (+${char.hp.temp} temp)` : ''}`)
  lines.push(`**Speed** ${characterVitalText(vitals.speed, ' ft.')}`)
  lines.push(`**Proficiency Bonus** +${char.proficiency}`)
  lines.push('___')

  // Stats Table
  lines.push('|STR|DEX|CON|INT|WIS|CHA|')
  lines.push('|:---:|:---:|:---:|:---:|:---:|:---:|')
  lines.push(
    `|${char.stats.STR} (${renderModifier(char.stats.STR)})|${char.stats.DEX} (${renderModifier(
      char.stats.DEX
    )})|${char.stats.CON} (${renderModifier(char.stats.CON)})|${char.stats.INT} (${renderModifier(
      char.stats.INT
    )})|${char.stats.WIS} (${renderModifier(char.stats.WIS)})|${char.stats.CHA} (${renderModifier(
      char.stats.CHA
    )})|`
  )
  lines.push('___')
  lines.push(`**Hit Dice** ${char.hitDice.total - char.hitDice.spent} / ${char.hitDice.total}d${char.hitDice.die}`)
  lines.push(`**Passive Perception** ${10 + statModifier(char.stats.WIS)}`)

  if (char.savingThrows) {
    const saves = (['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'] as DndStat[])
      .filter((stat) => char.savingThrows?.[stat])
      .map((stat) => `${stat} ${renderModifier(statModifier(char.stats[stat]) + char.proficiency)}`)
    if (saves.length > 0) {
      lines.push(`**Saving Throws** ${saves.join(', ')}`)
    }
  }

  if (char.skills) {
    const skillList = Object.entries(char.skills)
      .filter(([, s]) => s.proficient)
      .map(([name, s]) => {
        const skillDef = DND_SKILLS.find((sk) => sk.name === name)
        const stat = skillDef ? skillDef.stat : 'STR'
        const bonus = statModifier(char.stats[stat]) + char.proficiency + (s.expertise ? char.proficiency : 0)
        return `${name} ${renderModifier(bonus)}`
      })
    if (skillList.length > 0) {
      lines.push(`**Skills** ${skillList.join(', ')}`)
    }
  }

  if (char.spellcasting && char.spellcasting.ability) {
    const ability = char.spellcasting.ability
    const saveDc = 8 + char.proficiency + statModifier(char.stats[ability])
    const attackBonus = renderModifier(char.proficiency + statModifier(char.stats[ability]))
    lines.push(`**Spellcasting** Ability: ${ability}, Spell Save DC: ${saveDc}, Spell Attack: ${attackBonus}`)
  }

  if (char.spells && char.spells.length > 0) {
    lines.push('### Prepared Spells')
    for (const sp of char.spells) {
      const lvlStr = sp.level === 0 ? 'Cantrip' : `Level ${sp.level}`
      lines.push(`- **${sp.name}** (${lvlStr})${sp.prepared ? ' [Prepared]' : ''}${sp.notes ? ` — ${sp.notes}` : ''}`)
    }
  }

  if (char.features && char.features.length > 0) {
    lines.push('### Features & Traits')
    for (const f of char.features) {
      lines.push(`***${f.name} (${f.source}).*** ${f.description}`)
    }
  }

  if (char.inventory && char.inventory.length > 0) {
    lines.push('### Inventory & Equipment')
    for (const item of char.inventory) {
      lines.push(`- **${item.name}** (Qty: ${item.quantity}, Weight: ${item.weight * item.quantity} lb)`)
    }
  }

  return lines.join('\n')
}

export function exportCharacterToPlainText(char: CharacterActor): string {
  const lines: string[] = []
  lines.push(char.name.toUpperCase())
  lines.push(`Level ${char.level} ${char.subclass ? char.subclass + ' ' : ''}${char.class} (${char.race}) • ${char.background} • ${char.alignment}`)
  lines.push('----------------------------------------')
  const vitals = characterVitals(char)
  lines.push(`Armor Class: ${characterVitalText(vitals.armorClass)}`)
  lines.push(`Hit Points: ${char.hp.current} / ${char.hp.max}${char.hp.temp > 0 ? ` (+${char.hp.temp} temp)` : ''}`)
  lines.push(`Speed: ${characterVitalText(vitals.speed, ' ft.')}`)
  lines.push(`Proficiency Bonus: +${char.proficiency}`)
  lines.push('----------------------------------------')
  lines.push(
    `STR ${char.stats.STR} (${renderModifier(char.stats.STR)}) | DEX ${char.stats.DEX} (${renderModifier(
      char.stats.DEX
    )}) | CON ${char.stats.CON} (${renderModifier(char.stats.CON)}) | INT ${char.stats.INT} (${renderModifier(
      char.stats.INT
    )}) | WIS ${char.stats.WIS} (${renderModifier(char.stats.WIS)}) | CHA ${char.stats.CHA} (${renderModifier(
      char.stats.CHA
    )})`
  )
  lines.push('----------------------------------------')
  lines.push(`Hit Dice: ${char.hitDice.total - char.hitDice.spent} / ${char.hitDice.total}d${char.hitDice.die}`)
  lines.push(`Passive Perception: ${10 + statModifier(char.stats.WIS)}`)

  if (char.savingThrows) {
    const saves = (['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'] as DndStat[])
      .filter((stat) => char.savingThrows?.[stat])
      .map((stat) => `${stat} ${renderModifier(statModifier(char.stats[stat]) + char.proficiency)}`)
    if (saves.length > 0) {
      lines.push(`Saving Throws: ${saves.join(', ')}`)
    }
  }

  if (char.skills) {
    const skillList = Object.entries(char.skills)
      .filter(([, s]) => s.proficient)
      .map(([name, s]) => {
        const skillDef = DND_SKILLS.find((sk) => sk.name === name)
        const stat = skillDef ? skillDef.stat : 'STR'
        const bonus = statModifier(char.stats[stat]) + char.proficiency + (s.expertise ? char.proficiency : 0)
        return `${name} ${renderModifier(bonus)}`
      })
    if (skillList.length > 0) {
      lines.push(`Skills: ${skillList.join(', ')}`)
    }
  }

  if (char.spellcasting && char.spellcasting.ability) {
    const ability = char.spellcasting.ability
    const saveDc = 8 + char.proficiency + statModifier(char.stats[ability])
    const attackBonus = renderModifier(char.proficiency + statModifier(char.stats[ability]))
    lines.push(`Spellcasting: Ability ${ability} | Spell Save DC ${saveDc} | Spell Attack ${attackBonus}`)
  }

  if (char.spells && char.spells.length > 0) {
    lines.push('PREPARED SPELLS:')
    for (const sp of char.spells) {
      const lvlStr = sp.level === 0 ? 'Cantrip' : `Level ${sp.level}`
      lines.push(`- ${sp.name} (${lvlStr})${sp.prepared ? ' [Prepared]' : ''}${sp.notes ? ` - ${sp.notes}` : ''}`)
    }
  }

  if (char.features && char.features.length > 0) {
    lines.push('FEATURES & TRAITS:')
    for (const f of char.features) {
      lines.push(`${f.name} (${f.source}): ${f.description}`)
    }
  }

  if (char.inventory && char.inventory.length > 0) {
    lines.push('INVENTORY:')
    for (const item of char.inventory) {
      lines.push(`- ${item.name} (x${item.quantity}) [${item.weight * item.quantity} lb]`)
    }
  }

  return lines.join('\n')
}

export function exportCharacterToJson(char: CharacterActor): string {
  return JSON.stringify(char, null, 2)
}
