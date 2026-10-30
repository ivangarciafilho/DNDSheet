<template>
  <section v-if="activeEntry" class="composer-chain" :data-composer-chain="activeEntry.id" :aria-label="`${activeEntry.name || 'Action'}: composer`">
    <div v-for="row in chipRows" :key="row.row" class="composer-chain__row" :data-chain-row="row.row">
      <span class="composer-chain__label" aria-hidden="true">{{ rowLabels[row.row] }}</span>
      <div class="composer-chain__cells" role="group" :aria-label="rowLabels[row.row]">
        <template v-for="cell in row.cells" :key="cell.id">
        <chain-cell
          v-if="specFor(cell.id).editable !== false"
          :cell="cell"
          :spec="specFor(cell.id)"
          :value="valueFor(cell.id)"
          :validate="validatorFor(cell.id)"
          @commit="(value: unknown) => commit(cell.id, value)"
          @clear="commit(cell.id, '')"
        />
        <span v-else class="composer-chain__role-label" :data-chain-cell="cell.id">{{ cell.text }}</span>
        </template>
      </div>
    </div>

    <div class="composer-chain__row composer-preview" :data-composer-preview="activeEntry.id">
      <span class="composer-chain__label" aria-hidden="true">Preview</span>
      <div :class="previewClasses" aria-label="Live stat block preview">
        <!-- eslint-disable-next-line vue/no-v-html -- the stat block's own renderer and sanitizer produce this markup -->
        <div :class="['action', { legendary: pooled, lair: role === 'lair' }]" v-html="previewHtml"></div>
      </div>
    </div>
  </section>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue'
import { useMonsterStore } from 'src/stores/monster-store'
import { useEditorStore } from 'src/stores/editor-store'
import { useProcessTokens } from 'src/components/rendering/useProcessTokens'
import { useAutoUpdateCr } from '../useAutoUpdateCr'
import { ROLE_CHAINS } from 'src/core/domain/action-composer'
import type { ComposerCellSpec, ComposerRow } from 'src/core/domain/action-composer'
import type { ActionComposerRole } from 'src/core/domain/action-composer'
import { cellPatch, cellValue, chainView } from 'src/core/domain/composer-chain'
import type { ActionModelRole, ChainContext } from 'src/core/domain/composer-chain'
import { reactionCellPatch, reactionCellValue, reactionChainView, validateReactionCell } from 'src/core/domain/reaction-composer'
import { traitCellPatch, traitCellValue, traitChainView, validateTraitCell } from 'src/core/domain/trait-composer'
import { lairChainView } from 'src/core/domain/role-headers'
import ChainCell from './ChainCell.vue'

const ROW_LABELS: Readonly<Record<ComposerRow, string>> = {
  head: 'Head',
  mechanics: 'Roll',
  scope: 'Targets',
  outcomes: 'Outcomes',
  prose: 'Description',
}

