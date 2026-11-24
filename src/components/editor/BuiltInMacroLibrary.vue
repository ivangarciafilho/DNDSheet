<template>
  <!-- Build 274: every built-in reference, token, roll and snippet, browsable beside the user's own macros. -->
  <q-expansion-item dense expand-separator icon="menu_book" :label="`Built-in library (${filtered.length} of ${MACRO_CATALOG.length})`" caption="Read-only references, tokens, rolls and snippets. Click one to copy it." data-builtin-macro-library>
    <div class="q-pa-sm">
      <q-input v-model="search" v-help="'Filter the built-in library by name, code, group or description.'" dense outlined clearable debounce="120" placeholder="Search by name, code or description" class="q-mb-sm">
        <template #prepend><q-icon name="search" /></template>
      </q-input>
      <div class="row q-gutter-xs q-mb-sm">
        <q-chip
          v-for="kind in KINDS"
          :key="kind.id"
          dense
          clickable
          :icon="kind.icon"
          :color="activeKinds.has(kind.id) ? kind.color : 'grey-8'"
          text-color="white"
          :aria-pressed="activeKinds.has(kind.id)"
          @click="toggleKind(kind.id)"
        >
          {{ kind.label }}<q-tooltip>{{ kind.tip }}</q-tooltip>
        </q-chip>
      </div>
      <div class="builtin-library__scroll">
        <div v-for="group in groups" :key="group.group" class="q-mb-sm">
          <div class="text-caption text-weight-bold text-grey-4 q-mb-xs">{{ group.group }} · {{ group.entries.length }}</div>
          <q-item v-for="entry in group.entries" :key="entry.insert" dense clickable class="rounded-borders" @click="copyEntry(entry.insert)">
            <q-item-section avatar><q-icon :name="kindOf(entry.kind).icon" :color="kindOf(entry.kind).color" size="18px" /></q-item-section>
            <q-item-section>
              <q-item-label>{{ entry.label }}</q-item-label>
              <q-item-label caption class="text-grey-5"><code class="builtin-library__code">{{ entry.insert }}</code> · {{ entry.tip }}</q-item-label>
            </q-item-section>
          </q-item>
        </div>
        <div v-if="!groups.length" class="text-caption text-grey-5 text-center q-pa-md">Nothing matches that search.</div>
      </div>
    </div>
  </q-expansion-item>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useQuasar } from 'quasar'
import copy from 'copy-to-clipboard'
import { MACRO_CATALOG, catalogGroups, type MacroKind } from 'src/core/domain/macro-catalog'

const KINDS = [
  { id: 'reference', label: 'References', icon: 'link', color: 'blue-6', tip: 'Live numbers from the creature, such as PB or STR_MOD. Use inside braces or formulas.' },
  { id: 'token', label: 'Tokens', icon: 'data_object', color: 'teal-6', tip: 'Printed values such as the name, a save DC or an attack bonus.' },
  { id: 'roll', label: 'Rolls', icon: 'casino', color: 'red-6', tip: 'Dice and arithmetic that print as an average with the dice, such as 8 (1d8 + 3).' },
  { id: 'context', label: 'Context', icon: 'my_location', color: 'amber-8', tip: 'Values from the entry being written, such as its uses or recharge.' },
  { id: 'snippet', label: 'Snippets', icon: 'short_text', color: 'purple-5', tip: 'Whole phrases: attack leads, conditions, areas, outcomes and common traits.' },
] as const

const $q = useQuasar()
const search = ref('')
const activeKinds = ref(new Set<string>(KINDS.map(kind => kind.id)))
const kindOf = (kind: MacroKind) => KINDS.find(item => item.id === kind) ?? KINDS[0]
const toggleKind = (id: string) => {
  const next = new Set(activeKinds.value)
  if (next.has(id) && next.size > 1) next.delete(id)
  else next.add(id)
  activeKinds.value = next
}
const filtered = computed(() => {
  const query = (search.value ?? '').trim().toLowerCase()
  return MACRO_CATALOG.filter(entry => activeKinds.value.has(entry.kind) &&
    (!query || `${entry.label} ${entry.insert} ${entry.tip} ${entry.group}`.toLowerCase().includes(query)))
})
// Groups by scope first, then alphabetical inside each group.
const groups = computed(() => catalogGroups(filtered.value)
  .map(group => ({ group: group.group, entries: [...group.entries].sort((a, b) => a.label.localeCompare(b.label)) }))
  .sort((a, b) => a.group.localeCompare(b.group)))
const copyEntry = (insert: string) => {
  copy(insert)
  $q.notify({ type: 'positive', message: `Copied ${insert}`, timeout: 1200 })
}
</script>

<style scoped>
.builtin-library__scroll { max-height: 22rem; overflow-y: auto; }
.builtin-library__code { font-size: 0.75rem; }
</style>
