import { computed, type ComputedRef, type InjectionKey } from 'vue'
import type { useMonsterStore as UseMonsterStore } from 'src/stores/monster-store'
import type { useEditorStore as UseEditorStore } from 'src/stores/editor-store'
import type { useTextRenderer } from './useTextRenderer'
import type { DefenseRow } from './useDefenseText'
import { mechanicRichHtml } from 'src/core/domain/mechanic-rich-text'

/** True when a vital row is long enough to need its own stripe. Pure; shared by the sheet and its vitals section. */
export const shouldStripeVital = (label: string, content: unknown): boolean => {
      let raw = ''
      if (Array.isArray(content)) raw = content.join(' ')
      else if (content && typeof content === 'object') {
        if ('value' in content) raw = String(content.value || '')
        else raw = JSON.stringify(content)
      } else raw = String(content || '')
      const text = raw.replace(/<[^>]*>/g, '').replace(/&[a-z#0-9]+;/gi, ' ').trim()
      return (String(label || '').length + text.length) > 42
    }

/**
 * Everything the vitals section (defenses, speed, senses, languages, scores, gear, checks) reads, in one view.
 * Built once by WebRenderer and provided to StatblockVitals; the bindings were moved verbatim from WebRenderer (C1b).
 */
export function useStatblockVitalsView({ monster, editorStore, textRenderer, sanitizeWebString, blockStyle, cascadingDefenses, inventory }: {
  monster: ReturnType<typeof UseMonsterStore>
  editorStore: ReturnType<typeof UseEditorStore>
  textRenderer: ReturnType<typeof useTextRenderer>
  sanitizeWebString: (value: string) => string
  blockStyle: ComputedRef<{ mm2014: boolean; mm2024: boolean; condenseImmunities: boolean }>
  cascadingDefenses: ComputedRef<DefenseRow[]>
  inventory: ComputedRef<string>
}) {
    const actionPassivesGroups = computed(() => textRenderer.actionPassivesGroups.value)
    const senses = computed(() => sanitizeWebString(textRenderer.senses.value))
    const languages = computed(() => sanitizeWebString(textRenderer.languages.value))
    const sensesBadges = computed(() => textRenderer.sensesBadges?.value || [])
    const languagesBadges = computed(() => textRenderer.languagesBadges?.value || [])
    const speedBadges = computed(() => textRenderer.speedBadges?.value || [])
    const speedBaseBadges = computed(() => textRenderer.speedBaseBadges?.value || [])
    const speedRiderBadges = computed(() => textRenderer.speedRiderBadges?.value || [])

    const vitalsStripingMap = computed(() => {
      // Clean alternating row indexing across visible vital statistics rows
      // Order: AC (0) -> HP (1) -> cascadingDefenses (2, 3...) -> Speed -> Senses -> Languages -> Gear
      let rowCounter = 0
      const map: Record<string, boolean> = {}

      // AC
      map['ac'] = rowCounter % 2 === 1
      rowCounter++

      // HP
      map['hp'] = rowCounter % 2 === 1
      rowCounter++

      if (blockStyle.value.mm2024) {
        for (const defSec of cascadingDefenses.value) {
          map['def_' + defSec.key] = rowCounter % 2 === 1
          rowCounter++
        }
        map['speed'] = rowCounter % 2 === 1
        rowCounter++

        if (sensesBadges.value.length > 0) {
          map['senses'] = rowCounter % 2 === 1
          rowCounter++
        }
        map['languages'] = rowCounter % 2 === 1
        rowCounter++

        if (monster.inventory !== '' && monster.inventory !== '<br>') {
          map['gear'] = rowCounter % 2 === 1
          rowCounter++
        }
      } else {
        map['speed'] = rowCounter % 2 === 1
        rowCounter++
      }

      return map
    })

    const acStripe = computed(() => vitalsStripingMap.value['ac'] ?? false)
    const hpStripe = computed(() => vitalsStripingMap.value['hp'] ?? true)
    const speedStripe = computed(() => vitalsStripingMap.value['speed'] ?? false)
    const sensesStripe = computed(() => vitalsStripingMap.value['senses'] ?? true)
    const languagesStripe = computed(() => vitalsStripingMap.value['languages'] ?? false)
    const isDefenseStriped = (key: string) => vitalsStripingMap.value['def_' + key] ?? false

    // The parent exposes these through its `...textRenderer` spread; the view passes the same refs.
    const { statsAndSavesByKey, stats, saves } = textRenderer
    return { monster, editorStore, blockStyle, cascadingDefenses, inventory, mechanicRichHtml, shouldStripeVital, statsAndSavesByKey, stats, saves, actionPassivesGroups, senses, languages, sensesBadges, languagesBadges, speedBadges, speedBaseBadges, speedRiderBadges, vitalsStripingMap, acStripe, hpStripe, speedStripe, sensesStripe, languagesStripe, isDefenseStriped }
}

export type StatblockVitalsView = ReturnType<typeof useStatblockVitalsView>
export const STATBLOCK_VITALS: InjectionKey<StatblockVitalsView> = Symbol('statblock-vitals')
