<template>
  <section v-if="activeEntry" class="composer-chain" :data-composer-chain="activeEntry.id" :aria-label="`${activeEntry.name || 'Action'}: composer`">
    <div v-for="row in chipRows" :key="row.row" class="composer-chain__row" :data-chain-row="row.row">
      <span class="composer-chain__label" aria-hidden="true">{{ rowLabels[row.row] }}</span>
      <div class="composer-chain__cells" role="group" :aria-label="rowLabels[row.row]">
        <slot v-if="row.row === 'head'" name="head-prefix" />
        <template v-for="cell in row.cells" :key="cell.id">
        <chain-cell
          v-if="specFor(cell.id).editable !== false"
          :cell="cell"
          :spec="specFor(cell.id)"
          :value="valueFor(cell.id)"
          :validate="validatorFor(cell.id)"
          :numeric-path="numericPathFor(cell.id)"
          :numeric-draft-model="numericDraftModel"
          @commit="(value: unknown, binding: NumericBinding | null | undefined) => commit(cell.id, value, binding)"
          @clear="commit(cell.id, '')"
        />
        <span v-else class="composer-chain__role-label" :data-chain-cell="cell.id">{{ cell.text }}</span>
        </template>
        <q-btn-toggle
          v-if="row.row === 'trigger' && reaction"
          :model-value="reaction.triggerPlacement === 'end' ? 'end' : 'start'"
          data-trigger-placement
          dense no-caps unelevated size="sm" toggle-color="amber-9" color="grey-9"
          :options="[{ label: 'Before text', value: 'start' }, { label: 'After text', value: 'end' }]"
          aria-label="Trigger placement in the printed text"
          @update:model-value="(value: string) => commit('trigger-placement', value)"
        ><q-tooltip class="dnd-tip">Print the trigger before the response (the 2024 default) or after it.</q-tooltip></q-btn-toggle>
      </div>
    </div>


  </section>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue'
import { useMonsterStore } from 'src/stores/monster-store'
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
import type { NumericBinding } from 'src/core/domain/formula'
import type { MonsterAction } from 'src/core/domain/types'

const ROW_LABELS: Readonly<Record<ComposerRow, string>> = {
  head: 'Head',
  trigger: 'Trigger',
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
    const { usageText, structuredRenderContext } = useProcessTokens()
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
      const current = action.value ?? (reaction.value as unknown as MonsterAction | undefined)
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
      if (reaction.value) return reactionChainView(reaction.value, context.value.usage || '', context.value)
      if (trait.value) return traitChainView(trait.value)
      if (lair.value) return lairChainView()
      return []
    })

    const specFor = (cellId: string): ComposerCellSpec =>
      ROLE_CHAINS[props.role].find((spec) => spec.id === cellId) as ComposerCellSpec

    const valueFor = (cellId: string): unknown => {
      if (pooled.value && cellId === 'usage') return String(props.cost)
      if (action.value) return cellValue(action.value, cellId)
      if (reaction.value) return cellId === 'usage' ? cellValue(reaction.value as unknown as Partial<import('src/core/domain/types').MonsterAction>,cellId) : reactionCellValue(reaction.value, cellId)
      if (trait.value) return traitCellValue(trait.value, cellId)
      return undefined
    }

    const validatorFor = (cellId: string) =>
      props.role === 'reaction' ? (value: unknown) => validateReactionCell(cellId, value)
        : props.role === 'trait' ? (value: unknown) => validateTraitCell(cellId, value) : undefined

    const numericPathFor = (cellId: string): string | undefined => {
      if (!activeEntry.value || lair.value) return undefined
      const collection = trait.value ? 'traits' : reaction.value ? 'reactions' : 'actions'
      const suffix = cellId === 'attack-bonus' ? 'attackBonus' : cellId === 'save-dc' ? 'save.overrideValue' : undefined
      return suffix ? `${collection}[id=${encodeURIComponent(activeEntry.value.id)}].${suffix}` : undefined
    }
    const numericDraftModel = (cellId: string): object => {
      const candidate = JSON.parse(JSON.stringify(monster.$state))
      if (cellId === 'save-dc') {
        const collection = trait.value ? 'traits' : reaction.value ? 'reactions' : 'actions'
        const entry = candidate[collection].find((item: { id: string }) => item.id === props.actionId)
        if (entry) entry.save = { overrideValue:0,...entry.save,override:true }
      }
      return candidate
    }
    const commit = (cellId: string, value: unknown, binding?: NumericBinding | null) => {
      const current = action.value
      if (current && pooled.value && cellId === 'usage') {
        emit('update:cost', Math.min(3, Math.max(1, Number(value) || 1)))
        return
      }
      if (current) {
        const target = current as unknown as Record<string, unknown>
        monster.$patch(state => {
          const path = numericPathFor(cellId)
          if (path) {
            const bindings = { ...state.bindings }
            if (binding) bindings[path] = binding
            else delete bindings[path]
            state.bindings = bindings
          }
          for (const [key, next] of Object.entries(cellPatch(current, cellId, value))) target[key] = next
        })
        if (current.crAnnotation) autoUpdateCr(current.description, current.crAnnotation, current)
        return
      }
      const path = numericPathFor(cellId)
      if(path) { const bindings={...monster.bindings}; if(binding)bindings[path]=binding;else delete bindings[path];monster.bindings=bindings }
      const currentReaction = reaction.value
      if (currentReaction) {
        const target = currentReaction as unknown as Record<string, unknown>
        for (const [key, next] of Object.entries(reactionCellPatch(currentReaction, cellId, value))) target[key] = next
      }
      if (trait.value) Object.assign(trait.value, traitCellPatch(trait.value, cellId, value))
    }

    return { activeEntry, reaction, pooled, chipRows, specFor, valueFor, validatorFor, commit, rowLabels: ROW_LABELS, numericPathFor, numericDraftModel }
  },
})
</script>

<style scoped src="./composer-chain.css"></style>
