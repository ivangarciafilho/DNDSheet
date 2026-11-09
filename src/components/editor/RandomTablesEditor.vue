<template>
  <q-expansion-item expand-separator icon="casino" :label="$t('editor.randomTables.label')">
    <q-card>
      <q-card-section>
        <div class="q-mb-sm">{{ $t('editor.randomTables.help') }}</div>
        <div v-for="table in tables" :key="table.id" class="random-table-editor q-mb-md q-pa-sm rounded-borders">
          <div class="row q-col-gutter-sm items-center">
            <q-input v-model="table.title" v-help="$t('editor.randomTables.titleHelp')" dense outlined :label="$t('editor.randomTables.title')" class="col-12 col-sm-6" />
            <q-input v-model="table.dice" v-help="$t('editor.randomTables.diceHelp')" dense outlined :label="$t('editor.randomTables.dice')" class="col" />
            <div class="col-auto">
              <q-btn v-help="$t('editor.randomTables.deleteHelp')" flat dense round icon="delete" :aria-label="$t('editor.randomTables.delete')" @click="monster.deleteRandomTable(table.id)" />
            </div>
          </div>
          <div v-for="row in table.rows" :key="row.id" class="row q-col-gutter-sm items-center q-mt-xs">
            <q-input v-help="$t('editor.randomTables.fromHelp')" :model-value="row.min" type="number" dense outlined :label="$t('editor.randomTables.from')" class="col-3 col-sm-2" @update:model-value="(v) => (row.min = toInt(v, row.min))" />
            <q-input v-help="$t('editor.randomTables.toHelp')" :model-value="row.max" type="number" dense outlined :label="$t('editor.randomTables.to')" class="col-3 col-sm-2" @update:model-value="(v) => (row.max = toInt(v, row.max))" />
            <q-input v-model="row.text" v-help="$t('editor.randomTables.resultHelp')" dense outlined :label="$t('editor.randomTables.result')" class="col" />
            <div class="col-auto">
              <q-btn v-help="$t('editor.randomTables.deleteRowHelp')" flat dense round icon="close" :aria-label="$t('editor.randomTables.deleteRow')" @click="monster.deleteRandomTableRow(table.id, row.id)" />
            </div>
          </div>
          <div class="row q-col-gutter-sm items-center q-mt-xs">
            <div class="col-auto">
              <q-btn v-help="$t('editor.randomTables.addRowHelp')" flat dense icon="add" :label="$t('editor.randomTables.addRow')" @click="monster.addRandomTableRow(table.id)" />
            </div>
            <div class="col-auto">
              <q-btn v-help="$t('editor.randomTables.pasteHelp')" flat dense icon="content_paste" :label="$t('editor.randomTables.paste')" @click="beginImport(table.id)" />
            </div>
            <q-input v-help="$t('editor.randomTables.fallbackHelp')" :model-value="table.fallback ?? ''" dense outlined :label="$t('editor.randomTables.fallback')" class="col" @update:model-value="(v) => setFallback(table, v)" />
          </div>
          <div v-for="(d, i) in diagnoseTable(table)" :key="i" class="text-negative text-caption q-mt-xs" role="status">⚠ {{ d.message }}</div>
          <div class="text-caption q-mt-xs text-grey-7">{{ tableToProse(table) }}</div>
        </div>
        <q-btn v-help="$t('editor.randomTables.addHelp')" outline icon="add" :label="$t('editor.randomTables.add')" @click="monster.addRandomTable()" />
      </q-card-section>
    </q-card>
    <q-dialog v-model="importOpen" @hide="importId = null">
      <q-card class="table-import-dialog">
        <q-card-section>
          <h2 class="text-h6 q-my-none">{{ $t('editor.randomTables.paste') }}</h2>
          <p>{{ $t('editor.randomTables.pasteHelp') }}</p>
          <q-input v-model="importText" type="textarea" outlined autofocus :label="$t('editor.randomTables.pasteInput')" />
          <div v-if="preview && importText.trim()" aria-live="polite">
            <p v-if="preview.invalidLines.length" class="text-negative">{{ $t('editor.randomTables.invalidLines', { lines: preview.invalidLines.join(', ') }) }}</p>
            <p v-for="(diagnostic, i) in preview.diagnostics" :key="i" class="text-negative">{{ diagnostic.message }}</p>
            <q-markup-table dense flat>
              <thead><tr><th scope="col">{{ $t('editor.randomTables.from') }}</th><th scope="col">{{ $t('editor.randomTables.to') }}</th><th scope="col">{{ $t('editor.randomTables.result') }}</th></tr></thead>
              <tbody><tr v-for="row in preview.table.rows" :key="row.id"><td>{{ row.min }}</td><td>{{ row.max }}</td><td>{{ row.text }}</td></tr></tbody>
            </q-markup-table>
          </div>
          <p v-if="!importTable" role="alert">{{ $t('editor.randomTables.tableMissing') }}</p>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat :label="$t('editor.randomTables.cancelImport')" v-close-popup />
          <q-btn color="primary" :label="$t('editor.randomTables.applyImport')" :disable="!preview?.canApply" @click="applyImport" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-expansion-item>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useHistoryStore } from 'src/stores/history-store'
import { useMonsterStore } from 'src/stores/monster-store'
import { previewRandomTableImport, diagnoseTable, tableToProse, type RandomTable } from 'src/core/domain/random-table'

const monster = useMonsterStore()
const history = useHistoryStore()
const importOpen = ref(false)
const importId = ref<string | null>(null)
const importText = ref('')
const importTable = computed(() => tables.value.find(table => table.id === importId.value))
const preview = computed(() => importTable.value ? previewRandomTableImport(importTable.value, importText.value, tables.value.flatMap(table => [table.id, ...table.rows.map(row => row.id)])) : null)
const beginImport = (id: string) => { importId.value = id; importText.value = ''; importOpen.value = true }
const applyImport = () => {
  if (!preview.value?.canApply || !importId.value) return
  history.pushSnapshot('Before table row import')
  if (monster.replaceRandomTableRows(importId.value, importText.value)) importOpen.value = false
}
// Read-only view; every structural change goes through store actions so undo and persistence see it.
const tables = computed<RandomTable[]>(() => monster.randomTables ?? [])

// A cleared number field keeps the previous value instead of storing '' or NaN.
const toInt = (value: string | number | null, previous: number) => {
  const n = typeof value === 'number' ? value : Number(value)
  return value === '' || value === null || !Number.isFinite(n) ? previous : Math.trunc(n)
}
const setFallback = (table: RandomTable, value: string | number | null) => {
  const text = String(value ?? '').trim()
  if (text) table.fallback = String(value)
  else delete table.fallback
}
</script>

<style scoped>
.table-import-dialog { width: 640px; max-width: calc(100vw - 32px); }
.random-table-editor { border: 1px solid rgba(127, 127, 127, 0.35); }
</style>
