import { formatBasicRider, formatRiderSchedule, type DefenseEffect, type BasicRiderScope, type HpRiderGroup } from 'src/core/domain/basic-riders'
import { mechanicRichHtml } from 'src/core/domain/mechanic-rich-text'
import { castingLearningSummary, hasCastingSources } from 'src/core/usecases/AutoSyncSpellcasting'
import { buildCastingProjection } from 'src/core/domain/casting-projection'
import { useSpellsStore } from 'src/stores/spells-store'
import { formatNumericPresentation } from 'src/core/domain/numeric-presentation'
import { formatMinimalistRegen, formatMinimalistDeathPrevention, resolveDynamicNumericSource, composeInvulnerabilityRuling, resolveInvulnerabilityDisplayLocation, composeAcAndDefenses, DynamicValueContext } from 'src/core/domain/defense-and-traits-utils'
import { formatInitiativeRiders } from 'src/core/domain/initiative-composer'
import { cleanPunctuation, formatDistanceUnit } from 'src/core/domain/number-grammar'
import { CR } from 'src/data/CR'
import { useMonsterStore } from 'src/stores/monster-store'
import { computed } from 'vue'
import type { ComputedRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { renderBonus, statModifier, saveModifierForStat, bonusForSkill, safeToOrdinal } from './mathRendering'
import { useProcessTokens } from './useProcessTokens'
import { useEditorStore } from 'src/stores/editor-store'
import { DndStat } from '../models'
import { skillGroupPlacement } from 'src/core/domain/skill-action-groups'
import type { CombatSkillGroupId, SkillActionType } from 'src/core/domain/skill-action-groups'
import { advHtml, condHtml, escapeHtml, numHtml } from './advFormat'
import { describePools } from 'src/core/domain/paragon-pools'
import { useDefenseText } from './useDefenseText'
import { useEncounterDynamicsText } from './useEncounterDynamicsText'
import { useSensesLanguagesText } from './useSensesLanguagesText'
import { useTraitsText } from './useTraitsText'
import { useSpeedsText } from './useSpeedsText'
import { useCheckRowsText } from './useCheckRowsText'

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

  const acBadges = computed(() => [...armorBadges.value, ...basicRiderText('ac').map(mechanicRichHtml)])

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
        if (loc === 'ac' && (!res.isAbsoluteRule || monster.splitAcRiderRows)) {
          const ruling = composeInvulnerabilityRuling(inv)
          if (ruling && !badges.includes(ruling)) badges.push(ruling)
        }
      }
      return badges
    }

    const splitAc = Boolean(monster.splitAcRiderRows)
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
    const src = ext.bloodiedSource || ext.bloodiedValueSource
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
      basicRiderText(group).map(text => ({ group, text: mechanicRichHtml(text) })))
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
  const { speeds, speedBaseBadges, speedRiderBadges, speedBadges } = useSpeedsText(monster, { formattedNumeric, basicRiderText, options })

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

  const { resistances, conditionResistances, immunities, vulnerabilities, conditionVulnerabilities, conditions, immunitiesAndConditions, cascadingDefenses } = useDefenseText(monster)

  const { formatScoreGroups, formatGroupRow, toolCheckEntry, combatSkillRows, actionPassivesGroups, actionPassives } = useCheckRowsText(monster, { t, options })

  const { sensesBadges, senses, languagesBadges, languages } = useSensesLanguagesText(monster, { formattedNumeric, basicRiderText, processTokens })

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

  const { filterByStagePool, traits, groupedTraits } = useTraitsText(monster, { processTrait, dynCtx, scheduleDefense })

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
    const aop = monster.actionOrientedPassives
    const editorPassives = monster.passives
    const placementFor = (groupId: CombatSkillGroupId, actionType: SkillActionType = 'Action') =>
      skillGroupPlacement(groupId, actionType, editorPassives, aop, monster as unknown as Record<string, unknown>)
    const rows = combatSkillRows.value
    const actionResults = rows
      .filter((row) => placementFor(row.id, row.actionType) === targetPlacement)
      .map((row) => {
        const name = targetPlacement === 'legendary' ? `${row.label} (Costs 1 Action)` : row.label
        const formattedScores = formatGroupRow(row)
        const rider = (aop?.riders?.[row.id] ?? editorPassives?.riders?.[row.id] ?? '').trim()
        if (options.web !== false) {
          return buildPlateEntry(monster, { name, scores: formattedScores }, rider)
        }
        return `<b><i>${name} ${formattedScores}.</i></b>${rider ? ` ${rider}` : ''}`
      })

    // Tools relocation
    const defaultToolAction: SkillActionType = editorPassives?.toolsActionType === 'Bonus Action' || aop?.bonusActionTools || monster.toolsActionType === 'Bonus Action' ? 'Bonus Action' : 'Action'
    const tools = (Array.isArray(monster.tools) ? monster.tools : []).filter(tool => {
      const actionType = typeof tool.bonusAction === 'boolean' ? (tool.bonusAction ? 'Bonus Action' : 'Action') : defaultToolAction
      return placementFor('tools', actionType) === targetPlacement
    })
    if (tools.length > 0) {
      const label = targetPlacement === 'legendary' ? 'Use Tool (Costs 1 Action)' : 'Use Tool'
      const formattedScores = formatScoreGroups(tools.map(toolCheckEntry))
      const rider = (aop?.riders?.['tools'] ?? editorPassives?.riders?.['tools'] ?? '').trim()
      if (options.web !== false) {
        actionResults.push(buildPlateEntry(monster, { name: label, scores: formattedScores }, rider))
      } else {
        actionResults.push(`<b><i>${label} ${formattedScores}.</i></b>${rider ? ` ${rider}` : ''}`)
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

  const { villainActionsList, bloodiedActionsList, reactiveActionsList, comboActionsList, anatomyPartsList, runehammerTrackData, paragonData } = useEncounterDynamicsText(monster, { processTokens })

  // Stat-line text (notes, riders, badges) resolves the same formulas and macros as prose:
  // any field may hold {SPELL_DC}, {2d6 + STR_MOD} or the author's own variables.
  const resolveInline = (value: unknown, depth = 0): unknown => {
    if (typeof value === 'string') return value.includes('{') ? processTokens(value, undefined as never, monster, 'none') : value
    if (depth > 4 || !value || typeof value !== 'object') return value
    if (Array.isArray(value)) return value.map((item) => resolveInline(item, depth + 1))
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, resolveInline(item, depth + 1)]))
  }
  const resolved = <T>(source: ComputedRef<T>) => computed(() => resolveInline(source.value) as T)

  return {
    stats,
    acInvulnerability,
    acBadges: resolved(acBadges),
    hp: resolved(hp),
    hpBadges: resolved(hpBadges),
    hpBadgeEntries: resolved(hpBadgeEntries),
    saves,
    speeds: resolved(speeds),
    speedBadges: resolved(speedBadges),
    speedBaseBadges: resolved(speedBaseBadges),
    speedRiderBadges: resolved(speedRiderBadges),
    skills: resolved(skills),
    tools: resolved(tools),
    vulnerabilities: resolved(vulnerabilities),
    conditionVulnerabilities: resolved(conditionVulnerabilities),
    resistances: resolved(resistances),
    conditionResistances: resolved(conditionResistances),
    immunities: resolved(immunities),
    conditions: resolved(conditions),
    cascadingDefenses: resolved(cascadingDefenses),
    senses: resolved(senses),
    sensesBadges: resolved(sensesBadges),
    languages: resolved(languages),
    languagesBadges: resolved(languagesBadges),
    cr: resolved(cr),
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
    inventory: resolved(inventory),
    initiative: resolved(initiative),
    initiativeCells,
    statsAndSavesByKey,
    immunitiesAndConditions,
    actionPassives: resolved(actionPassives),
    actionPassivesGroups: resolved(actionPassivesGroups),
    groupedTraits: resolved(groupedTraits),
    villainActionsList,
    bloodiedActionsList,
    reactiveActionsList,
    comboActionsList,
    anatomyPartsList,
    runehammerTrackData,
    paragonData,
  }
}
