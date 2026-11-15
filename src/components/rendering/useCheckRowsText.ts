import { mechanicPlainText } from 'src/core/domain/mechanic-rich-text'
import { computed } from 'vue'
import type { SkillPassivePreference } from 'src/core/domain/skill-passive-state'
import { useI18n } from 'vue-i18n'
import { renderBonus, statModifier, bonusForSkill } from './mathRendering'
import { DndStat } from '../models'
import { SKILL } from 'src/data/SKILL'
import { SKILL_ACTION_GROUPS, computeSkillGroupLayout, effectiveAdvantage, mergeIdenticalEntries, normalizeSkillKey, passiveConfigKey, passiveScore, skillGroupPlacement } from 'src/core/domain/skill-action-groups'
import type { CombatSkillGroupId, SkillActionType, SkillCheckEntry, SkillCheckInput, SkillGroupRow } from 'src/core/domain/skill-action-groups'
import { advHtml, condHtml, escapeHtml, htmlToText, numHtml } from './advFormat'
import type { useMonsterStore as UseMonsterStore } from 'src/stores/monster-store'

/** Search / Study / Influence / Hide check rows, remaining skills and tools, action-oriented passives. Extracted verbatim from useTextRenderer (C1b). */
export function useCheckRowsText(monster: ReturnType<typeof UseMonsterStore>, { t, options }: {
  t: ReturnType<typeof useI18n>['t']
  options: { web?: boolean }
}) {
  // Search / Study / Influence / Hide rows, then leftover Skills and Tools rows.
  // Grouping rules live in src/core/domain/skill-action-groups.ts.
  const skillLabel = (key: string, fallback?: string): string => {
    const path = `skill.${key}`
    const label = t(path)
    return label === path ? fallback || key : label
  }

  // Skill and tool names: italic, never bold — bold is reserved for numbers.
  const skillNameHtml = (label: string): string => `<em class="dnd-skill-name">${escapeHtml(label)}</em>`

  const formatCheckEntry = (entry: SkillCheckEntry, labels: string[]): string => {
    const inner = `${numHtml(`${entry.passive}/${renderBonus(entry.bonus)}`)}, ${labels.map(skillNameHtml).join(', ')}${condHtml(entry.condition)}`
    return `<span class="dnd-check">${advHtml(inner, entry.advantage, entry.disadvantage)}</span>`
  }

  const formatScoreGroups = (entries: SkillCheckEntry[], row?: SkillGroupRow): string => {
    const groups = mergeIdenticalEntries(entries).map(({ entry, labels }) => ({
      passive: entry.passive, bonus: entry.bonus, html: formatCheckEntry(entry, labels),
    }))
    if (row?.base && row.baseSkillKeys?.length) {
      const { passive, bonus } = row.base
      const labels = row.baseSkillKeys.map(key => skillNameHtml(skillLabel(key)))
      groups.push({ passive, bonus, html: [numHtml(`${passive}/${renderBonus(bonus)}`), ...labels].join(', ') })
    }
    const content = groups.sort((left, right) => left.passive - right.passive || left.bonus - right.bonus)
      .map(group => '(' + group.html + ')').join(', ')
    return options.web === false ? mechanicPlainText(content) : content
  }

  const formatGroupRow = (row: SkillGroupRow) => formatScoreGroups(row.entries, row)

  const toolCheckEntry = (tool: NonNullable<typeof monster.tools>[number]): SkillCheckEntry => {
    const bonus = tool.override
      ? tool.overrideValue
      : statModifier(monster.stats[tool.stat] ?? 10) +
        (tool.proficient ? monster.proficiency : 0) +
        (tool.expertise ? monster.proficiency : 0)
    const mode = effectiveAdvantage(tool.advantage, tool.disadvantage)
    return {
      key: tool.id,
      label: tool.name,
      stat: tool.stat,
      passive: passiveScore(bonus, tool.advantage, tool.disadvantage),
      bonus,
      advantage: mode === 'advantage',
      disadvantage: mode === 'disadvantage',
      condition: tool.condition?.trim() ?? '',
    }
  }

  const combatSkillRows = computed(() => {
    const aop = monster.actionOrientedPassives
    const editorPassives = monster.passives
    const passiveCfg = (key: string) => {
      const cfgKey = passiveConfigKey(key)
      // Index-signature entries of SkillPassiveState hold one preference per skill key.
      return (editorPassives?.[cfgKey] ?? editorPassives?.[cfgKey.toLowerCase()]) as Partial<SkillPassivePreference> | undefined
    }
    const sharedCondition = (key: string): string => {
      const cfgKey = passiveConfigKey(key)
      const raw = aop?.conditions?.[cfgKey] ?? aop?.conditions?.[cfgKey.toLowerCase()]
      return typeof raw === 'string' ? raw.trim() : ''
    }
    const statOf = (key: string): DndStat => (SKILL as Record<string, { stat: DndStat } | undefined>)[key]?.stat ?? 'INT'
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

    // 2. Untrained skills use their own ability, including in mixed-ability groups.
    for (const group of SKILL_ACTION_GROUPS) {
      for (const key of group.skills) {
        if (seen.has(key)) continue
        const cfg = passiveCfg(key)
        const condition = cfg?.condition?.trim() || sharedCondition(key)
        const override = cfg?.override && cfg.overrideValue != null ? Number(cfg.overrideValue) : passivePerceptionOverride(key)
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
    const aop = monster.actionOrientedPassives
    const editorPassives = monster.passives
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
      const defaultToolAction = editorPassives?.toolsActionType === 'Bonus Action' || aop?.bonusActionTools || monster.toolsActionType === 'Bonus Action' ? 'Bonus Action' : 'Action'
      for (const actionType of ['Action', 'Bonus Action'] as SkillActionType[]) {
        const entries = monster.tools
          .filter((tool) => (typeof tool.bonusAction === 'boolean' ? (tool.bonusAction ? 'Bonus Action' : 'Action') : defaultToolAction) === actionType)
          .map(toolCheckEntry)
        if (entries.length > 0) {
          const html = formatScoreGroups(entries)
          groups.push({
            name: `Use Tool (${actionType})`,
            scopeLabel: 'Use Tool',
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

  return { skillLabel, skillNameHtml, formatCheckEntry, formatScoreGroups, formatGroupRow, toolCheckEntry, combatSkillRows, actionPassivesGroups, actionPassives }
}