export default defineComponent({
  name: 'ComposerChain',
  components: { ChainCell },
  props: {
    actionId: { type: String, required: true },
    role: { type: String as PropType<ActionComposerRole>, required: true },
    /** Legendary/mythic action-point cost, owned by the role list rather than the action. */
    cost: { type: Number, default: 1 },
  },
  emits: ['update:cost'],
  setup(props, { emit }) {
    const monster = useMonsterStore()
    const editor = useEditorStore()
    const { processAction, processLegendaryAction, processReaction, processTrait, processLairAction, sanitizeWebString, usageText, structuredRenderContext } = useProcessTokens()
    const { autoUpdateCr } = useAutoUpdateCr()

    // The live store object: chips write to it exactly as the studio's other controls do.
    const action = computed(() =>
      ['action', 'bonus_action', 'legendary', 'mythic'].includes(props.role)
        ? monster.actions.find((candidate) => candidate.id === props.actionId)
        : undefined
    )
    const reaction = computed(() => props.role === 'reaction'
      ? monster.reactions.find((candidate) => candidate.id === props.actionId)
      : undefined)
    const trait = computed(() => props.role === 'trait'
      ? monster.traits.find((candidate) => candidate.id === props.actionId)
      : undefined)
    const lair = computed(() => props.role === 'lair'
      ? monster.lairActions.find((candidate) => candidate.id === props.actionId)
      : undefined)
    const activeEntry = computed(() => action.value ?? reaction.value ?? trait.value ?? (lair.value ? { id: lair.value.id, name: 'Lair Action' } : undefined))
    const pooled = computed(() => props.role === 'legendary' || props.role === 'mythic')

    const context = computed<ChainContext>(() => {
      const current = action.value
      if (!current) return {}
      const { renderContext } = structuredRenderContext(current, monster)
      return {
        usage: pooled.value ? (props.cost > 1 ? `Costs ${props.cost} Actions` : '1 Action') : usageText(current),
        attackBonus: renderContext.attackBonus,
        saveDc: renderContext.saveDc,
      }
    })

    // Description stays in the rich text editor below the chain; the chips cover everything before it.
    const chipRows = computed(() => {
      if (action.value && ['action', 'bonus_action', 'legendary', 'mythic'].includes(props.role)) {
        return chainView(props.role as ActionModelRole, action.value, context.value).filter((row) => row.row !== 'prose')
      }
      if (reaction.value) return reactionChainView(reaction.value, usageText(reaction.value))
      if (trait.value) return traitChainView(trait.value)
      if (lair.value) return lairChainView()
      return []
    })

    const specFor = (cellId: string): ComposerCellSpec =>
      ROLE_CHAINS[props.role].find((spec) => spec.id === cellId) as ComposerCellSpec

    const valueFor = (cellId: string): unknown => {
      if (pooled.value && cellId === 'usage') return String(props.cost)
      if (action.value) return cellValue(action.value, cellId)
      if (reaction.value) return reactionCellValue(reaction.value, cellId)
      if (trait.value) return traitCellValue(trait.value, cellId)
      return undefined
    }

    const validatorFor = (cellId: string) =>
      props.role === 'reaction' ? (value: unknown) => validateReactionCell(cellId, value)
        : props.role === 'trait' ? (value: unknown) => validateTraitCell(cellId, value) : undefined

    const commit = (cellId: string, value: unknown) => {
      const current = action.value
      if (current && pooled.value && cellId === 'usage') {
        emit('update:cost', Math.min(3, Math.max(1, Number(value) || 1)))
        return
      }
      if (current) {
        const target = current as unknown as Record<string, unknown>
        for (const [key, next] of Object.entries(cellPatch(current, cellId, value))) target[key] = next
        if (current.crAnnotation) autoUpdateCr(current.description, current.crAnnotation, current)
        return
      }
      const currentReaction = reaction.value
      if (currentReaction) {
        const target = currentReaction as unknown as Record<string, unknown>
        for (const [key, next] of Object.entries(reactionCellPatch(currentReaction, cellId, value))) target[key] = next
      }
      if (trait.value) Object.assign(trait.value, traitCellPatch(trait.value, cellId, value))
    }

    // Parity by construction: the same per-entry renderer and sanitizer the stat block uses.
    const previewHtml = computed(() => {
      const current = action.value
      if (current) return sanitizeWebString(pooled.value ? processLegendaryAction(current.id, props.cost, monster) : processAction(current, monster))
      const currentReaction = reaction.value
      if (currentReaction) return sanitizeWebString(processReaction(currentReaction, monster))
      if (trait.value) return sanitizeWebString(processTrait(trait.value, monster))
      return lair.value ? sanitizeWebString(processLairAction(lair.value, monster, true)) : ''
    })

    const previewClasses = computed(() => [
      'statblock',
      {
        mm2014: editor.style === '2014',
        mm2024: editor.style === '2024',
        'modern-modular': editor.visualTemplate === 'modern',
      },
      `theme-${editor.visualTheme || 'wotc'}`,
    ])

    return { activeEntry, pooled, chipRows, specFor, valueFor, validatorFor, commit, previewHtml, previewClasses, rowLabels: ROW_LABELS }
  },
})
</script>

<style scoped src="./composer-chain.css"></style>
