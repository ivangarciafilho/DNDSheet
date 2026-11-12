import { formatBasicRider, formatRiderSchedule, type DefenseEffect, type BasicRiderScope, type HpRiderGroup } from 'src/core/domain/basic-riders'
import { mechanicPlainText } from 'src/core/domain/mechanic-rich-text'
import { castingLearningSummary, hasCastingSources } from 'src/core/usecases/AutoSyncSpellcasting'
import { buildCastingProjection } from 'src/core/domain/casting-projection'
import { useSpellsStore } from 'src/stores/spells-store'
import { castingResourceView, castingResourceSummary } from 'src/core/domain/casting-resource-view'
import { formatNumericPresentation } from 'src/core/domain/numeric-presentation'
import { cadenceLabel } from 'src/core/domain/catalogs/cadence'
import {
  formatDefenseItem,
  formatDefenseList,
  formatLanguageItem,
  formatLanguagesList,
  formatMinimalistRegen,
  formatMinimalistDeathPrevention,
  resolveDynamicNumericSource,
  composeInvulnerabilityRuling,
  resolveInvulnerabilityDisplayLocation,
  composeAcAndDefenses,
  DynamicValueContext,
} from 'src/core/domain/defense-and-traits-utils'
import { formatInitiativeRiders } from 'src/core/domain/initiative-composer'
import { cleanPunctuation, formatDistanceUnit } from 'src/core/domain/number-grammar'
import { CR } from 'src/data/CR'
import { useMonsterStore } from 'src/stores/monster-store'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  renderBonus,
  statModifier,
  saveModifierForStat,
  bonusForSkill,
  safeToOrdinal,
} from './mathRendering'

import { useProcessTokens } from './useProcessTokens'
import _, { capitalize } from 'lodash'
import { useEditorStore } from 'src/stores/editor-store'
import { DndStat } from '../models'
import { SKILL } from 'src/data/SKILL'
import {
  SKILL_ACTION_GROUPS,
  computeSkillGroupLayout,
  effectiveAdvantage,
  mergeIdenticalEntries,
  normalizeSkillKey,
  passiveConfigKey,
  passiveScore,
  skillGroupPlacement,
} from 'src/core/domain/skill-action-groups'
import type {
  CombatSkillGroupId,
  SkillActionType,
  SkillCheckEntry,
  SkillCheckInput,
  SkillGroupRow,
} from 'src/core/domain/skill-action-groups'
import { advHtml, condHtml, escapeHtml, htmlToText, numHtml } from './advFormat'
import { describePools } from 'src/core/domain/paragon-pools'
import { spellNameWithCadence } from 'src/core/domain/spell-plate'
import { formatSpeedActionRider } from 'src/core/domain/speeds-traversal'

