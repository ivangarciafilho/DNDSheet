<template>
  <q-expansion-item dense expand-separator :label="label" :data-basic-riders="scope">
    <div class="q-pa-sm q-gutter-y-sm">
      <q-toggle v-if="hpGroup" v-help="'Display these Hit Points riders on their own indented subrow.'" :model-value="monster.hpRiderSubrows?.[hpGroup] ?? legacySplit"
        dense label="Show on separate lines" @update:model-value="monster.hpRiderSubrows = { ...monster.hpRiderSubrows, [hpGroup]: $event }" />
      <div v-for="(rider, index) in rows" :key="rider.id" class="row q-col-gutter-sm items-center">
        <catalog-select :model-value="rider.cadence ?? ''" v-help="'How often this rider triggers or refreshes.'" :entries="BASIC_RIDER_CADENCES" preserve-order clearable :searchable="false" label="Cadence" class="col-12 col-sm-4" @update:model-value="value => (rider.cadence = value ? String(value) : '')" />
        <catalog-select :model-value="rider.timing ?? ''" v-help="'Trigger window or action cost when the rider happens.'" :entries="timingEntries" preserve-order allow-custom clearable label="Timing" class="col-12 col-sm-4" @update:model-value="value => (rider.timing = value ? String(value) : '')" />
        <q-btn v-help="'Remove this rider row.'" flat dense icon="delete_outline" color="negative" aria-label="Remove rider" @click="rows.splice(index, 1)" />
        <mechanic-text-editor v-model="rider.effect" v-help="'Rule text rendered for this rider in the statblock.'" autogrow dense outlined label="Effect" class="col-12" />
      </div>
      <q-btn v-help="'Add another conditional rider row to this section.'" flat dense no-caps icon="add" label="Add rider" @click="addRider" />
    </div>
  </q-expansion-item>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { v4 as uuid } from 'uuid'
import CatalogSelect from 'src/components/kit/CatalogSelect.vue'
import { useMonsterStore } from 'src/stores/monster-store'
import { BASIC_RIDER_CADENCES, BASIC_RIDER_TIMINGS, type BasicRiderScope } from 'src/core/domain/basic-riders'

const props = defineProps<{ scope: BasicRiderScope; label: string }>()
const monster = useMonsterStore()
const timingEntries = BASIC_RIDER_TIMINGS.map((timing) => ({ value: timing, label: timing }))
const hpGroup = computed(() => props.scope === 'hp' || props.scope === 'deathThroes' || props.scope === 'onDamage' ? props.scope : null)
const legacySplit = computed(() => (monster.$state as { splitHpRiderRows?: boolean }).splitHpRiderRows)
const rows = computed(() => monster.basicRiders?.[props.scope] ?? [])

function addRider() {
  monster.basicRiders ??= {}
  const scopeRows = monster.basicRiders[props.scope] ??= []
  const timing = props.scope === 'deathThroes' ? 'When it drops to 0 hit points'
    : props.scope === 'onDamage' ? 'When it takes damage' : ''
  scopeRows.push({ id: uuid(), cadence: '', timing, effect: '' })
}
</script>
