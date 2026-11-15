import { computed, type ComputedRef, type InjectionKey } from 'vue'
import type { useMonsterStore as UseMonsterStore } from 'src/stores/monster-store'
import type { useTextRenderer } from './useTextRenderer'
import type { useProcessTokens } from './useProcessTokens'
import type { resolveSpellcastingPlacement } from 'src/core/domain/export-contract'
import { mechanicRichHtml } from 'src/core/domain/mechanic-rich-text'
import type WebSpellPlates from './WebSpellPlates.vue'

/**
 * Web-sanitised lines for the stat-block body: grouped traits, then attacks, actions, bonus actions, multiattack,
 * legendary and mythic, reactions, lair, random tables, regional effects and inventory.
 * Moved verbatim from WebRenderer (C1b); StatblockTraits and StatblockActions render them.
 */
export function useStatblockBodyView({ monster, textRenderer, sanitizeWebString, processLairAction }: {
  monster: ReturnType<typeof UseMonsterStore>
  textRenderer: ReturnType<typeof useTextRenderer>
  sanitizeWebString: (value: string) => string
  processLairAction: ReturnType<typeof useProcessTokens>['processLairAction']
}) {
    const sanitizedGroupedTraits = computed(() => {
      const raw = textRenderer.groupedTraits.value
      return {
        standard: raw.standard.map((t) => sanitizeWebString(t)),
        conditionals: raw.conditionals.map((c) => ({
          trigger: c.trigger,
          traits: c.traits.map((t) => sanitizeWebString(t)),
        })),
        rechargeSections: raw.rechargeSections.map((r) => ({
          section: r.section,
          traits: r.traits.map((t) => sanitizeWebString(t)),
        })),
      }
    })

    const hasGroupedTraits = computed(() => {
      const g = sanitizedGroupedTraits.value
      return (
        g.standard.length > 0 ||
        g.conditionals.length > 0 ||
        g.rechargeSections.length > 0 ||
        monster.mythicActions.actions.length > 0
      )
    })
    const attacks = computed(() =>
      textRenderer.attacks.value.map((a) => sanitizeWebString(a))
    )

    const actions = computed(() =>
      textRenderer.actions.value.map((a) => sanitizeWebString(a))
    )

    const bonusActions = computed(() =>
      textRenderer.bonusActions.value.map((a) => sanitizeWebString(a))
    )

    const multiattacks = computed(() =>
      sanitizeWebString(textRenderer.multiattacks.value)
    )

    const legendaryPreamble = computed(() =>
      sanitizeWebString(textRenderer.legendaryPreamble.value)
    )

    const legendaryActions = computed(() =>
      textRenderer.legendaryActions.value.map((a) => sanitizeWebString(a))
    )

    const mythicTrait = computed(() =>
      sanitizeWebString(textRenderer.mythicTrait.value)
    )

    const mythicPreamble = computed(() =>
      sanitizeWebString(textRenderer.mythicPreamble.value)
    )

    const mythicActions = computed(() =>
      textRenderer.mythicActions.value.map((a) => sanitizeWebString(a))
    )

    const reactions = computed(() =>
      textRenderer.reactions.value.map((r) => sanitizeWebString(r))
    )

    const lairActionPreamble = computed(() =>
      sanitizeWebString(textRenderer.lairActionPreamble.value)
    )

    const lairActions = computed(() =>
      monster.lairActions.map((la) => sanitizeWebString(processLairAction(la, monster, true)))
    )

    const regionalEffectPreamble = computed(() =>
      sanitizeWebString(textRenderer.regionalEffectPreamble.value)
    )

    // A11.9: sorted copies so the template never mutates stored rows.
    const randomTables = computed(() =>
      (monster.randomTables ?? []).map((rt) => ({ ...rt, sortedRows: [...rt.rows].sort((a, b) => a.min - b.min) }))
    )

    const regionalEffects = computed(() =>
      textRenderer.regionalEffects.value.map((re) => sanitizeWebString(re))
    )

    const inventory = computed(() =>
      sanitizeWebString(textRenderer.inventory.value)
    )

    return { sanitizedGroupedTraits, hasGroupedTraits, attacks, actions, bonusActions, multiattacks, legendaryPreamble, legendaryActions, mythicTrait, mythicPreamble, mythicActions, reactions, lairActionPreamble, lairActions, regionalEffectPreamble, randomTables, regionalEffects, inventory }
}

/** What StatblockTraits and StatblockActions read: the lines above plus the sheet bindings it shares with the parent. */
export type StatblockBodyView = ReturnType<typeof useStatblockBodyView> & {
  monster: ReturnType<typeof UseMonsterStore>
  blockStyle: ComputedRef<{ mm2014: boolean; mm2024: boolean; condenseImmunities: boolean }>
  mechanicRichHtml: typeof mechanicRichHtml
  resolvedSpellPlacement: ComputedRef<ReturnType<typeof resolveSpellcastingPlacement>>
  spellPlatesBind: ComputedRef<InstanceType<typeof WebSpellPlates>['$props']>
}
export const STATBLOCK_BODY: InjectionKey<StatblockBodyView> = Symbol('statblock-body')