// rendering strings for whatever needs it; exports pass `web: false` for prose in every template
export function useTextRenderer(options: { web?: boolean } = {}) {
  const monster = useMonsterStore()
  const castingSpells = useSpellsStore()
  const editorStore = useEditorStore()
  const formattedNumeric = (path: string, text: string | number): string => {
    const presentation = options.web !== false ? monster.bindings?.[path]?.presentation : undefined
    return presentation ? formatNumericPresentation(text, presentation) : String(text)
  }
  const numericHtml = (path: string, text: string | number): string => numHtml(formattedNumeric(path, text))
  const { t } = useI18n()
  const {
    processAction,
    processAttack,
    processClassSpellcasting,
    processInnateSpellcasting,
    processLairActionPreamble,
    processLairAction,
    processLegendaryAction,
    processLegendaryPreamble,
    processMultiattack,
    processMythicActionPreamble,
    processMythicActionTrait,
    processReaction,
    processTokens,
    processTrait,
    buildPlateEntry,
  } = useProcessTokens(options)

  const stats = computed(() => {
    return monster.statsWithModifiers.map((s) => {
      return {
        ...s,
        renderedScore: formattedNumeric(`stats.${s.stat}`, s.score),
        renderedModifier: renderBonus(statModifier(s.score)),
      }
    })
  })

  const hpModifier = computed(() =>
    monster.HP.modifier === 0 ? '' : `+${monster.HP.modifier}`
  )

  const dynCtx = computed<DynamicValueContext>(() => ({
    avgHp: monster.avgHp,
    proficiency: monster.proficiency,
    hd: monster.HP.HD,
    hdType: monster.HP.type,
    stats: monster.stats as unknown as Record<string, number>,
  }))

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

  const formatInvulnerabilityText = (inv: NonNullable<typeof monster.extendedHp>['invulnerability']): string => {
    const ruling = composeInvulnerabilityRuling(inv)
    return ruling ? `; ${ruling}` : ''
  }

  const acInvulnerability = computed(() => {
    const inv = monster.extendedHp?.invulnerability
    if (!inv) return ''
    const loc = resolveInvulnerabilityDisplayLocation(inv)
    if (loc !== 'ac') return ''
    return formatInvulnerabilityText(inv)
  })

  const scheduleDefense = (effect: DefenseEffect, text: string) =>
    formatRiderSchedule(text, monster.defenseSchedules?.[effect])

  const basicRiderText = (scope: BasicRiderScope) =>
    (monster.basicRiders?.[scope] ?? []).map(rider => formatBasicRider(rider, scope)).filter(Boolean)

  const acBadges = computed(() => [...armorBadges.value, ...basicRiderText('ac').map(escapeHtml)])

  const armorBadges = computed(() => {
    const acCfg = monster.acConfig
    const hasCompositorSettings = Boolean(
      acCfg && (
        acCfg.enabled ||
        (acCfg.baseMode && acCfg.baseMode !== 'flat') ||
        (acCfg.abilityBonus && acCfg.abilityBonus !== 'none') ||
        (acCfg.defenseItem && acCfg.defenseItem !== 'none') ||
        (acCfg.temporary && acCfg.temporary !== 'none') ||
        (acCfg.conditional && acCfg.conditional !== 'none') ||
        (acCfg.conditionMode && acCfg.conditionMode !== 'none')
      )
    )

    if (hasCompositorSettings) {
      const res = composeAcAndDefenses(monster)
      const badges: string[] = [...res.badges]
      const inv = monster.extendedHp?.invulnerability
      if (inv) {
        const loc = resolveInvulnerabilityDisplayLocation(inv)
        if (loc === 'ac' && (!res.isAbsoluteRule || (monster as any).splitAcRiderRows)) {
          const ruling = composeInvulnerabilityRuling(inv)
          if (ruling && !badges.includes(ruling)) badges.push(ruling)
        }
      }
      return badges
    }

    const splitAc = Boolean((monster as any).splitAcRiderRows)
    const rawAcType = monster.ACType ? monster.ACType.trim() : ''
    if (splitAc && rawAcType) {
      const badges: string[] = [numericHtml('AC', monster.AC)]
      const parts = rawAcType.split(/\s*[;,]\s*/).filter(Boolean)
      for (const p of parts) badges.push(p)
      const inv = monster.extendedHp?.invulnerability
      if (inv && resolveInvulnerabilityDisplayLocation(inv) === 'ac') {
        const ruling = composeInvulnerabilityRuling(inv)
        if (ruling) badges.push(ruling)
      }
      return badges
    }

    const baseAc = cleanPunctuation(`${numericHtml('AC', monster.AC)}${rawAcType !== '' ? ` (${formatDistanceUnit(rawAcType)})` : ''}`)
    const badges: string[] = [baseAc]

    const inv = monster.extendedHp?.invulnerability
    if (inv) {
      const loc = resolveInvulnerabilityDisplayLocation(inv)
      if (loc === 'ac') {
        const ruling = composeInvulnerabilityRuling(inv)
        if (ruling) badges.push(ruling)
      }
    }
    return badges
  })

  const bloodiedValue = computed(() => {
    const ext = monster.extendedHp
    if (!ext) return null
    const src = ext.bloodiedSource || (ext as any).bloodiedValueSource
    if (src === 'none' && !ext.showBloodied) return null
    const hasExplicitOverride = ext.bloodiedOverride != null && Number(ext.bloodiedOverride) > 0
    if (!src && !ext.showBloodied && !hasExplicitOverride) return null
    if (hasExplicitOverride && (!src || src === 'flat')) {
      return formattedNumeric('extendedHp.bloodiedOverride', ext.bloodiedOverride ?? '')
    }
    const effectiveSrc = !src || src === 'none' ? 'half_hp' : src
    return resolveDynamicNumericSource(
      effectiveSrc,
      ext.bloodiedOverride ?? Math.max(1, Math.floor(monster.avgHp / 2)),
      ext.bloodiedDice,
      dynCtx.value
    )
  })

  const hpBadgeEntries = computed(() => {
    const ext = monster.extendedHp
    const dp = ext?.deathPrevention

    const authored = (['hp', 'deathThroes', 'onDamage'] as const).flatMap(group =>
      basicRiderText(group).map(text => ({ group, text: escapeHtml(text) })))
    // Preserve authored triggers even when the base HP is hidden.
    if (dp?.enabled && dp.name !== 'Mortal') {
      if (dp.dcRule === 'until_x_crits') {
        const text = formatMinimalistDeathPrevention(dp, dynCtx.value)
        return [{ text: scheduleDefense('deathPrevention', text || 'Immortal') }, ...authored]
      }
      const noExceptions = (!dp.exceptions || dp.exceptions.length === 0) && !dp.customNote?.trim()
      if (dp.hideHp || (dp.name === 'Immortal' && noExceptions && !dp.returnHpSource)) {
        const text = formatMinimalistDeathPrevention(dp, dynCtx.value) || 'Immortal'
        return [{ text: scheduleDefense('deathPrevention', text) }, ...authored]
      }
    }

    const badges: { text: string; group?: HpRiderGroup }[] = []
    const add = (text: string, group?: HpRiderGroup) => badges.push({ text, group })

    const poolCount = monster.paragonConfig?.poolCount || monster.paragonConfig?.poolsCount || ext?.paragonPools || 1
    const isParagon = Boolean(
      (monster.paragonConfig?.enabled && poolCount > 1) ||
      poolCount > 1
    )

    // 1. Primary HP & Hit Dice (Merged cleanly, or split Bloodied into its own rider row when splitHpRiderRows is enabled)
    const dicePart = `<span class="dnd-hp-hd">(${formattedNumeric('HP.HD', monster.HP.HD)}d${formattedNumeric('HP.type', monster.HP.type)}${hpModifier.value ? formattedNumeric('HP.modifier', hpModifier.value) : ''})</span>`
    if (!isParagon && bloodiedValue.value != null) {
      if (monster.hpRiderSubrows?.bloodied ?? (monster.$state as { splitHpRiderRows?: boolean }).splitHpRiderRows) {
        add(`${numHtml(monster.avgHp)} ${dicePart}`)
        add(`<strong class="dnd-num text-red-7">${bloodiedValue.value}</strong> Bloodied`, 'bloodied')
      } else {
        add(`${numHtml(monster.avgHp)}/<strong class="dnd-num text-red-7">${bloodiedValue.value}</strong> Bloodied ${dicePart}`)
      }
    } else {
      add(`${numHtml(monster.avgHp)} ${dicePart}`)
    }

    // 2. Multi-phase pools & Grouped Bloodied limiter
    if (isParagon) {
      const pName = monster.paragonConfig?.phaseName?.trim() || 'Phase'
      const configs = monster.paragonConfig?.phaseConfigs
      const bloodiedAt = ext?.bloodiedAtPhase || ''
      const normalPhases: string[] = []
      const bloodiedPhases: { label: string; val: string }[] = []

      if (Array.isArray(configs) && configs.length > 0) {
        configs.slice(0, poolCount).forEach((cfg, idx) => {
          const isFinalIdx = idx === poolCount - 1
          let label = (cfg.name?.trim() || (isFinalIdx ? 'Final' : `${pName} ${idx + 2}`)).trim()
          if (isFinalIdx && label && !label.toLowerCase().includes('final')) {
            label = `${label}, Final`
          }
          const rawVal = cfg.hpOverride != null && cfg.hpOverride > 0 && cfg.source === 'flat'
            ? `${cfg.hpOverride}`
            : resolveDynamicNumericSource(cfg.source || 'half_hp', cfg.hpOverride ?? Math.max(1, Math.floor(monster.avgHp / Math.pow(2, idx + 1))), cfg.diceFormula, dynCtx.value)
          const val = String(rawVal).trim()
          const isBloodiedPhase = Boolean(
            cfg.isBloodied ||
            bloodiedAt === label ||
            (bloodiedAt === 'final_phase' && idx === poolCount - 1) ||
            (bloodiedAt === `phase_${idx + 2}`)
          )
          if (isBloodiedPhase) {
            bloodiedPhases.push({ label, val })
          } else {
            normalPhases.push(`${numHtml(val)} (${label})`)
          }
        })
      } else {
        const pools = describePools(poolCount, monster.paragonConfig?.poolHp)
        if (pools?.kind === 'uniform') {
          normalPhases.push(`${numericHtml('paragonConfig.poolCount', pools.count)} Pools of ${numHtml(pools.hp)} HP`)
        } else if (pools?.kind === 'list') {
          pools.pools.forEach((pool) => normalPhases.push(`${numHtml(pool.hp)} (${pool.label})`))
        } else {
          for (let i = 0; i < poolCount; i++) {
            const label = (i === poolCount - 1 ? 'Final' : `${pName} ${i + 2}`).trim()
            const val = `${Math.max(1, Math.floor(monster.avgHp / Math.pow(2, i + 1)))}`.trim()
            normalPhases.push(`${numHtml(val)} (${label})`)
          }
        }
      }

      if (normalPhases.length > 0) {
        add(normalPhases.join(' | '), 'bloodied')
      }
      if (bloodiedPhases.length > 0) {
        const bloodiedInner = bloodiedPhases.map(b => `${numHtml(b.val)} (${b.label})`).join(' | ')
        add(`<span class="dnd-bloodied-badge dnd-bloodied-phases-limiter">[ ${bloodiedInner} | <span class="bloodied-tag">[Bloodied]</span> ]</span>`, 'bloodied')
      } else if (bloodiedValue.value != null && (!bloodiedAt || bloodiedAt === 'half_total')) {
        add(`<span class="dnd-bloodied-badge dnd-bloodied-phases-limiter">[ ${numHtml(bloodiedValue.value)} | <span class="bloodied-tag">[Bloodied]</span> ]</span>`, 'bloodied')
      }
    }

    // 3. Regeneration & Temporary Hit Points (each pushed as an independent rider badge)
    if (
      ext?.regeneration?.enabled &&
      (ext.regeneration.displayMode === 'minimalist' ||
        ext.regeneration.displayMode === 'both' ||
        !ext.regeneration.displayMode)
    ) {
      const minRegen = formatMinimalistRegen(ext.regeneration, dynCtx.value, (field, value) => formattedNumeric(`extendedHp.regeneration.${field}`, value))
      if (minRegen) {
        add(scheduleDefense('regeneration', minRegen), 'regen')
      }
    }
    if (ext?.tempHp && ext.tempHp.amount > 0) {
      const thp = ext.tempHp
      let trigStr = ''
      if (thp.trigger === 'start_turn') trigStr = ' at start of turn'
      else if (thp.trigger === 'end_turn') trigStr = ' at end of turn'
      else if (thp.trigger === 'damage_type' && thp.damageType) trigStr = ` when taking ${thp.damageType} damage`
      else if (thp.trigger === 'bloodied') trigStr = ' when bloodied'
      else if (thp.trigger === 'short_rest') trigStr = ' on short rest'
      else if (thp.trigger === 'long_rest') trigStr = ' on long rest'
      add(`+${formattedNumeric('extendedHp.tempHp.amount', thp.amount)} temp HP${trigStr}`, 'regen')
    }

    // 4. Minimalist Direct Death Prevention (No redundant "Immortal" wrapper)
    if (
      dp?.enabled &&
      dp.name !== 'Mortal' &&
      (dp.displayMode === 'minimalist' ||
        dp.displayMode === 'both' ||
        !dp.displayMode)
    ) {
      const minDp = formatMinimalistDeathPrevention(dp, dynCtx.value)
      if (minDp) {
        add(scheduleDefense('deathPrevention', minDp), 'mortality')
      }
    }

    // 5. Damage Threshold (DT)
    const hasDt =
      (ext?.damageThreshold != null && Number(ext.damageThreshold) > 0) ||
      Boolean(ext?.damageThresholdSource && ext.damageThresholdSource !== 'flat' && ext.damageThresholdSource !== 'none')
    if (hasDt && ext) {
      const dtStr = resolveDynamicNumericSource(
        ext.damageThresholdSource,
        ext.damageThreshold,
        ext.damageThresholdDice,
        dynCtx.value
      )
      const dStr = formatDisrupt(ext.damageThresholdDisruption)
      add(scheduleDefense('damageThreshold', `DT ${formattedNumeric('extendedHp.damageThreshold', dtStr)}${dStr ? ` (disrupted by ${dStr})` : ''}`), 'dt')
    }

    // 6. Damage Reduction (DR)
    const hasDr =
      (ext?.damageReduction != null && Number(ext.damageReduction) > 0) ||
      Boolean(ext?.damageReductionSource && ext.damageReductionSource !== 'flat' && ext.damageReductionSource !== 'none')
    if (hasDr && ext) {
      const drStr = resolveDynamicNumericSource(
        ext.damageReductionSource,
        ext.damageReduction,
        ext.damageReductionDice,
        dynCtx.value
      )
      const dStr = formatDisrupt(ext.damageReductionDisruption)
      add(scheduleDefense('damageReduction', `DR ${formattedNumeric('extendedHp.damageReduction', drStr)}${dStr ? ` (disrupted by ${dStr})` : ''}`), 'dr')
    }

    // 7. Invulnerability in HP
    const hpInv = ext?.invulnerability
    if (hpInv) {
      const loc = resolveInvulnerabilityDisplayLocation(hpInv)
      if (loc === 'hp') {
        const invRuling = composeInvulnerabilityRuling(hpInv)
        if (invRuling) add(invRuling, 'invulnerability')
      }
    }

    return [...badges, ...authored]
  })


  const hpBadges = computed(() => hpBadgeEntries.value.map(entry => entry.text))

  const hp = computed(() => {
    const rawBadges = hpBadges.value
    if (rawBadges.length === 0) return ''
    if (rawBadges.length === 1) return rawBadges[0]
    return rawBadges.join(', ')
  })

  // maybe pull these into a separate file? idk if i'll need to reuse later so can always split later
  // string renderer for saves
  const saves = computed(() => {
    const allSaves = Object.entries(monster.saves).map(([stat, save]) => {
      const isProf = save?.proficient
      const isOverride = save?.override
      const hasAdv = save?.advantage
      const hasDisadv = save?.disadvantage
      const cond = save?.condition?.trim()

      if (!isProf && !isOverride && !hasAdv && !hasDisadv && !cond) {
        return ''
      }

      const modStr = isOverride
        ? renderBonus(save.overrideValue)
        : renderBonus(saveModifierForStat(monster, stat as keyof typeof monster.saves))

      return advHtml(`${stat} ${numericHtml(`saves.${stat}.overrideValue`, modStr)}${condHtml(cond)}`, hasAdv, hasDisadv)
    })

    return allSaves.filter((s) => s !== '').join(', ')
  })

  /**
   * the 2024 renderer has a specific layout so we need to be able to access these by key
   */
  const statsAndSavesByKey = computed(() => {
    const data: Record<
      string,
      {
        stat: DndStat
        score: number
        renderedScore: string
        modifier: number
        renderedModifier: string
        renderedSave: string
      }
    > = {}

    // pull the saves while we're doing the mods
    monster.statsWithModifiers.forEach((s) => {
      const save = monster.saves?.[s.stat]

      const hasAdv = save?.advantage
      const hasDisadv = save?.disadvantage
      const cond = save?.condition?.trim()
      const baseSave = save?.override
        ? renderBonus(save.overrideValue)
        : renderBonus(
            saveModifierForStat(monster, s.stat as keyof typeof monster.saves)
          )
      const saveHtml = advHtml(`${numericHtml(`saves.${s.stat}.overrideValue`, baseSave)}${condHtml(cond)}`, hasAdv, hasDisadv)

      data[s.stat] = {
        ...s,
        renderedScore: formattedNumeric(`stats.${s.stat}`, s.score),
        renderedModifier: renderBonus(statModifier(s.score)),
        renderedSave: saveHtml,
      }
    })

    return data
  })

  // string renderer for speeds
  const speeds = computed(() => {
    const trav = monster.speedTraversal
    const parts = monster.speeds.map((s) => {
      const typeLower = (s.type || '').toLowerCase()
      const isFly = typeLower === 'fly'
      const isSwim = typeLower === 'swim'
      const noteBits: string[] = []
      if ((s.hover || (isFly && s.hover)) && !s.note?.toLowerCase().includes('hover')) {
        noteBits.push('hover')
      }
      if (isSwim && trav?.aquaticBreathing && trav.aquaticBreathing !== 'none') {
        if (trav.aquaticBreathing === 'amphibious') {
          noteBits.push('amphibious')
        } else if (trav.aquaticBreathing === 'underwater') {
          noteBits.push('can breathe underwater')
        } else if (trav.aquaticBreathing === 'water_only') {
          noteBits.push('can only breathe underwater')
        } else if (trav.aquaticBreathing === 'hold_breath') {
          noteBits.push(`can hold breath for ${trav.holdBreathDuration?.trim() || '1 hour'}`)
        }
      }
      if (s.note && s.note.trim()) {
        noteBits.push(s.note.trim())
      }
      const note = noteBits.length > 0 ? ` (${noteBits.join(', ')})` : ''
      const type =
        s.type != null && s.type.toLowerCase() === 'walk' ? '' : `${s.type} `
      return `${capitalize(type)}${formattedNumeric(`speeds[id=${encodeURIComponent(s.id)}].speed`, s.speed)} ft.${note}`
    })

    if (trav) {
      if (trav.amorphous1Inch) {
        parts.push('move through 1-inch spaces without squeezing')
      }
      if (trav.amorphousCannotEnterLiquids) {
        parts.push("can't enter liquid bodies")
      }
      if (trav.moveThroughCreaturesDifficultTerrain) {
        if (trav.moveThroughCreaturesShunt) {
          if (trav.shuntDestination === 'ethereal_plane') {
            parts.push('move through creature spaces as difficult terrain (shunts creature to Ethereal Plane)')
          } else {
            const dmg = trav.moveThroughCreaturesShuntDamage?.trim() || '1d10 force'
            parts.push(`move through creature spaces as difficult terrain (shunts to adjacent space dealing ${dmg} damage)`)
          }
        } else {
          parts.push('move through creature spaces as difficult terrain')
        }
      }
      if (trav.moveThroughCreaturesTwoSizesDifferent) {
        parts.push('move through spaces of creatures 2 sizes different')
      }
      if (trav.ignoresDifficultTerrain) {
        parts.push('ignores difficult terrain')
      }
      const cunning: string[] = []
      if (trav.bonusActionDash) {
        cunning.push(trav.dashRider?.trim() ? `Dash (${trav.dashRider.trim()})` : 'Dash')
      }
      if (trav.bonusActionDodge) {
        cunning.push(trav.dodgeRider?.trim() ? `Dodge (${trav.dodgeRider.trim()})` : 'Dodge')
      }
      if (trav.bonusActionDisengage) {
        cunning.push(trav.disengageRider?.trim() ? `Disengage (${trav.disengageRider.trim()})` : 'Disengage')
      }
      if (cunning.length > 0) {
        const cunningSeparator = cunning.every((c) => !c.includes('(')) ? '/' : ', '
        parts.push(`bonus action ${cunning.join(cunningSeparator)}`)
      }
      if (Array.isArray(trav.actionRiders) && trav.actionRiders.length > 0) {
        for (const rider of trav.actionRiders) {
          const formatted = formatSpeedActionRider(rider)
          if (formatted) parts.push(formatted)
        }
      }
      if (trav.bonusActionSpeed && trav.bonusActionSpeed > 0) {
        parts.push(`bonus action speed ${trav.bonusActionSpeed} ft.`)
      }
      if (trav.trackingSpeed && trav.trackingSpeed > 0) {
        parts.push(`tracking ${trav.trackingSpeed} ft.`)
      }
      if (trav.stealthSpeed && trav.stealthSpeed > 0) {
        parts.push(`stealth ${trav.stealthSpeed} ft.`)
      }
      if (trav.etherealJaunt && trav.etherealJaunt !== 'none') {
        if (trav.etherealJaunt === 'bonus_action') {
          parts.push('Ethereal Jaunt (Bonus Action: shift to/from Ethereal Plane)')
        } else if (trav.etherealJaunt === 'action') {
          parts.push('Ethereal Jaunt (Action: shift to/from Ethereal Plane)')
        } else if (trav.etherealJaunt === 'at_will') {
          parts.push('Ethereal Jaunt (shift to/from Ethereal Plane at will)')
        }
      }
      const hasSwimSpeed = monster.speeds.some((s) => (s.type || '').toLowerCase() === 'swim')
      if (!hasSwimSpeed && trav.aquaticBreathing && trav.aquaticBreathing !== 'none') {
        if (trav.aquaticBreathing === 'amphibious') {
          parts.push('amphibious')
        } else if (trav.aquaticBreathing === 'underwater') {
          parts.push('can breathe underwater')
        } else if (trav.aquaticBreathing === 'water_only') {
          parts.push('can only breathe underwater')
        } else if (trav.aquaticBreathing === 'hold_breath') {
          parts.push(`can hold breath for ${trav.holdBreathDuration?.trim() || '1 hour'}`)
        }
      }
      if (trav.note && trav.note.trim()) {
        parts.push(trav.note.trim())
      }
    }

    parts.push(...basicRiderText('speed').map(escapeHtml))
    return options.web === false ? mechanicPlainText(parts.join('; ')) : parts.join('; ')
  })

  const speedBaseBadges = computed(() => {
    const trav = monster.speedTraversal
    const parts = monster.speeds.map((s) => {
      const typeLower = (s.type || '').toLowerCase()
      const isFly = typeLower === 'fly'
      const isSwim = typeLower === 'swim'
      const noteBits: string[] = []
      if ((s.hover || (isFly && s.hover)) && !s.note?.toLowerCase().includes('hover')) {
        noteBits.push('hover')
      }
      if (isSwim && trav?.aquaticBreathing && trav.aquaticBreathing !== 'none') {
        if (trav.aquaticBreathing === 'amphibious') {
          noteBits.push('amphibious')
        } else if (trav.aquaticBreathing === 'underwater') {
          noteBits.push('can breathe underwater')
        } else if (trav.aquaticBreathing === 'water_only') {
          noteBits.push('can only breathe underwater')
        } else if (trav.aquaticBreathing === 'hold_breath') {
          noteBits.push(`can hold breath for ${trav.holdBreathDuration?.trim() || '1 hour'}`)
        }
      }
      if (s.note && s.note.trim()) {
        noteBits.push(s.note.trim())
      }
      const note = noteBits.length > 0 ? ` (${noteBits.join(', ')})` : ''
      const type =
        s.type != null && s.type.toLowerCase() === 'walk' ? '' : `${s.type} `
      return `${capitalize(type)}${s.speed} ft.${note}`
    })

    if (trav?.trackingSpeed && trav.trackingSpeed > 0) {
      parts.push(`tracking ${trav.trackingSpeed} ft.`)
    }
    if (trav?.stealthSpeed && trav.stealthSpeed > 0) {
      parts.push(`stealth ${trav.stealthSpeed} ft.`)
    }
    if (trav?.bonusActionSpeed && trav.bonusActionSpeed > 0) {
      parts.push(`bonus action speed ${trav.bonusActionSpeed} ft.`)
    }
    return parts
  })

  const speedRiderBadges = computed(() => {
    const trav = monster.speedTraversal
    const authored = basicRiderText('speed').map(escapeHtml)
    if (!trav) return authored
    const riders: string[] = []

    const sanitizeRiderText = (txt: string) => cleanPunctuation(formatDistanceUnit(txt.replace(/(?<!\bft)\.+$/i, '').trim()))
    if (trav.bonusActionDash) {
      riders.push(trav.dashRider?.trim() ? `Dash: ${sanitizeRiderText(trav.dashRider)}` : 'Bonus Action Dash')
    }
    if (trav.bonusActionDodge) {
      riders.push(trav.dodgeRider?.trim() ? `Dodge: ${sanitizeRiderText(trav.dodgeRider)}` : 'Bonus Action Dodge')
    }
    if (trav.bonusActionDisengage) {
      riders.push(trav.disengageRider?.trim() ? `Disengage: ${sanitizeRiderText(trav.disengageRider)}` : 'Bonus Action Disengage')
    }
    if ((trav as any).bonusActionHide) {
      riders.push((trav as any).hideRider?.trim() ? `Hide: ${(trav as any).hideRider.trim()}` : 'Bonus Action Hide')
    }
    if (Array.isArray(trav.actionRiders) && trav.actionRiders.length > 0) {
      for (const rider of trav.actionRiders) {
        const formatted = formatSpeedActionRider(rider)
        if (formatted) riders.push(formatted)
      }
    }
    if (trav.amorphous1Inch) {
      riders.push('Amorphous: Move through 1-inch spaces without squeezing')
    }
    if (trav.amorphousCannotEnterLiquids) {
      riders.push("Amorphous: Can't enter liquid bodies")
    }
    if (trav.moveThroughCreaturesDifficultTerrain) {
      if (trav.moveThroughCreaturesShunt) {
        if (trav.shuntDestination === 'ethereal_plane') {
          riders.push('Move through creature spaces as difficult terrain (shunts creature to Ethereal Plane)')
        } else {
          const dmg = trav.moveThroughCreaturesShuntDamage?.trim() || '1d10 force'
          riders.push(`Move through creature spaces as difficult terrain (shunts to adjacent space dealing ${dmg} damage)`)
        }
      } else {
        riders.push('Move through creature spaces as difficult terrain')
      }
    }
    if (trav.moveThroughCreaturesTwoSizesDifferent) {
      riders.push('Move through spaces of creatures 2 sizes different')
    }
    if (trav.ignoresDifficultTerrain) {
      riders.push('Ignores difficult terrain')
    }
    if (trav.etherealJaunt && trav.etherealJaunt !== 'none') {
      if (trav.etherealJaunt === 'bonus_action') {
        riders.push('Ethereal Jaunt (Bonus Action: shift to/from Ethereal Plane)')
      } else if (trav.etherealJaunt === 'action') {
        riders.push('Ethereal Jaunt (Action: shift to/from Ethereal Plane)')
      } else if (trav.etherealJaunt === 'at_will') {
        riders.push('Ethereal Jaunt (shift to/from Ethereal Plane at will)')
      }
    }
    if (trav.note && trav.note.trim()) {
      riders.push(trav.note.trim())
    }
    return [...riders, ...authored]
  })

  const speedBadges = computed(() => {
    return [...speedBaseBadges.value, ...speedRiderBadges.value]
  })

  // skills renderer
  const skills = computed(() => {
    const monsterSkills = monster.skills
      .filter((s) => {
        // hide initiative from skills list in the 2024 block
        if (editorStore.style === '2024' && s.key === 'INITIATIVE') {
          return false
        }

        return true
      })
      .map((s) => {
        const bonusStr = s.override
          ? renderBonus(s.overrideValue)
          : renderBonus(bonusForSkill(monster, s))
        const cond = s.condition?.trim() || s.conditional?.trim() || ''
        return advHtml(`${t(`skill.${s.key}`)} ${numHtml(bonusStr)}${condHtml(cond)}`, s.advantage, s.disadvantage)
      })

    return monsterSkills.join(', ')
  })

  // tools renderer
  const tools = computed(() => {
    if (!Array.isArray(monster.tools) || monster.tools.length === 0) return ''
    return monster.tools
      .map((t) => {
        const statMod = statModifier(monster.stats[t.stat] ?? 10)
        const bonus = t.override
          ? t.overrideValue
          : statMod + (t.proficient ? monster.proficiency : 0) + (t.expertise ? monster.proficiency : 0)
        const bonusStr = renderBonus(bonus)
        return advHtml(`${escapeHtml(t.name)} ${numHtml(bonusStr)}${condHtml(t.condition)}`, t.advantage, t.disadvantage)
      })
      .join(', ')
  })

  const resistances = computed(() => {
    if (Array.isArray(monster.resistancesList) && monster.resistancesList.length > 0) {
      return formatDefenseList(monster.resistancesList)
    }
    return monster.resistances?.join(', ') ?? ''
  })

  const conditionResistances = computed(() => {
    if (Array.isArray(monster.conditionResistancesList) && monster.conditionResistancesList.length > 0) {
      return formatDefenseList(monster.conditionResistancesList)
    }
    return ''
  })

  const immunities = computed(() => {
    if (Array.isArray(monster.immunitiesList) && monster.immunitiesList.length > 0) {
      return formatDefenseList(monster.immunitiesList)
    }
    return monster.immunities?.join(', ') ?? ''
  })

  const vulnerabilities = computed(() => {
    if (Array.isArray(monster.vulnerabilitiesList) && monster.vulnerabilitiesList.length > 0) {
      return formatDefenseList(monster.vulnerabilitiesList)
    }
    return monster.vulnerabilities?.join(', ') ?? ''
  })

  const conditionVulnerabilities = computed(() => {
    if (Array.isArray(monster.conditionVulnerabilitiesList) && monster.conditionVulnerabilitiesList.length > 0) {
      return formatDefenseList(monster.conditionVulnerabilitiesList)
    }
    return ''
  })

  const conditions = computed(() => {
    if (Array.isArray(monster.conditionsList) && monster.conditionsList.length > 0) {
      return formatDefenseList(monster.conditionsList)
    }
    return monster.conditions?.join(', ') ?? ''
  })

  const immunitiesAndConditions = computed(() => {
    const imm = immunities.value
    const cond = conditions.value
    if (imm && cond) return `${imm}; ${cond}`
    return imm || cond
  })

  const cascadingDefenses = computed(() => {
    // Each entry keeps plain text (sorting, verbosity) and HTML (adv/disadv grammar).
    type DefenseEntry = { text: string; html: string }
    const getItems = (list: any[] | undefined, fallback: string[] | undefined): DefenseEntry[] => {
      if (Array.isArray(list) && list.length > 0) {
        const advList: { name: string; item: any }[] = []
        const disadvList: { name: string; item: any }[] = []

        for (const item of list) {
          if (!item) continue
          const mode = item?.mode || (item?.absorbs ? 'absorbs' : item?.advantage ? 'advantage' : item?.disadvantage ? 'disadvantage' : 'none')
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
            const plain = formatDefenseItem({ ...item, mode: 'none', advantage: false, disadvantage: false, absorbs: false })
            if (plain) advList.push({ name: plain, item })
          } else if (!hasComplex && mode === 'disadvantage') {
            const plain = formatDefenseItem({ ...item, mode: 'none', advantage: false, disadvantage: false, absorbs: false })
            if (plain) disadvList.push({ name: plain, item })
          }
        }

        const entries: DefenseEntry[] = []
        let advHandled = false
        let disadvHandled = false

        for (const item of list) {
          if (!item) continue
          const mode = item?.mode || (item?.absorbs ? 'absorbs' : item?.advantage ? 'advantage' : item?.disadvantage ? 'disadvantage' : 'none')
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
            if (advList.length > 1) {
              if (!advHandled) {
                const joined = advList.map((x) => x.name).join(', ')
                entries.push({
                  text: `(${joined} (Advantage))`,
                  html: `(${advHtml(escapeHtml(joined), true, false, `Advantage on saving throws against ${joined}`)})`,
                })
                advHandled = true
              }
              continue
            }
            const plain = formatDefenseItem({ ...item, mode: 'none', advantage: false, disadvantage: false, absorbs: false })
            if (!plain) continue
            entries.push({
              text: `${plain} (Advantage)`,
              html: advHtml(escapeHtml(plain), true, false, `Advantage on saving throws against ${plain}`),
            })
            continue
          }

          if (!hasComplex && mode === 'disadvantage') {
            if (disadvList.length > 1) {
              if (!disadvHandled) {
                const joined = disadvList.map((x) => x.name).join(', ')
                entries.push({
                  text: `(${joined} (Disadvantage))`,
                  html: `(${advHtml(escapeHtml(joined), false, true, `Disadvantage on saving throws against ${joined}`)})`,
                })
                disadvHandled = true
              }
              continue
            }
            const plain = formatDefenseItem({ ...item, mode: 'none', advantage: false, disadvantage: false, absorbs: false })
            if (!plain) continue
            entries.push({
              text: `${plain} (Disadvantage)`,
              html: advHtml(escapeHtml(plain), false, true, `Disadvantage on saving throws against ${plain}`),
            })
            continue
          }

          const text = formatDefenseItem(item)
          if (text) entries.push({ text, html: escapeHtml(text) })
        }

        return entries
      }
      if (Array.isArray(fallback) && fallback.length > 0) {
        return fallback
          .map((s) => String(s).trim())
          .filter(Boolean)
          .map((text) => ({ text, html: escapeHtml(text) }))
      }
      return []
    }

    const vulnDamages = getItems(monster.vulnerabilitiesList, monster.vulnerabilities)
    const vulnConditions = getItems(monster.conditionVulnerabilitiesList, [])
    const resDamages = getItems(monster.resistancesList, monster.resistances)
    const resConditions = getItems(monster.conditionResistancesList, [])
    const immDamages = getItems(monster.immunitiesList, monster.immunities)
    const immConditions = getItems(monster.conditionsList, monster.conditions)

    const buildUnifiedSection = (
      key: string,
      scopeLabel: string,
      damageList: DefenseEntry[],
      conditionList: DefenseEntry[],
      forceSplit = false
    ) => {
      if (damageList.length === 0 && conditionList.length === 0) return []

      // Concise items first, verbose items (conditions, bypasses, parentheses) last
      const isVerboseItem = (s: string) => s.includes('(') || s.includes('that ') || s.includes('from ') || s.includes(';')
      const sortVerboseLast = (items: DefenseEntry[]) =>
        [...items].sort((a, b) => {
          const av = isVerboseItem(a.text)
          const bv = isVerboseItem(b.text)
          if (av !== bv) return av ? 1 : -1
          return a.text.length - b.text.length
        })

      // Preserve authored order unless explicitly configured to auto-sort
      const finalDamages = monster.autoSortDefenses ? sortVerboseLast(damageList) : damageList
      const finalConditions = monster.autoSortDefenses ? sortVerboseLast(conditionList) : conditionList
      const join = (items: DefenseEntry[], field: 'text' | 'html') => items.map((i) => i[field]).join(', ')
      const compose = (field: 'text' | 'html') =>
        finalDamages.length > 0 && finalConditions.length > 0
          ? `${join(finalDamages, field)}; ${join(finalConditions, field)}`
          : finalDamages.length > 0
          ? join(finalDamages, field)
          : join(finalConditions, field)

      const formattedText = compose('text')
      const isVerbose = formattedText.length > 60 || finalDamages.length + finalConditions.length >= 4

      // Dedicated row splitting per category (or smart auto-split on line overflow)
      const shouldSplit = forceSplit || (Boolean(monster.autoSplitDefenses) && isVerbose)

      if (shouldSplit && finalDamages.length > 0 && finalConditions.length > 0) {
        const rows: any[] = []
        rows.push({
          key: `${key}_damage`,
          title: `${scopeLabel} (Damage)`,
          scopeLabel,
          subTypeLabel: '',
          damageItems: finalDamages.map((i) => i.text),
          conditionItems: [],
          items: finalDamages.map((i) => i.text),
          formattedText: join(finalDamages, 'text'),
          formattedProse: join(finalDamages, 'html'),
          isVerbose: join(finalDamages, 'text').length > 60,
        })
        rows.push({
          key: `${key}_condition`,
          title: `Condition ${scopeLabel}`,
          scopeLabel: `Condition ${scopeLabel}`,
          subTypeLabel: '',
          damageItems: [],
          conditionItems: finalConditions.map((i) => i.text),
          items: finalConditions.map((i) => i.text),
          formattedText: join(finalConditions, 'text'),
          formattedProse: join(finalConditions, 'html'),
          isVerbose: join(finalConditions, 'text').length > 60,
        })
        return rows
      }

      return [{
        key,
        title: scopeLabel,
        scopeLabel,
        subTypeLabel: '',
        damageItems: finalDamages.map((i) => i.text),
        conditionItems: finalConditions.map((i) => i.text),
        items: [...finalDamages, ...finalConditions].map((i) => i.text),
        formattedText,
        formattedProse: compose('html'),
        isVerbose,
      }]
    }

    const categoryOrder = Array.isArray((monster as any).defenseCategoryOrder) && (monster as any).defenseCategoryOrder.length === 3
      ? (monster as any).defenseCategoryOrder
      : ['vulnerabilities', 'resistances', 'immunities']

    const sections: any[] = []
    for (const cat of categoryOrder) {
      if (cat === 'vulnerabilities') {
        const splitVuln = Boolean(monster.splitVulnRows || (monster as any).splitDefenseRows?.vulnerabilities)
        sections.push(...buildUnifiedSection('vulnerabilities', 'Vulnerabilities', vulnDamages, vulnConditions, splitVuln))
      } else if (cat === 'resistances') {
        const splitRes = Boolean(monster.splitResRows || (monster as any).splitDefenseRows?.resistances)
        sections.push(...buildUnifiedSection('resistances', 'Resistances', resDamages, resConditions, splitRes))
      } else if (cat === 'immunities') {
        const splitImm = Boolean(monster.splitImmRows || (monster as any).splitDefenseRows?.immunities)
        sections.push(...buildUnifiedSection('immunities', 'Immunities', immDamages, immConditions, splitImm))
      }
    }

    return sections
  })

  // Search / Study / Influence / Hide rows, then leftover Skills and Tools rows.
  // Grouping rules live in src/core/domain/skill-action-groups.ts.
  const skillLabel = (key: string, fallback?: string): string => {
    const path = `skill.${key}`
    const label = t(path)
    return label === path ? fallback || key : label
  }

  const formatCheckEntry = (entry: SkillCheckEntry, labels: string[]): string => {
    const inner = `${numHtml(`${entry.passive}/${renderBonus(entry.bonus)}`)}, ${labels.map(escapeHtml).join(', ')}${condHtml(entry.condition)}`
    return `<span class="dnd-check">${advHtml(inner, entry.advantage, entry.disadvantage)}</span>`
  }

  const formatGroupRow = (row: SkillGroupRow): string => {
    const parts = mergeIdenticalEntries(row.entries).map(({ entry, labels }) => formatCheckEntry(entry, labels))
    const base = row.base ? numHtml(row.base.passive + '/' + renderBonus(row.base.bonus)) : ''
    const baseLabels = row.baseSkillKeys?.map(key => escapeHtml(skillLabel(key))) ?? []
    const groups = [...(base ? [[base, ...baseLabels].join(', ')] : []), ...parts]
    const content = groups.length > 1 || baseLabels.length ? groups.map(group => '(' + group + ')').join(', ') : groups.join('')
    return options.web === false ? mechanicPlainText(content) : content
  }

  const combatSkillRows = computed(() => {
    const aop = monster.actionOrientedPassives as Record<string, any> | undefined
    const editorPassives = (monster as any).passives as Record<string, any> | undefined
    const passiveCfg = (key: string) => {
      const cfgKey = passiveConfigKey(key)
      return editorPassives?.[cfgKey] ?? editorPassives?.[cfgKey.toLowerCase()]
    }
    const sharedCondition = (key: string): string => {
      const cfgKey = passiveConfigKey(key)
      const raw = aop?.conditions?.[cfgKey] ?? aop?.conditions?.[cfgKey.toLowerCase()]
      return typeof raw === 'string' ? raw.trim() : ''
    }
    const statOf = (key: string): DndStat => ((SKILL as any)[key]?.stat as DndStat) ?? 'INT'
    const passivePerceptionOverride = (key: string): number | null =>
      key === 'PERCEPTION' && monster.passivePerception?.override && monster.passivePerception.overrideValue != null
        ? Number(monster.passivePerception.overrideValue)
        : null

    const inputs: SkillCheckInput[] = []
    const seen = new Set<string>()

    // 1. Skills the creature has (proficiency, expertise, overrides, advantage)
    for (const sk of monster.skills ?? []) {
      const key = normalizeSkillKey(sk.key)
      if (!key || key === 'INITIATIVE' || seen.has(key)) continue
      seen.add(key)
      const cfg = passiveCfg(key)
      inputs.push({
        key,
        label: skillLabel(sk.key, sk.skill?.label),
        stat: (sk.skill?.stat as DndStat) ?? statOf(key),
        bonus: bonusForSkill(monster, sk),
        advantage: Boolean(sk.advantage || cfg?.advantage),
        disadvantage: Boolean(sk.disadvantage || cfg?.disadvantage),
        condition: sk.condition?.trim() || sk.conditional?.trim() || cfg?.condition?.trim() || sharedCondition(key),
        bonusAction: typeof sk.bonusAction === 'boolean' ? sk.bonusAction : undefined,
        passiveOverride: cfg?.override && cfg.overrideValue != null ? Number(cfg.overrideValue) : passivePerceptionOverride(key),
      })
    }

    // 2. Untrained skills that only carry passive tweaks from the Skills editor
    for (const group of SKILL_ACTION_GROUPS) {
      for (const key of group.skills) {
        if (seen.has(key)) continue
        const cfg = passiveCfg(key)
        const condition = cfg?.condition?.trim() || sharedCondition(key)
        const override = cfg?.override && cfg.overrideValue != null ? Number(cfg.overrideValue) : passivePerceptionOverride(key)
        if (!cfg?.advantage && !cfg?.disadvantage && !condition && override == null) continue
        seen.add(key)
        const stat = statOf(key)
        inputs.push({
          key,
          label: skillLabel(key),
          stat,
          bonus: statModifier(monster.stats?.[stat] ?? 10),
          advantage: Boolean(cfg?.advantage),
          disadvantage: Boolean(cfg?.disadvantage),
          condition,
          passiveOverride: override,
        })
      }
    }

    const groupType = (flag: unknown, editorType: unknown): SkillActionType =>
      flag || editorType === 'Bonus Action' ? 'Bonus Action' : 'Action'
    const rows = computeSkillGroupLayout({
      stats: monster.stats,
      skills: inputs,
      groupActionTypes: {
        search: groupType(aop?.bonusActionSearch, editorPassives?.searchActionType),
        study: groupType(aop?.bonusActionStudy, editorPassives?.studyActionType),
        influence: groupType(aop?.bonusActionInfluence, editorPassives?.influenceActionType),
        hide: groupType(aop?.bonusActionHide, editorPassives?.hideActionType),
      },
    })

    return rows
  })

  const actionPassivesGroups = computed(() => {
    const aop = monster.actionOrientedPassives as Record<string, any> | undefined
    const editorPassives = (monster as any).passives as Record<string, any> | undefined
    const rows = combatSkillRows.value
    const placementFor = (groupId: CombatSkillGroupId, actionType: SkillActionType = 'Action') =>
      skillGroupPlacement(groupId, actionType, editorPassives, aop, monster as unknown as Record<string, unknown>)

    const groups: {
      name: string
      scopeLabel: string
      subTypeLabel: string
      skills: string
      badges: string[]
      tip: string
    }[] = rows
      .filter((row) => placementFor(row.id, row.actionType) === 'header')
      .map((row) => {
        const html = formatGroupRow(row)
        return {
          name: `${row.label}${row.actionType === 'Bonus Action' ? ' (Bonus Action)' : ''}`,
          scopeLabel: row.label,
          subTypeLabel: row.actionType,
          skills: html,
          badges: [html],
          tip: row.tip,
        }
      })

    // Tools: same entry grammar as skills ("13, +3 Calligrapher's Supplies")
    if (placementFor('tools') === 'header' && Array.isArray(monster.tools) && monster.tools.length > 0) {
      const defaultToolAction = editorPassives?.toolsActionType === 'Bonus Action' || aop?.bonusActionTools || (monster as any).toolsActionType === 'Bonus Action' ? 'Bonus Action' : 'Action'
      for (const actionType of ['Action', 'Bonus Action'] as SkillActionType[]) {
        const entries = monster.tools
          .filter((tool) => (typeof tool.bonusAction === 'boolean' ? (tool.bonusAction ? 'Bonus Action' : 'Action') : defaultToolAction) === actionType)
          .map((tool) => {
            const bonus = tool.override
              ? tool.overrideValue
              : statModifier(monster.stats[tool.stat] ?? 10) +
                (tool.proficient ? monster.proficiency : 0) +
                (tool.expertise ? monster.proficiency : 0)
            const mode = effectiveAdvantage(tool.advantage, tool.disadvantage)
            const entry: SkillCheckEntry = {
              key: tool.id,
              label: tool.name,
              stat: tool.stat,
              passive: passiveScore(bonus, tool.advantage, tool.disadvantage),
              bonus,
              advantage: mode === 'advantage',
              disadvantage: mode === 'disadvantage',
              condition: tool.condition?.trim() ?? '',
            }
            return formatCheckEntry(entry, [tool.name])
          })
        if (entries.length > 0) {
          const html = entries.join('; ')
          groups.push({
            name: `Tools (${actionType})`,
            scopeLabel: 'Tools',
            subTypeLabel: actionType,
            skills: html,
            badges: [html],
            tip: 'Tool checks: passive score, then bonus.',
          })
        }
      }
    }

    return groups
  })

  // plain-text form for the Markdown / Homebrewery exports
  const actionPassives = computed(() => {
    return actionPassivesGroups.value
      .map((g) => `${g.name}: ${htmlToText(g.skills)}`)
      .join('; ')
  })

  const formatSingleSenseItem = (item: any, omitScope = false): string => {
    if (item.name?.trim().toLowerCase() === 'detect magic') return 'Can cast Detect Magic (V,S,R) At Will'
    const rangeUnit = item.rangeUnit || 'ft'
    const rangeStr = (!omitScope && item.range != null && item.range > 0) ? `${formattedNumeric(`sensesList[id=${encodeURIComponent(item.id)}].range`, item.range)} ${rangeUnit === 'ft' ? 'ft.' : rangeUnit}` : ''
    const notes: string[] = []

    // Universal modifiers
    if (item.blindBeyond) notes.push('blind beyond it')
    if (item.acrossPlanes && !omitScope) notes.push('across Material and Ethereal planes')

    // Sense-specific modifiers
    if (item.echolocation) notes.push("can't while deafened")
    if (item.devilsSight) notes.push(omitScope ? 'ignores Magical Darkness' : 'ignore Magical Darkness')
    if (item.lightImpairment && item.lightImpairment !== 'none') {
      if (item.lightImpairment === 'bright_light') notes.push('Blind on Bright Light')
      else if (item.lightImpairment === 'daylight') notes.push('Blind on Daylight')
      else if (item.lightImpairment === 'dim_and_bright') notes.push('Blind on Dim and Bright Light')
    }

    // Gathered Info & Observation Clause
    const infoList = Array.isArray(item.perceivedStats) && item.perceivedStats.length > 0
      ? item.perceivedStats
      : Array.isArray(item.gatheredInfo)
      ? item.gatheredInfo
      : []
    if (infoList.length > 0) {
      const precisionStr = item.perceptionPrecision === 'comparative'
        ? 'comparative (superior/inferior to itself)'
        : 'exact'
      const joinedInfo = infoList.length === 1
        ? infoList[0]
        : infoList.length === 2
        ? `${infoList[0]} and ${infoList[1]}`
        : `${infoList.slice(0, -1).join(', ')}, and ${infoList[infoList.length - 1]}`
      let obsStr = ''
      if (item.observationRequirement && item.observationRequirement !== 'none') {
        const mins = item.observationMinutes ?? 1
        const mode = item.observationRequirement === 'both' ? 'observing or fighting' : item.observationRequirement
        obsStr = ` after ${formattedNumeric(`sensesList[id=${encodeURIComponent(item.id)}].observationMinutes`, mins)} min${mins === 1 ? '' : 's'} of ${mode}`
      }
      const studyStr = item.requiresStudyAction ? ' (requires Study action)' : ''
      notes.push(`learns ${precisionStr} ${joinedInfo}${obsStr}${studyStr}`)
    }

    const formatDetectionMode = (mode?: string): string => {
      if (mode === 'both') return 'location and presence'
      if (mode === 'all') return 'location, presence, and identity'
      if (mode === 'identity') return 'identity (specific creature)'
      return mode || 'location'
    }

    const lowerName = (item.name || '').toLowerCase()
    if (lowerName === 'sense sentience') {
      const mode = item.senseSentienceMode || 'location_intelligent'
      let modeStr = 'location of Intelligent creatures'
      if (mode === 'presence_intelligent') modeStr = 'presence of Intelligent creatures'
      else if (mode === 'telepathy_creatures') modeStr = 'of creatures it can use its Telepathy'
      return `sense sentience (${rangeStr || '60 ft.'}, ${modeStr}${notes.length > 0 ? `, ${notes.join(', ')}` : ''})`
    }
    if (lowerName === 'darkvision') {
      if (omitScope) {
        return `darkvision${notes.length > 0 ? ` (${notes.join(', ')})` : ''}`
      }
      return `darkvision (${rangeStr || '60 ft.'}${notes.length > 0 ? `, ${notes.join(', ')}` : ''})`
    }
    if (lowerName === 'blindsight' || lowerName === 'blindsense' || lowerName === 'echolocation') {
      if (lowerName === 'echolocation' && !notes.includes("can't while deafened")) {
        notes.unshift("can't while deafened")
      }
      if (omitScope) {
        return `blindsight${notes.length > 0 ? ` (${notes.join(', ')})` : ''}`
      }
      return `blindsight (${rangeStr || '60 ft.'}${notes.length > 0 ? `, ${notes.join(', ')}` : ''})`
    }
    if (lowerName === 'life sense') {
      const modeStr = formatDetectionMode(item.detectionMode || 'presence')
      const targets = item.targetCreatureTypes && item.targetCreatureTypes.length > 0
        ? item.targetCreatureTypes.join(', ')
        : 'living creatures'
      if (omitScope) {
        return `${modeStr} of ${targets}${notes.length > 0 ? `, ${notes.join(', ')}` : ''}`
      }
      return `life sense (${modeStr} of ${targets}, within ${rangeStr || '5 miles'}${notes.length > 0 ? `, ${notes.join(', ')}` : ''})`
    }
    if (lowerName === 'divine sense') {
      const modeStr = formatDetectionMode(item.detectionMode || 'location')
      const targets = item.targetCreatureTypes && item.targetCreatureTypes.length > 0
        ? item.targetCreatureTypes.join(', ')
        : 'celestials, fiends, and undead'
      if (omitScope) {
        return `${modeStr} of ${targets}${notes.length > 0 ? `, ${notes.join(', ')}` : ''}`
      }
      return `divine sense (${modeStr} of ${targets}, within ${rangeStr || '60 ft.'}${notes.length > 0 ? `, ${notes.join(', ')}` : ''})`
    }

    if (item.webSense) notes.push('while touching web, knows location of creatures on same web')
    if (item.note && item.note.trim()) {
      notes.push(item.note.trim())
    }

    if (notes.length > 0) {
      return `${lowerName} (${rangeStr ? `${rangeStr}, ` : ''}${notes.join(', ')})`
    }
    if (lowerName === 'ethereal sight') {
      return `${lowerName} (${rangeStr || '60 ft.'})`
    }
    if (rangeStr) {
      return `${lowerName} ${rangeStr}`
    }
    return lowerName
  }

  const sensesBadges = computed(() => {
    const items: string[] = []
    if (Array.isArray(monster.sensesList) && monster.sensesList.length > 0) {
      const planarGroup: any[] = []
      const nonPlanar: any[] = []

      for (const item of monster.sensesList) {
        if (item.acrossPlanes && item.range != null && item.range > 0) {
          planarGroup.push(item)
        } else {
          nonPlanar.push(item)
        }
      }

      if (planarGroup.length > 1) {
        const rangeUnit = planarGroup[0].rangeUnit || 'ft'
        const range = planarGroup[0].range
        const allSameRange = planarGroup.every((it) => it.range === range && (it.rangeUnit || 'ft') === rangeUnit && !monster.bindings?.[`sensesList[id=${encodeURIComponent(it.id)}].range`]?.presentation)
        if (allSameRange) {
          const rangeStr = `${range} ${rangeUnit === 'ft' ? 'ft.' : rangeUnit}`
          const commonPrefix = `${rangeStr} across Material and Ethereal Planes`
          const parts = planarGroup.map((item) => formatSingleSenseItem(item, true)).filter(Boolean)
          items.push(`${commonPrefix}: ${parts.join(', ')}`)
          nonPlanar.forEach((item) => {
            const formatted = formatSingleSenseItem(item, false)
            if (formatted) items.push(formatted)
          })
        } else {
          monster.sensesList.forEach((item) => {
            const formatted = formatSingleSenseItem(item, false)
            if (formatted) items.push(formatted)
          })
        }
      } else {
        monster.sensesList.forEach((item) => {
          const formatted = formatSingleSenseItem(item, false)
          if (formatted) items.push(formatted)
        })
      }
    } else {
      Object.entries(monster.senses).forEach(([k, v]) => {
        if (v > 0) items.push(`${k} ${v} ft.`)
      })
    }
    if (monster.sensesNotes && monster.sensesNotes.trim() !== '') {
      items.push(processTokens(monster.sensesNotes, undefined, monster, 'none'))
    }
    return [...items, ...basicRiderText('senses')]
  })

  const senses = computed(() => {
    return sensesBadges.value.map((s) => formatDistanceUnit(s)).join(', ')
  })

  const baseLanguagesBadges = computed(() => {
    const badges: string[] = []
    if (monster.specialCommunicationArchetype && monster.specialCommunicationArchetype !== 'none') {
      const archOnly = formatLanguagesList([], monster.specialCommunicationArchetype)
      if (archOnly) badges.push(archOnly)
    }
    if (Array.isArray(monster.languagesList) && monster.languagesList.length > 0) {
      for (const item of monster.languagesList) {
        const formatted = formatLanguageItem(item, (field, value) => formattedNumeric(`languagesList[id=${encodeURIComponent(item.id)}].${field}`, value))
        if (formatted) badges.push(formatted)
      }
      return badges
    }
    if (badges.length > 0) return badges
    if (monster.languages && monster.languages.trim() && monster.languages.trim() !== '—') {
      return monster.languages.split(/[,;]\s*/).map((s) => s.trim()).filter(Boolean)
    }
    return []
  })

  const languagesBadges = computed(() => [...baseLanguagesBadges.value, ...basicRiderText('languages')])

  const baseLanguages = computed(() => {
    if (
      (Array.isArray(monster.languagesList) && monster.languagesList.length > 0) ||
      monster.specialCommunicationArchetype
    ) {
      return formatLanguagesList(monster.languagesList, monster.specialCommunicationArchetype, (item, field, value) => formattedNumeric(`languagesList[id=${encodeURIComponent(item.id)}].${field}`, value))
    }
    return monster.languages ?? ''
  })

  const languages = computed(() => [baseLanguages.value, ...basicRiderText('languages')].filter(Boolean).join('; '))

  const cr = computed(() => {
    if (monster.useCrDisplayOverride) return monster.crOverride ?? ''

    const lair =
      monster.lairCr > -1
        ? t('presets.cr', [
            (CR[monster.lairCr]?.xp ?? 0).toLocaleString('en-US'),
            monster.lairCrNote,
          ])
        : ''

    return `${(CR[monster.CR] || CR[0]).cr} (${(CR[monster.CR] || CR[0]).xp.toLocaleString(
      'en-US'
    )} XP${lair}${
      editorStore.style === '2024' ? `, PB +${monster.proficiency}` : ''
    })`
  })

  const processedTraitsList = computed(() => {
    const list = [...(monster.traits ?? [])]

    // Regeneration & Temporary Hit Points Detailed Trait
    const regen = monster.extendedHp?.regeneration
    const regenAmtStr = regen
      ? resolveDynamicNumericSource(regen.valueSource, regen.amount ?? 10, regen.diceFormula, dynCtx.value)
      : '0'
    if (
      regen?.enabled &&
      regenAmtStr &&
      regenAmtStr !== '0' &&
      (regen.displayMode === 'detailed' || regen.displayMode === 'both')
    ) {
      const amt = regenAmtStr
      const recoveryType = regen.recoveryType || 'regen'
      const isTempHp = recoveryType === 'temp_hp' || recoveryType === 'absorb_temp_hp'
      const traitName = isTempHp
        ? (recoveryType === 'absorb_temp_hp' ? 'Absorbing Vigor' : 'Temporary Hit Points')
        : (recoveryType === 'absorb_hp' ? 'Damage Absorption' : 'Regeneration')

      const disTypes = Array.isArray(regen.disruptedByTypes) && regen.disruptedByTypes.length > 0
        ? regen.disruptedByTypes.join(' or ')
        : (regen.disruptedBy?.trim() || '')
      const note = regen.disruptedByNote ? regen.disruptedByNote.trim() : ''
      const dis = [disTypes, note].filter(Boolean).join(', ')

      let desc = ''
      if (recoveryType === 'absorb_temp_hp') {
        const absorbType = regen.triggeredByDamageType || 'lightning'
        desc = `Whenever the ${monster.name.toLowerCase()} is subjected to ${absorbType} damage, it takes no damage and instead gains a number of temporary hit points equal to ${amt}.`
      } else if (recoveryType === 'absorb_hp') {
        const absorbType = regen.triggeredByDamageType || 'necrotic'
        desc = `Whenever the ${monster.name.toLowerCase()} is subjected to ${absorbType} damage, it takes no damage and instead regains a number of hit points equal to ${amt}.`
      } else if (isTempHp) {
        // Pure temporary hit points gain
        desc = dis
          ? `The ${monster.name.toLowerCase()} gains ${amt} temporary hit points at the start of its turn. If the ${monster.name.toLowerCase()} takes ${dis} damage, this trait doesn't function at the start of its next turn.`
          : `The ${monster.name.toLowerCase()} gains ${amt} temporary hit points at the start of its turn.`
      } else {
        // Pure healing / regeneration
        desc = dis
          ? `The ${monster.name.toLowerCase()} regains ${amt} hit points at the start of its turn. If the ${monster.name.toLowerCase()} takes ${dis} damage, this trait doesn't function at the start of its next turn. The ${monster.name.toLowerCase()} dies only if it starts its turn with 0 hit points and doesn't regenerate.`
          : `The ${monster.name.toLowerCase()} regains ${amt} hit points at the start of its turn if it has at least 1 hit point.`
      }

      if (!list.some((t) => t.name?.trim().toLowerCase() === traitName.toLowerCase())) {
        list.push({
          id: 'auto-regeneration',
          name: traitName,
          description: scheduleDefense('regeneration', desc),
          limitedUse: { count: 0, rate: '' },
          crAnnotation: {
            maxDamage: 0,
            maxSave: 0,
            maxToHit: 0,
            ehpMultiplier: 1,
            ehpModifier: 0,
            acModifier: 0,
          },
        })
      }
    }

    // Death Prevention Detailed Trait (Immortal / Undead Fortitude)
    const dp = monster.extendedHp?.deathPrevention
    if (
      dp?.enabled &&
      (dp.displayMode === 'detailed' || dp.displayMode === 'both')
    ) {
      const traitName = dp.name?.trim() || 'Immortal'
      const ex = Array.isArray(dp.exceptions) && dp.exceptions.length > 0
        ? dp.exceptions.join(' or ')
        : ''
      const note = dp.customNote ? dp.customNote.trim() : ''
      const exceptionsStr = [ex, note].filter(Boolean).join(', ')
      const returnHpVal = resolveDynamicNumericSource(
        dp.returnHpSource || 'flat',
        dp.returnHpAmount ?? 1,
        dp.returnHpDice,
        dynCtx.value
      ) || '1'
      const hpUnit = returnHpVal === '1' ? '1 hit point' : `${returnHpVal} hit points`

      let desc = ''
      if (traitName.toLowerCase() === 'undead fortitude') {
        const disPart = exceptionsStr ? `unless the damage is ${exceptionsStr}` : 'unless the damage is radiant or from a critical hit'
        desc = `If damage reduces the ${monster.name.toLowerCase()} to 0 hit points, it must make a Constitution saving throw with a DC of 5 + the damage taken, ${disPart}. On a success, the ${monster.name.toLowerCase()} drops to ${hpUnit} instead.`
      } else {
        const disPart = exceptionsStr ? `unless the damage is ${exceptionsStr}` : ''
        desc = `If damage reduces the ${monster.name.toLowerCase()} to 0 hit points${disPart ? ` (${disPart})` : ''}, it drops to ${hpUnit} instead.`
      }

      if (!list.some((t) => t.name?.trim().toLowerCase() === traitName.toLowerCase())) {
        list.push({
          id: 'auto-death-prevention',
          name: traitName,
          description: scheduleDefense('deathPrevention', desc),
          limitedUse: { count: 0, rate: '' },
          crAnnotation: {
            maxDamage: 0,
            maxSave: 0,
            maxToHit: 0,
            ehpMultiplier: 1,
            ehpModifier: 0,
            acModifier: 0,
          },
        })
      }
    }

    return list
  })

  const filterByStagePool = <T extends { stagePool?: string | number }>(items: T[]): T[] => {
    const isParagon = Boolean(monster.paragonConfig?.enabled || (monster.paragonConfig?.poolCount && monster.paragonConfig.poolCount > 1))
    if (!isParagon) return items
    const active = monster.paragonConfig?.activePoolFilter
    if (!active || active === 'all') return items
    return items.filter((item) => !item.stagePool || item.stagePool === 'all' || `${item.stagePool}` === `${active}`)
  }

  const traits = computed(() => {
    const list = filterByStagePool(processedTraitsList.value)
    if (monster.alphaTraits) {
      return _.sortBy(list, 'name').map((trait) => processTrait(trait, monster))
    } else {
      return list.map((trait) => processTrait(trait, monster))
    }
  })

  const groupedTraits = computed(() => {
    const standard: string[] = []
    const condMap = new Map<string, string[]>()
    const rechMap = new Map<string, string[]>()

    const sortedList = monster.alphaTraits
      ? _.sortBy(processedTraitsList.value, 'name')
      : processedTraitsList.value

    for (const trait of sortedList) {
      const processed = processTrait(trait, monster)

      if (trait.isConditional && trait.conditionalTrigger?.trim()) {
        const trigger = trait.conditionalTrigger.trim()
        if (!condMap.has(trigger)) {
          condMap.set(trigger, [])
        }
        condMap.get(trigger)!.push(processed)
      } else if (trait.renderInRechargeSection && trait.rechargeSection?.trim()) {
        const sec = trait.rechargeSection.trim()
        if (!rechMap.has(sec)) {
          rechMap.set(sec, [])
        }
        rechMap.get(sec)!.push(processed)
      } else {
        standard.push(processed)
      }
    }

    const conditionals = Array.from(condMap.entries()).map(([trigger, items]) => ({
      trigger,
      traits: items,
    }))

    const rechargeSections = Array.from(rechMap.entries()).map(([section, items]) => ({
      section,
      traits: items,
    }))

    return {
      standard,
      conditionals,
      rechargeSections,
    }
  })

  const castingProjection = computed(() => buildCastingProjection(monster.spellcasting, {
    stats: monster.stats, proficiency: monster.proficiency, save: monster.spellSave, attack: monster.spellAttackModifier,
    edition: editorStore.style === '2014' ? '2014' : '2024', spellLevel: name => castingSpells.allSpells[name]?.level,
  }))
  const classSpellcastingPreamble = computed(() => {
    if (!hasCastingSources(monster.spellcasting)) return ''
    const summary = castingLearningSummary(monster.spellcasting, monster.stats, monster.proficiency)
    const preamble = processClassSpellcasting({ ...monster.spellcasting, level: summary.casterLevel || monster.spellcasting.level }, monster)
    const sc = monster.spellcasting
    if (sc.useCustomClassPreamble) return preamble
    const details = [castingProjection.value.resource, castingProjection.value.prepared, castingProjection.value.consolidatedSummary].filter(Boolean)
    return details.length ? preamble.trimEnd() + ' ' + details.join('. ') + '.' : preamble
  })

  const innateSpellcastingPreamble = computed(() => {
    return processInnateSpellcasting(monster.spellcasting, monster)
  })

  const classSpellcastingWarlockLabel = computed(() => {
    // find the highest level slot and note the quantity
    // this is such a weird way to write this
    const slots = monster.spellcasting?.slots || []
    for (let idx = 8; idx >= 0; idx--) {
      if (slots[idx] > 0) {
        return t('editor.spellcasting.slot.warlockSlots', [
          safeToOrdinal(1),
          safeToOrdinal(idx + 1),
          slots[idx],
          safeToOrdinal(idx + 1),
        ])
      }
    }

    return ''
  })

  const classSpellcastingSlots = computed(() => {
    const rows = castingProjection.value.levels
    const groups = monster.spellcasting.splitHighCadence
      ? [false, true].flatMap(restricted => rows.map(row => ({
          ...row, heading: restricted ? 'Restricted ' + row.heading : row.heading,
          spells: row.spells.filter(spell => Boolean(spell.restricted) === restricted),
        })).filter(row => row.spells.length))
      : rows
    return groups.map(row => ({
      level: row.level, slots: row.amount || 0, spells: row.spells.map(spell => spell.name),
      renderedLabel: row.heading,
      renderedSpells: row.spells.map(spell => spell.lead + spell.name + (spell.castingTime ? ' (' + spell.castingTime + ')' : '') + (spell.actionLabel ? ' ' + spell.actionLabel : '')).join(', '),
    }))
  })

  const innateSpellcastingLists = computed(() => {
    return monster.spellcasting.atWill.map((s) => {
      return {
        ...s,
        renderedLabel:
          s.rate === 'AT_WILL'
            ? t('recharge.AT_WILL')
            : `${s.count}/${t(`recharge.${s.rate}`)}`,
        renderedSpells: s.spells.join(', '),
      }
    })
  })

  const attacks = computed(() => {
    return filterByStagePool(monster.attacks.filter((a) => !a.legendaryOnly)).map((a) => processAttack(a, monster))
  })

  const relocatedCombatActions = (targetPlacement: 'action' | 'bonus_action' | 'legendary'): string[] => {
    const aop = monster.actionOrientedPassives as Record<string, any> | undefined
    const editorPassives = (monster as any).passives as Record<string, any> | undefined
    const placementFor = (groupId: CombatSkillGroupId, actionType: SkillActionType = 'Action') =>
      skillGroupPlacement(groupId, actionType, editorPassives, aop, monster as unknown as Record<string, unknown>)
    const rows = combatSkillRows.value
    const actionResults = rows
      .filter((row) => placementFor(row.id, row.actionType) === targetPlacement)
      .map((row) => {
        const name = targetPlacement === 'legendary' ? `${row.label} (Costs 1 Action)` : row.label
        const scores = formatGroupRow(row)
        const rider = (aop?.riders?.[row.id] ?? (editorPassives?.riders as any)?.[row.id] ?? '').trim()
        const formattedScores = scores.startsWith('(') ? scores : `(${scores})`
        if (options.web !== false) {
          return buildPlateEntry(monster, { name, scores: formattedScores }, rider)
        }
        return `<b><i>${name} ${formattedScores}.</i></b>${rider ? ` ${rider}` : ''}`
      })

    // Tools relocation
    const defaultToolAction: SkillActionType = editorPassives?.toolsActionType === 'Bonus Action' || aop?.bonusActionTools || (monster as any).toolsActionType === 'Bonus Action' ? 'Bonus Action' : 'Action'
    const tools = (Array.isArray(monster.tools) ? monster.tools : []).filter(tool => {
      const actionType = typeof tool.bonusAction === 'boolean' ? (tool.bonusAction ? 'Bonus Action' : 'Action') : defaultToolAction
      return placementFor('tools', actionType) === targetPlacement
    })
    if (tools.length > 0) {
      const toolEntries = tools.map((tool) => {
        const bonus = tool.override
          ? tool.overrideValue
          : statModifier(monster.stats[tool.stat] ?? 10) +
            (tool.proficient ? monster.proficiency : 0) +
            (tool.expertise ? monster.proficiency : 0)
        const mode = effectiveAdvantage(tool.advantage, tool.disadvantage)
        const entry: SkillCheckEntry = {
          key: tool.id,
          label: tool.name,
          stat: tool.stat,
          passive: passiveScore(bonus, tool.advantage, tool.disadvantage),
          bonus,
          advantage: mode === 'advantage',
          disadvantage: mode === 'disadvantage',
          condition: tool.condition?.trim() ?? '',
        }
        return formatCheckEntry(entry, [tool.name])
      })
      if (toolEntries.length > 0) {
        const label = targetPlacement === 'legendary' ? 'Use Tool (Costs 1 Action)' : 'Use Tool'
        const scores = toolEntries.join('; ')
        const formattedScores = `(${scores})`
        const rider = (aop?.riders?.['tools'] ?? (editorPassives?.riders as any)?.['tools'] ?? '').trim()
        if (options.web !== false) {
          actionResults.push(buildPlateEntry(monster, { name: label, scores: formattedScores }, rider))
        } else {
          actionResults.push(`<b><i>${label} ${formattedScores}.</i></b>${rider ? ` ${rider}` : ''}`)
        }
      }
    }
    return actionResults
  }

  // non-legendary only actions
  const actions = computed(() => {
    const base = filterByStagePool(
      monster.actions.filter((a) => !a.legendaryOnly && !a.bonusAction)
    ).map((a) => processAction(a, monster))
    return [...relocatedCombatActions('action'), ...base]
  })

  const bonusActions = computed(() => {
    const base = filterByStagePool(
      monster.actions.filter((a) => !a.legendaryOnly && a.bonusAction)
    ).map((a) => processAction(a, monster))
    return [...relocatedCombatActions('bonus_action'), ...base]
  })

  const multiattacks = computed(() =>
    processMultiattack(monster.multiattacks, monster)
  )

  const legendaryPreamble = computed(() =>
    processLegendaryPreamble(monster.legendaryActions, monster)
  )

  const legendaryActions = computed(() => {
    const base = monster.legendaryActions.actions.map((a) =>
      processLegendaryAction(a.actionId, a.cost, monster)
    )
    return [...relocatedCombatActions('legendary'), ...base]
  })

  const mythicTrait = computed(() =>
    processMythicActionTrait(monster.mythicActions, monster)
  )

  const mythicPreamble = computed(() =>
    processMythicActionPreamble(monster.mythicActions, monster)
  )

  const mythicActions = computed(() =>
    monster.mythicActions.actions.map((a) =>
      processLegendaryAction(a.actionId, a.cost, monster)
    )
  )

  const reactions = computed(() =>
    filterByStagePool(monster.reactions).map((r) => processReaction(r, monster))
  )

  const lairActionPreamble = computed(() => processLairActionPreamble(monster))

  const lairActions = computed(() =>
    monster.lairActions.map((la) => processLairAction(la, monster))
  )

  const regionalEffectPreamble = computed(() =>
    processTokens(monster.regionalEffectDescription, undefined, monster, 'none')
  )

  const regionalEffects = computed(() =>
    monster.regionalEffects.map((re) =>
      processTokens(re.description, undefined, monster, 'none')
    )
  )

  const inventory = computed(() =>
    processTokens(monster.inventory, undefined, monster, 'none')
  )

  const initiativeCells = computed(() => {
    const init = monster.initiative
    const cfg = monster.initiativeConfig
    const modStr = `${init.mod >= 0 ? '+' : ''}${init.mod}`
    const primaryModPill = advHtml(numHtml(modStr), init.advantage, init.disadvantage)

    const qualifiers: string[] = []
    const extraCells: string[] = []
    if (init.cantBeSurprised) qualifiers.push("Can't be Surprised")

    if (cfg?.specialTrigger && cfg.specialTrigger !== 'none') {
      if (cfg.specialTrigger === 'at_end_of_every_turn') {
        extraCells.push('At End of Every Turn')
      } else if (cfg.specialTrigger === 'at_end_and_start_lair') {
        extraCells.push('At End of Every Turn')
        extraCells.push('At Start of Every Turn (Lair)')
      } else if (cfg.specialTrigger === 'within_1d6_rounds') {
        extraCells.push('Within 1d6 of rounds')
      } else if (cfg.specialTrigger === 'no_temp_hp_remaining') {
        extraCells.push('When it has no temporary Hit Points remaining')
      } else if (cfg.specialTrigger === 'hp_not_equal_max') {
        extraCells.push('When hit points not equal to Maximum')
      } else if (cfg.specialTrigger === 'choose_lowest_thaumaturgy' || (cfg.specialTrigger as string) === 'cast_thaumaturgy') {
        qualifiers.push('Choose lowest Dice to Cast Thaumaturgy')
      } else if (cfg.specialTrigger === 'choose_lowest_compelled_duel' || (cfg.specialTrigger as string) === 'cast_compelled_duel') {
        qualifiers.push('Choose lowest Dice to Cast Compelled Duel')
      } else if (cfg.specialTrigger === 'choose_lowest_custom' || (cfg.specialTrigger as string) === 'cast_custom') {
        qualifiers.push(`Choose lowest Dice to Cast ${String(cfg.specialTriggerSpell || '').trim() || 'Spell'}`)
      } else if (cfg.specialTrigger === 'custom' && cfg.customEffectNote) {
        qualifiers.push(String(cfg.customEffectNote).trim())
      }
    }

    // Modular composable riders (e.g. "Fiends and Undead have Disadvantage on Initiative Roll", "At Disadvantage, Cast Spell")
    if (Array.isArray(cfg?.riders) && cfg.riders.length > 0) {
      const formattedRiders = formatInitiativeRiders(cfg.riders)
      for (const rider of formattedRiders) {
        if (rider.toLowerCase().includes('have disadvantage on initiative roll') || rider.toLowerCase().includes('have advantage on initiative roll')) {
          extraCells.push(rider)
        } else {
          qualifiers.push(rider)
        }
      }
    }

    const primaryText = qualifiers.length > 0
      ? `${primaryModPill} <span class="init-qualifier-text">(${qualifiers.join(', ')})</span>`
      : primaryModPill

    const cells: string[] = [primaryText, ...extraCells]

    const poolCount = monster.paragonConfig?.poolCount || monster.paragonConfig?.poolsCount || 1
    const isParagon = Boolean(
      (monster.paragonConfig?.enabled && poolCount > 1) ||
      poolCount > 1
    )
    if (isParagon) {
      const pName = String(monster.paragonConfig?.phaseName || '').trim() || 'Phase'
      const configs = monster.paragonConfig?.phaseConfigs
      const extraCount = Math.max(1, poolCount)
      if (Array.isArray(configs) && configs.length > 0) {
        configs.slice(0, extraCount).forEach((pCfg, idx) => {
          const label = String(pCfg.name || '').trim() || (idx === extraCount - 1 ? 'Final' : `${pName} ${idx + 2}`)
          const defaultBonus = `+${(idx + 1) * 10}`
          const rawBonus = pCfg.initiativeBonus != null ? String(pCfg.initiativeBonus).trim() : ''
          const bonusStr = rawBonus
            ? (rawBonus.startsWith('+') || rawBonus.startsWith('-') ? rawBonus : `+${rawBonus}`)
            : defaultBonus
          cells.push(`${numHtml(bonusStr)} (${label})`)
        })
      } else {
        for (let i = 0; i < extraCount; i++) {
          const label = i === extraCount - 1 ? 'Final' : `${pName} ${i + 2}`
          const bonusStr = `+${(i + 1) * 10}`
          cells.push(`${numHtml(bonusStr)} (${label})`)
        }
      }
    }

    if (cfg?.specialTrigger !== 'at_end_and_start_lair' && (cfg?.useLairInitiative || monster.lairActions?.length > 0)) {
      if (cfg?.useLairInitiative !== false) {
        const lairVal = cfg?.lairInitiative ?? 20
        cells.push(`${numHtml(lairVal)} (Lair)`)
      }
    }

    return cells
  })

  const initiative = computed(() => {
    const init = monster.initiative
    const modStr = `${init.mod >= 0 ? '+' : ''}${init.mod}`
    const modPill = advHtml(numHtml(modStr), init.advantage, init.disadvantage)
    const badges: string[] = []
    if (init.cantBeSurprised) badges.push("can't be surprised")

    const isParagon = Boolean(
      monster.paragonConfig?.enabled ||
      (monster.paragonConfig?.poolCount && monster.paragonConfig.poolCount > 1)
    )
    if (isParagon) {
      const step = monster.paragonConfig?.initiativeStep?.trim() || 'Acts at Count 20, 10, 0'
      badges.push(step)
    }

    const badgeStr = badges.length > 0 ? `; ${badges.join(', ')}` : ''
    return `${modPill} (${numHtml(init.passive)}${badgeStr})`
  })

  // Advanced Battle Dynamics Computed Getters
  const buildCompositePill = (name: string, cells: string[]): string => {
    const cellHtml = cells
      .filter(Boolean)
      .map((c) => `<span class="action-pill-cell">${c}</span>`)
      .join('')
    return `<div class="action-composite-pill"><span class="action-pill-name">${name}</span>${cellHtml}</div>`
  }

  const villainActionsList = computed(() => {
    if (!Array.isArray(monster.villainActions) || monster.villainActions.length === 0) return []
    return monster.villainActions.map((va) => ({
      ...va,
      rendered: `${buildCompositePill(`Round ${va.round}: ${va.name}`, [va.trigger || "End of another creature's turn"])} ${processTokens(va.description, undefined, monster, 'action')}`,
    }))
  })

  const bloodiedActionsList = computed(() => {
    if (!Array.isArray(monster.bloodiedActions) || monster.bloodiedActions.length === 0) return []
    return monster.bloodiedActions.map((ba) => {
      const trig = (ba as any).trigger || (ba.triggerType === 'immediate_reaction' ? 'Immediate Reaction' : 'While Bloodied')
      return {
        ...ba,
        rendered: `${buildCompositePill(ba.name, [String(trig)])} ${processTokens(ba.description, undefined, monster, 'action')}`,
      }
    })
  })

  const reactiveActionsList = computed(() => {
    if (!Array.isArray(monster.reactiveActions) || monster.reactiveActions.length === 0) return []
    return monster.reactiveActions.map((ra) => ({
      ...ra,
      rendered: `${buildCompositePill(ra.name, [ra.trigger ? `Trigger: ${ra.trigger}` : 'Reaction', ra.usesPerRound ? `${ra.usesPerRound}/round` : ''])} ${processTokens(ra.description, undefined, monster, 'action')}`,
    }))
  })

  const comboActionsList = computed(() => {
    if (!Array.isArray(monster.comboActions) || monster.comboActions.length === 0) return []
    return monster.comboActions.map((ca) => {
      const followUp = ca.followUpAction || (ca as any).followup || 'Follow-Up'
      const cond = ca.condition || (ca as any).triggerCondition || ''
      return {
        ...ca,
        rendered: `${buildCompositePill(ca.name, [`Combo: ${ca.leadAction} ➔ ${followUp}`, cond ? `Condition: ${cond}` : ''])} ${processTokens(ca.description, undefined, monster, 'action')}`,
      }
    })
  })

  const anatomyPartsList = computed(() => {
    if (!Array.isArray(monster.anatomyParts) || monster.anatomyParts.length === 0) return []
    return monster.anatomyParts.map((ap) => {
      const partName = ap.name || ap.part || 'Targetable Part'
      const effect = ap.breakEffect || ap.severEffect || 'Disabled when reduced to 0 HP.'
      return {
        ...ap,
        name: partName,
        breakEffect: effect,
        rendered: `${buildCompositePill(partName, [`HP ${ap.hp || 0}`, ap.ac ? `AC ${ap.ac}` : '', ap.threshold ? `DT ${ap.threshold}` : ''])} ${effect}`,
      }
    })
  })

  const runehammerTrackData = computed(() => {
    const die = monster.runehammerTrack?.timerDie || (monster.runehammerTrack as any)?.die || 'd4'
    if (!monster.runehammerTrack?.enabled || !Array.isArray(monster.runehammerTrack.events) || monster.runehammerTrack.events.length === 0) {
      return null
    }
    return {
      title: monster.runehammerTrack.name || 'Escalation Track',
      timerDie: die,
      events: monster.runehammerTrack.events.map((ev) => {
        const desc = ev.description || (ev as any).effect || ''
        return {
          ...ev,
          rendered: `${buildCompositePill(`Round ${ev.round}: ${ev.name}`, [`Timer ${die}`])} ${desc}`,
        }
      }),
    }
  })

  const paragonData = computed(() => {
    if (!monster.paragonConfig?.enabled) return null
    const poolCount = monster.paragonConfig.poolCount || monster.paragonConfig.poolsCount || 2
    return {
      title: `Paragon Boss (${poolCount} Action Pools)`,
      pools: Array.isArray(monster.paragonConfig.poolHp)
        ? monster.paragonConfig.poolHp.map((hp, idx) => `Pool ${idx + 1}: ${hp} HP`).join(' | ')
        : `${poolCount} Stages`,
      initiative: monster.paragonConfig.initiativeStep || 'Acts at multiple initiatives',
      enrageNote: monster.paragonConfig.enrageNote || monster.paragonConfig.transitionEffect || '',
    }
  })

  return {
    stats,
    acInvulnerability,
    acBadges,
    hp,
    hpBadges,
    hpBadgeEntries,
    saves,
    speeds,
    speedBadges,
    speedBaseBadges,
    speedRiderBadges,
    skills,
    tools,
    vulnerabilities,
    conditionVulnerabilities,
    resistances,
    conditionResistances,
    immunities,
    conditions,
    cascadingDefenses,
    senses,
    sensesBadges,
    languages,
    languagesBadges,
    cr,
    traits,
    classSpellcastingPreamble,
    classSpellcastingWarlockLabel,
    classSpellcastingSlots,
    innateSpellcastingPreamble,
    innateSpellcastingLists,
    attacks,
    actions,
    bonusActions,
    multiattacks,
    legendaryPreamble,
    legendaryActions,
    mythicTrait,
    mythicPreamble,
    mythicActions,
    reactions,
    lairActionPreamble,
    lairActions,
    regionalEffectPreamble,
    regionalEffects,
    inventory,
    initiative,
    initiativeCells,
    statsAndSavesByKey,
    immunitiesAndConditions,
    actionPassives,
    actionPassivesGroups,
    groupedTraits,
    villainActionsList,
    bloodiedActionsList,
    reactiveActionsList,
    comboActionsList,
    anatomyPartsList,
    runehammerTrackData,
    paragonData,
  }
}
