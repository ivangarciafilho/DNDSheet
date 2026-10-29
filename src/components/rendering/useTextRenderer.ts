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

// rendering strings for whatever needs it
export function useTextRenderer() {
  const monster = useMonsterStore()
  const editorStore = useEditorStore()
  const { t } = useI18n()
  const {
    processAction,
    processAttack,
    processClassSpellcasting,
    processInnateSpellcasting,
    processLairActionPreamble,
    processLegendaryAction,
    processLegendaryPreamble,
    processMultiattack,
    processMythicActionPreamble,
    processMythicActionTrait,
    processReaction,
    processTokens,
    processTrait,
  } = useProcessTokens()

  const stats = computed(() => {
    return monster.statsWithModifiers.map((s) => {
      return {
        ...s,
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

  const acBadges = computed(() => {
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
        if (loc === 'ac' && !res.isAbsoluteRule) {
          const ruling = composeInvulnerabilityRuling(inv)
          if (ruling && !badges.includes(ruling)) badges.push(ruling)
        }
      }
      return badges
    }

    const baseAc = `<strong class="pill-number">${monster.AC}</strong>${monster.ACType && monster.ACType.trim() !== '' ? ` (${monster.ACType.trim()})` : ''}`
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
      return `${ext.bloodiedOverride}`
    }
    const effectiveSrc = !src || src === 'none' ? 'half_hp' : src
    return resolveDynamicNumericSource(
      effectiveSrc,
      ext.bloodiedOverride ?? Math.max(1, Math.floor(monster.avgHp / 2)),
      ext.bloodiedDice,
      dynCtx.value
    )
  })

  const hpBadges = computed(() => {
    const ext = monster.extendedHp
    const dp = ext?.deathPrevention

    // Check if True Immortal / Hide HP mode is active
    if (dp?.enabled && dp.name !== 'Mortal') {
      if (dp.dcRule === 'until_x_crits') {
        const text = formatMinimalistDeathPrevention(dp, dynCtx.value)
        return text ? [text] : ['Immortal']
      }
      const noExceptions = (!dp.exceptions || dp.exceptions.length === 0) && !dp.customNote?.trim()
      if (dp.hideHp || (dp.name === 'Immortal' && noExceptions && !dp.returnHpSource)) {
        const text = formatMinimalistDeathPrevention(dp, dynCtx.value) || 'Immortal'
        return [text]
      }
    }

    const badges: string[] = []

    const poolCount = monster.paragonConfig?.poolCount || monster.paragonConfig?.poolsCount || ext?.paragonPools || 1
    const isParagon = Boolean(
      (monster.paragonConfig?.enabled && poolCount > 1) ||
      poolCount > 1
    )

    // 1. Primary HP & Hit Dice (Merged cleanly)
    const dicePart = `<span class="dnd-hp-hd">(${monster.HP.HD}d${monster.HP.type}${hpModifier.value})</span>`
    if (!isParagon && bloodiedValue.value != null) {
      badges.push(`<strong class="pill-number">${monster.avgHp}</strong>/<strong class="pill-number text-red-7">${bloodiedValue.value}</strong> Bloodied ${dicePart}`)
    } else {
      badges.push(`<strong class="pill-number">${monster.avgHp}</strong> ${dicePart}`)
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
            normalPhases.push(`<strong class="pill-number">${val}</strong> (${label})`)
          }
        })
      } else {
        if (typeof monster.paragonConfig?.poolHp === 'number') {
          normalPhases.push(`<strong class="pill-number">${poolCount} Pools of ${monster.paragonConfig.poolHp} HP</strong>`)
        } else {
          for (let i = 0; i < poolCount; i++) {
            const label = (i === poolCount - 1 ? 'Final' : `${pName} ${i + 2}`).trim()
            const val = `${Math.max(1, Math.floor(monster.avgHp / Math.pow(2, i + 1)))}`.trim()
            normalPhases.push(`<strong class="pill-number">${val}</strong> (${label})`)
          }
        }
      }

      if (normalPhases.length > 0) {
        badges.push(normalPhases.join(' | '))
      }
      if (bloodiedPhases.length > 0) {
        const bloodiedInner = bloodiedPhases.map(b => `<strong class="pill-number">${b.val}</strong> (${b.label})`).join(' | ')
        badges.push(`<span class="dnd-bloodied-badge dnd-bloodied-phases-limiter">[ ${bloodiedInner} | <span class="bloodied-tag">[Bloodied]</span> ]</span>`)
      } else if (bloodiedValue.value != null && (!bloodiedAt || bloodiedAt === 'half_total')) {
        badges.push(`<span class="dnd-bloodied-badge dnd-bloodied-phases-limiter">[ <strong class="pill-number">${bloodiedValue.value}</strong> | <span class="bloodied-tag">[Bloodied]</span> ]</span>`)
      }
    }

    // 3. Regeneration & Temporary Hit Points
    if (
      ext?.regeneration?.enabled &&
      (ext.regeneration.displayMode === 'minimalist' ||
        ext.regeneration.displayMode === 'both' ||
        !ext.regeneration.displayMode)
    ) {
      const minRegen = formatMinimalistRegen(ext.regeneration, dynCtx.value)
      if (minRegen) {
        badges.push(minRegen)
      }
    } else if (!ext?.regeneration && ext?.tempHp && ext.tempHp.amount > 0) {
      const thp = ext.tempHp
      let trigStr = ''
      if (thp.trigger === 'start_turn') trigStr = ' at start of turn'
      else if (thp.trigger === 'end_turn') trigStr = ' at end of turn'
      else if (thp.trigger === 'damage_type' && thp.damageType) trigStr = ` when taking ${thp.damageType} damage`
      else if (thp.trigger === 'bloodied') trigStr = ' when bloodied'
      else if (thp.trigger === 'short_rest') trigStr = ' on short rest'
      else if (thp.trigger === 'long_rest') trigStr = ' on long rest'
      badges.push(`+${thp.amount} temp HP${trigStr}`)
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
        badges.push(minDp)
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
      badges.push(`DT ${dtStr}${dStr ? ` (disrupted by ${dStr})` : ''}`)
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
      badges.push(`DR ${drStr}${dStr ? ` (disrupted by ${dStr})` : ''}`)
    }

    // 7. Invulnerability in HP
    const hpInv = ext?.invulnerability
    if (hpInv) {
      const loc = resolveInvulnerabilityDisplayLocation(hpInv)
      if (loc === 'hp') {
        const invRuling = composeInvulnerabilityRuling(hpInv)
        if (invRuling) badges.push(invRuling)
      }
    }

    return badges
  })

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

      let pill = `<strong class="pill-number">${modStr}</strong>`
      if (hasAdv) {
        pill = `<span class="dnd-adv-pill"><strong class="pill-number pill-bold">${modStr}</strong> <span class="dnd-adv-arrow">▲▲</span></span>`
      } else if (hasDisadv) {
        pill = `<span class="dnd-disadv-pill"><strong class="pill-number pill-bold">${modStr}</strong> <span class="dnd-disadv-arrow">▼▼</span></span>`
      }
      const condBadge = cond ? ` <span class="dnd-badge-cond" title="${cond}">(${cond})</span>` : ''
      const text = `${stat} ${pill}${condBadge}`
      if (hasAdv) return `<span class="dnd-item-adv">${text}</span>`
      if (hasDisadv) return `<span class="dnd-item-disadv">${text}</span>`
      return text
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
      let saveHtml = `<strong class="pill-number">${baseSave}</strong>`
      if (hasAdv) {
        saveHtml = `<span class="dnd-item-adv"><span class="dnd-adv-pill"><strong class="pill-number pill-bold">${baseSave}</strong> <span class="dnd-adv-arrow">▲▲</span></span></span>`
      } else if (hasDisadv) {
        saveHtml = `<span class="dnd-item-disadv"><span class="dnd-disadv-pill"><strong class="pill-number pill-bold">${baseSave}</strong> <span class="dnd-disadv-arrow">▼▼</span></span></span>`
      }
      if (cond) {
        saveHtml += ` <span class="dnd-badge-cond" title="${cond}">(${cond})</span>`
      }

      data[s.stat] = {
        ...s,
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
      return `${capitalize(type)}${s.speed} ft.${note}`
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
      if (trav.bonusActionDash) cunning.push('Dash')
      if (trav.bonusActionDodge) cunning.push('Dodge')
      if (trav.bonusActionDisengage) cunning.push('Disengage')
      if (cunning.length > 0) {
        parts.push(`bonus action ${cunning.join('/')}`)
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

    return parts.join('; ')
  })

  const speedBadges = computed(() => {
    const raw = speeds.value
    if (!raw) return []
    return raw.split(/;\s*/).map((s) => s.trim()).filter(Boolean)
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
        let pill = `<strong class="pill-number">${bonusStr}</strong>`
        if (s.advantage) {
          pill = `<span class="dnd-adv-pill dnd-bonus-badge adv"><strong class="pill-number pill-bold">${bonusStr}</strong> <span class="dnd-adv-arrow">▲▲</span></span>`
        } else if (s.disadvantage) {
          pill = `<span class="dnd-disadv-pill dnd-bonus-badge disadv"><strong class="pill-number pill-bold">${bonusStr}</strong> <span class="dnd-disadv-arrow">▼▼</span></span>`
        }
        const cond = s.condition?.trim() || s.conditional?.trim() || ''
        const condBadge = cond ? ` <span class="dnd-badge-cond" title="${cond}">(${cond})</span>` : ''
        const pillClass = s.advantage ? 'dnd-item-adv' : (s.disadvantage ? 'dnd-item-disadv' : '')
        return `<span class="dnd-entry-pill ${pillClass}"><span class="dnd-entry-label">${t(`skill.${s.key}`)}</span> ${pill}${condBadge}</span>`
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
        let pill = `<strong class="pill-number">${bonusStr}</strong>`
        if (t.advantage) {
          pill = `<span class="dnd-adv-pill dnd-bonus-badge adv"><strong class="pill-number pill-bold">${bonusStr}</strong> <span class="dnd-adv-arrow">▲▲</span></span>`
        } else if (t.disadvantage) {
          pill = `<span class="dnd-disadv-pill dnd-bonus-badge disadv"><strong class="pill-number pill-bold">${bonusStr}</strong> <span class="dnd-disadv-arrow">▼▼</span></span>`
        }
        const cond = t.condition?.trim()
        const condBadge = cond ? ` <span class="dnd-badge-cond" title="${cond}">(${cond})</span>` : ''
        const pillClass = t.advantage ? 'dnd-item-adv' : (t.disadvantage ? 'dnd-item-disadv' : '')
        return `<span class="dnd-entry-pill ${pillClass}"><span class="dnd-entry-label">${t.name}</span> ${pill}${condBadge}</span>`
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
    const getItems = (list: any[] | undefined, fallback: string[] | undefined): string[] => {
      if (Array.isArray(list) && list.length > 0) {
        return list.map((item) => formatDefenseItem(item)).filter(Boolean)
      }
      if (Array.isArray(fallback) && fallback.length > 0) {
        return fallback.map((s) => String(s).trim()).filter(Boolean)
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
      damageList: string[],
      conditionList: string[]
    ) => {
      if (damageList.length === 0 && conditionList.length === 0) return null

      // Sort concise items first, verbose items (with complex conditions, bypasses, parentheses) last
      const sortVerboseLast = (items: string[]) => {
        return [...items].sort((a, b) => {
          const aLen = a.length
          const bLen = b.length
          const aHasParen = a.includes('(') || a.includes('that ') || a.includes('from ') || a.includes(';')
          const bHasParen = b.includes('(') || b.includes('that ') || b.includes('from ') || b.includes(';')
          if (aHasParen !== bHasParen) return aHasParen ? 1 : -1
          return aLen - bLen
        })
      }

      const sortedDamages = sortVerboseLast(damageList)
      const sortedConditions = sortVerboseLast(conditionList)
      const allItems = [...sortedDamages, ...sortedConditions]

      let formattedProse = ''
      if (sortedDamages.length > 0 && sortedConditions.length > 0) {
        formattedProse = `${sortedDamages.join(', ')}; ${sortedConditions.join(', ')}`
      } else if (sortedDamages.length > 0) {
        formattedProse = sortedDamages.join(', ')
      } else {
        formattedProse = sortedConditions.join(', ')
      }

      const isVerbose = formattedProse.length > 65 || (sortedDamages.length + sortedConditions.length) >= 4

      return {
        key,
        title: scopeLabel,
        scopeLabel,
        subTypeLabel: '',
        damageItems: sortedDamages,
        conditionItems: sortedConditions,
        items: allItems,
        formattedProse,
        isVerbose,
      }
    }

    const sections: any[] = []
    const vulnSec = buildUnifiedSection('vulnerabilities', 'Vulnerabilities', vulnDamages, vulnConditions)
    if (vulnSec) sections.push(vulnSec)

    const resSec = buildUnifiedSection('resistances', 'Resistances', resDamages, resConditions)
    if (resSec) sections.push(resSec)

    const immSec = buildUnifiedSection('immunities', 'Immunities', immDamages, immConditions)
    if (immSec) sections.push(immSec)

    return sections
  })

  const actionPassivesGroups = computed(() => {
    const p = monster.actionOrientedPassives
    const groups: {
      name: string
      scopeLabel: string
      subTypeLabel: string
      skills: string
      badges: string[]
    }[] = []

    const findSkill = (skillKey: string) =>
      monster.skills?.find((s) => s.key?.toUpperCase() === skillKey.toUpperCase())

    const formatConsolidatedSkillPill = (label: string, skillKey: string, defaultStat: DndStat, condKey: string): string => {
      const existing = findSkill(skillKey)
      const baseMod = statModifier(monster.stats?.[defaultStat] ?? 10)
      const mpItem = (monster.passives as Record<string, any>)?.[condKey.toLowerCase()]
      const isAdv = existing?.advantage || mpItem?.advantage
      const isDisadv = existing?.disadvantage || mpItem?.disadvantage
      const hasOverride = existing?.override || mpItem?.override
      const ovVal = existing?.override ? existing.overrideValue : (mpItem?.override ? mpItem.overrideValue : null)

      const activeBonus = hasOverride && ovVal != null
        ? ovVal
        : (existing ? bonusForSkill(monster, existing) : baseMod)
      const activeBonusStr = renderBonus(activeBonus)

      let passiveVal = 10 + activeBonus
      if (isAdv) passiveVal += 5
      if (isDisadv) passiveVal -= 5
      if (skillKey.toUpperCase() === 'PERCEPTION' && monster.passivePerception?.override) {
        passiveVal = monster.passivePerception.overrideValue
      }

      const c = mpItem?.condition?.trim() || p?.conditions?.[condKey.toLowerCase()] || existing?.condition?.trim() || existing?.conditional?.trim() || ''
      const condStr = c ? ` <span class="dnd-badge-cond">(${c})</span>` : ''
      const pairStr = `(${passiveVal}/${activeBonusStr})`

      if (isAdv) {
        return `<span class="dnd-entry-pill dnd-item-adv text-positive"><span class="dnd-entry-label">${label}</span> <strong class="pill-number pill-bold text-positive">${pairStr}</strong> <span class="dnd-adv-arrow">▲▲</span>${condStr}</span>`
      }
      if (isDisadv) {
        return `<span class="dnd-entry-pill dnd-item-disadv text-negative"><span class="dnd-entry-label">${label}</span> <strong class="pill-number pill-bold text-negative">${pairStr}</strong> <span class="dnd-disadv-arrow">▼▼</span>${condStr}</span>`
      }
      return `<span class="dnd-entry-pill"><span class="dnd-entry-label">${label}</span> <strong class="pill-number">${pairStr}</strong>${condStr}</span>`
    }

    const handledSkillKeys = new Set<string>()
    const disclosedSkillKeys = new Set<string>()

    const buildCompoundedSkillsRow = (
      name: string,
      scopeLabel: string,
      actionType: string,
      baseStat: DndStat,
      skillDefs: { label: string; key: string; stat: DndStat; condKey: string }[]
    ) => {
      const baseStatScore = monster.stats?.[baseStat] ?? 10
      const baseStatMod = statModifier(baseStatScore)
      const baseStatModStr = renderBonus(baseStatMod)
      const basePassive = 10 + baseStatMod

      // Check whether this scope has active skills or passives configured
      const relevantSkills = skillDefs.filter((def) => {
        const sk = findSkill(def.key)
        const pScope = (p as any)?.[scopeLabel.toLowerCase()]
        const pEnabled = pScope ? pScope[def.condKey] : false
        return sk != null || pEnabled || (def.key === 'PERCEPTION' && (pScope?.perception !== false || monster.passivePerception?.override))
      })

      if (relevantSkills.length === 0) return null

      // Check each skill
      const differingList: { label: string; passive: number; bonus: number; adv: boolean; disadv: boolean }[] = []
      let baseHasDisadv = false
      let baseHasAdv = false

      // Check if stealth has disadvantage (e.g. from heavy armor or explicit disadvantage) or advantage
      if (scopeLabel.toLowerCase() === 'hide') {
        const stealthSkill = findSkill('STEALTH')
        const pStealth = (p as any)?.hide?.stealth
        if (stealthSkill?.disadvantage || (pStealth && typeof pStealth === 'object' && pStealth.disadvantage)) {
          baseHasDisadv = true
        }
        if (stealthSkill?.advantage || (pStealth && typeof pStealth === 'object' && pStealth.advantage)) {
          baseHasAdv = true
        }
      }

      for (const def of relevantSkills) {
        const existing = findSkill(def.key)
        const isScopeBonus = actionType === 'Bonus Action'
        // If skill has an explicit bonusAction toggle that differs from this scope's actionType, do not absorb it into this scope
        if (existing && existing.bonusAction !== undefined && Boolean(existing.bonusAction) !== isScopeBonus) {
          continue
        }
        handledSkillKeys.add(def.key)
        const mpItem = (p as any)?.[scopeLabel.toLowerCase()]?.[def.condKey]
        const cond =
          existing?.condition ||
          (p as any)?.conditions?.[def.condKey] ||
          (p as any)?.conditions?.[def.key.toLowerCase()] ||
          (p as any)?.[scopeLabel.toLowerCase()]?.conditions?.[def.condKey] ||
          (mpItem && typeof mpItem === 'object' ? mpItem.condition : '') ||
          ''
        const bonus = existing ? bonusForSkill(monster, existing) : statModifier(monster.stats?.[def.stat] ?? 10)
        const isAdv = Boolean(existing?.advantage || mpItem?.advantage)
        const isDisadv = Boolean(existing?.disadvantage || mpItem?.disadvantage)

        let passiveVal = 10 + bonus
        if (def.key === 'PERCEPTION' && monster.passivePerception?.override && monster.passivePerception.overrideValue != null) {
          passiveVal = monster.passivePerception.overrideValue
        } else if (existing?.override && existing.overrideValue != null) {
          passiveVal = 10 + existing.overrideValue
        } else {
          if (isAdv) passiveVal += 5
          if (isDisadv) passiveVal -= 5
        }

        // Compare to baseline
        const isBaseline = !cond && passiveVal === (basePassive + (baseHasAdv ? 5 : 0) - (baseHasDisadv ? 5 : 0)) && bonus === baseStatMod && (isAdv === baseHasAdv) && (isDisadv === baseHasDisadv)
        if (!isBaseline) {
          disclosedSkillKeys.add(def.key)
          differingList.push({
            label: def.label,
            passive: passiveVal,
            bonus,
            adv: isAdv,
            disadv: isDisadv,
            cond,
          })
        }
      }

      const baseArrow = baseHasAdv
        ? ' <span class="dnd-adv-arrow text-positive">▲▲</span>'
        : baseHasDisadv
        ? ' <span class="dnd-disadv-arrow text-negative">▼▼</span>'
        : ''

      const basePassiveCalculated = basePassive + (baseHasAdv ? 5 : 0) - (baseHasDisadv ? 5 : 0)
      let rowHtml = `<strong class="pill-number">${basePassiveCalculated}/${baseStatModStr}</strong>${baseArrow}`

      if (differingList.length > 0) {
        // Group by passive, bonus, adv, disadv, cond
        const diffGroupsMap = new Map<string, { passive: number; bonus: number; adv: boolean; disadv: boolean; cond: string; labels: string[] }>()
        for (const item of differingList) {
          const key = `${item.passive}_${item.bonus}_${item.adv}_${item.disadv}_${item.cond}`
          if (!diffGroupsMap.has(key)) {
            diffGroupsMap.set(key, { passive: item.passive, bonus: item.bonus, adv: item.adv, disadv: item.disadv, cond: item.cond, labels: [] })
          }
          diffGroupsMap.get(key)!.labels.push(item.label)
        }

        const diffSnippets: string[] = []
        for (const grp of diffGroupsMap.values()) {
          const condStr = grp.cond ? ` (${grp.cond})` : ''
          const labelsStr = grp.labels.join(' and ')
          if (grp.adv) {
            diffSnippets.push(
              `<span class="dnd-adv-highlight text-positive"><strong class="pill-number text-positive">${grp.passive}, ${renderBonus(grp.bonus)}</strong> ${labelsStr}${condStr} <span class="dnd-adv-arrow">▲▲</span></span>`
            )
          } else if (grp.disadv) {
            diffSnippets.push(
              `<span class="dnd-disadv-highlight text-negative"><strong class="pill-number text-negative">${grp.passive}, ${renderBonus(grp.bonus)}</strong> ${labelsStr}${condStr} <span class="dnd-disadv-arrow">▼▼</span></span>`
            )
          } else {
            diffSnippets.push(
              `<span class="dnd-entry-item"><strong class="pill-number">${grp.passive}, ${renderBonus(grp.bonus)}</strong> ${labelsStr}${condStr}</span>`
            )
          }
        }

        rowHtml += `, (${diffSnippets.join('; ')})`
      }

      return {
        name,
        scopeLabel,
        subTypeLabel: actionType,
        skills: rowHtml,
        badges: [rowHtml],
      }
    }

    // 1. Search group (Perception, Survival) - Investigation officially listed under Study
    const searchSkills = [
      { label: 'Perception', key: 'PERCEPTION', stat: 'WIS' as DndStat, condKey: 'perception' },
      { label: 'Survival', key: 'SURVIVAL', stat: 'WIS' as DndStat, condKey: 'survival' }
    ]
    const isSearchBonus = p?.bonusActionSearch || monster.passives?.searchActionType === 'Bonus Action'
    const searchRow = buildCompoundedSkillsRow(
      `Search${isSearchBonus ? ' (Bonus Action)' : ''}`,
      'Search',
      isSearchBonus ? 'Bonus Action' : 'Action',
      'WIS',
      searchSkills
    )
    if (searchRow) groups.push(searchRow)

    // 2. Study group (Arcana, History, Nature, Religion, Investigation, Medicine)
    const studySkills = [
      { label: 'Arcana', key: 'ARCANA', stat: 'INT' as DndStat, condKey: 'arcana' },
      { label: 'History', key: 'HISTORY', stat: 'INT' as DndStat, condKey: 'history' },
      { label: 'Nature', key: 'NATURE', stat: 'INT' as DndStat, condKey: 'nature' },
      { label: 'Religion', key: 'RELIGION', stat: 'INT' as DndStat, condKey: 'religion' },
      { label: 'Investigation', key: 'INVESTIGATION', stat: 'INT' as DndStat, condKey: 'investigation' },
      { label: 'Medicine', key: 'MEDICINE', stat: 'WIS' as DndStat, condKey: 'medicine' }
    ]
    const isStudyBonus = p?.bonusActionStudy || monster.passives?.studyActionType === 'Bonus Action'
    const studyRow = buildCompoundedSkillsRow(
      `Study${isStudyBonus ? ' (Bonus Action)' : ''}`,
      'Study',
      isStudyBonus ? 'Bonus Action' : 'Action',
      'INT',
      studySkills
    )
    if (studyRow) groups.push(studyRow)

    // 3. Influence group (Insight, Persuasion, Deception, Intimidation, Animal Handling)
    const influenceSkills = [
      { label: 'Insight', key: 'INSIGHT', stat: 'WIS' as DndStat, condKey: 'insight' },
      { label: 'Persuasion', key: 'PERSUASION', stat: 'CHA' as DndStat, condKey: 'persuasion' },
      { label: 'Deception', key: 'DECEPTION', stat: 'CHA' as DndStat, condKey: 'deception' },
      { label: 'Intimidation', key: 'INTIMIDATION', stat: 'CHA' as DndStat, condKey: 'intimidation' },
      { label: 'Animal Handling', key: 'ANIMAL_HANDLING', stat: 'WIS' as DndStat, condKey: 'animalhandling' }
    ]
    const isInfluenceBonus = p?.bonusActionInfluence || monster.passives?.influenceActionType === 'Bonus Action'
    const influenceRow = buildCompoundedSkillsRow(
      `Influence${isInfluenceBonus ? ' (Bonus Action)' : ''}`,
      'Influence',
      isInfluenceBonus ? 'Bonus Action' : 'Action',
      'CHA',
      influenceSkills
    )
    if (influenceRow) groups.push(influenceRow)

    // 4. Hide group (Stealth, Athletics, Acrobatics, Sleight of Hand)
    const hideSkills = [
      { label: 'Stealth', key: 'STEALTH', stat: 'DEX' as DndStat, condKey: 'stealth' },
      { label: 'Athletics', key: 'ATHLETICS', stat: 'STR' as DndStat, condKey: 'athletics' },
      { label: 'Acrobatics', key: 'ACROBATICS', stat: 'DEX' as DndStat, condKey: 'acrobatics' },
      { label: 'Sleight of Hand', key: 'SLEIGHT_OF_HAND', stat: 'DEX' as DndStat, condKey: 'sleightofhand' }
    ]
    const isHideBonus = p?.bonusActionHide || monster.passives?.hideActionType === 'Bonus Action'
    const hideRow = buildCompoundedSkillsRow(
      `Hide${isHideBonus ? ' (Bonus Action)' : ''}`,
      'Hide',
      isHideBonus ? 'Bonus Action' : 'Action',
      'DEX',
      hideSkills
    )
    if (hideRow) groups.push(hideRow)

    // 5. Consolidated Skills rows (Action vs Bonus Action) for remaining skills (Animal Handling, Performance, Sleight of Hand, Medicine, etc.)
    const actionSkills: string[] = []
    const bonusActionSkills: string[] = []

    const pushRemainingSkill = (label: string, key: string, defaultStat: DndStat, condKey: string, isBonusDefault = false) => {
      if (handledSkillKeys.has(key)) return
      const sk = findSkill(key)
      const isEnabledInPassives =
        (key === 'ANIMAL_HANDLING' && p?.influence?.animalHandling) ||
        (key === 'SLEIGHT_OF_HAND' && p?.hide?.sleightOfHand)
      if (!sk && !isEnabledInPassives) return
      handledSkillKeys.add(key)
      const pill = formatConsolidatedSkillPill(label, key, defaultStat, condKey)
      const useBonus = sk?.bonusAction != null ? sk.bonusAction : isBonusDefault
      if (useBonus) {
        bonusActionSkills.push(pill)
      } else {
        actionSkills.push(pill)
      }
    }

    pushRemainingSkill('Animal Handling', 'ANIMAL_HANDLING', 'WIS', 'animalhandling', false)
    pushRemainingSkill('Performance', 'PERFORMANCE', 'CHA', 'performance', false)
    pushRemainingSkill('Medicine', 'MEDICINE', 'WIS', 'medicine', false)
    pushRemainingSkill('Sleight of Hand', 'SLEIGHT_OF_HAND', 'DEX', 'sleightofhand', Boolean(p?.bonusActionHide))

    const trainedSkillKeys = new Set<string>()
    if (Array.isArray(monster.skills)) {
      for (const sk of monster.skills) {
        const k = sk.key?.toUpperCase()
        if (!k || k === 'INITIATIVE' || trainedSkillKeys.has(k) || disclosedSkillKeys.has(k) || handledSkillKeys.has(k)) continue
        trainedSkillKeys.add(k)
        const label = t(`skill.${sk.key}`)
        const defaultStat = (sk.skill?.stat as DndStat) || 'INT'
        const pill = formatConsolidatedSkillPill(label, k, defaultStat, k.toLowerCase())
        if (sk.bonusAction) {
          bonusActionSkills.push(pill)
        } else {
          actionSkills.push(pill)
        }
      }
    }

    if (actionSkills.length > 0) {
      groups.push({
        name: 'Skills (Action)',
        scopeLabel: 'Skills',
        subTypeLabel: 'Action',
        skills: actionSkills.join(' '),
        badges: actionSkills,
      })
    }
    if (bonusActionSkills.length > 0) {
      groups.push({
        name: 'Skills (Bonus Action)',
        scopeLabel: 'Skills',
        subTypeLabel: 'Bonus Action',
        skills: bonusActionSkills.join(' '),
        badges: bonusActionSkills,
      })
    }

    // 6. Consolidated Tools rows (Action vs Bonus Action)
    if (Array.isArray(monster.tools) && monster.tools.length > 0) {
      const actionTools: string[] = []
      const bonusActionTools: string[] = []
      for (const tool of monster.tools) {
        const statMod = statModifier(monster.stats[tool.stat] ?? 10)
        const bonus = tool.override
          ? tool.overrideValue
          : statMod + (tool.proficient ? monster.proficiency : 0) + (tool.expertise ? monster.proficiency : 0)
        const bonusStr = renderBonus(bonus)
        let passiveVal = 10 + bonus
        if (tool.advantage) passiveVal += 5
        if (tool.disadvantage) passiveVal -= 5
        const pairStr = `(${passiveVal}/${bonusStr})`
        const cond = tool.condition?.trim()
        const condBadge = cond ? ` <span class="dnd-badge-cond" title="${cond}">(${cond})</span>` : ''
        let pillHtml = ''
        if (tool.advantage) {
          pillHtml = `<span class="dnd-entry-pill dnd-item-adv"><span class="dnd-entry-label">${tool.name}</span> <span class="dnd-adv-pill dnd-bonus-badge adv" title="Advantage"><strong class="pill-number pill-bold">${pairStr}</strong> <span class="dnd-adv-arrow">▲▲</span></span>${condBadge}</span>`
        } else if (tool.disadvantage) {
          pillHtml = `<span class="dnd-entry-pill dnd-item-disadv"><span class="dnd-entry-label">${tool.name}</span> <span class="dnd-disadv-pill dnd-bonus-badge disadv" title="Disadvantage"><strong class="pill-number pill-bold">${pairStr}</strong> <span class="dnd-disadv-arrow">▼▼</span></span>${condBadge}</span>`
        } else {
          pillHtml = `<span class="dnd-entry-pill"><span class="dnd-entry-label">${tool.name}</span> <strong class="pill-number">${pairStr}</strong>${condBadge}</span>`
        }
        if (tool.bonusAction) {
          bonusActionTools.push(pillHtml)
        } else {
          actionTools.push(pillHtml)
        }
      }
      if (actionTools.length > 0) {
        groups.push({
          name: 'Tools (Action)',
          scopeLabel: 'Tools',
          subTypeLabel: 'Action',
          skills: actionTools.join(' '),
          badges: actionTools,
        })
      }
      if (bonusActionTools.length > 0) {
        groups.push({
          name: 'Tools (Bonus Action)',
          scopeLabel: 'Tools',
          subTypeLabel: 'Bonus Action',
          skills: bonusActionTools.join(' '),
          badges: bonusActionTools,
        })
      }
    }

    return groups
  })

  const actionPassives = computed(() => {
    return actionPassivesGroups.value
      .map((g) => `${g.name}: ${g.skills}`)
      .join('; ')
  })

  const formatSingleSenseItem = (item: any): string => {
    const rangeUnit = item.rangeUnit || 'ft'
    const rangeStr = item.range != null && item.range > 0 ? `${item.range}${rangeUnit === 'ft' ? 'ft' : ` ${rangeUnit}`}` : ''
    const notes: string[] = []

    // Universal modifiers
    if (item.blindBeyond) notes.push('blind beyond it')
    if (item.acrossPlanes) notes.push('across Material and Ethereal planes')

    // Sense-specific modifiers
    if (item.echolocation) notes.push("can't while deafened")
    if (item.devilsSight) notes.push('ignore Magical Darkness')
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
        obsStr = ` after ${mins} min${mins === 1 ? '' : 's'} of ${mode}`
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
      return `sense sentience (${rangeStr || '60ft'}, ${modeStr}${notes.length > 0 ? `, ${notes.join(', ')}` : ''})`
    }
    if (lowerName === 'darkvision') {
      return `darkvision (${rangeStr || '60ft'}${notes.length > 0 ? `, ${notes.join(', ')}` : ''})`
    }
    if (lowerName === 'blindsight' || lowerName === 'blindsense' || lowerName === 'echolocation') {
      if (lowerName === 'echolocation' && !notes.includes("can't while deafened")) {
        notes.unshift("can't while deafened")
      }
      return `blindsight (${rangeStr || '60ft'}${notes.length > 0 ? `, ${notes.join(', ')}` : ''})`
    }
    if (lowerName === 'life sense') {
      const modeStr = formatDetectionMode(item.detectionMode || 'presence')
      const targets = item.targetCreatureTypes && item.targetCreatureTypes.length > 0
        ? item.targetCreatureTypes.join(', ')
        : 'living creatures'
      return `life sense (${modeStr} of ${targets}, within ${rangeStr || '5 miles'}${notes.length > 0 ? `, ${notes.join(', ')}` : ''})`
    }
    if (lowerName === 'divine sense') {
      const modeStr = formatDetectionMode(item.detectionMode || 'location')
      const targets = item.targetCreatureTypes && item.targetCreatureTypes.length > 0
        ? item.targetCreatureTypes.join(', ')
        : 'celestials, fiends, and undead'
      return `divine sense (${modeStr} of ${targets}, within ${rangeStr || '60ft'}${notes.length > 0 ? `, ${notes.join(', ')}` : ''})`
    }

    if (item.webSense) notes.push('while touching web, knows location of creatures on same web')
    if (item.note && item.note.trim()) {
      notes.push(item.note.trim())
    }

    if (notes.length > 0) {
      return `${lowerName} (${rangeStr ? `${rangeStr}, ` : ''}${notes.join(', ')})`
    }
    if (lowerName === 'ethereal sight') {
      return `${lowerName} (${rangeStr || '60ft'})`
    }
    if (rangeStr) {
      return `${lowerName} ${rangeStr}`
    }
    return lowerName
  }

  const sensesBadges = computed(() => {
    const items: string[] = []
    if (Array.isArray(monster.sensesList) && monster.sensesList.length > 0) {
      monster.sensesList.forEach((item) => {
        const formatted = formatSingleSenseItem(item)
        if (formatted) items.push(formatted)
      })
    } else {
      Object.entries(monster.senses).forEach(([k, v]) => {
        if (v > 0) items.push(`${k} ${v} ft.`)
      })
    }
    if (monster.sensesNotes && monster.sensesNotes.trim() !== '') {
      items.push(processTokens(monster.sensesNotes, undefined, monster, 'none'))
    }
    return items
  })

  const senses = computed(() => {
    return sensesBadges.value.join(', ')
  })

  const languagesBadges = computed(() => {
    const badges: string[] = []
    if (monster.specialCommunicationArchetype && monster.specialCommunicationArchetype !== 'none') {
      const archOnly = formatLanguagesList([], monster.specialCommunicationArchetype)
      if (archOnly) badges.push(archOnly)
    }
    if (Array.isArray(monster.languagesList) && monster.languagesList.length > 0) {
      for (const item of monster.languagesList) {
        const formatted = formatLanguageItem(item)
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

  const languages = computed(() => {
    if (
      (Array.isArray(monster.languagesList) && monster.languagesList.length > 0) ||
      monster.specialCommunicationArchetype
    ) {
      return formatLanguagesList(monster.languagesList, monster.specialCommunicationArchetype)
    }
    return monster.languages ?? ''
  })

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

    // Regeneration Detailed Trait
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
      const disTypes = Array.isArray(regen.disruptedByTypes) && regen.disruptedByTypes.length > 0
        ? regen.disruptedByTypes.join(' or ')
        : (regen.disruptedBy?.trim() || '')
      const note = regen.disruptedByNote ? regen.disruptedByNote.trim() : ''
      const dis = [disTypes, note].filter(Boolean).join(', ')
      const desc = dis
        ? `The ${monster.name.toLowerCase()} regains ${amt} hit points at the start of its turn. If the ${monster.name.toLowerCase()} takes ${dis} damage, this trait doesn't function at the start of its next turn. The ${monster.name.toLowerCase()} dies only if it starts its turn with 0 hit points and doesn't regenerate.`
        : `The ${monster.name.toLowerCase()} regains ${amt} hit points at the start of its turn if it has at least 1 hit point.`
      if (!list.some((t) => t.name?.trim().toLowerCase() === 'regeneration')) {
        list.push({
          id: 'auto-regeneration',
          name: 'Regeneration',
          description: desc,
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
          description: desc,
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

  const filterByStagePool = <T extends { stagePool?: string }>(items: T[]): T[] => {
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

  const classSpellcastingPreamble = computed(() => {
    return processClassSpellcasting(monster.spellcasting, monster)
  })

  const innateSpellcastingPreamble = computed(() => {
    return processInnateSpellcasting(monster.spellcasting, monster)
  })

  const classSpellcastingWarlockLabel = computed(() => {
    // find the highest level slot and note the quantity
    // this is such a weird way to write this
    const slots = monster.spellcasting.slots
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
    const spellsBySlot = monster.spellsBySlot

    return spellsBySlot.map((s) => {
      let baseLabel = t('editor.spellcasting.slot.slotLabel', {
        ordinal: safeToOrdinal(s.level),
        slots: t('editor.spellcasting.slot.slotQuantity', s.slots),
      })
      const levelCadence = monster.spellcasting?.levelCadenceMap?.[s.level]
      const isBonusAction = monster.spellcasting?.bonusActionLevelMap?.[s.level]

      if (levelCadence) {
        const cadenceMap: Record<string, string> = {
          short_rest: 'Short Rest',
          long_rest: 'Long Rest',
          at_will: 'At-Will',
          '1_day': '1/Day',
          '2_day': '2/Day',
          '3_day': '3/Day',
          recharge_5_6: 'Recharge 5–6',
          downtime: 'Downtime',
          ritual: 'Ritual',
        }
        const cadText = cadenceMap[levelCadence] || levelCadence
        baseLabel = `${baseLabel} (${cadText})`
      }
      if (isBonusAction) {
        baseLabel += ' (Bonus Action)'
      }

      return {
        ...s,
        renderedLabel: baseLabel,
        renderedSpells: s.spells.join(', '),
      }
    })
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
    return filterByStagePool(monster.attacks).map((a) => processAttack(a, monster))
  })

  // non-legendary only actions
  const actions = computed(() => {
    return filterByStagePool(
      monster.actions.filter((a) => !a.legendaryOnly && !a.bonusAction)
    ).map((a) => processAction(a, monster))
  })

  const bonusActions = computed(() => {
    return filterByStagePool(
      monster.actions.filter((a) => !a.legendaryOnly && a.bonusAction)
    ).map((a) => processAction(a, monster))
  })

  const multiattacks = computed(() =>
    processMultiattack(monster.multiattacks, monster)
  )

  const legendaryPreamble = computed(() =>
    processLegendaryPreamble(monster.legendaryActions, monster)
  )

  const legendaryActions = computed(() =>
    monster.legendaryActions.actions.map((a) =>
      processLegendaryAction(a.actionId, a.cost, monster)
    )
  )

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
    monster.reactions.map((r) => processReaction(r, monster))
  )

  const lairActionPreamble = computed(() => processLairActionPreamble(monster))

  const lairActions = computed(() =>
    monster.lairActions.map((la) =>
      processTokens(la.description, undefined, monster, 'none')
    )
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
    let primaryModPill = `<strong class="pill-number pill-bold">${modStr}</strong>`
    if (init.advantage) {
      primaryModPill = `<span class="dnd-adv-pill dnd-badge-adv" title="Advantage"><strong class="pill-number pill-bold">${modStr}</strong> <span class="dnd-adv-arrow">▲▲</span></span>`
    } else if (init.disadvantage) {
      primaryModPill = `<span class="dnd-disadv-pill dnd-badge-disadv" title="Disadvantage"><strong class="pill-number pill-bold">${modStr}</strong> <span class="dnd-disadv-arrow">▼▼</span></span>`
    }

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
          cells.push(`<strong class="pill-number">${bonusStr}</strong> (${label})`)
        })
      } else {
        for (let i = 0; i < extraCount; i++) {
          const label = i === extraCount - 1 ? 'Final' : `${pName} ${i + 2}`
          const bonusStr = `+${(i + 1) * 10}`
          cells.push(`<strong class="pill-number">${bonusStr}</strong> (${label})`)
        }
      }
    }

    if (cfg?.specialTrigger !== 'at_end_and_start_lair' && (cfg?.useLairInitiative || monster.lairActions?.length > 0)) {
      if (cfg?.useLairInitiative !== false) {
        const lairVal = cfg?.lairInitiative ?? 20
        cells.push(`<strong class="pill-number">${lairVal}</strong> (Lair)`)
      }
    }

    return cells
  })

  const initiative = computed(() => {
    const init = monster.initiative
    const modStr = `${init.mod >= 0 ? '+' : ''}${init.mod}`
    let modPill = `<strong class="pill-number pill-bold">${modStr}</strong>`
    if (init.advantage) {
      modPill = `<span class="dnd-adv-pill dnd-badge-adv" title="Advantage"><strong class="pill-number pill-bold">${modStr}</strong> <span class="dnd-adv-arrow">▲▲</span></span>`
    } else if (init.disadvantage) {
      modPill = `<span class="dnd-disadv-pill dnd-badge-disadv" title="Disadvantage"><strong class="pill-number pill-bold">${modStr}</strong> <span class="dnd-disadv-arrow">▼▼</span></span>`
    }
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
    return `${modPill} (<strong class="pill-number">${init.passive}</strong>${badgeStr})`
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
    saves,
    speeds,
    speedBadges,
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
