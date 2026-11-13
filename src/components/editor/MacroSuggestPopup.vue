<template>
  <teleport to="body">
    <div v-if="open" :id="listId" class="macro-suggest-popup q-menu" :style="{ left: x + 'px', top: y + 'px' }" role="listbox" :aria-label="label" data-macro-suggest data-macro-suggest-rich>
      <div v-for="(entry, index) in entries" :id="`${listId}-opt-${index}`" :key="entry.insert" class="macro-suggest-popup__item" :class="{ 'is-active': index === active }" role="option" :aria-selected="index === active" @mousedown.prevent="$emit('pick', entry)">
        <div class="macro-suggest-label">{{ entry.label }}</div>
        <div class="macro-suggest-popup__caption"><code>{{ entry.insert }}</code> · {{ entry.group }}</div>
      </div>
    </div>
  </teleport>
</template>
<script lang="ts">
import type { PropType } from 'vue'
import { defineComponent } from 'vue'
import type { MacroEntry } from 'src/core/domain/macro-catalog'

export default defineComponent({
  name: 'MacroSuggestPopup',
  props: {
    open: { type: Boolean, default: false },
    listId: { type: String, default: 'macro-suggest' },
    entries: { type: Array as PropType<MacroEntry[]>, default: () => [] },
    active: { type: Number, default: 0 },
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    label: { type: String, default: 'Suggestions' },
  },
  emits: ['pick'],
})
</script>
<style>
.macro-suggest-popup { position: fixed; z-index: 9000; min-width: 240px; max-width: 360px; max-height: 280px; overflow-y: auto; padding: 4px 0; background: #1d1d1d; color: #eee; border-radius: 4px; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.45); }
.macro-suggest-popup__item { padding: 4px 12px; cursor: pointer; }
.macro-suggest-popup__item.is-active, .macro-suggest-popup__item:hover { background: rgba(255, 179, 0, 0.16); }
.macro-suggest-popup__caption { font-size: 0.72rem; opacity: 0.75; }
.macro-suggest-popup code { font-size: 0.72rem; }
</style>
