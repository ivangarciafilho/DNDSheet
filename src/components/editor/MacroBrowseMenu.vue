<template>
  <q-menu :model-value="modelValue" class="macro-browse-menu" max-height="360px" data-macro-menu @update:model-value="value => $emit('update:modelValue', value)" @show="query = ''">
    <div class="q-pa-xs" style="min-width: 280px; max-width: 360px">
      <q-input v-model="query" dense outlined autofocus clearable placeholder="Search formulas and macros" aria-label="Search formulas and macros" @keydown.stop />
      <q-list dense>
        <template v-for="group in groups" :key="group.group">
          <q-item-label header class="q-py-xs">{{ group.group }}</q-item-label>
          <q-item v-for="entry in group.entries" :key="entry.insert" clickable dense @click="$emit('pick', entry)">
            <q-item-section>
              <q-item-label>{{ entry.label }}</q-item-label>
              <q-item-label caption><code>{{ entry.insert }}</code><span v-if="previewOf(entry)"> → {{ previewOf(entry) }}</span></q-item-label>
            </q-item-section>
            <q-tooltip class="dnd-tip" max-width="280px">{{ entry.tip }}</q-tooltip>
          </q-item>
        </template>
        <q-item v-if="groups.length === 0"><q-item-section class="text-caption">Nothing matches.</q-item-section></q-item>
      </q-list>
    </div>
  </q-menu>
</template>
<script lang="ts">
import type { PropType } from 'vue'
import { computed, defineComponent, ref } from 'vue'
import { catalogFor, catalogGroups } from 'src/core/domain/macro-catalog'
import type { MacroEntry, MacroScope } from 'src/core/domain/macro-catalog'
import { mechanicPlainText } from 'src/core/domain/mechanic-rich-text'
import { useMonsterStore } from 'src/stores/monster-store'
import { useProcessTokens } from '../rendering/useProcessTokens'

// One browse menu for every text editor; the entries come from the shared macro catalog.
export default defineComponent({
  name: 'MacroBrowseMenu',
  props: {
    modelValue: { type: Boolean, default: false },
    scope: { type: String as PropType<MacroScope>, default: 'mechanic' },
  },
  emits: ['update:modelValue', 'pick'],
  setup(props) {
    const query = ref('')
    const monster = useMonsterStore()
    const { processTokens } = useProcessTokens()
    const groups = computed(() => catalogGroups(catalogFor({
      scope: props.scope,
      query: query.value ?? '',
      customVariables: (monster as unknown as { customVariables?: Record<string, unknown> }).customVariables,
      customMacros: (monster as unknown as { customMacros?: Record<string, unknown> }).customMacros,
    })))
    // Live value for single tokens, so authors see what they insert.
    const previewOf = (entry: MacroEntry): string => {
      if (entry.kind === 'context' || entry.kind === 'snippet') return ''
      try {
        const text = mechanicPlainText(String(processTokens(entry.insert, undefined as never, monster, 'none') ?? ''))
        return text && text !== entry.insert ? text : ''
      } catch { return '' }
    }
    return { query, groups, previewOf }
  },
})
</script>
<style>
.macro-browse-menu code { font-size: 0.72rem; }
</style>
