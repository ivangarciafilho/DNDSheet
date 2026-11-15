import type { useProcessTokens as UseProcessTokens } from './useProcessTokens'
import { type BasicRiderScope } from 'src/core/domain/basic-riders'
import { formatLanguageItem, formatLanguagesList } from 'src/core/domain/defense-and-traits-utils'
import { formatDistanceUnit } from 'src/core/domain/number-grammar'
import { computed } from 'vue'
import type { MonsterSenseItem } from 'src/core/domain/types'
import type { useMonsterStore as UseMonsterStore } from 'src/stores/monster-store'

/** Senses and languages: badges, compact lines and their basic riders. Extracted verbatim from useTextRenderer (C1b). */
export function useSensesLanguagesText(monster: ReturnType<typeof UseMonsterStore>, { formattedNumeric, basicRiderText, processTokens }: {
  formattedNumeric: (path: string, text: string | number) => string
  basicRiderText: (scope: BasicRiderScope) => string[]
  processTokens: ReturnType<typeof UseProcessTokens>['processTokens']
}) {
  const formatSingleSenseItem = (item: MonsterSenseItem, omitScope = false): string => {
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
    // The author's note belongs to every sense kind, so it is collected before any kind returns.
    if (item.note && item.note.trim()) notes.push(item.note.trim())

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
      const planarGroup: MonsterSenseItem[] = []
      const nonPlanar: MonsterSenseItem[] = []

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

  return { formatSingleSenseItem, sensesBadges, senses, baseLanguagesBadges, languagesBadges, baseLanguages, languages }
}
