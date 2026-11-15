import { computed } from 'vue'
import { mechanicRichHtml } from 'src/core/domain/mechanic-rich-text'
import { formatDefenseItem, formatDefenseList } from 'src/core/domain/defense-and-traits-utils'
import type { DamageDefenseItem } from 'src/core/domain/types'
import type { useMonsterStore as UseMonsterStore } from 'src/stores/monster-store'
import { advHtml, escapeHtml } from './advFormat'

export type DefenseRow = { key: string; title: string; scopeLabel: string; subTypeLabel: string; damageItems: string[]; conditionItems: string[]; items: string[]; formattedText: string; formattedProse: string; isVerbose: boolean }

/** Vulnerability, resistance, immunity and condition lines (plain, split and cascading). Extracted verbatim from useTextRenderer (C1b). */
export function useDefenseText(monster: ReturnType<typeof UseMonsterStore>) {
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
    const getItems = (list: DamageDefenseItem[] | undefined, fallback: string[] | undefined): DefenseEntry[] => {
      if (Array.isArray(list) && list.length > 0) {
        const advList: { name: string; item: DamageDefenseItem }[] = []
        const disadvList: { name: string; item: DamageDefenseItem }[] = []

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
          if (text) entries.push({ text, html: mechanicRichHtml(text) })
        }

        return entries
      }
      if (Array.isArray(fallback) && fallback.length > 0) {
        return fallback
          .map((s) => String(s).trim())
          .filter(Boolean)
          .map((text) => ({ text, html: mechanicRichHtml(text) }))
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
        const rows: DefenseRow[] = []
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

    const categoryOrder = Array.isArray(monster.defenseCategoryOrder) && monster.defenseCategoryOrder.length === 3
      ? monster.defenseCategoryOrder
      : ['vulnerabilities', 'resistances', 'immunities']

    const sections: DefenseRow[] = []
    for (const cat of categoryOrder) {
      if (cat === 'vulnerabilities') {
        const splitVuln = Boolean(monster.splitVulnRows || monster.splitDefenseRows?.vulnerabilities)
        sections.push(...buildUnifiedSection('vulnerabilities', 'Vulnerabilities', vulnDamages, vulnConditions, splitVuln))
      } else if (cat === 'resistances') {
        const splitRes = Boolean(monster.splitResRows || monster.splitDefenseRows?.resistances)
        sections.push(...buildUnifiedSection('resistances', 'Resistances', resDamages, resConditions, splitRes))
      } else if (cat === 'immunities') {
        const splitImm = Boolean(monster.splitImmRows || monster.splitDefenseRows?.immunities)
        sections.push(...buildUnifiedSection('immunities', 'Immunities', immDamages, immConditions, splitImm))
      }
    }

    return sections
  })

  return { resistances, conditionResistances, immunities, vulnerabilities, conditionVulnerabilities, conditions, immunitiesAndConditions, cascadingDefenses }
}
