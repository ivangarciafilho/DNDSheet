<template>
  <section v-if="activeEntry" class="composer-chain" :data-composer-chain="activeEntry.id" :aria-label="`${activeEntry.name || 'Action'}: composer`">
    <div v-for="row in chipRows" :key="row.row" class="composer-chain__row" :data-chain-row="row.row">
      <span class="composer-chain__label" aria-hidden="true">{{ rowLabels[row.row] }}</span>
      <div class="composer-chain__cells" role="group" :aria-label="rowLabels[row.row]">
        <chain-cell
          v-for="cell in row.cells"
          :key="cell.id"
          :cell="cell"
          :spec="specFor(cell.id)"
          :value="valueFor(cell.id)"
          :validate="validatorFor(cell.id)"
          @commit="(value: unknown) => commit(cell.id, value)"
          @clear="commit(cell.id, '')"
        />
      </div>
    </div>

    <div class="composer-chain__row composer-preview" :data-composer-preview="activeEntry.id">
      <span class="composer-chain__label" aria-hidden="true">Preview</span>
      <div :class="previewClasses" aria-label="Live stat block preview">
        <!-- eslint-disable-next-line vue/no-v-html -- the stat block's own renderer and sanitizer produce this markup -->
        <div :class="['action', { legendary: pooled }]" v-html="previewHtml"></div>
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
    const { processAction, processLegendaryAction, processReaction, sanitizeWebString, usageText, structuredRenderContext } = useProcessTokens()
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
    const activeEntry = computed(() => action.value ?? reaction.value)
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
      return []
    })

    const specFor = (cellId: string): ComposerCellSpec =>
      ROLE_CHAINS[props.role].find((spec) => spec.id === cellId) as ComposerCellSpec

    const valueFor = (cellId: string): unknown => {
      if (pooled.value && cellId === 'usage') return String(props.cost)
      if (action.value) return cellValue(action.value, cellId)
      if (reaction.value) return reactionCellValue(reaction.value, cellId)
      return undefined
    }

    const validatorFor = (cellId: string) =>
      props.role === 'reaction' ? (value: unknown) => validateReactionCell(cellId, value) : undefined

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
    }

    // Parity by construction: the same per-entry renderer and sanitizer the stat block uses.
    const previewHtml = computed(() => {
      const current = action.value
      if (current) return sanitizeWebString(pooled.value ? processLegendaryAction(current.id, props.cost, monster) : processAction(current, monster))
      const currentReaction = reaction.value
      return currentReaction ? sanitizeWebString(processReaction(currentReaction, monster)) : ''
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

<style scoped>
.composer-chain {
  margin: 6px 0;
  padding: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.18);
}

.composer-chain__row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 3px 0;
}

.composer-chain__label {
  flex: 0 0 64px;
  padding-top: 6px;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #9e9e9e;
}

.composer-chain__cells {
  display: flex;
  flex: 1 1 auto;
  flex-wrap: wrap;
  gap: 4px;
  min-width: 0;
}

.composer-preview {
  margin-top: 6px;
  padding-top: 8px;
  border-top: 1px dashed rgba(255, 255, 255, 0.18);
}

/* Layout only: the stat block's own rules paint the plate inside. */
.composer-preview .statblock {
  flex: 1 1 auto;
  min-width: 0;
  width: auto;
  max-width: 100%;
  margin: 0;
  padding: 6px 8px;
  border-radius: 4px;
  box-shadow: none;
}

/*
 * The sheet's base type and entry spacing live in WebRenderer's scoped styles, which cannot reach this preview.
 * They are restated at the sheet's own specificity (`:where` adds none) so theme rules win or lose alike.
 */
:where(.composer-preview) .statblock {
  color: #000;
  font-family: ff-scala-sans-pro;
  font-size: 1rem;
  letter-spacing: 0.01em;
}

:where(.composer-preview) .statblock.mm2024 {
  font-weight: 400;
  letter-spacing: 0.3px;
}

:where(.composer-preview) .statblock .action {
  line-height: 1.15rem;
}

:where(.composer-preview) .statblock .legendary.action {
  margin-left: 20px;
  text-indent: -20px;
}

:where(.composer-preview) .statblock.mm2024 .action {
  line-height: 1.2em;
}

:where(.composer-preview) .statblock.mm2024 .legendary.action {
  margin-left: 0;
  text-indent: 0;
}

@media (max-width: 599px) {
  .composer-chain__row {
    flex-direction: column;
    gap: 2px;
  }

  .composer-chain__label {
    flex-basis: auto;
    padding-top: 0;
  }
}
</style>
