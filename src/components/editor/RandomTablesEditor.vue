<template>
  <q-expansion-item expand-separator icon="casino" label="Random tables">
    <q-card>
      <q-card-section>
        <div class="q-mb-sm">Roll tables for wild effects, loot or lair events. Each row covers a range of the roll.</div>
        <div v-for="table in tables" :key="table.id" class="q-mb-md q-pa-sm rounded-borders" style="border:1px solid rgba(127,127,127,.35)">
          <div class="row q-col-gutter-sm items-center">
            <q-input v-help="'Name shown above the table on the statblock.'" v-model="table.title" dense outlined label="Table name" class="col-6" />
            <q-input v-help="'Dice rolled for this table, e.g. 1d8 or 2d6+1.'" v-model="table.dice" dense outlined label="Dice" class="col-3" />
            <q-btn v-help="'Delete this table.'" flat dense icon="delete" class="col-auto" @click="removeTable(table.id)" />
          </div>
          <div v-for="row in table.rows" :key="row.id" class="row q-col-gutter-sm items-center q-mt-xs">
            <q-input v-help="'Lowest roll for this row.'" v-model.number="row.min" type="number" dense outlined label="From" class="col-2" />
            <q-input v-help="'Highest roll for this row.'" v-model.number="row.max" type="number" dense outlined label="To" class="col-2" />
            <q-input v-help="'What happens on this result.'" v-model="row.text" dense outlined label="Result" class="col" />
            <q-btn v-help="'Delete this row.'" flat dense icon="close" @click="table.rows = table.rows.filter((r) => r.id !== row.id)" />
          </div>
          <div class="row q-col-gutter-sm items-center q-mt-xs">
            <q-btn v-help="'Add a row after the last range.'" flat dense icon="add" label="Row" @click="addRow(table)" />
            <q-input v-help="'Optional result for any roll no row covers.'" v-model="table.fallback" dense outlined label="Otherwise (optional)" class="col" />
          </div>
          <div v-for="(d, i) in diagnoseTable(table)" :key="i" class="text-negative text-caption q-mt-xs">⚠ {{ d.message }}</div>
          <div class="text-caption q-mt-xs">{{ tableToProse(table) }}</div>
        </div>
        <q-btn v-help="'Add a new random table.'" outline icon="add" label="Add table" @click="addTable" />
      </q-card-section>
    </q-card>
  </q-expansion-item>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useMonsterStore } from 'src/stores/monster-store'
import { diagnoseTable, diceRange, tableToProse, type RandomTable } from 'src/core/domain/random-table'

type EditableTable = RandomTable & { title?: string }
const monster = useMonsterStore()
const tables = computed<EditableTable[]>(() => {
  const m = monster as unknown as { randomTables?: EditableTable[] }
  if (!m.randomTables) m.randomTables = []
  return m.randomTables
})
const uid = (p: string) => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
function addTable() {
  const id = uid('rt')
  tables.value.push({ id, title: 'Random table', dice: '1d6', rows: [{ id: `${id}-r1`, min: 1, max: 6, text: '' }] })
}
function removeTable(id: string) {
  const list = tables.value
  const i = list.findIndex((t) => t.id === id)
  if (i >= 0) list.splice(i, 1)
}
function addRow(table: EditableTable) {
  const last = Math.max(0, ...table.rows.map((r) => r.max))
  const top = diceRange(table.dice)?.max ?? last + 1
  const min = Math.min(last + 1, top)
  table.rows.push({ id: uid(table.id), min, max: min, text: '' })
}
</script>
